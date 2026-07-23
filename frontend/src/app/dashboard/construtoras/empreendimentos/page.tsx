'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import {
  Building2, Search, ArrowUpDown, ChevronRight,
  Loader2, Users, Bell, ToggleLeft, ToggleRight,
  Shield, ShieldOff, HardHat,
} from 'lucide-react';

interface Construtora {
  id: string; nome_fantasia: string; logo_url: string | null;
  user_id: string; nome: string; email: string; ativo: boolean;
  plano_nome: string | null; total_empreendimentos: number;
  publicados: number; total_leads: number; created_at: string;
}

type Ordem = 'nome_asc' | 'nome_desc' | 'data_asc' | 'data_desc' | 'emps_desc';

export default function AdminConstrutorasListPage() {
  const [items, setItems]     = useState<Construtora[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca]     = useState('');
  const [ordem, setOrdem]     = useState<Ordem>('data_desc');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    adminApi.listarConstrutoras()
      .then(r => setItems(r.data))
      .catch(() => toast.error('Erro ao carregar construtoras'))
      .finally(() => setLoading(false));
  }, []);

  const toggleAtivo = async (userId: string) => {
    setToggling(userId);
    try {
      const { data } = await adminApi.toggleAtivo(userId);
      setItems(prev => prev.map(c => c.user_id === userId ? { ...c, ativo: data.ativo } : c));
      toast.success(data.ativo ? 'Conta reativada' : 'Conta desativada');
    } catch {
      toast.error('Erro ao alterar status');
    } finally {
      setToggling(null);
    }
  };

  const filtrados = useMemo(() => {
    let list = items.filter(c =>
      busca === '' ||
      (c.nome_fantasia ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      c.email.toLowerCase().includes(busca.toLowerCase()),
    );
    switch (ordem) {
      case 'nome_asc':   return [...list].sort((a, b) => (a.nome_fantasia ?? '').localeCompare(b.nome_fantasia ?? ''));
      case 'nome_desc':  return [...list].sort((a, b) => (b.nome_fantasia ?? '').localeCompare(a.nome_fantasia ?? ''));
      case 'data_asc':   return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'data_desc':  return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'emps_desc':  return [...list].sort((a, b) => b.total_empreendimentos - a.total_empreendimentos);
      default: return list;
    }
  }, [items, busca, ordem]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary-600" /> Construtoras
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Clique em uma construtora para ver seus empreendimentos</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-primary-700 text-xl">{items.length}</p>
            <p className="text-primary-600">Total</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-green-700 text-xl">{items.filter(c => c.ativo).length}</p>
            <p className="text-green-600">Ativas</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por nome ou e-mail..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={ordem} onChange={e => setOrdem(e.target.value as Ordem)}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-400"
          >
            <option value="data_desc">Mais recentes</option>
            <option value="data_asc">Mais antigas</option>
            <option value="nome_asc">Nome A→Z</option>
            <option value="nome_desc">Nome Z→A</option>
            <option value="emps_desc">+ empreendimentos</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="card divide-y divide-gray-100">
        {filtrados.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            {busca ? 'Nenhum resultado.' : 'Nenhuma construtora cadastrada.'}
          </div>
        )}

        {filtrados.map(c => (
          <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
            {/* Logo / avatar */}
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden border border-primary-200">
              {c.logo_url
                ? <img src={c.logo_url} alt={c.nome_fantasia} className="w-full h-full object-cover" />
                : <span className="text-primary-700 font-bold text-lg">{(c.nome_fantasia ?? c.nome)?.[0]?.toUpperCase()}</span>}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-900 truncate">{c.nome_fantasia ?? c.nome}</p>
                {c.ativo
                  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">Ativa</span>
                  : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">Inativa</span>}
              </div>
              <p className="text-xs text-gray-500 truncate">{c.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {c.plano_nome ?? 'Sem plano'} · cadastro {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden md:flex flex-col items-center gap-1 px-4 shrink-0">
              <div className="flex gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-primary-400" />{c.total_empreendimentos} emp.</span>
                <span className="flex items-center gap-1.5"><Bell className="w-4 h-4 text-amber-400" />{c.total_leads} leads</span>
              </div>
              <p className="text-xs text-gray-400">{c.publicados} publicados</p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Ativar/desativar conta */}
              <button
                onClick={() => toggleAtivo(c.user_id)}
                disabled={toggling === c.user_id}
                title={c.ativo ? 'Desativar conta' : 'Reativar conta'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                  c.ativo
                    ? 'border-primary-200 text-primary-700 hover:bg-primary-50'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {toggling === c.user_id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : c.ativo ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{c.ativo ? 'Ativa' : 'Inativa'}</span>
              </button>

              {/* Ver empreendimentos */}
              <Link
                href={`/dashboard/construtoras/empreendimentos/${c.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Empreendimentos</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
