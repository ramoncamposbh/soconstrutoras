'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import {
  Home, MapPin, BedDouble, Car, Lock, LogIn,
  Building2, Search, SlidersHorizontal,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

const G  = '#0E8F6E';
const GA = '#22D497';

interface ImovelUsado {
  id: string;
  titulo: string;
  tipo: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  quartos?: number;
  vagas?: number;
  area_util?: number;
  preco?: number;
  descricao?: string;
  fotos?: { id: string; url: string }[];
  publicado: boolean;
  construtora_nome?: string;
}

export default function RepassePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [imoveis, setImoveis] = useState<ImovelUsado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetch(`${API}/imoveis-usados`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setImoveis(Array.isArray(data) ? data : []); setCarregando(false); })
      .catch(() => setCarregando(false));
  }, []);

  const filtrados = imoveis.filter(im =>
    !busca ||
    im.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    im.bairro?.toLowerCase().includes(busca.toLowerCase()) ||
    im.cidade?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9' }}>
      <Header />

      {/* Hero */}
      <div style={{ background: '#04241D', padding: '2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Home size={24} color="#4ade80" />
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
          REPASSES
        </h1>
        <p style={{ color: '#4ade80', marginTop: '0.25rem', fontSize: '0.875rem', margin: '0.25rem 0 1rem' }}>
          OS IMÓVEIS DE REPASSES DAS CONSTRUTORAS.
        </p>
        {/* Busca */}
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, bairro ou cidade..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#fff', border: 'none', borderRadius: 12,
              padding: '13px 14px 13px 40px', fontSize: 14, color: '#111',
              outline: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          />
        </div>
      </div>

      {/* Gate de autenticação — banner sutil */}
      {!loading && !isAuthenticated && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(14,143,110,0.08), rgba(34,212,151,0.08))',
          borderBottom: '1px solid rgba(14,143,110,0.15)',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={14} color={G} />
            <span style={{ fontSize: 13, color: '#374151' }}>
              <strong>Faça login</strong> para ver preços completos, contato e endereço das oportunidades
            </span>
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: `linear-gradient(90deg, ${G}, ${GA})`,
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            <LogIn size={13} /> Entrar
          </button>
        </div>
      )}

      {/* Grid de imóveis */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {carregando ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Building2 size={40} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#9CA3AF', fontSize: 15 }}>Nenhum imóvel de repasse disponível no momento.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              {filtrados.length} oportunidade{filtrados.length !== 1 ? 's' : ''} encontrada{filtrados.length !== 1 ? 's' : ''}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
            }}>
              {filtrados.map(im => (
                <CardRepasse key={im.id} imovel={im} logado={isAuthenticated} onLogin={() => router.push('/auth/login')} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CardRepasse({ imovel: im, logado, onLogin }: { imovel: ImovelUsado; logado: boolean; onLogin: () => void }) {
  const foto = im.fotos?.[0]?.url;
  const G = '#0E8F6E';

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      border: '1px solid #F3F4F6',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Foto */}
      <div style={{ height: 180, background: '#F3F4F6', position: 'relative', overflow: 'hidden' }}>
        {foto ? (
          <img src={foto} alt={im.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={32} color="#D1D5DB" />
          </div>
        )}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(14,143,110,0.9)', color: '#fff',
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          textTransform: 'capitalize',
        }}>
          {im.tipo ?? 'Imóvel'}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '16px 16px 12px' }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 6, lineHeight: 1.3 }}>
          {im.titulo}
        </h3>

        {(im.bairro || im.cidade) && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
            <MapPin size={12} /> {im.bairro ? `${im.bairro}, ` : ''}{im.cidade}
          </p>
        )}

        {/* Características */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          {im.quartos != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151' }}>
              <BedDouble size={12} color={G} /> {im.quartos} quarto{im.quartos !== 1 ? 's' : ''}
            </span>
          )}
          {im.vagas != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151' }}>
              <Car size={12} color={G} /> {im.vagas} vaga{im.vagas !== 1 ? 's' : ''}
            </span>
          )}
          {im.area_util && (
            <span style={{ fontSize: 12, color: '#374151' }}>{im.area_util} m²</span>
          )}
        </div>

        {/* Preço — gated */}
        {logado ? (
          im.preco ? (
            <p style={{ fontSize: 16, fontWeight: 800, color: G, marginBottom: 12 }}>
              {formatCurrency(im.preco)}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>Consulte o valor</p>
          )
        ) : (
          <button
            onClick={onLogin}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F3F4F6', border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              color: '#374151', cursor: 'pointer', marginBottom: 12, width: '100%',
              justifyContent: 'center',
            }}
          >
            <Lock size={12} color={G} /> Ver preço — faça login
          </button>
        )}

        {/* Construtora */}
        {im.construtora_nome && (
          <p style={{ fontSize: 11, color: '#9CA3AF', borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
            {im.construtora_nome}
          </p>
        )}
      </div>
    </div>
  );
}
