'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import Image from 'next/image';
import { Building2, User, ArrowLeft, LogIn } from 'lucide-react';

type Perfil = 'cliente' | 'construtora' | null;

interface FormCliente {
  nome: string;
  email: string;
  password: string;
}

interface FormConstrutora {
  nome: string;
  email: string;
  password: string;
  razao_social: string;
  cnpj: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil>(null);

  const clienteForm = useForm<FormCliente>();
  const construtoraForm = useForm<FormConstrutora>();

  const onSubmitCliente = async (data: FormCliente) => {
    try {
      const { data: res } = await authApi.register({ ...data, role: 'cliente' });
      const isHttps = window.location.protocol === 'https:';
      Cookies.set('token', res.access_token, { expires: 7, secure: isHttps, sameSite: 'lax' });
      toast.success('Conta criada! Bem-vindo.');
      router.push('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao criar conta.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const onSubmitConstrutora = async (data: FormConstrutora) => {
    try {
      const { data: res } = await authApi.register({ ...data, role: 'construtora' });
      const isHttps = window.location.protocol === 'https:';
      Cookies.set('token', res.access_token, { expires: 7, secure: isHttps, sameSite: 'lax' });
      toast.success('Conta criada! Bem-vindo.');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao criar conta.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/logo.png" alt="SóConstrutoras" width={36} height={48} className="object-contain" />
            <span className="font-bold text-xl text-gray-900">
              <span className="text-primary-600">SÓ</span>CONSTRUTORAS
            </span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            {perfil === null ? 'Criar uma conta' : perfil === 'cliente' ? 'Criar conta de cliente' : 'Cadastrar construtora'}
          </p>
        </div>

        {/* Etapa 1: Escolher perfil */}
        {perfil === null && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <p className="text-sm font-semibold text-gray-700 mb-4 text-center">O que melhor te descreve?</p>
            <div className="space-y-3">

              <button
                onClick={() => setPerfil('cliente')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Sou comprador / cliente</p>
                  <p className="text-xs text-gray-500 mt-0.5">Busco imóveis novos ou na planta</p>
                </div>
              </button>

              <button
                onClick={() => setPerfil('construtora')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Sou construtora / incorporadora</p>
                  <p className="text-xs text-gray-500 mt-0.5">Quero cadastrar e divulgar meus empreendimentos</p>
                </div>
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Já tem conta?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">Entrar</Link>
            </p>
          </div>
        )}

        {/* Etapa 2a: Formulário cliente */}
        {perfil === 'cliente' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <button
              onClick={() => setPerfil(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <form onSubmit={clienteForm.handleSubmit(onSubmitCliente)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nome</label>
                <input
                  {...clienteForm.register('nome', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">E-mail</label>
                <input
                  {...clienteForm.register('email', { required: true })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
                <input
                  {...clienteForm.register('password', { required: true, minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mínimo 8 caracteres"
                />
                {clienteForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{clienteForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={clienteForm.formState.isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60 mt-2"
              >
                <LogIn className="w-4 h-4" />
                {clienteForm.formState.isSubmitting ? 'Criando conta...' : 'Criar conta grátis'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Já tem conta?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">Entrar</Link>
            </p>
          </div>
        )}

        {/* Etapa 2b: Formulário construtora */}
        {perfil === 'construtora' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <button
              onClick={() => setPerfil(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <form onSubmit={construtoraForm.handleSubmit(onSubmitConstrutora)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nome do responsável</label>
                <input
                  {...construtoraForm.register('nome', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="João Silva"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Razão social</label>
                <input
                  {...construtoraForm.register('razao_social', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Construtora Exemplo LTDA"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">CNPJ</label>
                <input
                  {...construtoraForm.register('cnpj', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="00.000.000/0001-00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">E-mail corporativo</label>
                <input
                  {...construtoraForm.register('email', { required: true })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="contato@construtora.com.br"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
                <input
                  {...construtoraForm.register('password', { required: true, minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mínimo 8 caracteres"
                />
                {construtoraForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{construtoraForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={construtoraForm.formState.isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60 mt-2"
              >
                <Building2 className="w-4 h-4" />
                {construtoraForm.formState.isSubmitting ? 'Criando conta...' : 'Cadastrar construtora'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Já tem conta?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">Entrar</Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
