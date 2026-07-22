import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SimuladorService } from './simulador.service';
import { SimularDto } from './dto/simular.dto';

@Controller('simulador')
export class SimuladorController {
  constructor(private readonly simuladorService: SimuladorService) {}

  @Post('calcular')
  @HttpCode(HttpStatus.OK)
  calcular(@Body() dto: SimularDto) {
    return this.simuladorService.calcular(dto);
  }
}
