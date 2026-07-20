'use client';

import dynamic from 'next/dynamic';
import { MapPin, Navigation } from 'lucide-react';

const MapaLocalizacao = dynamic(
  () => import('@/components/mapa/MapaLocalizacao'),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full bg-gray-100 rounded-xl flex items-center justify-center"
        style={{ height: '266px' }}
      >
        <MapPin className="w-8 h-8 text-gray-300 animate-pulse" />
      </div>
    ),
  },
);

interface Props {
  latitude?: number | string | null;
  longitude?: number | string | null;
  endereco?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
}

export default function SecaoLocalizacao({
  latitude,
  longitude,
  endereco,
  bairro,
  cidade,
  estado,
  cep,
}: Props) {
  const lat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const lng = longitude != null && longitude !== '' ? Number(longitude) : null;
  const temCoordenadas = lat != null && !isNaN(lat) && lng != null && !isNaN(lng);

  const linhaEndereco = [endereco, bairro].filter(Boolean).join(', ');
  const linhaCidadeEstado = `${cidade} — ${estado}${cep ? `, CEP ${cep}` : ''}`;

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary-500" />
        <h2 className="font-semibold text-gray-900">Localização</h2>
      </div>

      {/* Endereço textual */}
      <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
        <Navigation className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
        <div>
          {linhaEndereco && (
            <p className="text-sm font-medium text-gray-800">{linhaEndereco}</p>
          )}
          <p className="text-sm text-gray-500">{linhaCidadeEstado}</p>
        </div>
      </div>

      {temCoordenadas ? (
        <>
          <MapaLocalizacao
            latitude={lat!}
            longitude={lng!}
            altura="266px"
          />
          <p className="text-xs text-gray-400 text-center">
            Localização aproximada — entre em contato para mais detalhes.
          </p>
        </>
      ) : (
        <div
          className="w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400"
          style={{ height: '200px' }}
        >
          <MapPin className="w-8 h-8 text-gray-300" />
          <p className="text-sm">Localização no mapa em breve.</p>
        </div>
      )}
    </div>
  );
}
