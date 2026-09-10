'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { construtoraApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, User, Phone, Mail, MapPin, Save, Loader2 } from 'lucide-react';

interface PerfilConstrutora {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_tel: string;
}

const VAZIO: PerfilConstrutora = {
  razao_social: '', nome_fantasia: '', cnpj: '',
  telefone: '', endereco: '', cidade: '', estado: '', cep: '',
  responsavel_nome: '', responsavel_email: '', responsavel_tel: '',
};

export default function PerfilConstrutoraPag() {
  const { user } = useAuth();
  const [dados, setDados] = useState<PerfilConstrutora>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    construtoraApi.perfil()
      .then(r => setDados({ ...VAZIO, ...r.data }))
      .catch(() => toast.error('Erro ao carregar perfil'))
      .finally(() => setCarregando(false));
  }, []);

  const set = (campo: keyof PerfilConstrutora) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setDados(d => ({ ...d, [campo]: e.target.value }));

  const salvar = async () => {
    setSalvando(true);
    try {
      await construtoraApi.atualizar({
        nome_fantasia:   dados.nome_fantasia,
        telefone:        dados.telefone,
        endereco:        dados.endereco,
        cidade:          dados.cidade,
        estado:          dados.estado,
        cep:             dados.cep,
        responsavel_nome:  dados.responsavel_nome,
        responsavel_email: dados.responsavel_email,
        responsavel_tel:   dados.responsavel_tel,
      } as any);
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  const campo = (
    label: string,
    campo: keyof PerfilConstrutora,
    opts?: { placeholder?: string; readOnly?: boolean; type?: string }
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={opts?.type ?? 'text'}
        value={dados[campo]}
        onChange={set(campo)}
        readOnly={opts?.readOnly}
        placeholder={opts?.placeholder ?? ''}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition
          ${opts?.readOnly ? 'bg-gray-50 text-gray-400 cursor-default' : 'bg-white text-gray-800'}`}
      />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Perfil da construtora</h1>
        <p className="text-sm text-gray-500 mt-0.5">Dados cadastrais da sua empresa</p>
      </div>

      {/* Dados da empresa */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-primary-500" />
          <h2 className="text-sm font-semibold text-gray-700">Dados da empresa</h2>
        </div>
        {campo('Razão social', 'razao_social', { readOnly: true, placeholder: 'Preenchido no cadastro' })}
        {campo('Nome fantasia', 'nome_fantasia', { placeholder: 'Ex: Construtora XYZ' })}
        {campo('CNPJ', 'cnpj', { readOnly: true, placeholder: 'Preenchido no cadastro' })}
        {campo('Telefone da empresa', 'telefone', { placeholder: '(31) 3333-4444' })}
      </div>

      {/* Endereço */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary-500" />
          <h2 className="text-sm font-semibold text-gray-700">Endereço</h2>
        </div>
        {campo('Endereço', 'endereco', { placeholder: 'Rua, número, complemento' })}
        <div className="grid grid-cols-2 gap-3">
          {campo('Cidade', 'cidade', { placeholder: 'Belo Horizonte' })}
          {campo('Estado (UF)', 'estado', { placeholder: 'MG' })}
        </div>
        {campo('CEP', 'cep', { placeholder: '30000-000' })}
      </div>

      {/* Responsável */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-primary-500" />
          <h2 className="text-sm font-semibold text-gray-700">Responsável</h2>
        </div>
        {campo('Nome do responsável', 'responsavel_nome', { placeholder: 'João da Silva' })}
        {campo('E-mail do responsável', 'responsavel_email', { placeholder: 'joao@construtora.com', type: 'email' })}
        {campo('Telefone do responsável', 'responsavel_tel', { placeholder: '(31) 99999-8888' })}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">E-mail de login (não editável)</label>
          <input
            readOnly
            value={user?.email ?? ''}
            className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-default"
          />
        </div>
      </div>

      <button
        onClick={salvar}
        disabled={salvando}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition"
        style={{ background: 'linear-gradient(90deg, #0E8F6E, #22D497)' }}
      >
        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {salvando ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </div>
  );
}
