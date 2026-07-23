import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { SimularDto } from './dto/simular.dto';

// ── Critérios públicos dos bancos (taxas SFH/SBPE 2025) ──────────────────────
const BANCOS = [
  {
    nome: 'Caixa Econômica',
    sigla: 'CEF',
    ltv_max: 0.80,
    renda_min: 3000,
    taxa_aa: 0.0875,
    prazo_max_meses: 420,
    aceita_fgts: true,
    autonomo_ok: true,
    score_min: 500,
    url: 'https://habitacao.caixa.gov.br/simweb/init.asp',
    destaque: 'Aceita FGTS · Menor taxa · Minha Casa',
  },
  {
    nome: 'Santander',
    sigla: 'SAN',
    ltv_max: 0.82,
    renda_min: 4000,
    taxa_aa: 0.0949,
    prazo_max_meses: 360,
    aceita_fgts: false,
    autonomo_ok: true,
    score_min: 550,
    url: 'https://www.santander.com.br/financiamento-imobiliario/simulador',
    destaque: 'Financia até 82% · Até 30 anos',
  },
  {
    nome: 'Itaú',
    sigla: 'ITA',
    ltv_max: 0.82,
    renda_min: 4000,
    taxa_aa: 0.0925,
    prazo_max_meses: 360,
    aceita_fgts: false,
    autonomo_ok: true,
    score_min: 550,
    url: 'https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario/simulador',
    destaque: 'Aprovação rápida · App completo',
  },
  {
    nome: 'Bradesco',
    sigla: 'BRA',
    ltv_max: 0.80,
    renda_min: 4000,
    taxa_aa: 0.0975,
    prazo_max_meses: 360,
    aceita_fgts: false,
    autonomo_ok: false,
    score_min: 600,
    url: 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-financiamento/credito-imobiliario/',
    destaque: 'Portabilidade · Relacionamento',
  },
];

// ── Tabela Price: calcula PV dado PMT, taxa anual e prazo ───────────────────
function calcPV(pmtMax: number, taxaAa: number, prazoMeses: number): number {
  const i = taxaAa / 12;
  return pmtMax * (1 - Math.pow(1 + i, -prazoMeses)) / i;
}

// ── Calcula PMT (prestação) dado PV, taxa anual e prazo ─────────────────────
function calcPMT(pv: number, taxaAa: number, prazoMeses: number): number {
  const i = taxaAa / 12;
  return pv * i / (1 - Math.pow(1 + i, -prazoMeses));
}

// ── Score Imobiliário (0–1000) ───────────────────────────────────────────────
function calcScore(dados: SimularDto): number {
  const rendaTotal = (dados.renda_liquida || 0) + (dados.renda_extra || 0);

  // Vínculo empregatício (25%)
  const vinculoMap: Record<string, number> = {
    SERVIDOR: 110, CLT: 100, AUTONOMO_COM_IR: 70, AUTONOMO_SEM_IR: 40,
  };
  const vPts = (vinculoMap[dados.vinculo] ?? 60) / 110;

  // Comprometimento de renda (25%)
  let rendaPts = 0.7;
  if (dados.valor_imovel_desejado && rendaTotal > 0) {
    const prazoMeses = (dados.prazo_anos ?? 30) * 12;
    const financiado = dados.valor_imovel_desejado * 0.80;
    const pmt = calcPMT(financiado, 0.0875, prazoMeses);
    const comprometimento = pmt / rendaTotal;
    rendaPts = comprometimento <= 0.25 ? 1.0
      : comprometimento <= 0.30 ? 0.85
      : comprometimento <= 0.40 ? 0.60
      : 0.30;
  }

  // Entrada disponível % do imóvel (20%)
  const entradaTotal = (dados.entrada || 0) + (dados.usa_fgts ? (dados.fgts || 0) : 0);
  let entradaPts = 0.3;
  if (dados.valor_imovel_desejado && dados.valor_imovel_desejado > 0) {
    const pct = entradaTotal / dados.valor_imovel_desejado;
    entradaPts = pct >= 0.30 ? 1.0 : pct >= 0.20 ? 0.80 : pct >= 0.10 ? 0.55 : 0.30;
  }

  // Tempo de emprego (15%)
  const meses = dados.tempo_emprego_meses ?? 0;
  const tempoPts = meses >= 24 ? 1.0 : meses >= 12 ? 0.70 : meses >= 6 ? 0.45 : 0.20;

  // Score Serasa estimado (10%)
  const serasa = dados.score_serasa_estimado ?? 600;
  const serasaPts = serasa >= 800 ? 1.0 : serasa >= 700 ? 0.80 : serasa >= 600 ? 0.65 : serasa >= 500 ? 0.40 : 0.20;

  // FGTS (5%)
  const fgts = dados.fgts ?? 0;
  const fgtsPts = Math.min(fgts / 60000, 1.0);

  const raw = vPts * 0.25 + rendaPts * 0.25 + entradaPts * 0.20 + tempoPts * 0.15 + serasaPts * 0.10 + fgtsPts * 0.05;
  return Math.round(raw * 1000);
}

// ── Match banco × perfil ─────────────────────────────────────────────────────
function matchBanco(
  banco: typeof BANCOS[0],
  dados: SimularDto,
  capacidadeTotal: number,
): { compatibilidade: number; aprovavel: boolean; motivos: string[] } {
  const rendaTotal = (dados.renda_liquida || 0) + (dados.renda_extra || 0);
  const entradaTotal = (dados.entrada || 0) + (dados.usa_fgts ? (dados.fgts || 0) : 0);
  const valorImovel = dados.valor_imovel_desejado ?? capacidadeTotal;
  const ltvSolicitado = valorImovel > 0 ? (valorImovel - entradaTotal) / valorImovel : 0.80;

  let pontos = 0;
  const motivos: string[] = [];

  if (rendaTotal >= banco.renda_min) pontos++;
  else motivos.push(`Renda mínima: R$ ${banco.renda_min.toLocaleString('pt-BR')}`);

  if (ltvSolicitado <= banco.ltv_max) pontos++;
  else motivos.push(`Entrada insuficiente (LTV máx ${(banco.ltv_max * 100).toFixed(0)}%)`);

  if (dados.vinculo === 'CLT' || dados.vinculo === 'SERVIDOR' || banco.autonomo_ok) pontos++;
  else motivos.push('Banco não financia autônomo sem IR');

  const serasa = dados.score_serasa_estimado ?? 600;
  if (serasa >= banco.score_min) pontos++;
  else motivos.push(`Score abaixo do mínimo (${banco.score_min})`);

  const compatibilidade = Math.round((pontos / 4) * 100);
  return { compatibilidade, aprovavel: compatibilidade >= 75, motivos };
}

@Injectable()
export class SimuladorService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async calcular(dados: SimularDto) {
    const rendaTotal = (dados.renda_liquida || 0) + (dados.renda_extra || 0);
    const entradaTotal = (dados.entrada || 0) + (dados.usa_fgts ? (dados.fgts || 0) : 0);
    const prazoMeses = (dados.prazo_anos ?? 30) * 12;

    // Capacidade máxima (Caixa como base — menor taxa)
    const pmtMax = rendaTotal * 0.30;
    const maxFinanciamento = calcPV(pmtMax, 0.0875, prazoMeses);
    const capacidadeTotal = Math.round(maxFinanciamento + entradaTotal);
    const maxFinanciamentoRnd = Math.round(maxFinanciamento);

    // Prestação estimada para o valor desejado
    let prestacaoEstimada: number | null = null;
    if (dados.valor_imovel_desejado) {
      const financiado = dados.valor_imovel_desejado - entradaTotal;
      if (financiado > 0) {
        prestacaoEstimada = Math.round(calcPMT(financiado, 0.0875, prazoMeses));
      }
    }

    const score = calcScore(dados);

    const bancos = BANCOS.map(banco => {
      const match = matchBanco(banco, dados, capacidadeTotal);
      const valorBase = dados.valor_imovel_desejado ?? capacidadeTotal;
      const finAjustado = Math.min(maxFinanciamentoRnd, valorBase * banco.ltv_max);
      const prazoAjustado = Math.min(prazoMeses, banco.prazo_max_meses);
      return {
        ...banco,
        ...match,
        prestacao_estimada: finAjustado > 0
          ? Math.round(calcPMT(finAjustado, banco.taxa_aa, prazoAjustado))
          : null,
      };
    }).sort((a, b) => b.compatibilidade - a.compatibilidade);

    // Salva como lead (sem bloquear se tabela não existir)
    if (dados.email || dados.telefone || dados.nome) {
      this.pool.query(
        `INSERT INTO simulacoes
          (nome,email,telefone,renda_liquida,renda_extra,entrada,fgts,
           usa_fgts,vinculo,tempo_emprego_meses,score_serasa_estimado,
           valor_imovel_desejado,prazo_anos,score_imobiliario,
           capacidade_total,max_financiamento,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())`,
        [
          dados.nome ?? null, dados.email ?? null, dados.telefone ?? null,
          dados.renda_liquida, dados.renda_extra ?? 0, dados.entrada, dados.fgts ?? 0,
          dados.usa_fgts ?? false, dados.vinculo, dados.tempo_emprego_meses ?? 0,
          dados.score_serasa_estimado ?? null, dados.valor_imovel_desejado ?? null,
          dados.prazo_anos ?? 30, score, capacidadeTotal, maxFinanciamentoRnd,
        ],
      ).catch(() => { /* tabela ainda não criada — não bloqueia */ });
    }

    return {
      score,
      renda_total: rendaTotal,
      pmt_max: Math.round(pmtMax),
      max_financiamento: maxFinanciamentoRnd,
      entrada_total: Math.round(entradaTotal),
      capacidade_total: capacidadeTotal,
      prestacao_estimada: prestacaoEstimada,
      prazo_anos: dados.prazo_anos ?? 30,
      bancos,
    };
  }

  async listar() {
    const { rows } = await this.pool.query(
      `SELECT id, nome, email, telefone, renda_liquida, entrada, fgts, usa_fgts,
              vinculo, valor_imovel_desejado, prazo_anos,
              score_imobiliario, capacidade_total, max_financiamento, created_at
       FROM simulacoes
       ORDER BY created_at DESC
       LIMIT 500`,
    );
    return rows;
  }
}
