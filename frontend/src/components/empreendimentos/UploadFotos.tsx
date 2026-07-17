'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api, { midiasApi } from '@/lib/api';
import type { Midia } from '@/types';
import { Upload, X, Loader2, GripVertical } from 'lucide-react';

interface Props {
  empreendimentoId: string;
  midias: Midia[];
  onChange: (midias: Midia[]) => void;
}

export default function UploadFotos({ empreendimentoId, midias, onChange }: Props) {
  const [uploading, setUploading]   = useState(false);
  const [savingOrder, setSaving]    = useState(false);
  const [dragIdx, setDragIdx]       = useState<number | null>(null);
  const [overIdx, setOverIdx]       = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Upload ─────────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const validos = Array.from(files).filter((f) => permitidos.includes(f.type));
    if (validos.length === 0) {
      toast.error('Apenas imagens JPG, PNG ou WebP sao permitidas.');
      return;
    }
    setUploading(true);
    const novasMidias: Midia[] = [];
    for (const file of validos) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data: midia } = await api.post(
          `/empreendimentos/${empreendimentoId}/midias/upload-local`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        novasMidias.push(midia);
      } catch {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }
    if (novasMidias.length > 0) {
      onChange([...midias, ...novasMidias]);
      toast.success(`${novasMidias.length} foto${novasMidias.length > 1 ? 's' : ''} enviada${novasMidias.length > 1 ? 's' : ''}!`);
    }
    setUploading(false);
  };

  // ── Remover ────────────────────────────────────────────────────────
  const remover = async (midia: Midia) => {
    try {
      await midiasApi.remover(empreendimentoId, midia.id);
      onChange(midias.filter((m) => m.id !== midia.id));
      toast.success('Foto removida.');
    } catch {
      toast.error('Erro ao remover foto.');
    }
  };

  // ── Drag-and-drop ──────────────────────────────────────────────────
  const onDragStart = (idx: number) => setDragIdx(idx);

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (overIdx !== idx) setOverIdx(idx);
  };

  const onDrop = async (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null); setOverIdx(null); return;
    }
    const reordenadas = [...midias];
    const [moved] = reordenadas.splice(dragIdx, 1);
    reordenadas.splice(idx, 0, moved);
    onChange(reordenadas);
    setDragIdx(null); setOverIdx(null);

    setSaving(true);
    try {
      await midiasApi.reordenar(
        empreendimentoId,
        reordenadas.map((m, i) => ({ id: m.id, ordem: i })),
      );
    } catch {
      toast.error('Erro ao salvar ordem.');
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  return (
    <div>
      {/* Grid de fotos com drag-and-drop */}
      {midias.length > 0 && (
        <>
          {savingOrder && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Salvando ordem...
            </p>
          )}
          {!savingOrder && midias.length > 1 && (
            <p className="text-xs text-gray-400 mb-2">
              Arraste para reordenar · A primeira foto sera a capa
            </p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {midias.map((midia, idx) => (
              <div
                key={midia.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={() => onDrop(idx)}
                onDragEnd={onDragEnd}
                className={[
                  'relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border select-none transition-all',
                  dragIdx === idx
                    ? 'opacity-40 border-dashed border-primary-300 scale-95'
                    : overIdx === idx
                    ? 'border-primary-400 ring-2 ring-primary-300 scale-[1.03]'
                    : 'border-gray-200 cursor-grab active:cursor-grabbing',
                ].join(' ')}
              >
                <Image
                  src={midia.url}
                  alt={midia.legenda ?? `Foto ${idx + 1}`}
                  fill
                  className="object-cover pointer-events-none"
                />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-primary-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded z-10">
                    Capa
                  </span>
                )}
                {/* Controles visíveis no hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center cursor-grab">
                    <GripVertical className="w-3 h-3 text-white" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remover(midia); }}
                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {/* Indicador de posicao */}
                <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <span className="bg-black/50 text-white text-[10px] px-1 rounded">{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Zona de upload */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-primary-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Enviando fotos...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Upload className="w-8 h-8" />
            <p className="text-sm font-medium text-gray-600">Clique ou arraste fotos aqui</p>
            <p className="text-xs">JPG, PNG ou WebP · Maximo 20 MB por foto</p>
            <p className="text-xs text-gray-400">A primeira foto sera a capa do empreendimento</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
