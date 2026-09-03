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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
        {assinatura.stripe_customer_id ? (
          <button
            onClick={abrirPortal}
            disabled={abrindoPortal}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {abrindoPortal ? 'Abrindo...' : 'Gerenciar assinatura'}
          </button>
        ) : (
          <a href="/planos" className="btn-primary">Ver planos</a>
        )}
      </div>

      <div className="max-w-2xl space-y-6">

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

      </div>

      {/* Info sobre o portal Stripe */}
      {assinatura.stripe_customer_id && (
        <div className="flex items-start gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            O gerenciamento é feito via <span className="font-medium text-gray-700">Stripe</span> — portal seguro para atualizar cartão, baixar notas fiscais e cancelar o plano.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
