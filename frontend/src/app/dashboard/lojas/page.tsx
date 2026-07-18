'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, X, Loader2, Pencil, Trash2, Upload,
  ImageIcon, Tag, ExternalLink, MessageCircle, Check,
} from 'lucide-react';

interface Categoria { id: string; nome: string; icone?: string; ordem: number; }
interface Loja {
  id: string; nome: string; slug: string; descricao?: string;
  logo_url?: string; site_url?: string; whatsapp?: string;
  codigo_desconto?: string; descricao_desconto?: string;
  categoria_id: string; categoria_nome: string; ativo: boolean;
}
interface Midia { id: string; url: string; legenda?: string; ordem: number; }

export default function DashboardLojasPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [modalCat, setModalCat] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', icone: '', ordem: 0 });

  const [modalLoja, setModalLoja] = useState(false);
  const [lojaEditando, setLojaEditando] = useState<Loja | null>(null);
  const [form, setForm] = useState({
    categoria_id: '', nome: '', descricao: '', site_url: '',
    whatsapp: '', codigo_desconto: '', descricao_desconto: '',
  });

  // Gerenciamento de fotos
  const [lojaFotos, setLojaFotos] = useState<Loja | null>(null);
  const [midias, setMidias] = useState<Midia[]>([]);
  const [loadingMidias, setLoadingMidias] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') router.push('/dashboard');
  }, [authLoading, user, router]);

  const carregar = async () => {
    setLoading(true);
    try {
      const [catRes, lojasRes] = await Promise.all([
        api.get('/lojas/categorias'),
        api.get('/lojas/admin/todas'),
      ]);
      setCategorias(catRes.data);
      setLojas(lojasRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.role === 'admin') carregar(); }, [user]);

  // ── Categorias ─────────────────────────────────────────────────────────────
  const salvarCategoria = async () => {
    if (!novaCategoria.nome.trim()) return toast.error('Informe o nome da categoria.');
    try {
      await api.post('/lojas/categorias', novaCategoria);
      toast.success('Categoria criada!');
      setModalCat(false);
      setNovaCategoria({ nome: '', icone: '', ordem: 0 });
      carregar();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao criar categoria.');
    }
  };

  const excluirCategoria = async (id: string) => {
    if (!confirm('Remover categoria?')) return;
    try {
      await api.delete(`/lojas/categorias/${id}`);
      toast.success('Categoria removida.');
      carregar();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro.');
    }
  };

  // ── Lojas ──────────────────────────────────────────────────────────────────
  const abrirNovaLoja = () => {
    setLojaEditando(null);
    setForm({ categoria_id: categorias[0]?.id ?? '', nome: '', descricao: '', site_url: '', whatsapp: '', codigo_desconto: '', descricao_desconto: '' });
    setModalLoja(true);
  };

  const abrirEditar = (l: Loja) => {
    setLojaEditando(l);
    setForm({
      categoria_id: l.categoria_id, nome: l.nome, descricao: l.descricao ?? '',
      site_url: l.site_url ?? '', whatsapp: l.whatsapp ?? '',
      codigo_desconto: l.codigo_desconto ?? '', descricao_desconto: l.descricao_desconto ?? '',
    });
    setModalLoja(true);
  };

  const salvarLoja = async () => {
    if (!form.nome.trim()) return toast.error('Informe o nome.');
    if (!form.categoria_id) return toast.error('Selecione a categoria.');
    try {
      if (lojaEditando) {
        await api.patch(`/lojas/${lojaEditando.id}`, form);
        toast.success('Parceiro atualizado!');
      } else {
        await api.post('/lojas', form);
        toast.success('Parceiro criado!');
      }
      setModalLoja(false);
      carregar();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro.');
    }
  };

  const excluirLoja = async (id: string) => {
    if (!confirm('Remover este parceiro?')) return;
    try {
      await api.delete(`/lojas/${id}`);
      toast.success('Parceiro removido.');
      carregar();
    } catch { toast.error('Erro ao remover.'); }
  };

  // ── Upload logo ────────────────────────────────────────────────────────────
  const handleLogo = async (lojaId: string, file: File) => {
    setUploadingLogo(lojaId);
    const fd = new FormData(); fd.append('file', file);
    try {
      await api.post(`/lojas/${lojaId}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Logo atualizada!');
      carregar();
    } catch { toast.error('Erro no upload.'); }
    finally { setUploadingLogo(null); }
  };

  // ── Fotos da loja ──────────────────────────────────────────────────────────
  const abrirFotos = async (loja: Loja) => {
    setLojaFotos(loja);
    setLoadingMidias(true);
    try {
      const r = await api.get(`/lojas/${loja.slug}`);
      setMidias(r.data.midias);
    } finally { setLoadingMidias(false); }
  };

  const handleUploadFoto = async (file: File) => {
    if (!lojaFotos) return;
    if (midias.length >= 20) return toast.error('Limite de 20 fotos atingido.');
    setUploadingFoto(lojaFotos.id);
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await api.post(`/lojas/${lojaFotos.id}/midias`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMidias((prev) => [...prev, r.data]);
      toast.success('Foto adicionada!');
    } catch { toast.error('Erro no upload.'); }
    finally { setUploadingFoto(null); }
  };

  const removerFoto = async (midiaId: string) => {
    if (!lojaFotos) return;
    try {
      await api.delete(`/lojas/${lojaFotos.id}/midias/${midiaId}`);
      setMidias((prev) => prev.filter((m) => m.id !== midiaId));
      toast.success('Foto removida.');
    } catch { toast.error('Erro.'); }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parceiros / Lojas</h1>
        <div className="flex gap-2">
          <button onClick={() => setModalCat(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Categoria
          </button>
          <button onClick={abrirNovaLoja} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova loja
          </button>
        </div>
      </div>

      {/* Categorias */}
      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3 text-sm">Categorias</h2>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
              {c.nome}
              <button onClick={() => excluirCategoria(c.id)} className="text-gray-400 hover:text-red-500 ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de lojas */}
      {lojas.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma loja cadastrada ainda.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {lojas.map((l) => (
            <div key={l.id} className="flex items-center gap-4 p-4">
              {/* Logo */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 flex items-center justify-center">
                {l.logo_url ? (
                  <Image src={l.logo_url} alt={l.nome} fill className="object-contain p-1" />
                ) : (
                  <span className="text-xl font-bold text-gray-300">{l.nome[0]}</span>
                )}
                {uploadingLogo === l.id && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{l.nome}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {l.categoria_nome}
                  </span>
                  {!l.ativo && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">inativo</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {l.codigo_desconto && (
                    <span className="text-xs text-primary-600 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {l.codigo_desconto}
                    </span>
                  )}
                  {l.site_url && (
                    <a href={l.site_url} target="_blank" rel="noreferrer"
                       className="text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> site
                    </a>
                  )}
                  {l.whatsapp && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {l.whatsapp}
                    </span>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Upload logo */}
                <label className="cursor-pointer p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Logo">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogo(l.id, f); e.target.value = ''; }} />
                </label>
                {/* Fotos */}
                <button onClick={() => abrirFotos(l)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Fotos">
                  <ImageIcon className="w-4 h-4" />
                </button>
                {/* Editar */}
                <button onClick={() => abrirEditar(l)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                {/* Remover */}
                <button onClick={() => excluirLoja(l.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Nova categoria ──────────────────────────────────────────── */}
      {modalCat && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Nova categoria</h3>
              <button onClick={() => setModalCat(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={novaCategoria.nome}
                  onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value })}
                  placeholder="Ex: Móveis e Decoração" />
              </div>
              <div>
                <label className="label">Ordem</label>
                <input type="number" className="input" value={novaCategoria.ordem}
                  onChange={(e) => setNovaCategoria({ ...novaCategoria, ordem: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalCat(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvarCategoria} className="btn-primary flex-1">Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Criar/Editar loja ──────────────────────────────────────── */}
      {modalLoja && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">
                {lojaEditando ? 'Editar parceiro' : 'Novo parceiro'}
              </h3>
              <button onClick={() => setModalLoja(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Categoria *</label>
                  <select className="input" value={form.categoria_id}
                    onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
                    <option value="">Selecione</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nome *</label>
                  <input className="input" value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da empresa" />
                </div>
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea className="input resize-none" rows={3} value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Breve descrição da empresa e seus produtos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Site</label>
                  <input className="input" value={form.site_url}
                    onChange={(e) => setForm({ ...form, site_url: e.target.value })}
                    placeholder="https://empresa.com.br" />
                </div>
                <div>
                  <label className="label">WhatsApp</label>
                  <input className="input" value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="5531999990000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código de desconto</label>
                  <input className="input font-mono" value={form.codigo_desconto}
                    onChange={(e) => setForm({ ...form, codigo_desconto: e.target.value })}
                    placeholder="SOCONSTRUTORAS10" />
                </div>
                <div>
                  <label className="label">Descrição do desconto</label>
                  <input className="input" value={form.descricao_desconto}
                    onChange={(e) => setForm({ ...form, descricao_desconto: e.target.value })}
                    placeholder="10% em toda a loja" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalLoja(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvarLoja} className="btn-primary flex-1">
                {lojaEditando ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Fotos da loja ──────────────────────────────────────────── */}
      {lojaFotos && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">
                Fotos — {lojaFotos.nome}
                <span className="ml-2 text-sm font-normal text-gray-400">{midias.length}/20</span>
              </h3>
              <button onClick={() => setLojaFotos(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {loadingMidias ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {midias.map((m) => (
                    <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                      <Image src={m.url} alt="" fill className="object-cover" />
                      <button
                        onClick={() => removerFoto(m.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {midias.length < 20 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 flex flex-col items-center justify-center cursor-pointer gap-1 text-gray-400 hover:text-primary-500 transition-colors">
                      {uploadingFoto === lojaFotos.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span className="text-xs">Adicionar</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFoto(f); e.target.value = ''; }} />
                    </label>
                  )}
                </div>

                <button onClick={() => setLojaFotos(null)} className="btn-secondary w-full">Fechar</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
