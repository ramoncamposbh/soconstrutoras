'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Search, SlidersHorizontal, X, ChevronDown, Tag, Home, Car, BedDouble, Maximize2 } from 'lucide-react';
import { TIPOS_IMOVEL, ESTADOS_BR } from '@/lib/utils';
import AutocompleteCidade from './AutocompleteCidade';

interface Filtros {
  cidade?: string;
  estado?: string;
  tipo?: string;
  preco_min?: number;
  preco_max?: number;
  quartos_min?: number;
  vagas?: number;
  area_min?: number;
}

interface Props {
  onBuscar: (filtros: Filtros) => void;
  loading?: boolean;
}

const AREAS = [
  { label: '30 m²', value: 30 },
  { label: '50 m²', value: 50 },
  { label: '70 m²', value: 70 },
  { label: '100 m²', value: 100 },
  { label: '150 m²', value: 150 },
  { label: '200 m²', value: 200 },
  { label: '300 m²', value: 300 },
  { label: '500 m²', value: 500 },
];

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400';
const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

function fmtBRL(v: number | undefined) {
  if (!v) return '';
  return v.toLocaleString('pt-BR');
}
function parseBRL(s: string) {
  const n = parseInt(s.replace(/\D/g, ''), 10);
  return isNaN(n) ? undefined : n;
}

/** Dropdown de valor */
function DropdownValor({
  precoMin, precoMax,
  onConfirm,
}: {
  precoMin?: number;
  precoMax?: number;
  onConfirm: (min?: number, max?: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(fmtBRL(precoMin));
  const [max, setMax] = useState(fmtBRL(precoMax));
  const ref = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = (() => {
    const lo = parseBRL(min);
    const hi = parseBRL(max);
    if (lo && hi) return `R$ ${fmtBRL(lo)} – R$ ${fmtBRL(hi)}`;
    if (lo) return `A partir de R$ ${fmtBRL(lo)}`;
    if (hi) return `Até R$ ${fmtBRL(hi)}`;
    return 'Valor do imóvel';
  })();

  const hasValue = !!(parseBRL(min) || parseBRL(max));

  const handleConfirm = () => {
    onConfirm(parseBRL(min), parseBRL(max));
    setOpen(false);
  };

  const handleClear = () => {
    setMin('');
    setMax('');
    onConfirm(undefined, undefined);
    setOpen(false);
  };

  const formatInput = (val: string, setter: (s: string) => void) => {
    const n = parseInt(val.replace(/\D/g, ''), 10);
    setter(isNaN(n) ? '' : n.toLocaleString('pt-BR'));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
          hasValue
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50">
          <p className="text-sm font-semibold text-gray-800 mb-3">Valor do imóvel</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelClass}>Mínimo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={min}
                  onChange={(e) => setMin(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                  onBlur={(e) => formatInput(e.target.value, setMin)}
                  placeholder="150.000"
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Máximo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={max}
                  onChange={(e) => setMax(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                  onBlur={(e) => formatInput(e.target.value, setMax)}
                  placeholder="20.000.000"
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {hasValue && (
              <button type="button" onClick={handleClear}
                className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Limpar
              </button>
            )}
            <button type="button" onClick={handleConfirm}
              className="flex-1 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Atualizar resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FiltrosBusca({ onBuscar, loading }: Props) {
  const [maisAberto, setMaisAberto] = useState(false);
  const [precoMin, setPrecoMin] = useState<number | undefined>();
  const [precoMax, setPrecoMax] = useState<number | undefined>();
  const [cidadeSel, setCidadeSel] = useState('');
  const [estadoSel, setEstadoSel] = useState('');
  const { register, handleSubmit, reset, getValues, setValue } = useForm<Filtros>();

  const onSubmit = (data: Filtros) => {
    onBuscar({ ...data, cidade: cidadeSel || data.cidade, estado: estadoSel || data.estado, preco_min: precoMin, preco_max: precoMax });
  };

  const limpar = () => {
    reset();
    setPrecoMin(undefined);
    setPrecoMax(undefined);
    setCidadeSel('');
    setEstadoSel('');
    onBuscar({});
  };

  const onValorConfirm = (min?: number, max?: number) => {
    setPrecoMin(min);
    setPrecoMax(max);
    // Dispara busca imediata com os outros campos atuais
    const data = getValues();
    onBuscar({ ...data, cidade: cidadeSel || data.cidade, estado: estadoSel || data.estado, preco_min: min, preco_max: max });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">

        {/* Linha 1: cidade + estado + buscar */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className={labelClass}>Rua, Cidade ou Estado</label>
            <AutocompleteCidade
              value={cidadeSel}
              onChange={(cidade, estado) => {
                setCidadeSel(cidade);
                setEstadoSel(estado);
              }}
              placeholder="Rua, bairro, cidade ou estado..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 shrink-0"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Linha 2: chips de filtros — 2 linhas no mobile, 1 linha no desktop */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Valor — dropdown */}
          <DropdownValor
            precoMin={precoMin}
            precoMax={precoMax}
            onConfirm={onValorConfirm}
          />

          {/* Tipo */}
          <div className="relative shrink-0">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-500 pointer-events-none" />
            <select
              {...register('tipo')}
              onChange={(e) => { register('tipo').onChange(e); handleSubmit(onSubmit)(); }}
              className="appearance-none pl-8 pr-7 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-primary-300 focus:outline-none cursor-pointer whitespace-nowrap"
            >
              <option value="">Tipo</option>
              {TIPOS_IMOVEL.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Vagas */}
          <div className="relative">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-500 pointer-events-none" />
            <select
              {...register('vagas', { valueAsNumber: true })}
              onChange={(e) => { register('vagas', { valueAsNumber: true }).onChange(e); handleSubmit(onSubmit)(); }}
              className="appearance-none pl-8 pr-7 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-primary-300 focus:outline-none cursor-pointer whitespace-nowrap"
            >
              <option value="">Vagas</option>
              <option value={1}>1+ vaga</option>
              <option value={2}>2+ vagas</option>
              <option value={3}>3+ vagas</option>
              <option value={4}>4+ vagas</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Suítes */}
          <div className="relative">
            <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-500 pointer-events-none" />
            <select
              {...register('quartos_min', { valueAsNumber: true })}
              onChange={(e) => { register('quartos_min', { valueAsNumber: true }).onChange(e); handleSubmit(onSubmit)(); }}
              className="appearance-none pl-8 pr-7 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-primary-300 focus:outline-none cursor-pointer whitespace-nowrap"
            >
              <option value="">Suítes</option>
              <option value={1}>1+ suíte</option>
              <option value={2}>2+ suítes</option>
              <option value={3}>3+ suítes</option>
              <option value={4}>4+ suítes</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Área */}
          <div className="relative">
            <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-500 pointer-events-none" />
            <select
              {...register('area_min', { valueAsNumber: true })}
              onChange={(e) => { register('area_min', { valueAsNumber: true }).onChange(e); handleSubmit(onSubmit)(); }}
              className="appearance-none pl-8 pr-7 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-primary-300 focus:outline-none cursor-pointer whitespace-nowrap"
            >
              <option value="">Área</option>
              {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}+</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Mais filtros */}
          <button
            type="button"
            onClick={() => setMaisAberto((v) => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              maisAberto ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Mais
          </button>

          {/* Limpar */}
          {(precoMin || precoMax) && (
            <button type="button" onClick={limpar}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-auto">
              <X className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>

        {/* Painel mais filtros */}
        {maisAberto && (
          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Bairro</label>
              <input className={inputClass} placeholder="Em breve" disabled />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
