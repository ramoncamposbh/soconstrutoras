'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { parceirosApi } from '@/lib/api';
import type { Parceiro } from '@/types';
import {
  Plus, Trash2, Building2, User, Loader2,
  CheckCircle2, AlertCircle, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  empreendimentoId: string;
}

export default function VincularParceiro({ empreendimentoId }: Props) {
  const [parceirosDisponiveis, setParceirosDisponiveis] = useState<Parceiro[]>([]);
  const [parceirosVinculados, setParceirosVinculados] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { parceiro_id: '', modo_distribuicao: 'sequencial', percentual: 0 },
  });
  const modo = watch('modo_distribuicao');
  const totalPercentual = parceirosVinculados.reduce((acc, p) => acc + (p.percentual ?? 0), 0);

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const [todos, vinculados] = await Promise.all([
        parceirosApi.listar(),
        parceirosApi.listarDoEmpreendimento(empreendimentoId),
      ]);
      setParceirosDisponiveis(Array.isArray(todos.data) ? todos.data : []);
      setParceirosVinculados(Array.isArray(vinculados.data) ? vinculados.data : []);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao carregar parceiros.';
      setErro(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [empreendimentoId]);

  const vincular = async (data: any) => {
    try {
      await parceirosApi.vincular(empreendimentoId, {
        parceiro_id:       data.parceiro_id,
        modo_distribuicao: data.modo_distribuicao,
        percentual:        data.modo_distribuicao === 'percentual' ? Number(data.percentual) : undefined,
        ordem:             parceirosVinculados.length,
      });
      reset();
      setShowForm(false);
      toast.success('Parceiro vinculado com sucesso!');
      await carregar();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao vincular parceiro.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const remover = async (parceiroId: string, nome: string) => {
    if (!confirm(`Remover "${nome}" deste empreendimento?`)) return;
    setRemovendo(parceiroId);
    try {
      await parceirosApi.removerVinculo(empreendimentoId, parceiroId);
      toast.success('Parceiro removido.');
      await carregar();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao remover parceiro.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setRemovendo(null);
    }
  };

  const naoVinculados = parceirosDisponiveis.filter(
    (p) => !parceirosVinculados.some((v) => v.id === p.id),
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando parceiros...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-600 font-medium">{erro}</p>
        <button onClick={carregar} className="text-sm text-primary-600 underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Parceiros disponíveis — seleção rápida */}
      {parceirosDisponiveis.length === 0 ? (
        <div className="text-center py-8">
          <UserCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Nenhum parceiro cadastrado ainda.</p>
          <p className="text-xs text-gray-400 mt-1">
            Acesse <strong>Parceiros</strong> no menu lateral para cadastrar corretores ou imobiliárias.
          </p>
        </div>
      ) : (
        <>
          {/* Lista de todos os parceiros — com checkbox de vínculo */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Parceiros disponíveis
            </p>
            {parceirosDisponiveis.map((p) => {
              const vinculado = parceirosVinculados.some((v) => v.id === p.id);
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                    vinculado
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-white border-gray-200 hover:border-gray-300',
                  )}
                >
                  {/* Ícone tipo */}
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    p.is_house_de_vendas ? 'bg-primary-100' : 'bg-purple-100',
                  )}>
                    {p.tipo === 'imobiliaria'
                      ? <Building2 className={cn('w-4 h-4', p.is_house_de_vendas ? 'text-primary-600' : 'text-purple-600')} />
                      : <User className="w-4 h-4 text-gray-600" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.nome}</p>
                    <p className="text-xs text-gray-500">
                      {p.tipo === 'imobiliaria' ? 'Imobiliária' : 'Corretor'}
                      {p.is_house_de_vendas ? ' · House de vendas' : ''}
                      {vinculado && (() => {
                        const v = parceirosVinculados.find((x) => x.id === p.id);
                        return v ? ` · ${v.modo_distribuicao === 'percentual' ? `${v.percentual}%` : 'Sequencial'}` : '';
                      })()}
                    </p>
                  </div>

                  {/* Ação */}
                  {vinculado ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-primary-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Vinculado
                      </span>
                      <button
                        onClick={() => remover(p.id, p.nome)}
                        disabled={removendo === p.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remover vínculo"
                      >
                        {removendo === p.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        reset({ parceiro_id: p.id, modo_distribuicao: 'sequencial', percentual: 0 });
                        setShowForm(true);
                      }}
                      className="flex items-center gap-1.5 text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors font-medium shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Vincular
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Barra de percentual total */}
          {parceirosVinculados.length > 0 && parceirosVinculados[0]?.modo_distribuicao === 'percentual' && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Total distribuído</span>
                <span className={totalPercentual > 100 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {totalPercentual}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', totalPercentual > 100 ? 'bg-red-500' : 'bg-primary-500')}
                  style={{ width: `${Math.min(totalPercentual, 100)}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Formulário de configuração do vínculo */}
      {showForm && (
        <form onSubmit={handleSubmit(vincular)} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Configurar distribuição de leads</p>

          <input type="hidden" {...register('parceiro_id')} />

          <div>
            <label className="label">Modo de distribuição</label>
            <div className="flex gap-2">
              {['sequencial', 'percentual'].map((m) => (
                <label
                  key={m}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm cursor-pointer transition-colors capitalize',
                    modo === m
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                  )}
                >
                  <input type="radio" {...register('modo_distribuicao')} value={m} className="hidden" />
                  {m}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {modo === 'sequencial'
                ? 'Leads alternados entre parceiros em ordem.'
                : 'Cada parceiro recebe uma % dos leads.'}
            </p>
          </div>

          {modo === 'percentual' && (
            <div>
              <label className="label">Percentual dos leads (%)</label>
              <input
                {...register('percentual', { min: 1, max: 100 })}
                type="number" min={1} max={100 - totalPercentual}
                className="input"
                placeholder={`Ex: ${Math.max(0, 100 - totalPercentual)}`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Disponível: {Math.max(0, 100 - totalPercentual)}%
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowForm(false); reset(); }}
              className="btn-secondary flex-1 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Vinculando...' : 'Confirmar vínculo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
