'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { construtoraApi, adminApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Building2, Users, Bell, TrendingUp, Loader2, CheckCircle, LayoutGrid } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
  href?: string;
}

function StatCard({ label, value, icon: Icon, color, sub, href }: StatCardProps) {
  const inner = (
    <div className={`card p-6 flex items-center gap-4 transition-shadow${href ? ' hover:shadow-md hover:ring-2 hover:ring-primary-200 cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [stats, setStats]           = useState<any | null>(null);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (isAdmin) {
      adminApi.adminStats()
        .then(r => setAdminStats(r.data))
        .finally(() => setLoading(false));
    } else {
      construtoraApi.dashboard()
        .then(r => setStats(r.data))
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  /* ── ADMIN VIEW ─────────────────────────────────────── */
  if (isAdmin && adminStats) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Visão geral — Admin</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total de Construtoras"
            value={adminStats.total_construtoras ?? 0}
            icon={Building2}
            color="bg-primary-500"
            href="/dashboard/construtoras/empreendimentos"
          />
          <StatCard
            label="Total de Empreendimentos"
            value={adminStats.total_empreendimentos ?? 0}
            icon={LayoutGrid}
            color="bg-blue-500"
            href="/dashboard/construtoras/todos-empreendimentos"
          />
          <StatCard
            label="Total de Leads"
            value={adminStats.total_leads ?? 0}
            icon={Bell}
            color="bg-purple-500"
            href="/dashboard/construtoras/leads"
          />
        </div>

      </div>
    );
  }

  /* ── CONSTRUTORA VIEW — Corpore ────────────────────── */
  const taxa = stats && stats.total_leads > 0
    ? Math.round((stats.leads_convertidos / stats.total_leads) * 100)
    : 0;

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const acoes = [
    {
      label: 'Empreendimentos',
      sub: 'Gerenciar',
      href: '/dashboard/empreendimentos',
      icon: Building2,
      cor: '#0E8F6E',
      bg: 'rgba(14,143,110,0.08)',
    },
    {
      label: 'Leads',
      sub: `${stats?.leads_novos ?? 0} novo${(stats?.leads_novos ?? 0) !== 1 ? 's' : ''}`,
      href: '/dashboard/leads',
      icon: Bell,
      cor: '#3B82F6',
      bg: 'rgba(59,130,246,0.08)',
    },
    {
      label: 'CRM',
      sub: 'Modern Broker ↗',
      href: 'https://www.moderbroker.com.br',
      icon: TrendingUp,
      cor: '#8B5CF6',
      bg: 'rgba(139,92,246,0.08)',
      externo: true,
    },
    {
      label: 'A definir',
      sub: 'Em breve',
      href: '#',
      icon: LayoutGrid,
      cor: '#D1D5DB',
      bg: 'rgba(209,213,219,0.2)',
      desativado: true,
    },
  ];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Saudação */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Olá, {user?.nome?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: 4, textTransform: 'capitalize' }}>{hoje}</p>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { val: stats?.total_empreendimentos ?? 0, lbl: 'Empreendimentos', sub: `${stats?.publicados ?? 0} pub.` },
          { val: stats?.total_leads ?? 0,           lbl: 'Leads total',     sub: `${stats?.leads_novos ?? 0} novos` },
          { val: `${taxa}%`,                        lbl: 'Conversão',       sub: `${stats?.leads_convertidos ?? 0} conv.` },
        ].map(({ val, lbl, sub }) => (
          <div key={lbl} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0E8F6E' }}>{val}</div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 2 }}>{lbl}</div>
            <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* 4 botões de acesso rápido */}
      <p style={{ fontSize: '0.7rem', color: '#9CA3AF', letterSpacing: '0.07em', marginBottom: 10 }}>ACESSO RÁPIDO</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {acoes.map(({ label, sub, href, icon: Icon, cor, bg, externo, desativado }) => {
          const style: React.CSSProperties = {
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            cursor: desativado ? 'default' : 'pointer',
            opacity: desativado ? 0.5 : 1,
            transition: 'box-shadow 0.15s',
          };
          const inner = (
            <>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 24, height: 24, color: cor }} />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: desativado ? '#9CA3AF' : '#111827' }}>{label}</span>
              <span style={{ fontSize: '0.72rem', color: desativado ? '#D1D5DB' : cor }}>{sub}</span>
            </>
          );
          if (desativado) return <div key={label} style={style}>{inner}</div>;
          if (externo) return <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a>;
          return <Link key={label} href={href} style={style}>{inner}</Link>;
        })}
      </div>

      {/* Alerta leads novos */}
      {(stats?.leads_novos ?? 0) > 0 && (
        <Link href="/dashboard/leads" style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 20,
          background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 12, padding: '12px 16px', textDecoration: 'none',
        }}>
          <Bell style={{ width: 18, height: 18, color: '#3B82F6', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: '#1D4ED8', fontWeight: 500 }}>
            {stats?.leads_novos} lead{stats?.leads_novos !== 1 ? 's' : ''} novo{stats?.leads_novos !== 1 ? 's' : ''} aguardando atendimento
          </span>
          <TrendingUp style={{ width: 14, height: 14, color: '#93C5FD', marginLeft: 'auto' }} />
        </Link>
      )}
    </div>
  );
}
