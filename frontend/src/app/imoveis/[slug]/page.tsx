import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import FormularioLead from '@/components/empreendimentos/FormularioLead';
import SecaoLocalizacao from '@/components/mapa/SecaoLocalizacao';
import SecaoUnidadesGated from '@/components/unidades/SecaoUnidadesGated';
import GaleriaEmpreendimento from '@/components/empreendimentos/GaleriaEmpreendimento';
import { MapPin, BedDouble, Car, Maximize2, ArrowRight } from 'lucide-react';
import BotaoPrevisaoEntrega from '@/components/empreendimentos/BotaoPrevisaoEntrega';
import { formatCurrency } from '@/lib/utils';

async function getEmpreendimento(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/empreendimentos/${slug}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getUnidades(empreendimentoId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/unidades/empreendimentos/${empreendimentoId}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const emp = await getEmpreendimento(params.slug);
  if (!emp) return { title: 'Imovel nao encontrado' };
  return {
    title: `${emp.nome} — ${emp.cidade}/${emp.estado} | SoConstrutoras`,
    description: emp.descricao ?? `${emp.nome} em ${emp.cidade}. ${emp.tipo} a partir de ${formatCurrency(emp.preco_min)}.`,
  };
}

export default async function PaginaEmpreendimento({ params }: { params: { slug: string } }) {
  const emp = await getEmpreendimento(params.slug);
  if (!emp) notFound();

  const unidades = await getUnidades(emp.id);

  const precosUnidades = unidades.filter((u: any) => u.preco).map((u: any) => Number(u.preco));
  const precoMinUnidades = precosUnidades.length > 0 ? Math.min(...precosUnidades) : null;
  const precoMaxUnidades = precosUnidades.length > 0 ? Math.max(...precosUnidades) : null;
  const temFaixa = precoMinUnidades && precoMaxUnidades && precoMinUnidades !== precoMaxUnidades;
  const precoExibir = precoMinUnidades ?? emp.preco_min;

  const fotos = (emp.midias ?? []).filter((m: any) => m.tipo === 'foto');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Galeria com lightbox */}
          <div className="card overflow-hidden">
            <GaleriaEmpreendimento fotos={fotos} nome={emp.nome} />
          </div>

          {/* Dados principais */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-500">{emp.construtora}</p>
                  {emp.status && (() => {
                    const STATUS: Record<string, { label: string; bg: string; color: string }> = {
                      lancamento: { label: 'Lançamento', bg: '#DCFCE7', color: '#15803D' },
                      em_obras:   { label: 'Em obras',   bg: '#FEF9C3', color: '#A16207' },
                      pronto:     { label: 'Pronto',     bg: '#D1FAE5', color: '#065F46' },
                      suspenso:   { label: 'Suspenso',   bg: '#F3F4F6', color: '#6B7280' },
                    };
                    const s = STATUS[emp.status] ?? STATUS.lancamento;
                    return (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    );
                  })()}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{emp.nome}</h1>
                {/* Apenas bairro e cidade - endereco completo bloqueado */}
                <p className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {emp.bairro ? `${emp.bairro}, ` : ''}{emp.cidade} — {emp.estado}
                </p>
              </div>

              {/* Faixa de preco */}
              <div className="text-right flex-shrink-0 ml-4">
                {temFaixa ? (
                  <>
                    <p className="text-xs text-gray-400 mb-1">Faixa de preco</p>
                    <p className="text-xs text-gray-500 mb-0.5">De</p>
                    <p className="text-xl font-bold text-primary-600 leading-tight">
                      {formatCurrency(precoMinUnidades!)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 mb-0.5">ate</p>
                    <p className="text-xl font-bold text-primary-600 leading-tight">
                      {formatCurrency(precoMaxUnidades!)}
                    </p>
                  </>
                ) : precoExibir ? (
                  <>
                    <p className="text-xs text-gray-400">A partir de</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(precoExibir)}
                    </p>
                  </>
                ) : null}
              </div>
            </div>

            {/* Caracteristicas + previsão de entrega na mesma linha */}
            <div className="flex flex-wrap gap-6 py-4 border-t border-gray-100">
              {emp.quartos_min && (
                <div className="flex items-center gap-2 text-sm">
                  <BedDouble className="w-5 h-5 text-primary-500" />
                  <span className="font-medium">
                    {emp.quartos_min === emp.quartos_max
                      ? `${emp.quartos_min} quartos`
                      : `${emp.quartos_min} a ${emp.quartos_max} quartos`}
                  </span>
                </div>
              )}
              {emp.area_min && (
                <div className="flex items-center gap-2 text-sm">
                  <Maximize2 className="w-5 h-5 text-primary-500" />
                  <span className="font-medium">{emp.area_min}–{emp.area_max} m²</span>
                </div>
              )}
              {emp.vagas != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Car className="w-5 h-5 text-primary-500" />
                  <span className="font-medium">{emp.vagas} vaga{emp.vagas !== 1 ? 's' : ''}</span>
                </div>
              )}
              {emp.previsao_entrega && (
                <BotaoPrevisaoEntrega previsaoEntrega={emp.previsao_entrega} slug={emp.slug} />
              )}
            </div>

            {/* Botao de unidades */}
            {unidades.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <SecaoUnidadesGated unidades={unidades} nomeEmpreendimento={emp.nome} />
              </div>
            )}

            {/* Descricao */}
            {emp.descricao && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h2 className="font-semibold mb-2">Sobre o empreendimento</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {emp.descricao}
                </p>
              </div>
            )}
          </div>

          {/* Localizacao — sem endereco completo, bloqueado */}
          <SecaoLocalizacao
            latitude={emp.latitude}
            longitude={emp.longitude}
            bairro={emp.bairro}
            cidade={emp.cidade}
            estado={emp.estado}
            cep={emp.cep}
          />
        </div>

        {/* Sidebar — formulario de lead */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <FormularioLead empreendimentoId={emp.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
