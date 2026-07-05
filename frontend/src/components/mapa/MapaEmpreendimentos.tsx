'use client';

/**
 * MapaEmpreendimentos
 *
 * Componente Leaflet com marcadores dos empreendimentos.
 * Deve ser importado via `dynamic` com ssr: false para evitar erros no Next.js.
 *
 * Exemplo de uso:
 *   const MapaEmpreendimentos = dynamic(
 *     () => import('@/components/mapa/MapaEmpreendimentos'),
 *     { ssr: false }
 *   );
 */

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix ícones padrão do Leaflet (problema comum com Webpack/Next.js)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Ícone personalizado com a cor primária da plataforma
const iconePersonalizado = new L.DivIcon({
  html: `
    <div style="
      background: #4361ee;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  className: '',
  iconSize:   [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
});

// Ícone para empreendimento selecionado (hover)
const iconeDestaque = new L.DivIcon({
  html: `
    <div style="
      background: #ff6b35;
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #fff;
      box-shadow: 0 3px 12px rgba(255,107,53,0.5);
    "></div>
  `,
  className: '',
  iconSize:   [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -42],
});

export interface EmpreendimentoMapa {
  id: string;
  nome: string;
  slug: string;
  tipo: string;
  cidade: string;
  estado: string;
  preco_min: number | null;
  preco_max: number | null;
  quartos_min: number | null;
  quartos_max: number | null;
  latitude: number;
  longitude: number;
  foto_capa: string | null;
  construtora: string;
}

interface Props {
  empreendimentos: EmpreendimentoMapa[];
  /** ID do card em hover na lista (para destacar no mapa) */
  destacado?: string | null;
  altura?: string;
  centroInicial?: [number, number];
  zoomInicial?: number;
}

/** Componente auxiliar: re-centra o mapa quando os empreendimentos mudam */
function AjustarBounds({ empreendimentos }: { empreendimentos: EmpreendimentoMapa[] }) {
  const map = useMap();

  useEffect(() => {
    if (empreendimentos.length === 0) return;

    const coords = empreendimentos.map(e => [e.latitude, e.longitude] as [number, number]);

    if (coords.length === 1) {
      map.setView(coords[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [empreendimentos, map]);

  return null;
}

function formatarPreco(min: number | null, max: number | null): string {
  if (!min && !max) return 'Consulte';
  const formatar = (v: number) =>
    v >= 1_000_000
      ? `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')} M`
      : `R$ ${(v / 1000).toFixed(0)} mil`;

  if (min && max && min !== max) return `${formatar(min)} – ${formatar(max)}`;
  return formatar(min ?? max!);
}

function formatarQuartos(min: number | null, max: number | null): string {
  if (!min && !max) return '';
  if (min === max || !max) return `${min ?? max} qts`;
  return `${min}–${max} qts`;
}

export default function MapaEmpreendimentos({
  empreendimentos,
  destacado,
  altura = '100%',
  centroInicial = [-15.77972, -47.92972], // Brasília
  zoomInicial = 5,
}: Props) {
  const temEmpreendimentos = empreendimentos.length > 0;

  return (
    <div style={{ height: altura, width: '100%', position: 'relative' }}>
      <MapContainer
        center={centroInicial}
        zoom={zoomInicial}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom
      >
        {/* Tiles OpenStreetMap — gratuito, sem API key */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {temEmpreendimentos && <AjustarBounds empreendimentos={empreendimentos} />}

        {empreendimentos.map((emp) => (
          <Marker
            key={emp.id}
            position={[emp.latitude, emp.longitude]}
            icon={destacado === emp.id ? iconeDestaque : iconePersonalizado}
          >
            <Popup
              minWidth={220}
              maxWidth={260}
              className="mapa-popup"
            >
              <div style={{ fontFamily: 'inherit', padding: '2px 0' }}>
                {/* Foto de capa */}
                {emp.foto_capa && (
                  <img
                    src={emp.foto_capa}
                    alt={emp.nome}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      marginBottom: '8px',
                    }}
                  />
                )}

                {/* Badge de tipo */}
                <span style={{
                  display: 'inline-block',
                  background: '#eff2ff',
                  color: '#4361ee',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px',
                }}>
                  {emp.tipo}
                </span>

                {/* Nome */}
                <p style={{ margin: '4px 0 2px', fontWeight: 700, fontSize: '14px', color: '#111' }}>
                  {emp.nome}
                </p>

                {/* Localização */}
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#666' }}>
                  {emp.cidade}/{emp.estado}
                </p>

                {/* Preço e quartos */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#4361ee' }}>
                    {formatarPreco(emp.preco_min, emp.preco_max)}
                  </span>
                  {(emp.quartos_min || emp.quartos_max) && (
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {formatarQuartos(emp.quartos_min, emp.quartos_max)}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <a
                  href={`/imoveis/${emp.slug}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: '#4361ee',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Ver empreendimento →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay: sem resultados */}
      {!temEmpreendimentos && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.85)',
          pointerEvents: 'none',
        }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Nenhum empreendimento com localização cadastrada.
          </p>
        </div>
      )}
    </div>
  );
}
