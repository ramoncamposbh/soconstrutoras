export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'construtora' | 'parceiro' | 'admin' | 'cliente';
}

export interface Construtora {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  logo_url?: string;
  has_house_de_vendas: boolean;
  plano_nome?: string;
  subscription_status: 'trial' | 'ativa' | 'suspensa' | 'cancelada';
}

export interface Empreendimento {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  tipo: 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'studio';
  status: 'lancamento' | 'em_obras' | 'pronto' | 'suspenso';
  endereco?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  preco_min?: number;
  preco_max?: number;
  area_min?: number;
  area_max?: number;
  quartos_min?: number;
  quartos_max?: number;
  vagas?: number;
  latitude?: number | null;
  longitude?: number | null;
  publicado: boolean;
  publicado_em?: string;
  foto_capa?: string;
  midias?: Midia[];
  construtora?: string;
  construtora_logo?: string;
  total_leads?: number;
  created_at: string;
}

export interface Midia {
  id: string;
  url: string;
  tipo: 'foto' | 'video' | 'planta' | 'tour_virtual';
  ordem: number;
  legenda?: string;
}

export interface Parceiro {
  id: string;
  tipo: 'imobiliaria' | 'corretor';
  nome: string;
  email: string;
  telefone?: string;
  creci?: string;
  is_house_de_vendas: boolean;
  ativo: boolean;
  total_leads_recebidos?: number;
  modo_distribuicao?: 'sequencial' | 'percentual';
  percentual?: number;
  ordem?: number;
  leads_recebidos?: number;
}

export interface Lead {
  id: string;
  empreendimento_id: string;
  empreendimento?: string;
  nome: string;
  email?: string;
  telefone: string;
  mensagem?: string;
  status: 'novo' | 'atribuido' | 'em_atendimento' | 'convertido' | 'perdido';
  parceiro_nome?: string;
  parceiro_email?: string;
  atribuido_em?: string;
  created_at: string;
}

export interface DashboardStats {
  total_empreendimentos: number;
  publicados: number;
  total_leads: number;
  leads_novos: number;
  leads_convertidos: number;
  total_parceiros: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export type TipoUnidade = 'apartamento' | 'cobertura' | 'garden' | 'duplex' | 'studio' | 'loft' | 'comercial';

export interface UnidadeMidia {
  id: string;
  url: string;
  tipo: 'foto' | 'planta' | 'render';
  legenda?: string;
  ordem: number;
}

export interface Unidade {
  id: string;
  empreendimento_id: string;
  tipo: TipoUnidade;
  nome?: string;
  metragem_privativa?: number;
  metragem_total?: number;
  quartos: number;
  suites: number;
  vagas: number;
  preco?: number;
  descricao?: string;
  disponivel: boolean;
  ordem: number;
  midias: UnidadeMidia[];
  created_at: string;
  updated_at: string;
}
