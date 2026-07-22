'use client';

import { useState } from 'react';
import {
  Calculator, ChevronRight, ChevronLeft, CheckCircle2,
  TrendingUp, Home, Building2, ExternalLink,
  AlertCircle, Info, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Banco {
  nome: string; sigla: string; taxa_aa: number; url: string; destaque: string;
  compatibilidade: number; aprovavel: boolean; motivos: string[];
  prestacao_estimada: number | null;
}
interface SimulacaoResultado {
  score: number; renda_total: number; pmt_max: number;
  max_financiamento: number; entrada_total: number; capacidade_total: number;
  prestacao_estimada: number | null; prazo_anos: number; bancos: Banco[];
}

// ── Utilitários de moeda ──────────────────────────────────────────────────────
/** "18000" ou "18.000" → 18000 */
const parseBRL = (s: string) =>
  parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;

/** Formata enquanto digita: "18000" → "18.000" */
function maskBRL(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('pt-BR');
}

/** Exibe resultado: 18000 → "R$ 18.000" */
const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const pct = (v: number) =>
  `${(v * 100).toFixed(2).replace('.', ',')}% a.a.`;

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = ['Renda', 'Entrada', 'Perfil', 'Contato'];

// ── Input de moeda reutilizável ───────────────────────────────────────────────
function MoneyInput({
  label, value, onChange, placeholder = 'R$ 0', hint, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-primary-600 ml-0.5">*</span>}
      </span>
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm pointer-events-none">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(maskBRL(e.target.value))}
          className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold text-base
                     focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors"
        />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </label>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function SimuladoresPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<SimulacaoResultado | null>(null);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    renda_liquida: '',
    renda_extra: '',
    entrada: '',
    fgts: '',
    usa_fgts: false,
    valor_imovel_desejado: '',
    prazo_anos: '30',
    vinculo: 'CLT' as 'CLT' | 'SERVIDOR' | 'AUTONOMO_COM_IR' | 'AUTONOMO_SEM_IR',
    tempo_emprego_meses: '',
    score_serasa_estimado: '',
    nome: '',
    email: '',
    telefone: '',
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  // ── Cálculo local (mesmo algoritmo do backend) ───────────────────────────
  function calcLocal(): SimulacaoResultado | null {
    const renda = parseBRL(form.renda_liquida);
    if (!renda) return null;
    const extra = parseBRL(form.renda_extra);
    const entrada = parseBRL(form.entrada);
    const fgts = parseBRL(form.fgts);
    const entradaTotal = entrada + (form.usa_fgts ? fgts : 0);
    const rendaTotal = renda + extra;
    const prazo = parseInt(form.prazo_anos) * 12;
    const i = 0.0875 / 12;
    const pmtMax = rendaTotal * 0.30;
    const maxFin = pmtMax * (1 - Math.pow(1 + i, -prazo)) / i;
    const capTotal = Math.round(maxFin + entradaTotal);

    const valorDesejado = parseBRL(form.valor_imovel_desejado) || 0;
    let prestacaoEst: number | null = null;
    if (valorDesejado > 0) {
      const fin = valorDesejado - entradaTotal;
      if (fin > 0) prestacaoEst = Math.round(fin * i / (1 - Math.pow(1 + i, -prazo)));
    }

    // Score
    const vinculoMap: Record<string, number> = { SERVIDOR: 110, CLT: 100, AUTONOMO_COM_IR: 70, AUTONOMO_SEM_IR: 40 };
    const vPts = (vinculoMap[form.vinculo] ?? 60) / 110;
    let rendaPts = 0.7;
    if (valorDesejado && rendaTotal > 0) {
      const pmtD = (valorDesejado * 0.8 * i) / (1 - Math.pow(1 + i, -prazo));
      const c = pmtD / rendaTotal;
      rendaPts = c <= 0.25 ? 1 : c <= 0.30 ? 0.85 : c <= 0.40 ? 0.60 : 0.30;
    }
    const epct = valorDesejado > 0 ? entradaTotal / valorDesejado : 0;
    const ePts = epct >= 0.30 ? 1 : epct >= 0.20 ? 0.80 : epct >= 0.10 ? 0.55 : 0.30;
    const meses = parseInt(form.tempo_emprego_meses) || 0;
    const tPts = meses >= 24 ? 1 : meses >= 12 ? 0.70 : meses >= 6 ? 0.45 : 0.20;
    const ser = parseInt(form.score_serasa_estimado) || 600;
    const sPts = ser >= 800 ? 1 : ser >= 700 ? 0.80 : ser >= 600 ? 0.65 : ser >= 500 ? 0.40 : 0.20;
    const fPts = Math.min(fgts / 60000, 1);
    const score = Math.round(
      (vPts * 0.25 + rendaPts * 0.25 + ePts * 0.20 + tPts * 0.15 + sPts * 0.10 + fPts * 0.05) * 1000,
    );

    const BANCOS_DATA = [
      { nome: 'Caixa Econômica', sigla: 'CEF', ltv_max: 0.80, renda_min: 3000, taxa_aa: 0.0875, prazo_max: 420, autonomo_ok: true,  score_min: 500, url: 'https://habitacao.caixa.gov.br/simweb/init.asp',                                                           destaque: 'Aceita FGTS · Menor taxa · Minha Casa' },
      { nome: 'Santander',       sigla: 'SAN', ltv_max: 0.82, renda_min: 4000, taxa_aa: 0.0949, prazo_max: 360, autonomo_ok: true,  score_min: 550, url: 'https://www.santander.com.br/financiamento-imobiliario/simulador',                                          destaque: 'Financia até 82% · Até 30 anos' },
      { nome: 'Itaú',            sigla: 'ITA', ltv_max: 0.82, renda_min: 4000, taxa_aa: 0.0925, prazo_max: 360, autonomo_ok: true,  score_min: 550, url: 'https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario/simulador',                           destaque: 'Aprovação rápida · App completo' },
      { nome: 'Bradesco',        sigla: 'BRA', ltv_max: 0.80, renda_min: 4000, taxa_aa: 0.0975, prazo_max: 360, autonomo_ok: false, score_min: 600, url: 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-financiamento/credito-imobiliario/',         destaque: 'Portabilidade · Relacionamento' },
    ];

    const bancos: Banco[] = BANCOS_DATA.map(b => {
      const ltv = (valorDesejado || capTotal) > 0
        ? ((valorDesejado || capTotal) - entradaTotal) / (valorDesejado || capTotal)
        : 0.80;
      let pts = 0; const motivos: string[] = [];
      if (rendaTotal >= b.renda_min) pts++; else motivos.push(`Renda mínima: ${fmt(b.renda_min)}`);
      if (ltv <= b.ltv_max)          pts++; else motivos.push(`Entrada insuficiente (LTV máx ${(b.ltv_max * 100).toFixed(0)}%)`);
      if (form.vinculo === 'CLT' || form.vinculo === 'SERVIDOR' || b.autonomo_ok) pts++;
      else motivos.push('Banco não financia autônomo sem IR');
      if (ser >= b.score_min)        pts++; else motivos.push(`Score abaixo do mínimo (${b.score_min})`);
      const comp = Math.round((pts / 4) * 100);
      const pMeses = Math.min(prazo, b.prazo_max);
      const fi = Math.min(Math.round(maxFin), (valorDesejado || capTotal) * b.ltv_max);
      const bi = b.taxa_aa / 12;
      return {
        nome: b.nome, sigla: b.sigla, taxa_aa: b.taxa_aa, url: b.url, destaque: b.destaque,
        compatibilidade: comp, aprovavel: comp >= 75, motivos,
        prestacao_estimada: fi > 0 ? Math.round(fi * bi / (1 - Math.pow(1 + bi, -pMeses))) : null,
      };
    }).sort((a, b) => b.compatibilidade - a.compatibilidade);

    return {
      score, renda_total: rendaTotal, pmt_max: Math.round(pmtMax),
      max_financiamento: Math.round(maxFin), entrada_total: Math.round(entradaTotal),
      capacidade_total: capTotal, prestacao_estimada: prestacaoEst,
      prazo_anos: parseInt(form.prazo_anos), bancos,
    };
  }

  async function enviarBackend() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://soconstrutoras-production.up.railway.app/api/v1';
    const body = {
      renda_liquida: parseBRL(form.renda_liquida),
      renda_extra: parseBRL(form.renda_extra) || undefined,
      entrada: parseBRL(form.entrada),
      fgts: parseBRL(form.fgts) || undefined,
      usa_fgts: form.usa_fgts,
      vinculo: form.vinculo,
      tempo_emprego_meses: parseInt(form.tempo_emprego_meses) || undefined,
      score_serasa_estimado: parseInt(form.score_serasa_estimado) || undefined,
      valor_imovel_desejado: parseBRL(form.valor_imovel_desejado) || undefined,
      prazo_anos: parseInt(form.prazo_anos),
      nome: form.nome || undefined,
      email: form.email || undefined,
      telefone: form.telefone || undefined,
    };
    const res = await fetch(`${apiBase}/simulador/calcular`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Erro no servidor');
    return res.json() as Promise<SimulacaoResultado>;
  }

  async function simular() {
    setErro('');
    const local = calcLocal();
    if (!local) { setErro('Preencha ao menos a renda mensal.'); return; }
    setResultado(local);
    if (form.nome || form.email || form.telefone) {
      setLoading(true);
      try { const r = await enviarBackend(); setResultado(r); } catch { /* usa local */ }
      setLoading(false);
    }
  }

  function avancar() {
    if (step === 0 && !parseBRL(form.renda_liquida)) {
      setErro('Informe sua renda mensal líquida.');
      return;
    }
    setErro('');
    setStep(s => s + 1);
  }

  if (resultado) {
    return (
      <ResultadoView
        resultado={resultado}
        form={form}
        onVoltar={() => { setResultado(null); setStep(3); }}
        loading={loading}
      />
    );
  }

  // ── Input field comum ────────────────────────────────────────────────────
  const inputCls = 'block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-medium text-base focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors';
  const selectCls = 'block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-medium bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero verde ────────────────────────────────────────────────────── */}
      <div className="bg-primary-700 text-white py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-primary-200 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 rounded-xl p-2.5">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Simulador Imobiliário</h1>
              <p className="text-primary-200 text-sm">Descubra seu poder de compra em segundos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* ── Stepper ───────────────────────────────────────────────────── */}
        <div className="flex items-center mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i < step ? 'bg-primary-600 text-white'
                    : i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-gray-200 text-gray-400'}`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 font-semibold ${i === step ? 'text-primary-700' : 'text-gray-400'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 transition-colors ${i < step ? 'bg-primary-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Card do formulário ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Barra colorida no topo */}
          <div className="h-1.5 bg-primary-600" style={{ width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width .4s ease' }} />

          <div className="p-6 space-y-4">
            {/* ── STEP 0: Renda ──────────────────────────────────────────── */}
            {step === 0 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Qual é a sua renda?</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Valores mensais, já descontados impostos e benefícios</p>
                </div>
                <MoneyInput
                  label="Renda líquida mensal"
                  value={form.renda_liquida}
                  onChange={v => set('renda_liquida', v)}
                  placeholder="0"
                  hint="Digite apenas números. Ex: 15000 para R$ 15.000"
                  required
                />
                <MoneyInput
                  label="Renda extra (opcional)"
                  value={form.renda_extra}
                  onChange={v => set('renda_extra', v)}
                  placeholder="0"
                  hint="Aluguel, freela, pensão, 13º, etc. Ex: 2000 para R$ 2.000"
                />
                <MoneyInput
                  label="Valor do imóvel que busca (opcional)"
                  value={form.valor_imovel_desejado}
                  onChange={v => set('valor_imovel_desejado', v)}
                  placeholder="0"
                  hint="Ex: 800000 para R$ 800.000. Deixe vazio para calcular seu limite."
                />
              </>
            )}

            {/* ── STEP 1: Entrada ────────────────────────────────────────── */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Entrada disponível</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Quanto você tem guardado para dar de entrada?</p>
                </div>
                <MoneyInput
                  label="Valor da entrada"
                  value={form.entrada}
                  onChange={v => set('entrada', v)}
                  placeholder="0"
                  hint="Ex: 200000 para R$ 200.000"
                  required
                />
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.usa_fgts}
                      onChange={e => set('usa_fgts', e.target.checked)}
                      className="w-5 h-5 rounded accent-primary-600"
                    />
                    <span className="text-sm font-semibold text-gray-800">Vou usar o FGTS na entrada</span>
                  </label>
                  {form.usa_fgts && (
                    <MoneyInput
                      label="Saldo do FGTS"
                      value={form.fgts}
                      onChange={v => set('fgts', v)}
                      placeholder="0"
                      hint="Valor aproximado disponível para saque"
                    />
                  )}
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Prazo desejado do financiamento</span>
                  <select value={form.prazo_anos} onChange={e => set('prazo_anos', e.target.value)} className={`mt-1 ${selectCls}`}>
                    <option value="20">20 anos (240 meses)</option>
                    <option value="25">25 anos (300 meses)</option>
                    <option value="30">30 anos (360 meses)</option>
                    <option value="35">35 anos — máximo (420 meses)</option>
                  </select>
                </label>
              </>
            )}

            {/* ── STEP 2: Perfil ─────────────────────────────────────────── */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Seu perfil de emprego</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Afeta quais bancos e condições você acessa</p>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Vínculo empregatício <span className="text-primary-600">*</span></span>
                  <select value={form.vinculo} onChange={e => set('vinculo', e.target.value as typeof form.vinculo)} className={`mt-1 ${selectCls}`}>
                    <option value="CLT">CLT — empregado registrado</option>
                    <option value="SERVIDOR">Servidor público</option>
                    <option value="AUTONOMO_COM_IR">Autônomo com declaração de IR</option>
                    <option value="AUTONOMO_SEM_IR">Autônomo sem declaração de IR</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Tempo no emprego atual</span>
                  <select value={form.tempo_emprego_meses} onChange={e => set('tempo_emprego_meses', e.target.value)} className={`mt-1 ${selectCls}`}>
                    <option value="">Selecione</option>
                    <option value="3">Menos de 6 meses</option>
                    <option value="9">6 meses a 1 ano</option>
                    <option value="18">1 a 2 anos</option>
                    <option value="36">Mais de 2 anos</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Score no Serasa (estimado)</span>
                  <select value={form.score_serasa_estimado} onChange={e => set('score_serasa_estimado', e.target.value)} className={`mt-1 ${selectCls}`}>
                    <option value="">Não sei / prefiro não informar</option>
                    <option value="850">Acima de 800 — Excelente</option>
                    <option value="720">700 a 800 — Bom</option>
                    <option value="620">600 a 700 — Regular</option>
                    <option value="520">500 a 600 — Baixo</option>
                    <option value="400">Abaixo de 500</option>
                  </select>
                </label>
              </>
            )}

            {/* ── STEP 3: Contato ────────────────────────────────────────── */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Quase lá!</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Dados opcionais para salvar seu resultado</p>
                </div>
                <div className="flex items-start gap-2 bg-primary-50 border border-primary-100 rounded-xl p-3">
                  <Info className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-primary-800">
                    Pode simular sem preencher. Se quiser, seus dados conectam você a um especialista credenciado.
                  </p>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Nome completo</span>
                  <input type="text" placeholder="Seu nome"
                    value={form.nome} onChange={e => set('nome', e.target.value)}
                    className={`mt-1 ${inputCls}`} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">E-mail</span>
                  <input type="email" placeholder="seu@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)}
                    className={`mt-1 ${inputCls}`} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">WhatsApp</span>
                  <input type="tel" placeholder="(31) 9 0000-0000"
                    value={form.telefone} onChange={e => set('telefone', e.target.value)}
                    className={`mt-1 ${inputCls}`} />
                </label>
              </>
            )}

            {/* ── Erro ──────────────────────────────────────────────────── */}
            {erro && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
              </div>
            )}

            {/* ── Navegação ─────────────────────────────────────────────── */}
            <div className="flex gap-3 pt-2">
              {step > 0 ? (
                <button
                  onClick={() => { setErro(''); setStep(s => s - 1); }}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
              ) : (
                <Link href="/"
                  className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Início
                </Link>
              )}

              {step < STEPS.length - 1 ? (
                <button onClick={avancar}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors">
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={simular} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
                  <Calculator className="w-5 h-5" />
                  {loading ? 'Calculando...' : 'Ver resultado'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tela de resultado ─────────────────────────────────────────────────────────
function ResultadoView({
  resultado, form, onVoltar, loading,
}: {
  resultado: SimulacaoResultado;
  form: { valor_imovel_desejado: string; renda_liquida: string; renda_extra: string; [k: string]: string | boolean };
  onVoltar: () => void;
  loading: boolean;
}) {
  const sc = resultado.score;
  const scoreLabel = sc >= 800 ? 'Excelente' : sc >= 650 ? 'Muito Bom' : sc >= 500 ? 'Bom' : 'Regular';
  const scoreBg = sc >= 800 ? 'text-green-400' : sc >= 650 ? 'text-green-300' : sc >= 500 ? 'text-yellow-300' : 'text-red-300';
  const arc = Math.min((sc / 1000) * 251, 251);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero resultado */}
      <div className="bg-primary-700 text-white pt-6 pb-14 px-4">
        <div className="max-w-lg mx-auto">
          <button onClick={onVoltar}
            className="inline-flex items-center gap-1.5 text-primary-200 hover:text-white text-sm mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Corrigir informações
          </button>
          <div className="text-center">
            <p className="text-primary-200 text-sm mb-1">Seu Score Imobiliário</p>
            <div className="relative inline-block">
              <svg width="180" height="100" viewBox="0 0 180 100">
                <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="14" strokeLinecap="round" />
                <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="white" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${arc} 251`} style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <span className={`text-5xl font-black ${scoreBg}`}>{sc}</span>
                <span className="text-sm font-bold text-primary-100">{scoreLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 space-y-4">
        {/* Card capacidade */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary-600 px-5 py-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">Sua capacidade de compra</span>
          </div>
          <div className="p-5">
            {/* Linha renda + prestação */}
            <div className="divide-y divide-gray-50 mb-4">
              {[
                ['Renda total considerada', fmt(resultado.renda_total)],
                ['Prestação máxima (30% da renda)', `${fmt(resultado.pmt_max)}/mês`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className="font-bold text-gray-900 text-sm">{v}</span>
                </div>
              ))}
            </div>

            {/* Fórmula visual: banco + entrada = total */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Como é calculado seu poder de compra</p>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                  <span className="text-sm text-gray-600">O banco financia até</span>
                </div>
                <span className="font-bold text-gray-900">{fmt(resultado.max_financiamento)}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-300" />
                  <span className="text-sm text-gray-600">+ Sua entrada</span>
                </div>
                <span className="font-bold text-gray-900">{fmt(resultado.entrada_total)}</span>
              </div>

              <div className="border-t-2 border-primary-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-800">= Valor do imóvel que pode comprar</span>
                <span className="text-xl font-black text-primary-600">{fmt(resultado.capacidade_total)}</span>
              </div>
            </div>

            {resultado.prestacao_estimada && parseBRL(form.valor_imovel_desejado as string) > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm text-amber-800">
                  Para o imóvel de <strong>{fmt(parseBRL(form.valor_imovel_desejado as string))}</strong>,
                  a prestação estimada é <strong>{fmt(resultado.prestacao_estimada)}/mês</strong> pela Caixa em {resultado.prazo_anos} anos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bancos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary-600 px-5 py-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">Compatibilidade por banco</span>
          </div>
          <div className="p-4 space-y-3">
            {resultado.bancos.map(banco => (
              <div key={banco.nome}
                className={`rounded-xl border p-4 ${banco.aprovavel ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{banco.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{banco.destaque}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-black ${banco.aprovavel ? 'text-primary-600' : 'text-gray-400'}`}>
                      {banco.compatibilidade}%
                    </p>
                    <p className="text-[10px] text-gray-400">compatível</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mb-3">
                  <span>Taxa: <strong>{pct(banco.taxa_aa)}</strong></span>
                  {banco.prestacao_estimada && (
                    <span>Prestação: <strong>{fmt(banco.prestacao_estimada)}/mês</strong></span>
                  )}
                </div>
                {banco.motivos.length > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 mb-3 space-y-0.5">
                    {banco.motivos.map(m => <div key={m}>⚠ {m}</div>)}
                  </div>
                )}
                <a href={banco.url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors w-full
                    ${banco.aprovavel
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Simular no {banco.nome}
                </a>
              </div>
            ))}
            <div className="flex items-start gap-2 bg-primary-50 border border-primary-100 rounded-xl p-3">
              <Info className="w-3.5 h-3.5 text-primary-600 mt-0.5 shrink-0" />
              <p className="text-xs text-primary-800">
                Use seus dados ao acessar o banco: renda <strong>{fmt(resultado.renda_total)}</strong>,
                entrada <strong>{fmt(resultado.entrada_total)}</strong>, prazo <strong>{resultado.prazo_anos} anos</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Ações finais */}
        <Link href="/"
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-colors">
          <Home className="w-5 h-5" /> Ver imóveis no meu perfil
        </Link>

        <button onClick={onVoltar}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-2xl text-gray-600 font-semibold hover:border-primary-300 hover:text-primary-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Corrigir informações
        </button>

        {loading && <p className="text-center text-xs text-gray-400">Salvando seu perfil...</p>}
      </div>
    </div>
  );
}
