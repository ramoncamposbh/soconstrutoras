'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Building2, MapPin, Bell, Search, ArrowUpDown, ChevronRight,
  Loader2, ArrowLeft, Eye, EyeOff, Trash2, Pencil,
  ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2, X,
} from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  lancamento: 'Lançamento', em_obras: 'Em obras',
  pronto: 'Pronto', suspenso: 'Suspenso',
};
const STATUS_COR: Record<string, string> = {
  lancamento: 'bg-blue-100 text-blue-700', em_obras: 'bg-yellow-100 text-yellow-700',
  pronto: 'bg-green-100 text-green-700', suspenso: 'bg-gray-100 text-gray-500',
};

interface Emp {
  id: string; nome: string; slug: string; tipo: string; status: string;
  publicado: boolean; cidade: string; estado: string;
  preco_min: number | null; preco_max: number | null;
  total_leads: number; total_unidades: number;
  foto_capa: string | null; created_at: string;
}
interface EditForm { nome: string; status: string; tipo: string; }

type Ordem = 'nome_asc' | 'nome_desc' | 'data_asc' | 'data_desc';

export default function EmpsPorConstrutoraPage() {
  const { construtoraId } = useParams<{ construtoraId: string }>();
  const router = useRouter();

  const [emps, setEmps]             = useState<Emp[]>([]);
  const [nomeCon, setNomeCon]       = useState('');
  const [loading, setLoading]       = useState(true);
  const [busca, setBusca]           = useState('');
  const [ordem, setOrdem]           = useState<Ordem>('data_desc');
  const [toggling, setToggling]     = useState<string | null>(null);
  const [deletando, setDeletando]   = useState<string | null>(null);
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditForm>({ nome: '', status: '', tipo: '' });
  const [salvando, setSalvando]     = useState(false);

  useEffect(() => {
    // Pega nome da construtora e empreendimentos em paralelo
    Promise.all([
      adminApi.listarConstrutoras(),
      adminApi.listarEmpsPorConstrutora(construtoraId),
    ]).then(([resC, resE]) => {
      const con = resC.data.find((c: any) => c.id === construtoraId);
      setNomeCon(con?.nome_fantasia ?? con?.nome ?? 'Construtora');
      setEmps(resE.data);
    }).catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, [construtoraId]);

  const toggle = async (id: string) => {
    setToggling(id);
    try {
      const { data } = await adminApi.toggleEmpreendimento(id);
      setEmps(prev => prev.map(e => e.id === id ? { ...e, publicado: data.publicado } : e));
      toast.success(data.publicado ? 'Publicado' : 'Despublicado');
    } catch { toast.error('Erro'); }
    finally { setToggling(null); }
  };

  const deletar = async (id: string) => {
    setDeletando(id); setConfirmarId(null);
    try {
      await adminApi.deletarEmpreendimento(id);
      setEmps(prev => prev.filter(e => e.id !== id));
      toast.success('Excluído');
    } catch { toast.error('Erro ao excluir'); }
    finally { setDeletando(null); }
  };

  const abrirEditar = (emp: Emp) => {
    setEditForm({ nome: emp.nome, status: emp.status, tipo: emp.tipo });
    setEditandoId(emp.id);
  };

  const salvarEditar = async () => {
    if (!editandoId) return;
    setSalvando(true);
    try {
      const { data } = await adminApi.editarEmpreendimento(editandoId, editForm);
      setEmps(prev => prev.map(e => e.id === editandoId ? { ...e, ...data } : e));
      toast.success('Atualizado');
      setEditandoId(null);
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  };

  const filtrados = useMemo(() => {
    let list = emps.filter(e =>
      busca === '' || e.nome.toLowerCase().includes(busca.toLowerCase()) ||
      e.cidade.toLowerCase().includes(busca.toLowerCase()),
    );
    switch (ordem) {
      case 'nome_asc':  return [...list].sort((a, b) => a.nome.localeCompare(b.nome));
      case 'nome_desc': return [...list].sort((a, b) => b.nome.localeCompare(a.nome));
      case 'data_asc':  return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'data_desc': return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [emps, busca, ordem]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/construtoras/empreendimentos" className="hover:text-primary-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Construtoras
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">{nomeCon}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{nomeCon}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {emps.length} empreendimento{emps.length !== 1 ? 's' : ''} · {emps.filter(e => e.publicado).length} publicados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por nome ou cidade..."
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
          </select>
        </div>
      </div>

      {/* Modal editar */}
      {editandoId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Editar empreendimento</h3>
              <button onClick={() => setEditandoId(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Nome</span>
                <input type="text" value={editForm.nome}
                  onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Status</span>
                <select value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-400"
                >
                  <option value="lancamento">Lançamento</option>
                  <option value="em_obras">Em obras</option>
                  <option value="pronto">Pronto</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Tipo</span>
                <select value={editForm.tipo}
                  onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-400"
                >
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditandoId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={salvarEditar} disabled={salvando}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="card divide-y divide-gray-100">
        {filtrados.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            {busca ? 'Nenhum resultado.' : 'Nenhum empreendimento cadastrado.'}
          </div>
        )}

        {filtrados.map(emp => (
          <div key={emp.id}>
            <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              {/* Foto */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                {emp.foto_capa
                  ? <img src={emp.foto_capa} alt={emp.nome} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-300" /></div>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_COR[emp.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[emp.status] ?? emp.status}
                  </span>
                  {emp.publicado
                    ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">● Publicado</span>
                    : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Rascunho</span>}
                </div>
                <p className="font-bold text-gray-900 truncate">{emp.nome}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />{emp.cidade}, {emp.estado}
                  {emp.preco_min && ` · ${formatCurrency(emp.preco_min)}`}
                </p>
                <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                  <span>{emp.total_unidades} unid.</span>
                  <span>{emp.total_leads} leads</span>
                  <span>{new Date(emp.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Ações — botões maiores com label */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {/* Habilitar / Desabilitar */}
                <button
                  onClick={() => toggle(emp.id)}
                  disabled={toggling === emp.id}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    emp.publicado
                      ? 'border-primary-200 text-primary-700 hover:bg-primary-50 bg-primary-50'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {toggling === emp.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : emp.publicado ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span className="hidden sm:inline">{emp.publicado ? 'Publicado' : 'Habilitar'}</span>
                </button>

                {/* Editar */}
                <button
                  onClick={() => abrirEditar(emp)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>

                {/* Ver unidades */}
                <Link
                  href={`/dashboard/construtoras/empreendimentos/${construtoraId}/${emp.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Unidades</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                {/* Excluir */}
                {confirmarId === emp.id ? (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => deletar(emp.id)} disabled={deletando === emp.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 border border-red-600">
                      {deletando === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                      Confirmar
                    </button>
                    <button onClick={() => setConfirmarId(null)}
                      className="px-3 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmarId(emp.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Excluir</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
