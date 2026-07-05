'use client';

/**
 * MapaLocalizacao — mapa simples para a página do imóvel
 * Mostra um único marcador com o endereço/bairro do empreendimento.
 * Importar com dynamic({ ssr: false }).
 */

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix ícones Leaflet + Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const icone = new L.DivIcon({
  html: `
    <div style="
      background: #4361ee;
      width: 28px; height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(67,97,238,0.5);
    "></div>
  `,
  className: '',
  iconSize:   [28, 28],
  iconAnchor: [14, 28],
});

interface Props {
  latitude: number;
  longitude: number;
  /** Se true, mostra círculo de ~300m em vez do marcador exato (privacidade) */
  aproximado?: boolean;
  altura?: string;
}

export default function MapaLocalizacao({
  latitude,
  longitude,
  aproximado = false,
  altura = '300px',
}: Props) {
  const posicao: [number, number] = [latitude, longitude];

  return (
    <MapContainer
      center={posicao}
      zoom={15}
      style={{ height: altura, width: '100%', borderRadius: '12px', zIndex: 0 }}
      scrollWheelZoom={false}
      dragging
      zoomControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      {aproximado ? (
        /* Círculo de ~300m para indicar a região sem revelar o endereço exato */
        <Circle
          center={posicao}
          radius={300}
          pathOptions={{
            color: '#4361ee',
            fillColor: '#4361ee',
            fillOpacity: 0.15,
            weight: 2,
          }}
        />
      ) : (
        <Marker position={posicao} icon={icone} />
      )}
    </MapContainer>
  );
}
