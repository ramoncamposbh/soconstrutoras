'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import SecaoUnidades from './SecaoUnidades';
import { Lock, LogIn } from 'lucide-react';
import type { Unidade } from '@/types';

interface Props {
  unidades: Unidade[];
  nomeEmpreendimento: string;
}

export default function SecaoUnidadesGated({ unidades, nomeEmpreendimento }: Props) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div style={{
        borderRadius: 12,
        border: '1.5px dashed #D1D5DB',
        padding: '32px 24px',
        textAlign: 'center',
        background: '#F9FAFB',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Blur preview das unidades */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(249,250,251,0.92) 40%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'rgba(14,143,110,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Lock size={22} color="#0E8F6E" />
          </div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 6 }}>
            Unidades e valores disponíveis
          </p>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.5 }}>
            Faça login para ver as unidades disponíveis,<br />preços e plantas deste empreendimento.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(90deg, #0E8F6E, #22D497)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 24px', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(14,143,110,0.3)',
            }}
          >
            <LogIn size={16} />
            Entrar para ver unidades
          </button>
        </div>
      </div>
    );
  }

  return <SecaoUnidades unidades={unidades} nomeEmpreendimento={nomeEmpreendimento} />;
}
