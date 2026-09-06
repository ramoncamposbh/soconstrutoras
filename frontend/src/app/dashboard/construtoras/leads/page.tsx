'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { adminApi } from '@/lib/api';
import { Bell, Filter, Loader2, Search, X, ArrowUpDown } from 'lucide-react';

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  empreendimento_id: string;
  empreendimento_nome: string;
  construtora_nome: string;
  construtora_id: string;
}

interface LeadsPorConstrutora {
  construtora_id: string;
  construtora_nome: string;
  total_leads: number;
  leads_novos: number;
}

const STATUS_COLORS: Record<string, string> = {
  novo:       'bg-purple-100 text-purple-700',
  contato:    'bg-blue-100 text-blue-700',
  convertido: 'bg-green-100 text-green-700',
  perdido:    'bg-red-100 text-red-700',
};

export default function AdminLeadsPage() {
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [construtoras, setConstrutoras] = useState<LeadsPorConstrutora[]>([]);
  const [loading, setLoading]           = useState(false);

  // Filtros
  const [construtoraId, setConstrutoraId]     = useState('');
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [dataInicio, setDataInicio]           = useState('');
  const [dataFim, setDataFim]                 = useState('');
  const [busca, setBusca]                     = useState('');
  const [sortBy, setSortBy]                   = useState<'data_desc'|'data_asc'|'nome_asc'|'nome_desc'>('data_desc');

  const buscarLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (construtoraId) params.construtora_id = construtoraId;
      if (dataInicio)    params.data_inicio    = dataInicio;
      if (dataFim)       params.data_fim       = dataFim;
      const r = await adminApi.adminLeads(params);
      setLeads(Array.isArray(r.data) ? r.data : []);
    } finally {
      setLoading(false);
    }
  }, [construtoraId, dataInicio, dataFim]);

  // Carrega construtoras para o select (via adminStats)
  useEffect(() => {
    adminApi.adminStats().then(r => {
      setConstrutoras(r.data?.leads_por_construtora ?? []);
    });
    buscarLeads();
  }, [buscarLeads]);

  const limparFiltros = () => {
    setConstrutoraId(''); setEmpreendimentoId(''); setDataInicio(''); setDataFim(''); setBusca('');
  };

  // Lista de empreendimentos derivada dos leads carregados (filtrada por construtora selecionada)
  const empreendimentosDisponiveis = useMemo(() => {
    const fonte = construtoraId
      ? leads.filter(l => l.construtora_id === construtoraId)
      : leads;
    const mapa = new Map<string, string>();
    fonte.forEach(l => { if (l.empreendimento_id) mapa.set(l.empreendimento_id, l.empreendimento_nome); });
    return Array.from(mapa.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [leads, construtoraId]);

  const leadsFiltrados = [...leads.filter(l =>
    (!empreendimentoId || l.empreendimento_id === empreendimentoId) &&
    (!busca || [l.nome, l.email, l.telefone, l.empreendimento_nome].some(v =>
      v?.toLowerCase().includes(busca.toLowerCase())
    ))
  )].sort((a, b) => {
    if (sortBy === 'data_desc') return b.created_at.localeCompare(a.created_at);
    if (sortBy === 'data_asc')  return a.created_at.localeCompare(b.created_at);
    if (sortBy === 'nome_asc')  return a.nome.localeCompare(b.nome);
    if (sortBy === 'nome_desc') return b.nome.localeCompare(a.nome);
    return 0;
  });

  const total     = leadsFiltrados.length;
  const totalNovos = leadsFiltrados.filter(l => l.status === 'novo').length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold text-gray-900">Total de Leads</h1>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',      value: total,       color: 'text-gray-900' },
          { label: 'Novos',      value: totalNovos,  color: 'text-purple-600' },
          { label: 'Convertidos',value: leadsFiltrados.filter(l => l.status === 'convertido').length, color: 'text-green-600' },
          { label: 'Perdidos',   value: leadsFiltrados.filter(l => l.status === 'perdido').length,    color: 'text-red-500' },
        ].map(c => (
          <div key={c.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
          {(construtoraId || empreendimentoId || dataInicio || dataFim) && (
            <button onClick={limparFiltros} className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-500">
              <X className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={construtoraId}
            onChange={e => { setConstrutoraId(e.target.value); setEmpreendimentoId(''); }}
            className="input text-sm"
          >
            <option value="">Todas as construtoras</option>
            {construtoras.map(c => (
              <option key={c.construtora_id} value={c.construtora_id}>
                {c.construtora_nome} ({c.total_leads} leads)
              </option>
            ))}
          </select>
          <select
            value={empreendimentoId}
            onChange={e => setEmpreendimentoId(e.target.value)}
            className="input text-sm"
          >
            <option value="">Todos os empreendimentos</option>
            {empreendimentosDisponiveis.map(([id, nome]) => (
              <option key={id} value={id}>{nome}</option>
            ))}
          </select>
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="input text-sm"
            placeholder="Data início"
          />
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="input text-sm"
            placeholder="Data fim"
          />
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="input text-sm flex-1"
            >
              <option value="data_desc">Data ↓ recente</option>
              <option value="data_asc">Data ↑ antigo</option>
              <option value="nome_asc">Nome A→Z</option>
              <option value="nome_desc">Nome Z→A</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, telefone ou empreendimento..."
              className="input pl-9 text-sm w-full"
            />
          </div>
          <button
            onClick={buscarLeads}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : leadsFiltrados.length === 0 ? (
          <p className="text-center text-gray-500 py-16 text-sm">Nenhum lead encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Data', 'Nome', 'Contato', 'Empreendimento', 'Construtora', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leadsFiltrados.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{l.nome}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{l.email}</div>
                      <div className="text-xs text-gray-400">{l.telefone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{l.empreendimento_nome}</td>
                    <td className="px-4 py-3 text-gray-600">{l.construtora_nome}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
