import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Request, UseGuards,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UnidadesService } from './unidades.service';
import { CriarUnidadeDto } from './dto/criar-unidade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

@UseGuards(JwtAuthGuard)
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly service: UnidadesService) {}

  // ── CRUD Unidades ──────────────────────────────────────────────

  /** Lista unidades do empreendimento (dashboard da construtora) */
  @Get('empreendimentos/:empreendimentoId')
  listar(@Param('empreendimentoId') empId: string, @Request() req: any) {
    return this.service.listar(empId, req.user.sub);
  }

  /** Cria nova unidade */
  @Post('empreendimentos/:empreendimentoId')
  criar(
    @Param('empreendimentoId') empId: string,
    @Request() req: any,
    @Body() dto: CriarUnidadeDto,
  ) {
    return this.service.criar(empId, req.user.sub, dto);
  }

  /** Atualiza unidade */
  @Patch(':id')
  atualizar(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CriarUnidadeDto>) {
    return this.service.atualizar(id, req.user.sub, dto);
  }

  /** Remove unidade */
  @Delete(':id')
  remover(@Param('id') id: string, @Request() req: any) {
    return this.service.remover(id, req.user.sub);
  }

  // ── Mídias das Unidades ────────────────────────────────────────

  /** Upload local de foto da unidade */
  @Post(':id/midias/upload-local')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (_req: any, file: any, cb: any) => {
        cb(null, `unidade_${uuidv4()}${path.extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, cb: any) => {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Apenas imagens'), false);
      cb(null, true);
    },
  }))
  async uploadLocal(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFile() file: any,
    @Body() body: { tipo?: string; legenda?: string },
  ) {
    const apiBase = process.env.API_BASE_URL ?? 'http://localhost:3000';
    const url = `${apiBase}/uploads/${file.filename}`;
    return this.service.adicionarMidia(id, req.user.sub, {
      url, tipo: body.tipo ?? 'foto', legenda: body.legenda,
    });
  }

  /** Confirma URL externa (R2/S3) */
  @Post(':id/midias/confirmar')
  confirmarMidia(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { url: string; tipo?: string; legenda?: string },
  ) {
    return this.service.adicionarMidia(id, req.user.sub, body);
  }

  /** Remove foto da unidade */
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
