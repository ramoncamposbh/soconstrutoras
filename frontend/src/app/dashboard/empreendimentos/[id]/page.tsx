'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { empreendimentosApi, midiasApi, unidadesApi } from '@/lib/api';
import type { Empreendimento, Midia, Unidade, TipoUnidade } from '@/types';
import { TIPOS_IMOVEL, STATUS_OBRA, ESTADOS_BR, formatCurrency } from '@/lib/utils';
import UploadFotos from '@/components/empreendimentos/UploadFotos';
import VincularParceiro from '@/components/parceiros/VincularParceiro';
import CampoGeocode from '@/components/mapa/CampoGeocode';
import FormUnidade from '@/components/unidades/FormUnidade';
import {
  ArrowLeft, Save, Eye, Loader2,
  Image as ImageIcon, Users, Settings,
  LayoutGrid, Plus, Home, Building2, Leaf, Layers, Square, Store,
  BedDouble, Car, Maximize2, BadgeCheck, BadgeX, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'dados' | 'fotos' | 'parceiros' | 'unidades';

const TIPO_ICON: Record<string, React.ElementType> = {
  apartamento: Home, cobertura: Building2, garden: Leaf,
  duplex: Layers, studio: Square, comercial: Store,
};
const TIPO_COR: Record<string, string> = {
  apartamento: 'bg-blue-50 text-blue-700',
  cobertura:   'bg-purple-50 text-purple-700',
  garden:      'bg-green-50 text-green-700',
  duplex:      'bg-orange-50 text-orange-700',
  studio:      'bg-yellow-50 text-yellow-700',
  comercial:   'bg-gray-100 text-gray-700',
};

export default function EditarEmpreendimentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [empreendimento, setEmpreendimento] = useState<Empreendimento | null>(null);
  const [midias, setMidias] = useState<Midia[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [limiteUnidades, setLimiteUnidades] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('dados');
  const [formUnidade, setFormUnidade] = useState<{ open: boolean; unidade?: Unidade | null }>({ open: false });

  const { register, handleSubmit, reset, setValue, getValues, formState: { isSubmitting, isDirty } } = useForm();

  useEffect(() => {
    Promise.all([
      empreendimentosApi.listar(),
      midiasApi.listar(id),
      unidadesApi.listar(id).catch(() => ({ data: [] })),
    ]).then(([emps, mds, uns]) => {
      const emp = emps.data.find((e: Empreendimento) => e.id === id);
      if (!emp) { router.push('/dashboard/empreendimentos'); return; }
      setEmpreendimento(emp);
      reset(emp);
      setMidias(mds.data);
      setUnidades(uns.data ?? []);
    }).finally(() => setLoading(false));
  }, [id, reset, router]);

  const CAMPOS_PERMITIDOS = [
    'nome','descricao','tipo','status',
    'endereco','bairro','cidade','estado','cep',
    'latitude','longitude',
    'preco_min','preco_max','area_min','area_max',
    'quartos_min','quartos_max','vagas',
  ];

  const salvar = async (data: any) => {
    try {
      // Filtra apenas campos do DTO (forbidNonWhitelisted rejeita campos extras como id, slug, etc.)
      const payload = Object.fromEntries(
        Object.entries(data)
          .filter(([k]) => CAMPOS_PERMITIDOS.includes(k))
          .filter(([, v]) => !(typeof v === 'number' && isNaN(v as number))),
      );
      await empreendimentosApi.atualizar(id, payload);
      toast.success('Salvo com sucesso!');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar.'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!empreendimento) return null;

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'dados',     label: 'Dados',     icon: Settings },
    { key: 'fotos',     label: 'Fotos',     icon: ImageIcon,  badge: midias.length || undefined },
    { key: 'unidades',  label: 'Unidades',  icon: LayoutGrid, badge: unidades.length || undefined },
    { key: 'parceiros', label: 'Parceiros', icon: Users },
  ];

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/empreendimentos" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{empreendimento.nome}</h1>
            <p className="text-sm text-gray-500">{empreendimento.cidade} — {empreendimento.estado}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {empreendimento.publicado && (
            <Link href={`/imoveis/${empreendimento.slug}`} target="_blank"
              className="btn-secondary flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4" /> Ver publicado
            </Link>
          )}
          {tab === 'dados' && (
            <button
              form="form-dados"
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar alterações
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === key
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge ? (
              <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Aba: Dados */}
      {tab === 'dados' && (
        <form id="form-dados" onSubmit={handleSubmit(salvar)} className="space-y-6 max-w-2xl">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Informações básicas</h2>

            <div>
              <label className="label">Nome</label>
              <input {...register('nome')} className="input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo</label>
                <select {...register('tipo')} className="input">
                  {TIPOS_IMOVEL.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status da obra</label>
                <select {...register('status')} className="input">
                  {STATUS_OBRA.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Descrição</label>
              <textarea {...register('descricao')} className="input resize-none" rows={4} />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Localização</h2>

            <div>
              <label className="label">Endereço</label>
              <input {...register('endereco')} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Bairro</label><input {...register('bairro')} className="input" /></div>
              <div><label className="label">CEP</label><input {...register('cep')} className="input" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2"><label className="label">Cidade</label><input {...register('cidade')} className="input" /></div>
              <div>
                <label className="label">Estado</label>
                <select {...register('estado')} className="input">
                  {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            {/* Campos ocultos para lat/lng — gerenciados pelo CampoGeocode via setValue */}
            <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
            <input type="hidden" {...register('longitude', { valueAsNumber: true })} />

            {/* Geocode — monta o endereço completo para Nominatim */}
            <CampoGeocode
              latitude={getValues('latitude')}
              longitude={getValues('longitude')}
              enderecoCompleto={[
                getValues('endereco'),
                getValues('bairro'),
                getValues('cidade'),
                getValues('estado'),
                'Brasil',
              ].filter(Boolean).join(', ')}
              onChange={(lat, lng) => {
                setValue('latitude', lat, { shouldDirty: true });
                setValue('longitude', lng, { shouldDirty: true });
              }}
            />
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Características e preços</h2>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Preço mínimo (R$)</label><input {...register('preco_min', { valueAsNumber: true })} type="number" className="input" /></div>
              <div><label className="label">Preço máximo (R$)</label><input {...register('preco_max', { valueAsNumber: true })} type="number" className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Área mínima (m²)</label><input {...register('area_min', { valueAsNumber: true })} type="number" className="input" /></div>
              <div><label className="label">Área máxima (m²)</label><input {...register('area_max', { valueAsNumber: true })} type="number" className="input" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="label">Quartos mín.</label><input {...register('quartos_min', { valueAsNumber: true })} type="number" min={0} className="input" /></div>
              <div><label className="label">Quartos máx.</label><input {...register('quartos_max', { valueAsNumber: true })} type="number" min={0} className="input" /></div>
              <div><label className="label">Vagas</label><input {...register('vagas', { valueAsNumber: true })} type="number" min={0} className="input" /></div>
            </div>
          </div>
        </form>
      )}

      {/* Aba: Fotos */}
      {tab === 'fotos' && (
        <div className="max-w-2xl">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Fotos do empreendimento</h2>
            <UploadFotos
              empreendimentoId={id}
              midias={midias}
              onChange={setMidias}
            />
          </div>
        </div>
      )}

      {/* ══ Aba: Unidades ══ */}
      {tab === 'unidades' && (
        <div className="max-w-3xl">
          {/* Cabeçalho da aba */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">
                {unidades.length} de {limiteUnidades} unidades cadastradas
              </p>
              <div className="mt-1 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${Math.min(100, (unidades.length / limiteUnidades) * 100)}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setFormUnidade({ open: true, unidade: null })}
              disabled={unidades.length >= limiteUnidades}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Nova unidade
            </button>
          </div>

          {/* Lista de unidades */}
          {unidades.length === 0 ? (
            <div className="card p-12 text-center">
              <LayoutGrid className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma unidade cadastrada ainda.</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">
                Adicione os tipos disponíveis neste empreendimento.
              </p>
              <button
                onClick={() => setFormUnidade({ open: true, unidade: null })}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar primeira unidade
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {unidades.map((u) => {
                const Icon = TIPO_ICON[u.tipo] ?? Home;
                const cor  = TIPO_COR[u.tipo]  ?? 'bg-gray-100 text-gray-600';
                const foto = u.midias?.[0]?.url;
                return (
                  <div
                    key={u.id}
                    onClick={() => setFormUnidade({ open: true, unidade: u })}
                    className="card p-4 flex items-center gap-4 hover:shadow-md hover:ring-1 hover:ring-primary-200 cursor-pointer transition-all"
                  >
                    {/* Thumb da unidade */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {foto ? (
                        <img src={foto} alt={u.nome ?? u.tipo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`}>
                          {u.tipo.charAt(0).toUpperCase() + u.tipo.slice(1)}
                        </span>
                        {u.disponivel ? (
                          <span className="text-xs text-green-600 flex items-center gap-0.5">
                            <BadgeCheck className="w-3 h-3" /> Disponível
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <BadgeX className="w-3 h-3" /> Indisponível
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {u.nome || `${u.tipo.charAt(0).toUpperCase() + u.tipo.slice(1)} — sem nome`}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {u.metragem_privativa && (
                          <span className="flex items-center gap-0.5">
                            <Maximize2 className="w-3 h-3" /> {u.metragem_privativa} m²
                          </span>
                        )}
                        {u.quartos > 0 && (
                          <span className="flex items-center gap-0.5">
                            <BedDouble className="w-3 h-3" /> {u.quartos} qtos
                          </span>
                        )}
                        {u.vagas > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Car className="w-3 h-3" /> {u.vagas} vagas
                          </span>
                        )}
                        {u.midias?.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <ImageIcon className="w-3 h-3" /> {u.midias.length} foto{u.midias.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preço + seta */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {u.preco && (
                        <p className="text-sm font-semibold text-primary-700">
                          {formatCurrency(u.preco)}
                        </p>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ Aba: Parceiros ══ */}
      {tab === 'parceiros' && (
        <div className="max-w-xl">
          <div className="card p-6">
            <p className="text-sm text-gray-500 mb-4">Gerencie os parceiros que recebem leads deste empreendimento.</p>
            <VincularParceiro empreendimentoId={id} />
          </div>
        </div>
      )}
      {/* ══ Drawer: FormUnidade ══ */}
      {formUnidade.open && (
        <FormUnidade
          empreendimentoId={id}
          unidade={formUnidade.unidade}
          limiteAtingido={unidades.length >= limiteUnidades}
          onSave={(u) => {
            setUnidades((prev) => {
              const idx = prev.findIndex((x) => x.id === u.id);
              return idx >= 0
                ? prev.map((x) => x.id === u.id ? u : x)
                : [...prev, u];
            });
            setFormUnidade({ open: false });
          }}
          onDelete={(deletedId) => {
            setUnidades((prev) => prev.filter((x) => x.id !== deletedId));
            setFormUnidade({ open: false });
          }}
          onClose={() => setFormUnidade({ open: false })}
        />
      )}
    </div>
  );
}
