'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { empreendimentosApi } from '@/lib/api';
import {
  ArrowLeft, Building2, Check, ChevronRight,
  Loader2, Minus, Plus, Scale, Search, X,
} from 'lucide-react';

/* ── Tipos ───────────────────────────────────────────────────────────── */
interface Emp {
  id: string;
  nome: string;
  slug: string;
  construtora: string;
  cidade: string;
  bairro?: string;
  estado?: string;
  status: string;
  descricao?: string;
  fotos?: string[];
  quartos_min?: number;
  quartos_max?: number;
  vagas?: number;
  area_min?: number;
  area_max?: number;
  preco_min?: number;
  preco_max?: number;
}

/* ── Constantes ──────────────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  lancamento: 'Na planta',
  em_obras:   'Em construção',
  pronto:     'Pronto para morar',
};

const AMENIDADES = [
  { key: 'piscina',       label: 'Piscina' },
  { key: 'academia',      label: 'Academia' },
  { key: 'quadra',        label: 'Quadra' },
  { key: 'salao',         label: 'Salão de festas' },
  { key: 'playground',    label: 'Playground' },
  { key: 'churrasqueira', label: 'Churrasqueira' },
  { key: 'varanda',       label: 'Varanda' },
  { key: 'portaria',      label: 'Portaria 24h' },
  { key: 'coworking',     label: 'Coworking' },
  { key: 'rooftop',       label: 'Rooftop' },
];

/* Cores zebra */
const ROW_EVEN = '#ffffff';
const ROW_ODD  = '#f0fdf4'; // verde bem claro (Tailwind green-50)

/* ── Utilitários ─────────────────────────────────────────────────────── */
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function temAmenidade(emp: Emp, key: string): boolean {
  return norm(emp.descricao ?? '').includes(norm(key));
}

function precoM2(emp: Emp): number | null {
  if (!emp.preco_min || !emp.area_min) return null;
  return Math.round(emp.preco_min / emp.area_min);
}

function fmtMoeda(v: number): string {
  if (v >= 1_000_000)
    return `R$ ${(v / 1_000_000).toFixed(2).replace('.', ',')} mi`;
  return `R$ ${v.toLocaleString('pt-BR')}`;
}

function fmtArea(min?: number, max?: number): string | null {
  if (!min) return null;
  if (!max || min === max) return `${min} m²`;
  return `${min}–${max} m²`;
}

function fmtQuartos(min?: number, max?: number): string | null {
  if (!min) return null;
  if (!max || min === max) return `${min}`;
  return `${min}–${max}`;
}

/* ── Sub-componentes ─────────────────────────────────────────────────── */
function SectionRow({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <td
        colSpan={cols + 1}
        style={{
          padding: '6px 14px',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6b7280',
          background: '#f3f4f6',
          borderTop: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        {label}
      </td>
    </tr>
  );
}

function DataRow({
  label, values, ids, bestId, bestLabel, even,
}: {
  label: string;
  values: (string | null)[];
  ids: (string | null)[];
  bestId?: string | null;
  bestLabel?: string;
  even: boolean;
}) {
  const rowBg = even ? ROW_EVEN : ROW_ODD;
  return (
    <tr>
      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: '#4b5563', background: rowBg, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
        {label}
        {bestLabel && bestId && (
          <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#fff', background: '#0E8F6E', borderRadius: 4, padding: '1px 6px', display: 'inline-block' }}>
            {bestLabel}
          </span>
        )}
      </td>
      {values.map((v, i) => {
        const isBest = !!(bestId && ids[i] && ids[i] === bestId);
        return (
          <td
            key={i}
            style={{
              padding: '10px 10px',
              fontSize: 12,
              textAlign: 'center',
              borderBottom: '1px solid #e5e7eb',
              verticalAlign: 'middle',
              background: isBest ? '#dcfce7' : rowBg,
              color: isBest ? '#15803d' : '#374151',
              fontWeight: isBest ? 700 : 400,
            }}
          >
            {v != null ? v : <span style={{ color: '#d1d5db' }}>—</span>}
          </td>
        );
      })}
    </tr>
  );
}

function AmenidadeRow({ label, slots, amenidadeKey, even }: {
  label: string;
  slots: (Emp | null)[];
  amenidadeKey: string;
  even: boolean;
}) {
  const rowBg = even ? ROW_EVEN : ROW_ODD;
  return (
    <tr>
      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: '#4b5563', background: rowBg, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
        {label}
      </td>
      {slots.map((emp, i) => (
        <td key={i} style={{ padding: '10px 10px', textAlign: 'center', background: rowBg, borderBottom: '1px solid #e5e7eb' }}>
          {emp ? (
            temAmenidade(emp, amenidadeKey) ? (
              <Check style={{ width: 15, height: 15, margin: '0 auto', color: '#0E8F6E' }} />
            ) : (
              <Minus style={{ width: 15, height: 15, margin: '0 auto', color: '#d1d5db' }} />
            )
          ) : null}
        </td>
      ))}
    </tr>
  );
}

/* ── Componente principal ─────────────────────────────────────────────── */
function CompararInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [todos,    setTodos]    = useState<Emp[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [busca,    setBusca]    = useState('');
  const [modal,    setModal]    = useState(false);

  useEffect(() => {
    empreendimentosApi.buscarPublico({})
      .then(r => setTodos(Array.isArray(r.data) ? r.data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) setSelected(ids.split(',').filter(Boolean).slice(0, 4));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = selected.length ? `?ids=${selected.join(',')}` : '';
    router.replace(`/comparar${q}`, { scroll: false });
  }, [selected, router]);

  const empsSelecionados = useMemo(
    () => selected.map(id => todos.find(e => e.id === id)).filter(Boolean) as Emp[],
    [selected, todos],
  );

  const slots: (Emp | null)[] = [
    ...empsSelecionados,
    ...Array(4 - empsSelecionados.length).fill(null),
  ];
  const ids = slots.map(e => e?.id ?? null);

  /* Melhores valores */
  const bestPrecoM2 = useMemo(() => {
    const vals = empsSelecionados.map(e => ({ id: e.id, v: precoM2(e) })).filter(x => x.v != null);
    if (vals.length < 2) return null;
    return vals.reduce((a, b) => (a.v! < b.v! ? a : b)).id;
  }, [empsSelecionados]);

  const bestArea = useMemo(() => {
    const vals = empsSelecionados.map(e => ({ id: e.id, v: e.area_max ?? e.area_min })).filter(x => x.v);
    if (vals.length < 2) return null;
    return vals.reduce((a, b) => (a.v! > b.v! ? a : b)).id;
  }, [empsSelecionados]);

  const bestPreco = useMemo(() => {
    const vals = empsSelecionados.map(e => ({ id: e.id, v: e.preco_min })).filter(x => x.v);
    if (vals.length < 2) return null;
    return vals.reduce((a, b) => (a.v! < b.v! ? a : b)).id;
  }, [empsSelecionados]);

  const bestQuartos = useMemo(() => {
    const vals = empsSelecionados.map(e => ({ id: e.id, v: e.quartos_max ?? e.quartos_min })).filter(x => x.v);
    if (vals.length < 2) return null;
    return vals.reduce((a, b) => (a.v! > b.v! ? a : b)).id;
  }, [empsSelecionados]);

  /* Lista para o modal */
  const filtrados = useMemo(() => {
    const disponivel = todos.filter(e => !selected.includes(e.id));
    if (!busca.trim()) return disponivel;
    const t = norm(busca);
    return disponivel.filter(e =>
      [e.nome, e.construtora, e.cidade, e.bairro].some(v => v && norm(v).includes(t))
    );
  }, [todos, selected, busca]);

  const addEmp = (id: string) => {
    if (selected.length >= 4) return;
    setSelected(prev => [...prev, id]);
    setModal(false);
    setBusca('');
  };
  const removeEmp = (id: string) => setSelected(prev => prev.filter(i => i !== id));

  /* Contador de linhas de dados para zebra */
  let rowIdx = 0;

  return (
    <div className="min-h-screen" style={{ background: '#faf9f6' }}>

      {/* Header */}
      <div style={{ background: '#0B1D2A', borderBottom: '1px solid #1A3547' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm" style={{ color: '#AAB5B2', textDecoration: 'none' }}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <Scale className="w-5 h-5" style={{ color: '#22D497' }} />
            <h1 className="text-white font-semibold text-base">Comparar empreendimentos</h1>
          </div>
          <span className="text-xs ml-auto hidden sm:block" style={{ color: '#718C84' }}>
            Selecione até 4 empreendimentos para comparar lado a lado
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0E8F6E' }} />
          </div>
        ) : (
          <>
            {/* Contador + botão */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{empsSelecionados.length}</span> de <span className="font-semibold text-gray-900">4</span> empreendimentos selecionados
              </p>
              {empsSelecionados.length < 4 && (
                <button
                  onClick={() => setModal(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white"
                  style={{ background: '#0E8F6E' }}
                >
                  <Plus className="w-4 h-4" /> Adicionar empreendimento
                </button>
              )}
            </div>

            {empsSelecionados.length === 0 ? (
              <div className="card p-16 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#e8f5f0' }}>
                  <Scale className="w-8 h-8" style={{ color: '#0E8F6E' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg mb-1">Nenhum empreendimento selecionado</p>
                  <p className="text-sm text-gray-500">Adicione empreendimentos para comparar preço, área, quartos e características lado a lado.</p>
                </div>
                <button
                  onClick={() => setModal(true)}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
                  style={{ background: '#0E8F6E' }}
                >
                  <Plus className="w-4 h-4" /> Adicionar primeiro empreendimento
                </button>
              </div>
            ) : (
              <>
                {/* Tabela */}
                <div className="card" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                  <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse' }}>
                    <colgroup>
                      <col style={{ width: 110 }} />
                      <col style={{ width: 135 }} />
                      <col style={{ width: 135 }} />
                      <col style={{ width: 135 }} />
                      <col style={{ width: 135 }} />
                    </colgroup>

                    {/* Cabeçalho */}
                    <thead>
                      <tr>
                        <th style={{ padding: 10, borderBottom: '2px solid #e5e7eb', background: '#fff' }} />
                        {slots.map((emp, i) => (
                          <th key={i} style={{ padding: 10, borderBottom: '2px solid #e5e7eb', textAlign: 'center', verticalAlign: 'top', background: '#fff' }}>
                            {emp ? (
                              <div>
                                <div style={{ height: 80, borderRadius: 10, overflow: 'hidden', background: '#e8f5f0', position: 'relative', marginBottom: 8 }}>
                                  {emp.fotos?.[0] ? (
                                    <Image src={emp.fotos[0]} alt={emp.nome} fill style={{ objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Building2 style={{ width: 28, height: 28, color: '#0E8F6E' }} />
                                    </div>
                                  )}
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 600, color: '#111827', marginBottom: 2, lineHeight: 1.3 }}>{emp.nome}</p>
                                <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>{emp.construtora}</p>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#e8f5f0', color: '#0E8F6E', fontWeight: 500, display: 'inline-block', marginBottom: 6 }}>
                                  {STATUS_LABEL[emp.status] ?? emp.status}
                                </span>
                                <button onClick={() => removeEmp(emp.id)} style={{ display: 'block', margin: '0 auto', fontSize: 10, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                                  ✕ remover
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div
                                  onClick={() => setModal(true)}
                                  style={{ height: 80, borderRadius: 10, border: '2px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 8 }}
                                >
                                  <Plus style={{ width: 18, height: 18, color: '#9ca3af', marginBottom: 4 }} />
                                  <span style={{ fontSize: 10, color: '#9ca3af' }}>Adicionar</span>
                                </div>
                                <p style={{ fontSize: 10, color: '#9ca3af' }}>{i + 1}º empreendimento</p>
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {/* Localização */}
                      <SectionRow label="Localização" cols={4} />
                      <DataRow even={rowIdx++ % 2 === 0} label="Cidade"  values={slots.map(e => e?.cidade ?? null)} ids={ids} />
                      <DataRow even={rowIdx++ % 2 === 0} label="Bairro"  values={slots.map(e => e?.bairro ?? null)} ids={ids} />
                      <DataRow even={rowIdx++ % 2 === 0} label="Estado"  values={slots.map(e => e?.estado ?? null)} ids={ids} />

                      {/* Unidades */}
                      <SectionRow label="Unidades disponíveis" cols={4} />
                      <DataRow even={rowIdx++ % 2 === 0} label="Quartos" values={slots.map(e => e ? fmtQuartos(e.quartos_min, e.quartos_max) : null)} ids={ids} bestId={bestQuartos} bestLabel="mais quartos" />
                      <DataRow even={rowIdx++ % 2 === 0} label="Vagas"   values={slots.map(e => e?.vagas != null ? `${e.vagas}` : null)} ids={ids} />
                      <DataRow even={rowIdx++ % 2 === 0} label="Área"    values={slots.map(e => e ? fmtArea(e.area_min, e.area_max) : null)} ids={ids} bestId={bestArea} bestLabel="maior área" />

                      {/* Preço */}
                      <SectionRow label="Preço" cols={4} />
                      <DataRow even={rowIdx++ % 2 === 0} label="A partir de" values={slots.map(e => e?.preco_min ? fmtMoeda(e.preco_min) : null)} ids={ids} bestId={bestPreco} bestLabel="menor preço" />
                      <DataRow
                        even={rowIdx++ % 2 === 0}
                        label="Preço por m²"
                        values={slots.map(e => { const v = e ? precoM2(e) : null; return v != null ? `R$ ${v.toLocaleString('pt-BR')}/m²` : null; })}
                        ids={ids}
                        bestId={bestPrecoM2}
                        bestLabel="melhor m²"
                      />

                      {/* Características */}
                      <SectionRow label="Características" cols={4} />
                      {AMENIDADES.map(({ key, label }) => (
                        <AmenidadeRow key={key} even={rowIdx++ % 2 === 0} label={label} slots={slots} amenidadeKey={key} />
                      ))}

                      {/* CTAs */}
                      <tr>
                        <td style={{ padding: 12, borderTop: '2px solid #e5e7eb' }} />
                        {slots.map((emp, i) => (
                          <td key={i} style={{ padding: 12, borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
                            {emp && (
                              <Link
                                href={`/imoveis/${emp.slug}`}
                                style={{ display: 'block', padding: '8px 12px', borderRadius: 10, background: '#0E8F6E', color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}
                              >
                                Ver empreendimento <ChevronRight style={{ width: 12, height: 12, display: 'inline', verticalAlign: -2 }} />
                              </Link>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Legenda */}
                <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                    <span style={{ width: 16, height: 12, borderRadius: 3, background: ROW_ODD, border: '1px solid #d1d5db', display: 'inline-block' }} />
                    Linha alternada
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                    <span style={{ width: 16, height: 12, borderRadius: 3, background: '#dcfce7', border: '1px solid #d1d5db', display: 'inline-block' }} />
                    Melhor valor na categoria
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                    <Check style={{ width: 12, height: 12, color: '#0E8F6E' }} />
                    Característica disponível
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                    <Minus style={{ width: 12, height: 12, color: '#d1d5db' }} />
                    Não informado / indisponível
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal de busca */}
      {modal && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={() => { setModal(false); setBusca(''); }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por nome, construtora ou cidade..."
                  className="flex-1 outline-none text-sm text-gray-800"
                />
                <button onClick={() => { setModal(false); setBusca(''); }} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                {filtrados.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center px-4">
                    <Building2 className="w-8 h-8 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">{busca ? 'Nenhum empreendimento encontrado.' : 'Carregando...'}</p>
                  </div>
                ) : (
                  filtrados.slice(0, 30).map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => addEmp(emp.id)}
                      className="w-full text-left px-4 py-3 border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: '#e8f5f0' }}>
                        <Building2 className="w-5 h-5" style={{ color: '#0E8F6E' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{emp.nome}</p>
                        <p className="text-xs text-gray-500">{emp.construtora} · {emp.cidade}{emp.bairro ? ` · ${emp.bairro}` : ''}</p>
                      </div>
                      <Plus className="w-4 h-4 shrink-0" style={{ color: '#0E8F6E' }} />
                    </button>
                  ))
                )}
              </div>
              {selected.length >= 4 && (
                <div className="px-4 py-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-amber-600">Limite de 4 empreendimentos atingido. Remova um para adicionar outro.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CompararPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf9f6' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0E8F6E' }} />
      </div>
    }>
      <CompararInner />
    </Suspense>
  );
}
