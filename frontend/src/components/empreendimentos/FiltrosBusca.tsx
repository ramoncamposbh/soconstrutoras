'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import AutocompleteCidade from './AutocompleteCidade';

/* ─── tipos ─────────────────────────────────────────────────────────────── */
interface Filtros {
  cidade?: string;
  estado?: string;
  tipo?: string;
  preco_min?: number;
  preco_max?: number;
  quartos_min?: number;
  vagas?: number;
  area_min?: number;
  status?: string;
}

interface Props {
  onBuscar: (filtros: Filtros) => void;
  loading?: boolean;
}

/* ─── constantes ─────────────────────────────────────────────────────────── */
const PRECO_MAX_ABS = 10_000_000;

const ESTAGIOS = [
  { label: 'Na Planta',    value: 'lancamento' },
  { label: 'Em Construção', value: 'em_obras'  },
  { label: 'Pronto',       value: 'pronto'     },
];

const SUITES_OPT = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4+', value: 4 },
];

const VAGAS_OPT = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3+', value: 3 },
];

/* ─── helpers ────────────────────────────────────────────────────────────── */
function fmtPreco(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000 % 1 === 0 ? v / 1_000_000 : (v / 1_000_000).toFixed(1))}M`;
  if (v >= 1_000)    return `R$${(v / 1_000).toFixed(0)}K`;
  return `R$0`;
}

/* ─── Acordeão ───────────────────────────────────────────────────────────── */
function Section({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #e8e4dc' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '14px 0',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</span>
        {open
          ? <ChevronUp size={16} color="#9CA3AF" />
          : <ChevronDown size={16} color="#9CA3AF" />}
      </button>
      {open && <div style={{ paddingBottom: 16 }}>{children}</div>}
    </div>
  );
}

/* ─── Pill selector ──────────────────────────────────────────────────────── */
function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 16px', borderRadius: 20,
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer', border: 'none', transition: 'all 0.15s',
        background: selected ? '#04241D' : '#f0ede8',
        color: selected ? '#fff' : '#374151',
      }}
    >
      {label}
    </button>
  );
}

/* ─── Slider duplo (investimento) ────────────────────────────────────────── */
function RangeSlider({ min, max, onMin, onMax }: {
  min: number; max: number; onMin: (v: number) => void; onMax: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const minPct = (min / PRECO_MAX_ABS) * 100;
  const maxPct = (max / PRECO_MAX_ABS) * 100;

  return (
    <div style={{ padding: '4px 0 8px' }}>
      {/* Track */}
      <div ref={trackRef} style={{ position: 'relative', height: 4, background: '#e8e4dc', borderRadius: 4, margin: '12px 0' }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${minPct}%`, width: `${maxPct - minPct}%`,
          background: '#04241D', borderRadius: 4,
        }} />
        {/* Min thumb */}
        <input
          type="range" min={0} max={PRECO_MAX_ABS} step={50_000} value={min}
          onChange={e => { const v = Number(e.target.value); if (v < max) onMin(v); }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', zIndex: 2 }}
        />
        {/* Max thumb */}
        <input
          type="range" min={0} max={PRECO_MAX_ABS} step={50_000} value={max}
          onChange={e => { const v = Number(e.target.value); if (v > min) onMax(v); }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', zIndex: 3 }}
        />
        {/* Thumbs visuais */}
        <div style={{
          position: 'absolute', top: '50%', left: `${minPct}%`,
          transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', border: '2.5px solid #04241D',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)', zIndex: 1, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${maxPct}%`,
          transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', border: '2.5px solid #04241D',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)', zIndex: 1, pointerEvents: 'none',
        }} />
      </div>
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
        <span>{min === 0 ? 'R$0' : fmtPreco(min)}</span>
        <span>{max >= PRECO_MAX_ABS ? 'R$10M+' : fmtPreco(max)}</span>
      </div>
      {min === 0 && max >= PRECO_MAX_ABS && (
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Sob Consulta</p>
      )}
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function FiltrosBusca({ onBuscar, loading }: Props) {
  const [open, setOpen] = useState(false);

  // Estado dos filtros
  const [cidadeSel, setCidadeSel]   = useState('');
  const [estadoSel, setEstadoSel]   = useState('');
  const [suites, setSuites]         = useState<number | undefined>();
  const [vagas, setVagas]           = useState<number | undefined>();
  const [estagios, setEstagios]     = useState<string[]>([]);
  const [precoMin, setPrecoMin]     = useState(0);
  const [precoMax, setPrecoMax]     = useState(PRECO_MAX_ABS);

  // Contagem de filtros ativos (para badge)
  const ativos = [
    cidadeSel,
    suites,
    vagas,
    estagios.length > 0 ? true : undefined,
    precoMin > 0 || precoMax < PRECO_MAX_ABS ? true : undefined,
  ].filter(Boolean).length;

  const toggleEstag = (v: string) =>
    setEstagios(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);

  const aplicar = useCallback(() => {
    onBuscar({
      cidade: cidadeSel || undefined,
      estado: estadoSel || undefined,
      quartos_min: suites,
      vagas: vagas,
      status: estagios.length === 1 ? estagios[0] : undefined,
      preco_min: precoMin > 0 ? precoMin : undefined,
      preco_max: precoMax < PRECO_MAX_ABS ? precoMax : undefined,
    });
    setOpen(false);
  }, [cidadeSel, estadoSel, suites, vagas, estagios, precoMin, precoMax, onBuscar]);

  const limpar = () => {
    setCidadeSel(''); setEstadoSel('');
    setSuites(undefined); setVagas(undefined);
    setEstagios([]); setPrecoMin(0); setPrecoMax(PRECO_MAX_ABS);
    onBuscar({});
    setOpen(false);
  };

  // Fechar com Esc
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  return (
    <>
      {/* ── Trigger bar ─────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 24,
          background: '#fff', border: '1.5px solid #e8e4dc',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          fontSize: 14, fontWeight: 600, color: '#111827',
          cursor: 'pointer', transition: 'border-color 0.15s',
        }}
      >
        <SlidersHorizontal size={16} color="#0E8F6E" />
        Filtros
        {ativos > 0 && (
          <span style={{
            background: '#04241D', color: '#fff',
            fontSize: 11, fontWeight: 700,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {ativos}
          </span>
        )}
      </button>

      {/* ── Overlay ──────────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 998, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Drawer ───────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 999,
        background: '#faf9f6',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        /* Desktop: limita largura e centraliza */
        maxWidth: 480,
        margin: '0 auto',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#d1cec7' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 12px',
          borderBottom: '1px solid #e8e4dc',
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Filtros</span>
          <button
            type="button" onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6B7280' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>

          {/* Localização */}
          <Section title="Localização">
            <AutocompleteCidade
              value={cidadeSel}
              onChange={(cidade, estado) => { setCidadeSel(cidade); setEstadoSel(estado); }}
              placeholder="Cidade, bairro ou estado..."
            />
          </Section>

          {/* Suítes */}
          <Section title="Suítes">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SUITES_OPT.map(o => (
                <Pill
                  key={o.value}
                  label={o.label}
                  selected={suites === o.value}
                  onClick={() => setSuites(suites === o.value ? undefined : o.value)}
                />
              ))}
            </div>
          </Section>

          {/* Vagas */}
          <Section title="Vagas" defaultOpen={false}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {VAGAS_OPT.map(o => (
                <Pill
                  key={o.value}
                  label={o.label}
                  selected={vagas === o.value}
                  onClick={() => setVagas(vagas === o.value ? undefined : o.value)}
                />
              ))}
            </div>
          </Section>

          {/* Estágio */}
          <Section title="Estágio" defaultOpen={false}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ESTAGIOS.map(e => (
                <Pill
                  key={e.value}
                  label={e.label}
                  selected={estagios.includes(e.value)}
                  onClick={() => toggleEstag(e.value)}
                />
              ))}
            </div>
          </Section>

          {/* Investimento */}
          <Section title="Investimento" defaultOpen={false}>
            <RangeSlider
              min={precoMin} max={precoMax}
              onMin={setPrecoMin} onMax={setPrecoMax}
            />
          </Section>

        </div>

        {/* Footer — botões */}
        <div style={{
          padding: '14px 20px 24px',
          display: 'flex', gap: 10,
          borderTop: '1px solid #e8e4dc',
          background: '#faf9f6',
        }}>
          {ativos > 0 && (
            <button
              type="button" onClick={limpar}
              style={{
                flex: 1, padding: '14px 0',
                borderRadius: 14, border: '1.5px solid #e8e4dc',
                background: 'transparent', fontSize: 14,
                fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}
            >
              Limpar
            </button>
          )}
          <button
            type="button" onClick={aplicar} disabled={loading}
            style={{
              flex: ativos > 0 ? 2 : 1, padding: '14px 0',
              borderRadius: 14, border: 'none',
              background: '#04241D', fontSize: 14,
              fontWeight: 700, color: '#fff', cursor: 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Buscando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </div>
    </>
  );
}
