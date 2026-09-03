'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import LogoFaicoh from '@/components/layout/LogoFaicoh';
import {
  LayoutDashboard, Building2, Users, Bell, LogOut,
  ChevronRight, ChevronDown, Loader2, CreditCard, Menu, X, Store, Calculator,
  HardHat, UserCog, Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Itens simples
const navItems = [
  { href: '/dashboard',                 label: 'Visão geral',      icon: LayoutDashboard, roles: null },
  { href: '/dashboard/empreendimentos', label: 'Empreendimentos',  icon: Building2,       roles: null },
  { href: '/dashboard/parceiros',       label: 'Parceiros',        icon: Users,           roles: ['construtora', 'admin'] },
  { href: '/dashboard/leads',           label: 'Leads',            icon: Bell,            roles: null },
  { href: '/dashboard/simulacoes',      label: 'Simulações',       icon: Calculator,      roles: ['admin'] },
  { href: '/dashboard/lojas',           label: 'Lojas Parceiras',  icon: Store,           roles: ['admin'] },
  { href: '/dashboard/imoveis-usados',   label: 'Imóveis Usados',   icon: Home,            roles: ['construtora'] },
  { href: '/dashboard/assinatura',      label: 'Assinatura',       icon: CreditCard,      roles: null },
];

// Sub-itens da seção Construtoras (só admin)
const construtorasSubItems = [
  { href: '/dashboard/construtoras/empreendimentos', label: 'Empreendimentos', icon: Building2 },
  { href: '/dashboard/construtoras/usuarios',        label: 'Usuários',        icon: UserCog   },
  { href: '/dashboard/construtoras/imoveis-usados',  label: 'Imóveis Usados',  icon: Home      },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const [construtorasAberto, setConstrutorasAberto] = useState(false);

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

  // Abre automaticamente se estiver numa rota de Construtoras
  useEffect(() => {
    if (pathname.startsWith('/dashboard/construtoras')) setConstrutorasAberto(true);
  }, [pathname]);

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
      <div
        className="relative flex items-center justify-between px-5 py-5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #04241D 0%, #0E8F6E 100%)' }}
      >
        {/* círculos decorativos */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

        <Link href="/" className="relative flex flex-col gap-0.5 shrink-0">
          <LogoFaicoh height={36} textColor="white" />
          <span className="text-white/60 text-[10px] tracking-widest uppercase pl-0.5">Portal do Construtor</span>
        </Link>
        <button
          onClick={() => setSidebarAberto(false)}
          className="md:hidden relative p-1 text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {itemsVisiveis.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

          // Após "Visão geral", injeta o grupo Construtoras (só para admin)
          const isVisaoGeral = href === '/dashboard';
          const injectConstrutoras = isVisaoGeral && user?.role === 'admin';

          return (
            <div key={href}>
              <Link
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

              {/* ── Grupo Construtoras (admin only) ── */}
              {injectConstrutoras && (
                <div className="mt-1">
                  <button
                    onClick={() => setConstrutorasAberto(v => !v)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      pathname.startsWith('/dashboard/construtoras')
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    <HardHat className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">Construtoras</span>
                    {construtorasAberto
                      ? <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  </button>

                  {construtorasAberto && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-primary-100 pl-3">
                      {construtorasSubItems.map(({ href: sub, label: subLabel, icon: SubIcon }) => {
                        const subActive = pathname.startsWith(sub);
                        return (
                          <Link
                            key={sub}
                            href={sub}
                            className={cn(
                              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                              subActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                            )}
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            {subLabel}
                            {subActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
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
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14"
          style={{ background: 'linear-gradient(90deg, #04241D, #0E8F6E)' }}>
          <button onClick={() => setSidebarAberto(true)} className="p-2 -ml-2 text-white/80 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/">
            <LogoFaicoh height={26} textColor="white" />
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
