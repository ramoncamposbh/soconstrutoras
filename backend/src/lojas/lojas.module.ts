import { Module } from '@nestjs/common';
import { LojasController } from './lojas.controller';
import { LojasService } from './lojas.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [LojasController],
  providers: [LojasService],
})
export class LojasModule {}
