import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { SimuladorService } from './simulador.service';
import { SimularDto } from './dto/simular.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('simulador')
export class SimuladorController {
  constructor(private readonly simuladorService: SimuladorService) {}

  @Post('calcular')
  @HttpCode(HttpStatus.OK)
  calcular(@Body() dto: SimularDto) {
    return this.simuladorService.calcular(dto);
  }

  @Get('admin/lista')
  @UseGuards(JwtAuthGuard)
  async lista(@Req() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.simuladorService.listar();
  }
}
