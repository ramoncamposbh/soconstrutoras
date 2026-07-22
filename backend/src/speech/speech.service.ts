import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class SpeechService {
  async transcribe(file: any): Promise<{ text: string }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new HttpException('OPENAI_API_KEY nao configurada', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Node 20 tem FormData, Blob e fetch nativos
    const formData = new FormData();
    const blob = new Blob([file.buffer as Buffer], { type: (file.mimetype as string) || 'audio/webm' });
    const ext  = ((file.mimetype as string) || '').includes('mp4') ? 'mp4' : 'webm';
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Speech] Whisper error:', response.status, err);
      throw new HttpException(`Erro Whisper: ${response.status}`, HttpStatus.BAD_GATEWAY);
    }

    const data = await response.json() as Record<string, string>;
    return { text: data['text'] ?? '' };
  }
}
