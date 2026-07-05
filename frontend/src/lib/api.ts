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
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  },
);

export default api;

export const authApi = {
  login:    (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me:       () => api.get('/auth/me'),
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
  // Inicia checkout para assinar um plano — retorna { checkoutUrl }
  checkout: (plano: 'starter' | 'profissional' | 'enterprise') =>
    api.post<{ checkoutUrl: string }>('/billing/checkout', { plano }),

  // Abre portal Stripe — retorna { portalUrl }
  portal: () => api.post<{ portalUrl: string }>('/billing/portal'),

  // Status da assinatura atual
  status: () => api.get('/billing/status'),
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
