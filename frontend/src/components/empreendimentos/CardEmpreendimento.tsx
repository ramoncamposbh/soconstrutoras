'use client';

import { useState } from 'react';
import { toggleFavorito, useEhFavorito } from '@/lib/favoritos';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, BedDouble, Car, Maximize2, Heart,
  CheckCircle, ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Empreendimento } from '@/types';

// ─── Paleta brand ──────────────────────────────────────────────────────────
const G = '#0E8F6E';
const GD = '#0A6A52';

// ─── Status badge ──────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  lancamento: { label: 'Lançamento',  bg: '#0E8F6E', text: '#fff' },
  em_obras:   { label: 'Em obras',    bg: '#F59E0B', text: '#78350F' },
  pronto:     { label: 'Pronto',      bg: '#059669', text: '#fff' },
  suspenso:   { label: 'Suspenso',    bg: '#6B7280', text: '#fff' },
};

// ─── "Por que recomendamos?" — gerado deterministicamente por ID ───────────
const POOL = [
  'Dentro do seu orçamento',
  'Condomínio clube',
  'Lazer completo',
  'Pet Friendly',
  'Alto potencial de valorização',
  'Pronto para morar',
  'Próximo à escola dos filhos',
  'Vista definitiva',
  'Segurança 24h',
  'Perto do seu trabalho',
  'Aceita seu financiamento',
  'Construtora premiada',
  'Entrega garantida',
  'Excelente liquidez',
];

function getMotivos(id: string): string[] {
  const hash = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const picks: string[] = [];
  let h = Math.abs(hash);
  while (picks.length < 5) {
    const idx = h % POOL.length;
    if (!picks.includes(POOL[idx])) picks.push(POOL[idx]);
    h = Math.abs((h * 1103515245 + 12345) | 0);
  }
  return picks;
}

interface Props {
  emp: Empreendimento;
  compatibilidade?: number;
  onVerNoMapa?: () => void;
}

export default function CardEmpreendimento({ emp, compatibilidade }: Props) {
  const [hover, setHover] = useState(false);
  const favorito = useEhFavorito(emp.id);

  const s = STATUS_LABEL[emp.status] ?? STATUS_LABEL.lancamento;
  const motivos = getMotivos(emp.id);

  const suitesLabel = emp.quartos_min
    ? emp.quartos_min === emp.quartos_max
      ? `${emp.quartos_min} suítes`
      : `${emp.quartos_min} a ${emp.quartos_max} suítes`
    : null;

  const vagasLabel = emp.vagas != null
    ? `${emp.vagas > 1 ? `2 a ${emp.vagas}` : emp.vagas} vagas`
    : null;

  const areaLabel = emp.area_min
    ? emp.area_max && emp.area_max !== emp.area_min
      ? `${emp.area_min}a ${emp.area_max} m²`
      : `${emp.area_min} m²`
    : null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={`/imoveis/${emp.slug}`}
        className="group block bg-white rounded-[16px] overflow-hidden"
        style={{
          border: hover ? `1.5px solid ${G}` : '1.5px solid #E5E7EB',
          boxShadow: hover ? '0 8px 32px rgba(14,143,110,0.14)' : '0 1px 4px rgba(0,0,0,0.06)',
          transition: 'all 0.2s',
        }}
      >
        {/* ── Imagem ── */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {emp.foto_capa ? (
            <Image
              src={emp.foto_capa}
              alt={emp.nome}
              fill
              className="object-cover"
              style={{ transform: hover ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s ease' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
              <svg className="w-12 h-12" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}

          {/* Status badge */}
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: s.bg, color: s.text,
            fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 6,
          }}>
            {s.label}
          </span>

          {/* Compatibilidade badge */}
          {compatibilidade && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(4,36,29,0.88)',
              backdropFilter: 'blur(4px)',
              borderRadius: 9, padding: '5px 9px',
              lineHeight: 1,
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{compatibilidade}%</div>
              <div style={{ fontSize: 8.5, color: '#6EE7B7', fontWeight: 500 }}>Compatível</div>
            </div>
          )}

          {/* Favorito */}
          <button
            onClick={(e) => { e.preventDefault(); toggleFavorito(emp); }}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            <Heart
              size={15}
              fill={favorito ? '#EF4444' : 'none'}
              color={favorito ? '#EF4444' : '#9CA3AF'}
            />
          </button>
        </div>

        {/* ── Conteúdo ── */}
        <div style={{ padding: '14px 14px 12px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {emp.nome}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
            <MapPin size={10} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {emp.cidade} — {emp.estado}
            </span>
          </div>

          {/* Specs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 11, color: '#6B7280', marginBottom: 10, flexWrap: 'wrap' }}>
            {suitesLabel && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <BedDouble size={10} /> {suitesLabel}
              </span>
            )}
            {vagasLabel && suitesLabel && <span style={{ margin: '0 6px', color: '#D1D5DB' }}>|</span>}
            {vagasLabel && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Car size={10} /> {vagasLabel}
              </span>
            )}
            {areaLabel && (vagasLabel || suitesLabel) && <span style={{ margin: '0 6px', color: '#D1D5DB' }}>|</span>}
            {areaLabel && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Maximize2 size={10} /> {areaLabel}
              </span>
            )}
          </div>

          {/* Preço + botão */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {emp.preco_min ? (
                <>
                  <div style={{ fontSize: 9.5, color: '#9CA3AF', fontWeight: 500, marginBottom: 1 }}>A partir de</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: GD }}>
                    {formatCurrency(emp.preco_min)}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>Consulte o valor</div>
              )}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11.5, fontWeight: 700, color: G,
              padding: '6px 12px', borderRadius: 8,
              border: `1.5px solid ${hover ? G : '#E5E7EB'}`,
              transition: 'border-color 0.2s',
            }}>
              Ver detalhes <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </Link>

      {/* ── "Por que recomendamos?" — painel hover ── */}
      <div style={{
        position: 'absolute', top: 0, right: 'calc(100% + 10px)',
        width: 200, zIndex: 20,
        background: '#fff',
        border: `1.5px solid ${G}`,
        borderRadius: 14, padding: '14px 14px',
        boxShadow: '0 12px 40px rgba(14,143,110,0.18)',
        opacity: hover ? 1 : 0,
        transform: hover ? 'translateX(0) scale(1)' : 'translateX(8px) scale(0.97)',
        transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: GD, marginBottom: 10 }}>
          Por que recomendamos?
        </div>
        {motivos.map(m => (
          <div key={m} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: '#374151', marginBottom: 6, lineHeight: 1.4 }}>
            <CheckCircle size={11} color={G} style={{ flexShrink: 0, marginTop: 1 }} />
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}
