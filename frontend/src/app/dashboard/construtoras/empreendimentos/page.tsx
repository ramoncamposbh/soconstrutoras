'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  Building2, Users, Search, Loader2, HardHat,
  Shield, ShieldOff, AlertTriangle, Pencil, Trash2,
  X, CheckCircle, FileText, User, Eye, EyeOff,
} from 'lucide-react';

interface Construtora {
  id: string; nome_fantasia: string; logo_url: string | null;
  user_id: string; nome: string; email: string; ativo: boolean;
  plano_nome: string | null; total_empreendimentos: number;
  publicados: number; total_leads: number; created_at: string;
}
interface Empreendimento {
  id: string; nome: string; cidade: string; bairro: string;
  publicado: boolean; total_unidades?: number;
}

// ── Nó raiz de construtora ──────────────────────────────────────────────────
function ConstrutoraNode({
  c, busca, onEdit, onDelete, onToggleAtivo,
}: {
  c: Construtora;
  busca: string;
  onEdit: (c: Construtora) => void;
  onDelete: (c: Construtora) => void;
  onToggleAtivo: (c: Construtora) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [usuariosAberto, setUsuariosAberto] = useState(false);
  const [empsAberto, setEmpsAberto] = useState(false);
  const [emps, setEmps] = useState<Empreendimento[]>([]);
  const [loadingEmps, setLoadingEmps] = useState(false);
  const [toggling, setToggling] = useState(false);

  // abre automaticamente se a busca bater
  useEffect(() => {
    if (busca && c.nome_fantasia.toLowerCase().includes(busca.toLowerCase())) {
      setAberto(true);
    }
  }, [busca, c.nome_fantasia]);

  const carregarEmps = useCallback(async () => {
    if (emps.length > 0) return;
    setLoadingEmps(true);
    try {
      const { data } = await adminApi.listarEmpsPorConstrutora(c.id);
      setEmps(Array.isArray(data) ? data : []);
    } catch { toast.error('Erro ao carregar empreendimentos.'); }
    finally { setLoadingEmps(false); }
  }, [c.id, emps.length]);

  const handleEmps = () => {
    const proximo = !empsAberto;
    setEmpsAberto(proximo);
    if (proximo) carregarEmps();
  };

  const handleToggleAtivo = async () => {
    setToggling(true);
    await onToggleAtivo(c);
    setToggling(false);
  };

  const nome = c.nome_fantasia || c.nome;

  return (
    <div className="select-none">
      {/* ── Linha da construtora ── */}
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors
          ${aberto ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
        onClick={() => setAberto(a => !a)}
      >
        {/* Seta expansão */}
        <span className="w-4 h-4 flex items-center justify-center text-gray-400 flex-shrink-0">
          {aberto ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>

        {/* Ícone pasta */}
        {aberto
          ? <FolderOpen className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          : <Folder className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        }

        {/* Avatar letra */}
        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0
          ${c.ativo ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'}`}>
          {nome[0]?.toUpperCase()}
        </div>

        {/* Nome */}
        <span className={`text-sm font-semibold flex-1 min-w-0 truncate
          ${c.ativo ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
          {nome}
        </span>

        {/* Badges */}
        <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
          {c.total_empreendimentos} emp · {c.total_leads} leads
        </span>
        {!c.ativo && (
          <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
            INATIVA
          </span>
        )}

        {/* Ações — só aparecem no hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(c)} title="Renomear"
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleToggleAtivo} disabled={toggling} title={c.ativo ? 'Desativar' : 'Ativar'}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
            {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             c.ativo ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5 text-green-500" />}
          </button>
          <button onClick={() => onDelete(c)} title="Excluir"
            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Conteúdo expandido ── */}
      {aberto && (
        <div className="ml-5 pl-3 border-l-2 border-gray-100 mt-0.5 space-y-0.5">

          {/* ── Sub-pasta: Usuários ── */}
          <div>
            <div
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setUsuariosAberto(u => !u)}
            >
              <span className="w-4 h-4 flex items-center justify-center text-gray-400 flex-shrink-0">
                {usuariosAberto ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
              {usuariosAberto
                ? <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                : <Folder className="w-4 h-4 text-blue-300 flex-shrink-0" />
              }
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 font-medium">Usuários</span>
              <span className="text-xs text-gray-400">(1)</span>
            </div>

            {usuariosAberto && (
              <div className="ml-5 pl-3 border-l-2 border-gray-100 mt-0.5">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                  <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{c.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0
                    ${c.ativo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Sub-pasta: Empreendimentos ── */}
          <div>
            <div
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleEmps}
            >
              <span className="w-4 h-4 flex items-center justify-center text-gray-400 flex-shrink-0">
                {empsAberto ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
              {empsAberto
                ? <FolderOpen className="w-4 h-4 text-orange-400 flex-shrink-0" />
                : <Folder className="w-4 h-4 text-orange-300 flex-shrink-0" />
              }
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 font-medium">Empreendimentos</span>
              {loadingEmps
                ? <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                : <span className="text-xs text-gray-400">({empsAberto ? emps.length : c.total_empreendimentos})</span>
              }
            </div>

            {empsAberto && (
              <div className="ml-5 pl-3 border-l-2 border-gray-100 mt-0.5 space-y-0.5">
                {loadingEmps && (
                  <div className="flex items-center gap-2 px-2 py-2 text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
                  </div>
                )}
                {!loadingEmps && emps.length === 0 && (
                  <p className="text-xs text-gray-400 px-2 py-1.5">Nenhum empreendimento.</p>
                )}
                {emps.map(emp => (
                  <div key={emp.id}
                    className="group/emp flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{emp.nome}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {emp.bairro ? `${emp.bairro}, ` : ''}{emp.cidade}
                      </p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0
                      ${emp.publicado ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {emp.publicado ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function AdminConstrutorasArvorePage() {
  const [items, setItems]     = useState<Construtora[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca]     = useState('');

  // Modal editar
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome]     = useState('');
  const [salvando, setSalvando]     = useState(false);

  // Modal excluir
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const [deletando, setDeletando]     = useState<string | null>(null);

  useEffect(() => {
    adminApi.listarConstrutoras()
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Erro ao carregar construtoras.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleAtivo = useCallback(async (c: Construtora) => {
    try {
      const { data } = await adminApi.toggleAtivo(c.user_id);
      setItems(prev => prev.map(x => x.user_id === c.user_id ? { ...x, ativo: data.ativo } : x));
      toast.success(data.ativo ? 'Conta reativada' : 'Conta desativada');
    } catch { toast.error('Erro ao alterar status'); }
  }, []);

  const abrirEditar = (c: Construtora) => {
    setEditNome(c.nome_fantasia ?? c.nome);
    setEditandoId(c.id);
  };

  const salvarEditar = async () => {
    if (!editandoId) return;
    setSalvando(true);
    try {
      const { data } = await adminApi.editarConstrutora(editandoId, { nome_fantasia: editNome });
      setItems(prev => prev.map(x => x.id === editandoId ? { ...x, nome_fantasia: data.nome_fantasia } : x));
      toast.success('Nome atualizado');
      setEditandoId(null);
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  };

  const deletar = async (id: string) => {
    setDeletando(id); setConfirmarId(null);
    try {
      await adminApi.deletarConstrutora(id);
      setItems(prev => prev.filter(x => x.id !== id));
      toast.success('Construtora excluída');
    } catch { toast.error('Erro ao excluir'); }
    finally { setDeletando(null); }
  };

  const filtrados = useMemo(() => {
    if (!busca) return items;
    const q = busca.toLowerCase();
    return items.filter(c =>
      (c.nome_fantasia ?? '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q),
    );
  }, [items, busca]);

  const nomeConfirmar = confirmarId ? (items.find(c => c.id === confirmarId)?.nome_fantasia ?? '') : '';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Modal editar */}
      {editandoId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Renomear construtora</h3>
              <button onClick={() => setEditandoId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block mb-5">
              <span className="text-sm font-semibold text-gray-700">Nome fantasia</span>
              <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && salvarEditar()} autoFocus
                className="mt-1.5 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 font-medium" />
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

      {/* Modal excluir */}
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
              Excluir permanentemente <strong>{nomeConfirmar}</strong> e todos os seus dados?
            </p>
            <ul className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-5 space-y-1">
              <li>• Todos os empreendimentos e unidades</li>
              <li>• Todos os leads e favoritos</li>
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
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary-600" /> Construtoras
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Clique em uma construtora para expandir usuários e empreendimentos
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-primary-700 text-xl">{items.length}</p>
            <p className="text-primary-600 text-xs">Total</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-green-700 text-xl">{items.filter(c => c.ativo).length}</p>
            <p className="text-green-600 text-xs">Ativas</p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar construtora ou e-mail..."
          value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 px-1">
        <span className="flex items-center gap-1"><Folder className="w-3.5 h-3.5 text-yellow-400" /> Construtora</span>
        <span className="flex items-center gap-1"><Folder className="w-3.5 h-3.5 text-blue-300" /> Usuários</span>
        <span className="flex items-center gap-1"><Folder className="w-3.5 h-3.5 text-orange-300" /> Empreendimentos</span>
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-gray-300" /> Item</span>
      </div>

      {/* Árvore */}
      <div className="card p-3 space-y-0.5">
        {filtrados.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            {busca ? 'Nenhuma construtora encontrada.' : 'Nenhuma construtora cadastrada.'}
          </p>
        )}
        {filtrados.map(c => (
          <ConstrutoraNode
            key={c.id}
            c={c}
            busca={busca}
            onEdit={abrirEditar}
            onDelete={x => setConfirmarId(x.id)}
            onToggleAtivo={toggleAtivo}
          />
        ))}
      </div>
    </div>
  );
}
