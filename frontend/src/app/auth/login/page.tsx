'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { Building2, LogIn } from 'lucide-react';

interface FormData { email: string; password: string; }

function getRedirect(role?: string) {
  if (role === 'cliente') return '/';
  if (role === 'parceiro') return '/dashboard/leads';
  return '/dashboard'; // construtora | admin
}

export default function LoginPage() {
  const { login, user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  // Redireciona se já autenticado (ex: voltar à página de login)
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.push(getRedirect(user.role));
    }
  }, [isAuthenticated, loading, user, router]);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Bem-vindo!');
      // useEffect redireciona quando user for setado pelo AuthProvider
    } catch {
      toast.error('E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-600 font-bold text-2xl">
            <Building2 className="w-7 h-7" />
            SóConstrutoras
          </Link>
          <p className="text-gray-500 text-sm mt-2">Acesse sua conta</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Não tem conta?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
