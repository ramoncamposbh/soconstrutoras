'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LogIn, LayoutDashboard, Bell, Heart,
  Menu, X, Home, Handshake, Calculator, Ruler, Rocket,
} from 'lucide-react';

const MENU_LINKS = [
  { href: '/lancamentos', label: 'Lançamentos',       icon: Rocket },
  { href: '/repasse',     label: 'Repasse',           icon: Home },
  { href: '/parceiros',   label: 'Parceiros',         icon: Handshake },
  { href: '/favoritos',   label: 'Favoritos',         icon: Heart },
  { href: '/simuladores', label: 'Simuladores',       icon: Calculator },
  { href: '/melhor-m2',   label: 'Oportunidades m²', icon: Ruler },
];

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const renderNavAction = () => {
    if (!isAuthenticated) {
      return (
        <Link
          href="/auth/login"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Entrar</span>
        </Link>
      );
    }
    if (user?.role === 'construtora' || user?.role === 'admin') {
      return (
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden sm:inline">Painel</span>
        </Link>
      );
    }
    if (user?.role === 'parceiro') {
      return (
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Meus Leads</span>
        </Link>
      );
    }
    if (user?.role === 'cliente') {
      return (
        <Link
          href="/favoritos"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Heart className="w-4 h-4" />
          <span className="hidden sm:inline">Favoritos</span>
        </Link>
      );
    }
    return null;
  };

  return (
    <header style={{ background: '#0B1D2A', borderBottom: '1px solid #1A3547' }} className="sticky top-0 z-50">

      {/* ── Mobile ───────────────────────────────────── */}
      <div className="flex sm:hidden items-center justify-between h-[62px] px-4 relative">

        {/* Hambúrguer esquerda */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ color: 'rgba(255,255,255,0.8)' }}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-12 w-56 rounded-2xl shadow-xl py-2 z-50"
              style={{ background: '#0F2535', border: '1px solid #1A3547' }}>
              {MENU_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                  style={{
                    color: pathname === href ? '#4ade80' : 'rgba(255,255,255,0.75)',
                    background: pathname === href ? 'rgba(74,222,128,0.08)' : 'transparent',
                    fontWeight: pathname === href ? 600 : 400,
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: pathname === href ? '#4ade80' : 'rgba(255,255,255,0.4)' }} />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Logo centralizada */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <div style={{ height: '44px', overflow: 'hidden' }}>
            <Image
              src="/logo-faicoh.png"
              alt="Faicoh"
              width={280}
              height={150}
              style={{ height: '82px', width: 'auto', marginTop: '-14px' }}
              priority
            />
          </div>
        </Link>

        {/* Ação direita */}
        <div>{renderNavAction()}</div>
      </div>

      {/* ── Desktop ──────────────────────────────────── */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-6 lg:px-8 items-center h-[72px] relative">

        {/* Nav esquerda */}
        <nav className="flex items-center gap-1 flex-1">
          {MENU_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: pathname === href ? '#4ade80' : 'rgba(255,255,255,0.7)',
                background: pathname === href ? 'rgba(74,222,128,0.08)' : 'transparent',
                fontWeight: pathname === href ? 600 : 400,
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logo centralizada absoluta */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <div style={{ height: '54px', overflow: 'hidden' }}>
            <Image
              src="/logo-faicoh.png"
              alt="Faicoh"
              width={340}
              height={183}
              style={{ height: '100px', width: 'auto', marginTop: '-17px' }}
              priority
            />
          </div>
        </Link>

        {/* Ação direita */}
        <div className="flex-1 flex justify-end">{renderNavAction()}</div>
      </div>
    </header>
  );
}
