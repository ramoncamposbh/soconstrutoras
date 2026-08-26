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
      className="flex items-center gap-2 text-sm"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      <Lock className="w-4 h-4" style={{ color: '#94a3b8' }} />
      <span style={{ color: '#94a3b8' }}>
        Previsão de entrega:{' '}
        <span style={{ color: '#0E8F6E', fontWeight: 600 }}>fazer login</span>
      </span>
    </button>
  );
}
