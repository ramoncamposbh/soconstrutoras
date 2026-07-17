import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Request, UseGuards,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UnidadesService } from './unidades.service';
import { CriarUnidadeDto } from './dto/criar-unidade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as multer from 'multer';

@UseGuards(JwtAuthGuard)
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly service: UnidadesService) {}

  @Get('empreendimentos/:empreendimentoId')
  listar(@Param('empreendimentoId') empId: string, @Request() req: any) {
    return this.service.listar(empId, req.user.sub);
  }

  @Post('empreendimentos/:empreendimentoId')
  criar(@Param('empreendimentoId') empId: string, @Request() req: any, @Body() dto: CriarUnidadeDto) {
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

  @Post(':id/midias/upload-proxy')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Apenas imagens'), false);
      cb(null, true);
    },
  }))
  uploadProxy(@Param('id') id: string, @Request() req: any, @UploadedFile() file: any) {
    return this.service.uploadViaProxy(id, req.user.sub, file);
  }

  @Post(':id/midias/reordenar')
  reordenarMidias(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { ordens: { id: string; ordem: number }[] },
  ) {
    return this.service.reordenarMidias(id, req.user.sub, body.ordens);
  }

  @Post(':id/midias/url-upload')
  gerarUrlUpload(@Param('id') id: string, @Request() req: any, @Body() body: { contentType: string }) {
    return this.service.gerarUrlUploadMidia(id, req.user.sub, body.contentType);
  }

  @Post(':id/midias/confirmar')
  confirmarMidia(@Param('id') id: string, @Request() req: any, @Body() body: { url: string; tipo?: string; legenda?: string }) {
    return this.service.adicionarMidia(id, req.user.sub, body);
  }

  @Delete(':id/midias/:midiaId')
  removerMidia(@Param('id') id: string, @Param('midiaId') midiaId: string, @Request() req: any) {
    return this.service.removerMidia(id, midiaId, req.user.sub);
  }
}

import { Controller as Ctrl, Get as GetP, Param as Par } from '@nestjs/common';

@Ctrl('public/unidades')
export class UnidadesPublicController {
  constructor(private readonly service: UnidadesService) {}

  @GetP('empreendimentos/:empreendimentoId')
  listarPublico(@Par('empreendimentoId') empId: string) {
    return this.service.listarPublico(empId);
  }
}
