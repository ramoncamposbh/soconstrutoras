import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LojasService } from './lojas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('lojas')
export class LojasController {
  constructor(private readonly service: LojasService) {}

  @Get()
  listarPublico() {
    return this.service.listarPublico();
  }

  @Get('categorias')
  listarCategorias() {
    return this.service.listarCategorias();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/todas')
  listarAdmin(@Request() req: any) {
    return this.service.listarAdmin(req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('categorias')
  criarCategoria(@Request() req: any, @Body() dto: any) {
    return this.service.criarCategoria(req.user.role, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('categorias/:id')
  removerCategoria(@Request() req: any, @Param('id') id: string) {
    return this.service.removerCategoria(req.user.role, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  criar(@Request() req: any, @Body() dto: any) {
    return this.service.criar(req.user.role, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  atualizar(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.atualizar(req.user.role, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remover(@Request() req: any, @Param('id') id: string) {
    return this.service.remover(req.user.role, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    return this.service.uploadLogo(req.user.role, id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/midias')
  @UseInterceptors(FileInterceptor('file'))
  uploadFoto(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    return this.service.uploadFoto(req.user.role, id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/midias/:midiaId')
  removerMidia(
    @Request() req: any,
    @Param('id') id: string,
    @Param('midiaId') midiaId: string,
  ) {
    return this.service.removerMidia(req.user.role, id, midiaId);
  }

  @Get(':slug')
  buscarPorSlug(@Param('slug') slug: string) {
    return this.service.buscarPorSlug(slug);
  }
}
