import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ConstutorasService } from './construtoras.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('construtoras')
export class ConstutorasController {
  constructor(private readonly service: ConstutorasService) {}

  // GET /api/v1/construtoras/perfil
  @Get('perfil')
  perfil(@Request() req: any) {
    return this.service.perfil(req.user.sub);
  }

  // GET /api/v1/construtoras/dashboard
  @Get('dashboard')
  dashboard(@Request() req: any) {
    return this.service.dashboard(req.user.sub);
  }

  // PATCH /api/v1/construtoras/perfil
  @Patch('perfil')
  atualizar(@Request() req: any, @Body() body: any) {
    return this.service.atualizar(req.user.sub, body);
  }
}
