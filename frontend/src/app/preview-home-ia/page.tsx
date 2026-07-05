'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Mic, MapPin, Navigation, Building2, Heart, TrendingUp, Leaf, Star,
  MessageCircle, CheckCircle, ChevronDown, LogIn, UserPlus, Send,
  Home, Rocket, Users, Scale, Calculator, Sparkles, ArrowRight,
  Briefcase, TreePine, Crown, Coffee, X, Menu,
  Brain, Target, BarChart2, Zap, Award, ArrowLeft,
} from 'lucide-react';

// ─── Brand ───────────────────────────────────────────────────────────────────
const C = {
  primary:   '#0E8F6E',
  secondary: '#0A6A52',
  dark:      '#041a10',
  graphite:  '#1F2937',
  light:     '#E6F5F1',
  lighter:   '#F0FAF7',
  white:     '#FFFFFF',
  border:    '#E5E7EB',
  gray:      '#6B7280',
};

const HERO_BG = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=60';

const NAV_LINKS = [
  { href: '/', label: 'Lançamentos',     icon: Rocket },
  { href: '/', label: 'Empreendimentos', icon: Building2 },
  { href: '/', label: 'Construtoras',    icon: Award },
  { href: '/', label: 'Favoritos',       icon: Heart },
  { href: '/', label: 'Simuladores',     icon: Calculator },
  { href: '/', label: 'Comparar',        icon: Scale },
];

const CHIPS = [
  { label: 'Primeiro imóvel',   icon: Home },
  { label: 'Investimento',      icon: TrendingUp },
  { label: 'Família',           icon: Users },
  { label: 'Pet Friendly',      icon: Heart },
  { label: 'Natureza',          icon: TreePine },
  { label: 'Alto padrão',       icon: Crown },
  { label: 'Perto do trabalho', icon: Briefcase },
  { label: 'Studios',           icon: Coffee },
  { label: 'Casas em cond.',    icon: Home },
  { label: 'Coberturas',        icon: Rocket },
];

const EXAMPLES = [
  '"Quero um apartamento perto do Colégio Santo Antônio"',
  '"Tenho dois filhos e trabalho na Savassi"',
  '"Quero investir até R$ 900 mil"',
  '"Quero morar em Nova Lima com área verde"',
  '"Preciso de condomínio clube e pet friendly"',
];

const PROFILE_FILLED = [
  'Família com dois filhos',
  'Trabalha na Savassi',
  'Renda familiar informada',
  'Orçamento até R$ 1,6 mi',
  'Até 20 min de deslocamento',
  'Pet Friendly',
  'Vista definitiva',
  'Condomínio clube',
];

const PROFILE_BENEFITS = [
  'Compatibilidade dos imóveis',
  'Tempo até o trabalho',
  'Escolas próximas',
  'Potencial de valorização',
  'Liquidez do imóvel',
  'Condomínio ideal',
  'Perfil familiar',
  'Estilo de vida',
];

const WHY_ITEMS = [
  'Cabe no seu orçamento',
  'Próximo ao trabalho',
  'Excelente liquidez',
  'Pet Friendly',
  'Condomínio clube',
  'Vista definitiva',
];

const MOCK_IMOVEIS = [
  {
    id: '1', compat: 97, tag: 'Lançamento',
    nome: 'Grand Reserve Belvedere',
    cidade: 'BH · Belvedere',
    preco: 'A partir de R$ 1.290.000',
    quartos: 3, vagas: 2, area: 142,
    img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=640&q=70',
  },
  {
    id: '2', compat: 94, tag: 'Entrega 2026',
    nome: 'Lumina Nova Lima',
    cidade: 'Nova Lima · Vale do Sereno',
    preco: 'A partir de R$ 980.000',
    quartos: 4, vagas: 3, area: 168,
    img: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=640&q=70',
  },
  {
    id: '3', compat: 91, tag: 'Pet Friendly',
    nome: 'Sky View Savassi',
    cidade: 'BH · Savassi',
    preco: 'A partir de R$ 1.100.000',
    quartos: 3, vagas: 2, area: 128,
    img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=640&q=70',
  },
];

const HOW_STEPS = [
  { num: '①', icon: MessageCircle, title: 'Conte o que procura',              desc: 'Escreva ou fale naturalmente. Nossa IA entende linguagem humana.' },
  { num: '②', icon: Brain,          title: 'IA entende seu perfil',            desc: 'Analisamos seu momento de vida, orçamento, rotina e preferências.' },
  { num: '③', icon: BarChart2,      title: 'Analisamos os empreendimentos',   desc: 'Cruzamos milhares de dados de todos os empreendimentos cadastrados.' },
  { num: '④', icon: Target,         title: 'Encontramos o imóvel ideal',      desc: 'Você recebe os imóveis mais compatíveis, ordenados por match.' },
];

// ─── Gauge ────────────────────────────────────────────────────────────────────
function Gauge({ pct, size = 130 }: { pct: number; size?: number }) {
  const r    = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={11} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={pct > 0 ? C.primary : '#E5E7EB'} strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: pct > 0 ? 28 : 22, fontWeight: 800, color: pct > 0 ? C.primary : '#9CA3AF', lineHeight: 1 }}>
          {pct}%
        </span>
        <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 3, fontWeight: 500 }}>
          {pct > 0 ? 'Perfil encontrado' : 'Perfil vazio'}
        </span>
      </div>
    </div>
  );
}

// ─── CompatBadge ──────────────────────────────────────────────────────────────
function CompatBadge({ pct }: { pct: number }) {
  const bg = pct >= 90 ? C.primary : pct >= 75 ? '#F59E0B' : '#EF4444';
  return (
    <span style={{
      background: bg, color: '#fff', fontWeight: 700,
      fontSize: 11, borderRadius: 20, padding: '3px 10px',
    }}>
      {pct}% compatível
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PreviewHomeIA() {
  const [profileState, setProfileState] = useState<'empty' | 'filled'>('filled');
  const [aiText, setAiText]             = useState('');
  const [isTyping, setIsTyping]         = useState(false);
  const [mobileMenu, setMobileMenu]     = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setAiText(e.target.value);
    setIsTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 900);
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#F9FAFB' }}>

      {/* Preview banner */}
      <div style={{
        background: '#0A6A52', color: '#fff', textAlign: 'center',
        padding: '7px 16px', fontSize: 11, display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 14,
      }}>
        <Sparkles size={12} />
        <span>PREVIEW — Novo layout aguardando aprovação. A home atual não foi alterada.</span>
        <Link href="/" style={{ color: '#6EE7B7', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={11} /> Ver home atual
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          NAVBAR — igual à imagem de referência
      ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        background: '#071e0d',
        height: 66,
        display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 0,
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0, marginRight: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={20} color="#fff" />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.05em' }}>SÓCONSTRUTORAS</div>
            <div style={{ color: '#6EE7B7', fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Portal das Construtoras</div>
          </div>
        </Link>

        {/* Início pill */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 20px', borderRadius: 10,
          background: C.primary, color: '#fff',
          textDecoration: 'none', fontWeight: 700, fontSize: 13,
          flexShrink: 0, marginRight: 6,
        }}>
          <Home size={15} /> Início
        </Link>

        {/* Other nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} className="hidden md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={label} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 13px', borderRadius: 8,
              color: 'rgba(255,255,255,0.72)', fontSize: 12.5,
              textDecoration: 'none', fontWeight: 400,
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.72)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={14} strokeWidth={1.5} /> {label}
            </Link>
          ))}
        </div>

        {/* "Olá, Ramon" pill — white box with avatar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 10, padding: '7px 14px 7px 8px',
          cursor: 'pointer', flexShrink: 0, marginLeft: 'auto',
        }}>
          {/* Avatar photo */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#D1FAE5', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.secondary }}>R</span>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1 }}>Olá,</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>Ramon</div>
          </div>
          <ChevronDown size={13} color="#9CA3AF" />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenu(v => !v)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, marginLeft: 10 }}
          className="md:hidden"
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenu && (
        <div style={{
          background: '#0d2818', borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 4,
          position: 'sticky', top: 66, zIndex: 49,
        }}>
          {[{ label: 'Início', icon: Home }, ...NAV_LINKS].map(({ label, icon: Icon }) => (
            <Link key={label} href="/" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              color: label === 'Início' ? '#fff' : 'rgba(255,255,255,0.7)',
              background: label === 'Início' ? C.primary : 'transparent',
              textDecoration: 'none', fontSize: 14,
            }}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 560 }}>
        {/* Background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('${HERO_BG}')`,
          backgroundSize: 'cover', backgroundPosition: 'center 35%',
          filter: 'blur(3px) brightness(0.2)', transform: 'scale(1.06)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(4,26,16,0.95) 0%, rgba(7,30,13,0.88) 50%, rgba(10,40,20,0.92) 100%)',
        }} />

        {/* AI typing bar */}
        {isTyping && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'rgba(14,143,110,0.15)', backdropFilter: 'blur(6px)',
            borderBottom: '1px solid rgba(14,143,110,0.3)',
            padding: '7px 28px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, animation: 'pulse 1s infinite' }} />
            <span style={{ color: '#6EE7B7', fontSize: 12, fontWeight: 500 }}>IA analisando seu perfil...</span>
            <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '55%', background: C.primary, borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>
        )}

        {/* Hero grid */}
        <div style={{
          position: 'relative', zIndex: 5,
          maxWidth: 1240, margin: '0 auto',
          padding: isTyping ? '44px 28px 60px' : '64px 28px 60px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 360px',
          gap: 36, alignItems: 'start',
        }}>

          {/* ── LEFT ── */}
          <div>
            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(28px, 3.5vw, 50px)',
              fontWeight: 800, color: '#fff',
              lineHeight: 1.15, marginBottom: 6,
              letterSpacing: '-0.02em',
            }}>
              Encontre o imóvel ideal
            </h1>
            <h1 style={{
              fontSize: 'clamp(28px, 3.5vw, 50px)',
              fontWeight: 800, color: C.primary,
              lineHeight: 1.15, marginBottom: 14,
              letterSpacing: '-0.02em',
            }}>
              conversando com nossa IA
            </h1>

            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 28, maxWidth: 520 }}>
              Conte como é o imóvel que você procura. Nossa IA entende suas necessidades e encontra as melhores opções para você.
            </p>

            {/* ── SEARCH BOX (igual à referência) ── */}
            <div style={{
              background: '#fff', borderRadius: 18,
              padding: '20px 20px 16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15)',
              marginBottom: 20,
            }}>
              {/* Input row */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: C.lighter, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageCircle size={19} color={C.primary} />
                </div>

                {/* Text area */}
                <div style={{ flex: 1 }}>
                  <textarea
                    value={aiText}
                    onChange={handleInput}
                    placeholder="Conte como é o imóvel que você procura..."
                    rows={1}
                    style={{
                      width: '100%', border: 'none', outline: 'none', resize: 'none',
                      fontSize: 15, color: '#1F2937', fontFamily: 'inherit',
                      background: 'transparent', lineHeight: 1.5,
                      fontWeight: 500,
                    }}
                  />
                  {/* Example lines */}
                  <div style={{ marginTop: 6 }}>
                    {EXAMPLES.slice(0, 3).map((ex) => (
                      <div key={ex} style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>{ex}</div>
                    ))}
                  </div>
                </div>

                {/* Green circular send button */}
                <button style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: C.primary, border: 'none', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', alignSelf: 'center',
                  boxShadow: `0 4px 14px ${C.primary}55`,
                  transition: 'background 0.15s, transform 0.1s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.secondary; (e.currentTarget as HTMLElement).style.transform = 'scale(1.07)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.primary;   (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <Send size={18} color="#fff" />
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#F3F4F6', marginBottom: 12 }} />

              {/* Action buttons inside the box */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { icon: Mic,        label: 'Falar' },
                  { icon: Navigation, label: 'Usar minha localização' },
                  { icon: MapPin,     label: 'Adicionar localização' },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20,
                    border: `1px solid ${C.border}`,
                    background: '#fff', color: '#374151',
                    fontSize: 12.5, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.primary; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── PESQUISAS RÁPIDAS (ícone em cima + texto abaixo) ── */}
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 12 }}>
                Pesquisas rápidas
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
                {CHIPS.map(({ label, icon: Icon }) => (
                  <button key={label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.85)', fontSize: 11,
                    cursor: 'pointer', flexShrink: 0,
                    transition: 'all 0.15s',
                    backdropFilter: 'blur(4px)',
                    minWidth: 80,
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${C.primary}33`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${C.primary}88`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
                    }}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    <span style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>{label}</span>
                  </button>
                ))}
                {/* Arrow button */}
                <button style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 14px', borderRadius: 12, flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer', color: '#fff',
                }}>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT CARD ── */}
          <div>
            {/* Toggle */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: 10,
              background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 4,
            }}>
              {(['empty', 'filled'] as const).map(s => (
                <button key={s} onClick={() => setProfileState(s)} style={{
                  flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                  background: profileState === s ? C.primary : 'transparent',
                  color: profileState === s ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {s === 'empty' ? '0% — Vazio' : '83% — Preenchido'}
                </button>
              ))}
            </div>

            {/* Card */}
            <div style={{
              background: '#fff', borderRadius: 20, padding: '20px 22px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 4px 20px rgba(0,0,0,0.12)',
            }}>

              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Seu perfil imobiliário</span>
                <button style={{
                  background: 'none', border: 'none', color: C.primary,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  Editar ✏️
                </button>
              </div>

              {profileState === 'empty' ? (
                /* ── EMPTY STATE ── */
                <>
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <Gauge pct={0} size={110} />
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', margin: '12px 0 6px' }}>
                      Sua IA ainda não conhece você
                    </h3>
                    <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
                      Converse com nossa IA por alguns minutos para desbloquear recomendações altamente personalizadas.
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.5, marginTop: 6 }}>
                      Quanto mais ela conhecer você, melhores serão os imóveis encontrados.
                    </p>
                  </div>

                  <div style={{ background: C.lighter, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.secondary, marginBottom: 10, letterSpacing: '0.04em' }}>
                      BENEFÍCIOS AO COMPLETAR O PERFIL
                    </div>
                    {PROFILE_BENEFITS.map(b => (
                      <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1F2937', marginBottom: 7 }}>
                        <CheckCircle size={13} color={C.primary} style={{ flexShrink: 0 }} /> {b}
                      </div>
                    ))}
                  </div>

                  <button style={{
                    width: '100%', padding: '12px 0', borderRadius: 12,
                    background: C.primary, color: '#fff', border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: `0 4px 14px ${C.primary}44`, transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.secondary; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.primary; }}
                  >
                    <Sparkles size={15} /> Começar agora
                  </button>
                </>
              ) : (
                /* ── FILLED STATE (83%) — gauge esq + checklist dir ── */
                <>
                  {/* Two-column: gauge left, checklist right */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                    {/* Gauge */}
                    <Gauge pct={83} size={120} />

                    {/* Checklist */}
                    <div style={{ flex: 1 }}>
                      {PROFILE_FILLED.map(item => (
                        <div key={item} style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          fontSize: 12, color: '#1F2937', marginBottom: 7,
                        }}>
                          <CheckCircle size={13} color={C.primary} style={{ flexShrink: 0 }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress box */}
                  <div style={{ background: C.lighter, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.secondary }}>Falta pouco!</span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>83%</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5, marginBottom: 8 }}>
                      Complete seu perfil para resultados ainda melhores.
                    </p>
                    <div style={{ height: 6, background: '#D1FAE5', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: '83%', height: '100%', background: C.primary, borderRadius: 99 }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>83%</div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROPERTY CARDS
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '64px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1F2937', marginBottom: 4 }}>
              Encontramos <span style={{ color: C.primary }}>18 empreendimentos</span> para você
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Ordenados pelo maior índice de compatibilidade com seu perfil.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 22 }}>
            {MOCK_IMOVEIS.map(im => (
              <div key={im.id} style={{
                background: '#fff', borderRadius: 18, overflow: 'hidden',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
              >
                <div style={{ position: 'relative', height: 200 }}>
                  <img src={im.img} alt={im.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12 }}><CompatBadge pct={im.compat} /></div>
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(31,41,55,0.82)', color: '#fff', fontSize: 10.5, fontWeight: 600, borderRadius: 7, padding: '3px 9px' }}>
                    {im.tag}
                  </div>
                  <button style={{ position: 'absolute', bottom: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Heart size={15} color="#9CA3AF" />
                  </button>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 2 }}>{im.nome}</h3>
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>📍 {im.cidade}</p>
                  <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>🛏 {im.quartos} quartos</span>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>🚗 {im.vagas} vagas</span>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>📐 {im.area} m²</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.primary, marginBottom: 12 }}>{im.preco}</div>
                  <div style={{ background: C.lighter, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.secondary, marginBottom: 7 }}>Por que recomendamos este imóvel?</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 6px' }}>
                      {WHY_ITEMS.map(w => (
                        <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#1F2937' }}>
                          <CheckCircle size={10} color={C.primary} style={{ flexShrink: 0 }} /> {w}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button style={{
                    width: '100%', padding: '10px 0', borderRadius: 10,
                    background: C.primary, color: '#fff', border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.secondary; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.primary; }}
                  >
                    Ver detalhes <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button style={{
              padding: '13px 36px', borderRadius: 12,
              border: `2px solid ${C.primary}`, background: 'transparent',
              color: C.primary, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.primary; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.primary; }}
            >
              Ver todos os 18 empreendimentos
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          COMO FUNCIONA
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#1F2937', padding: '72px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(14,143,110,0.15)', border: '1px solid rgba(14,143,110,0.3)',
              borderRadius: 20, padding: '5px 16px', marginBottom: 14,
            }}>
              <Zap size={13} color="#6EE7B7" />
              <span style={{ color: '#6EE7B7', fontSize: 12, fontWeight: 500 }}>Como funciona nossa IA</span>
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Do perfil ao imóvel ideal em minutos
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 460, margin: '0 auto' }}>
              Nossa IA foi treinada com milhares de perfis de compradores e dados de empreendimentos.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {HOW_STEPS.map(({ num, icon: Icon, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18, padding: '26px 22px', textAlign: 'center',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.primary}55`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: 13,
                  background: `${C.primary}22`, border: `1px solid ${C.primary}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <Icon size={22} color={C.primary} />
                </div>
                <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
                  PASSO {num}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 20, marginTop: 52, paddingTop: 44,
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}>
            {[
              { v: '12.000+', l: 'Empreendimentos' },
              { v: '94%',     l: 'Taxa de satisfação' },
              { v: '3 min',   l: 'Para montar seu perfil' },
              { v: '98%',     l: 'Compatibilidade máxima' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.primary }}>{v}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#111827', padding: '28px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2025 SóConstrutoras — Todos os direitos reservados</span>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            {['Termos', 'Privacidade', 'Contato'].map(t => (
              <a key={t} href="#" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>{t}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        @media(max-width:860px){
          .hero-grid-fix { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
