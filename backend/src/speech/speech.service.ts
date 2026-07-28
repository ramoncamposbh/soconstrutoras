import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as https from 'https';
import * as fs from 'fs';

@Injectable()
export class SpeechService {

  private callGroq(apiKey: string, buffer: Buffer, mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const boundary = 'GroqBoundary' + Date.now().toString();

      // Detecta extensão/mime correta
      let ext = 'webm';
      let finalMime = mimeType;
      if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('mpeg')) {
        ext = 'm4a';
        finalMime = 'audio/mp4';
      } else if (mimeType.includes('ogg')) {
        ext = 'ogg';
        finalMime = 'audio/ogg';
      } else if (mimeType.includes('wav')) {
        ext = 'wav';
        finalMime = 'audio/wav';
      } else {
        ext = 'webm';
        finalMime = 'audio/webm';
      }

      const head1 = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3-turbo\r\n`
      );
      const head2 = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\npt\r\n`
      );
      const head3 = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`
      );
      const head4 = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.${ext}"\r\nContent-Type: ${finalMime}\r\n\r\n`
      );
      const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([head1, head2, head3, head4, buffer, tail]);

      console.log(`[Groq] ext=${ext} mime=${finalMime} bufferBytes=${buffer.length} bodyBytes=${body.length}`);

      const req = https.request(
        {
          hostname: 'api.groq.com',
          path: '/openai/v1/audio/transcriptions',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
          },
          timeout: 30000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            console.log(`[Groq] status=${res.statusCode} body=${raw.substring(0, 500)}`);
            if (res.statusCode !== 200) {
              // Extrai mensagem de erro da resposta Groq
              let detail = raw;
              try {
                const parsed = JSON.parse(raw);
                detail = parsed?.error?.message ?? raw;
              } catch { /* usa raw */ }
              return reject(new Error(`Groq ${res.statusCode}: ${detail}`));
            }
            try {
              const data = JSON.parse(raw) as { text?: string };
              resolve(data.text ?? '');
            } catch {
              reject(new Error('Resposta inválida do Groq'));
            }
          });
        },
      );

      req.on('error', (e) => {
        console.error('[Groq] network error:', e.message);
        reject(new Error(`Erro de rede: ${e.message}`));
      });
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout: Groq não respondeu em 30s'));
      });

      req.write(body);
      req.end();
    });
  }

  async transcribe(file: any): Promise<{ text: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[Speech] GROQ_API_KEY não configurada nas variáveis de ambiente');
      throw new HttpException(
        'Serviço de transcrição não configurado (GROQ_API_KEY ausente)',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    let buffer: Buffer;
    if (file.buffer && file.buffer.length > 0) {
      buffer = file.buffer as Buffer;
    } else if (file.path) {
      console.log(`[Speech] Lendo arquivo do disco: ${file.path}`);
      buffer = fs.readFileSync(file.path as string);
      try { fs.unlinkSync(file.path as string); } catch { /* ok */ }
    } else {
      throw new HttpException('Buffer de áudio vazio', HttpStatus.BAD_REQUEST);
    }

    console.log(`[Speech] Arquivo recebido: mime=${file.mimetype} size=${buffer.length}B`);

    if (buffer.length < 1000) {
      throw new HttpException(
        'Áudio muito curto. Segure o botão e fale por pelo menos 2 segundos.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const text = await this.callGroq(
        apiKey,
        buffer,
        (file.mimetype as string) || 'audio/mp4',
      );
      return { text };
    } catch (err: any) {
      const msg: string = err?.message ?? 'Erro desconhecido';
      console.error('[Groq] Falha:', msg);

      // Mensagens amigáveis por tipo de erro
      if (msg.includes('401') || msg.includes('403') || msg.includes('invalid_api_key')) {
        throw new HttpException('Chave de API inválida ou expirada', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      if (msg.includes('429') || msg.includes('rate_limit')) {
        throw new HttpException('Limite de transcrições atingido. Tente novamente em alguns instantes.', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (msg.includes('Timeout')) {
        throw new HttpException('Serviço de transcrição lento. Tente novamente.', HttpStatus.GATEWAY_TIMEOUT);
      }

      throw new HttpException(`Erro ao transcrever: ${msg}`, HttpStatus.BAD_GATEWAY);
    }
  }
}
