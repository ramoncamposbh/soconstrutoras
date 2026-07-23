import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
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

  // --- ROTAS ADMIN ---

  // GET /api/v1/construtoras/admin/lista
  @Get('admin/lista')
  listarAdmin(@Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.listarAdmin();
  }

  // GET /api/v1/construtoras/admin/usuarios
  @Get('admin/usuarios')
  listarUsuarios(@Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.listarUsuarios();
  }

  // POST /api/v1/construtoras/admin/:id/reset-senha
  @Post('admin/:id/reset-senha')
  resetSenha(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.resetSenha(id);
  }

  // PATCH /api/v1/construtoras/admin/:id/toggle-ativo
  @Patch('admin/:id/toggle-ativo')
  toggleAtivo(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.toggleAtivo(id);
  }
}
