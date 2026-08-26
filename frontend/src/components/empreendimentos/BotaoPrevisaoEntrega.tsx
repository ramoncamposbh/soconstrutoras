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
      <div className="flex items-center gap-2 text-sm">
        <CalendarCheck className="w-5 h-5 text-primary-500" />
        <span className="font-medium">Entrega: {formatarData(previsaoEntrega)}</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push(`/auth/login?redirect=/imoveis/${slug}`)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#0E8F6E', color: '#fff',
        border: 'none', borderRadius: 8,
        padding: '5px 12px', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      <Lock size={13} />
      Previsão de entrega
    </button>
  );
}
