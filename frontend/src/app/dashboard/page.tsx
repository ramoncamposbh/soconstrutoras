'use client';

import { useEffect, useState } from 'react';
import { construtoraApi } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { Building2, Users, Bell, TrendingUp, Loader2, CheckCircle } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, color, sub }: StatCardProps) {
  return (
    <div className="card p-6 flex items-center gap-4">
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
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    construtoraApi.dashboard()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

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
        />
        <StatCard
          label="Total de leads"
          value={stats?.total_leads ?? 0}
          icon={Bell}
          color="bg-purple-500"
          sub={`${stats?.leads_novos ?? 0} novo${stats?.leads_novos !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Convertidos"
          value={stats?.leads_convertidos ?? 0}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          label="Taxa de conversão"
          value={`${taxa}%`}
          icon={TrendingUp}
          color="bg-orange-500"
          sub={`${stats?.total_parceiros ?? 0} parceiros ativos`}
        />
      </div>

      {/* Próximas ações */}
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
