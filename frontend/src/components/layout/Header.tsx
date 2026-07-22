'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import {
  LogIn, LayoutDashboard, Bell, Heart, UserPlus, Handshake,
  Menu, X, Home, Handshake as HandshakeIcon, Star, Calculator,
} from 'lucide-react';

const MENU_LINKS = [
  { href: '/',          label: 'Lançamentos',    icon: Home },
  { href: '/parceiros', label: 'Parceiros',       icon: HandshakeIcon },
  { href: '/favoritos', label: 'Favoritos',       icon: Heart },
  { href: '/simuladores', label: 'Simuladores',     icon: Calculator },
];

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
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
      {/* ── Mobile header ───────────────────────────────────── */}
      <div className="flex sm:hidden items-center justify-between h-14 px-4 relative">

        {/* Hamburguer esquerda */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute left-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              {MENU_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <Icon className="w-4 h-4 text-primary-500 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Logo centralizada */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="SóConstrutoras"
            width={28}
            height={36}
            className="object-contain"
            priority
          />
          <div className="leading-none">
            <span className="block font-bold text-[14px] text-gray-900 tracking-tight">
              <span className="text-primary-600">SÓ</span>CONSTRUTORAS
            </span>
            <span className="block text-[8px] text-gray-400 tracking-widest uppercase">
              Portal das Construtoras
            </span>
          </div>
        </Link>

        {/* Ação direita */}
        <div>{renderNavAction()}</div>
      </div>

      {/* ── Desktop header ──────────────────────────────────── */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-6 lg:px-8 items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="SóConstrutoras"
            width={32}
            height={42}
            className="object-contain"
            priority
          />
          <div className="leading-none">
            <span className="block font-bold text-[15px] text-gray-900 tracking-tight">
              <span className="text-primary-600">SÓ</span>CONSTRUTORAS
            </span>
            <span className="block text-[9px] text-gray-400 tracking-widest uppercase">
              Portal das Construtoras
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-5">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Imóveis
          </Link>
          <Link href="/parceiros" className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5">
            <Handshake className="w-4 h-4" />
            Parceiros
          </Link>
          <Link href="/simuladores" className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5">
            <Calculator className="w-4 h-4" />
            Simuladores
          </Link>
          {renderNavAction()}
        </nav>
      </div>
    </header>
  );
}
