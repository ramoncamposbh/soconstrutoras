'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface Props {
  valueMin?: number;
  valueMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

const SLIDER_MIN = 0;
const SLIDER_MAX = 10_000_000;
const STEP = 50_000;

function fmt(v: number) {
  if (v === 0) return '';
  return v.toLocaleString('pt-BR');
}

function parse(s: string): number {
  const n = parseInt(s.replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export default function RangePreco({ valueMin = 0, valueMax = SLIDER_MAX, onChange }: Props) {
  const [min, setMin] = useState(valueMin);
  const [max, setMax] = useState(valueMax);
  const [inputMin, setInputMin] = useState(fmt(valueMin));
  const [inputMax, setInputMax] = useState(valueMax === SLIDER_MAX ? '' : fmt(valueMax));
  const trackRef = useRef<HTMLDivElement>(null);

  // Percentagens para colorir a faixa
  const pctMin = ((min - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
  const pctMax = ((max - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  const emit = useCallback((lo: number, hi: number) => {
    onChange(lo > 0 ? lo : undefined, hi < SLIDER_MAX ? hi : undefined);
  }, [onChange]);

  // Slider min
  const onSliderMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), max - STEP);
    setMin(v);
    setInputMin(fmt(v));
    emit(v, max);
  };

  // Slider max
  const onSliderMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), min + STEP);
    setMax(v);
    setInputMax(v === SLIDER_MAX ? '' : fmt(v));
    emit(min, v);
  };

  // Input mín — digitar
  const onTypeMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    // Formata ao digitar
    const n = parseInt(raw, 10) || 0;
    setInputMin(raw ? n.toLocaleString('pt-BR') : '');
  };

  const onBlurMin = () => {
    const v = Math.min(parse(inputMin), max - STEP);
    const snapped = Math.round(v / STEP) * STEP;
    setMin(snapped);
    setInputMin(snapped > 0 ? fmt(snapped) : '');
    emit(snapped, max);
  };

  // Input máx — digitar
  const onTypeMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const n = parseInt(raw, 10) || 0;
    setInputMax(raw ? n.toLocaleString('pt-BR') : '');
  };

  const onBlurMax = () => {
    const raw = parse(inputMax);
    if (raw === 0) {
      setMax(SLIDER_MAX);
      setInputMax('');
      emit(min, SLIDER_MAX);
      return;
    }
    const v = Math.max(raw, min + STEP);
    const clamped = Math.min(v, SLIDER_MAX);
    const snapped = Math.round(clamped / STEP) * STEP;
    setMax(snapped);
    setInputMax(snapped === SLIDER_MAX ? '' : fmt(snapped));
    emit(min, snapped);
  };

  return (
    <div className="space-y-3">
      {/* Inputs de texto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mínimo</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputMin}
              onChange={onTypeMin}
              onBlur={onBlurMin}
              placeholder="0"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Máximo</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputMax}
              onChange={onTypeMax}
              onBlur={onBlurMax}
              placeholder="Sem limite"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Dual range slider */}
      <div className="relative h-5 flex items-center" ref={trackRef}>
        {/* Trilha de fundo */}
        <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
        {/* Trilha colorida entre os thumbs */}
        <div
          className="absolute h-1.5 bg-primary-600 rounded-full"
          style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%` }}
        />
        {/* Range mínimo */}
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={STEP}
          value={min}
          onChange={onSliderMin}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer range-thumb"
          style={{ zIndex: min > SLIDER_MAX - STEP ? 5 : 3 }}
        />
        {/* Range máximo */}
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={STEP}
          value={max}
          onChange={onSliderMax}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer range-thumb"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Labels da faixa */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>R$ 0</span>
        <span>R$ 10M</span>
      </div>
    </div>
  );
}
