import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { EmpreendimentosService } from './empreendimentos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { CriarEmpreendimentoDto } from './dto/criar-empreendimento.dto';
import { BuscarEmpreendimentosDto } from './dto/buscar-empreendimentos.dto';

@Controller('empreendimentos')
export class EmpreendimentosController {
  constructor(private readonly service: EmpreendimentosService) {}

  // --- ROTAS PÚBLICAS ---

  // GET /api/v1/empreendimentos?cidade=BH&tipo=apartamento
  @Get()
  buscarPublico(@Query() filtros: BuscarEmpreendimentosDto) {
    return this.service.buscarPublico(filtros);
  }

  // GET /api/v1/empreendimentos/:slug
  @Get(':slug')
  buscarPorSlug(@Param('slug') slug: string) {
    return this.service.buscarPorSlug(slug);
  }

  // --- ROTAS AUTENTICADAS (construtora) ---

  // GET /api/v1/empreendimentos/meus
  @UseGuards(JwtAuthGuard)
  @Get('meus/listar')
  listar(@Request() req: any) {
    return this.service.listar(req.user.sub);
  }

  // POST /api/v1/empreendimentos
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Post()
  criar(@Request() req: any, @Body() dto: CriarEmpreendimentoDto) {
    return this.service.criar(req.user.sub, dto);
  }

  // PATCH /api/v1/empreendimentos/:id
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Patch(':id')
  atualizar(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CriarEmpreendimentoDto>) {
    return this.service.atualizar(id, req.user.sub, dto);
  }

  // PATCH /api/v1/empreendimentos/:id/publicar
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Patch(':id/publicar')
  publicar(@Param('id') id: string, @Request() req: any) {
    return this.service.publicar(id, req.user.sub);
  }

  // --- ROTAS ADMIN ---

  // GET /api/v1/empreendimentos/admin/todas
  @UseGuards(JwtAuthGuard)
  @Get('admin/todas')
  listarTodas(@Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.listarTodas();
  }

  // PATCH /api/v1/empreendimentos/admin/:id/toggle
  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/toggle')
  togglePublicado(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.togglePublicado(id);
  }

  // DELETE /api/v1/empreendimentos/admin/:id
  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  deletarAdmin(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.deletarAdmin(id);
  }
}
