'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  Home, Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const auth = () => ({ Authorization: `Bearer ${Cookies.get('token')}` });

interface ImovelUsado {
  id: string; titulo: string; tipo: string; bairro: string; cidade: string;
  quartos: number | null; vagas: number | null; area: number | null;
  preco: number | null; status: string; publicado: boolean; foto_capa: string | null;
}

const TIPOS = ['apartamento','casa','cobertura','terreno','comercial'];
const STATUS_OPT = ['disponivel','reservado','vendido'];
const DIST_OPTS = [
  { value: 'construtora', label: 'Direto para a construtora', desc: 'O contato vai para o e-mail da construtora' },
  { value: 'parceiros',   label: 'Distribuir para parceiros', desc: 'Segue as regras de distribuição configuradas' },
];
const EMPTY = {
  titulo:'', descricao:'', tipo:'apartamento', endereco:'', bairro:'',
  cidade:'Belo Horizonte', estado:'MG', cep:'', area:'', quartos:'',
  vagas:'', preco:'', status:'disponivel', distribuicao_leads:'construtora',
};

export default function ImoveisUsadosDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [imoveis, setImoveis] = useState<ImovelUsado[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [habilitado, setHabilitado] = useState<boolean | null>(null);
  const [limite, setLimite] = useState(0);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<ImovelUsado | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'construtora' && user.role !== 'admin'))) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const carregar = useCallback(async () => {
    setLoadingData(true);
    try {
      const [imRes, cfgRes] = await Promise.all([
        fetch(`${API}/imoveis-usados/meus`, { headers: auth() }),
        fetch(`${API}/construtoras/perfil`, { headers: auth() }),
      ]);
      const imData = await imRes.json();
      const cfgData = await cfgRes.json();
      setImoveis(Array.isArray(imData) ? imData : []);
      setHabilitado(cfgData?.imoveis_usados_habilitado ?? false);
      setLimite(cfgData?.imoveis_usados_limite ?? 0);
    } catch { toast.error('Erro ao carregar dados.'); }
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { if (user) carregar(); }, [user, carregar]);

  const abrirModal = (im?: ImovelUsado) => {
    if (im) {
      setEditando(im);
      setForm({ ...EMPTY, ...im, area: im.area?.toString() ?? '', quartos: im.quartos?.toString() ?? '', vagas: im.vagas?.toString() ?? '', preco: im.preco?.toString() ?? '', distribuicao_leads: (im as any).distribuicao_leads ?? 'construtora' });
    } else {
      setEditando(null);
      setForm({ ...EMPTY });
    }
    setModal(true);
  };

  const salvar = async () => {
    if (!form.titulo.trim()) { toast.error('Título obrigatório.'); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        area: form.area ? Number(form.area) : undefined,
        quartos: form.quartos ? Number(form.quartos) : undefined,
        vagas: form.vagas ? Number(form.vagas) : undefined,
        preco: form.preco ? Number(form.preco) : undefined,
      };
      const url = editando
        ? `${API}/imoveis-usados/${editando.id}`
        : `${API}/imoveis-usados`;
      const res = await fetch(url, {
        method: editando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      toast.success(editando ? 'Atualizado!' : 'Criado!');
      setModal(false);
      carregar();
    } catch (e: any) { toast.error(e.message ?? 'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const togglePublicar = async (im: ImovelUsado) => {
    const acao = im.publicado ? 'despublicar' : 'publicar';
    const res = await fetch(`${API}/imoveis-usados/${im.id}/${acao}`, {
      method: 'PATCH', headers: auth(),
    });
    if (res.ok) { toast.success(im.publicado ? 'Despublicado.' : 'Publicado!'); carregar(); }
  };

  const deletar = async (im: ImovelUsado) => {
    if (!confirm(`Excluir "${im.titulo}"?`)) return;
    const res = await fetch(`${API}/imoveis-usados/${im.id}`, { method: 'DELETE', headers: auth() });
    if (res.ok) { toast.success('Excluído.'); carregar(); }
  };

  const uploadFoto = async (im: ImovelUsado, file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    await fetch(`${API}/imoveis-usados/${im.id}/fotos`, { method: 'POST', headers: auth(), body: fd });
    setUploading(false); carregar(); toast.success('Foto enviada!');
  };

  const fmt = (v: number | null) =>
    v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '–';

  if (loading || loadingData) return (
    <div className="p-8 text-center text-gray-400">Carregando...</div>
  );

  if (!habilitado) return (
    <div className="p-8">
      <div className="card p-12 text-center max-w-lg mx-auto">
        <Home className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Módulo não habilitado</h2>
        <p className="text-gray-400 text-sm">
          O cadastro de imóveis usados (permuta) precisa ser habilitado pelo administrador do sistema.
          Entre em contato para solicitar o acesso.
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Imóveis Usados</h1>
          <p className="text-sm text-gray-500 mt-0.5">{imoveis.length}/{limite} cadastrados · permuta</p>
        </div>
        <button
          onClick={() => abrirModal()}
          disabled={imoveis.length >= limite}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Novo imóvel
        </button>
      </div>

      {/* Lista */}
      {imoveis.length === 0 ? (
        <div className="card p-12 text-center">
          <Home className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum imóvel cadastrado. Clique em "Novo imóvel" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {imoveis.map(im => (
            <div key={im.id} className="card p-4 flex gap-4 items-start">
              {/* Foto */}
              <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {im.foto_capa
                  ? <img src={im.foto_capa} alt={im.titulo} className="w-full h-full object-cover" />
                  : <Home className="w-6 h-6 text-gray-300 absolute inset-0 m-auto" />
                }
                <label className="absolute bottom-1 right-1 cursor-pointer" title="Enviar foto">
                  <Upload className="w-4 h-4 text-white bg-black/40 rounded p-0.5" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadFoto(im, e.target.files[0])} />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">{im.titulo}</h3>
                    <p className="text-sm text-gray-500">
                      {im.bairro ? `${im.bairro}, ` : ''}{im.cidade}
                      {im.quartos ? ` · ${im.quartos} qts` : ''}
                      {im.area ? ` · ${im.area}m²` : ''}
                      {im.preco ? ` · ${fmt(im.preco)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      im.status === 'disponivel' ? 'bg-green-100 text-green-700' :
                      im.status === 'reservado'  ? 'bg-yellow-100 text-yellow-700' :
                                                   'bg-gray-100 text-gray-500'
                    }`}>
                      {im.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      im.publicado ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {im.publicado ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => togglePublicar(im)} className="icon-btn" title={im.publicado ? 'Despublicar' : 'Publicar'}>
                  {im.publicado ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => abrirModal(im)} className="icon-btn" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deletar(im)} className="icon-btn text-red-400 hover:text-red-600" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de criar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editando ? 'Editar' : 'Novo'} Imóvel Usado</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Título *</label>
                <input className="input" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Apartamento 3 quartos Savassi" />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPT.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Bairro</label>
                <input className="input" value={form.bairro} onChange={e => setForm(p => ({ ...p, bairro: e.target.value }))} />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input className="input" value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} />
              </div>
              <div>
                <label className="label">Endereço</label>
                <input className="input" value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} />
              </div>
              <div>
                <label className="label">CEP</label>
                <input className="input" value={form.cep} onChange={e => setForm(p => ({ ...p, cep: e.target.value }))} />
              </div>
              <div>
                <label className="label">Área (m²)</label>
                <input className="input" type="number" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} />
              </div>
              <div>
                <label className="label">Quartos</label>
                <input className="input" type="number" value={form.quartos} onChange={e => setForm(p => ({ ...p, quartos: e.target.value }))} />
              </div>
              <div>
                <label className="label">Vagas</label>
                <input className="input" type="number" value={form.vagas} onChange={e => setForm(p => ({ ...p, vagas: e.target.value }))} />
              </div>
              <div>
                <label className="label">Preço (R$)</label>
                <input className="input" type="number" value={form.preco} onChange={e => setForm(p => ({ ...p, preco: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Descrição</label>
                <textarea className="input" rows={3} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
              </div>

              {/* Distribuição de leads */}
              <div className="col-span-2">
                <label className="label">Distribuição de leads</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {DIST_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, distribuicao_leads: opt.value }))}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        form.distribuicao_leads === opt.value
                          ? 'border-[#0E8F6E] bg-[#0E8F6E]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${form.distribuicao_leads === opt.value ? 'text-[#0E8F6E]' : 'text-gray-700'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={salvar} disabled={saving} className="btn-primary flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
