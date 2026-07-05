import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Ip } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CriarLeadDto } from './dto/criar-lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  // --- ROTA PÚBLICA (chamada pelo formulário do site/app) ---

  // POST /api/v1/leads/empreendimentos/:empreendimentoId
  @Post('empreendimentos/:empreendimentoId')
  capturar(
    @Param('empreendimentoId') empreendimentoId: string,
    @Body() dto: CriarLeadDto,
    @Ip() ip: string,
  ) {
    return this.service.capturar(empreendimentoId, dto, ip);
  }

  // --- ROTAS AUTENTICADAS ---

  // GET /api/v1/leads/meus (construtora vê todos os seus leads)
  @UseGuards(JwtAuthGuard)
  @Get('meus')
  listarDaConstrutora(
    @Request() req: any,
    @Query() filtros: { status?: string; empreendimento_id?: string },
  ) {
    return this.service.listarDaConstrutora(req.user.sub, filtros);
  }

  // GET /api/v1/leads/parceiro (parceiro vê apenas os leads atribuídos a ele)
  @UseGuards(JwtAuthGuard)
  @Get('parceiro')
  listarDoParceiro(@Request() req: any) {
    return this.service.listarDoParceiro(req.user.sub);
  }

  // GET /api/v1/leads/resumo/:empreendimentoId (construtora vê distribuição por parceiro)
  @UseGuards(JwtAuthGuard)
  @Get('resumo/:empreendimentoId')
  resumoPorParceiro(@Param('empreendimentoId') empreendimentoId: string) {
    return this.service.resumoPorParceiro(empreendimentoId);
  }
}
