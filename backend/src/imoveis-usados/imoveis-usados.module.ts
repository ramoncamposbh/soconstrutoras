import { Module } from '@nestjs/common';
import { ImoveisUsadosController } from './imoveis-usados.controller';
import { ImoveisUsadosService } from './imoveis-usados.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ImoveisUsadosController],
  providers: [ImoveisUsadosService],
})
export class ImoveisUsadosModule {}
