'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
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
  busca?: string;
}

interface Props {
  onBuscar: (filtros: Filtros) => void;
  loading?: boolean;
}

const PRECO_MAX_ABS = 10_000_000;

const ESTAGIOS = [
  { label: 'Na Planta',     value: 'lancamento' },
  { label: 'Em Construção', value: 'em_obras'   },
  { label: 'Pronto',        value: 'pronto'     },
];
const SUITES_OPT  = [{ label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4+', value: 4 }];
const VAGAS_OPT   = [{ label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3+', value: 3 }];

const TIPOS_IMOVEL = [
  { label: 'Apartamento', value: 'apartamento' },
  { label: 'Cobertura',   value: 'cobertura'   },
  { label: 'Garden',      value: 'garden'      },
  { label: 'Duplex',      value: 'duplex'      },
  { label: 'Studio',      value: 'studio'      },
  { label: 'Comercial',   value: 'comercial'   },
];

const AREAS_OPT = [
  { label: '50 m²',  value: 50  },
  { label: '75 m²',  value: 75  },
  { label: '100 m²', value: 100 },
  { label: '150 m²', value: 150 },
  { label: '200 m²', value: 200 },
];

const AMENIDADES = [
  { label: 'Piscina',         value: 'piscina'        },
  { label: 'Academia',        value: 'academia'       },
  { label: 'Churrasqueira',   value: 'churrasqueira'  },
  { label: 'Salão de Festas', value: 'salão de festas'},
  { label: 'Playground',      value: 'playground'     },
  { label: 'Quadra',          value: 'quadra'         },
  { label: 'Spa',             value: 'spa'            },
  { label: 'Coworking',       value: 'coworking'      },
  { label: 'Pet Friendly',    value: 'pet'            },
  { label: 'Área Gourmet',    value: 'gourmet'        },
  { label: 'Varanda',         value: 'varanda'        },
  { label: 'Garden',          value: 'garden'         },
  { label: 'Portaria 24h',    value: 'portaria'       },
  { label: 'Elevador',        value: 'elevador'       },
];

function fmtPreco(v: number) {
  if (v >= 1_000_000) { const n = v / 1_000_000; return `R$${n % 1 === 0 ? n : n.toFixed(1)}M`; }
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return 'R$0';
}

/* ─── Pill ───────────────────────────────────────────────────────────────── */
function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', border: 'none', transition: 'all 0.15s',
      background: selected ? '#04241D' : '#ede9e2',
      color: selected ? '#fff' : '#374151',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  );
}

/* ─── Slider duplo ───────────────────────────────────────────────────────── */
function RangeSlider({ min, max, onMin, onMax }: { min: number; max: number; onMin: (v: number) => void; onMax: (v: number) => void }) {
  const minPct = (min / PRECO_MAX_ABS) * 100;
  const maxPct = (max / PRECO_MAX_ABS) * 100;
  return (
    <div>
      <div style={{ position: 'relative', height: 4, background: '#e8e4dc', borderRadius: 4, margin: '14px 0' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${minPct}%`, width: `${maxPct - minPct}%`, background: '#04241D', borderRadius: 4 }} />
        <input type="range" min={0} max={PRECO_MAX_ABS} step={50_000} value={min}
          onChange={e => { const v = Number(e.target.value); if (v < max) onMin(v); }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', zIndex: 2 }} />
        <input type="range" min={0} max={PRECO_MAX_ABS} step={50_000} value={max}
          onChange={e => { const v = Number(e.target.value); if (v > min) onMax(v); }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', zIndex: 3 }} />
        {[minPct, maxPct].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: `${pct}%`,
            transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: '50%',
            background: '#fff', border: '2.5px solid #04241D',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)', zIndex: 1, pointerEvents: 'none',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
        <span>{min === 0 ? 'R$0' : fmtPreco(min)}</span>
        <span>{max >= PRECO_MAX_ABS ? 'R$10M+' : fmtPreco(max)}</span>
      </div>
      {min === 0 && max >= PRECO_MAX_ABS && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Sob Consulta</p>}
    </div>
  );
}

/* ─── Label de seção ─────────────────────────────────────────────────────── */
function SL({ title }: { title: string }) {
  return <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '18px 0 10px' }}>{title}</p>;
}

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function FiltrosBusca({ onBuscar, loading }: Props) {
  const [open, setOpen]           = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);

  // filtros principais
  const [cidadeSel, setCidadeSel] = useState('');
  const [estadoSel, setEstadoSel] = useState('');
  const [suites, setSuites]       = useState<number | undefined>();
  const [vagas, setVagas]         = useState<number | undefined>();
  const [estagios, setEstagios]   = useState<string[]>([]);
  const [precoMin, setPrecoMin]   = useState(0);
  const [precoMax, setPrecoMax]   = useState(PRECO_MAX_ABS);

  // mais filtros
  const [tipo, setTipo]           = useState('');
  const [areaMin, setAreaMin]     = useState<number | undefined>();
  const [amenidade, setAmenidade] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const ativos = [
    cidadeSel, suites, vagas,
    estagios.length > 0 ? true : undefined,
    precoMin > 0 || precoMax < PRECO_MAX_ABS ? true : undefined,
    tipo, areaMin, amenidade,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open, mounted]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const toggleEstag = (v: string) =>
    setEstagios(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);

  const aplicar = useCallback(() => {
    onBuscar({
      cidade:      cidadeSel || undefined,
      estado:      estadoSel || undefined,
      quartos_min: suites,
      vagas,
      status:      estagios.length === 1 ? estagios[0] : undefined,
      preco_min:   precoMin > 0 ? precoMin : undefined,
      preco_max:   precoMax < PRECO_MAX_ABS ? precoMax : undefined,
      tipo:        tipo || undefined,
      area_min:    areaMin,
      busca:       amenidade || undefined,
    });
    setOpen(false);
  }, [cidadeSel, estadoSel, suites, vagas, estagios, precoMin, precoMax, tipo, areaMin, amenidade, onBuscar]);

  const limpar = () => {
    setCidadeSel(''); setEstadoSel('');
    setSuites(undefined); setVagas(undefined); setEstagios([]);
    setPrecoMin(0); setPrecoMax(PRECO_MAX_ABS);
    setTipo(''); setAreaMin(undefined); setAmenidade('');
    onBuscar({});
    setOpen(false);
  };

  const portal = mounted ? createPortal(
    <>
      {/* Overlay */}
      <div onClick={() => setOpen(false)} style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.45)', zIndex: 99998,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.3s',
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <div style={{
          maxWidth: 480, margin: '0 auto',
          background: '#faf9f6', borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 60px)',
        }}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#d1cec7' }} />
          </div>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 20px 12px', borderBottom: '1px solid #e8e4dc', flexShrink: 0,
          }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Filtros</span>
            <button type="button" onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* Conteúdo — minHeight:0 é essencial para o flex não vazar */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 20px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

            <SL title="Localização" />
            <AutocompleteCidade value={cidadeSel}
              onChange={(c, e) => { setCidadeSel(c); setEstadoSel(e); }}
              placeholder="Cidade, bairro ou estado..." />

            <SL title="Suítes" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SUITES_OPT.map(o => (
                <Pill key={o.value} label={o.label} selected={suites === o.value}
                  onClick={() => setSuites(suites === o.value ? undefined : o.value)} />
              ))}
            </div>

            <SL title="Vagas" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {VAGAS_OPT.map(o => (
                <Pill key={o.value} label={o.label} selected={vagas === o.value}
                  onClick={() => setVagas(vagas === o.value ? undefined : o.value)} />
              ))}
            </div>

            <SL title="Estágio" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ESTAGIOS.map(e => (
                <Pill key={e.value} label={e.label} selected={estagios.includes(e.value)}
                  onClick={() => toggleEstag(e.value)} />
              ))}
            </div>

            <SL title="Investimento" />
            <RangeSlider min={precoMin} max={precoMax} onMin={setPrecoMin} onMax={setPrecoMax} />

            {/* ── Mais filtros ── */}
            <div style={{ margin: '20px 0 0', borderTop: '1px solid #e8e4dc', paddingTop: 4 }}>
              <button
                type="button"
                onClick={() => setMaisAberto(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '12px 0',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                  Mais filtros
                  {(tipo || areaMin || amenidade) && (
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontWeight: 700,
                      background: '#04241D', color: '#fff',
                      padding: '2px 7px', borderRadius: 10,
                    }}>
                      {[tipo, areaMin, amenidade].filter(Boolean).length}
                    </span>
                  )}
                </span>
                {maisAberto
                  ? <ChevronUp size={16} color="#9CA3AF" />
                  : <ChevronDown size={16} color="#9CA3AF" />}
              </button>

              {maisAberto && (
                <div>
                  <SL title="Tipo de imóvel" />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TIPOS_IMOVEL.map(t => (
                      <Pill key={t.value} label={t.label}
                        selected={tipo === t.value}
                        onClick={() => setTipo(tipo === t.value ? '' : t.value)} />
                    ))}
                  </div>

                  <SL title="Área mínima" />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {AREAS_OPT.map(a => (
                      <Pill key={a.value} label={a.label}
                        selected={areaMin === a.value}
                        onClick={() => setAreaMin(areaMin === a.value ? undefined : a.value)} />
                    ))}
                  </div>

                  <SL title="Características e lazer" />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {AMENIDADES.map(a => (
                      <Pill key={a.value} label={a.label}
                        selected={amenidade === a.value}
                        onClick={() => setAmenidade(amenidade === a.value ? '' : a.value)} />
                    ))}
                  </div>

                  <div style={{ height: 8 }} />
                </div>
              )}
            </div>

            <div style={{ height: 12 }} />
          </div>

          {/* Footer — sempre visível */}
          <div style={{
            padding: '14px 20px 28px', display: 'flex', gap: 10,
            borderTop: '1px solid #e8e4dc', background: '#faf9f6', flexShrink: 0,
          }}>
            {ativos > 0 && (
              <button type="button" onClick={limpar} style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                border: '1.5px solid #e8e4dc', background: 'transparent',
                fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}>
                Limpar
              </button>
            )}
            <button type="button" onClick={aplicar} disabled={loading} style={{
              flex: ativos > 0 ? 2 : 1, padding: '14px 0', borderRadius: 14,
              border: 'none', background: '#04241D',
              fontSize: 14, fontWeight: 700, color: '#fff',
              cursor: 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Buscando...' : 'Aplicar Filtros'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      {/* Trigger — mesmo estilo do botão antigo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
        <button type="button" onClick={() => setOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 20px',
          background: 'linear-gradient(90deg, #0E8F6E, #22D497)',
          color: '#fff', fontSize: 12, fontWeight: 700,
          borderRadius: 8, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          {open ? 'Ocultar filtros' : 'Filtros tradicionais'}
          {ativos > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800,
              width: 16, height: 16, borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ativos}
            </span>
          )}
        </button>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
      </div>

      {portal}
    </>
  );
}
