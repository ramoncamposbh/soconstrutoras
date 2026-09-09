'use client';

import { useState, useEffect } from 'react';
import { Navigation } from 'lucide-react';
import type { PerfilImobiliario } from '@/app/page';

interface Props {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

async function calcularDistancias(
  empLat: number, empLng: number,
  perfil: PerfilImobiliario,
): Promise<{ label: string; min: number }[]> {
  const locais: { label: string; coord: [number, number] }[] = [];
  if (perfil.coordTrabalho1 && perfil.trabalho1) locais.push({ label: 'Trabalho dele', coord: perfil.coordTrabalho1 });
  if (perfil.coordTrabalho2 && perfil.trabalho2) locais.push({ label: 'Trabalho dela', coord: perfil.coordTrabalho2 });
  if (perfil.coordEscola1   && perfil.escola1)   locais.push({ label: 'Escola — Filho 1', coord: perfil.coordEscola1 });
  if (perfil.coordEscola2   && perfil.escola2)   locais.push({ label: 'Escola — Filho 2', coord: perfil.coordEscola2 });
  if (!locais.length) return [];

  const resultados = await Promise.all(locais.map(async ({ label, coord }) => {
    try {
      const [lat, lon] = coord;
      const url = `https://router.project-osrm.org/route/v1/driving/${lon},${lat};${empLng},${empLat}?overview=false`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.routes?.length) return { label, min: Math.round(d.routes[0].duration / 60) };
    } catch { /* ignora */ }
    return null;
  }));
  return resultados.filter(Boolean) as { label: string; min: number }[];
}

export default function DistanciasEmpreendimento({ latitude, longitude }: Props) {
  const [distancias, setDistancias] = useState<{ label: string; min: number }[]>([]);

  useEffect(() => {
    if (!latitude || !longitude) return;
    const calcular = async (perfil?: PerfilImobiliario | null) => {
      const p = perfil ?? (() => {
        try { return JSON.parse(localStorage.getItem('sc_perfil') || 'null'); } catch { return null; }
      })();
      if (!p) return;
      const dists = await calcularDistancias(latitude, longitude, p);
      setDistancias(dists);
    };
    calcular();

    const h = (e: Event) => calcular((e as CustomEvent).detail);
    window.addEventListener('perfil-changed', h);
    return () => window.removeEventListener('perfil-changed', h);
  }, [latitude, longitude]);

  if (!distancias.length) return null;

  return (
    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 14, marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        Distâncias do seu perfil
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {distancias.map(d => (
          <span key={d.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: '#0E8F6E',
            background: '#F0FAF7', border: '1px solid #A7F3D0',
            borderRadius: 8, padding: '6px 12px',
          }}>
            <Navigation size={11} style={{ flexShrink: 0 }} />
            {d.label} · <strong>{d.min} min</strong> de carro
          </span>
        ))}
      </div>
    </div>
  );
}
