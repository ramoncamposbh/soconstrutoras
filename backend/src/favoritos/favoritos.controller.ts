import {
  Controller, Get, Post, Delete,
  Param, UseGuards, Request,
} from '@nestjs/common';
import { FavoritosService } from './favoritos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favoritos')
@UseGuards(JwtAuthGuard)
export class FavoritosController {
  constructor(private readonly service: FavoritosService) {}

  // GET /api/v1/favoritos — lista completa com dados do empreendimento
  @Get()
  listar(@Request() req: any) {
    return this.service.listar(req.user.sub);
  }

  // GET /api/v1/favoritos/ids — só os IDs (leve, para checar corações)
  @Get('ids')
  listarIds(@Request() req: any) {
    return this.service.listarIds(req.user.sub);
  }

  // POST /api/v1/favoritos/:empreendimentoId
  @Post(':empreendimentoId')
  adicionar(
    @Request() req: any,
    @Param('empreendimentoId') empreendimentoId: string,
  ) {
    return this.service.adicionar(req.user.sub, empreendimentoId);
  }

  // DELETE /api/v1/favoritos/:empreendimentoId
  @Delete(':empreendimentoId')
  remover(
    @Request() req: any,
    @Param('empreendimentoId') empreendimentoId: string,
  ) {
    return this.service.remover(req.user.sub, empreendimentoId);
  }
}
