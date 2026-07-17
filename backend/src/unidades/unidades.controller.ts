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

  // -- CRUD Unidades ----------------------------------------------------

  @Get('empreendimentos/:empreendimentoId')
  listar(@Param('empreendimentoId') empId: string, @Request() req: any) {
    return this.service.listar(empId, req.user.sub);
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

  // -- Midias via R2 ----------------------------------------------------

  /** Upload via proxy: arquivo passa pelo backend e vai para o R2 (sem CORS) */
  @Post(':id/midias/upload-proxy')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Apenas imagens'), false);
      cb(null, true);
    },
  }))
  uploadProxy(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFile() file: any,
  ) {
    return this.service.uploadViaProxy(id, req.user.sub, file);
  }

  /** Passo 1: gera URL pre-assinada para upload direto ao R2 */
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

// -- Rota publica (sem guard) -----------------------------------------------
import { Controller as Ctrl, Get as GetP, Param as Par } from '@nestjs/common';

@Ctrl('public/unidades')
export class UnidadesPublicController {
  constructor(private readonly service: UnidadesService) {}

  @GetP('empreendimentos/:empreendimentoId')
  listarPublico(@Par('empreendimentoId') empId: string) {
    return this.service.listarPublico(empId);
  }
}
