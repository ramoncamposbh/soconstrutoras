'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  BarChart2, Scale, Calculator, Info,
  LogOut, LayoutDashboard, Bell, Handshake, Menu,
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

type PesquisaRapida = { label: string; icon: React.ComponentType<{ className?: string }>; query: Record<string, number> };
const PESQUISAS_RAPIDAS: PesquisaRapida[] = [
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
  { href: '/parceiros',    label: 'Parceiros',       icon: Handshake },
  { href: '/favoritos',    label: 'Favoritos',      icon: Heart },
  { href: '/',             label: 'Simuladores',    icon: Calculator },
  { href: '/',             label: 'Comparar',       icon: Scale },
];

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    // iOS Safari não suporta Web Speech API — usa input de voz nativo
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isIOS || !SR) {
      // No iOS, ativa o teclado de voz nativo via input
      const input = document.querySelector('textarea[placeholder*="imóvel"]') as HTMLTextAreaElement;
      if (input) {
        input.focus();
        toast('🎤 Toque no microfone do teclado para falar', { duration: 4000 });
      } else {
        toast('🎤 Toque no campo de texto e use o microfone do teclado', { duration: 4000 });
      }
      return;
    }

    const recognition = new SR();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    toast('🎤 Fale agora...', { duration: 3000 });
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiText(transcript);
      setIsListening(false);
      setTimeout(() => handleAiSearch(), 400);
    };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        toast.error('Permita o acesso ao microfone nas configurações do navegador.');
      } else {
        toast.error('Não foi possível reconhecer. Tente novamente.');
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

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
  const [mensagemBusca, setMensagemBusca] = useState<{ texto: string; sugestoes: string[] } | null>(null);
  const [buscaProgresso, setBuscaProgresso] = useState<{
    pais: string; estado: string; cidade: string; regiao: string;
    totalConstrutoras: number | null; totalImoveis: number | null;
    etapa: number; // 0=início 1=país✓ 2=estado✓ 3=cidade✓ 4=construtoras✓ 5=imóveis✓ 6=região✓=done
  } | null>(null);

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

  /** Mapa de regiões de BH → bairros que pertencem a cada uma */
  const REGIOES_BH: Record<string, { label: string; bairros: string[] }> = {
    'centro sul': {
      label: 'Centro-Sul',
      bairros: ['Funcionários', 'Lourdes', 'Santo Antônio', 'Savassi', 'Serra',
                'Sion', 'Anchieta', 'Carmo', 'Luxemburgo', 'Santa Efigênia',
                'São Pedro', 'Belvedere', 'Cidade Jardim', 'Barro Preto'],
    },
    'leste': {
      label: 'Leste',
      bairros: ['Horto', 'Santa Inês', 'Santa Tereza', 'Colégio Batista',
                'Floresta', 'Santa Efigênia', 'Sagrada Família', 'Ipiranga'],
    },
    'norte': {
      label: 'Norte',
      bairros: ['Lagoinha', 'Floresta', 'Concórdia', 'Cachoeirinha', 'Caiçara'],
    },
    'noroeste': {
      label: 'Noroeste',
      bairros: ['Padre Eustáquio', 'Carlos Prates', 'Coração Eucarístico', 'Caiçara'],
    },
    'oeste': {
      label: 'Oeste',
      bairros: ['Gutierrez', 'Buritis', 'Nova Granada', 'Gameleira', 'Estoril'],
    },
    'sul': {
      label: 'Sul',
      bairros: ['Castelo', 'Mangabeiras', 'Jardim América', 'Bandeirantes'],
    },
    'pampulha': {
      label: 'Pampulha',
      bairros: ['Pampulha', 'Glória', 'Mantiqueira', 'Caiçara', 'Planalto'],
    },
    'venda nova': {
      label: 'Venda Nova',
      bairros: ['Venda Nova', 'Ribeiro de Abreu', 'Jardim Leblon'],
    },
  };

  const normalizarTexto = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /**
   * Parser de linguagem natural.
   * Retorna filtros para o backend + metadados de região para filtro client-side.
   */
  const parseAiQuery = (texto: string): {
    filtros: Record<string, any>;
    regiaoKey: string | null;
    regiaoLabel: string | null;
    bairrosRegiao: string[];
  } => {
    const t = normalizarTexto(texto);
    const filtros: Record<string, any> = {};
    let regiaoKey: string | null = null;
    let regiaoLabel: string | null = null;
    let bairrosRegiao: string[] = [];

    // Tipo de imóvel
    if (/apart|apto/.test(t))               filtros.tipo = 'apartamento';
    else if (/casa|sobrado/.test(t))        filtros.tipo = 'casa';
    else if (/terreno|lote/.test(t))        filtros.tipo = 'terreno';
    else if (/comercial|loja|sala/.test(t)) filtros.tipo = 'comercial';
    else if (/studio|kitnet|kit/.test(t))   filtros.tipo = 'studio';

    // Quartos
    const mQuartos = t.match(/(\d+)\s*quarto/);
    if (mQuartos) {
      const n = parseInt(mQuartos[1]);
      filtros.quartos_min = n > 10 ? Math.round(n / 10) : n;
      if (n > 10) toast(`Interpretando "${n} quartos" como ${filtros.quartos_min} quartos.`, { icon: '💡' });
    }

    // Vagas
    const mVagas = t.match(/(\d+)\s*vaga/);
    if (mVagas) filtros.vagas = parseInt(mVagas[1]);

    // Preço máximo
    const mPreco = t.match(/ate\s+r?\$?\s*([\d.]+)\s*(mil|k|reais)?/);
    if (mPreco) {
      const v = parseFloat(mPreco[1].replace('.', ''));
      filtros.preco_max = /mil|k/.test(mPreco[2] ?? '') ? v * 1000 : v;
    }

    // Regiões de BH (ordem importa: mais específico primeiro)
    const ordemRegioes = ['noroeste', 'centro sul', 'venda nova', 'pampulha',
                          'leste', 'norte', 'oeste', 'sul'];
    for (const key of ordemRegioes) {
      if (t.includes(key)) {
        regiaoKey   = key;
        regiaoLabel = REGIOES_BH[key].label;
        bairrosRegiao = REGIOES_BH[key].bairros;
        filtros.cidade = 'Belo Horizonte';
        break;
      }
    }

    // Cidade
    if (!filtros.cidade) {
      if (/\bbh\b|belo horizonte/.test(t)) filtros.cidade = 'Belo Horizonte';
      else if (/nova lima/.test(t))         filtros.cidade = 'Nova Lima';
      else if (/contagem/.test(t))          filtros.cidade = 'Contagem';
      else if (/betim/.test(t))             filtros.cidade = 'Betim';
    }

    // Bairros específicos mapeados por nome → cidade
    const mapaBairros: Record<string, string> = {
      savassi: 'Belo Horizonte', funcionarios: 'Belo Horizonte',
      lourdes: 'Belo Horizonte', 'santo antonio': 'Belo Horizonte',
      gutierrez: 'Belo Horizonte', pampulha: 'Belo Horizonte',
      buritis: 'Belo Horizonte', belvedere: 'Belo Horizonte',
      floresta: 'Belo Horizonte', barreiro: 'Belo Horizonte',
      contorno: 'Belo Horizonte', sereno: 'Nova Lima',
      'vale do sereno': 'Nova Lima', alphaville: 'Nova Lima',
    };
    if (!filtros.cidade) {
      for (const [k, v] of Object.entries(mapaBairros)) {
        if (t.includes(k)) { filtros.cidade = v; break; }
      }
    }

    // ── Detecção de bairro explícito ──────────────────────────────
    // Ex: "no bairro união", "bairro savassi", "no uniao"
    if (bairrosRegiao.length === 0) {
      // Padrão "no bairro X" ou "bairro X"
      const mBairroExplicito = texto.toLowerCase()
        .match(/(?:no\s+bairro|pelo\s+bairro|bairro)\s+([\wáàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇ]+(?:\s+(?:do|da|de|dos|das)\s+[\wáàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇ]+)?)/);

      // Fallback: "no X" onde X não é preposição/artigo
      const mNoX = !mBairroExplicito
        ? texto.toLowerCase()
            .match(/\bno\s+((?!bairro|centro|norte|sul|leste|oeste|estado|pais|bh)[áàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇa-z]+(?:\s+(?:do|da|de|dos|das)\s+[áàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇa-z]+)?)/)
        : null;

      const bairroDetectado = mBairroExplicito?.[1]?.trim() || mNoX?.[1]?.trim() || null;

      if (bairroDetectado) {
        // Capitaliza para exibição (ex: "uniao" → "Uniao")
        regiaoLabel = bairroDetectado
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        // bairrosRegiao em texto normalizado para comparação client-side
        bairrosRegiao = [normalizarTexto(bairroDetectado)];
        if (!filtros.cidade) filtros.cidade = 'Belo Horizonte'; // assume BH se não foi informado
      }
    }

    return { filtros, regiaoKey, regiaoLabel, bairrosRegiao };
  };

  /** Identifica em quais regiões de BH os empreendimentos estão */
  const detectarRegioes = (lista: any[]): string[] => {
    const regioesCom: string[] = [];
    for (const [, { label, bairros }] of Object.entries(REGIOES_BH)) {
      const bairrosNorm = bairros.map(normalizarTexto);
      const temNessa = lista.some((e) =>
        e.bairro && bairrosNorm.some((b) => normalizarTexto(e.bairro).includes(b))
      );
      if (temNessa && !regioesCom.includes(label)) regioesCom.push(label);
    }
    return regioesCom;
  };

  /** Aguarda N ms (helper para animação sequencial) */
  const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const handleAiSearch = async () => {
    if (!aiText.trim()) return;
    setMensagemBusca(null);
    const { filtros, regiaoLabel, bairrosRegiao } = parseAiQuery(aiText);

    // ── Inicia modal de progresso ──
    setBuscaProgresso({
      pais: 'Brasil',
      estado: 'Minas Gerais',
      cidade: filtros.cidade || 'Todas as cidades',
      regiao: regiaoLabel || 'Todas as regiões',
      totalConstrutoras: null,
      totalImoveis: null,
      etapa: 0,
    });
    setLoading(true);

    // Avança etapas 1-3 enquanto a API responde (ritmo legível ~900ms por etapa)
    const t1 = setTimeout(() => setBuscaProgresso((p) => p ? { ...p, etapa: 1 } : null),  900);
    const t2 = setTimeout(() => setBuscaProgresso((p) => p ? { ...p, etapa: 2 } : null), 1800);
    const t3 = setTimeout(() => setBuscaProgresso((p) => p ? { ...p, etapa: 3 } : null), 2700);

    try {
      const { data } = await empreendimentosApi.buscarPublico(filtros);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);

      const totalConstrutoras = new Set(data.map((e: any) => e.construtora)).size;
      const totalImoveis = data.length;

      // Completa animação com dados reais (800ms por etapa final)
      setBuscaProgresso((p) => p ? { ...p, etapa: 4, totalConstrutoras } : null);
      await esperar(800);
      setBuscaProgresso((p) => p ? { ...p, etapa: 5, totalImoveis } : null);
      await esperar(800);
      setBuscaProgresso((p) => p ? { ...p, etapa: 6 } : null);
      await esperar(1200);
      setBuscaProgresso(null);

      // ── Processa resultados ──
      if (bairrosRegiao.length > 0 && data.length > 0) {
        const bairrosNorm = bairrosRegiao.map(normalizarTexto);
        const filtrado = data.filter((e: any) =>
          e.bairro && bairrosNorm.some((b) => normalizarTexto(e.bairro).includes(b))
        );
        if (filtrado.length > 0) {
          setEmpreendimentos(filtrado);
        } else {
          const regioesSugeridas = detectarRegioes(data);
          setEmpreendimentos(data);
          setMensagemBusca({
            texto: `Não encontramos imóveis com esse perfil na Região ${regiaoLabel}.`,
            sugestoes: regioesSugeridas.length > 0
              ? [`Mas temos opções próximas na${regioesSugeridas.length > 1 ? 's' : ''} Região ${regioesSugeridas.join(' e ')} — confira abaixo:`]
              : ['Mostrando os imóveis disponíveis mais próximos do seu perfil:'],
          });
        }
      } else {
        setEmpreendimentos(data);
        if (data.length === 0) {
          setMensagemBusca({
            texto: 'Nenhum imóvel encontrado com esses critérios.',
            sugestoes: ['Tente ampliar os filtros — menos quartos, outra região ou sem filtro de preço.'],
          });
        }
      }
    } catch {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setBuscaProgresso(null);
      toast.error('Erro ao buscar imóveis.');
    } finally {
      setLoading(false);
    }
  };

  const handlePesquisaRapida = (item: PesquisaRapida) => {
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
      <button
        onClick={() => setUserMenuOpen((v) => !v)}
        className="flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
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
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* ══ MENU GLOBAL DO USUÁRIO ══ */}
      {userMenuOpen && isAuthenticated && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9000 }} onClick={() => setUserMenuOpen(false)} />
          <div style={{
            position: 'fixed', top: 70, right: 16, zIndex: 9001,
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 192, overflow: 'hidden',
          }}>
            {(user?.role === 'construtora' || user?.role === 'admin') && (
              <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <LayoutDashboard className="w-4 h-4 text-primary-500" /> Painel
              </Link>
            )}
            {user?.role === 'parceiro' && (
              <Link href="/dashboard/leads" onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Bell className="w-4 h-4 text-primary-500" /> Meus Leads
              </Link>
            )}
            {user?.role === 'cliente' && (
              <Link href="/favoritos" onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Heart className="w-4 h-4 text-primary-500" /> Favoritos
              </Link>
            )}
            <div style={{ borderTop: '1px solid #F3F4F6' }} />
            <button onClick={() => { setUserMenuOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </>
      )}

      {/* ══ MOBILE HEADER (apenas mobile) ══ */}
      <div className="md:hidden sticky top-0 z-50 bg-white" style={{ boxShadow: '0 1px 0 #E5E7EB' }}>
        {/* Linha logo + entrar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 relative">

          {/* Hamburguer esquerda */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#F0FAF7', color: '#0E8F6E' }}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', left: 0, top: 44, width: 210,
                background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid #E5E7EB', padding: '6px 0', zIndex: 9999,
              }}>
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px', fontSize: 14, color: '#1F2937',
                      textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0FAF7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon style={{ width: 16, height: 16, color: '#0E8F6E', flexShrink: 0 }} />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Logo centralizada */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <Image src="/logo.png" alt="SóConstrutoras" width={30} height={30} className="object-contain" priority />
            <div className="leading-tight">
              <span className="block font-extrabold text-[12px]" style={{ color: '#04241D' }}>SÓCONSTRUTORAS</span>
              <span className="block text-[9px]" style={{ color: '#9CA3AF' }}>Portal das Construtoras</span>
            </div>
          </Link>

          {/* Ação direita */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#D1FAE5', color: '#0A6A52' }}>
                {user?.nome?.[0]?.toUpperCase()}
              </button>
            ) : (
              <Link href="/auth/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                style={{ background: '#0E8F6E' }}>
                Entrar
              </Link>
            )}
          </div>
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
        className="block relative px-4 md:px-8 pt-5 pb-6 shrink-0 overflow-hidden"
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
              <button
                onClick={startVoiceSearch}
                disabled={isListening}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all"
                style={{
                  background: isListening ? '#0E8F6E' : 'rgba(255,255,255,0.08)',
                  borderColor: isListening ? '#0E8F6E' : 'rgba(255,255,255,0.18)',
                  color: '#bbf7d0',
                  animation: isListening ? 'pulse 1s infinite' : 'none',
                }}>
                <Mic className="w-3.5 h-3.5" />
                {isListening ? 'Ouvindo...' : 'Falar'}
              </button>
              <button
                onClick={() => {
                  if (!navigator.geolocation) { toast.error('Geolocalização não disponível.'); return; }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      setAiText(`Imóveis perto de mim (lat ${latitude.toFixed(4)}, lng ${longitude.toFixed(4)})`);
                      toast.success('Localização obtida!');
                    },
                    () => toast.error('Não foi possível obter sua localização.')
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#bbf7d0' }}>
                <Navigation className="w-3.5 h-3.5" /> Usar minha localização
              </button>
              <button
                onClick={() => {
                  const cidade = prompt('Digite a cidade ou bairro:');
                  if (cidade) setAiText(`Imóveis em ${cidade}`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#bbf7d0' }}>
                <MapPin className="w-3.5 h-3.5" /> Adicionar localização
              </button>
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

          {/* ── Coluna direita: Perfil (oculto mobile) ── */}
          <div className="hidden md:block" className="hidden md:flex flex-col rounded-2xl border p-4"
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
      <div className={`flex md:h-[calc(100vh-370px)] md:min-h-[380px] md:mx-4 md:mt-2 md:rounded-xl md:border md:border-gray-200 md:overflow-hidden pb-16 md:pb-0 ${vista === 'mapa' ? 'h-[calc(100vh-180px)]' : ''}`}>

        {/* Cards */}
        <div className={`w-full md:w-[55%] xl:w-[52%] overflow-y-auto bg-[#f9fafb] md:shrink-0 ${vista === 'mapa' ? 'hidden md:block' : 'block'}`}>
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
              <MapaEmpreendimentos empreendimentos={comCoordenadas} destacado={destacado} altura="100%" visivel={vista === 'mapa'} />
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

      {/* ══ MODAL: Progresso da busca IA ══ */}
      {buscaProgresso && (() => {
        const { pais, estado, cidade, regiao, totalConstrutoras, totalImoveis, etapa } = buscaProgresso;
        const pct = Math.round((etapa / 6) * 100);
        const R = 44; const C = 2 * Math.PI * R;
        const offset = C - (pct / 100) * C;
        const itens = [
          { label: 'País',                  valor: pais,                                                     e: 1 },
          { label: 'Estado',                valor: estado,                                                   e: 2 },
          { label: 'Cidade',                valor: cidade,                                                   e: 3 },
          { label: 'Construtoras consultadas', valor: totalConstrutoras !== null ? `${totalConstrutoras} encontradas` : 'Verificando...', e: 4 },
          { label: 'Imóveis consultados',   valor: totalImoveis !== null ? `${totalImoveis} disponíveis` : 'Verificando...', e: 5 },
          { label: 'Região / Bairro',       valor: regiao,                                                   e: 6 },
        ];
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5 shadow-2xl"
              style={{ background: 'linear-gradient(160deg, #0A2318 0%, #0C3525 100%)', border: '1px solid #1B5C3E' }}>

              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#0E8F6E' }}>
                  <Building2 size={15} color="#fff" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs tracking-widest">SÓCONSTRUTORAS</p>
                  <p className="text-[9px] tracking-wider" style={{ color: '#22D497' }}>PORTAL DAS CONSTRUTORAS</p>
                </div>
              </div>

              {/* Título + círculo de progresso */}
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="48" cy="48" r={R} fill="none" stroke="#1B5C3E" strokeWidth="8" />
                    <circle cx="48" cy="48" r={R} fill="none" stroke="#22D497" strokeWidth="8"
                      strokeDasharray={C} strokeDashoffset={offset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.45s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white font-bold text-xl">{pct}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-white font-bold text-base">Busca em andamento</p>
                  <p className="text-sm mt-0.5" style={{ color: '#A7C4BB' }}>
                    {etapa < 6 ? 'Verificando sua solicitação...' : 'Concluído!'}
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-2.5 py-1">
                {itens.map(({ label, valor, e }) => {
                  const done    = etapa >= e;
                  const current = etapa === e - 1;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle size={18} style={{ color: '#22D497', flexShrink: 0 }} />
                      ) : current ? (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                          style={{ borderColor: '#22D497', borderTopColor: 'transparent' }} />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 flex-shrink-0" style={{ borderColor: '#1B5C3E' }} />
                      )}
                      <div className="min-w-0">
                        <span className="text-xs" style={{ color: '#718C84' }}>{label}  </span>
                        {done && (
                          <span className="text-sm font-semibold text-white">{valor}</span>
                        )}
                        {current && (
                          <span className="text-xs italic" style={{ color: '#A7C4BB' }}>verificando...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra de progresso */}
              <div>
                <p className="text-xs mb-1.5 font-semibold" style={{ color: '#718C84' }}>
                  {etapa < 6 ? 'Verificando orçamento...' : 'Análise completa!'}
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <div className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #0E8F6E, #22D497)',
                      width: `${pct}%`,
                      transition: 'width 0.45s ease',
                    }} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL: Sugestão de região quando sem resultados ══ */}
      {mensagemBusca && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #0D2B22 0%, #0A3D2C 100%)', border: '1px solid #1A5440' }}
          >
            {/* Ícone central */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ border: '4px solid #0E8F6E', background: 'rgba(14,143,110,0.12)' }}
              >
                <MapPin className="w-9 h-9" style={{ color: '#22D497' }} />
              </div>
              <h3 className="text-white text-lg font-bold text-center mt-1">
                Região não disponível
              </h3>
            </div>

            {/* Mensagem principal */}
            <p className="text-sm text-center" style={{ color: '#A7C4BB', lineHeight: 1.6 }}>
              {mensagemBusca.texto}
            </p>

            {/* Sugestões */}
            {mensagemBusca.sugestoes.length > 0 && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid #1A5440' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#22D497' }}>
                  Sugestão
                </p>
                {mensagemBusca.sugestoes.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22D497' }} />
                    <span className="text-sm" style={{ color: '#CBD5E1', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Botão OK */}
            <button
              onClick={() => setMensagemBusca(null)}
              className="w-full py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95"
              style={{ background: 'linear-gradient(90deg, #0E8F6E, #22D497)', color: '#fff', letterSpacing: '0.02em' }}
            >
              Ok, entendi
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
