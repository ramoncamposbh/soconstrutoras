'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import { Loader2, ExternalLink, Tag } from 'lucide-react';
import api from '@/lib/api';

interface Loja {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
  primeira_midia?: string;
  codigo_desconto?: string;
  descricao_desconto?: string;
  categoria_nome: string;
  categoria_icone?: string;
}

interface Categoria {
  nome: string;
  icone?: string;
  lojas: Loja[];
}

export default function ParceirosPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lojas').then((res) => {
      const lojas: Loja[] = res.data;
      // Agrupar por categoria
      const mapa: Record<string, Categoria> = {};
      for (const l of lojas) {
        if (!mapa[l.categoria_nome]) {
          mapa[l.categoria_nome] = { nome: l.categoria_nome, icone: l.categoria_icone, lojas: [] };
        }
        mapa[l.categoria_nome].lojas.push(l);
      }
      setCategorias(Object.values(mapa));
    }).finally(() => setLoading(false));
  }, []);

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

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Parceiros <span className="text-primary-600">Exclusivos</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Descontos e benefícios especiais para quem compra com a SóConstrutoras.
          </p>
        </div>

        {categorias.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum parceiro cadastrado ainda.</p>
          </div>
        ) : (
          categorias.map((cat) => (
            <section key={cat.nome} className="mb-12">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary-500 rounded-full inline-block" />
                {cat.nome}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cat.lojas.map((loja) => (
                  <Link
                    key={loja.id}
                    href={`/parceiros/${loja.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all overflow-hidden flex flex-col"
                  >
                    {/* Imagem ou logo */}
                    <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {loja.logo_url ? (
                        <Image
                          src={loja.logo_url}
                          alt={loja.nome}
                          fill
                          className="object-contain p-4"
                        />
                      ) : loja.primeira_midia ? (
                        <Image
                          src={loja.primeira_midia}
                          alt={loja.nome}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary-600">
                            {loja.nome[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                        {loja.nome}
                      </p>
                      {loja.codigo_desconto && (
                        <span className="mt-auto pt-2 inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
                          <Tag className="w-3 h-3" />
                          {loja.codigo_desconto}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  );
}
