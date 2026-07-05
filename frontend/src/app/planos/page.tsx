'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { billingApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const planos = [
  {
    id: 'starter' as const,
    nome: 'Starter',
    preco: 299,
    descricao: 'Ideal para construtoras que estão começando',
    limites: {
      empreendimentos: 3,
      parceiros: 2,
      fotos: 20,
    },
    recursos: [
      '3 empreendimentos ativos',
      'Até 2 parceiros por empreendimento',
      '20 fotos por empreendimento',
      'Distribuição sequencial de leads',
      'Notificações por e-mail',
      'Suporte via chat',
    ],
    destaque: false,
  },
  {
    id: 'profissional' as const,
    nome: 'Profissional',
    preco: 599,
    descricao: 'Para construtoras em crescimento',
    limites: {
      empreendimentos: 10,
      parceiros: 3,
      fotos: 50,
    },
    recursos: [
      '10 empreendimentos ativos',
      'Até 3 parceiros por empreendimento',
      '50 fotos por empreendimento',
      'Distribuição sequencial e percentual',
      'Notificações por e-mail',
      'Dashboard com métricas de leads',
      'Suporte prioritário',
    ],
    destaque: true,
  },
  {
    id: 'enterprise' as const,
    nome: 'Enterprise',
    preco: 1299,
    descricao: 'Solução completa para grandes construtoras',
    limites: {
      empreendimentos: 999,
      parceiros: 3,
      fotos: 200,
    },
    recursos: [
      'Empreendimentos ilimitados',
      'Até 3 parceiros por empreendimento',
      '200 fotos por empreendimento',
      'Distribuição sequencial e percentual',
      'Notificações por e-mail e WhatsApp',
      'Dashboard avançado com analytics',
      'API de integração',
      'Gerente de conta dedicado',
    ],
    destaque: false,
  },
];

export default function PlanosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  async function assinar(planoId: 'starter' | 'profissional' | 'enterprise') {
    if (!user) {
      router.push('/auth/login?redirect=/planos');
      return;
    }

    try {
      setLoading(planoId);
      setErro('');
      const { data } = await billingApi.checkout(planoId);
      window.location.href = data.checkoutUrl; // redireciona ao Stripe Checkout
    } catch (e: any) {
      setErro(e.response?.data?.message ?? 'Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-[#4361ee]">SóConstrutoras</a>
          <div className="flex items-center gap-4">
            {user ? (
              <a href="/dashboard" className="text-sm text-gray-600 hover:text-[#4361ee]">
                Dashboard
              </a>
            ) : (
              <>
                <a href="/auth/login" className="text-sm text-gray-600 hover:text-[#4361ee]">
                  Entrar
                </a>
                <a
                  href="/auth/register"
                  className="text-sm bg-[#4361ee] text-white px-4 py-2 rounded-lg hover:bg-[#3451d1] transition-colors"
                >
                  Criar conta
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Planos para construtoras
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Anuncie seus empreendimentos, gerencie parceiros e distribua leads de forma inteligente.
          Sem taxas de sucesso — apenas mensalidade fixa.
        </p>

        {/* Trial badge */}
        <div className="mt-6 inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-full px-4 py-2 text-sm font-medium">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          14 dias grátis em qualquer plano — sem cartão de crédito
        </div>
      </div>

      {/* Erro global */}
      {erro && (
        <div className="max-w-md mx-auto px-4 mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm text-center">
            {erro}
          </div>
        </div>
      )}

      {/* Cards de planos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 flex flex-col ${
                plano.destaque
                  ? 'border-[#4361ee] shadow-lg shadow-[#4361ee]/10'
                  : 'border-gray-200'
              }`}
            >
              {/* Badge "Mais popular" */}
              {plano.destaque && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-[#4361ee] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div className="p-8 flex-1">
                <h2 className="text-xl font-bold text-gray-900">{plano.nome}</h2>
                <p className="text-sm text-gray-500 mt-1">{plano.descricao}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-sm text-gray-500">R$</span>
                  <span className="text-5xl font-extrabold text-gray-900">
                    {plano.preco.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-gray-500">/mês</span>
                </div>

                {/* Limites */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#4361ee]">
                      {plano.limites.empreendimentos === 999 ? '∞' : plano.limites.empreendimentos}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">empreendimentos</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#4361ee]">{plano.limites.parceiros}</div>
                    <div className="text-xs text-gray-500 mt-1">parceiros</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#4361ee]">{plano.limites.fotos}</div>
                    <div className="text-xs text-gray-500 mt-1">fotos/emp.</div>
                  </div>
                </div>

                {/* Recursos */}
                <ul className="mt-8 space-y-3">
                  {plano.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-3 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="p-8 pt-0">
                <button
                  onClick={() => assinar(plano.id)}
                  disabled={loading !== null}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                    plano.destaque
                      ? 'bg-[#4361ee] text-white hover:bg-[#3451d1] shadow-md shadow-[#4361ee]/30'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plano.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Aguarde...
                    </span>
                  ) : (
                    'Começar grátis por 14 dias'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ rápido */}
        <div className="mt-20 max-w-2xl mx-auto text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-8">Perguntas frequentes</h3>
          <div className="text-left space-y-6">
            {[
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim. Você pode cancelar pelo portal de assinatura a qualquer momento, sem multa.',
              },
              {
                q: 'O que acontece depois do trial?',
                a: 'Após 14 dias, você é cobrado automaticamente pelo plano escolhido. Você pode cancelar antes disso sem nenhum custo.',
              },
              {
                q: 'Posso trocar de plano?',
                a: 'Sim, você pode fazer upgrade ou downgrade a qualquer momento pelo painel de assinatura.',
              },
              {
                q: 'Os parceiros também pagam?',
                a: 'Não. Os parceiros (imobiliárias e corretores) acessam a plataforma gratuitamente. Apenas as construtoras pagam.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-200 pb-6">
                <p className="font-semibold text-gray-900">{q}</p>
                <p className="text-gray-600 mt-2 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
