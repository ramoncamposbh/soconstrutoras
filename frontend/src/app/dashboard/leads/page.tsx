'use client';

import { useEffect, useState } from 'react';
import { leadsApi } from '@/lib/api';
import type { Lead } from '@/types';
import { STATUS_LEAD } from '@/lib/utils';
import { Bell, Filter, Loader2, Phone, Mail, X, Building2, User, Calendar, MessageSquare, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroEmp, setFiltroEmp] = useState('');
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);

  const empreendimentos = Array.from(
    new Map(
      leads
        .filter((l) => l.empreendimento && l.empreendimento_id)
        .map((l) => [l.empreendimento_id, l.empreendimento])
    ).entries()
  );

  const buscar = async (status?: string, empreendimento_id?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (empreendimento_id) params.empreendimento_id = empreendimento_id;
      const { data } = await leadsApi.meus(params);
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
            className="input w-52"
            value={filtroEmp}
            onChange={(e) => {
              setFiltroEmp(e.target.value);
              buscar(filtroStatus || undefined, e.target.value || undefined);
            }}
          >
            <option value="">Todos os empreendimentos</option>
            {empreendimentos.map(([id, nome]) => (
              <option key={id} value={id}>{nome}</option>
            ))}
          </select>
          <select
            className="input w-48"
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              buscar(e.target.value || undefined, filtroEmp || undefined);
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
              <div
                key={lead.id}
                className="p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setLeadSelecionado(lead)}
              >
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

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    {lead.empreendimento && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span className="font-medium text-gray-500">{lead.empreendimento}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {lead.parceiro_nome && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium text-primary-700">{lead.parceiro_nome}</span>
                        {lead.parceiro_email && (
                          <span className="text-gray-400">({lead.parceiro_email})</span>
                        )}
                      </span>
                    )}
                  </div>

                  {lead.mensagem && (
                    <p className="text-sm text-gray-500 mt-1 italic">"{lead.mensagem}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalhe do lead */}
      {leadSelecionado && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setLeadSelecionado(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                  {leadSelecionado.nome[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{leadSelecionado.nome}</p>
                  <span className={cn('badge text-xs', statusInfo(leadSelecionado.status).color)}>
                    {statusInfo(leadSelecionado.status).label}
                  </span>
                </div>
              </div>
              <button onClick={() => setLeadSelecionado(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-5 space-y-4">
              {/* Dados do interessado */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dados do interessado</p>
                <div className="space-y-2">
                  {leadSelecionado.telefone && (
                    <a href={`tel:${leadSelecionado.telefone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
                      <Phone className="w-4 h-4 text-gray-400" /> {leadSelecionado.telefone}
                    </a>
                  )}
                  {leadSelecionado.email && (
                    <a href={`mailto:${leadSelecionado.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
                      <Mail className="w-4 h-4 text-gray-400" /> {leadSelecionado.email}
                    </a>
                  )}
                  {leadSelecionado.mensagem && (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="italic">"{leadSelecionado.mensagem}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Empreendimento */}
              {leadSelecionado.empreendimento && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Empreendimento</p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Building2 className="w-4 h-4 text-gray-400" /> {leadSelecionado.empreendimento}
                  </div>
                </div>
              )}

              {/* Parceiro atribuído */}
              {leadSelecionado.parceiro_nome && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Parceiro atribuído</p>
                  <div className="bg-primary-50 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary-800">
                      <User className="w-4 h-4" /> {leadSelecionado.parceiro_nome}
                    </div>
                    {leadSelecionado.parceiro_email && (
                      <div className="flex items-center gap-2 text-sm text-primary-600">
                        <Mail className="w-4 h-4" /> {leadSelecionado.parceiro_email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recebido em</p>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {format(new Date(leadSelecionado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>

              {/* UTM (se existir) */}
              {(leadSelecionado.utm_source || leadSelecionado.utm_medium || leadSelecionado.utm_campaign) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Origem</p>
                  <div className="flex flex-wrap gap-2">
                    {leadSelecionado.utm_source && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">source: {leadSelecionado.utm_source}</span>
                    )}
                    {leadSelecionado.utm_medium && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">medium: {leadSelecionado.utm_medium}</span>
                    )}
                    {leadSelecionado.utm_campaign && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">campaign: {leadSelecionado.utm_campaign}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <a
                href={`https://wa.me/55${leadSelecionado.telefone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center block py-2.5 rounded-xl font-semibold text-sm"
              >
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
