import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Request, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { CriarUnidadeDto } from './dto/criar-unidade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly service: UnidadesService) {}

  // ── CRUD Unidades ──────────────────────────────────────────────

  @Get('empreendimentos/:empreendimentoId')
  listar(@Param('empreendimentoId') empId: string, @Request() req: any) {
    return this.service.listar(empId, req.user.sub);
  }

  // GET /api/v1/unidades/admin/empreendimento/:empreendimentoId
  @Get('admin/empreendimento/:empreendimentoId')
  listarAdmin(@Param('empreendimentoId') empId: string, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Acesso negado.');
    return this.service.listarAdmin(empId);
  }

  // PATCH /api/v1/unidades/admin/:id/toggle
  @Patch('admin/:id/toggle')
  toggleAdmin(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Acesso negado.');
    return this.service.toggleDisponivelAdmin(id);
  }

  // PATCH /api/v1/unidades/admin/:id/editar
  @Patch('admin/:id/editar')
  editarAdmin(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Acesso negado.');
    return this.service.editarAdmin(id, dto);
  }

  // DELETE /api/v1/unidades/admin/:id
  @Delete('admin/:id')
  deletarAdmin(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Acesso negado.');
    return this.service.deletarAdmin(id);
  }

  @Post('empreendimentos/:empreendimentoId')
  criar(
    @Param('empreendimentoId') empId: string,
    @Request() req: any,
    @Body() dto: CriarUnidadeDto,
  ) {
    return this.service.criar(empId, req.user.sub, dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CriarUnidadeDto>) {
    return this.service.atualizar(id, req.user.sub, dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string, @Request() req: any) {
    return this.service.remover(id, req.user.sub);
  }

  // ── Mídias via R2 ─────────────────────────────────────────────

  /** Passo 1: gera URL pré-assinada para upload direto ao R2 */
  @Post(':id/midias/url-upload')
  gerarUrlUpload(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { contentType: string },
  ) {
    return this.service.gerarUrlUploadMidia(id, req.user.sub, body.contentType);
  }

  /** Passo 2: confirma o upload e registra a URL no banco */
  @Post(':id/midias/confirmar')
  confirmarMidia(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { url: string; tipo?: string; legenda?: string },
  ) {
    return this.service.adicionarMidia(id, req.user.sub, body);
  }

  /** Remove foto da unidade (banco + R2) */
  @Delete(':id/midias/:midiaId')
  removerMidia(
    @Param('id') id: string,
    @Param('midiaId') midiaId: string,
    @Request() req: any,
  ) {
    return this.service.removerMidia(id, midiaId, req.user.sub);
  }
}

// ── Rota pública (sem guard) ──────────────────────────────────────
import { Controller as Ctrl, Get as GetP, Param as Par } from '@nestjs/common';

@Ctrl('public/unidades')
export class UnidadesPublicController {
  constructor(private readonly service: UnidadesService) {}

  @GetP('empreendimentos/:empreendimentoId')
  listarPublico(@Par('empreendimentoId') empId: string) {
    return this.service.listarPublico(empId);
  }
}
