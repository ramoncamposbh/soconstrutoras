'use client';

/**
 * CampoGeocode
 *
 * Inputs de latitude e longitude com botão "Localizar no mapa"
 * que usa a API Nominatim (OpenStreetMap) para geocodificar o endereço.
 *
 * Também exibe um mini-mapa de preview com pin arrastável.
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';

// Mini-mapa de preview com pin arrastável
const MiniMapa = dynamic(() => import('./MiniMapaPreview'), { ssr: false });

interface Props {
  /** valores atuais (vindos do react-hook-form) */
  latitude?: number | null;
  longitude?: number | null;
  /** endereço completo para geocodificar */
  enderecoCompleto: string;
  /** callback quando o usuário confirma as coordenadas */
  onChange: (lat: number, lng: number) => void;
}

export default function CampoGeocode({ latitude, longitude, enderecoCompleto, onChange }: Props) {
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: Number(latitude), lng: Number(longitude) } : null,
  );

  // Sincroniza se o form externo mudar as coordenadas
  useEffect(() => {
    if (latitude && longitude) {
      setCoordenadas({ lat: Number(latitude), lng: Number(longitude) });
    }
  }, [latitude, longitude]);

  const geocodificar = useCallback(async () => {
    if (!enderecoCompleto.trim()) {
      setErro('Preencha o endereço antes de localizar.');
      return;
    }
    setErro('');
    setBuscando(true);

    try {
      const query = encodeURIComponent(enderecoCompleto);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'pt-BR' } },
      );
      const dados = await res.json();

      if (!dados.length) {
        setErro('Endereço não encontrado. Tente com cidade e estado.');
        return;
      }

      const { lat, lon } = dados[0];
      const novasCoordenadas = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setCoordenadas(novasCoordenadas);
      onChange(novasCoordenadas.lat, novasCoordenadas.lng);
    } catch {
      setErro('Erro ao buscar localização. Verifique sua conexão.');
    } finally {
      setBuscando(false);
    }
  }, [enderecoCompleto, onChange]);

  const aoArrastar = useCallback((lat: number, lng: number) => {
    setCoordenadas({ lat, lng });
    onChange(lat, lng);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label mb-0">Localização no mapa</label>
        <button
          type="button"
          onClick={geocodificar}
          disabled={buscando || !enderecoCompleto.trim()}
          className="flex items-center gap-1.5 text-xs bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buscando ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          {buscando ? 'Buscando...' : 'Localizar automaticamente'}
        </button>
      </div>

      {/* Erro */}
      {erro && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {erro}
        </div>
      )}

      {/* Coordenadas manuais */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Latitude</label>
          <input
            type="number"
            step="any"
            placeholder="-23.5505"
            value={coordenadas?.lat ?? ''}
            onChange={(e) => {
              const lat = parseFloat(e.target.value);
              if (!isNaN(lat) && coordenadas) {
                const nova = { ...coordenadas, lat };
                setCoordenadas(nova);
                onChange(nova.lat, nova.lng);
              }
            }}
            className="input text-sm"
          />
        </div>
        <div>
          <label className="label text-xs">Longitude</label>
          <input
            type="number"
            step="any"
            placeholder="-46.6333"
            value={coordenadas?.lng ?? ''}
            onChange={(e) => {
              const lng = parseFloat(e.target.value);
              if (!isNaN(lng) && coordenadas) {
                const nova = { ...coordenadas, lng };
                setCoordenadas(nova);
                onChange(nova.lat, nova.lng);
              }
            }}
            className="input text-sm"
          />
        </div>
      </div>

      {/* Mini-mapa de preview */}
      {coordenadas ? (
        <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '220px' }}>
          <MiniMapa
            latitude={coordenadas.lat}
            longitude={coordenadas.lng}
            aoArrastar={aoArrastar}
          />
        </div>
      ) : (
        <div
          className="rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-sm gap-2"
          style={{ height: '220px' }}
        >
          <MapPin className="w-8 h-8 text-gray-300" />
          <p>Clique em "Localizar automaticamente" para posicionar no mapa.</p>
          <p className="text-xs">Ou insira latitude e longitude manualmente acima.</p>
        </div>
      )}

      {coordenadas && (
        <p className="text-xs text-gray-400 text-center">
          Arraste o marcador no mapa para ajustar a posição.
        </p>
      )}
    </div>
  );
}
