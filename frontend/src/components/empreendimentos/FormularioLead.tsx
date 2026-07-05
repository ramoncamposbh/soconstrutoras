'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { leadsApi } from '@/lib/api';
import { Phone, Mail, User, MessageSquare, CheckCircle } from 'lucide-react';

interface Dados {
  nome: string;
  email?: string;
  telefone: string;
  mensagem?: string;
}

export default function FormularioLead({ empreendimentoId }: { empreendimentoId: string }) {
  const [enviado, setEnviado] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Dados>();

  const enviar = async (dados: Dados) => {
    try {
      await leadsApi.capturar(empreendimentoId, dados);
      setEnviado(true);
    } catch {
      toast.error('Erro ao enviar. Tente novamente.');
    }
  };

  if (enviado) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Interesse registrado!</h3>
        <p className="text-sm text-gray-500">
          Um especialista deste empreendimento entrará em contato em breve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4">
      <h3 className="font-semibold text-gray-900">Quero mais informações</h3>

      <div>
        <label className="label">Nome *</label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            {...register('nome', { required: 'Nome obrigatório' })}
            className="input pl-9"
            placeholder="Seu nome completo"
          />
        </div>
        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
      </div>

      <div>
        <label className="label">Telefone / WhatsApp *</label>
        <div className="relative">
          <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            {...register('telefone', { required: 'Telefone obrigatório' })}
            className="input pl-9"
            placeholder="(11) 99999-9999"
          />
        </div>
        {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
      </div>

      <div>
        <label className="label">E-mail</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            {...register('email')}
            type="email"
            className="input pl-9"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      <div>
        <label className="label">Mensagem</label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <textarea
            {...register('mensagem')}
            className="input pl-9 resize-none"
            rows={3}
            placeholder="Dúvidas, interesse em visita..."
          />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? 'Enviando...' : 'Quero ser contactado'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Seus dados serão compartilhados apenas com a equipe de atendimento deste empreendimento.
      </p>
    </form>
  );
}
