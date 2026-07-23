'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import {
  User, Building2, KeyRound, ToggleLeft, ToggleRight,
  Loader2, Search, Copy, Check, ShieldOff, Shield,
  ChevronDown, ChevronUp,
} from 'lucide-react';

interface UsuarioCon {
  id: string; nome: string; email: string; ativo: boolean; created_at: string;
  construtora_id: string; nome_fantasia: string; logo_url: string | null;
  plano_nome: string | null; total_empreendimentos: number; publicados: number;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios]           = useState<UsuarioCon[]>([]);
  const [loading, setLoading]             = useState(true);
  const [busca, setBusca]                 = useState('');
  const [resetando, setResetando]         = useState<string | null>(null);
  const [toggling, setToggling]           = useState<string | null>(null);
  const [novaSenha, setNovaSenha]         = useState<{ id: string; senha: string } | null>(null);
  const [copiado, setCopiado]             = useState(false);
  const [expandido, setExpandido]         = useState<string | null>(null);

  useEffect(() => {
    adminApi.listarUsuarios()
      .then(r => setUsuarios(r.data))
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false));
  }, []);

  const resetSenha = async (id: string, nome: string) => {
    if (!confirm(`Resetar a senha de ${nome}? Uma nova senha temporária será gerada.`)) return;
    setResetando(id);
    try {
      const { data } = await adminApi.resetSenha(id);
      setNovaSenha({ id, senha: data.nova_senha });
      toast.success('Senha resetada com sucesso');
    } catch {
      toast.error('Erro ao resetar senha');
    } finally {
      setResetando(null);
    }
  };

  const toggleAtivo = async (id: string) => {
    setToggling(id);
    try {
      const { data } = await adminApi.toggleAtivo(id);
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo: data.ativo } : u));
      toast.success(data.ativo ? 'Usuário reativado' : 'Usuário desativado');
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

  const filtrados = usuarios.filter(u =>
    busca === '' ||
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase()) ||
    (u.nome_fantasia ?? '').toLowerCase().includes(busca.toLowerCase()),
  );

  const ativos    = usuarios.filter(u => u.ativo).length;
  const inativos  = usuarios.filter(u => !u.ativo).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários — Construtoras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Perfis de todas as construtoras cadastradas</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-green-700 text-lg">{ativos}</p>
            <p className="text-green-600">Ativos</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-red-700 text-lg">{inativos}</p>
            <p className="text-red-600">Inativos</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-gray-700 text-lg">{usuarios.length}</p>
            <p className="text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Modal senha nova */}
      {novaSenha && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Nova senha gerada</h3>
                <p className="text-xs text-gray-500">Copie e envie para o usuário</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <code className="flex-1 font-mono font-bold text-gray-900 text-base tracking-wider">
                {novaSenha.senha}
              </code>
              <button
                onClick={() => copiar(novaSenha.senha)}
                className={`p-1.5 rounded-lg transition-colors ${copiado ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              ⚠ Esta senha não ficará disponível novamente. Copie agora.
            </p>
            <button
              onClick={() => setNovaSenha(null)}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Buscar por nome, e-mail ou construtora..."
          value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Lista */}
      <div className="card divide-y divide-gray-100">
        {filtrados.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            {busca ? 'Nenhum resultado para a busca.' : 'Nenhum usuário cadastrado.'}
          </div>
        )}

        {filtrados.map(u => (
          <div key={u.id}>
            {/* Linha principal */}
            <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              {/* Avatar / logo */}
              <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                {u.logo_url
                  ? <img src={u.logo_url} alt={u.nome_fantasia} className="w-full h-full object-cover" />
                  : <span className="text-primary-700 font-bold text-sm">{u.nome?.[0]?.toUpperCase()}</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-semibold text-gray-900 text-sm truncate">{u.nome}</p>
                  {u.ativo
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold shrink-0">Ativo</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold shrink-0">Inativo</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                <p className="text-xs text-primary-700 font-medium mt-0.5 truncate">{u.nome_fantasia}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {u.total_empreendimentos} emp. ({u.publicados} pub.)
                </span>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Expandir */}
                <button
                  onClick={() => setExpandido(expandido === u.id ? null : u.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {expandido === u.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Toggle ativo */}
                <button
                  onClick={() => toggleAtivo(u.id)}
                  disabled={toggling === u.id}
                  className={`p-2 rounded-lg transition-colors ${u.ativo
                    ? 'text-primary-600 hover:bg-primary-50'
                    : 'text-gray-400 hover:bg-gray-100'}`}
                  title={u.ativo ? 'Desativar conta' : 'Reativar conta'}
                >
                  {toggling === u.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : u.ativo
                      ? <Shield className="w-4 h-4" />
                      : <ShieldOff className="w-4 h-4" />}
                </button>

                {/* Reset senha */}
                <button
                  onClick={() => resetSenha(u.id, u.nome)}
                  disabled={resetando === u.id}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600 disabled:opacity-50"
                  title="Resetar senha"
                >
                  {resetando === u.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <KeyRound className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Resetar senha</span>
                </button>
              </div>
            </div>

            {/* Painel expandido */}
            {expandido === u.id && (
              <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Nome fantasia</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.nome_fantasia ?? '—'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Plano</p>
                    <p className="text-sm font-semibold text-gray-900">{u.plano_nome ?? 'Sem plano'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Empreendimentos</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {u.total_empreendimentos} total · {u.publicados} publicados
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cadastro</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Exibe nova senha gerada para este usuário */}
                {novaSenha?.id === u.id && (
                  <div className="mt-3 flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5">
                    <KeyRound className="w-4 h-4 text-primary-600 shrink-0" />
                    <span className="text-sm text-primary-800">Nova senha: </span>
                    <code className="font-mono font-bold text-primary-900 text-sm tracking-wider">{novaSenha.senha}</code>
                    <button onClick={() => copiar(novaSenha.senha)} className="ml-auto p-1 text-primary-500 hover:text-primary-700">
                      {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
