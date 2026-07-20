'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { Building2, LogIn } from 'lucide-react';

interface FormData { email: string; password: string; }

const G = '#0E8F6E';
const GOOGLE_CLIENT_ID = '789254389023-n278go2jmciusvfdore7fu8ujiojqjdb.apps.googleusercontent.com';

function getRedirect(role?: string) {
  if (role === 'cliente') return '/';
  if (role === 'parceiro') return '/dashboard/leads';
  return '/dashboard';
}

export default function LoginPage() {
  const { login, loginWithGoogle, user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  // Redireciona se já autenticado
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.push(getRedirect(user.role));
    }
  }, [isAuthenticated, loading, user, router]);

  // Inicializa Google Sign-In
  useEffect(() => {
    const initGoogle = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !googleBtnRef.current) return;

      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (res: { credential: string }) => {
          try {
            await loginWithGoogle(res.credential);
            toast.success('Bem-vindo!');
            // redirect via useEffect acima
          } catch {
            toast.error('Erro ao entrar com Google. Tente novamente.');
          }
        },
        ux_mode: 'popup',
      });

      g.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        locale: 'pt-BR',
        width: googleBtnRef.current.offsetWidth || 340,
      });
    };

    // Tenta imediatamente (script pode já ter carregado)
    if ((window as any).google) {
      initGoogle();
    } else {
      // Aguarda o script carregar
      const interval = setInterval(() => {
        if ((window as any).google) { clearInterval(interval); initGoogle(); }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [loginWithGoogle]);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Bem-vindo!');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.includes('login social')) {
        toast.error('Esta conta usa Google. Clique em "Continuar com Google".');
      } else {
        toast.error('E-mail ou senha incorretos.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-600 font-bold text-2xl">
            <Building2 className="w-7 h-7" />
            SóConstrutoras
          </Link>
          <p className="text-gray-500 text-sm mt-2">Acesse sua conta</p>
        </div>

        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1.5px solid #E5E7EB',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          padding: '32px 28px',
        }}>

          {/* Botão Google */}
          <div style={{ marginBottom: 20 }}>
            <div
              ref={googleBtnRef}
              style={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'center' }}
            />
          </div>

          {/* Divisor */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>ou entre com e-mail</span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          {/* Formulário email/senha */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">E-mail</label>
              <input
                {...register('email', { required: 'E-mail obrigatório' })}
                type="email"
                className="input"
                placeholder="seu@email.com"
                autoFocus
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                {...register('password', { required: 'Senha obrigatória' })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? '#6B7280' : G,
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px 0', fontWeight: 700, fontSize: 15,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
            >
              <LogIn size={16} />
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', marginTop: 20 }}>
            Não tem conta?{' '}
            <Link href="/auth/register" style={{ color: G, fontWeight: 600, textDecoration: 'none' }}>
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
