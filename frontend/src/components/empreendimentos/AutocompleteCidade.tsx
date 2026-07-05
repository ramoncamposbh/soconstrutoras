'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';

const ESTADO_SIGLA: Record<string, string> = {
  'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
  'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
  'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
  'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS', 'Rondônia': 'RO',
  'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
  'Sergipe': 'SE', 'Tocantins': 'TO',
};

interface Sugestao {
  label: string;       // texto principal (rua, bairro ou cidade)
  sublabel: string;    // cidade + estado
  cidade: string;
  estado: string;
  tipo: 'cidade' | 'bairro' | 'rua' | 'outro';
}

interface Props {
  value: string;
  onChange: (cidade: string, estado: string) => void;
  placeholder?: string;
  className?: string;
}

function tipoIcon(tipo: Sugestao['tipo']) {
  switch (tipo) {
    case 'cidade': return '🏙️';
    case 'bairro': return '🏘️';
    case 'rua':    return '🛣️';
    default:       return '📍';
  }
}

function extrairSugestao(item: any): Sugestao | null {
  const addr = item.address ?? {};
  const estadoNome = addr.state || '';
  const sigla = ESTADO_SIGLA[estadoNome] || '';
  if (!sigla) return null;

  const cidade = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
  const bairro = addr.suburb || addr.neighbourhood || addr.quarter || addr.district || '';
  const rua = addr.road || addr.pedestrian || addr.path || '';

  // Determinar label e tipo com base no que está disponível
  if (rua) {
    return {
      label: rua,
      sublabel: [bairro, cidade, sigla].filter(Boolean).join(', '),
      cidade,
      estado: sigla,
      tipo: 'rua',
    };
  }
  if (bairro && cidade) {
    return {
      label: bairro,
      sublabel: `${cidade}, ${sigla}`,
      cidade,
      estado: sigla,
      tipo: 'bairro',
    };
  }
  if (cidade) {
    return {
      label: cidade,
      sublabel: `${estadoNome} (${sigla})`,
      cidade,
      estado: sigla,
      tipo: 'cidade',
    };
  }
  return null;
}

export default function AutocompleteCidade({ value, onChange, placeholder = 'Cidade, bairro ou rua...', className = '' }: Props) {
  const [query, setQuery] = useState(value);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(false);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setSugestoes([]); setAberto(false); return; }
    setLoading(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(q + ', Brasil')}&format=json&limit=8` +
        `&countrycodes=br&addressdetails=1`;

      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'SoConstrutoras/1.0' },
      });
      const dados = await res.json();

      const vistos = new Set<string>();
      const lista: Sugestao[] = [];

      for (const item of dados) {
        const s = extrairSugestao(item);
        if (!s) continue;
        const chave = `${s.label}|${s.sublabel}`;
        if (vistos.has(chave)) continue;
        vistos.add(chave);
        lista.push(s);
        if (lista.length >= 7) break;
      }

      setSugestoes(lista);
      setAberto(lista.length > 0);
    } catch {
      setSugestoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val) { onChange('', ''); setSugestoes([]); setAberto(false); return; }
    timerRef.current = setTimeout(() => buscar(val), 400);
  };

  const selecionar = (s: Sugestao) => {
    // Label exibido no input: rua/bairro + cidade, ou só cidade
    const textoInput = s.tipo === 'cidade' ? s.label : `${s.label}, ${s.cidade}`;
    setQuery(textoInput);
    setSugestoes([]);
    setAberto(false);
    onChange(s.cidade, s.estado);
  };

  return (
    <div className="relative" ref={ref}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={onType}
        onFocus={() => sugestoes.length > 0 && setAberto(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 ${className}`}
      />
      {loading && (
        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
      )}

      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {sugestoes.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => selecionar(s)}
              className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <span className="text-base mt-0.5 shrink-0">{tipoIcon(s.tipo)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.label}</p>
                <p className="text-xs text-gray-500 truncate">{s.sublabel}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
