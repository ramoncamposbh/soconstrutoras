'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import {
  Building2, Search, ArrowUpDown, ChevronRight,
  Loader2, Bell, Shield, ShieldOff, HardHat,
  Pencil, Trash2, AlertTriangle, X, CheckCircle,
} from 'lucide-react';

interface Construtora {
  id: string; nome_fantasia: string; logo_url: string | null;
  user_id: string; nome: string; email: string; ativo: boolean;
  plano_nome: string | null; total_empreendimentos: number;
  publicados: number; total_leads: number; created_at: string;
}

type Ordem = 'nome_asc' | 'nome_desc' | 'data_asc' | 'data_desc' | 'emps_desc';

export default function AdminConstrutorasListPage() {
  const [items, setItems]       = useState<Construtora[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busca, setBusca]       = useState('');
  const [ordem, setOrdem]       = useState<Ordem>('data_desc');
  const [toggling, setToggling] = useState<string | null>(null);

  // Editar
  const [editandoId, setEditandoId]   = useState<string | null>(null);
  const [editNome, setEditNome]       = useState('');
  const [salvando, setSalvando]       = useState(false);

  // Excluir
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const [deletando, setDeletando]     = useState<string | null>(null);

  useEffect(() => {
    adminApi.listarConstrutoras()
      .then(r => setItems(r.data))
      .catch(() => toast.error('Erro ao carregar construtoras'))
      .finally(() => setLoading(false));
  }, []);

  const toggleAtivo = async (u: Construtora) => {
    setToggling(u.user_id);
    try {
      const { data } = await adminApi.toggleAtivo(u.user_id);
      setItems(prev => prev.map(c => c.user_id === u.user_id ? { ...c, ativo: data.ativo } : c));
      toast.success(data.ativo ? 'Conta reativada' : 'Conta desativada');
    } catch { toast.error('Erro ao alterar status'); }
    finally { setToggling(null); }
  };

  const abrirEditar = (c: Construtora) => {
    setEditNome(c.nome_fantasia ?? c.nome);
    setEditandoId(c.id);
  };

  const salvarEditar = async () => {
    if (!editandoId) return;
    setSalvando(true);
    try {
      const { data } = await adminApi.editarConstrutora(editandoId, { nome_fantasia: editNome });
      setItems(prev => prev.map(c => c.id === editandoId ? { ...c, nome_fantasia: data.nome_fantasia } : c));
      toast.success('Nome atualizado');
      setEditandoId(null);
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  };

  const deletar = async (id: string) => {
    setDeletando(id); setConfirmarId(null);
    try {
      await adminApi.deletarConstrutora(id);
      setItems(prev => prev.filter(c => c.id !== id));
      toast.success('Construtora excluída');
    } catch { toast.error('Erro ao excluir'); }
    finally { setDeletando(null); }
  };

  const filtrados = useMemo(() => {
    let list = items.filter(c =>
      busca === '' ||
      (c.nome_fantasia ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      c.email.toLowerCase().includes(busca.toLowerCase()),
    );
    switch (ordem) {
      case 'nome_asc':  return [...list].sort((a, b) => (a.nome_fantasia ?? '').localeCompare(b.nome_fantasia ?? ''));
      case 'nome_desc': return [...list].sort((a, b) => (b.nome_fantasia ?? '').localeCompare(a.nome_fantasia ?? ''));
      case 'data_asc':  return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'data_desc': return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'emps_desc': return [...list].sort((a, b) => b.total_empreendimentos - a.total_empreendimentos);
      default: return list;
    }
  }, [items, busca, ordem]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  const nomeConfirmar = confirmarId ? (items.find(c => c.id === confirmarId)?.nome_fantasia ?? '') : '';

  return (
    <div>
      {/* Modal editar */}
      {editandoId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Editar construtora</h3>
              <button onClick={() => setEditandoId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block mb-5">
              <span className="text-sm font-semibold text-gray-700">Nome fantasia</span>
              <input
                type="text" value={editNome}
                onChange={e => setEditNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && salvarEditar()}
                autoFocus
                className="mt-1.5 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 font-medium"
              />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setEditandoId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={salvarEditar} disabled={salvando || !editNome.trim()}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmarId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Excluir construtora</h3>
                <p className="text-xs text-gray-500">Ação irreversível</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Você está prestes a excluir permanentemente <strong>{nomeConfirmar}</strong> e <strong>todos os seus dados</strong>:
            </p>
            <ul className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-5 space-y-1">
              <li>• Todos os empreendimentos</li>
              <li>• Todos os leads e favoritos</li>
              <li>• Todas as unidades e fotos</li>
              <li>• O usuário e acesso ao sistema</li>
            </ul>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => deletar(confirmarId)} disabled={!!deletando}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                {deletando === confirmarId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}

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
          <input type="text" placeholder="Buscar por nome ou e-mail..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={ordem} onChange={e => setOrdem(e.target.value as Ordem)}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-400">
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
                {c.plano_nome ?? 'Sem plano'} · {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden md:flex flex-col items-end gap-1 px-3 shrink-0 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary-400" />{c.total_empreendimentos} emp.</span>
              <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-amber-400" />{c.total_leads} leads</span>
            </div>

            {/* ── Ações ── */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {/* Toggle ativo */}
              <button
                onClick={() => toggleAtivo(c)}
                disabled={toggling === c.user_id}
                title={c.ativo ? 'Desativar conta' : 'Reativar conta'}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  c.ativo
                    ? 'border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {toggling === c.user_id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : c.ativo ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{c.ativo ? 'Ativa' : 'Inativa'}</span>
              </button>

              {/* Editar */}
              <button
                onClick={() => abrirEditar(c)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>

              {/* Empreendimentos */}
              <Link
                href={`/dashboard/construtoras/empreendimentos/${c.id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Empreendimentos</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              {/* Excluir */}
              <button
                onClick={() => setConfirmarId(c.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                {deletando === c.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
