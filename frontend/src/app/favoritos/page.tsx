'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, BedDouble, Car, Maximize2, Trash2, ChevronRight } from 'lucide-react';
import { useFavoritos, removerFavorito } from '@/lib/favoritos';
import { formatCurrency } from '@/lib/utils';

const G = '#0E8F6E';

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  lancamento: { label: 'Lançamento', bg: '#0E8F6E', text: '#fff' },
  em_obras:   { label: 'Em obras',   bg: '#F59E0B', text: '#78350F' },
  pronto:     { label: 'Pronto',     bg: '#059669', text: '#fff' },
  suspenso:   { label: 'Suspenso',   bg: '#6B7280', text: '#fff' },
};

export default function FavoritosPage() {
  const favoritos = useFavoritos();

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
        padding: '20px 0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ color: '#6B7280', textDecoration: 'none', fontSize: 14 }}>
              Início
            </Link>
            <span style={{ color: '#D1D5DB' }}>/</span>
            <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>Meus Favoritos</span>
          </div>

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={20} fill="#EF4444" color="#EF4444" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
                Meus Favoritos
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                {favoritos.length === 0
                  ? 'Nenhum imóvel salvo ainda'
                  : `${favoritos.length} imóvel${favoritos.length > 1 ? 'is' : ''} salvo${favoritos.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        {favoritos.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: '#fff', borderRadius: 20,
            border: '1.5px dashed #E5E7EB',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Heart size={32} color="#FCA5A5" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Nenhum imóvel salvo
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
              Clique no ícone de coração nos cards dos empreendimentos para salvar seus favoritos aqui.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: G, color: '#fff',
                padding: '12px 24px', borderRadius: 12,
                textDecoration: 'none', fontWeight: 700, fontSize: 14,
              }}
            >
              Explorar imóveis <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {favoritos.map((emp) => {
              const s = STATUS_LABEL[emp.status] ?? STATUS_LABEL.lancamento;

              const suitesLabel = emp.quartos_min
                ? emp.quartos_min === emp.quartos_max
                  ? `${emp.quartos_min} suítes`
                  : `${emp.quartos_min}–${emp.quartos_max} suítes`
                : null;

              const vagasLabel = emp.vagas != null ? `${emp.vagas} vagas` : null;

              const areaLabel = emp.area_min
                ? emp.area_max && emp.area_max !== emp.area_min
                  ? `${emp.area_min}–${emp.area_max} m²`
                  : `${emp.area_min} m²`
                : null;

              return (
                <div
                  key={emp.id}
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: '1.5px solid #E5E7EB',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Imagem */}
                  <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                    {emp.foto_capa ? (
                      <Image
                        src={emp.foto_capa}
                        alt={emp.nome}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width={48} height={48} fill="none" stroke="#D1D5DB" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}

                    {/* Status */}
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: s.bg, color: s.text,
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 6,
                    }}>
                      {s.label}
                    </span>

                    {/* Remover favorito */}
                    <button
                      onClick={() => removerFavorito(emp.id)}
                      title="Remover dos favoritos"
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.92)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      }}
                    >
                      <Heart size={15} fill="#EF4444" color="#EF4444" />
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <div style={{ padding: '14px' }}>
                    <h3 style={{
                      fontSize: 14, fontWeight: 700, color: '#111827',
                      marginBottom: 4, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {emp.nome}
                    </h3>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: '#9CA3AF', marginBottom: 10,
                    }}>
                      <MapPin size={10} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {emp.cidade} — {emp.estado}
                      </span>
                    </div>

                    {/* Specs */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 0,
                      fontSize: 11, color: '#6B7280', marginBottom: 12, flexWrap: 'wrap',
                    }}>
                      {suitesLabel && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <BedDouble size={10} /> {suitesLabel}
                        </span>
                      )}
                      {vagasLabel && suitesLabel && <span style={{ margin: '0 6px', color: '#D1D5DB' }}>|</span>}
                      {vagasLabel && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Car size={10} /> {vagasLabel}
                        </span>
                      )}
                      {areaLabel && (vagasLabel || suitesLabel) && <span style={{ margin: '0 6px', color: '#D1D5DB' }}>|</span>}
                      {areaLabel && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Maximize2 size={10} /> {areaLabel}
                        </span>
                      )}
                    </div>

                    {/* Preço + botão */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        {emp.preco_min ? (
                          <>
                            <div style={{ fontSize: 9.5, color: '#9CA3AF', fontWeight: 500 }}>A partir de</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0A6A52' }}>
                              {formatCurrency(emp.preco_min)}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Consulte o valor</div>
                        )}
                      </div>

                      <Link
                        href={`/imoveis/${emp.slug}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11.5, fontWeight: 700, color: G,
                          padding: '6px 12px', borderRadius: 8,
                          border: `1.5px solid #E5E7EB`,
                          textDecoration: 'none',
                        }}
                      >
                        Ver detalhes <ChevronRight size={12} />
                      </Link>
                    </div>

                    {/* Remover link */}
                    <button
                      onClick={() => removerFavorito(emp.id)}
                      style={{
                        marginTop: 12, width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 12, color: '#9CA3AF',
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '6px 0',
                        borderTop: '1px solid #F3F4F6',
                      }}
                    >
                      <Trash2 size={12} /> Remover dos favoritos
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {favoritos.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 14, fontWeight: 600, color: G,
                textDecoration: 'none',
              }}
            >
              ← Continuar explorando imóveis
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
