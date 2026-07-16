'use client';

import { useState } from 'react';
import {
  X, Home, Building2, Leaf, Layers, Square, Store,
  BedDouble, Car, Maximize2, BadgeCheck, BadgeX,
  LayoutGrid, ChevronRight, Image as ImageIcon,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Unidade, TipoUnidade } from '@/types';

const TIPO_ICON: Record<string, React.ElementType> = {
  apartamento: Home, cobertura: Building2, garden: Leaf,
  duplex: Layers, studio: Square, comercial: Store,
};
const TIPO_COR: Record<string, string> = {
  apartamento: 'bg-blue-50 text-blue-700',
  cobertura:   'bg-purple-50 text-purple-700',
  garden:      'bg-green-50 text-green-700',
  duplex:      'bg-orange-50 text-orange-700',
  studio:      'bg-yellow-50 text-yellow-700',
  comercial:   'bg-gray-100 text-gray-600',
};
const TIPO_LABEL: Record<string, string> = {
  apartamento: 'Apartamento', cobertura: 'Cobertura', garden: 'Garden',
  duplex: 'Duplex', studio: 'Studio', comercial: 'Comercial',
};

interface Props {
  unidades: Unidade[];
  nomeEmpreendimento: string;
}

export default function SecaoUnidades({ unidades, nomeEmpreendimento }: Props) {
  const [aberto, setAberto] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const disponíveis = unidades.filter((u) => u.disponivel);
  const tiposDisponiveis = ['todos', ...Array.from(new Set(unidades.map((u) => u.tipo)))];

  const filtradas = filtroTipo === 'todos'
    ? unidades
    : unidades.filter((u) => u.tipo === filtroTipo);

  if (unidades.length === 0) return null;

  return (
    <>
      {/* Botão de acesso */}
      <button
        onClick={() => setAberto(true)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all group"
        style={{ background: 'linear-gradient(135deg, #f0faf7 0%, #e6f7f2 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">
              {unidades.length} unidade{unidades.length > 1 ? 's' : ''} disponíve{unidades.length > 1 ? 'is' : 'l'}
            </p>
            <p className="text-xs text-gray-500">
              {tiposDisponiveis.slice(1).map(t => TIPO_LABEL[t] ?? t).join(' · ')}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Modal de unidades */}
      {aberto && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setAberto(false)}
          />

          {/* Painel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Unidades disponíveis</h2>
                <p className="text-sm text-gray-400 mt-0.5">{nomeEmpreendimento}</p>
              </div>
              <button
                onClick={() => setAberto(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Filtro por tipo */}
            {tiposDisponiveis.length > 2 && (
              <div className="flex gap-2 px-6 py-3 overflow-x-auto border-b border-gray-100">
                {tiposDisponiveis.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFiltroTipo(t)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      filtroTipo === t
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'todos' ? `Todos (${unidades.length})` : TIPO_LABEL[t] ?? t}
                  </button>
                ))}
              </div>
            )}

            {/* Lista de unidades */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filtradas.map((u) => {
                const Icon = TIPO_ICON[u.tipo] ?? Home;
                const cor  = TIPO_COR[u.tipo]  ?? 'bg-gray-100 text-gray-600';
                const foto = u.midias?.[0]?.url;

                return (
                  <div key={u.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    {/* Foto da unidade */}
                    {foto && (
                      <div className="relative h-44 bg-gray-100">
                        <img src={foto} alt={u.nome ?? u.tipo} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow ${cor}`}>
                            {TIPO_LABEL[u.tipo] ?? u.tipo}
                          </span>
                        </div>
                        {!u.disponivel && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-white text-gray-700 text-sm font-bold px-4 py-2 rounded-full">
                              Indisponível
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4">
                      {/* Sem foto: badge no topo */}
                      {!foto && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-gray-400" />
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cor}`}>
                            {TIPO_LABEL[u.tipo] ?? u.tipo}
                          </span>
                          {!u.disponivel && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5 ml-auto">
                              <BadgeX className="w-3.5 h-3.5" /> Indisponível
                            </span>
                          )}
                        </div>
                      )}

                      {/* Nome + disponibilidade */}
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-bold text-gray-900">
                          {u.nome || TIPO_LABEL[u.tipo] || u.tipo}
                        </p>
                        {foto && u.disponivel && (
                          <span className="text-xs text-green-600 flex items-center gap-0.5">
                            <BadgeCheck className="w-3.5 h-3.5" /> Disponível
                          </span>
                        )}
                      </div>

                      {/* Características */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        {u.metragem_privativa && (
                          <span className="flex items-center gap-1.5">
                            <Maximize2 className="w-4 h-4 text-primary-500" />
                            {u.metragem_privativa} m²
                            {u.metragem_total && u.metragem_total !== u.metragem_privativa
                              ? ` (total: ${u.metragem_total} m²)` : ''}
                          </span>
                        )}
                        {u.quartos > 0 && (
                          <span className="flex items-center gap-1.5">
                            <BedDouble className="w-4 h-4 text-primary-500" />
                            {u.quartos} quarto{u.quartos > 1 ? 's' : ''}
                            {u.suites > 0 ? ` (${u.suites} suíte${u.suites > 1 ? 's' : ''})` : ''}
                          </span>
                        )}
                        {u.vagas > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-primary-500" />
                            {u.vagas} vaga{u.vagas > 1 ? 's' : ''}
                          </span>
                        )}
                        {u.midias?.length > 0 && (
                          <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {u.midias.length} foto{u.midias.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Preço */}
                      {u.preco && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-400">Valor</p>
                          <p className="text-lg font-bold text-primary-600">
                            {formatCurrency(u.preco)}
                          </p>
                        </div>
                      )}

                      {/* Descrição */}
                      {u.descricao && (
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed border-t border-gray-100 pt-2">
                          {u.descricao}
                        </p>
                      )}

                      {/* Galeria de fotos adicionais */}
                      {u.midias && u.midias.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {u.midias.slice(1).map((m) => (
                            <div key={m.id} className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
