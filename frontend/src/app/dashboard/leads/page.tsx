'use client';

import { useEffect, useState } from 'react';
import { leadsApi } from '@/lib/api';
import type { Lead } from '@/types';
import { STATUS_LEAD } from '@/lib/utils';
import { Bell, Filter, Loader2, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');

  const buscar = async (status?: string) => {
    setLoading(true);
    try {
      const { data } = await leadsApi.meus(status ? { status } : {});
      setLeads(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { buscar(); }, []);

  const statusInfo = (status: string) =>
    STATUS_LEAD.find((s) => s.value === status) ?? STATUS_LEAD[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="input w-48"
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              buscar(e.target.value || undefined);
            }}
          >
            <option value="">Todos os status</option>
            {STATUS_LEAD.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum lead {filtroStatus ? 'com este status' : 'registrado ainda'}.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {leads.map((lead) => {
            const info = statusInfo(lead.status);
            return (
              <div key={lead.id} className="p-4 flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                  {lead.nome[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{lead.nome}</p>
                    <span className={cn('badge', info.color)}>{info.label}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-1">
                    {lead.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {lead.telefone}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400">
                    {lead.empreendimento && <span className="font-medium text-gray-500">{lead.empreendimento} · </span>}
                    {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {lead.parceiro_nome && ` · Atribuído a ${lead.parceiro_nome}`}
                  </p>

                  {lead.mensagem && (
                    <p className="text-sm text-gray-500 mt-1 italic">"{lead.mensagem}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
