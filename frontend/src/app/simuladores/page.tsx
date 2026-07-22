'use client';

import { useState } from 'react';
import {
  Calculator, ChevronRight, ChevronLeft, CheckCircle2,
  TrendingUp, Home, Building2, ExternalLink, Star,
  AlertCircle, Info,
} from 'lucide-react';
import Link from 'next/link';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Banco {
  nome: string; sigla: string; taxa_aa: number; url: string; destaque: string;
  compatibilidade: number; aprovavel: boolean; motivos: string[];
  prestacao_estimada: number | null;
}
interface Resultado {
  score: number; renda_total: number; pmt_max: number;
  max_financiamento: number; entrada_total: number; capacidade_total: number;
  prestacao_estimada: number | null; prazo_anos: number; bancos: Banco[];
}

// ── Formata moeda ─────────────────────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (v: number) => `${(v * 100).toFixed(2).replace('.', ',')}% a.a.`;

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = ['Renda', 'Entrada', 'Perfil', 'Contato'];

export default function SimuladoresPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
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

  const parseBRL = (s: string) =>
    parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;

  // ── Cálculo local instantâneo (mesmo algoritmo do backend) ────────────────
  function calcLocal(): Resultado | null {
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
    const score = Math.round((vPts * 0.25 + rendaPts * 0.25 + ePts * 0.20 + tPts * 0.15 + sPts * 0.10 + fPts * 0.05) * 1000);

    const BANCOS_DATA = [
      { nome: 'Caixa Econômica', sigla: 'CEF', ltv_max: 0.80, renda_min: 3000, taxa_aa: 0.0875, prazo_max: 420, autonomo_ok: true, score_min: 500, url: 'https://habitacao.caixa.gov.br/simweb/init.asp', destaque: 'Aceita FGTS · Menor taxa · Minha Casa' },
      { nome: 'Santander', sigla: 'SAN', ltv_max: 0.82, renda_min: 4000, taxa_aa: 0.0949, prazo_max: 360, autonomo_ok: true, score_min: 550, url: 'https://www.santander.com.br/financiamento-imobiliario/simulador', destaque: 'Financia até 82% · Até 30 anos' },
      { nome: 'Itaú', sigla: 'ITA', ltv_max: 0.82, renda_min: 4000, taxa_aa: 0.0925, prazo_max: 360, autonomo_ok: true, score_min: 550, url: 'https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario/simulador', destaque: 'Aprovação rápida · App completo' },
      { nome: 'Bradesco', sigla: 'BRA', ltv_max: 0.80, renda_min: 4000, taxa_aa: 0.0975, prazo_max: 360, autonomo_ok: false, score_min: 600, url: 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-financiamento/credito-imobiliario/', destaque: 'Portabilidade · Relacionamento' },
    ];

    const bancos: Banco[] = BANCOS_DATA.map(b => {
      const ltv = (valorDesejado || capTotal) > 0 ? ((valorDesejado || capTotal) - entradaTotal) / (valorDesejado || capTotal) : 0.80;
      let pts = 0; const motivos: string[] = [];
      if (rendaTotal >= b.renda_min) pts++; else motivos.push(`Renda mínima: ${fmt(b.renda_min)}`);
      if (ltv <= b.ltv_max) pts++; else motivos.push(`Entrada insuficiente (LTV máx ${(b.ltv_max*100).toFixed(0)}%)`);
      if (form.vinculo === 'CLT' || form.vinculo === 'SERVIDOR' || b.autonomo_ok) pts++; else motivos.push('Banco não financia autônomo sem IR');
      if (ser >= b.score_min) pts++; else motivos.push(`Score abaixo do mínimo (${b.score_min})`);
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

  // ── Envio ao backend (salva lead) ─────────────────────────────────────────
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Erro no servidor');
    return res.json() as Promise<Resultado>;
  }

  async function simular() {
    setErro('');
    // Mostra resultado local imediatamente
    const local = calcLocal();
    if (!local) { setErro('Preencha ao menos a renda mensal.'); return; }
    setResultado(local);
    // Depois salva no backend (background)
    if (form.nome || form.email || form.telefone) {
      setLoading(true);
      try { const r = await enviarBackend(); setResultado(r); } catch { /* usa local */ }
      setLoading(false);
    }
  }

  // ── Score color ───────────────────────────────────────────────────────────
  const scoreColor = (s: number) =>
    s >= 800 ? '#16a34a' : s >= 650 ? '#22c55e' : s >= 500 ? '#f59e0b' : '#ef4444';
  const scoreLabel = (s: number) =>
    s >= 800 ? 'Excelente' : s >= 650 ? 'Muito Bom' : s >= 500 ? 'Bom' : 'Regular';

  // ── UI ────────────────────────────────────────────────────────────────────
  if (resultado) {
    return <Resultado resultado={resultado} form={form} onVoltar={() => setResultado(null)} fmt={fmt} pct={pct} scoreColor={scoreColor} scoreLabel={scoreLabel} loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-10 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm mb-4">
            <Calculator className="w-4 h-4" /> Simulador Imobiliário
          </div>
          <h1 className="text-2xl font-bold mb-2">Descubra seu poder de compra</h1>
          <p className="text-primary-100 text-sm">Cálculo instantâneo + comparação com os principais bancos do Brasil</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-400'}`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mb-4 mx-1 transition-colors ${i < step ? 'bg-primary-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* STEP 0 — Renda */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Qual é a sua renda?</h2>
                <p className="text-sm text-gray-500 mt-1">Informe sua renda mensal líquida (depois dos descontos)</p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Renda líquida mensal *</span>
                <input type="text" inputMode="numeric" placeholder="R$ 0,00"
                  value={form.renda_liquida}
                  onChange={e => set('renda_liquida', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Renda extra (opcional)</span>
                <input type="text" inputMode="numeric" placeholder="R$ 0,00"
                  value={form.renda_extra}
                  onChange={e => set('renda_extra', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <span className="text-xs text-gray-400 mt-1">Aluguel, freela, pensão, etc.</span>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Valor do imóvel que busca (opcional)</span>
                <input type="text" inputMode="numeric" placeholder="R$ 0,00"
                  value={form.valor_imovel_desejado}
                  onChange={e => set('valor_imovel_desejado', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </label>
            </div>
          )}

          {/* STEP 1 — Entrada */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Entrada disponível</h2>
                <p className="text-sm text-gray-500 mt-1">Quanto você tem disponível para dar de entrada?</p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Valor da entrada *</span>
                <input type="text" inputMode="numeric" placeholder="R$ 0,00"
                  value={form.entrada}
                  onChange={e => set('entrada', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </label>
              <div className="bg-primary-50 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.usa_fgts} onChange={e => set('usa_fgts', e.target.checked)}
                    className="w-5 h-5 rounded accent-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Vou usar o FGTS</span>
                </label>
                {form.usa_fgts && (
                  <label className="block mt-3">
                    <span className="text-sm font-medium text-gray-700">Saldo do FGTS</span>
                    <input type="text" inputMode="numeric" placeholder="R$ 0,00"
                      value={form.fgts}
                      onChange={e => set('fgts', e.target.value)}
                      className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </label>
                )}
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Prazo desejado</span>
                <select value={form.prazo_anos} onChange={e => set('prazo_anos', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="20">20 anos</option>
                  <option value="25">25 anos</option>
                  <option value="30">30 anos</option>
                  <option value="35">35 anos (máximo)</option>
                </select>
              </label>
            </div>
          )}

          {/* STEP 2 — Perfil */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Seu perfil de emprego</h2>
                <p className="text-sm text-gray-500 mt-1">Isso afeta quais bancos você pode acessar</p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Vínculo empregatício *</span>
                <select value={form.vinculo} onChange={e => set('vinculo', e.target.value as typeof form.vinculo)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="CLT">CLT (empregado registrado)</option>
                  <option value="SERVIDOR">Servidor público</option>
                  <option value="AUTONOMO_COM_IR">Autônomo com declaração de IR</option>
                  <option value="AUTONOMO_SEM_IR">Autônomo sem declaração de IR</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Tempo no emprego atual</span>
                <select value={form.tempo_emprego_meses} onChange={e => set('tempo_emprego_meses', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Selecione</option>
                  <option value="3">Menos de 6 meses</option>
                  <option value="9">6 a 12 meses</option>
                  <option value="18">1 a 2 anos</option>
                  <option value="36">Mais de 2 anos</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Seu score no Serasa (estimado)</span>
                <select value={form.score_serasa_estimado} onChange={e => set('score_serasa_estimado', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Não sei</option>
                  <option value="850">Acima de 800 (Excelente)</option>
                  <option value="720">700 a 800 (Bom)</option>
                  <option value="620">600 a 700 (Regular)</option>
                  <option value="520">500 a 600 (Baixo)</option>
                  <option value="400">Abaixo de 500</option>
                </select>
              </label>
            </div>
          )}

          {/* STEP 3 — Contato */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quase lá!</h2>
                <p className="text-sm text-gray-500 mt-1">Seus dados para receber o resultado completo (opcional)</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 flex gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">Você pode simular sem preencher. Os dados só são usados para salvar seu resultado e conectá-lo a um parceiro especialista.</p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Nome</span>
                <input type="text" placeholder="Seu nome completo"
                  value={form.nome} onChange={e => set('nome', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">E-mail</span>
                <input type="email" placeholder="seu@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                <input type="tel" placeholder="(31) 9 0000-0000"
                  value={form.telefone} onChange={e => set('telefone', e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </label>
            </div>
          )}

          {erro && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
            </div>
          )}

          {/* Navegação */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => { if (step === 0 && !parseBRL(form.renda_liquida)) { setErro('Informe sua renda mensal.'); return; } setErro(''); setStep(s => s + 1); }}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={simular} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
                <Calculator className="w-5 h-5" />
                {loading ? 'Calculando...' : 'Ver meu resultado'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente de resultado ────────────────────────────────────────────────────
function Resultado({ resultado, form, onVoltar, fmt, pct, scoreColor, scoreLabel, loading }: {
  resultado: Resultado; form: any; onVoltar: () => void;
  fmt: (v: number) => string; pct: (v: number) => string;
  scoreColor: (s: number) => string; scoreLabel: (s: number) => string;
  loading: boolean;
}) {
  const sc = resultado.score;
  const arc = (sc / 1000) * 180;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header resultado */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white pt-8 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-sm text-primary-200 mb-2">Score Imobiliário</div>
          {/* Semi-círculo */}
          <div className="relative inline-block mb-2">
            <svg width="180" height="100" viewBox="0 0 180 100">
              <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" strokeLinecap="round" />
              <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="white" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${(arc / 180) * 251} 251`} style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <span className="text-4xl font-black">{sc}</span>
              <span className="text-sm font-bold text-primary-200">{scoreLabel(sc)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-10 space-y-4">
        {/* Card capacidade */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" /> Sua capacidade de compra
          </h3>
          <div className="space-y-0">
            {[
              ['Renda total', fmt(resultado.renda_total), false],
              ['Prestação máxima (30%)', fmt(resultado.pmt_max) + '/mês', false],
              ['Financiamento máximo', fmt(resultado.max_financiamento), false],
              ['Entrada disponível', fmt(resultado.entrada_total), false],
              ['CAPACIDADE TOTAL', fmt(resultado.capacidade_total), true],
            ].map(([l, v, bold]) => (
              <div key={String(l)} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{l}</span>
                <span className={`font-bold ${bold ? 'text-primary-600 text-lg' : 'text-gray-900'}`}>{v}</span>
              </div>
            ))}
          </div>
          {resultado.prestacao_estimada && form.valor_imovel_desejado && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm text-amber-800">
                Para o imóvel de <strong>{fmt(parseFloat((form.valor_imovel_desejado || '0').replace(/\./g, '').replace(',', '.')) || 0)}</strong>,
                a prestação estimada é de <strong>{fmt(resultado.prestacao_estimada)}/mês</strong> (taxa Caixa, {resultado.prazo_anos} anos).
              </p>
            </div>
          )}
        </div>

        {/* Bancos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-500" /> Compatibilidade por banco
          </h3>
          <div className="space-y-3">
            {resultado.bancos.map(banco => (
              <div key={banco.nome} className={`border rounded-xl p-4 ${banco.aprovavel ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{banco.nome}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{banco.destaque}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xl font-black ${banco.aprovavel ? 'text-green-600' : 'text-gray-400'}`}>
                      {banco.compatibilidade}%
                    </div>
                    <div className="text-xs text-gray-500">compatível</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <span>Taxa: <strong>{pct(banco.taxa_aa)}</strong></span>
                  {banco.prestacao_estimada && (
                    <span>Prestação est.: <strong>{fmt(banco.prestacao_estimada)}/mês</strong></span>
                  )}
                </div>
                {banco.motivos.length > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-3 space-y-0.5">
                    {banco.motivos.map(m => <div key={m}>⚠ {m}</div>)}
                  </div>
                )}
                <a href={banco.url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors w-full
                    ${banco.aprovavel
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Simular no {banco.nome}
                </a>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-700 flex gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Os links acima abrem o simulador oficial de cada banco. Use os seus dados (renda: <strong>{fmt(resultado.renda_total)}</strong>, entrada: <strong>{fmt(resultado.entrada_total)}</strong>, prazo: <strong>{resultado.prazo_anos} anos</strong>) para preencher.
            </p>
          </div>
        </div>

        {/* Imóveis no perfil */}
        <Link href="/"
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-colors w-full">
          <Home className="w-5 h-5" />
          Ver imóveis no meu perfil
        </Link>

        <button onClick={onVoltar}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors">
          ← Refazer simulação
        </button>

        {loading && (
          <p className="text-center text-xs text-gray-400">Salvando seu perfil...</p>
        )}
      </div>
    </div>
  );
}
