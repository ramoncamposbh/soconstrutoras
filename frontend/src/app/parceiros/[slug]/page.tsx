'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Loader2, ExternalLink, Copy, Check, MessageCircle, ChevronLeft, Tag } from 'lucide-react';
import api from '@/lib/api';

interface Midia { id: string; url: string; legenda?: string; ordem: number; }
interface Loja {
  id: string; nome: string; slug: string; descricao?: string;
  logo_url?: string; site_url?: string; whatsapp?: string;
  codigo_desconto?: string; descricao_desconto?: string;
  categoria_nome: string; midias: Midia[];
}

export default function ParceiroDetalhe() {
  const params = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!params?.slug) return;
    api.get(`/lojas/${params.slug}`)
      .then((r) => setLoja(r.data))
      .finally(() => setLoading(false));
  }, [params?.slug]);

  const copiarCodigo = () => {
    if (!loja?.codigo_desconto) return;
    navigator.clipboard.writeText(loja.codigo_desconto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const whatsappUrl = loja?.whatsapp
    ? `https://wa.me/${loja.whatsapp.replace(/\D/g, '')}`
    : null;

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </>
    );
  }

  if (!loja) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Parceiro não encontrado.
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <Link
          href="/parceiros"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Parceiros
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Coluna esquerda: logo + galeria */}
          <div>
            {/* Foto principal */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3">
              {loja.midias.length > 0 ? (
                <Image
                  src={loja.midias[fotoAtiva]?.url}
                  alt={loja.nome}
                  fill
                  className="object-cover"
                />
              ) : loja.logo_url ? (
                <Image
                  src={loja.logo_url}
                  alt={loja.nome}
                  fill
                  className="object-contain p-8"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-gray-200">{loja.nome[0]}</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {loja.midias.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {loja.midias.slice(0, 10).map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setFotoAtiva(i)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      fotoAtiva === i ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <Image src={m.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna direita: informações */}
          <div>
            {/* Logo pequena + nome */}
            <div className="flex items-center gap-3 mb-4">
              {loja.logo_url && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                  <Image src={loja.logo_url} alt={loja.nome} fill className="object-contain p-1" />
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">
                  {loja.categoria_nome}
                </span>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{loja.nome}</h1>
              </div>
            </div>

            {/* Descrição */}
            {loja.descricao && (
              <p className="text-gray-600 mb-6 leading-relaxed">{loja.descricao}</p>
            )}

            {/* Código de desconto */}
            {loja.codigo_desconto && (
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-semibold text-primary-700">
                    Seu código exclusivo
                  </span>
                </div>
                {loja.descricao_desconto && (
                  <p className="text-sm text-primary-700 mb-3">{loja.descricao_desconto}</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border-2 border-dashed border-primary-300 rounded-xl px-4 py-3 font-mono font-bold text-lg text-primary-700 tracking-widest text-center">
                    {loja.codigo_desconto}
                  </div>
                  <button
                    onClick={copiarCodigo}
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors shrink-0"
                  >
                    {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              {loja.site_url && (
                <a
                  href={loja.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-3 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visitar site
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-3 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Galeria completa */}
        {loja.midias.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Produtos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {loja.midias.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => { setFotoAtiva(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                >
                  <Image src={m.url} alt={m.legenda ?? ''} fill className="object-cover" />
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
