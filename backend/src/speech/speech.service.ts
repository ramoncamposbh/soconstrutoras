import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as https from 'https';
import * as fs from 'fs';

@Injectable()
export class SpeechService {

  private callWhisper(apiKey: string, buffer: Buffer, mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const boundary = 'WhisperBoundary' + Date.now().toString();
      const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm';

      const head1 = Buffer.from(
        `--${boundary}
Content-Disposition: form-data; name="model"

whisper-1
`
      );
      const head2 = Buffer.from(
        `--${boundary}
Content-Disposition: form-data; name="language"

pt
`
      );
      const head3 = Buffer.from(
        `--${boundary}
Content-Disposition: form-data; name="file"; filename="audio.${ext}"
Content-Type: ${mimeType}

`
      );
      const tail = Buffer.from(`
--${boundary}--
`);
      const body = Buffer.concat([head1, head2, head3, buffer, tail]);

      console.log(`[Speech] callWhisper ext=${ext} mime=${mimeType} bufferBytes=${buffer.length} bodyBytes=${body.length}`);

      const req = https.request(
        {
          hostname: 'api.openai.com',
          path: '/v1/audio/transcriptions',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            console.log(`[Speech] Whisper status=${res.statusCode} body=${raw.substring(0, 300)}`);
            if (res.statusCode !== 200) {
              return reject(new Error(`Whisper ${res.statusCode}: ${raw}`));
            }
            try {
              const data = JSON.parse(raw) as { text?: string };
              resolve(data.text ?? '');
            } catch {
              reject(new Error('Resposta invalida do Whisper'));
            }
          });
        },
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  async transcribe(file: any): Promise<{ text: string }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new HttpException('OPENAI_API_KEY nao configurada', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Suporte a memoryStorage (buffer) e diskStorage (path)
    let buffer: Buffer;
    if (file.buffer && file.buffer.length > 0) {
      buffer = file.buffer as Buffer;
    } else if (file.path) {
      console.log(`[Speech] Lendo arquivo do disco: ${file.path}`);
      buffer = fs.readFileSync(file.path as string);
      try { fs.unlinkSync(file.path as string); } catch { /* ok */ }
    } else {
      throw new HttpException('Buffer de audio vazio', HttpStatus.BAD_REQUEST);
    }

    try {
      const text = await this.callWhisper(
        apiKey,
        buffer,
        (file.mimetype as string) || 'audio/mp4',
      );
      return { text };
    } catch (err: any) {
      console.error('[Speech] Erro:', err?.message);
      throw new HttpException('Erro ao transcrever audio', HttpStatus.BAD_GATEWAY);
    }
  }
}
