'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Building2, Search, ArrowUpDown, ChevronRight,
  Loader2, ArrowLeft, Home, CheckCircle2, XCircle,
  BedDouble, Car, Maximize2, DollarSign, ImageIcon,
  ToggleLeft, ToggleRight, Pencil, Trash2, AlertTriangle,
  X, CheckCircle,
} from 'lucide-react';

interface Midia { id: string; url: string; tipo: string; legenda: string | null; }
interface Unidade {
  id: string; tipo: string; nome: string | null;
  metragem_privativa: number | null; metragem_total: number | null;
  quartos: number; suites: number; vagas: number;
  preco: number | null; descricao: string | null;
  disponivel: boolean; ordem: number; created_at: string;
  midias: Midia[];
}
interface EditForm {
  nome: string; tipo: string; quartos: string; suites: string; vagas: string;
  metragem_privativa: string; metragem_total: string;
  preco: string; descricao: string; disponivel: boolean;
}

type Ordem = 'nome_asc' | 'nome_desc' | 'data_asc' | 'data_desc' | 'preco_asc' | 'preco_desc';

const TIPO_LABEL: Record<string, string> = {
  apartamento: 'Apartamento', cobertura: 'Cobertura', studio: 'Studio',
  garden: 'Garden', duplex: 'Duplex', casa: 'Casa', lote: 'Lote', comercial: 'Comercial',
};

const TIPOS = ['apartamento','cobertura','studio','garden','duplex','casa','lote','comercial'];

export default function UnidadesAdminPage() {
  const { construtoraId, empreendimentoId } = useParams<{ construtoraId: string; empreendimentoId: string }>();

  const [unidades, setUnidades]         = useState<Unidade[]>([]);
  const [nomeEmp, setNomeEmp]           = useState('');
  const [nomeCon, setNomeCon]           = useState('');
  const [loading, setLoading]           = useState(true);
  const [busca, setBusca]               = useState('');
  const [ordem, setOrdem]               = useState<Ordem>('data_desc');
  const [expandido, setExpandido]       = useState<string | null>(null);
  const [fotoAberta, setFotoAberta]     = useState<string | null>(null);

  // ações
  const [toggling, setToggling]         = useState<string | null>(null);
  const [deletando, setDeletando]       = useState<string | null>(null);
  const [confirmarId, setConfirmarId]   = useState<string | null>(null);
  const [editandoId, setEditandoId]     = useState<string | null>(null);
  const [editForm, setEditForm]         = useState<EditForm>({
    nome: '', tipo: 'apartamento', quartos: '0', suites: '0', vagas: '0',
    metragem_privativa: '', metragem_total: '', preco: '', descricao: '', disponivel: true,
  });
  const [salvando, setSalvando]         = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.listarConstrutoras(),
      adminApi.listarEmpsPorConstrutora(construtoraId),
      adminApi.listarUnidades(empreendimentoId),
    ]).then(([resC, resE, resU]) => {
      const con = resC.data.find((c: any) => c.id === construtoraId);
      setNomeCon(con?.nome_fantasia ?? con?.nome ?? 'Construtora');
      const emp = resE.data.find((e: any) => e.id === empreendimentoId);
      setNomeEmp(emp?.nome ?? 'Empreendimento');
      setUnidades(resU.data);
    }).catch(() => toast.error('Erro ao carregar unidades'))
      .finally(() => setLoading(false));
  }, [construtoraId, empreendimentoId]);

  /* ── Ações ─────────────────────────────────────────────────── */
  const toggle = async (id: string) => {
    setToggling(id);
    try {
      const { data } = await adminApi.toggleUnidade(id);
      setUnidades(prev => prev.map(u => u.id === id ? { ...u, disponivel: data.disponivel } : u));
      toast.success(data.disponivel ? 'Unidade disponível' : 'Unidade marcada como vendida');
    } catch { toast.error('Erro ao alterar status'); }
    finally { setToggling(null); }
  };

  const abrirEditar = (u: Unidade) => {
    setEditForm({
      nome: u.nome ?? '',
      tipo: u.tipo,
      quartos: String(u.quartos),
      suites: String(u.suites),
      vagas: String(u.vagas),
      metragem_privativa: u.metragem_privativa ? String(u.metragem_privativa) : '',
      metragem_total: u.metragem_total ? String(u.metragem_total) : '',
      preco: u.preco ? String(u.preco) : '',
      descricao: u.descricao ?? '',
      disponivel: u.disponivel,
    });
    setEditandoId(u.id);
  };

  const salvarEditar = async () => {
    if (!editandoId) return;
    setSalvando(true);
    try {
      const dto = {
        nome: editForm.nome || undefined,
        tipo: editForm.tipo,
        quartos: Number(editForm.quartos),
        suites: Number(editForm.suites),
        vagas: Number(editForm.vagas),
        metragem_privativa: editForm.metragem_privativa ? Number(editForm.metragem_privativa) : undefined,
        metragem_total: editForm.metragem_total ? Number(editForm.metragem_total) : undefined,
        preco: editForm.preco ? Number(editForm.preco) : undefined,
        descricao: editForm.descricao || undefined,
        disponivel: editForm.disponivel,
      };
      const { data } = await adminApi.editarUnidade(editandoId, dto);
      setUnidades(prev => prev.map(u => u.id === editandoId ? { ...u, ...data } : u));
      toast.success('Unidade atualizada');
      setEditandoId(null);
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  };

  const deletar = async (id: string) => {
    setDeletando(id); setConfirmarId(null);
    try {
      await adminApi.deletarUnidade(id);
      setUnidades(prev => prev.filter(u => u.id !== id));
      if (expandido === id) setExpandido(null);
      toast.success('Unidade excluída');
    } catch { toast.error('Erro ao excluir'); }
    finally { setDeletando(null); }
  };

  /* ── Filtros ────────────────────────────────────────────────── */
  const filtrados = useMemo(() => {
    let list = unidades.filter(u =>
      busca === '' ||
      (u.nome ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (TIPO_LABEL[u.tipo] ?? u.tipo).toLowerCase().includes(busca.toLowerCase()),
    );
    switch (ordem) {
      case 'nome_asc':   return [...list].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''));
      case 'nome_desc':  return [...list].sort((a, b) => (b.nome ?? '').localeCompare(a.nome ?? ''));
      case 'data_asc':   return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'data_desc':  return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'preco_asc':  return [...list].sort((a, b) => (a.preco ?? 0) - (b.preco ?? 0));
      case 'preco_desc': return [...list].sort((a, b) => (b.preco ?? 0) - (a.preco ?? 0));
      default: return list;
    }
  }, [unidades, busca, ordem]);

  const disponiveis = unidades.filter(u => u.disponivel).length;

  const ef = (k: keyof EditForm, v: string | boolean) =>
    setEditForm(f => ({ ...f, [k]: v }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Lightbox */}
      {fotoAberta && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFotoAberta(null)}>
          <img src={fotoAberta} alt="Foto" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
        </div>
      )}

      {/* Modal editar */}
      {editandoId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Editar unidade</h3>
              <button onClick={() => setEditandoId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Tipo + Nome */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Tipo</span>
                  <select value={editForm.tipo} onChange={e => ef('tipo', e.target.value)}
                    className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-400">
                    {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t] ?? t}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Nome / Identificação</span>
                  <input type="text" value={editForm.nome} onChange={e => ef('nome', e.target.value)}
                    placeholder="Ex: Apto 101"
                    className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
                </label>
              </div>

              {/* Quartos + Suítes + Vagas */}
              <div className="grid grid-cols-3 gap-3">
                {[['quartos','Quartos'],['suites','Suítes'],['vagas','Vagas']].map(([k, l]) => (
                  <label key={k} className="block">
                    <span className="text-xs font-semibold text-gray-600">{l}</span>
                    <input type="number" min="0" value={editForm[k as keyof EditForm] as string}
                      onChange={e => ef(k as keyof EditForm, e.target.value)}
                      className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
                  </label>
                ))}
              </div>

              {/* Metragens */}
              <div className="grid grid-cols-2 gap-3">
                {[['metragem_privativa','Área privativa (m²)'],['metragem_total','Área total (m²)']].map(([k, l]) => (
                  <label key={k} className="block">
                    <span className="text-xs font-semibold text-gray-600">{l}</span>
                    <input type="number" min="0" value={editForm[k as keyof EditForm] as string}
                      onChange={e => ef(k as keyof EditForm, e.target.value)}
                      className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
                  </label>
                ))}
              </div>

              {/* Preço */}
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">Preço (R$)</span>
                <input type="number" min="0" value={editForm.preco}
                  onChange={e => ef('preco', e.target.value)}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
              </label>

              {/* Status disponivel */}
              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 rounded-xl p-3 border border-gray-200">
                <input type="checkbox" checked={editForm.disponivel}
                  onChange={e => ef('disponivel', e.target.checked)}
                  className="w-5 h-5 rounded accent-primary-600" />
                <span className="text-sm font-semibold text-gray-800">
                  Unidade disponível para venda
                </span>
              </label>

              {/* Descrição */}
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">Descrição</span>
                <textarea rows={3} value={editForm.descricao}
                  onChange={e => ef('descricao', e.target.value)}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 resize-none" />
              </label>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setEditandoId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={salvarEditar} disabled={salvando}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <Link href="/dashboard/construtoras/empreendimentos" className="hover:text-primary-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Construtoras
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/construtoras/empreendimentos/${construtoraId}`} className="hover:text-primary-600">
          {nomeCon}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900 truncate max-w-[140px]">{nomeEmp}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{nomeEmp}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unidades.length} unidade{unidades.length !== 1 ? 's' : ''} · {disponiveis} disponível{disponiveis !== 1 ? 'is' : ''}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-green-700 text-xl">{disponiveis}</p>
            <p className="text-green-600">Disponíveis</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-gray-700 text-xl">{unidades.length - disponiveis}</p>
            <p className="text-gray-500">Vendidas</p>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-primary-700 text-xl">{unidades.length}</p>
            <p className="text-primary-600">Total</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nome ou tipo..."
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
            <option value="preco_asc">Menor preço</option>
            <option value="preco_desc">Maior preço</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          {busca ? 'Nenhum resultado.' : 'Nenhuma unidade cadastrada neste empreendimento.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(u => {
            const aberto = expandido === u.id;
            const capa = u.midias.find(m => m.tipo === 'foto' || m.tipo === 'imagem') ?? u.midias[0];
            return (
              <div key={u.id} className="card overflow-hidden">
                {/* Linha principal */}
                <div className="flex items-center gap-3 p-4">
                  {/* Foto capa — clicável para expandir */}
                  <button onClick={() => setExpandido(aberto ? null : u.id)}
                    className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 hover:border-primary-300 transition-colors">
                    {capa
                      ? <img src={capa.url} alt={u.nome ?? u.tipo} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6 text-gray-300" /></div>}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandido(aberto ? null : u.id)}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                        {TIPO_LABEL[u.tipo] ?? u.tipo}
                      </span>
                      {u.disponivel
                        ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Disponível
                          </span>
                        : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Vendida
                          </span>}
                      {u.midias.length > 0 && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />{u.midias.length}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 truncate">
                      {u.nome ?? `${TIPO_LABEL[u.tipo] ?? u.tipo} — Unidade ${u.ordem + 1}`}
                    </p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                      {u.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{u.quartos}</span>}
                      {u.vagas > 0 && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{u.vagas} vagas</span>}
                      {u.metragem_privativa && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{u.metragem_privativa} m²</span>}
                      {u.preco && <span className="font-semibold text-primary-700"><DollarSign className="w-3 h-3 inline" />{formatCurrency(u.preco)}</span>}
                    </div>
                  </div>

                  {/* ── Botões de ação ── */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {/* Habilitar / Disponível */}
                    <button
                      onClick={() => toggle(u.id)}
                      disabled={toggling === u.id}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        u.disponivel
                          ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {toggling === u.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : u.disponivel ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      <span className="hidden sm:inline">{u.disponivel ? 'Disponível' : 'Habilitar'}</span>
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => abrirEditar(u)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>

                    {/* Excluir */}
                    {confirmarId === u.id ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => deletar(u.id)} disabled={deletando === u.id}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 border border-red-600">
                          {deletando === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                          Confirmar
                        </button>
                        <button onClick={() => setConfirmarId(null)}
                          className="px-3 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmarId(u.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Excluir</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Painel expandido */}
                {aberto && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Quartos', valor: u.quartos > 0 ? `${u.quartos} (${u.suites} suíte${u.suites !== 1 ? 's' : ''})` : '—' },
                        { label: 'Vagas', valor: u.vagas > 0 ? String(u.vagas) : '—' },
                        { label: 'Área privativa', valor: u.metragem_privativa ? `${u.metragem_privativa} m²` : '—' },
                        { label: 'Área total', valor: u.metragem_total ? `${u.metragem_total} m²` : '—' },
                        { label: 'Preço', valor: u.preco ? formatCurrency(u.preco) : '—' },
                        { label: 'Status', valor: u.disponivel ? 'Disponível' : 'Vendida' },
                        { label: 'Cadastro', valor: new Date(u.created_at).toLocaleDateString('pt-BR') },
                        { label: 'Fotos', valor: String(u.midias.length) },
                      ].map(({ label, valor }) => (
                        <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{valor}</p>
                        </div>
                      ))}
                    </div>

                    {u.descricao && (
                      <div className="bg-white rounded-xl p-3 border border-gray-100 mb-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Descrição</p>
                        <p className="text-sm text-gray-700">{u.descricao}</p>
                      </div>
                    )}

                    {/* Galeria */}
                    {u.midias.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                          Fotos ({u.midias.length})
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {u.midias.map(m => (
                            <button key={m.id} onClick={() => setFotoAberta(m.url)}
                              className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition-colors shrink-0">
                              <img src={m.url} alt={m.legenda ?? ''} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
