'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import CardEmpreendimento from '@/components/empreendimentos/CardEmpreendimento';
import { empreendimentosApi } from '@/lib/api';
import { TIPOS_IMOVEL } from '@/lib/utils';
import type { Empreendimento } from '@/types';
import {
  Search, Map, LayoutGrid, Mic, MapPin, Navigation,
  Building2, Heart, TrendingUp, Leaf, Star,
  MessageCircle, Brain, Target, CheckCircle,
  ChevronDown, LogIn, UserPlus, Send,
  SlidersHorizontal, Home, Rocket, X, Users,
  BarChart2, Scale, Calculator,
} from 'lucide-react';

const MapaEmpreendimentos = dynamic(
  () => import('@/components/mapa/MapaEmpreendimentos'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Map className="w-8 h-8 text-gray-300 animate-pulse" />
      </div>
    ),
  },
);

// Opção B aprovada: Skyline Premium — edifícios modernos, vista urbana
const HERO_BG = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=85&auto=format&fit=crop';

function getCompatibilidade(id: string): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 82 + (hash % 17);
}

const PESQUISAS_RAPIDAS = [
  { label: 'Primeiro imóvel',   icon: Home,        query: { preco_max: 600000 } },
  { label: 'Investimento',      icon: TrendingUp,  query: {} },
  { label: 'Família',           icon: Users,       query: { quartos_min: 3 } },
  { label: 'Pet Friendly',      icon: Heart,       query: {} },
  { label: 'Natureza',          icon: Leaf,        query: {} },
  { label: 'Alto padrão',       icon: Star,        query: { preco_min: 1000000 } },
  { label: 'Perto do trabalho', icon: MapPin,      query: {} },
];

const AREAS = [
  { label: '30 m²', value: 30 }, { label: '50 m²', value: 50 },
  { label: '70 m²', value: 70 }, { label: '100 m²', value: 100 },
  { label: '150 m²', value: 150 }, { label: '200 m²', value: 200 },
];

const NAV_LINKS = [
  { href: '/',             label: 'Lançamentos',    icon: Rocket },
  { href: '/',             label: 'Empreendimentos',icon: Building2 },
  { href: '/auth/register',label: 'Construtoras',   icon: Building2 },
  { href: '/favoritos',    label: 'Favoritos',      icon: Heart },
  { href: '/',             label: 'Simuladores',    icon: Calculator },
  { href: '/',             label: 'Comparar',       icon: Scale },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [destacado, setDestacado] = useState<string | null>(null);
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
  const [aiText, setAiText] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [pesquisaAtiva, setPesquisaAtiva] = useState<string | null>(null);
  const [cidade, setCidade] = useState('');
  const [tipo, setTipo] = useState('');
  const [vagas, setVagas] = useState('');
  const [quartos, setQuartos] = useState('');
  const [area, setArea] = useState('');

  const buscar = useCallback(async (filtros: any = {}) => {
    setLoading(true);
    try {
      const { data } = await empreendimentosApi.buscarPublico(filtros);
      setEmpreendimentos(data);
    } catch {
      toast.error('Erro ao buscar imóveis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  const handleAiSearch = () => {
    if (!aiText.trim()) return;
    buscar({ cidade: aiText });
  };

  const handlePesquisaRapida = (item: typeof PESQUISAS_RAPIDAS[0]) => {
    setPesquisaAtiva(item.label);
    buscar(item.query);
  };

  const handleFiltros = () => {
    buscar({
      cidade: cidade || undefined,
      tipo: tipo || undefined,
      vagas: vagas ? parseInt(vagas) : undefined,
      quartos_min: quartos ? parseInt(quartos) : undefined,
      area_min: area ? parseInt(area) : undefined,
    });
  };

  // Parallax hero
  const bgRef   = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const handleHeroMouseMove = useCallback((e: MouseEvent) => {
    if (!bgRef.current || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    bgRef.current.style.transform = `scale(1.06) translate(${x * -12}px, ${y * -8}px)`;
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    if (!bgRef.current) return;
    bgRef.current.style.transform = 'scale(1.06) translate(0,0)';
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.addEventListener('mousemove', handleHeroMouseMove);
    el.addEventListener('mouseleave', handleHeroMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleHeroMouseMove);
      el.removeEventListener('mouseleave', handleHeroMouseLeave);
    };
  }, [handleHeroMouseMove, handleHeroMouseLeave]);

  const comCoordenadas = empreendimentos.filter(
    (e) => e.latitude != null && e.longitude != null,
  ) as any[];

  const renderNavBtn = () => {
    if (!isAuthenticated) return (
      <div className="flex items-center gap-2">
        <Link href="/auth/register"
          className="hidden sm:flex items-center gap-1.5 text-xs text-primary-300 hover:text-white font-medium transition-colors whitespace-nowrap">
          <UserPlus className="w-3.5 h-3.5" /> Cadastrar
        </Link>
        <Link href="/auth/login"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
          <LogIn className="w-3.5 h-3.5" /> Entrar
        </Link>
      </div>
    );
    return (
      <Link
        href={user?.role === 'construtora' || user?.role === 'admin' ? '/dashboard' : '/'}
        className="flex items-center gap-2 whitespace-nowrap shrink-0"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8ECEB',
          borderRadius: 10,
          padding: '6px 14px 6px 8px',
          transition: 'border-color 0.15s',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0"
          style={{ background: '#D1FAE5', color: '#0A6A52' }}
        >
          {user?.nome?.[0]?.toUpperCase()}
        </div>
        <div className="leading-tight">
          <span className="block text-[9.5px]" style={{ color: '#9CA3AF' }}>Olá,</span>
          <span className="block text-[13px] font-bold" style={{ color: '#1F2937' }}>
            {user?.nome?.split(' ')[0]}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 ml-1" style={{ color: '#9CA3AF' }} />
      </Link>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* ══ MOBILE HEADER (apenas mobile) ══ */}
      <div className="md:hidden sticky top-0 z-50 bg-white" style={{ boxShadow: '0 1px 0 #E5E7EB' }}>
        {/* Linha logo + entrar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="SóConstrutoras" width={34} height={34} className="object-contain" priority />
            <div className="leading-tight">
              <span className="block font-extrabold text-[12px]" style={{ color: '#04241D' }}>SÓCONSTRUTORAS</span>
              <span className="block text-[9px]" style={{ color: '#9CA3AF' }}>Portal das Construtoras</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link href={user?.role === 'construtora' || user?.role === 'admin' ? '/dashboard' : '/'}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: '#D1FAE5', color: '#0A6A52' }}>
                  {user?.nome?.[0]?.toUpperCase()}
                </div>
              </Link>
            ) : (
              <Link href="/auth/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                style={{ background: '#0E8F6E' }}>
                Entrar
              </Link>
            )}
          </div>
        </div>

        {/* Barra de busca */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
            style={{ background: '#F9FAF9', borderColor: '#E5E7EB' }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
            <input
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAiSearch(); }}
              placeholder="Cidade, bairro ou tipo de imóvel..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              style={{ color: '#1F2937' }}
            />
            <button onClick={handleAiSearch}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#0E8F6E' }}>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Chips de pesquisa rápida */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {PESQUISAS_RAPIDAS.map(({ label, icon: Icon, query }) => (
            <button key={label}
              onClick={() => handlePesquisaRapida({ label, icon: Icon, query })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all"
              style={pesquisaAtiva === label
                ? { background: '#0E8F6E', color: '#fff' }
                : { background: '#F0FAF7', color: '#0E8F6E', border: '1px solid #C6EDE1' }
              }>
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ NAVBAR DESKTOP (oculto no mobile) ══ */}
      <nav
        className="hidden md:flex sticky top-0 z-50 h-[66px] items-center px-5 md:px-7 gap-0"
        style={{ background: '#04241D', borderBottom: '1px solid #19483D' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-4">
          <Image
            src="/logo.png"
            alt="SóConstrutoras"
            width={44}
            height={44}
            className="object-contain"
            priority
          />
          <div className="leading-tight">
            <span className="block font-extrabold tracking-widest" style={{ color: '#FFFFFF', fontSize: 13.5 }}>
              SÓCONSTRUTORAS
            </span>
            <span className="block uppercase tracking-[0.14em]" style={{ color: '#AAB5B2', fontSize: 7.5 }}>
              Portal das Construtoras
            </span>
          </div>
        </Link>

        {/* Início — botão pill */}
        <Link
          href="/"
          className="hidden md:flex items-center gap-2 text-white text-[13px] font-semibold shrink-0 mr-1"
          style={{
            background: '#0E8F6E',
            border: '1px solid #16A37F',
            padding: '8px 20px',
            borderRadius: 12,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#16A37F')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0E8F6E')}
        >
          <Home className="w-[15px] h-[15px]" /> Início
        </Link>

        {/* Links nav */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={label} href={href}
              className="flex items-center gap-[5px] text-[12.5px] px-[11px] py-2 rounded-lg transition-all whitespace-nowrap"
              style={{ color: '#AAB5B2' }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.background = '#19483D';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#AAB5B2';
                e.currentTarget.style.background = 'transparent';
              }}>
              <Icon className="w-[14px] h-[14px]" strokeWidth={1.5} /> {label}
            </Link>
          ))}
        </div>

        {/* Botão direito */}
        <div className="ml-auto">{renderNavBtn()}</div>
      </nav>

      {/* ══ HERO — Skyline Premium (Opção B aprovada) — apenas desktop ══ */}
      <section
        ref={heroRef}
        className="hidden md:block relative px-4 md:px-8 pt-7 pb-6 shrink-0 overflow-hidden"
      >
        {/* Foto de fundo com parallax */}
        <div
          ref={bgRef}
          style={{
            position: 'absolute', inset: '-3%',
            backgroundImage: `url('${HERO_BG}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            filter: 'blur(1.5px) brightness(0.55) saturate(0.75)',
            transform: 'scale(1.06)',
            transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
            willChange: 'transform',
          }}
        />
        {/* Overlay gradiente direcional identidade visual */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, rgba(3,29,24,0.96) 0%, rgba(3,29,24,0.90) 40%, rgba(3,29,24,0.75) 65%, rgba(3,29,24,0.48) 100%)',
        }} />
        {/* Vinheta */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3,29,24,0.55) 100%)',
        }} />
        {/* Grid tecnológico discreto */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.035 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0E8F6E" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_270px] gap-5 items-start" style={{ position: 'relative', zIndex: 5 }}>

          {/* ── Coluna esquerda ── */}
          <div className="flex flex-col gap-4">

            {/* Heading */}
            <div>
              <h1 className="text-[26px] md:text-[32px] font-bold leading-tight mb-1.5" style={{ color: '#ffffff' }}>
                Encontre o imóvel ideal
              </h1>
              <h1 className="text-[26px] md:text-[32px] font-bold leading-tight" style={{ color: '#4ade80' }}>
                conversando com nossa IA
              </h1>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: '#86efac' }}>
                Conte como é o imóvel que você procura. Nossa IA entende suas necessidades
                e encontra as melhores opções para você.
              </p>
            </div>

            {/* Campo IA */}
            <div className="bg-white rounded-2xl p-3 shadow-2xl">
              <div className="flex gap-2.5 items-start">
                <MessageCircle className="w-5 h-5 mt-1 shrink-0" style={{ color: '#22c55e' }} />
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSearch(); }
                  }}
                  placeholder="Conte como é o imóvel que você procura..."
                  rows={2}
                  className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 resize-none outline-none leading-relaxed"
                />
                <button onClick={handleAiSearch}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors mt-0.5"
                  style={{ background: '#22c55e' }}>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-[11px] mt-1.5 ml-7" style={{ color: '#9ca3af' }}>
                Exemplos: "Quero um apartamento perto do Colégio Santo Antônio" · "Tenho dois filhos e trabalho na Savassi" · "Quero investir até R$ 900 mil"
              </p>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: Mic,        label: 'Falar' },
                { icon: Navigation, label: 'Usar minha localização' },
                { icon: MapPin,     label: 'Adicionar localização' },
              ].map(({ icon: Icon, label }) => (
                <button key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#bbf7d0' }}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Divisor "ou use os filtros tradicionais" */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.55)' }}>
                ou use os filtros tradicionais
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Filtros tradicionais — sempre visíveis */}
            <div className="p-4 rounded-2xl border flex flex-wrap gap-2.5 items-end"
              style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' }}>

              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Cidade ou bairro</label>
                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Savassi, Nova Lima..."
                  className="px-3 py-2 text-xs rounded-lg outline-none"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: '#f0fdf4' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg outline-none"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: '#f0fdf4' }}>
                  <option value="">Todos</option>
                  {TIPOS_IMOVEL.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Suítes</label>
                <select
                  value={quartos}
                  onChange={(e) => setQuartos(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg outline-none"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: '#f0fdf4' }}>
                  <option value="">Qualquer</option>
                  {[1,2,3,4].map((n) => <option key={n} value={n}>{n}+ suítes</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Vagas</label>
                <select
                  value={vagas}
                  onChange={(e) => setVagas(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg outline-none"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: '#f0fdf4' }}>
                  <option value="">Qualquer</option>
                  {[1,2,3,4].map((n) => <option key={n} value={n}>{n}+ vagas</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Área mín.</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg outline-none"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: '#f0fdf4' }}>
                  <option value="">Qualquer</option>
                  {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}+</option>)}
                </select>
              </div>

              <button
                onClick={handleFiltros}
                className="flex items-center gap-1.5 px-5 py-2 text-white text-xs font-semibold rounded-lg transition-colors"
                style={{ background: '#22c55e' }}>
                <Search className="w-3.5 h-3.5" /> Buscar
              </button>
            </div>
          </div>

          {/* ── Coluna direita: Perfil ── */}
          <div className="hidden md:flex flex-col rounded-2xl border p-4"
            style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white">Seu perfil imobiliário</h3>
              <button className="text-[10px] transition-colors" style={{ color: '#4ade80' }}>Editar ✏️</button>
            </div>

            {isAuthenticated ? (
              <>
                {/* Gauge */}
                <div className="flex justify-center mb-3">
                  <div className="relative w-[88px] h-[88px]">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="9"
                        strokeDasharray="251.2" strokeDashoffset={251.2 * 0.17} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">83%</span>
                      <span className="text-[8px]" style={{ color: '#4ade80' }}>Perfil encontrado</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-3 flex-1">
                  {['Família com dois filhos','Trabalha na Savassi','Renda familiar informada',
                    'Orçamento até R$ 1,6 mi','Até 20 min de deslocamento','Pet Friendly','Vista definitiva','Condomínio clube',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-[11px]" style={{ color: '#bbf7d0' }}>
                      <CheckCircle className="w-3 h-3 shrink-0" style={{ color: '#22c55e' }} /> {item}
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl p-3 border" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <p className="text-[11px] font-semibold text-white mb-0.5">Falta pouco!</p>
                  <p className="text-[10px] mb-2" style={{ color: '#86efac' }}>Complete seu perfil para resultados ainda melhores.</p>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: '83%', background: '#22c55e' }} />
                  </div>
                  <span className="text-[9px] mt-1 block text-right" style={{ color: '#4ade80' }}>83%</span>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <Target className="w-7 h-7" style={{ color: '#4ade80' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Crie seu perfil</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#86efac' }}>
                    Receba recomendações personalizadas baseadas nas suas preferências
                  </p>
                </div>
                <Link href="/auth/register"
                  className="inline-flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  style={{ background: '#22c55e' }}>
                  <UserPlus className="w-3.5 h-3.5" /> Criar perfil grátis
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ BARRA DE RESULTADOS ══ */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 shrink-0">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div>
            {loading ? (
              <>
                <div className="w-64 h-6 bg-gray-100 rounded animate-pulse mb-1.5" />
                <div className="w-44 h-3.5 bg-gray-100 rounded animate-pulse" />
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {empreendimentos.length} empreendimento{empreendimentos.length !== 1 ? 's' : ''} encontrado{empreendimentos.length !== 1 ? 's' : ''} para você
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Ordenados por compatibilidade com seu perfil
                  {pesquisaAtiva && (
                    <button onClick={() => { setPesquisaAtiva(null); buscar(); }}
                      className="ml-2 inline-flex items-center gap-1 font-medium" style={{ color: '#0E8F6E' }}>
                      · {pesquisaAtiva} <X className="w-3 h-3" />
                    </button>
                  )}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button className="hidden md:flex items-center gap-1.5 text-sm font-semibold border rounded-lg px-3 py-1.5 transition-colors"
              style={{ color: '#0E8F6E', borderColor: '#0E8F6E' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0FAF7'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <Map className="w-3.5 h-3.5" /> Ver no mapa
            </button>
            <div className="flex md:hidden items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setVista('lista')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${vista === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                <LayoutGrid className="w-3 h-3" /> Lista
              </button>
              <button onClick={() => setVista('mapa')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${vista === 'mapa' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                <Map className="w-3 h-3" /> Mapa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ CARDS + MAPA ══ */}
      <div className="flex h-[60vh] md:h-[calc(100vh-370px)] md:min-h-[380px] md:mx-4 md:mt-2 md:rounded-xl md:border md:border-gray-200 overflow-hidden pb-16 md:pb-0">

        {/* Cards */}
        <div className={`w-full md:w-[55%] xl:w-[52%] md:overflow-y-auto bg-[#f9fafb] md:shrink-0 ${vista === 'mapa' ? 'hidden md:block' : 'block'}`}>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : empreendimentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <Building2 className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Nenhum empreendimento encontrado.</p>
              <p className="text-gray-400 text-sm mt-1">Tente outros filtros ou busca por IA.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
              {empreendimentos.map((emp) => {
                const compat = getCompatibilidade(emp.id);
                return (
                  <div key={emp.id}
                    onMouseEnter={() => setDestacado(emp.id)}
                    onMouseLeave={() => setDestacado(null)}>
                    <CardEmpreendimento emp={emp} compatibilidade={compat} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className={`flex-1 relative border-l border-gray-200 ${vista === 'lista' ? 'hidden md:flex' : 'flex'}`}>
          <div className="absolute inset-0">
            {!loading && (
              <MapaEmpreendimentos empreendimentos={comCoordenadas} destacado={destacado} altura="100%" />
            )}
          </div>
        </div>
      </div>

      {/* ══ COMO FUNCIONA (apenas desktop) ══ */}
      <section className="hidden md:block" style={{ background: '#fff', borderTop: '1px solid #F3F4F6', padding: '28px 32px', marginTop: 8 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, alignItems: 'stretch' }}>
            {/* Título */}
            <div style={{ flex: '0 0 220px', paddingRight: 28, borderRight: '1px solid #F3F4F6', marginRight: 28 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Como funciona nossa IA
              </p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                Um processo simples para encontrar o imóvel ideal.
              </p>
            </div>

            {/* Steps */}
            {[
              { icon: MessageCircle, n: 1, title: 'Converse com a IA',        desc: 'Conte suas necessidades em linguagem natural.' },
              { icon: Brain,         n: 2, title: 'IA analisa seu perfil',     desc: 'Entendemos seu momento de vida e preferências.' },
              { icon: Target,        n: 3, title: 'Encontramos o ideal',       desc: 'Buscamos entre milhares de imóveis novos.' },
              { icon: CheckCircle,   n: 4, title: 'Resultados personalizados', desc: 'Você recebe apenas imóveis compatíveis com você.' },
            ].map(({ icon: Icon, n, title, desc }) => (
              <div key={n} style={{ flex: '1 1 160px', display: 'flex', gap: 10, paddingRight: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: '#F0FAF7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color="#0E8F6E" />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1F2937', marginBottom: 3 }}>{n}. {title}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER SIMPLES ══ */}
      <footer style={{ background: '#04241D', borderTop: '1px solid #19483D', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0E8F6E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#AAB5B2', letterSpacing: '0.05em' }}>SÓCONSTRUTORAS</span>
          </div>
          <p style={{ fontSize: 11, color: '#19483D' }}>© {new Date().getFullYear()} SóConstrutoras. Todos os direitos reservados.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidade', 'Termos', 'Contato'].map(l => (
              <a key={l} href="#" style={{ fontSize: 11, color: '#AAB5B2', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#AAB5B2'; }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>


      {/* ══ BOTTOM NAV MOBILE ══ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
        style={{ boxShadow: '0 -1px 0 #E5E7EB' }}>
        <div className="flex">
          {[
            { href: '/',              icon: Home,      label: 'Início'    },
            { href: '/busca',         icon: Search,    label: 'Buscar'    },
            { href: '/favoritos',     icon: Heart,     label: 'Favoritos' },
            {
              href: isAuthenticated
                ? (user?.role === 'construtora' || user?.role === 'admin' ? '/dashboard' : '/')
                : '/auth/login',
              icon: isAuthenticated ? Users : LogIn,
              label: isAuthenticated ? 'Painel' : 'Entrar',
            },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={label} href={href}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#0E8F6E'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}>
              <Icon className="w-5 h-5" strokeWidth={1.6} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
