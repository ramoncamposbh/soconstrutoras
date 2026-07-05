/**
 * SóConstrutoras — Engine de Distribuição de Leads
 *
 * Responsabilidades:
 *  - Receber um novo lead de um empreendimento
 *  - Determinar qual parceiro recebe o lead (sequencial ou percentual)
 *  - Garantir atomicidade com SELECT FOR UPDATE (sem lead duplicado)
 *  - Registrar a atribuição e atualizar o estado do cursor
 */

import { Pool, PoolClient } from 'pg'; // npm i pg @types/pg

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Lead {
  id: string;
  empreendimento_id: string;
  nome: string;
  email?: string;
  telefone: string;
  mensagem?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ip_origem?: string;
}

interface Parceiro {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  modo_distribuicao: 'sequencial' | 'percentual';
  percentual?: number;
  ordem: number;
  is_house_de_vendas: boolean;
}

interface DistribuicaoEstado {
  ultimo_parceiro_idx: number;
  leads_por_parceiro: Record<string, number>; // { parceiro_id: count }
  total_leads_recebidos: number;
}

export interface ResultadoAtribuicao {
  lead_id: string;
  parceiro_id: string;
  parceiro_nome: string;
  parceiro_email: string;
  atribuido_em: Date;
}

// ---------------------------------------------------------------------------
// Classe principal
// ---------------------------------------------------------------------------

export class LeadsEngine {
  constructor(private readonly pool: Pool) {}

  /**
   * Ponto de entrada principal.
   * Cria o lead no banco e o distribui atomicamente para um parceiro.
   */
  async receberLead(dados: Omit<Lead, 'id'>): Promise<ResultadoAtribuicao> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Inserir o lead
      const { rows: [lead] } = await client.query<{ id: string }>(
        `INSERT INTO leads
           (empreendimento_id, nome, email, telefone, mensagem,
            utm_source, utm_medium, utm_campaign, ip_origem)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [
          dados.empreendimento_id, dados.nome, dados.email, dados.telefone,
          dados.mensagem, dados.utm_source, dados.utm_medium,
          dados.utm_campaign, dados.ip_origem,
        ],
      );

      // 2. Buscar parceiros ativos (com lock no estado de distribuição)
      const parceiros = await this.buscarParceiros(client, dados.empreendimento_id);

      if (parceiros.length === 0) {
        throw new Error(`Empreendimento ${dados.empreendimento_id} não possui parceiros ativos.`);
      }

      // 3. Determinar modo de distribuição (todos devem ter o mesmo modo)
      const modo = parceiros[0].modo_distribuicao;

      // 4. Buscar / inicializar estado (com SELECT FOR UPDATE para atomicidade)
      const estado = await this.obterEstadoComLock(client, dados.empreendimento_id);

      // 5. Escolher o parceiro
      const parceiro = modo === 'sequencial'
        ? this.selecionarSequencial(parceiros, estado)
        : this.selecionarPercentual(parceiros, estado);

      // 6. Atualizar estado do cursor
      const novoEstado = this.atualizarEstado(estado, parceiro, modo, parceiros);
      await this.salvarEstado(client, dados.empreendimento_id, novoEstado);

      // 7. Registrar atribuição
      const { rows: [atribuicao] } = await client.query<{ atribuido_em: Date }>(
        `INSERT INTO lead_atribuicoes (lead_id, parceiro_id)
         VALUES ($1, $2)
         RETURNING atribuido_em`,
        [lead.id, parceiro.id],
      );

      // 8. Atualizar status do lead
      await client.query(
        `UPDATE leads SET status = 'atribuido' WHERE id = $1`,
        [lead.id],
      );

      await client.query('COMMIT');

      return {
        lead_id:       lead.id,
        parceiro_id:   parceiro.id,
        parceiro_nome:  parceiro.nome,
        parceiro_email: parceiro.email,
        atribuido_em:  atribuicao.atribuido_em,
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  /** Busca parceiros ativos do empreendimento ordenados por ordem/percentual */
  private async buscarParceiros(
    client: PoolClient,
    empreendimento_id: string,
  ): Promise<Parceiro[]> {
    const { rows } = await client.query<Parceiro>(
      `SELECT
         p.id, p.nome, p.email, p.telefone, p.is_house_de_vendas,
         ep.modo_distribuicao, ep.percentual, ep.ordem
       FROM empreendimento_parceiros ep
       JOIN parceiros p ON p.id = ep.parceiro_id
       WHERE ep.empreendimento_id = $1
         AND ep.ativo = TRUE
         AND p.ativo = TRUE
       ORDER BY ep.ordem ASC`,
      [empreendimento_id],
    );
    return rows;
  }

  /**
   * Obtém o estado de distribuição com SELECT FOR UPDATE.
   * Garante que duas requisições simultâneas não escolham o mesmo parceiro.
   */
  private async obterEstadoComLock(
    client: PoolClient,
    empreendimento_id: string,
  ): Promise<DistribuicaoEstado> {
    // Upsert do estado (caso ainda não exista)
    await client.query(
      `INSERT INTO lead_distribuicao_estado (empreendimento_id)
       VALUES ($1)
       ON CONFLICT (empreendimento_id) DO NOTHING`,
      [empreendimento_id],
    );

    const { rows: [row] } = await client.query<{
      ultimo_parceiro_idx: number;
      leads_por_parceiro: Record<string, number>;
      total_leads_recebidos: number;
    }>(
      `SELECT ultimo_parceiro_idx, leads_por_parceiro, total_leads_recebidos
       FROM lead_distribuicao_estado
       WHERE empreendimento_id = $1
       FOR UPDATE`,
      [empreendimento_id],
    );

    return {
      ultimo_parceiro_idx:   row.ultimo_parceiro_idx,
      leads_por_parceiro:    row.leads_por_parceiro ?? {},
      total_leads_recebidos: row.total_leads_recebidos,
    };
  }

  /**
   * MODO SEQUENCIAL (round-robin)
   * Distribui os leads um a um em ordem circular.
   *
   * Exemplo com 3 parceiros [A, B, C]:
   *   Lead 1 → A  (idx 0)
   *   Lead 2 → B  (idx 1)
   *   Lead 3 → C  (idx 2)
   *   Lead 4 → A  (idx 0) — volta ao início
   */
  private selecionarSequencial(
    parceiros: Parceiro[],
    estado: DistribuicaoEstado,
  ): Parceiro {
    const proximo_idx = estado.ultimo_parceiro_idx % parceiros.length;
    return parceiros[proximo_idx];
  }

  /**
   * MODO PERCENTUAL
   * Distribui os leads respeitando o percentual configurado.
   *
   * Exemplo: A=50%, B=30%, C=20%
   *   A cada 10 leads → A recebe 5, B recebe 3, C recebe 2
   *
   * Algoritmo: compara o percentual real acumulado de cada parceiro
   * com o percentual configurado — quem está mais "abaixo" da cota recebe.
   */
  private selecionarPercentual(
    parceiros: Parceiro[],
    estado: DistribuicaoEstado,
  ): Parceiro {
    const total = estado.total_leads_recebidos + 1; // inclui este lead

    let melhorParceiro = parceiros[0];
    let maiorDeficit = -Infinity;

    for (const p of parceiros) {
      const percentualConfigurado = p.percentual ?? (100 / parceiros.length);
      const leadsRecebidos        = estado.leads_por_parceiro[p.id] ?? 0;
      const percentualReal        = (leadsRecebidos / total) * 100;
      // Déficit = quanto este parceiro está abaixo da cota esperada
      const deficit = percentualConfigurado - percentualReal;

      if (deficit > maiorDeficit) {
        maiorDeficit   = deficit;
        melhorParceiro = p;
      }
    }

    return melhorParceiro;
  }

  /** Atualiza o estado do cursor após a atribuição */
  private atualizarEstado(
    estadoAtual: DistribuicaoEstado,
    parceiro: Parceiro,
    modo: string,
    parceiros: Parceiro[],
  ): DistribuicaoEstado {
    const leads_por_parceiro = { ...estadoAtual.leads_por_parceiro };
    leads_por_parceiro[parceiro.id] = (leads_por_parceiro[parceiro.id] ?? 0) + 1;

    const proximo_idx = modo === 'sequencial'
      ? (estadoAtual.ultimo_parceiro_idx + 1) % parceiros.length
      : estadoAtual.ultimo_parceiro_idx; // percentual não usa idx

    return {
      ultimo_parceiro_idx:   proximo_idx,
      leads_por_parceiro,
      total_leads_recebidos: estadoAtual.total_leads_recebidos + 1,
    };
  }

  /** Persiste o novo estado no banco */
  private async salvarEstado(
    client: PoolClient,
    empreendimento_id: string,
    estado: DistribuicaoEstado,
  ): Promise<void> {
    await client.query(
      `UPDATE lead_distribuicao_estado SET
         ultimo_parceiro_idx   = $2,
         leads_por_parceiro    = $3::JSONB,
         total_leads_recebidos = $4,
         updated_at            = NOW()
       WHERE empreendimento_id = $1`,
      [
        empreendimento_id,
        estado.ultimo_parceiro_idx,
        JSON.stringify(estado.leads_por_parceiro),
        estado.total_leads_recebidos,
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Exemplo de uso (NestJS / Express)
// ---------------------------------------------------------------------------

/*
// leads.controller.ts
@Post(':empreendimentoId/leads')
async capturarLead(
  @Param('empreendimentoId') empreendimentoId: string,
  @Body() body: CriarLeadDto,
  @Ip() ip: string,
) {
  const resultado = await this.leadsEngine.receberLead({
    empreendimento_id: empreendimentoId,
    nome:       body.nome,
    email:      body.email,
    telefone:   body.telefone,
    mensagem:   body.mensagem,
    utm_source: body.utm_source,
    ip_origem:  ip,
  });

  // Dispara notificação (email/WhatsApp) para o parceiro
  await this.notificacoesService.notificarParceiro(resultado);

  return { sucesso: true, lead_id: resultado.lead_id }
  }
}

*/
