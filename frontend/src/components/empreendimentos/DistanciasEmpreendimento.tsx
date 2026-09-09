'use client';

import { useState, useEffect } from 'react';
import { Navigation, MapPin, Loader2 } from 'lucide-react';
import type { PerfilImobiliario } from '@/app/page';

interface Props {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

const G = '#0E8F6E';

async function geocodificar(endereco: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(endereco + ', Belo Horizonte, MG, Brasil');
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'pt-BR' },
    });
    const data = await r.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    return null;
  } catch { return null; }
}

async function osrm(origemLat: number, origemLng: number, destLat: number, destLng: number): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origemLng},${origemLat};${destLng},${destLat}?overview=false`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.routes?.length) return Math.round(d.routes[0].duration / 60);
  } catch { /* ignora */ }
  return null;
}

async function calcularDistanciasDeLocais(
  empLat: number, empLng: number,
  perfil: PerfilImobiliario,
): Promise<{ label: string; min: number }[]> {
  const locais: { label: string; coord: [number, number] }[] = [];
  if (perfil.coordTrabalho1 && perfil.trabalho1) locais.push({ label: 'Trabalho dele',    coord: perfil.coordTrabalho1 });
  if (perfil.coordTrabalho2 && perfil.trabalho2) locais.push({ label: 'Trabalho dela',    coord: perfil.coordTrabalho2 });
  if (perfil.coordEscola1   && perfil.escola1)   locais.push({ label: 'Escola — Filho 1', coord: perfil.coordEscola1 });
  if (perfil.coordEscola2   && perfil.escola2)   locais.push({ label: 'Escola — Filho 2', coord: perfil.coordEscola2 });
  if (!locais.length) return [];

  const resultados = await Promise.all(locais.map(async ({ label, coord }) => {
    const min = await osrm(coord[0], coord[1], empLat, empLng);
    return min !== null ? { label, min } : null;
  }));
  return resultados.filter(Boolean) as { label: string; min: number }[];
}

export default function DistanciasEmpreendimento({ latitude, longitude }: Props) {
  const [distancias, setDistancias] = useState<{ label: string; min: number }[]>([]);

  // ── Calculador manual ──
  const [enderecoManual, setEnderecoManual] = useState('');
  const [calculando, setCalculando] = useState(false);
  const [resultadoManual, setResultadoManual] = useState<{ min: number; endereco: string } | null>(null);
  const [erroManual, setErroManual] = useState('');

  useEffect(() => {
    if (!latitude || !longitude) return;
    const calcular = async (perfil?: PerfilImobiliario | null) => {
      const p = perfil ?? (() => {
        try { return JSON.parse(localStorage.getItem('sc_perfil') || 'null'); } catch { return null; }
      })();
      if (!p) return;
      const dists = await calcularDistanciasDeLocais(latitude, longitude, p);
      setDistancias(dists);
    };
    calcular();
    const h = (e: Event) => calcular((e as CustomEvent).detail);
    window.addEventListener('perfil-changed', h);
    return () => window.removeEventListener('perfil-changed', h);
  }, [latitude, longitude]);

  const calcularManual = async () => {
    if (!enderecoManual.trim() || !latitude || !longitude) return;
    setCalculando(true);
    setErroManual('');
    setResultadoManual(null);
    const coord = await geocodificar(enderecoManual.trim());
    if (!coord) { setErroManual('Endereço não encontrado. Tente ser mais específico.'); setCalculando(false); return; }
    const min = await osrm(coord[0], coord[1], latitude, longitude);
    if (min === null) { setErroManual('Não foi possível calcular a rota.'); setCalculando(false); return; }
    setResultadoManual({ min, endereco: enderecoManual.trim() });
    setCalculando(false);
  };

  const temPerfil = distancias.length > 0;

  return (
    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 8 }}>

      {/* ── Distâncias do perfil ── */}
      {temPerfil && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Distâncias do seu perfil
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {distancias.map(d => (
              <span key={d.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600, color: G,
                background: '#F0FAF7', border: '1px solid #A7F3D0',
                borderRadius: 8, padding: '6px 12px',
              }}>
                <Navigation size={11} style={{ flexShrink: 0 }} />
                {d.label} · <strong>{d.min} min</strong> de carro
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Calculador manual ── */}
      {latitude && longitude && (
        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px 16px', border: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
            Calcular distância de um endereço
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={enderecoManual}
              onChange={e => setEnderecoManual(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calcularManual()}
              placeholder="Ex: Savassi, Shopping Diamond, Av. Afonso Pena 1000..."
              style={{
                flex: 1, padding: '9px 12px',
                border: '1.5px solid #E5E7EB', borderRadius: 8,
                fontSize: 13, color: '#111827', outline: 'none',
                background: '#fff',
              }}
            />
            <button
              onClick={calcularManual}
              disabled={calculando || !enderecoManual.trim()}
              style={{
                padding: '9px 16px', borderRadius: 8, border: 'none',
                background: calculando || !enderecoManual.trim() ? '#D1D5DB' : G,
                color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: calculando || !enderecoManual.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              }}
            >
              {calculando
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Calculando...</>
                : <><Navigation size={14} /> Calcular</>}
            </button>
          </div>

          {erroManual && (
            <p style={{ fontSize: 12, color: '#EF4444', marginTop: 8 }}>{erroManual}</p>
          )}

          {resultadoManual && (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 8,
              background: '#F0FAF7', border: '1px solid #A7F3D0',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Navigation size={14} color={G} style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 12, color: '#374151' }}>De <strong>{resultadoManual.endereco}</strong> até aqui: </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: G }}>{resultadoManual.min} min de carro</span>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
