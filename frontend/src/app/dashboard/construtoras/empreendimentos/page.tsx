'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Building2, MapPin, Bell, Eye, EyeOff, Trash2,
  Loader2, Search, ChevronDown, ChevronUp, Users,
  ToggleLeft, ToggleRight, AlertTriangle,
} from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  lancamento: 'Lançamento', em_obras: 'Em obras',
  pronto: 'Pronto', suspenso: 'Suspenso',
};
const STATUS_COR: Record<string, string> = {
  lancamento: 'bg-blue-100 text-blue-700',
  em_obras:   'bg-yellow-100 text-yellow-700',
  pronto:     'bg-green-100 text-green-700',
  suspenso:   'bg-gray-100 text-gray-500',
};

interface EmpAdmin {
  id: string; nome: string; slug: string; tipo: string; status: string;
  publicado: boolean; cidade: string; estado: string;
  preco_min: number | null; preco_max: number | null;
  construtora_nome: string; construtora_email: string;
  total_leads: number; total_unidades: number;
  foto_capa: string | null; created_at: string;
}

export default function AdminEmpreendimentosPage() {
  const [items, setItems]           = useState<EmpAdmin[]>([]);
  const [loading, setLoading]       = useState(true);
  const [busca, setBusca]           = useState('');
  const [toggling, setToggling]     = useState<string | null>(null);
  const [deletando, setDeletando]   = useState<string | null>(null);
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const [expandido, setExpandido]   = useState<string | null>(null);

  useEffect(() => {
    adminApi.listarEmpreendimentos()
      .then(r => setItems(r.data))
      .catch(() => toast.error('Erro ao carregar empreendimentos'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string) => {
    setToggling(id);
    try {
      const { data } = await adminApi.toggleEmpreendimento(id);
      setItems(prev => prev.map(e => e.id === id ? { ...e, publicado: data.publicado } : e));
      toast.success(data.publicado ? 'Empreendimento habilitado' : 'Empreendimento desabilitado');
    } catch {
      toast.error('Erro ao alterar status');
    } finally {
      setToggling(null);
    }
  };

  const deletar = async (id: string) => {
    setDeletando(id);
    setConfirmarId(null);
    try {
      await adminApi.deletarEmpreendimento(id);
      setItems(prev => prev.filter(e => e.id !== id));
      toast.success('Empreendimento excluído');
    } catch {
      toast.error('Erro ao excluir');
    } finally {
      setDeletando(null);
    }
  };

  const filtrados = items.filter(e =>
    busca === '' ||
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.construtora_nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.cidade.toLowerCase().includes(busca.toLowerCase()),
  );

  const publicados   = items.filter(e => e.publicado).length;
  const rascunhos    = items.filter(e => !e.publicado).length;

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
          <h1 className="text-2xl font-bold text-gray-900">Empreendimentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Todos os empreendimentos cadastrados no sistema</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-green-700 text-lg">{publicados}</p>
            <p className="text-green-600">Publicados</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-orange-700 text-lg">{rascunhos}</p>
            <p className="text-orange-600">Rascunhos</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-gray-700 text-lg">{items.length}</p>
            <p className="text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Buscar por nome, construtora ou cidade..."
          value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Lista */}
      <div className="card divide-y divide-gray-100">
        {filtrados.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            {busca ? 'Nenhum resultado para a busca.' : 'Nenhum empreendimento cadastrado.'}
          </div>
        )}

        {filtrados.map(emp => (
          <div key={emp.id}>
            {/* Linha principal */}
            <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              {/* Foto */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {emp.foto_capa
                  ? <img src={emp.foto_capa} alt={emp.nome} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-5 h-5 text-gray-300" /></div>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COR[emp.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[emp.status] ?? emp.status}
                  </span>
                  {emp.publicado
                    ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">● Publicado</span>
                    : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Rascunho</span>}
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate">{emp.nome}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {emp.cidade}, {emp.estado}
                  {emp.preco_min && ` · A partir de ${formatCurrency(emp.preco_min)}`}
                </p>
                <p className="text-xs text-primary-700 font-medium mt-0.5">{emp.construtora_nome}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                <span className="flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> {emp.total_leads} leads</span>
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {emp.total_unidades} unid.</span>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Expandir detalhes */}
                <button
                  onClick={() => setExpandido(expandido === emp.id ? null : emp.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Ver detalhes"
                >
                  {expandido === emp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Toggle habilitar/desabilitar */}
                <button
                  onClick={() => toggle(emp.id)}
                  disabled={toggling === emp.id}
                  className={`p-2 rounded-lg transition-colors ${emp.publicado
                    ? 'text-primary-600 hover:bg-primary-50'
                    : 'text-gray-400 hover:bg-gray-100'}`}
                  title={emp.publicado ? 'Desabilitar' : 'Habilitar'}
                >
                  {toggling === emp.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : emp.publicado
                      ? <ToggleRight className="w-4 h-4" />
                      : <ToggleLeft className="w-4 h-4" />}
                </button>

                {/* Excluir */}
                {confirmarId === emp.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deletar(emp.id)}
                      disabled={deletando === emp.id}
                      className="text-xs font-bold px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      {deletando === emp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => setConfirmarId(null)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmarId(emp.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Painel expandido — unidades e dados adicionais */}
            {expandido === emp.id && (
              <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Construtora</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{emp.construtora_nome}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.construtora_email}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tipo</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{emp.tipo}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Leads</p>
                    <p className="text-sm font-semibold text-gray-900">{emp.total_leads}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Unidades cad.</p>
                    <p className="text-sm font-semibold text-gray-900">{emp.total_unidades}</p>
                  </div>
                </div>
                {emp.preco_min && (
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>Preço: <strong>{formatCurrency(emp.preco_min)}</strong>
                      {emp.preco_max && emp.preco_max !== emp.preco_min && ` — ${formatCurrency(emp.preco_max)}`}
                    </span>
                    <span>·</span>
                    <span>Cadastrado: <strong>{new Date(emp.created_at).toLocaleDateString('pt-BR')}</strong></span>
                  </div>
                )}

                {/* Alerta de exclusão */}
                {confirmarId === emp.id && (
                  <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">
                      Excluir permanentemente <strong>{emp.nome}</strong>? Todos os leads, unidades e fotos serão apagados.
                    </p>
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
