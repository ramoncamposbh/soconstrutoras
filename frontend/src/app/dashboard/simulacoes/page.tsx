'use client';

import { useEffect, useState } from 'react';
import { Calculator, Loader2, Phone, Mail, User, Download } from 'lucide-react';
import api from '@/lib/api';

const fmt = (v: number | null) =>
  v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '—';

const fmtData = (s: string) =>
  new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const VINCULO_LABEL: Record<string, string> = {
  CLT: 'CLT', SERVIDOR: 'Servidor', AUTONOMO_COM_IR: 'Autônomo c/ IR', AUTONOMO_SEM_IR: 'Autônomo s/ IR',
};

interface Simulacao {
  id: number;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  renda_liquida: number;
  entrada: number;
  fgts: number;
  usa_fgts: boolean;
  vinculo: string;
  valor_imovel_desejado: number | null;
  prazo_anos: number;
  score_imobiliario: number;
  capacidade_total: number;
  max_financiamento: number;
  created_at: string;
}

function scoreBadge(s: number) {
  const cor = s >= 800 ? 'bg-green-100 text-green-700' : s >= 650 ? 'bg-blue-100 text-blue-700' : s >= 500 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${cor}`}>{s}</span>;
}

export default function SimulacoesAdminPage() {
  const [rows, setRows] = useState<Simulacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/simulador/admin/lista')
      .then(r => setRows(r.data))
      .catch(e => setErro(e.response?.data?.message ?? e.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, []);

  function exportarCSV() {
    const header = 'ID,Data,Nome,Email,Telefone,Vínculo,Renda,Entrada,FGTS,Valor Imóvel,Prazo,Score,Capacidade Total,Banco Financia';
    const linhas = rows.map(r => [
      r.id,
      fmtData(r.created_at),
      r.nome ?? '',
      r.email ?? '',
      r.telefone ?? '',
      VINCULO_LABEL[r.vinculo] ?? r.vinculo,
      r.renda_liquida,
      r.entrada,
      r.usa_fgts ? r.fgts : 0,
      r.valor_imovel_desejado ?? '',
      r.prazo_anos,
      r.score_imobiliario,
      r.capacidade_total,
      r.max_financiamento,
    ].join(','));
    const blob = new Blob([[header, ...linhas].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'simulacoes.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Simulações</h1>
          {!loading && !erro && (
            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {rows.length} registro{rows.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <p className="font-bold mb-1">Não foi possível carregar as simulações</p>
          <p className="text-sm">{erro}</p>
          {erro.includes('tabela') && (
            <p className="text-sm mt-3 text-red-600">
              Execute o SQL de criação da tabela <code className="bg-red-100 px-1 rounded">simulacoes</code> no Neon e tente novamente.
            </p>
          )}
        </div>
      )}

      {!loading && !erro && rows.length === 0 && (
        <div className="card p-12 text-center">
          <Calculator className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma simulação registrada ainda.</p>
          <p className="text-xs text-gray-300 mt-1">As simulações aparecem aqui quando o usuário informa nome, e-mail ou telefone.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                {/* Contato */}
                <div>
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-gray-400" />
                    {r.nome ?? <span className="text-gray-400 font-normal">Anônimo</span>}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {r.email && (
                      <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                        <Mail className="w-3 h-3" /> {r.email}
                      </a>
                    )}
                    {r.telefone && (
                      <a href={`https://wa.me/55${r.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                        <Phone className="w-3 h-3" /> {r.telefone}
                      </a>
                    )}
                  </div>
                </div>
                {/* Score + data */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-gray-400">Score</span>
                    {scoreBadge(r.score_imobiliario)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{fmtData(r.created_at)}</p>
                </div>
              </div>

              {/* Dados financeiros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Renda</p>
                  <p className="font-bold text-gray-900 text-sm">{fmt(r.renda_liquida)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Entrada{r.usa_fgts ? ' + FGTS' : ''}</p>
                  <p className="font-bold text-gray-900 text-sm">{fmt(r.entrada + (r.usa_fgts ? r.fgts : 0))}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Capacidade total</p>
                  <p className="font-bold text-primary-600 text-sm">{fmt(r.capacidade_total)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Imóvel buscado</p>
                  <p className="font-bold text-gray-900 text-sm">{fmt(r.valor_imovel_desejado)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{VINCULO_LABEL[r.vinculo] ?? r.vinculo}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{r.prazo_anos} anos</span>
                <span className="bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full">Banco financia até {fmt(r.max_financiamento)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
