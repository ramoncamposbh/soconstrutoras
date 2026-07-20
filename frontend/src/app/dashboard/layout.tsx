'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import {
  LayoutDashboard, Building2, Users, Bell, LogOut,
  ChevronRight, Loader2, CreditCard, Menu, X, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',                 label: 'Visão geral',      icon: LayoutDashboard, roles: null },
  { href: '/dashboard/empreendimentos', label: 'Empreendimentos',  icon: Building2,       roles: null },
  { href: '/dashboard/parceiros',       label: 'Parceiros',        icon: Users,           roles: ['construtora', 'admin'] },
  { href: '/dashboard/leads',           label: 'Leads',            icon: Bell,            roles: null },
  { href: '/dashboard/lojas',           label: 'Lojas Parceiras',  icon: Store,           roles: ['admin'] },
  { href: '/dashboard/assinatura',      label: 'Assinatura',       icon: CreditCard,      roles: null },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarAberto, setSidebarAberto] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user?.role === 'cliente') {
        router.push('/favoritos');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => { setSidebarAberto(false); }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const itemsVisiveis = navItems.filter(
    (item) => item.roles === null || (user?.role && item.roles.includes(user.role)),
  );

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="SóConstrutoras" width={28} height={36} className="object-contain" />
          <div className="leading-none">
            <span className="block font-bold text-[14px] text-gray-900 tracking-tight">
              <span className="text-primary-600">SÓ</span>CONSTRUTORAS
            </span>
            <span className="block text-[8px] text-gray-400 tracking-widest uppercase">Portal das Construtoras</span>
          </div>
        </Link>
        <button
          onClick={() => setSidebarAberto(false)}
          className="md:hidden p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {itemsVisiveis.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {active && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
            {user?.nome?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.nome}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>

      {sidebarAberto && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarAberto(false)} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 md:hidden',
        sidebarAberto ? 'translate-x-0' : '-translate-x-full',
      )}>
        <SidebarContent />
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <div className="md:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarAberto(true)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="SóConstrutoras" width={24} height={30} className="object-contain" />
            <span className="font-bold text-[14px] text-gray-900 tracking-tight">
              <span className="text-primary-600">SÓ</span>CONSTRUTORAS
            </span>
          </Link>
          <div className="w-9" />
        </div>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
