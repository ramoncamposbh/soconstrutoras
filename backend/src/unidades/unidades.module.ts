import { Module } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { UnidadesController, UnidadesPublicController } from './unidades.controller';

@Module({
  providers:   [UnidadesService],
  controllers: [UnidadesController, UnidadesPublicController],
  exports:     [UnidadesService],
})
export class UnidadesModule {}
