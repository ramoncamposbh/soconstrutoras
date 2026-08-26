'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Lock, CalendarCheck } from 'lucide-react';

interface Props {
  previsaoEntrega: string;
  slug: string;
}

function formatarData(iso: string) {
  try {
    const d = new Date(iso + 'T12:00:00');
    const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return iso;
  }
}

export default function BotaoPrevisaoEntrega({ previsaoEntrega, slug }: Props) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 10,
        background: 'rgba(14,143,110,0.08)',
        border: '1px solid rgba(14,143,110,0.25)',
      }}>
        <CalendarCheck size={18} color="#0E8F6E" />
        <div>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Previsão de entrega</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0E8F6E', margin: 0 }}>
            {formatarData(previsaoEntrega)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push(`/auth/login?redirect=/imoveis/${slug}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 10, width: '100%',
        background: 'rgba(0,0,0,0.03)',
        border: '1.5px dashed #cbd5e1',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <Lock size={16} color="#94a3b8" />
      <div>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Previsão de entrega</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: 0 }}>
          Faça login para ver a data
        </p>
      </div>
    </button>
  );
}
