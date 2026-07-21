import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class SpeechService {

  private callWhisper(apiKey: string, buffer: Buffer, mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const boundary = 'WhisperBoundary' + Date.now().toString();
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

      const head1 = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`
      );
      const head2 = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\npt\r\n`
      );
      const head3 = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      );
      const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([head1, head2, head3, buffer, tail]);

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
    try {
      const text = await this.callWhisper(
        apiKey,
        file.buffer as Buffer,
        (file.mimetype as string) || 'audio/webm',
      );
      return { text };
    } catch (err: any) {
      console.error('[Speech]', err?.message);
      throw new HttpException('Erro ao transcrever audio', HttpStatus.BAD_GATEWAY);
    }
  }
}
