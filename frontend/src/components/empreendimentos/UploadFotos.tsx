'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api, { midiasApi } from '@/lib/api';
import type { Midia } from '@/types';
import { Upload, X, ImageIcon, Loader2, GripVertical } from 'lucide-react';

interface Props {
  empreendimentoId: string;
  midias: Midia[];
  onChange: (midias: Midia[]) => void;
}

export default function UploadFotos({ empreendimentoId, midias, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const validos = Array.from(files).filter((f) => permitidos.includes(f.type));

    if (validos.length === 0) {
      toast.error('Apenas imagens JPG, PNG ou WebP são permitidas.');
      return;
    }

    setUploading(true);
    const novasMidias: Midia[] = [];

    for (const file of validos) {
      try {
        // Upload local via axios (já envia o token automaticamente)
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

  const remover = async (midia: Midia) => {
    try {
      await midiasApi.remover(empreendimentoId, midia.id);
      onChange(midias.filter((m) => m.id !== midia.id));
      toast.success('Foto removida.');
    } catch {
      toast.error('Erro ao remover foto.');
    }
  };

  return (
    <div>
      {/* Grid de fotos existentes */}
      {midias.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {midias.map((midia, idx) => (
            <div key={midia.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <Image src={midia.url} alt={midia.legenda ?? `Foto ${idx + 1}`} fill className="object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-primary-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                  Capa
                </span>
              )}
              <button
                onClick={() => remover(midia)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
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
            <p className="text-xs">JPG, PNG ou WebP · Máximo 20 MB por foto</p>
            <p className="text-xs text-gray-400">A primeira foto será a capa do empreendimento</p>
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
