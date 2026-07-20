'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { LogIn, LayoutDashboard, Bell, Heart, UserPlus } from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated } = useAuth();

  // Botão de ação baseado no perfil
  const renderNavAction = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center gap-2">
          <Link
            href="/auth/register"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </Link>
        </div>
      );
    }

    if (user?.role === 'construtora' || user?.role === 'admin') {
      return (
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Painel
        </Link>
      );
    }

    if (user?.role === 'parceiro') {
      return (
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          Meus Leads
        </Link>
      );
    }

    if (user?.role === 'cliente') {
      return (
        <Link
          href="/favoritos"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Heart className="w-4 h-4" />
          Favoritos
        </Link>
      );
    }

    return null;
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
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
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors hidden sm:block">
            Imóveis
          </Link>
          {renderNavAction()}
        </nav>
      </div>
    </header>
  );
}
