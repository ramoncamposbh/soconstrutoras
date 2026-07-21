import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SpeechController } from './speech.controller';
import { SpeechService } from './speech.service';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [SpeechController],
  providers:   [SpeechService],
})
export class SpeechModule {}
