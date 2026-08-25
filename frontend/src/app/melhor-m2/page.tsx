'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { empreendimentosApi } from '@/lib/api';
import { Ruler } from 'lucide-react';

interface ResultadoM2 {
  empreendimento_id: string;
  empreendimento_nome: string;
  slug: string;
  bairro: string;
  cidade: string;
  estado: string;
  construtora_nome: string;
  unidade_tipo: string;
  unidade_nome: string | null;
  quartos: number;
  vagas: number;
  preco: number;
  metragem_privativa: number;
  area_externa: number;
  area_util: number;
  preco_m2: number;
  imagem: string | null;
}

const TIPOS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'garden', label: 'Garden' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'comercial', label: 'Comercial' },
];

function formatCurrency(v: number) {
  const n = Number(v);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
}

function formatM2(v: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(1).replace('.', ',')} m²`;
}

function BadgeM2({ valor }: { valor: number }) {
  let bg = '#0E8F6E';
  if (valor > 15000) bg = '#b45309';
  else if (valor > 10000) bg = '#d97706';
  else if (valor > 7000) bg = '#0E8F6E';
  else bg = '#059669';

  return (
    <span style={{
      background: bg, color: '#fff', borderRadius: '0.5rem',
      padding: '0.25rem 0.75rem', fontWeight: 700, fontSize: '1rem',
    }}>
      {formatCurrency(valor)}/m²
    </span>
  );
}

export default function MelhorM2Page() {
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [tipo, setTipo] = useState('');
  const [resultados, setResultados] = useState<ResultadoM2[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscou, setBuscou] = useState(false);

  const buscar = useCallback(async () => {
    setLoading(true);
    setBuscou(true);
    try {
      const params: any = {};
      if (cidade.trim()) params.cidade = cidade.trim();
      if (bairro.trim()) params.bairro = bairro.trim();
      if (tipo) params.tipo = tipo;
      const { data } = await empreendimentosApi.melhorM2(params);
      setResultados(data);
    } catch {
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }, [cidade, bairro, tipo]);

  // Carrega tudo ao montar
  useEffect(() => { buscar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      {/* Hero */}
      <div style={{ background: '#04241D', padding: '2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Ruler className="w-6 h-6" style={{ color: '#4ade80' }} />
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
          OPORTUNIDADE POR M²
        </h1>
        <p style={{ color: '#4ade80', marginTop: '0.25rem', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          AS MELHORES OPÇÕES POR VALOR DE M²
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        maxWidth: 900, margin: '0 auto', padding: '1.5rem',
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Cidade</label>
          <input
            value={cidade}
            onChange={e => setCidade(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="Ex: Belo Horizonte"
            style={{
              border: '1.5px solid #e2e8f0', borderRadius: '0.75rem',
              padding: '0.65rem 1rem', fontSize: '0.9rem', outline: 'none',
              background: '#fff',
            }}
          />
        </div>
        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Bairro</label>
          <input
            value={bairro}
            onChange={e => setBairro(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="Ex: Savassi"
            style={{
              border: '1.5px solid #e2e8f0', borderRadius: '0.75rem',
              padding: '0.65rem 1rem', fontSize: '0.9rem', outline: 'none',
              background: '#fff',
            }}
          />
        </div>
        <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Tipo de unidade</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            style={{
              border: '1.5px solid #e2e8f0', borderRadius: '0.75rem',
              padding: '0.65rem 1rem', fontSize: '0.9rem', outline: 'none',
              background: '#fff', cursor: 'pointer',
            }}
          >
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button
          onClick={buscar}
          disabled={loading}
          style={{
            background: 'linear-gradient(90deg, #0E8F6E, #22D497)',
            color: '#fff', border: 'none', borderRadius: '0.75rem',
            padding: '0.65rem 1.75rem', fontWeight: 700, fontSize: '0.9rem',
            cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {/* Resultados */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Calculando os melhores custos por m²…
          </div>
        )}

        {!loading && buscou && resultados.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '3rem',
            background: '#fff', borderRadius: '1rem', color: '#64748b',
          }}>
            Nenhum resultado encontrado. Verifique se os empreendimentos têm unidades com área e preço cadastrados.
          </div>
        )}

        {!loading && resultados.length > 0 && (
          <>
            <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
              {resultados.length} empreendimento{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}, ordenados do menor para o maior custo por m²
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {resultados.map((r, idx) => (
                <Link
                  key={r.empreendimento_id}
                  href={`/imoveis/${r.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    background: '#fff', borderRadius: '1rem',
                    padding: '0.875rem 1rem',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    border: idx === 0 ? '2px solid #22D497' : '1.5px solid #f1f5f9',
                    cursor: 'pointer',
                  }}>
                    {/* Linha 1: ranking + foto + nome + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {/* Ranking */}
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: idx === 0 ? 'linear-gradient(135deg,#22D497,#0E8F6E)' : '#f1f5f9',
                        color: idx === 0 ? '#fff' : '#64748b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.8rem',
                      }}>
                        {idx + 1}
                      </div>

                      {/* Imagem */}
                      {r.imagem ? (
                        <img src={r.imagem} alt={r.empreendimento_nome}
                          style={{ width: 60, height: 48, objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 60, height: 48, borderRadius: '0.5rem', flexShrink: 0,
                          background: '#f1f5f9', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '1.25rem',
                        }}>🏢</div>
                      )}

                      {/* Nome + localização */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.empreendimento_nome}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.construtora_nome} · {r.bairro}{r.bairro && r.cidade ? ', ' : ''}{r.cidade}
                        </div>
                        {idx === 0 && (
                          <span style={{ fontSize: '0.68rem', color: '#22D497', fontWeight: 600 }}>✦ Melhor custo-benefício</span>
                        )}
                      </div>

                      {/* Badge m² */}
                      <div style={{ flexShrink: 0 }}>
                        <BadgeM2 valor={r.preco_m2} />
                      </div>
                    </div>

                    {/* Linha 2: specs + preço */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginTop: '0.5rem', paddingTop: '0.5rem',
                      borderTop: '1px solid #f1f5f9', gap: '0.5rem', flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', fontSize: '0.72rem', color: '#94a3b8' }}>
                        <span>📐 {formatM2(r.metragem_privativa)}{r.area_externa > 0 ? ` + ${formatM2(r.area_externa)}` : ''}</span>
                        {r.quartos > 0 && <span>🛏 {r.quartos} qto{r.quartos > 1 ? 's' : ''}</span>}
                        {r.vagas > 0 && <span>🚗 {r.vagas} vaga{r.vagas > 1 ? 's' : ''}</span>}
                        <span style={{ textTransform: 'capitalize', color: '#cbd5e1' }}>{r.unidade_tipo}</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', flexShrink: 0 }}>
                        {formatCurrency(r.preco)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
