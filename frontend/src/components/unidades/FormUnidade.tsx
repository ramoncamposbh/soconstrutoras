'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { unidadesApi } from '@/lib/api';
import type { Unidade, UnidadeMidia, TipoUnidade } from '@/types';
import {
  X, Trash2, Plus, Upload, Loader2, Check,
  Home, Building2, Leaf, Layers, Square, Store,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// ── Tipos de unidade ────────────────────────────────────────────────
const TIPOS_UNIDADE: { value: TipoUnidade; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'apartamento', label: 'Apartamento', icon: Home,      desc: 'Unidade padrão' },
  { value: 'cobertura',   label: 'Cobertura',   icon: Building2, desc: 'Último andar' },
  { value: 'garden',      label: 'Garden',      icon: Leaf,      desc: 'Área privativa externa' },
  { value: 'duplex',      label: 'Duplex',      icon: Layers,    desc: 'Dois pavimentos' },
  { value: 'studio',      label: 'Studio',      icon: Square,    desc: 'Espaço integrado' },
  { value: 'comercial',   label: 'Comercial',   icon: Store,     desc: 'Sala / loja' },
];

// ── Props ────────────────────────────────────────────────────────────
interface Props {
  empreendimentoId: string;
  unidade?: Unidade | null;   // null = novo
  limiteAtingido?: boolean;
  onSave: (u: Unidade) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function FormUnidade({
  empreendimentoId, unidade, limiteAtingido, onSave, onDelete, onClose,
}: Props) {
  const isNovo = !unidade;
  const [tab, setTab] = useState<'info' | 'fotos'>('info');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [tipo, setTipo]     = useState<TipoUnidade>(unidade?.tipo ?? 'apartamento');
  const [nome, setNome]     = useState(unidade?.nome ?? '');
  const [mprivativa, setMp] = useState(unidade?.metragem_privativa?.toString() ?? '');
  const [mtotal, setMt]     = useState(unidade?.metragem_total?.toString() ?? '');
  const [quartos, setQ]     = useState(unidade?.quartos?.toString() ?? '0');
  const [suites, setSu]     = useState(unidade?.suites?.toString() ?? '0');
  const [vagas, setVg]      = useState(unidade?.vagas?.toString() ?? '0');
  const [preco, setPr]      = useState(unidade?.preco?.toString() ?? '');
  const [descricao, setDsc] = useState(unidade?.descricao ?? '');
  const [disponivel, setDis] = useState(unidade?.disponivel ?? true);
  const [midias, setMidias] = useState<UnidadeMidia[]>(unidade?.midias ?? []);

  // ── Salvar ──────────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!tipo) return toast.error('Selecione o tipo.');
    setSaving(true);
    const payload = {
      tipo,
      nome: nome || undefined,
      metragem_privativa: mprivativa ? parseFloat(mprivativa) : undefined,
      metragem_total:     mtotal     ? parseFloat(mtotal)     : undefined,
      quartos:   parseInt(quartos)   || 0,
      suites:    parseInt(suites)    || 0,
      vagas:     parseInt(vagas)     || 0,
      preco:     preco ? parseFloat(preco) : undefined,
      descricao: descricao || undefined,
      disponivel,
    };
    try {
      let u: Unidade;
      if (isNovo) {
        const { data } = await unidadesApi.criar(empreendimentoId, payload);
        u = { ...data, midias };
      } else {
        const { data } = await unidadesApi.atualizar(unidade!.id, payload);
        u = { ...data, midias };
      }
      toast.success(isNovo ? 'Unidade criada!' : 'Unidade atualizada!');
      onSave(u);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  // ── Excluir ─────────────────────────────────────────────────────
  const handleExcluir = async () => {
    if (!unidade || !onDelete) return;
    if (!confirm('Excluir esta unidade e todas as suas fotos?')) return;
    setDeleting(true);
    try {
      await unidadesApi.remover(unidade.id);
      toast.success('Unidade removida.');
      onDelete(unidade.id);
    } catch {
      toast.error('Erro ao excluir.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Upload de foto ───────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Para unidade nova, precisamos salvar primeiro
    let unidadeId = unidade?.id;
    if (!unidadeId) {
      setSaving(true);
      try {
        const payload = { tipo, nome: nome || undefined, quartos: parseInt(quartos) || 0,
          suites: parseInt(suites) || 0, vagas: parseInt(vagas) || 0,
          metragem_privativa: mprivativa ? parseFloat(mprivativa) : undefined,
          metragem_total: mtotal ? parseFloat(mtotal) : undefined,
          preco: preco ? parseFloat(preco) : undefined, disponivel };
        const { data } = await unidadesApi.criar(empreendimentoId, payload);
        unidadeId = data.id;
        onSave({ ...data, midias: [] }); // atualiza lista com novo id
      } catch {
        toast.error('Salve a unidade antes de adicionar fotos.');
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    for (let i = 0; i < files.length; i++) {
      setUploadingIdx(i);
      try {
        const { data } = await unidadesApi.uploadFoto(unidadeId!, files[i]);
        setMidias((prev) => [...prev, data]);
      } catch {
        toast.error(`Erro ao enviar ${files[i].name}`);
      }
    }
    setUploadingIdx(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemoverFoto = async (midia: UnidadeMidia) => {
    if (!unidade) return;
    try {
      await unidadesApi.removerFoto(unidade.id, midia.id);
      setMidias((prev) => prev.filter((m) => m.id !== midia.id));
    } catch {
      toast.error('Erro ao remover foto.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-base">
              {isNovo ? 'Nova Unidade' : (unidade?.nome || `Unidade — ${TIPOS_UNIDADE.find(t => t.value === tipo)?.label}`)}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isNovo ? 'Preencha as informações da unidade' : `ID: ${unidade?.id.slice(0, 8)}…`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {(['info', 'fotos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'info' ? 'Informações' : `Fotos ${midias.length > 0 ? `(${midias.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── ABA: INFORMAÇÕES ── */}
          {tab === 'info' && (
            <>
              {/* Seletor de tipo */}
              <div>
                <label className="label mb-2">Tipo da unidade</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS_UNIDADE.map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTipo(value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                        tipo === value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${tipo === value ? 'text-primary-500' : 'text-gray-400'}`} />
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="label">Nome / Tipologia <span className="text-gray-400">(opcional)</span></label>
                <input
                  className="input"
                  placeholder="ex: Tipo A, Cobertura Norte..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              {/* Metragens */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Área privativa (m²)</label>
                  <input className="input" type="number" min="0" step="0.01"
                    value={mprivativa} onChange={(e) => setMp(e.target.value)} />
                </div>
                <div>
                  <label className="label">Área total (m²)</label>
                  <input className="input" type="number" min="0" step="0.01"
                    value={mtotal} onChange={(e) => setMt(e.target.value)} />
                </div>
              </div>

              {/* Dormitórios */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Quartos</label>
                  <input className="input" type="number" min="0"
                    value={quartos} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div>
                  <label className="label">Suítes</label>
                  <input className="input" type="number" min="0"
                    value={suites} onChange={(e) => setSu(e.target.value)} />
                </div>
                <div>
                  <label className="label">Vagas</label>
                  <input className="input" type="number" min="0"
                    value={vagas} onChange={(e) => setVg(e.target.value)} />
                </div>
              </div>

              {/* Preço */}
              <div>
                <label className="label">Preço (R$)</label>
                <input className="input" type="number" min="0" step="1000"
                  placeholder="0"
                  value={preco} onChange={(e) => setPr(e.target.value)} />
                {preco && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatCurrency(parseFloat(preco))}
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="label">Descrição <span className="text-gray-400">(opcional)</span></label>
                <textarea
                  className="input resize-none" rows={3}
                  placeholder="Destaques desta tipologia..."
                  value={descricao} onChange={(e) => setDsc(e.target.value)}
                />
              </div>

              {/* Disponível */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">Disponível para venda</p>
                  <p className="text-xs text-gray-400">Clientes poderão ver esta unidade</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDis(!disponivel)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${disponivel ? 'bg-primary-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${disponivel ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </>
          )}

          {/* ── ABA: FOTOS ── */}
          {tab === 'fotos' && (
            <>
              <p className="text-sm text-gray-500">
                Adicione fotos, plantas e renders desta unidade. Essas imagens são exibidas separadamente das fotos do empreendimento.
              </p>

              {/* Botão de upload */}
              <input
                ref={fileRef} type="file" multiple accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingIdx !== null}
                className="w-full border-2 border-dashed border-primary-200 rounded-xl py-5 flex flex-col items-center gap-2 text-primary-600 hover:bg-primary-50 transition-colors"
              >
                {uploadingIdx !== null ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
                <span className="text-sm font-medium">
                  {uploadingIdx !== null ? 'Enviando...' : 'Selecionar fotos'}
                </span>
                <span className="text-xs text-gray-400">JPG, PNG, WEBP — até 20 MB</span>
              </button>

              {/* Grid de fotos */}
              {midias.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {midias.map((m) => (
                    <div key={m.id} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100">
                      <img src={m.url} alt={m.legenda ?? ''} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => handleRemoverFoto(m)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {m.legenda && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                          <p className="text-white text-xs truncate">{m.legenda}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {midias.length === 0 && uploadingIdx === null && (
                <p className="text-center text-sm text-gray-400 py-4">Nenhuma foto adicionada ainda.</p>
              )}
            </>
          )}
        </div>

        {/* Footer com ações */}
        <div className="border-t border-gray-100 p-4 flex gap-3">
          {!isNovo && onDelete && (
            <button
              onClick={handleExcluir}
              disabled={deleting}
              className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-1.5 text-sm"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Excluir
            </button>
          )}
          <button onClick={onClose} className="btn-secondary text-sm flex-1">Cancelar</button>
          <button
            onClick={handleSalvar}
            disabled={saving || (isNovo && !!limiteAtingido)}
            className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isNovo ? 'Criar unidade' : 'Salvar'}
          </button>
        </div>

        {isNovo && limiteAtingido && (
          <p className="text-xs text-red-500 text-center pb-3">
            Limite do plano atingido. Faça upgrade para adicionar mais unidades.
          </p>
        )}
      </div>
    </>
  );
}
