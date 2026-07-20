'use client';

import { X, Lock, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  onClose: () => void;
  titulo?: string;
  descricao?: string;
}

export default function ModalAutenticacao({
  onClose,
  titulo = 'Conteudo exclusivo para clientes',
  descricao = 'Faca login ou cadastre-se gratuitamente para ver o endereco completo, localização no mapa e unidades disponiveis.',
}: Props) {
  const pathname = usePathname();
  const next = encodeURIComponent(pathname ?? '/');

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 border-2 border-primary-100 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary-500" />
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{titulo}</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{descricao}</p>
          </div>

          <div className="w-full space-y-2.5">
            <Link
              href={`/auth/login?next=${next}`}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Entrar na minha conta
            </Link>
            <Link
              href={`/auth/register?next=${next}`}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Criar conta gratuita
            </Link>
          </div>

          <p className="text-xs text-gray-400">Cadastro gratuito · Leva menos de 1 minuto</p>
        </div>
      </div>
    </div>
  );
}
