'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { parceirosApi } from '@/lib/api';
import type { Parceiro } from '@/types';
import { Plus, Users, Bell, Building2, User, X, Loader2 } from 'lucide-react';

export default function ParceirosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    parceirosApi.listar()
      .then((res) => setParceiros(res.data))
      .finally(() => setLoading(false));
  }, []);

  const adicionar = async (data: any) => {
    try {
      const { data: parceiro } = await parceirosApi.adicionar(data);
      setParceiros((prev) => [parceiro, ...prev]);
      reset();
      setShowForm(false);
      toast.success('Parceiro adicionado!');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao adicionar parceiro.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parceiros</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar parceiro
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Com sua <strong>house de vendas</strong>: até 2 parceiros externos por empreendimento.
        Sem house de vendas: até 3 parceiros por empreendimento.
      </p>

      {/* Formulário de adição */}
      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Novo parceiro</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(adicionar)} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo *</label>
              <select {...register('tipo', { required: true })} className="input">
                <option value="imobiliaria">Imobiliária</option>
                <option value="corretor">Corretor autônomo</option>
              </select>
            </div>
            <div>
              <label className="label">Nome *</label>
              <input {...register('nome', { required: true })} className="input" placeholder="Nome ou razão social" />
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input {...register('email', { required: true })} type="email" className="input" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input {...register('telefone')} className="input" placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="label">CRECI</label>
              <input {...register('creci')} className="input" placeholder="CRECI/UF 000000" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="house" {...register('is_house_de_vendas')} className="w-4 h-4 text-primary-600" />
              <label htmlFor="house" className="text-sm text-gray-700">É a house de vendas</label>
            </div>

            <div className="col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de parceiros */}
      {parceiros.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum parceiro cadastrado ainda.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {parceiros.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                p.is_house_de_vendas ? 'bg-primary-100' : p.tipo === 'imobiliaria' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                {p.tipo === 'imobiliaria'
                  ? <Building2 className={`w-5 h-5 ${p.is_house_de_vendas ? 'text-primary-600' : 'text-purple-600'}`} />
                  : <User className="w-5 h-5 text-gray-600" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{p.nome}</p>
                  {p.is_house_de_vendas && (
                    <span className="badge bg-primary-100 text-primary-700">House de vendas</span>
                  )}
                  {!p.is_house_de_vendas && (
                    <span className="badge bg-gray-100 text-gray-600 capitalize">{p.tipo}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{p.email}{p.creci ? ` · CRECI: ${p.creci}` : ''}</p>
              </div>

              <div className="text-right text-sm">
                <p className="font-medium text-gray-900">{p.total_leads_recebidos ?? 0}</p>
                <p className="text-gray-400 text-xs flex items-center gap-1 justify-end">
                  <Bell className="w-3 h-3" /> leads
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
