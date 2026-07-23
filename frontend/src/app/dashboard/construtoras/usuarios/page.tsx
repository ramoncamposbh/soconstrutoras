'use client';

import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import {
  KeyRound, ToggleLeft, ToggleRight, Loader2,
  Search, Copy, Check, ShieldOff, Shield,
  ArrowUpDown, Building2, User, Mail, Bell,
  HardHat,
} from 'lucide-react';

interface UsuarioCon {
  id: string; nome: string; email: string; ativo: boolean; created_at: string;
  construtora_id: string; nome_fantasia: string; logo_url: string | null;
  plano_nome: string | null; total_empreendimentos: number; publicados: number;
}

type Ordem = 'nome_asc' | 'nome_desc' | 'data_asc' | 'data_desc' | 'emps_desc';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios]     = useState<UsuarioCon[]>([]);
  const [loading, setLoading]       = useState(true);
  const [busca, setBusca]           = useState('');
  const [ordem, setOrdem]           = useState<Ordem>('data_desc');
  const [resetando, setResetando]   = useState<string | null>(null);
  const [toggling, setToggling]     = useState<string | null>(null);
  const [novaSenha, setNovaSenha]   = useState<{ id: string; senha: string } | null>(null);
  const [copiado, setCopiado]       = useState(false);

  useEffect(() => {
    adminApi.listarUsuarios()
      .then(r => setUsuarios(r.data))
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false));
  }, []);

  const resetSenha = async (u: UsuarioCon) => {
    if (!confirm(`Resetar a senha de ${u.nome_fantasia}?\nUma nova senha temporária será gerada.`)) return;
    setResetando(u.id);
    try {
      const { data } = await adminApi.resetSenha(u.id);
      setNovaSenha({ id: u.id, senha: data.nova_senha });
      toast.success('Senha resetada com sucesso');
    } catch {
      toast.error('Erro ao resetar senha');
    } finally {
      setResetando(null);
    }
  };

  const toggleAtivo = async (u: UsuarioCon) => {
    setToggling(u.id);
    try {
      const { data } = await adminApi.toggleAtivo(u.id);
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, ativo: data.ativo } : x));
      toast.success(data.ativo ? 'Conta reativada' : 'Conta desativada');
    } catch {
      toast.error('Erro ao alterar status');
    } finally {
      setToggling(null);
    }
  };

  const copiar = (senha: string) => {
    navigator.clipboard.writeText(senha);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const filtrados = useMemo(() => {
    let list = usuarios.filter(u =>
      busca === '' ||
      (u.nome_fantasia ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()),
    );
    switch (ordem) {
      case 'nome_asc':  return [...list].sort((a, b) => (a.nome_fantasia ?? '').localeCompare(b.nome_fantasia ?? ''));
      case 'nome_desc': return [...list].sort((a, b) => (b.nome_fantasia ?? '').localeCompare(a.nome_fantasia ?? ''));
      case 'data_asc':  return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'data_desc': return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'emps_desc': return [...list].sort((a, b) => b.total_empreendimentos - a.total_empreendimentos);
      default: return list;
    }
  }, [usuarios, busca, ordem]);

  const ativos   = usuarios.filter(u => u.ativo).length;
  const inativos = usuarios.filter(u => !u.ativo).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Modal nova senha */}
      {novaSenha && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Nova senha gerada</h3>
                <p className="text-xs text-gray-500">Copie e envie para o responsável</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <code className="flex-1 font-mono font-bold text-gray-900 text-base tracking-wider">
                {novaSenha.senha}
              </code>
              <button onClick={() => copiar(novaSenha.senha)}
                className={`p-1.5 rounded-lg transition-colors ${copiado ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              ⚠ Esta senha não ficará disponível novamente. Copie agora.
            </p>
            <button onClick={() => setNovaSenha(null)}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary-600" /> Usuários — Construtoras
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Perfis e acessos de todas as construtoras</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-green-700 text-xl">{ativos}</p>
            <p className="text-green-600">Ativas</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-red-700 text-xl">{inativos}</p>
            <p className="text-red-600">Inativas</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-gray-700 text-xl">{usuarios.length}</p>
            <p className="text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar construtora, usuário ou e-mail..."
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

      {/* Cards */}
      {filtrados.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          {busca ? 'Nenhum resultado.' : 'Nenhuma construtora cadastrada.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(u => (
            <div key={u.id}
              className={`card overflow-hidden border-l-4 ${u.ativo ? 'border-l-primary-400' : 'border-l-red-300'}`}>

              {/* ── Cabeçalho do card = Construtora ── */}
              <div className="flex items-center gap-4 p-4 pb-3">
                {/* Logo */}
                <div className="w-14 h-14 rounded-xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {u.logo_url
                    ? <img src={u.logo_url} alt={u.nome_fantasia} className="w-full h-full object-cover" />
                    : <span className="text-primary-700 font-black text-xl">{(u.nome_fantasia ?? u.nome)?.[0]?.toUpperCase()}</span>}
                </div>

                {/* Nome da construtora + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-gray-900 text-base truncate">{u.nome_fantasia ?? u.nome}</h3>
                    {u.ativo
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">● Ativa</span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">● Inativa</span>}
                    {u.plano_nome && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 shrink-0">
                        {u.plano_nome}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-primary-400" />
                      {u.total_empreendimentos} empreendimento{u.total_empreendimentos !== 1 ? 's' : ''}
                      {u.publicados > 0 && <span className="text-primary-600 font-semibold">({u.publicados} publicados)</span>}
                    </span>
                    <span className="text-gray-400">
                      Cadastro: {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Separador + dados do usuário ── */}
              <div className="mx-4 border-t border-dashed border-gray-200" />

              <div className="flex items-center gap-4 px-4 py-3">
                {/* Ícone usuário */}
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-gray-400" />
                </div>

                {/* Dados do usuário responsável */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{u.nome}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />{u.email}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {/* Nova senha para este usuário (abaixo do modal) */}
                  {novaSenha?.id === u.id && (
                    <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-3 py-1.5 mr-1">
                      <KeyRound className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      <code className="font-mono font-bold text-primary-900 text-sm tracking-wider">{novaSenha.senha}</code>
                      <button onClick={() => copiar(novaSenha.senha)} className="text-primary-500 hover:text-primary-700">
                        {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Toggle ativo */}
                  <button
                    onClick={() => toggleAtivo(u)}
                    disabled={toggling === u.id}
                    title={u.ativo ? 'Desativar conta' : 'Reativar conta'}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      u.ativo
                        ? 'border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {toggling === u.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : u.ativo ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                    <span className="hidden sm:inline">{u.ativo ? 'Ativa' : 'Inativa'}</span>
                  </button>

                  {/* Reset senha */}
                  <button
                    onClick={() => resetSenha(u)}
                    disabled={resetando === u.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {resetando === u.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <KeyRound className="w-4 h-4" />}
                    <span className="hidden sm:inline">Resetar senha</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
