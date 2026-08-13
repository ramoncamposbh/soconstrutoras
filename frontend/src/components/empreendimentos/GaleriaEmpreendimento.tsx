'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Building2, ZoomIn } from 'lucide-react';

interface Midia {
  id: string;
  url: string;
  tipo: string;
}

interface Props {
  fotos: Midia[];
  nome: string;
}

export default function GaleriaEmpreendimento({ fotos, nome }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const fechar = useCallback(() => setLightboxIdx(null), []);
  const anterior = useCallback(() =>
    setLightboxIdx(i => (i === null ? null : (i - 1 + fotos.length) % fotos.length)), [fotos.length]);
  const proximo = useCallback(() =>
    setLightboxIdx(i => (i === null ? null : (i + 1) % fotos.length)), [fotos.length]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
      if (e.key === 'ArrowLeft') anterior();
      if (e.key === 'ArrowRight') proximo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, fechar, anterior, proximo]);

  // Bloqueia scroll quando lightbox aberto
  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIdx]);

  if (fotos.length === 0) {
    return (
      <div className="h-56 sm:h-80 md:h-[480px] bg-gray-100 flex items-center justify-center text-gray-300">
        <Building2 className="w-20 h-20" />
      </div>
    );
  }

  return (
    <>
      {/* Foto principal */}
      <div
        className="relative h-56 sm:h-80 md:h-[480px] cursor-zoom-in group"
        onClick={() => setLightboxIdx(0)}
      >
        <Image src={fotos[0].url} alt={nome} fill className="object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
        </div>
        {fotos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            1 / {fotos.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {fotos.length > 1 && (
        <div className="flex gap-2 p-2 overflow-x-auto">
          {fotos.slice(1).map((f, idx) => (
            <div
              key={f.id}
              className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setLightboxIdx(idx + 1)}
            >
              <Image src={f.url} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col" onClick={fechar}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <p className="text-white text-sm opacity-70">{nome}</p>
            <div className="flex items-center gap-3">
              <span className="text-white text-sm opacity-70">
                {lightboxIdx + 1} / {fotos.length}
              </span>
              <button
                onClick={fechar}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Imagem central */}
          <div className="flex-1 relative flex items-center justify-center px-16" onClick={e => e.stopPropagation()}>
            {/* Prev */}
            {fotos.length > 1 && (
              <button
                onClick={anterior}
                className="absolute left-2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            <div className="relative w-full h-full max-w-5xl">
              <Image
                src={fotos[lightboxIdx].url}
                alt={nome}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
            </div>

            {/* Next */}
            {fotos.length > 1 && (
              <button
                onClick={proximo}
                className="absolute right-2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          {/* Thumbnails no rodapé */}
          {fotos.length > 1 && (
            <div
              className="flex gap-2 p-3 overflow-x-auto justify-center flex-shrink-0"
              onClick={e => e.stopPropagation()}
            >
              {fotos.map((f, idx) => (
                <div
                  key={f.id}
                  onClick={() => setLightboxIdx(idx)}
                  className={`relative w-14 h-10 flex-shrink-0 rounded overflow-hidden cursor-pointer transition-all ${
                    idx === lightboxIdx ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <Image src={f.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
