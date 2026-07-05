'use client';

/**
 * PREVIEW — 3 opções de background para o Hero principal.
 * Acesse: http://localhost:3000/preview-hero
 * Aguardando aprovação. A home atual NÃO foi alterada.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Home, Rocket, Building2, Heart, Calculator, Scale, Award,
  Mic, Navigation, MapPin, Send, MessageCircle,
  ChevronDown, TrendingUp, Users, Star, Briefcase,
  TreePine, Crown, CheckCircle, Search, SlidersHorizontal,
  ArrowLeft, Sparkles,
} from 'lucide-react';

// ─── Paleta ────────────────────────────────────────────────────────────────
const C = {
  navBg:   '#04241D',
  border:  '#19483D',
  btn:     '#0E8F6E',
  hover:   '#16A37F',
  dark:    '#0A6A52',
  heroBg:  '#031D18',
  white:   '#FFFFFF',
  grayLt:  '#E8ECEB',
  grayMd:  '#AAB5B2',
};

// ─── Opções de background ──────────────────────────────────────────────────
const OPTIONS = [
  {
    id: 'A',
    label: 'Apartamento Panorâmico',
    desc: 'Vista ampla, alto padrão, grandes janelas',
    // High-end apartment with panoramic city view
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85&auto=format&fit=crop',
    overlay: `linear-gradient(
      105deg,
      rgba(3,29,24,0.97) 0%,
      rgba(3,29,24,0.92) 40%,
      rgba(3,29,24,0.78) 65%,
      rgba(3,29,24,0.52) 100%
    )`,
    position: 'center 40%',
  },
  {
    id: 'B',
    label: 'Skyline Premium',
    desc: 'Edifícios modernos, vista urbana, sofisticação',
    // Modern city skyline / luxury buildings
    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=85&auto=format&fit=crop',
    overlay: `linear-gradient(
      105deg,
      rgba(3,29,24,0.96) 0%,
      rgba(3,29,24,0.90) 40%,
      rgba(3,29,24,0.75) 65%,
      rgba(3,29,24,0.48) 100%
    )`,
    position: 'center 30%',
  },
  {
    id: 'C',
    label: 'Interior Contemporâneo',
    desc: 'Sala sofisticada, design minimalista, iluminação natural',
    // Sophisticated contemporary apartment interior
    img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=85&auto=format&fit=crop',
    overlay: `linear-gradient(
      105deg,
      rgba(3,29,24,0.97) 0%,
      rgba(3,29,24,0.93) 38%,
      rgba(3,29,24,0.80) 62%,
      rgba(3,29,24,0.58) 100%
    )`,
    position: 'center 50%',
  },
];

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

// ─── SVG Grid tech overlay ──────────────────────────────────────────────────
function TechGrid() {
  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', opacity: 0.035,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0E8F6E" strokeWidth="0.5" />
        </pattern>
        <pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="24" cy="24" r="0.8" fill="#0E8F6E" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <rect width="100%" height="100%" fill="url(#dots)" opacity="0.6" />
    </svg>
  );
}

// ─── Vignette overlay ──────────────────────────────────────────────────────
function Vignette() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3,29,24,0.55) 100%)',
    }} />
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────
function HeroSection({ option }: { option: typeof OPTIONS[0] }) {
  const bgRef  = useRef<HTMLDivElement>(null);
  const secRef = useRef<HTMLElement>(null);

  // Parallax suave no mouse
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!bgRef.current || !secRef.current) return;
    const rect = secRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    bgRef.current.style.transform = `scale(1.06) translate(${x * -12}px, ${y * -8}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!bgRef.current) return;
    bgRef.current.style.transform = 'scale(1.06) translate(0,0)';
  }, []);

  useEffect(() => {
    const el = secRef.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <section
      ref={secRef}
      style={{ position: 'relative', overflow: 'hidden', minHeight: 560 }}
    >
      {/* Foto de fundo com parallax */}
      <div
        ref={bgRef}
        style={{
          position: 'absolute', inset: '-3%',
          backgroundImage: `url('${option.img}')`,
          backgroundSize: 'cover',
          backgroundPosition: option.position,
          filter: 'blur(1.5px) brightness(0.55) saturate(0.75)',
          transform: 'scale(1.06)',
          transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
          willChange: 'transform',
        }}
      />

      {/* Overlay gradiente identidade visual */}
      <div style={{ position: 'absolute', inset: 0, background: option.overlay }} />

      {/* Vinheta */}
      <Vignette />

      {/* Grid tecnológico discreto */}
      <TechGrid />

      {/* Conteúdo do hero */}
      <div style={{
        position: 'relative', zIndex: 5,
        maxWidth: 1240, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 36,
        padding: '60px 28px 56px',
        alignItems: 'start',
      }}>

        {/* ── ESQUERDA ── */}
        <div>
          {/* Badge IA */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(14,143,110,0.15)',
            border: '1px solid rgba(14,143,110,0.35)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 18,
            backdropFilter: 'blur(4px)',
          }}>
            <Sparkles size={13} color="#6EE7B7" />
            <span style={{ color: '#6EE7B7', fontSize: 11.5, fontWeight: 500 }}>
              Inteligência Artificial para imóveis
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 3.2vw, 46px)',
            fontWeight: 800, color: '#fff',
            lineHeight: 1.15, marginBottom: 4,
            letterSpacing: '-0.02em',
          }}>
            Encontre o imóvel ideal
          </h1>
          <h1 style={{
            fontSize: 'clamp(28px, 3.2vw, 46px)',
            fontWeight: 800, color: C.btn,
            lineHeight: 1.15, marginBottom: 14,
            letterSpacing: '-0.02em',
          }}>
            conversando com nossa IA
          </h1>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.75, marginBottom: 28, maxWidth: 500,
          }}>
            Conte como é o imóvel que você procura. Nossa IA entende suas necessidades
            e encontra as melhores opções para você.
          </p>

          {/* Campo IA */}
          <div style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 18, padding: '18px 20px 14px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 4px 20px rgba(0,0,0,0.2)',
            marginBottom: 14,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#F0FAF7', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageCircle size={19} color={C.btn} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, color: '#9CA3AF', marginBottom: 5 }}>
                  Conte como é o imóvel que você procura...
                </div>
                <div style={{ fontSize: 11.5, color: '#C4C9D4', lineHeight: 1.65 }}>
                  Ex: &quot;Apartamento com varanda, 3 suítes, próximo à Savassi, até R$ 1,2 mi&quot;
                </div>
              </div>
              <button style={{
                width: 44, height: 44, borderRadius: '50%',
                background: C.btn, border: 'none', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                alignSelf: 'center', cursor: 'pointer',
                boxShadow: `0 4px 16px ${C.btn}55`,
                transition: 'background 0.15s, transform 0.1s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.btn;  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <Send size={17} color="#fff" />
              </button>
            </div>
            <div style={{ height: 1, background: '#F3F4F6', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { icon: Mic,        label: 'Falar' },
                { icon: Navigation, label: 'Usar minha localização' },
                { icon: MapPin,     label: 'Adicionar localização' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  border: '1px solid #E5E7EB', background: '#fff', color: '#374151',
                  fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.btn; (e.currentTarget as HTMLElement).style.color = C.btn; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Divisor filtros */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
              ou use os filtros tradicionais
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Filtros tradicionais */}
          <div style={{
            padding: '14px 16px', borderRadius: 16,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end',
          }}>
            {[
              { label: 'Cidade ou bairro', placeholder: 'Ex: Savassi, Nova Lima...', flex: '1 1 150px', type: 'input' },
              { label: 'Tipo',    type: 'select', opts: ['Todos', 'Apartamento', 'Casa', 'Cobertura', 'Studio'] },
              { label: 'Suítes', type: 'select', opts: ['Qualquer', '1+', '2+', '3+', '4+'] },
              { label: 'Vagas',  type: 'select', opts: ['Qualquer', '1+', '2+', '3+', '4+'] },
              { label: 'Área mín.', type: 'select', opts: ['Qualquer', '50m²+', '70m²+', '100m²+', '150m²+', '200m²+'] },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: (f as any).flex || '0 0 auto' }}>
                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{f.label}</label>
                {f.type === 'input'
                  ? <input placeholder={(f as any).placeholder} style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.09)', color: '#fff', outline: 'none', minWidth: 150 }} />
                  : <select style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.09)', color: '#fff', outline: 'none' }}>
                      {(f as any).opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                }
              </div>
            ))}
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 9,
              background: C.btn, color: '#fff', border: 'none',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.15s',
              boxShadow: `0 4px 14px ${C.btn}44`,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.btn; }}
            >
              <Search size={14} /> Buscar
            </button>
          </div>
        </div>

        {/* ── DIREITA: Card perfil ── */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20, padding: '22px 24px',
          boxShadow: '0 28px 72px rgba(0,0,0,0.38)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1F2937' }}>Seu perfil imobiliário</span>
            <button style={{ background: 'none', border: 'none', color: C.btn, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Editar ✏️
            </button>
          </div>

          {/* Gauge + checklist */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 116, height: 116, flexShrink: 0 }}>
              <svg width="116" height="116" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="58" cy="58" r="48" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                <circle cx="58" cy="58" r="48" fill="none" stroke={C.btn} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 48 * 0.83} ${2 * Math.PI * 48 * 0.17}`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: C.btn, lineHeight: 1 }}>83%</span>
                <span style={{ fontSize: 8.5, color: '#9CA3AF', marginTop: 3 }}>Perfil encontrado</span>
              </div>
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              {PROFILE_ITEMS.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#1F2937', marginBottom: 6 }}>
                  <CheckCircle size={12} color={C.btn} style={{ flexShrink: 0 }} /> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Falta pouco */}
          <div style={{ background: '#F0FAF7', borderRadius: 11, padding: '11px 13px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Falta pouco!</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, lineHeight: 1.5 }}>
              Complete seu perfil para resultados ainda melhores.
            </div>
            <div style={{ height: 5, background: '#D1FAE5', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: '83%', height: '100%', background: C.btn, borderRadius: 99 }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 9.5, color: '#9CA3AF', marginTop: 3 }}>83%</div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function PreviewHero() {
  const [selected, setSelected] = useState(0);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.heroBg, minHeight: '100vh' }}>

      {/* Banner preview */}
      <div style={{
        background: C.dark, color: '#fff',
        padding: '8px 24px', fontSize: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <Sparkles size={13} color="#6EE7B7" />
        <span style={{ fontWeight: 500 }}>PREVIEW — Escolha a opção de fundo do Hero. A home atual não foi alterada.</span>
        <Link href="/" style={{ color: '#6EE7B7', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={11} /> Home atual
        </Link>
      </div>

      {/* NAVBAR */}
      <nav style={{
        background: C.navBg, height: 66,
        display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 0,
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 16, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.btn, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={20} color="#fff" />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 13, letterSpacing: '0.05em' }}>SÓCONSTRUTORAS</div>
            <div style={{ color: C.grayMd, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Portal das Construtoras</div>
          </div>
        </Link>

        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 20px', borderRadius: 10,
          background: C.btn, color: C.white,
          textDecoration: 'none', fontWeight: 600, fontSize: 13,
          flexShrink: 0, marginRight: 6, transition: 'background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.btn; }}
        >
          <Home size={14} /> Início
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {NAV_LINKS.map(({ label, icon: Icon }) => (
            <a key={label} href="#" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 11px', borderRadius: 8,
              color: C.grayMd, fontSize: 12.5, textDecoration: 'none',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.white; (e.currentTarget as HTMLElement).style.background = C.border; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.grayMd; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={13} strokeWidth={1.5} /> {label}
            </a>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto',
          background: C.white, border: `1px solid ${C.grayLt}`,
          borderRadius: 10, padding: '6px 14px 6px 8px',
        }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: C.dark }}>R</div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 9, color: C.grayMd }}>Olá,</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1F2937' }}>Ramon</div>
          </div>
          <ChevronDown size={12} color={C.grayMd} />
        </div>
      </nav>

      {/* Seletor de opções */}
      <div style={{
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(10px)',
        padding: '16px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 66, zIndex: 40,
      }}>
        <span style={{ color: C.grayMd, fontSize: 12, marginRight: 6 }}>Opção de fundo:</span>
        {OPTIONS.map((opt, i) => (
          <button key={opt.id} onClick={() => setSelected(i)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 10,
            border: `1.5px solid ${selected === i ? C.btn : C.border}`,
            background: selected === i ? `${C.btn}22` : 'rgba(255,255,255,0.04)',
            color: selected === i ? '#fff' : C.grayMd,
            fontSize: 12.5, fontWeight: selected === i ? 700 : 400,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: selected === i ? C.btn : C.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {opt.id}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Hero da opção selecionada */}
      <div>
        <HeroSection option={OPTIONS[selected]} />
      </div>

      {/* Rodapé de aprovação */}
      <div style={{
        padding: '40px 28px', textAlign: 'center',
        borderTop: `1px solid ${C.border}`,
        background: C.navBg,
      }}>
        <p style={{ color: C.grayMd, fontSize: 13, marginBottom: 20 }}>
          Qual opção deseja implementar na home oficial?
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {OPTIONS.map((opt, i) => (
            <div key={opt.id} style={{
              padding: '14px 24px', borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.04)',
              textAlign: 'left', minWidth: 220,
            }}>
              <div style={{ fontSize: 11, color: C.btn, fontWeight: 700, marginBottom: 4 }}>OPÇÃO {opt.id}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 3 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: C.grayMd }}>{opt.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ color: C.grayMd, fontSize: 12, marginTop: 24 }}>
          Diga qual opção aprova e implemento imediatamente na home.
        </p>
      </div>

    </div>
  );
}
