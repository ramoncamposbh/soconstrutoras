'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bem-vindo ao painel!');
      router.push('/dashboard');
    } catch {
      toast.error('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const G = '#0E8F6E';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo / título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: G,
            marginBottom: 16,
          }}>
            <Shield size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
            Acesso Restrito
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>
            Painel administrativo — SóConstrutoras
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1.5px solid #E5E7EB',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          padding: '32px 28px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@soconstrutoras.com.br"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #D1D5DB',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = G)}
                onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #D1D5DB',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = G)}
                onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#9CA3AF' : G,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 0',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4,
                transition: 'background 0.2s',
              }}
            >
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Entrar no Painel'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 24 }}>
          Acesso restrito à equipe SóConstrutoras
        </p>
      </div>
    </div>
  );
}
