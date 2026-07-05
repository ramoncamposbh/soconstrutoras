import { notFound } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import FormularioLead from '@/components/empreendimentos/FormularioLead';
import SecaoLocalizacao from '@/components/mapa/SecaoLocalizacao';
import { MapPin, BedDouble, Car, Maximize2, Building2 } from 'lucide-react';
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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const emp = await getEmpreendimento(params.slug);
  if (!emp) return { title: 'Imóvel não encontrado' };
  return {
    title: `${emp.nome} — ${emp.cidade}/${emp.estado} | SóConstrutoras`,
    description: emp.descricao ?? `${emp.nome} em ${emp.cidade}. ${emp.tipo} a partir de ${formatCurrency(emp.preco_min)}.`,
  };
}

export default async function PaginaEmpreendimento({ params }: { params: { slug: string } }) {
  const emp = await getEmpreendimento(params.slug);
  if (!emp) notFound();

  const fotos = (emp.midias ?? []).filter((m: any) => m.tipo === 'foto');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Galeria */}
          <div className="card overflow-hidden">
            {fotos.length > 0 ? (
              <div className="relative h-56 sm:h-80 md:h-[480px]">
                <Image src={fotos[0].url} alt={emp.nome} fill className="object-cover" />
              </div>
            ) : (
              <div className="h-56 sm:h-80 md:h-[480px] bg-gray-100 flex items-center justify-center text-gray-300">
                <Building2 className="w-20 h-20" />
              </div>
            )}
            {fotos.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto">
                {fotos.slice(1, 5).map((f: any) => (
                  <div key={f.id} className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden">
                    <Image src={f.url} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dados principais */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">{emp.construtora}</p>
                <h1 className="text-2xl font-bold text-gray-900">{emp.nome}</h1>
                <p className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {emp.bairro ? `${emp.bairro}, ` : ''}{emp.cidade} — {emp.estado}
                </p>
              </div>
              <div className="text-right">
                {emp.preco_min && (
                  <>
                    <p className="text-xs text-gray-400">A partir de</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(emp.preco_min)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Características */}
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
            </div>

            {/* Descrição */}
            {emp.descricao && (
              <div className="border-t border-gray-100 pt-4">
                <h2 className="font-semibold mb-2">Sobre o empreendimento</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {emp.descricao}
                </p>
              </div>
            )}
          </div>

          {/* Seção de localização — sempre visível; mapa aparece quando há coordenadas */}
          <SecaoLocalizacao
            latitude={emp.latitude}
            longitude={emp.longitude}
            endereco={emp.endereco}
            bairro={emp.bairro}
            cidade={emp.cidade}
            estado={emp.estado}
            cep={emp.cep}
          />
        </div>

        {/* Sidebar — formulário de lead */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <FormularioLead empreendimentoId={emp.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
