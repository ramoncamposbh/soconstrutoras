import { Module } from '@nestjs/common';
import { ConstutorasController } from './construtoras.controller';
import { ConstutorasService } from './construtoras.service';

@Module({
  controllers: [ConstutorasController],
  providers: [ConstutorasService],
  exports: [ConstutorasService],
})
export class ConstutorasModule {}
