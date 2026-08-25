'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { empreendimentosApi } from '@/lib/api';
import Header from '@/components/layout/Header';
import { Rocket, MapPin, Search } from 'lucide-react';

interface Empreendimento {
  id: string;
  nome: string;
  slug: string;
  tipo: string;
  status: string;
  bairro: string;
  cidade: string;
  estado: string;
  preco_min: number | null;
  preco_max: number | null;
  area_min: number | null;
  area_max: number | null;
  quartos_min: number | null;
  quartos_max: number | null;
  vagas: number | null;
  foto_capa: string | null;
  construtora: string;
  publicado_em?: string;
}

function formatCurrency(v: number | null) {
  if (!v) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

function diasDesde(dataStr: string) {
  const dias = Math.floor((Date.now() - new Date(dataStr).getTime()) / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  if (dias < 30) return `${dias} dias`;
  const meses = Math.floor(dias / 30);
  return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
}

function BadgeTempo({ data }: { data?: string }) {
  if (!data) return null;
  const dias = Math.floor((Date.now() - new Date(data).getTime()) / 86400000);
  const label = diasDesde(data);
  const bg = dias <= 30 ? '#059669' : dias <= 90 ? '#0E8F6E' : '#6B7280';
  return (
    <span style={{
      background: bg, color: '#fff', borderRadius: '0.4rem',
      padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700,
    }}>
      🚀 {label}
    </span>
  );
}

function CardLancamento({ emp }: { emp: Empreendimento }) {
  return (
    <Link href={`/imoveis/${emp.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#fff', borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1.5px solid #f1f5f9',
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'pointer',
        height: '100%',
        display: 'flex', flexDirection: 'column',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
      >
        {/* Imagem */}
        <div style={{ position: 'relative', height: 180, flexShrink: 0 }}>
          {emp.foto_capa ? (
            <img src={emp.foto_capa} alt={emp.nome}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D2B22, #0E8F6E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
              🏢
            </div>
          )}
          {/* Badge tempo */}
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <BadgeTempo data={emp.publicado_em} />
          </div>
          {/* Badge status */}
          {emp.status && (
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '0.4rem', textTransform: 'capitalize' }}>
                {emp.status}
              </span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.3 }}>
            {emp.nome}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} /> {emp.bairro}{emp.bairro && emp.cidade ? ', ' : ''}{emp.cidade}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {emp.construtora} · <span style={{ textTransform: 'capitalize' }}>{emp.tipo}</span>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            {emp.preco_min && (
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0E8F6E' }}>
                {formatCurrency(emp.preco_min)}
                {emp.preco_max && emp.preco_max !== emp.preco_min && (
                  <span style={{ fontWeight: 400, fontSize: '0.8rem', color: '#64748b' }}> – {formatCurrency(emp.preco_max)}</span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', fontSize: '0.75rem', color: '#94a3b8', flexWrap: 'wrap' }}>
              {emp.quartos_min ? <span>🛏 {emp.quartos_min}{emp.quartos_max && emp.quartos_max !== emp.quartos_min ? `–${emp.quartos_max}` : ''} qtos</span> : null}
              {emp.area_min ? <span>📐 {emp.area_min}{emp.area_max && emp.area_max !== emp.area_min ? `–${emp.area_max}` : ''} m²</span> : null}
              {emp.vagas ? <span>🚗 {emp.vagas} vaga{emp.vagas > 1 ? 's' : ''}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'studio', label: 'Studio' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'casa', label: 'Casa' },
];

export default function LancamentosPage() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [cidade, setCidade] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { lancamentos: true, limite: 500 };
      if (tipo) params.tipo = tipo;
      if (cidade.trim()) params.cidade = cidade.trim();
      const { data } = await empreendimentosApi.buscarPublico(params);
      setEmpreendimentos(data);
    } catch {
      setEmpreendimentos([]);
    } finally {
      setLoading(false);
    }
  }, [tipo, cidade]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = empreendimentos.filter(e => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      e.nome?.toLowerCase().includes(q) ||
      e.bairro?.toLowerCase().includes(q) ||
      e.cidade?.toLowerCase().includes(q) ||
      e.construtora?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #04241D 0%, #0D2B22 60%, #0E8F6E 100%)',
        padding: '3rem 1.5rem 2.5rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚀</div>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, margin: 0 }}>
          Lançamentos
        </h1>
        <p style={{ color: '#22D497', marginTop: '0.5rem', fontSize: '1rem' }}>
          Empreendimentos lançados nos últimos 5 meses
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          Oportunidade de entrada antes da primeira parcela semestral
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.5rem 0',
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        {/* Busca texto */}
        <div style={{ flex: '2 1 220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, bairro ou construtora…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12,
              border: '1.5px solid #e2e8f0', borderRadius: '0.75rem',
              padding: '0.65rem 1rem 0.65rem 2.25rem', fontSize: '0.9rem',
              outline: 'none', background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Cidade */}
        <div style={{ flex: '1 1 160px' }}>
          <input
            value={cidade}
            onChange={e => setCidade(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && carregar()}
            placeholder="Cidade"
            style={{
              width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem',
              padding: '0.65rem 1rem', fontSize: '0.9rem', outline: 'none',
              background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tipo */}
        <div style={{ flex: '1 1 140px' }}>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            style={{
              width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem',
              padding: '0.65rem 1rem', fontSize: '0.9rem', outline: 'none',
              background: '#fff', cursor: 'pointer', boxSizing: 'border-box',
            }}
          >
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <button
          onClick={carregar}
          style={{
            background: 'linear-gradient(90deg, #0E8F6E, #22D497)',
            color: '#fff', border: 'none', borderRadius: '0.75rem',
            padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto',
          }}
        >
          Filtrar
        </button>
      </div>

      {/* Resultados */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Carregando lançamentos…
          </div>
        )}

        {!loading && filtrados.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '3rem',
            background: '#fff', borderRadius: '1rem', color: '#64748b',
          }}>
            Nenhum lançamento encontrado nos últimos 5 meses.
          </div>
        )}

        {!loading && filtrados.length > 0 && (
          <>
            <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
              {filtrados.length} lançamento{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}>
              {filtrados.map(emp => (
                <CardLancamento key={emp.id} emp={emp} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
