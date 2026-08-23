'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Home, ToggleLeft, ToggleRight, Save, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const auth = () => ({ Authorization: `Bearer ${Cookies.get('token')}` });

interface ConfigItem {
  id: string;
  nome_fantasia: string;
  imoveis_usados_habilitado: boolean;
  imoveis_usados_limite: number;
  total_cadastrados: number;
  editando?: boolean;
  novoLimite?: number;
}

export default function AdminImoveisUsadosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [construtoras, setConstrutoras] = useState<ConfigItem[]>([]);
  const [busca, setBusca] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && user?.role !== 'admin') router.push('/');
  }, [user, loading, router]);

  const carregar = useCallback(async () => {
    setLoadingData(true);
    try {
      // Busca lista de construtoras
      const res = await fetch(`${API}/construtoras/admin/listar`, { headers: auth() });
      const lista = await res.json();
      // Busca config de cada uma
      const configs = await Promise.all(
        (Array.isArray(lista) ? lista : []).map(async (c: any) => {
          const cfgRes = await fetch(`${API}/imoveis-usados/admin/config/${c.id}`, { headers: auth() });
          return cfgRes.ok ? cfgRes.json() : { ...c, imoveis_usados_habilitado: false, imoveis_usados_limite: 5, total_cadastrados: 0 };
        })
      );
      setConstrutoras(configs);
    } catch { toast.error('Erro ao carregar.'); }
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { if (user?.role === 'admin') carregar(); }, [user, carregar]);

  const toggleHabilitado = async (c: ConfigItem) => {
    const res = await fetch(`${API}/imoveis-usados/admin/config/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ habilitado: !c.imoveis_usados_habilitado, limite: c.imoveis_usados_limite }),
    });
    if (res.ok) {
      toast.success(!c.imoveis_usados_habilitado ? 'Habilitado!' : 'Desabilitado.');
      setConstrutoras(prev => prev.map(x => x.id === c.id ? { ...x, imoveis_usados_habilitado: !x.imoveis_usados_habilitado } : x));
    }
  };

  const salvarLimite = async (c: ConfigItem) => {
    const novoLimite = c.novoLimite ?? c.imoveis_usados_limite;
    const res = await fetch(`${API}/imoveis-usados/admin/config/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ habilitado: c.imoveis_usados_habilitado, limite: novoLimite }),
    });
    if (res.ok) {
      toast.success('Limite salvo!');
      setConstrutoras(prev => prev.map(x => x.id === c.id ? { ...x, imoveis_usados_limite: novoLimite, editando: false } : x));
    }
  };

  const filtradas = construtoras.filter(c =>
    c.nome_fantasia?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading || loadingData) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-6 h-6 text-[#0E8F6E]" /> Imóveis Usados — Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Habilite e configure o limite de imóveis usados por construtora
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-56"
            placeholder="Buscar construtora..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#0E8F6E]">
            {construtoras.filter(c => c.imoveis_usados_habilitado).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Habilitadas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">
            {construtoras.reduce((a, c) => a + Number(c.total_cadastrados), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total cadastrados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">
            {construtoras.reduce((a, c) => a + Number(c.imoveis_usados_limite), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Capacidade total</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="card divide-y divide-gray-100">
        {filtradas.length === 0 && (
          <div className="p-8 text-center text-gray-400">Nenhuma construtora encontrada.</div>
        )}
        {filtradas.map(c => (
          <div key={c.id} className="flex items-center gap-4 p-4">
            {/* Nome */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{c.nome_fantasia}</p>
              <p className="text-xs text-gray-400">
                {c.total_cadastrados} cadastrado{c.total_cadastrados !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Limite */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Limite:</span>
              {c.editando ? (
                <>
                  <input
                    type="number" min={0} max={999}
                    className="input w-16 text-center py-1 px-2 text-sm"
                    value={c.novoLimite ?? c.imoveis_usados_limite}
                    onChange={e => setConstrutoras(prev => prev.map(x =>
                      x.id === c.id ? { ...x, novoLimite: Number(e.target.value) } : x
                    ))}
                  />
                  <button
                    onClick={() => salvarLimite(c)}
                    className="btn-primary py-1 px-2 text-xs flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" /> Salvar
                  </button>
                  <button
                    onClick={() => setConstrutoras(prev => prev.map(x => x.id === c.id ? { ...x, editando: false } : x))}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="font-semibold text-gray-700 w-8 text-center">{c.imoveis_usados_limite}</span>
                  <button
                    onClick={() => setConstrutoras(prev => prev.map(x => x.id === c.id ? { ...x, editando: true } : x))}
                    className="text-xs text-[#0E8F6E] hover:underline"
                  >
                    Editar
                  </button>
                </>
              )}
            </div>

            {/* Toggle habilitado */}
            <button onClick={() => toggleHabilitado(c)} className="flex items-center gap-2 ml-4">
              {c.imoveis_usados_habilitado
                ? <ToggleRight className="w-8 h-8 text-[#0E8F6E]" />
                : <ToggleLeft className="w-8 h-8 text-gray-300" />
              }
              <span className={`text-sm font-medium ${c.imoveis_usados_habilitado ? 'text-[#0E8F6E]' : 'text-gray-400'}`}>
                {c.imoveis_usados_habilitado ? 'Habilitado' : 'Desabilitado'}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
