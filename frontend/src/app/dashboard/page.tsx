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

        {/* Leads por construtora */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Leads por construtora</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Construtora</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Total leads</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Novos</th>
                </tr>
              </thead>
              <tbody>
                {(adminStats.leads_por_construtora ?? []).map((c: any) => (
                  <tr key={c.construtora_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{c.construtora_nome}</td>
                    <td className="py-2 text-right text-gray-700">{c.total_leads}</td>
                    <td className="py-2 text-right">
                      {c.leads_novos > 0
                        ? <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">{c.leads_novos} novo{c.leads_novos !== 1 ? 's' : ''}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ── CONSTRUTORA VIEW ───────────────────────────────── */
  const taxa = stats && stats.total_leads > 0
    ? Math.round((stats.leads_convertidos / stats.total_leads) * 100)
    : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visão geral</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Empreendimentos"
          value={stats?.total_empreendimentos ?? 0}
          icon={Building2}
          color="bg-primary-500"
          sub={`${stats?.publicados ?? 0} publicado${stats?.publicados !== 1 ? 's' : ''}`}
          href="/dashboard/empreendimentos"
        />
        <StatCard
          label="Total de leads"
          value={stats?.total_leads ?? 0}
          icon={Bell}
          color="bg-purple-500"
          sub={`${stats?.leads_novos ?? 0} novo${stats?.leads_novos !== 1 ? 's' : ''}`}
          href="/dashboard/leads"
        />
        <StatCard
          label="Convertidos"
          value={stats?.leads_convertidos ?? 0}
          icon={CheckCircle}
          color="bg-green-500"
          href="/dashboard/leads"
        />
        <StatCard
          label="Taxa de conversão"
          value={`${taxa}%`}
          icon={TrendingUp}
          color="bg-orange-500"
          sub={`${stats?.total_parceiros ?? 0} parceiros ativos`}
          href="/dashboard/parceiros"
        />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Próximas ações recomendadas</h2>
        <div className="space-y-3">
          {(stats?.publicados ?? 0) === 0 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <Building2 className="w-5 h-5 flex-shrink-0" />
              Publique seu primeiro empreendimento para começar a receber leads.
            </div>
          )}
          {(stats?.total_parceiros ?? 0) === 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <Users className="w-5 h-5 flex-shrink-0" />
              Adicione parceiros para que os leads sejam distribuídos automaticamente.
            </div>
          )}
          {(stats?.leads_novos ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg text-sm text-purple-800">
              <Bell className="w-5 h-5 flex-shrink-0" />
              Você tem {stats?.leads_novos} lead{stats?.leads_novos !== 1 ? 's' : ''} novo{stats?.leads_novos !== 1 ? 's' : ''} aguardando atendimento.
            </div>
          )}
          {(stats?.publicados ?? 0) > 0 && (stats?.total_parceiros ?? 0) > 0 && (stats?.leads_novos ?? 0) === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Tudo em dia! Nenhuma ação pendente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
