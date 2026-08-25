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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">

      {/* ── Mobile ───────────────────────────────────── */}
      <div className="flex sm:hidden items-center justify-between h-[62px] px-4 relative">

        {/* Hambúrguer esquerda */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              {MENU_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                  style={{
                    color: pathname === href ? '#0E8F6E' : '#374151',
                    background: pathname === href ? 'rgba(14,143,110,0.06)' : 'transparent',
                    fontWeight: pathname === href ? 600 : 400,
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: pathname === href ? '#0E8F6E' : '#9CA3AF' }} />
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
      <div className="hidden sm:flex max-w-7xl mx-auto px-6 lg:px-8 items-center justify-between h-[72px]">

        {/* Logo desktop */}
        <Link href="/" className="flex items-center shrink-0">
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

        <nav className="flex items-center gap-1">
          {MENU_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: pathname === href ? '#0E8F6E' : '#6B7280',
                background: pathname === href ? 'rgba(14,143,110,0.07)' : 'transparent',
                fontWeight: pathname === href ? 600 : 400,
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="ml-2">{renderNavAction()}</div>
        </nav>
      </div>
    </header>
  );
}
