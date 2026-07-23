import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Só redireciona para login se for o endpoint de verificação do token
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const url: string = err.config?.url ?? '';
      if (url.includes('/auth/me') || url.includes('/auth/perfil')) {
        Cookies.remove('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;

export const authApi = {
  login:          (data: { email: string; password: string }) => api.post('/auth/login', data),
  register:       (data: any) => api.post('/auth/register', data),
  me:             () => api.get('/auth/me'),
  loginComGoogle: (credential: string) =>
    api.post('/auth/google/token', { credential }),
  loginComApple:  (idToken: string, user?: any) =>
    api.post('/auth/apple/token', { id_token: idToken, user }),
};

export const construtoraApi = {
  perfil:    () => api.get('/construtoras/perfil'),
  dashboard: () => api.get('/construtoras/dashboard'),
  atualizar: (data: any) => api.patch('/construtoras/perfil', data),
};

export const empreendimentosApi = {
  listar:        () => api.get('/empreendimentos/meus/listar'),
  buscarPublico: (params: any) => api.get('/empreendimentos', { params }),
  buscarSlug:    (slug: string) => api.get(`/empreendimentos/${slug}`),
  buscarPorId:   (id: string) => api.get(`/empreendimentos/meus/listar`).then(r =>
    ({ data: r.data.find((e: any) => e.id === id) })),
  criar:         (data: any) => api.post('/empreendimentos', data),
  atualizar:     (id: string, data: any) => api.patch(`/empreendimentos/${id}`, data),
  publicar:      (id: string) => api.patch(`/empreendimentos/${id}/publicar`),
  remover:       (id: string) => api.delete(`/empreendimentos/${id}`),
};

export const parceirosApi = {
  listar:                 () => api.get('/parceiros'),
  adicionar:              (data: any) => api.post('/parceiros', data),
  vincular:               (empreendimentoId: string, data: any) =>
    api.post(`/parceiros/empreendimentos/${empreendimentoId}/vincular`, data),
  listarDoEmpreendimento: (empreendimentoId: string) =>
    api.get(`/parceiros/empreendimentos/${empreendimentoId}`),
  removerVinculo: (empreendimentoId: string, parceiroId: string) =>
    api.delete(`/parceiros/empreendimentos/${empreendimentoId}/${parceiroId}`),
};

export const leadsApi = {
  capturar:          (empreendimentoId: string, data: any) =>
    api.post(`/leads/empreendimentos/${empreendimentoId}`, data),
  meus:              (params?: any) => api.get('/leads/meus', { params }),
  resumoPorParceiro: (empreendimentoId: string) =>
    api.get(`/leads/resumo/${empreendimentoId}`),
};

export const billingApi = {
  checkout: (plano: 'starter' | 'profissional' | 'enterprise') =>
    api.post<{ checkoutUrl: string }>('/billing/checkout', { plano }),
  portal: () => api.post<{ portalUrl: string }>('/billing/portal'),
  status: () => api.get('/billing/status'),
};

export const unidadesApi = {
  listar:  (empreendimentoId: string) =>
    api.get(`/unidades/empreendimentos/${empreendimentoId}`),
  criar:   (empreendimentoId: string, data: any) =>
    api.post(`/unidades/empreendimentos/${empreendimentoId}`, data),
  atualizar: (id: string, data: any) =>
    api.patch(`/unidades/${id}`, data),
  remover:   (id: string) =>
    api.delete(`/unidades/${id}`),
  uploadFoto: async (unidadeId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/unidades/${unidadeId}/midias/upload-proxy`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  reordenarFotos: (unidadeId: string, ordens: { id: string; ordem: number }[]) =>
    api.post(`/unidades/${unidadeId}/midias/reordenar`, { ordens }),
  removerFoto: (unidadeId: string, midiaId: string) =>
    api.delete(`/unidades/${unidadeId}/midias/${midiaId}`),
  listarPublico: (empreendimentoId: string) =>
    api.get(`/public/unidades/empreendimentos/${empreendimentoId}`),
};

export const midiasApi = {
  listar: (empreendimentoId: string) =>
    api.get(`/empreendimentos/${empreendimentoId}/midias`),
  gerarUrlUpload: (empreendimentoId: string, tipo: string, contentType: string) =>
    api.post(`/empreendimentos/${empreendimentoId}/midias/url-upload`, { tipo, contentType }),
  confirmar: (empreendimentoId: string, url: string, tipo: string, legenda?: string) =>
    api.post(`/empreendimentos/${empreendimentoId}/midias/confirmar`, { url, tipo, legenda }),
  reordenar: (empreendimentoId: string, ordens: { id: string; ordem: number }[]) =>
    api.post(`/empreendimentos/${empreendimentoId}/midias/reordenar`, { ordens }),
  remover: (empreendimentoId: string, midiaId: string) =>
    api.delete(`/empreendimentos/${empreendimentoId}/midias/${midiaId}`),
};

export const favoritosApi = {
  listar:     () => api.get('/favoritos'),
  listarIds:  () => api.get<string[]>('/favoritos/ids'),
  adicionar:  (empreendimentoId: string) => api.post(`/favoritos/${empreendimentoId}`, {}),
  remover:    (empreendimentoId: string) => api.delete(`/favoritos/${empreendimentoId}`),
};

export const lojasApi = {
  listarPublico:   () => api.get('/lojas'),
  categorias:      () => api.get('/lojas/categorias'),
  buscarPorSlug:   (slug: string) => api.get(`/lojas/${slug}`),
  listarAdmin:     () => api.get('/lojas/admin/todas'),
  criar:           (dto: any) => api.post('/lojas', dto),
  atualizar:       (id: string, dto: any) => api.patch(`/lojas/${id}`, dto),
  remover:         (id: string) => api.delete(`/lojas/${id}`),
  criarCategoria:  (dto: any) => api.post('/lojas/categorias', dto),
  removerCategoria:(id: string) => api.delete(`/lojas/categorias/${id}`),
  uploadLogo:      (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/lojas/${id}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadFoto:      (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/lojas/${id}/midias`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removerFoto:     (id: string, midiaId: string) => api.delete(`/lojas/${id}/midias/${midiaId}`),
};

export const adminApi = {
  // Construtoras
  listarConstrutoras:          () => api.get('/construtoras/admin/lista'),
  // Empreendimentos
  listarEmpreendimentos:       () => api.get('/empreendimentos/admin/todas'),
  listarEmpsPorConstrutora:    (construtoraId: string) => api.get(`/empreendimentos/admin/construtora/${construtoraId}`),
  toggleEmpreendimento:        (id: string) => api.patch(`/empreendimentos/admin/${id}/toggle`),
  editarEmpreendimento:        (id: string, dto: any) => api.patch(`/empreendimentos/admin/${id}/editar`, dto),
  deletarEmpreendimento:       (id: string) => api.delete(`/empreendimentos/admin/${id}`),
  // Unidades
  listarUnidades:              (empreendimentoId: string) => api.get(`/unidades/admin/${empreendimentoId}`),
  // Usuários construtora
  listarUsuarios:              () => api.get('/construtoras/admin/usuarios'),
  resetSenha:                  (id: string) => api.post(`/construtoras/admin/${id}/reset-senha`, {}),
  toggleAtivo:                 (id: string) => api.patch(`/construtoras/admin/${id}/toggle-ativo`),
};
