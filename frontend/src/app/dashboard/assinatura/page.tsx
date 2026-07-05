'use client';

import { useEffect, useState } from 'react';
import { billingApi } from '@/lib/api';

type Status = 'trial' | 'ativa' | 'suspensa' | 'cancelada';

interface Assinatura {
  plano: string;
  status: Status;
  periodo_fim: string | null;
  stripe_customer_id: string | null;
}

const STATUS_INFO: Record<Status, { label: string; cor: string; bg: string }> = {
  trial:     { label: 'Trial gratuito', cor: 'text-blue-700',  bg: 'bg-blue-50  border-blue-200'  },
  ativa:     { label: 'Ativa',          cor: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  suspensa:  { label: 'Suspensa',       cor: 'text-yellow-700',bg: 'bg-yellow-50 border-yellow-200'},
  cancelada: { label: 'Cancelada',      cor: 'text-red-700',   bg: 'bg-red-50   border-red-200'   },
};

const PLANO_NOMES: Record<string, string> = {
  starter:      'Starter',
  profissional: 'Profissional',
  enterprise:   'Enterprise',
};

const PLANO_PRECOS: Record<string, number> = {
  starter:      299,
  profissional: 599,
  enterprise:   1299,
};

export default function AssinaturaPage() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abrindoPortal, setAbrindoPortal] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    billingApi.status()
      .then(({ data }) => setAssinatura(data))
      .catch(() => setErro('Não foi possível carregar sua assinatura.'))
      .finally(() => setCarregando(false));
  }, []);

  async function abrirPortal() {
    try {
      setAbrindoPortal(true);
      const { data } = await billingApi.portal();
      window.location.href = data.portalUrl;
    } catch {
      setErro('Erro ao abrir portal de assinatura. Tente novamente.');
      setAbrindoPortal(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin w-8 h-8 text-[#22c55e]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!assinatura) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">{erro || 'Nenhuma assinatura encontrada.'}</p>
      </div>
    );
  }

  const statusInfo = STATUS_INFO[assinatura.status];
  const planoNome = PLANO_NOMES[assinatura.plano] ?? assinatura.plano;
  const preco = PLANO_PRECOS[assinatura.plano];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minha assinatura</h1>
        <p className="text-gray-500 mt-1 text-sm">Gerencie seu plano e formas de pagamento.</p>
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {/* Card do plano atual */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Plano atual</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{planoNome}</p>
            {preco && (
              <p className="text-sm text-gray-500 mt-0.5">
                R$ {preco.toLocaleString('pt-BR')}/mês
              </p>
            )}
          </div>

          {/* Badge de status */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.cor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              assinatura.status === 'ativa' ? 'bg-green-500' :
              assinatura.status === 'trial' ? 'bg-blue-500' :
              assinatura.status === 'suspensa' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            {statusInfo.label}
          </span>
        </div>

        {/* Detalhes */}
        <div className="px-6 py-5 space-y-4">
          {assinatura.periodo_fim && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {assinatura.status === 'trial' ? 'Trial válido até' :
                 assinatura.status === 'cancelada' ? 'Acesso até' : 'Próxima cobrança'}
              </span>
              <span className="font-medium text-gray-900">
                {new Date(assinatura.periodo_fim).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Alertas de status */}
          {assinatura.status === 'suspensa' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p className="font-semibold mb-1">Pagamento pendente</p>
              <p>Sua assinatura está suspensa por falta de pagamento. Atualize seu método de pagamento para reativar o acesso.</p>
            </div>
          )}
          {assinatura.status === 'cancelada' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <p className="font-semibold mb-1">Assinatura cancelada</p>
              <p>Você perderá o acesso ao final do período pago. Assine novamente para continuar.</p>
            </div>
          )}
          {assinatura.status === 'trial' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">Período trial</p>
              <p>Você está no período gratuito de 14 dias. Assine um plano para continuar após o trial.</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          {assinatura.stripe_customer_id ? (
            <button
              onClick={abrirPortal}
              disabled={abrindoPortal}
              className="flex-1 bg-[#22c55e] text-white py-2.5 px-5 rounded-xl text-sm font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {abrindoPortal ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Abrindo...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Gerenciar assinatura
                </>
              )}
            </button>
          ) : (
            <a
              href="/planos"
              className="flex-1 bg-[#22c55e] text-white py-2.5 px-5 rounded-xl text-sm font-semibold hover:bg-[#16a34a] transition-colors text-center"
            >
              Ver planos e assinar
            </a>
          )}

          <a
            href="/planos"
            className="flex-1 bg-white text-gray-700 py-2.5 px-5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-center"
          >
            Ver todos os planos
          </a>
        </div>
      </div>

      {/* Info sobre o portal Stripe */}
      {assinatura.stripe_customer_id && (
        <div className="flex items-start gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            O gerenciamento de pagamento é feito via <span className="font-medium text-gray-700">Stripe</span>.
            Ao clicar em "Gerenciar assinatura" você será redirecionado para o portal seguro do Stripe,
            onde pode atualizar cartão, baixar notas fiscais e cancelar o plano.
          </p>
        </div>
      )}
    </div>
  );
}
