'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LogoFaicoh from '@/components/layout/LogoFaicoh';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { LogIn, Building2, MapPin, TrendingUp, Users } from 'lucide-react';

interface FormData { email: string; password: string; }

const G  = '#0E8F6E';
const GA = '#22D497';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '789254389023-5uf41hoogudo6bihdio669kj449fsg14.apps.googleusercontent.com';

function getRedirect(role?: string) {
  if (role === 'cliente') return '/';
  if (role === 'parceiro') return '/dashboard/leads';
  return '/dashboard';
}

const FEATURES = [
  { icon: Building2, text: 'Centenas de empreendimentos direto das construtoras' },
  { icon: MapPin,    text: 'Busca por bairro, região ou ponto de referência' },
  { icon: TrendingUp,text: 'Simulador de financiamento integrado' },
  { icon: Users,     text: 'Rede de parceiros e corretores credenciados' },
];

function LoginContent() {
  const { login, loginWithGoogle, user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const redirectAfterLogin = (role?: string) => {
    const dest = searchParams.get('redirect');
    router.push(dest || getRedirect(role));
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      redirectAfterLogin(user.role);
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
            const u = await loginWithGoogle(res.credential);
            toast.success('Bem-vindo!');
            redirectAfterLogin((u as any)?.role);
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
        width: googleBtnRef.current.offsetWidth || 320,
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
      const u = await login(data.email, data.password);
      toast.success('Bem-vindo!');
      redirectAfterLogin((u as any)?.role);
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
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── PAINEL ESQUERDO — branding (apenas desktop) ─────── */}
      <div className="hidden lg:flex" style={{
        width: '46%',
        flexShrink: 0,
        background: 'linear-gradient(160deg, #03201A 0%, #05342A 40%, #0a4a38 100%)',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Orbs decorativos */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-80px',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(34,212,151,0.12) 0%, transparent 65%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(14,143,110,0.15) 0%, transparent 65%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Logo direto — sem container branco */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'inline-block' }}>
            <LogoFaicoh height={44} textColor="white" />
          </Link>
        </div>

        {/* Textos centrais */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 800, color: '#fff',
            lineHeight: 1.2, marginBottom: 16,
            letterSpacing: '-0.02em',
          }}>
            O portal dos<br />
            <span style={{
              background: `linear-gradient(90deg, ${G}, ${GA})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              imóveis novos
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.6, marginBottom: 40 }}>
            Conectamos construtoras, corretores e compradores na maior plataforma imobiliária de BH.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(14,143,110,0.2)',
                  border: '1px solid rgba(34,212,151,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={GA} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.4 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé do painel */}
        <p style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
          © 2026 Faicoh · Todos os direitos reservados
        </p>
      </div>

      {/* ── PAINEL DIREITO — formulário ──────────────────────── */}
      <div style={{
        flex: 1,
        background: '#F8FAF9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}>

        {/* Logo mobile (visível só em telas < lg) */}
        <div className="flex lg:hidden" style={{ justifyContent: 'center', marginBottom: 32 }}>
          <Link href="/">
            <LogoFaicoh height={36} textColor="dark" />
          </Link>
        </div>

        {/* Card de login */}
        <div style={{
          width: '100%',
          maxWidth: 400,
        }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 800, color: '#0D1F1A',
              margin: 0, letterSpacing: '-0.02em',
            }}>
              Bem-vindo de volta
            </h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>
              Acesse sua conta para continuar
            </p>
          </div>

          {/* Botão Google */}
          <div style={{ marginBottom: 20 }}>
            <div
              ref={googleBtnRef}
              style={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'center' }}
            />
          </div>

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap' }}>
              ou entre com e-mail
            </span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                E-mail
              </label>
              <input
                {...register('email', { required: 'E-mail obrigatório' })}
                type="email"
                placeholder="seu@email.com"
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#fff',
                  border: errors.email ? '1.5px solid #f87171' : '1.5px solid #D1D5DB',
                  borderRadius: 10, padding: '11px 14px',
                  fontSize: 15, color: '#111',
                  outline: 'none', transition: 'border-color 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(14,143,110,0.12)`; }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.email ? '#f87171' : '#D1D5DB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
              />
              {errors.email && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Senha
              </label>
              <input
                {...register('password', { required: 'Senha obrigatória' })}
                type="password"
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#fff',
                  border: errors.password ? '1.5px solid #f87171' : '1.5px solid #D1D5DB',
                  borderRadius: 10, padding: '11px 14px',
                  fontSize: 15, color: '#111',
                  outline: 'none', transition: 'border-color 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(14,143,110,0.12)`; }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.password ? '#f87171' : '#D1D5DB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
              />
              {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 4,
                background: isSubmitting ? '#9CA3AF' : `linear-gradient(90deg, ${G}, ${GA})`,
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '13px 0', fontWeight: 700, fontSize: 15,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.2s',
                boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(14,143,110,0.35)',
              }}
            >
              <LogIn size={16} />
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', marginTop: 20 }}>
            Não tem conta?{' '}
            <Link href="/auth/register" style={{ color: G, fontWeight: 700, textDecoration: 'none' }}>
              Cadastre-se grátis
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: 12 }}>
            <Link href="/" style={{ color: '#9CA3AF', fontSize: 12, textDecoration: 'none' }}>
              ← Voltar ao site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0B1D2A', minHeight: '100vh' }} />}>
      <LoginContent />
    </Suspense>
  );
}
