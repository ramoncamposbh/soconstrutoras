import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MidiasService } from './midias.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

@UseGuards(JwtAuthGuard)
@Controller('empreendimentos/:empreendimentoId/midias')
export class MidiasController {
  constructor(private readonly service: MidiasService) {}

  @Get()
  listar(@Param('empreendimentoId') empreendimentoId: string) {
    return this.service.listar(empreendimentoId);
  }

  // Upload local (desenvolvimento sem R2/S3)
  @Post('upload-local')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (req: any, file: any, cb: any) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Apenas imagens'), false);
      cb(null, true);
    },
  }))
  async uploadLocal(
    @Param('empreendimentoId') empreendimentoId: string,
    @Request() req: any,
    @UploadedFile() file: any,
  ) {
    const url = `http://localhost:3000/uploads/${file.filename}`;
    return this.service.confirmarUpload(empreendimentoId, req.user.sub, { url, tipo: 'foto' });
  }

  @Post('url-upload')
  gerarUrl(
    @Param('empreendimentoId') empreendimentoId: string,
    @Request() req: any,
    @Body() body: { tipo: 'foto' | 'video' | 'planta' | 'tour_virtual'; contentType: string },
  ) {
    return this.service.gerarUrlUpload(empreendimentoId, req.user.sub, body.tipo, body.contentType);
  }

    @Post('confirmar')
  confirmar(
    @Param('empreendimentoId') empreendimentoId: string,
    @Request() req: any,
    @Body() body: { url: string; tipo: 'foto' | 'video' | 'planta' | 'tour_virtual'; legenda?: string },
  ) {
    return this.service.confirmarUpload(empreendimentoId, req.user.sub, body);
  }

  @Post('reordenar')
  reordenar(
    @Param('empreendimentoId') empreendimentoId: string,
    @Request() req: any,
    @Body() body: { ordens: { id: string; ordem: number }[] },
  ) {
    return this.service.reordenar(empreendimentoId, req.user.sub, body.ordens);
  }

  @Delete(':midiaId')
  remover(
    @Param('empreendimentoId') empreendimentoId: string,
    @Param('midiaId') midiaId: string,
    @Request() req: any,
  ) {
    return this.service.remover(midiaId, empreendimentoId, req.user.sub);
  }
}
