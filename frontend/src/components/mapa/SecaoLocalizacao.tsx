'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Lock } from 'lucide-react';
import Cookies from 'js-cookie';
import ModalAutenticacao from '@/components/auth/ModalAutenticacao';

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
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
}

export default function SecaoLocalizacao({ latitude, longitude, bairro, cidade, estado, cep }: Props) {
  const [autenticado, setAutenticado] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    setAutenticado(!!Cookies.get('token'));
  }, []);

  const lat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const lng = longitude != null && longitude !== '' ? Number(longitude) : null;
  const temCoordenadas = lat != null && !isNaN(lat) && lng != null && !isNaN(lng);

  const linhaCidadeEstado = `${cidade} — ${estado}${cep ? `, CEP ${cep}` : ''}`;

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary-500" />
        <h2 className="font-semibold text-gray-900">Localizacao</h2>
      </div>

      {/* Endereco textual — apenas bairro (endereco completo bloqueado) */}
      <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
        <Navigation className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
        <div>
          {bairro && (
            <p className="text-sm font-medium text-gray-800">{bairro}</p>
          )}
          <p className="text-sm text-gray-500">{linhaCidadeEstado}</p>
          {!autenticado && (
            <button
              onClick={() => setModalAberto(true)}
              className="mt-1.5 flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors"
            >
              <Lock className="w-3 h-3" />
              Ver endereco completo — faca login
            </button>
          )}
        </div>
      </div>

      {/* Mapa — bloqueado para nao autenticados */}
      {temCoordenadas ? (
        <div className="relative rounded-xl overflow-hidden">
          <div className={!autenticado ? 'blur-sm pointer-events-none select-none' : ''}>
            <MapaLocalizacao latitude={lat!} longitude={lng!} altura="266px" />
          </div>

          {!autenticado && (
            <button
              onClick={() => setModalAberto(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-6 py-5 flex flex-col items-center gap-2 text-center border border-gray-100 group-hover:shadow-2xl transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-primary-500 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-gray-900 text-sm">Ver localizacao exata</p>
                <p className="text-xs text-gray-500">Faca login para acessar</p>
                <span className="text-xs font-semibold text-primary-500 mt-0.5">
                  Entrar / Cadastrar →
                </span>
              </div>
            </button>
          )}

          {autenticado && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Localizacao aproximada — entre em contato para mais detalhes.
            </p>
          )}
        </div>
      ) : (
        <div
          className="w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400"
          style={{ height: '200px' }}
        >
          <MapPin className="w-8 h-8 text-gray-300" />
          <p className="text-sm">Localizacao no mapa em breve.</p>
        </div>
      )}

      {modalAberto && (
        <ModalAutenticacao
          onClose={() => setModalAberto(false)}
          titulo="Veja a localizacao completa"
          descricao="Faca login ou crie uma conta gratuita para ver o endereco completo e a localizacao exata no mapa."
        />
      )}
    </div>
  );
}
