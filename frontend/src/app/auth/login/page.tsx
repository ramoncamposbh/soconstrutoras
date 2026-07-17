'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { LogIn, Eye, EyeOff, Building2, User, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    AppleID: any;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID  = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

function LoginPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const nextUrl       = searchParams.get('next') ?? '/';

  const [tab, setTab]           = useState<'cliente' | 'profissional'>('cliente');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const googleBtnRef            = useRef<HTMLDivElement>(null);

  // ── Google GSI ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'cliente' || !GOOGLE_CLIENT_ID) return;

    const init = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard', theme: 'outline', size: 'large',
        width: googleBtnRef.current.offsetWidth || 380,
        text: 'signin_with', shape: 'rectangular',
      });
    };

    if (window.google) { init(); return; }

    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
    if (existing) { existing.addEventListener('load', init); return; }

    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [tab]);

  // ── Apple JS SDK ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'cliente' || !APPLE_CLIENT_ID) return;

    const s = document.createElement('script');
    s.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    s.async = true;
    s.onload = () => {
      window.AppleID?.auth.init({
        clientId:    APPLE_CLIENT_ID,
        scope:       'name email',
        redirectURI: window.location.origin + '/auth/login',
        usePopup:    true,
      });
    };
    document.head.appendChild(s);

    const onSuccess = async (e: any) => {
      const { authorization, user: appleUser } = e.detail;
      await handleOAuthLogin(() =>
        authApi.loginComApple(authorization.id_token, appleUser),
      );
    };
    document.addEventListener('AppleIDSignInOnSuccess', onSuccess);
    return () => document.removeEventListener('AppleIDSignInOnSuccess', onSuccess);
  }, [tab]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const saveAndRedirect = (token: string, role: string) => {
    const isHttps = window.location.protocol === 'https:';
    Cookies.set('token', token, { expires: 7, secure: isHttps, sameSite: 'lax' });
    const dest =
      role === 'construtora' || role === 'admin' ? '/dashboard'
      : nextUrl !== '/' ? nextUrl
      : '/';
    router.push(dest);
  };

  const handleOAuthLogin = async (fn: () => Promise<any>) => {
    setLoading(true);
    try {
      const { data } = await fn();
      toast.success('Bem-vindo!');
      saveAndRedirect(data.access_token, data.user.role);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = (res: { credential: string }) => {
    handleOAuthLogin(() => authApi.loginComGoogle(res.credential));
  };

  const handleAppleSignIn = async () => {
    if (!window.AppleID) { toast.error('Apple Sign In nao disponivel neste dispositivo.'); return; }
    try {
      const res = await window.AppleID.auth.signIn();
      await handleOAuthLogin(() =>
        authApi.loginComApple(res.authorization.id_token, res.user),
      );
    } catch { /* usuário cancelou */ }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password: senha });
      toast.success('Bem-vindo!');
      saveAndRedirect(data.access_token, data.user.role);
    } catch {
      toast.error('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-gray-900">
            <span className="text-primary-600">SÓ</span>CONSTRUTORAS
          </Link>
          <p className="text-gray-500 text-sm mt-1">Entre na sua conta</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          {([
            ['cliente',      <User      className="w-4 h-4" key="u" />, 'Sou cliente'],
            ['profissional', <Building2 className="w-4 h-4" key="b" />, 'Sou profissional'],
          ] as const).map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="card p-8">

          {/* ── Aba cliente ── */}
          {tab === 'cliente' && (
            <>
              {/* Google button (renderizado pelo GSI) */}
              {GOOGLE_CLIENT_ID && (
                <div className="mb-3">
                  <div ref={googleBtnRef} className="w-full overflow-hidden" style={{ minHeight: 44 }} />
                </div>
              )}

              {/* Apple button */}
              {APPLE_CLIENT_ID && (
                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-colors mb-3 disabled:opacity-50"
                >
                  <svg viewBox="0 0 814 1000" className="w-4 h-4 fill-white shrink-0">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 637.2 0 490.4 0 256.8 136.3 131.8 256.6 131.8c63 0 113.1 41.5 159.2 41.5 43.8 0 112.3-44.2 186.5-44.2zm-14.9-155.3c18.1-21 50.9-69.8 50.9-117 0-3.8-.4-7.5-1.1-11.2-48.8 1.9-107.5 32.3-142.8 70.3-22 24-55 71.2-55 120.1 0 4.1.4 8.3 1.1 12.1 3.3.6 6.8 1 10.3 1 44.5 0 98.9-27.7 136.6-75.3z"/>
                  </svg>
                  Entrar com Apple
                </button>
              )}

              {/* Divisor */}
              {(GOOGLE_CLIENT_ID || APPLE_CLIENT_ID) && (
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-gray-400">ou continue com e-mail</span>
                  </div>
                </div>
              )}

              {/* Form e-mail cliente */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <input type="email" className="input" placeholder="seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Senha</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input pr-10"
                      placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>
                    : <><LogIn className="w-4 h-4" />Entrar</>}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                Nao tem conta?{' '}
                <Link href={`/auth/register?next=${encodeURIComponent(nextUrl)}`}
                  className="text-primary-600 hover:underline font-medium">
                  Cadastre-se gratis
                </Link>
              </p>
            </>
          )}

          {/* ── Aba profissional ── */}
          {tab === 'profissional' && (
            <>
              <p className="text-sm text-gray-500 mb-5 text-center">
                Acesso exclusivo para construtoras, imobiliarias e corretores parceiros.
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail corporativo</label>
                  <input type="email" className="input" placeholder="contato@construtora.com.br"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Senha</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input pr-10"
                      placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>
                    : <><LogIn className="w-4 h-4" />Entrar</>}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                Cadastrar minha construtora?{' '}
                <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
                  Criar conta profissional
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
