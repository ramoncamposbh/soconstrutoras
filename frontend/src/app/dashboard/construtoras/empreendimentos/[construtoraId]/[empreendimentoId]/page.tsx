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
  BedDouble, Car, Maximize2, DollarSign, Image as ImageIcon,
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

type Ordem = 'nome_asc' | 'nome_desc' | 'data_asc' | 'data_desc' | 'preco_asc' | 'preco_desc';

const TIPO_LABEL: Record<string, string> = {
  apartamento: 'Apartamento', cobertura: 'Cobertura', studio: 'Studio',
  garden: 'Garden', duplex: 'Duplex', casa: 'Casa', lote: 'Lote', comercial: 'Comercial',
};

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Lightbox foto */}
      {fotoAberta && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFotoAberta(null)}
        >
          <img src={fotoAberta} alt="Foto" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
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
        <span className="font-semibold text-gray-900 truncate max-w-[160px]">{nomeEmp}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{nomeEmp}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unidades.length} unidade{unidades.length !== 1 ? 's' : ''} cadastrada{unidades.length !== 1 ? 's' : ''} · {disponiveis} disponível{disponiveis !== 1 ? 'is' : ''}
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
          <input
            type="text" placeholder="Buscar por nome ou tipo..."
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
                {/* Linha resumo */}
                <button
                  onClick={() => setExpandido(aberto ? null : u.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Foto capa */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    {capa
                      ? <img src={capa.url} alt={u.nome ?? u.tipo} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6 text-gray-300" /></div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                        {TIPO_LABEL[u.tipo] ?? u.tipo}
                      </span>
                      {u.disponivel
                        ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Disponível</span>
                        : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Vendida</span>}
                      {u.midias.length > 0 && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1"><ImageIcon className="w-3 h-3" />{u.midias.length} foto{u.midias.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 truncate">
                      {u.nome ?? `${TIPO_LABEL[u.tipo] ?? u.tipo} — Unidade ${u.ordem + 1}`}
                    </p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                      {u.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{u.quartos} dorm{u.suites > 0 ? ` (${u.suites} suíte${u.suites > 1 ? 's' : ''})` : ''}</span>}
                      {u.vagas > 0 && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{u.vagas} vaga{u.vagas > 1 ? 's' : ''}</span>}
                      {u.metragem_privativa && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{u.metragem_privativa} m²</span>}
                      {u.preco && <span className="flex items-center gap-1 font-semibold text-primary-700"><DollarSign className="w-3 h-3" />{formatCurrency(u.preco)}</span>}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${aberto ? 'rotate-90' : ''}`} />
                </button>

                {/* Painel expandido */}
                {aberto && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Tipo', valor: TIPO_LABEL[u.tipo] ?? u.tipo },
                        { label: 'Quartos', valor: u.quartos > 0 ? `${u.quartos} (${u.suites} suíte${u.suites !== 1 ? 's' : ''})` : '—' },
                        { label: 'Vagas', valor: u.vagas > 0 ? String(u.vagas) : '—' },
                        { label: 'Área privativa', valor: u.metragem_privativa ? `${u.metragem_privativa} m²` : '—' },
                        { label: 'Área total', valor: u.metragem_total ? `${u.metragem_total} m²` : '—' },
                        { label: 'Preço', valor: u.preco ? formatCurrency(u.preco) : '—' },
                        { label: 'Status', valor: u.disponivel ? 'Disponível' : 'Vendida' },
                        { label: 'Cadastro', valor: new Date(u.created_at).toLocaleDateString('pt-BR') },
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

                    {/* Galeria de fotos */}
                    {u.midias.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                          Fotos ({u.midias.length})
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {u.midias.map(m => (
                            <button
                              key={m.id}
                              onClick={() => setFotoAberta(m.url)}
                              className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition-colors shrink-0"
                            >
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
