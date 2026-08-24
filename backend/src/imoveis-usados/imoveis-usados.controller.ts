import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ImoveisUsadosService } from './imoveis-usados.service';
import { CriarImovelUsadoDto, AtualizarImovelUsadoDto, ConfigImovelUsadoAdminDto } from './dto/imovel-usado.dto';
import { ForbiddenException } from '@nestjs/common';

@Controller('imoveis-usados')
export class ImoveisUsadosController {
  constructor(private readonly svc: ImoveisUsadosService) {}

  // ── Pública ───────────────────────────────────────────────────────────────

  @Get()
  listarPublico(
    @Query('tipo') tipo?: string,
    @Query('bairro') bairro?: string,
    @Query('cidade') cidade?: string,
    @Query('quartos') quartos?: string,
    @Query('preco_max') preco_max?: string,
  ) {
    return this.svc.listarPublico({
      tipo, bairro, cidade,
      quartos: quartos ? Number(quartos) : undefined,
      preco_max: preco_max ? Number(preco_max) : undefined,
    });
  }

  @Get('publico/:id')
  obterPublico(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.obter(id);
  }

  // ── Construtora autenticada ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('meus')
  listarMeus(@Request() req: any) {
    return this.svc.listarMeus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  criar(@Request() req: any, @Body() dto: CriarImovelUsadoDto) {
    return this.svc.criar(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  atualizar(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarImovelUsadoDto,
  ) {
    return this.svc.atualizar(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/publicar')
  publicar(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.publicar(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/despublicar')
  despublicar(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.despublicar(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deletar(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deletar(req.user.id, id);
  }

  // ── Upload de fotos ───────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/fotos')
  @UseInterceptors(FileInterceptor('file'))
  uploadFoto(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    return this.svc.uploadFoto(req.user.id, id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('fotos/:midiaId')
  deletarFoto(
    @Request() req: any,
    @Param('midiaId', ParseUUIDPipe) midiaId: string,
  ) {
    return this.svc.deletarFoto(req.user.id, midiaId);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('admin/todos')
  listarTodos(@Request() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.svc.listarTodosAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/config/:construtoraId')
  getConfig(@Request() req: any, @Param('construtoraId', ParseUUIDPipe) id: string) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.svc.getConfigAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/config/:construtoraId')
  setConfig(
    @Request() req: any,
    @Param('construtoraId', ParseUUIDPipe) id: string,
    @Body() dto: ConfigImovelUsadoAdminDto,
  ) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.svc.setConfigAdmin(id, dto);
  }
}
