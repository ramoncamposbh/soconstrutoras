'use client';

/**
 * MiniMapaPreview — mapa de preview no formulário de edição
 * Pin arrastável que atualiza as coordenadas ao soltar.
 */

import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix ícones
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const icone = new L.DivIcon({
  html: `<div style="background:#4361ee;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(67,97,238,0.5)"></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

interface Props {
  latitude: number;
  longitude: number;
  aoArrastar: (lat: number, lng: number) => void;
}

function MarkerArrastavel({
  posicao,
  aoArrastar,
}: {
  posicao: [number, number];
  aoArrastar: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  // Clique no mapa move o marcador
  useMapEvents({
    click(e) {
      aoArrastar(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      ref={markerRef}
      position={posicao}
      icon={icone}
      draggable
      eventHandlers={{
        dragend() {
          const latlng = markerRef.current?.getLatLng();
          if (latlng) aoArrastar(latlng.lat, latlng.lng);
        },
      }}
    />
  );
}

/** Componente auxiliar: re-centra quando coordenadas mudam */
function RecentralizarMapa({ posicao }: { posicao: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(posicao, map.getZoom());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posicao[0], posicao[1]]);
  return null;
}

export default function MiniMapaPreview({ latitude, longitude, aoArrastar }: Props) {
  const posicao: [number, number] = [latitude, longitude];

  return (
    <MapContainer
      center={posicao}
      zoom={15}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <RecentralizarMapa posicao={posicao} />
      <MarkerArrastavel posicao={posicao} aoArrastar={aoArrastar} />
    </MapContainer>
  );
}
