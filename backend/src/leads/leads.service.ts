import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { LeadsEngine } from '../leads-engine';
import { NotificationsService } from '../notifications/notifications.service';
import { CriarLeadDto } from './dto/criar-lead.dto';

@Injectable()
export class LeadsService {
  private readonly engine: LeadsEngine;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly notifications: NotificationsService,
  ) {
    this.engine = new LeadsEngine(pool);
  }

  /** Recebe um lead, distribui e notifica o parceiro por e-mail */
  async capturar(empreendimentoId: string, dto: CriarLeadDto, ip?: string) {
    const resultado = await this.engine.receberLead({
      empreendimento_id: empreendimentoId,
      nome:         dto.nome,
      email:        dto.email,
      telefone:     dto.telefone,
      mensagem:     dto.mensagem,
      utm_source:   dto.utm_source,
      utm_medium:   dto.utm_medium,
      utm_campaign: dto.utm_campaign,
      ip_origem:    ip,
    });

    // Busca dados do empreendimento para o e-mail
    const { rows: [emp] } = await this.pool.query(
      'SELECT nome, cidade, estado FROM empreendimentos WHERE id = $1',
      [empreendimentoId],
    );

    // Dispara o e-mail em background (não bloqueia a resposta)
    this.notifications.notificarNovoCead({
      parceiro_nome:  resultado.parceiro_nome,
      parceiro_email: resultado.parceiro_email,
      lead_nome:      dto.nome,
      lead_telefone:  dto.telefone,
      lead_email:     dto.email,
      lead_mensagem:  dto.mensagem,
      empreendimento: emp?.nome ?? '',
      cidade:         emp?.cidade ?? '',
      estado:         emp?.estado ?? '',
      atribuido_em:   resultado.atribuido_em,
    }).catch(() => {}); // erro no e-mail nunca quebra a resposta

    return resultado;
  }

  /** Dashboard da construtora: todos os leads dos seus empreendimentos */
  async listarDaConstrutora(construtoraId: string, filtros: { status?: string; empreendimento_id?: string }) {
    const conditions = ['e.construtora_id = $1'];
    const params: any[] = [construtoraId];
    let i = 2;

    if (filtros.status) {
      conditions.push(`l.status = $${i++}`);
      params.push(filtros.status);
    }
    if (filtros.empreendimento_id) {
      conditions.push(`l.empreendimento_id = $${i++}`);
      params.push(filtros.empreendimento_id);
    }

    const { rows } = await this.pool.query(
      `SELECT l.*, e.nome AS empreendimento,
              p.nome AS parceiro_nome, p.email AS parceiro_email,
              la.atribuido_em, la.status AS status_atribuicao
       FROM leads l
       JOIN empreendimentos e ON e.id = l.empreendimento_id
       LEFT JOIN lead_atribuicoes la ON la.lead_id = l.id
       LEFT JOIN parceiros p ON p.id = la.parceiro_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY l.created_at DESC`,
      params,
    );
    return rows;
  }

  /** Dashboard do parceiro: leads atribuídos a ele */
  async listarDoParceiro(parceiroId: string) {
    const { rows } = await this.pool.query(
      `SELECT l.*, e.nome AS empreendimento, la.atribuido_em, la.status AS status_atribuicao
       FROM lead_atribuicoes la
       JOIN leads l ON l.id = la.lead_id
       JOIN empreendimentos e ON e.id = l.empreendimento_id
       WHERE la.parceiro_id = $1
       ORDER BY la.atribuido_em DESC`,
      [parceiroId],
    );
    return rows;
  }

  /** Resumo de leads por parceiro (para dashboard da construtora) */
  async resumoPorParceiro(empreendimentoId: string) {
    const { rows } = await this.pool.query(
      `SELECT p.nome, p.email, p.tipo,
              COUNT(la.id) AS total_leads,
              COUNT(la.id) FILTER (WHERE la.status = 'convertido') AS convertidos,
              COUNT(la.id) FILTER (WHERE la.status = 'perdido') AS perdidos
       FROM empreendimento_parceiros ep
       JOIN parceiros p ON p.id = ep.parceiro_id
       LEFT JOIN lead_atribuicoes la ON la.parceiro_id = ep.parceiro_id
       WHERE ep.empreendimento_id = $1 AND ep.ativo = TRUE
       GROUP BY p.id, p.nome, p.email, p.tipo
       ORDER BY total_leads DESC`,
      [empreendimentoId],
    );
    return rows;
  }
}
