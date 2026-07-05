import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value?: number | null) {
  if (!value) return 'Consulte';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatArea(value?: number | null) {
  if (!value) return null;
  return `${value} m²`;
}

export const TIPOS_IMOVEL = [
  { value: 'apartamento',       label: 'Apartamento' },
  { value: 'casa',              label: 'Casa' },
  { value: 'terreno',           label: 'Terreno' },
  { value: 'comercial',         label: 'Comercial' },
  { value: 'studio',            label: 'Studio' },
  { value: 'area_garden',       label: 'Área Privativa/Garden' },
  { value: 'cobertura',         label: 'Cobertura' },
];

export const STATUS_OBRA = [
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'em_obras',   label: 'Em obras' },
  { value: 'pronto',     label: 'Pronto para morar' },
  { value: 'suspenso',   label: 'Suspenso' },
];

export const STATUS_LEAD = [
  { value: 'novo',           label: 'Novo',           color: 'bg-blue-100 text-blue-700' },
  { value: 'atribuido',      label: 'Atribuído',      color: 'bg-yellow-100 text-yellow-700' },
  { value: 'em_atendimento', label: 'Em atendimento', color: 'bg-purple-100 text-purple-700' },
  { value: 'convertido',     label: 'Convertido',     color: 'bg-green-100 text-green-700' },
  { value: 'perdido',        label: 'Perdido',         color: 'bg-red-100 text-red-700' },
];

export const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];
