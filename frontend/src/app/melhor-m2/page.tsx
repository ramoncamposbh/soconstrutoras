'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { empreendimentosApi } from '@/lib/api';

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
      <div style={{
        background: 'linear-gradient(135deg, #04241D 0%, #0D2B22 60%, #0E8F6E 100%)',
        padding: '3rem 1.5rem 2.5rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📐</div>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, margin: 0 }}>
          Melhor m²
        </h1>
        <p style={{ color: '#22D497', marginTop: '0.5rem', fontSize: '1rem' }}>
          Compare empreendimentos pelo custo real por metro quadrado útil
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          Área útil = área interna + área externa × 50%
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
                    padding: '1.25rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    border: idx === 0 ? '2px solid #22D497' : '1.5px solid #f1f5f9',
                    transition: 'box-shadow 0.2s',
                    cursor: 'pointer',
                  }}>
                    {/* Ranking */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: idx === 0 ? 'linear-gradient(135deg,#22D497,#0E8F6E)' : '#f1f5f9',
                      color: idx === 0 ? '#fff' : '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.9rem',
                    }}>
                      {idx + 1}
                    </div>

                    {/* Imagem */}
                    {r.imagem ? (
                      <img
                        src={r.imagem}
                        alt={r.empreendimento_nome}
                        style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 72, height: 56, borderRadius: '0.5rem', flexShrink: 0,
                        background: '#f1f5f9', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#cbd5e1', fontSize: '1.5rem',
                      }}>🏢</div>
                    )}

                    {/* Info principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.empreendimento_nome}
                        {idx === 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#22D497', fontWeight: 600 }}>✦ Melhor custo-benefício</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {r.construtora_nome} · {r.bairro}{r.bairro && r.cidade ? ', ' : ''}{r.cidade}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                        <span>📐 {formatM2(r.metragem_privativa)} interno{r.area_externa > 0 ? ` + ${formatM2(r.area_externa)} externo` : ''}</span>
                        <span>📊 Área útil: {formatM2(r.area_util)}</span>
                        {r.quartos > 0 && <span>🛏 {r.quartos} qto{r.quartos > 1 ? 's' : ''}</span>}
                        {r.vagas > 0 && <span>🚗 {r.vagas} vaga{r.vagas > 1 ? 's' : ''}</span>}
                        <span style={{ textTransform: 'capitalize' }}>{r.unidade_tipo}</span>
                      </div>
                    </div>

                    {/* Preço e m² */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                        {formatCurrency(r.preco)}
                      </div>
                      <div style={{ marginTop: '0.35rem' }}>
                        <BadgeM2 valor={r.preco_m2} />
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
