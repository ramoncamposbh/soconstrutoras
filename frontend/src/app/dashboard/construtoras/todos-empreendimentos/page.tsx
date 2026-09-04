'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { LayoutGrid, Loader2, Search, Building2, CheckCircle, Clock, ArrowUpDown } from 'lucide-react';

interface Empreendimento {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  status: string;
  publicado: boolean;
  construtora_nome: string;
  construtora_id: string;
  total_leads: number;
  total_unidades: number;
  created_at?: string;
}

type SortKey = 'nome_asc' | 'nome_desc' | 'data_desc' | 'data_asc';

const STATUS_LABEL: Record<string, string> = {
  lancamento: 'Na Planta',
  em_obras:   'Em Construção',
  pronto:     'Pronto',
};

export default function TodosEmpreendimentosPage() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca]     = useState('');
  const [sortBy, setSortBy]   = useState<SortKey>('nome_asc');

  useEffect(() => {
    adminApi.listarEmpreendimentos()
      .then(r => setEmpreendimentos(Array.isArray(r.data) ? r.data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    const lista = empreendimentos.filter(e =>
      !busca || [e.nome, e.construtora_nome, e.cidade].some(v =>
        v?.toLowerCase().includes(busca.toLowerCase())
      )
    );
    return [...lista].sort((a, b) => {
      if (sortBy === 'nome_asc')  return a.nome.localeCompare(b.nome);
      if (sortBy === 'nome_desc') return b.nome.localeCompare(a.nome);
      if (sortBy === 'data_desc') return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      if (sortBy === 'data_asc')  return (a.created_at ?? '').localeCompare(b.created_at ?? '');
      return 0;
    });
  }, [empreendimentos, busca, sortBy]);

  const publicados = filtrados.filter(e => e.publicado).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LayoutGrid className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-900">Total de Empreendimentos</h1>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{filtrados.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{publicados}</p>
          <p className="text-xs text-gray-500 mt-0.5">Publicados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{filtrados.length - publicados}</p>
          <p className="text-xs text-gray-500 mt-0.5">Não publicados</p>
        </div>
      </div>

      {/* Busca + Ordenação */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, construtora ou cidade..."
              className="input pl-9 text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="input text-sm"
            >
              <option value="nome_asc">Nome A→Z</option>
              <option value="nome_desc">Nome Z→A</option>
              <option value="data_desc">Mais recente</option>
              <option value="data_asc">Mais antigo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-500 py-16 text-sm">Nenhum empreendimento encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Empreendimento', 'Construtora', 'Cidade / Estado', 'Status', 'Leads', 'Unidades', 'Publicado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        href={`/dashboard/construtoras/empreendimentos/${e.construtora_id}/${e.id}`}
                        className="hover:text-primary-600 hover:underline"
                      >
                        {e.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {e.construtora_nome}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {e.cidade}{e.estado ? ` — ${e.estado}` : ''}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {STATUS_LABEL[e.status] ?? e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-center">{e.total_leads ?? 0}</td>
                    <td className="px-4 py-3 text-gray-700 text-center">{e.total_unidades ?? 0}</td>
                    <td className="px-4 py-3">
                      {e.publicado
                        ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        : <Clock className="w-4 h-4 text-gray-300 mx-auto" />
                      }
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
