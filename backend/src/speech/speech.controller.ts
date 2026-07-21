import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpeechService } from './speech.service';

@Controller('speech')
export class SpeechController {
  private readonly logger = new Logger(SpeechController.name);

  constructor(private readonly speechService: SpeechService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: any) {
    if (file) {
      this.logger.log(`[Speech] arquivo recebido: ${file.originalname} mime=${file.mimetype} size=${file.size} bufLen=${file.buffer?.length ?? 'N/A'}`);
    } else {
      this.logger.warn('[Speech] nenhum arquivo recebido');
    }
    if (!file) throw new HttpException('Arquivo de audio nao recebido', HttpStatus.BAD_REQUEST);
    return this.speechService.transcribe(file);
  }
}
