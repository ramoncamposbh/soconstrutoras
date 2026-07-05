'use client';

/**
 * PREVIEW — Cópia exata do cabeçalho da imagem de referência.
 * Acesse: http://localhost:3000/preview-cabecalho
 * Aguardando aprovação para aplicar na home.
 */

import Link from 'next/link';
import {
  Home, Rocket, Building2, Heart, Calculator, Scale,
  Award, Mic, Navigation, MapPin, Send, MessageCircle,
  ChevronDown, TrendingUp, Users, Star, Briefcase,
  TreePine, Crown, Coffee, ArrowRight, CheckCircle,
} from 'lucide-react';

const HERO_BG =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=60';

const NAV_LINKS = [
  { label: 'Lançamentos',     icon: Rocket },
  { label: 'Empreendimentos', icon: Building2 },
  { label: 'Construtoras',    icon: Award },
  { label: 'Favoritos',       icon: Heart },
  { label: 'Simuladores',     icon: Calculator },
  { label: 'Comparar',        icon: Scale },
];

const CHIPS = [
  { label: 'Primeiro imóvel',   icon: Home },
  { label: 'Investimento',      icon: TrendingUp },
  { label: 'Família',           icon: Users },
  { label: 'Pet Friendly',      icon: Heart },
  { label: 'Natureza',          icon: TreePine },
  { label: 'Alto padrão',       icon: Star },
  { label: 'Perto do trabalho', icon: Briefcase },
];

const PROFILE_ITEMS = [
  'Família com dois filhos',
  'Trabalha na Savassi',
  'Renda familiar informada',
  'Orçamento até R$ 1,6 mi',
  'Até 20 min de deslocamento',
  'Pet Friendly',
  'Vista definitiva',
  'Condomínio clube',
];

export default function PreviewCabecalho() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f9fafb', minHeight: '100vh' }}>

      {/* Banner de preview */}
      <div style={{
        background: '#0A6A52', color: '#fff',
        padding: '7px 20px', fontSize: 12, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <span>📋 PREVIEW — Cabeçalho aguardando aprovação</span>
        <Link href="/" style={{ color: '#6EE7B7', fontWeight: 700, textDecoration: 'none', fontSize: 11 }}>
          ← Home atual
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          NAVBAR — cópia fiel da imagem
      ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        background: '#071e0d',
        height: 66,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>

        {/* Logo */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', marginRight: 18, flexShrink: 0,
        }}>
          {/* Ícone circular verde */}
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: '#0E8F6E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {/* SVG simples de prédio — igual à referência */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 22V12h6v10"/>
              <path d="M9 7h1m4 0h1M9 11h1m4 0h1"/>
            </svg>
          </div>
          {/* Texto */}
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13.5, letterSpacing: '0.05em' }}>
              SÓCONSTRUTORAS
            </div>
            <div style={{ color: '#0E8F6E', fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Portal das Construtoras
            </div>
          </div>
        </Link>

        {/* Início — pill verde grande */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 20px', borderRadius: 10,
          background: '#0E8F6E', color: '#fff',
          textDecoration: 'none', fontWeight: 700, fontSize: 13.5,
          flexShrink: 0, marginRight: 6,
          transition: 'opacity 0.15s',
        }}>
          <Home size={15} /> Início
        </Link>

        {/* Links de navegação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {NAV_LINKS.map(({ label, icon: Icon }) => (
            <Link key={label} href="/" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 8,
              color: 'rgba(255,255,255,0.72)',
              textDecoration: 'none', fontSize: 12.5,
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.72)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </div>

        {/* "Olá, Ramon" — box branco com avatar (igual à imagem) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '7px 14px 7px 8px',
          cursor: 'pointer', flexShrink: 0,
          marginLeft: 'auto',
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#D1FAE5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#0A6A52',
            flexShrink: 0,
          }}>
            R
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 9.5, color: '#9CA3AF' }}>Olá,</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>Ramon</div>
          </div>
          <ChevronDown size={13} color="#9CA3AF" style={{ marginLeft: 2 }} />
        </div>

      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO — cópia fiel da imagem
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 440 }}>

        {/* Imagem de fundo desfocada */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('${HERO_BG}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          filter: 'blur(3px) brightness(0.20)',
          transform: 'scale(1.06)',
        }} />

        {/* Overlay escuro esverdeado */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(4,26,16,0.97) 0%, rgba(7,30,13,0.92) 55%, rgba(8,32,15,0.96) 100%)',
        }} />

        {/* Grid hero: esquerda + card direito */}
        <div style={{
          position: 'relative', zIndex: 5,
          maxWidth: 1240, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 32,
          padding: '56px 28px 52px',
          alignItems: 'start',
        }}>

          {/* ── COLUNA ESQUERDA ── */}
          <div>

            {/* Título principal */}
            <h1 style={{
              fontSize: 42, fontWeight: 800,
              color: '#fff', lineHeight: 1.15,
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}>
              Encontre o imóvel ideal
            </h1>
            <h1 style={{
              fontSize: 42, fontWeight: 800,
              color: '#0E8F6E', lineHeight: 1.15,
              marginBottom: 12,
              letterSpacing: '-0.02em',
            }}>
              conversando com nossa IA
            </h1>

            {/* Subtítulo */}
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7, marginBottom: 28, maxWidth: 520,
            }}>
              Conte como é o imóvel que você procura. Nossa IA entende suas
              necessidades e encontra as melhores opções para você.
            </p>

            {/* ── CAIXA DE BUSCA ── */}
            <div style={{
              background: '#fff',
              borderRadius: 18,
              padding: '18px 20px 14px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.32), 0 4px 20px rgba(0,0,0,0.16)',
              marginBottom: 20,
            }}>
              {/* Linha: ícone + texto + botão circular */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>

                {/* Ícone mensagem */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#F0FAF7', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageCircle size={19} color="#0E8F6E" />
                </div>

                {/* Textos */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14.5, color: '#9CA3AF',
                    fontWeight: 400, marginBottom: 6,
                  }}>
                    Conte como é o imóvel que você procura...
                  </div>
                  <div style={{ fontSize: 12, color: '#C4C9D4', lineHeight: 1.65 }}>
                    Exemplos: &quot;Quero um apartamento perto do Colégio Santo Antônio&quot;<br />
                    &quot;Tenho dois filhos e trabalho na Savassi&quot; &quot;Quero investir até R$ 900 mil&quot;
                  </div>
                </div>

                {/* Botão circular verde */}
                <button style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: '#0E8F6E', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, alignSelf: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(14,143,110,0.45)',
                  transition: 'opacity 0.15s',
                }}>
                  <Send size={18} color="#fff" />
                </button>
              </div>

              {/* Divisor */}
              <div style={{ height: 1, background: '#F3F4F6', marginBottom: 12 }} />

              {/* Botões de ação */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { icon: Mic,        label: 'Falar' },
                  { icon: Navigation, label: 'Usar minha localização' },
                  { icon: MapPin,     label: 'Adicionar localização' },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20,
                    border: '1px solid #E5E7EB',
                    background: '#fff', color: '#374151',
                    fontSize: 12.5, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── PESQUISAS RÁPIDAS — ícone em cima, texto abaixo ── */}
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 600, marginBottom: 10 }}>
                Pesquisas rápidas
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 2 }}>
                {CHIPS.map(({ label, icon: Icon }) => (
                  <button key={label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 11, cursor: 'pointer', flexShrink: 0,
                    minWidth: 82, transition: 'all 0.15s',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <Icon size={19} strokeWidth={1.5} />
                    <span style={{ whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                  </button>
                ))}
                {/* Seta de mais */}
                <button style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 46, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer', color: '#fff',
                }}>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

          </div>{/* fim coluna esquerda */}

          {/* ── CARD PERFIL (coluna direita) ── */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '22px 24px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.30), 0 4px 20px rgba(0,0,0,0.14)',
          }}>

            {/* Cabeçalho do card */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 18,
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1F2937' }}>
                Seu perfil imobiliário
              </span>
              <button style={{
                background: 'none', border: 'none',
                color: '#0E8F6E', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                Editar ✏️
              </button>
            </div>

            {/* Gauge esquerda + checklist direita */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>

              {/* Gauge circular 83% */}
              <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="11" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke="#0E8F6E" strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50 * 0.83} ${2 * Math.PI * 50 * 0.17}`}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: '#0E8F6E', lineHeight: 1 }}>83%</span>
                  <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 4, fontWeight: 500 }}>Perfil encontrado</span>
                </div>
              </div>

              {/* Checklist */}
              <div style={{ flex: 1, paddingTop: 4 }}>
                {PROFILE_ITEMS.map(item => (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: 11.5, color: '#1F2937', marginBottom: 7,
                  }}>
                    <CheckCircle size={13} color="#0E8F6E" style={{ flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>

            </div>

            {/* Falta pouco! */}
            <div style={{
              background: '#F0FAF7',
              borderRadius: 12,
              padding: '13px 15px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0A6A52' }}>Falta pouco!</span>
              </div>
              <p style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.55, marginBottom: 9 }}>
                Complete seu perfil para resultados ainda melhores.
              </p>
              <div style={{ height: 5, background: '#D1FAE5', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: '83%', height: '100%', background: '#0E8F6E', borderRadius: 99 }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>83%</div>
            </div>

          </div>{/* fim card perfil */}

        </div>{/* fim grid */}

      </section>

      {/* Área abaixo — só informativo */}
      <div style={{
        maxWidth: 1240, margin: '40px auto', padding: '0 28px',
        textAlign: 'center', color: '#9CA3AF', fontSize: 13,
      }}>
        ↑ Apenas o cabeçalho acima está sendo revisado. O restante da home permanece inalterado.
      </div>

    </div>
  );
}
