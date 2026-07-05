import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ParceirosService } from './parceiros.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { AdicionarParceiroDto } from './dto/adicionar-parceiro.dto';
import { VincularParceiroDto } from './dto/vincular-parceiro.dto';

@UseGuards(JwtAuthGuard)
@Controller('parceiros')
export class ParceirosController {
  constructor(private readonly service: ParceirosService) {}

  // GET /api/v1/parceiros
  @Get()
  listar(@Request() req: any) {
    return this.service.listar(req.user.sub);
  }

  // POST /api/v1/parceiros
  @UseGuards(SubscriptionGuard)
  @Post()
  adicionar(@Request() req: any, @Body() dto: AdicionarParceiroDto) {
    return this.service.adicionar(req.user.sub, dto);
  }

  // POST /api/v1/parceiros/empreendimentos/:empreendimentoId/vincular
  @UseGuards(SubscriptionGuard)
  @Post('empreendimentos/:empreendimentoId/vincular')
  vincular(
    @Request() req: any,
    @Param('empreendimentoId') empreendimentoId: string,
    @Body() dto: VincularParceiroDto,
  ) {
    return this.service.vincular(req.user.sub, empreendimentoId, dto);
  }

  // GET /api/v1/parceiros/empreendimentos/:empreendimentoId
  @Get('empreendimentos/:empreendimentoId')
  listarDoEmpreendimento(@Param('empreendimentoId') empreendimentoId: string) {
    return this.service.listarDoEmpreendimento(empreendimentoId);
  }

  // DELETE /api/v1/parceiros/empreendimentos/:empreendimentoId/:parceiroId
  @UseGuards(SubscriptionGuard)
  @Delete('empreendimentos/:empreendimentoId/:parceiroId')
  removerVinculo(
    @Request() req: any,
    @Param('empreendimentoId') empreendimentoId: string,
    @Param('parceiroId') parceiroId: string,
  ) {
    return this.service.removerVinculo(empreendimentoId, parceiroId, req.user.sub);
  }
}
