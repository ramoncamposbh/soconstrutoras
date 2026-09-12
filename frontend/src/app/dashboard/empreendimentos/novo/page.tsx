'use client';

import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { empreendimentosApi } from '@/lib/api';
import { TIPOS_IMOVEL, STATUS_OBRA, ESTADOS_BR } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

// ── Características do CONDOMÍNIO (áreas comuns)
const ITENS_CONDOMINIO = [
  'Academia de ginástica', 'Adega', 'Aquecimento solar', 'Área verde preservada',
  'Auditório', 'Automação residencial', 'Bicicletário', 'Brinquedoteca',
  'Câmeras de segurança', 'Campo de futebol gramado', 'Campo de Golfe',
  'Cerca elétrica', 'Churrasqueira', 'Cinema', 'Condomínio fechado', 'Coworking',
  'Elevador de serviço', 'Elevador social', 'Espaço Gourmet', 'Espaço mulher',
  'Espaço Pet', 'Espelho d\'água', 'Fechadura Biométrica', 'Fonte decorativa',
  'Gerador elétrico', 'Gramado', 'Home Office', 'Interfone', 'Jacuzzi', 'Lago',
  'Lan house', 'Lanchonete', 'Lavanderia', 'Locker', 'Massagem', 'Mercadinho',
  'Permite animais', 'Piscina adulto', 'Piscina aquecida', 'Piscina coberta',
  'Piscina infantil', 'Pista de caminhada', 'Pista de cooper', 'Playground',
  'Ponto para carregamento elétrico', 'Port Cochere', 'Portão Elétrico',
  'Portaria 24 horas', 'Portaria Virtual', 'Porteiro Diurno', 'Porteiro eletrônico',
  'Porteiro noturno', 'Quadra de areia', 'Quadra de tênis', 'Quadra poliesportiva',
  'Recarga de carros elétricos', 'Ronda motorizada', 'Sala de jogos',
  'Salão de festas', 'Salão de festas infantil', 'Sauna', 'Solarium', 'Vinoteca',
];

// ── Características do IMÓVEL (apartamento/unidade)
const ITENS_IMOVEL = [
  'Academia', 'Acessibilidade', 'Adega', 'Aquecimento a gás', 'Aquecimento central',
  'Aquecimento solar', 'Ar condicionado', 'Ar condicionado central',
  'Ar condicionado na Suíte', 'Área esportiva', 'Armário na cozinha', 'Banheira',
  'Biblioteca', 'Cabeamento estruturado', 'Calefação', 'Circuito de segurança',
  'Closet', 'Cozinha americana', 'Cozinha gourmet', 'Cozinha independente',
  'Deck Molhado', 'Depósito', 'Energia solar', 'Espaço Gourmet', 'Espaço Pet',
  'Espaço verde', 'Fechadura digital', 'Forro de gesso', 'Forro de madeira',
  'Forro de PVC', 'Forro rebaixado', 'Gás central', 'Gás individual',
  'Gerador elétrico', 'Hidromassagem', 'Hidrômetro individual', 'Home office',
  'Infraestrutura p/ ar-condicionado', 'Interfone', 'Internet', 'Isolamento acústico',
  'Lareira', 'Lavanderia', 'Mezanino', 'Portaria', 'Ronda/Vigilância',
  'Rua asfaltada', 'Sala de TV', 'Sauna', 'Sistema de alarme', 'SPA',
  'Terraço privativo', 'Tomadas USB', 'Varanda', 'Varanda Gourmet', 'Vigia',
  'Vista exterior', 'Vista para a montanha', 'Vista para o lago', 'Zelador',
];

// ── PROXIMIDADES (estabelecimentos próximos)
const ITENS_PROXIMIDADES = [
  'Banco', 'Escola', 'Escola de idioma', 'Faculdade', 'Farmácia', 'Hospital',
  'Igreja', 'Padaria', 'Praça', 'Rodovia', 'Shopping', 'Supermercado',
  'Transporte público',
];

export default function NovoEmpreendimentoPage() {
  const router = useRouter();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      itens_condominio: [] as string[],
      itens_imovel:     [] as string[],
      proximidades:     [] as string[],
    },
  });

  const condSel: string[]  = watch('itens_condominio') ?? [];
  const imovelSel: string[]= watch('itens_imovel')     ?? [];
  const proxSel: string[]  = watch('proximidades')      ?? [];

  const toggle = (field: 'itens_condominio'|'itens_imovel'|'proximidades', item: string) => {
    const cur: string[] = watch(field) ?? [];
    setValue(field, cur.includes(item) ? cur.filter(i => i !== item) : [...cur, item], { shouldDirty: true });
  };

  const onSubmit = async (data: any) => {
    try {
      await empreendimentosApi.criar(data);
      toast.success('Empreendimento criado!');
      router.push('/dashboard/empreendimentos');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao criar empreendimento.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/empreendimentos" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo empreendimento</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Informações básicas */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informações básicas</h2>

          <div>
            <label className="label">Nome do empreendimento *</label>
            <input {...register('nome', { required: 'Obrigatório' })} className="input" placeholder="Ex: Residencial Aurora" />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{String(errors.nome.message)}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo *</label>
              <select {...register('tipo', { required: true })} className="input">
                {TIPOS_IMOVEL.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status da obra *</label>
              <select {...register('status')} className="input">
                {STATUS_OBRA.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea {...register('descricao')} className="input resize-none" rows={4}
              placeholder="Descreva os diferenciais do empreendimento..." />
          </div>
        </div>

        {/* Localização */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Localização</h2>

          <div>
            <label className="label">Endereço</label>
            <input {...register('endereco')} className="input" placeholder="Rua, número" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bairro</label>
              <input {...register('bairro')} className="input" />
            </div>
            <div>
              <label className="label">CEP</label>
              <input {...register('cep')} className="input" placeholder="00000-000" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Cidade *</label>
              <input {...register('cidade', { required: 'Obrigatório' })} className="input" />
              {errors.cidade && <p className="text-red-500 text-xs mt-1">{String(errors.cidade.message)}</p>}
            </div>
            <div>
              <label className="label">Estado *</label>
              <select {...register('estado', { required: true })} className="input">
                <option value="">UF</option>
                {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Características */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Características</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Preço mínimo (R$)</label>
              <input {...register('preco_min', { valueAsNumber: true })} type="number" className="input" placeholder="350000" />
            </div>
            <div>
              <label className="label">Preço máximo (R$)</label>
              <input {...register('preco_max', { valueAsNumber: true })} type="number" className="input" placeholder="600000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Área mínima (m²)</label>
              <input {...register('area_min', { valueAsNumber: true })} type="number" className="input" placeholder="50" />
            </div>
            <div>
              <label className="label">Área máxima (m²)</label>
              <input {...register('area_max', { valueAsNumber: true })} type="number" className="input" placeholder="120" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Quartos (mín)</label>
              <input {...register('quartos_min', { valueAsNumber: true })} type="number" className="input" min={0} />
            </div>
            <div>
              <label className="label">Quartos (máx)</label>
              <input {...register('quartos_max', { valueAsNumber: true })} type="number" className="input" min={0} />
            </div>
            <div>
              <label className="label">Vagas</label>
              <input {...register('vagas', { valueAsNumber: true })} type="number" className="input" min={0} />
            </div>
          </div>
        </div>

        {/* Itens do condomínio */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Características do condomínio</h2>
            <p className="text-xs text-gray-400 mt-0.5">Áreas comuns e infraestrutura do empreendimento</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ITENS_CONDOMINIO.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={condSel.includes(item)}
                  onChange={() => toggle('itens_condominio', item)}
                  className="w-4 h-4 rounded accent-primary-500" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Itens do imóvel */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Características do imóvel</h2>
            <p className="text-xs text-gray-400 mt-0.5">Diferenciais internos da unidade/apartamento</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ITENS_IMOVEL.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={imovelSel.includes(item)}
                  onChange={() => toggle('itens_imovel', item)}
                  className="w-4 h-4 rounded accent-primary-500" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Proximidades */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Proximidades</h2>
            <p className="text-xs text-gray-400 mt-0.5">Estabelecimentos próximos ao empreendimento</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ITENS_PROXIMIDADES.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={proxSel.includes(item)}
                  onChange={() => toggle('proximidades', item)}
                  className="w-4 h-4 rounded accent-primary-500" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/empreendimentos" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Salvando...' : 'Salvar empreendimento'}
          </button>
        </div>
      </form>
    </div>
  );
}
