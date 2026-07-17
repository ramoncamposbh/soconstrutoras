'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { empreendimentosApi } from '@/lib/api';
import type { Empreendimento } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Plus, MapPin, Bell, Eye, Loader2, Building2, Trash2 } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  lancamento: 'badge bg-blue-100 text-blue-700',
  em_obras:   'badge bg-yellow-100 text-yellow-700',
  pronto:     'badge bg-green-100 text-green-700',
  suspenso:   'badge bg-gray-100 text-gray-600',
};
const STATUS_LABEL: Record<string, string> = {
  lancamento: 'Lancamento', em_obras: 'Em obras', pronto: 'Pronto', suspenso: 'Suspenso',
};

function faixaPreco(emp: any): string | null {
  const min = emp.preco_unidade_min ? Number(emp.preco_unidade_min) : null;
  const max = emp.preco_unidade_max ? Number(emp.preco_unidade_max) : null;

  if (min && max && min !== max) return `${formatCurrency(min)} ate ${formatCurrency(max)}`;
  if (min) return `A partir de ${formatCurrency(min)}`;
  // fallback: campos do empreendimento
  if (emp.preco_min && emp.preco_max && emp.preco_min !== emp.preco_max)
    return `${formatCurrency(emp.preco_min)} ate ${formatCurrency(emp.preco_max)}`;
  if (emp.preco_min) return `A partir de ${formatCurrency(emp.preco_min)}`;
  return null;
}

export default function EmpreendimentosPage() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicando, setPublicando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  useEffect(() => {
    empreendimentosApi.listar()
      .then((res) => setEmpreendimentos(res.data))
      .finally(() => setLoading(false));
  }, []);

  const publicar = async (id: string) => {
    setPublicando(id);
    try {
      await empreendimentosApi.publicar(id);
      setEmpreendimentos((prev) => prev.map((e) => e.id === id ? { ...e, publicado: true } : e));
      toast.success('Empreendimento publicado!');
    } catch {
      toast.error('Erro ao publicar.');
    } finally {
      setPublicando(null);
    }
  };

  const excluir = async (id: string, nome: string) => {
    if (!window.confirm(`Excluir "${nome}"? Esta acao nao pode ser desfeita.`)) return;
    setExcluindo(id);
    try {
      await empreendimentosApi.remover(id);
      setEmpreendimentos((prev) => prev.filter((e) => e.id !== id));
      toast.success('Empreendimento excluido.');
    } catch {
      toast.error('Erro ao excluir.');
    } finally {
      setExcluindo(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empreendimentos</h1>
        <Link href="/dashboard/empreendimentos/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo empreendimento
        </Link>
      </div>

      {empreendimentos.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 mb-4">Nenhum empreendimento cadastrado ainda.</p>
          <Link href="/dashboard/empreendimentos/novo" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Cadastrar primeiro empreendimento
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {empreendimentos.map((emp: any) => {
            const preco = faixaPreco(emp);
            return (
              <div key={emp.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {emp.foto_capa ? (
                    <img src={emp.foto_capa} alt={emp.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={STATUS_COLOR[emp.status] ?? 'badge bg-gray-100 text-gray-600'}>
                      {STATUS_LABEL[emp.status]}
                    </span>
                    {!emp.publicado && (
                      <span className="badge bg-orange-100 text-orange-700">Rascunho</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 truncate">{emp.nome}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {emp.cidade} — {emp.estado}
                    {preco && (
                      <span className="ml-1 text-primary-600 font-medium">· {preco}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Bell className="w-4 h-4" />
                  {emp.total_leads ?? 0} leads
                </div>

                <div className="flex items-center gap-2">
                  {!emp.publicado && (
                    <button
                      onClick={() => publicar(emp.id)}
                      disabled={publicando === emp.id}
                      className="btn-secondary text-xs flex items-center gap-1"
                    >
                      {publicando === emp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                      Publicar
                    </button>
                  )}
                  <Link href={`/dashboard/empreendimentos/${emp.id}`} className="btn-secondary text-xs">
                    Editar
                  </Link>
                  {emp.publicado && (
                    <Link href={`/imoveis/${emp.slug}`} target="_blank" className="btn-secondary text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Ver
                    </Link>
                  )}
                  <button
                    onClick={() => excluir(emp.id, emp.nome)}
                    disabled={excluindo === emp.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Excluir empreendimento"
                  >
                    {excluindo === emp.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
