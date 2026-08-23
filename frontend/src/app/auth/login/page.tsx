'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { LogIn } from 'lucide-react';

interface FormData { email: string; password: string; }

const G  = '#0E8F6E';
const GA = '#22D497';
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

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.push(getRedirect(user.role));
    }
  }, [isAuthenticated, loading, user, router]);

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

    if ((window as any).google) {
      initGoogle();
    } else {
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #04241D 0%, #0D2B22 50%, #0a1f1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Orbs decorativos de fundo */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(14,143,110,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(34,212,151,0.10) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-block' }}>
            <div style={{ height: 52, overflow: 'hidden' }}>
              <Image
                src="/logo-faicoh.png"
                alt="Faicoh"
                width={300}
                height={160}
                style={{ objectFit: 'contain', objectPosition: 'top', filter: 'brightness(0) invert(1)' }}
                priority
              />
            </div>
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 8 }}>
            Acesse sua conta
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>

          {/* Botão Google */}
          <div style={{ marginBottom: 20 }}>
            <div
              ref={googleBtnRef}
              style={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'center' }}
            />
          </div>

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>
              ou entre com e-mail
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                E-mail
              </label>
              <input
                {...register('email', { required: 'E-mail obrigatório' })}
                type="email"
                placeholder="seu@email.com"
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.07)',
                  border: errors.email ? '1.5px solid #f87171' : '1.5px solid rgba(255,255,255,0.14)',
                  borderRadius: 12, padding: '11px 14px',
                  fontSize: 15, color: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = GA; }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.email ? '#f87171' : 'rgba(255,255,255,0.14)'; }}
              />
              {errors.email && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                Senha
              </label>
              <input
                {...register('password', { required: 'Senha obrigatória' })}
                type="password"
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.07)',
                  border: errors.password ? '1.5px solid #f87171' : '1.5px solid rgba(255,255,255,0.14)',
                  borderRadius: 12, padding: '11px 14px',
                  fontSize: 15, color: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = GA; }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.password ? '#f87171' : 'rgba(255,255,255,0.14)'; }}
              />
              {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 4,
                background: isSubmitting
                  ? 'rgba(255,255,255,0.1)'
                  : `linear-gradient(90deg, ${G}, ${GA})`,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '13px 0',
                fontWeight: 700,
                fontSize: 15,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.2s',
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(14,143,110,0.4)',
              }}
            >
              <LogIn size={16} />
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 20 }}>
            Não tem conta?{' '}
            <Link href="/auth/register" style={{ color: GA, fontWeight: 600, textDecoration: 'none' }}>
              Cadastre-se grátis
            </Link>
          </p>
        </div>

        {/* Voltar ao site */}
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>
            ← Voltar ao site
          </Link>
        </p>

      </div>
    </div>
  );
}
