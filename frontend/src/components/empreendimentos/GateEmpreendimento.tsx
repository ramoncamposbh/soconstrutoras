'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { authApi, leadsApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { Lock, User, Phone, Mail, Eye, EyeOff, Loader2, LogIn, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const G  = '#0E8F6E';
const GD = '#04241D';

// ─── Formulário de cadastro rápido ───────────────────────────────────────────
interface GateFormProps {
  empId: string;
  slug: string;
  nomeEmpreendimento: string;
}

function GateForm({ empId, slug, nomeEmpreendimento }: GateFormProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast.error('Preencha nome, e-mail e senha.');
      return;
    }
    if (senha.length < 6) {
      toast.error('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    setCarregando(true);
    try {
      // 1. Criar conta como cliente
      const { data } = await authApi.register({ nome, email, password: senha, role: 'cliente' });
      const isHttps = window.location.protocol === 'https:';
      Cookies.set('token', data.access_token, { expires: 7, secure: isHttps, sameSite: 'lax' });

      // 2. Auto-capturar lead para este empreendimento
      try {
        await leadsApi.capturar(empId, { nome, email, telefone: telefone.trim() || '' });
      } catch {
        // silencia: lead secundário, não bloqueia o fluxo
      }

      toast.success('Conta criada! Bem-vindo.');
      // Recarrega a página — com cookie definido, o gate desaparece
      window.location.reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao criar conta.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
      setCarregando(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px 10px 36px',
    border: '1.5px solid #E5E7EB',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    color: '#111827',
    background: '#FAFAFA',
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 11,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      border: '1.5px solid #E5E7EB',
      boxShadow: '0 12px 48px rgba(0,0,0,0.14)',
      padding: '28px 28px 24px',
      width: '100%',
      maxWidth: 440,
    }}>
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(14,143,110,0.1)',
          border: '1.5px solid rgba(14,143,110,0.25)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <Lock size={24} color={G} />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: GD, margin: '0 0 6px' }}>
          Cadastre-se para ver os detalhes
        </h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
          Acesse preços, plantas e entre em contato com a construtora de{' '}
          <strong style={{ color: GD }}>{nomeEmpreendimento}</strong>
        </p>
      </div>

      {/* Benefícios rápidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
        {['Preços e tabela de unidades', 'Plantas e fotos completas', 'Contato direto com a construtora'].map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
            <CheckCircle size={14} color={G} style={{ flexShrink: 0 }} />
            {b}
          </div>
        ))}
      </div>

      {/* Formulário */}
      <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Nome */}
        <div style={{ position: 'relative' }}>
          <User size={14} color="#9CA3AF" style={iconStyle} />
          <input
            type="text"
            placeholder="Nome completo *"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {/* E-mail */}
        <div style={{ position: 'relative' }}>
          <Mail size={14} color="#9CA3AF" style={iconStyle} />
          <input
            type="email"
            placeholder="E-mail *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {/* Telefone */}
        <div style={{ position: 'relative' }}>
          <Phone size={14} color="#9CA3AF" style={iconStyle} />
          <input
            type="tel"
            placeholder="WhatsApp / Telefone"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Senha */}
        <div style={{ position: 'relative' }}>
          <Lock size={14} color="#9CA3AF" style={iconStyle} />
          <input
            type={mostrarSenha ? 'text' : 'password'}
            placeholder="Criar senha (mín. 6 caracteres) *"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            minLength={6}
            style={{ ...inputStyle, paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(v => !v)}
            style={{
              position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            }}
          >
            {mostrarSenha ? <EyeOff size={14} color="#9CA3AF" /> : <Eye size={14} color="#9CA3AF" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={carregando}
          style={{
            marginTop: 4,
            padding: '12px 24px',
            background: carregando ? '#9CA3AF' : G,
            color: '#fff', fontWeight: 700, fontSize: 14,
            borderRadius: 12, border: 'none',
            cursor: carregando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%',
          }}
        >
          {carregando
            ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Criando conta...</>
            : 'Cadastrar e ver detalhes'}
        </button>

        {/* Link para login */}
        <div style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          Já tem conta?{' '}
          <Link
            href={`/auth/login?redirect=/imoveis/${slug}&lead=${empId}`}
            style={{
              color: G, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}
          >
            <LogIn size={13} /> Entrar
          </Link>
        </div>

        <p style={{ fontSize: 10, color: '#D1D5DB', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
          Ao se cadastrar você concorda com nossos Termos de Uso. Seus dados são usados
          apenas para envio de informações sobre imóveis.
        </p>
      </form>
    </div>
  );
}

// ─── Gate principal ───────────────────────────────────────────────────────────
interface GateProps {
  empId: string;
  slug: string;
  nomeEmpreendimento: string;
  children: React.ReactNode;
}

export default function GateEmpreendimento({ empId, slug, nomeEmpreendimento, children }: GateProps) {
  const { isAuthenticated, loading } = useAuth();

  // Enquanto verifica auth, mostra placeholder
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
        <Loader2 size={28} color={G} style={{ animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Autenticado: renderiza conteúdo normalmente
  if (isAuthenticated) return <>{children}</>;

  // Não autenticado: mostra gate + formulário
  return (
    <div style={{ position: 'relative' }}>
      {/* Conteúdo borrado atrás do gate */}
      <div
        aria-hidden="true"
        style={{
          filter: 'blur(8px)',
          pointerEvents: 'none',
          userSelect: 'none',
          maxHeight: 320,
          overflow: 'hidden',
          opacity: 0.4,
        }}
      >
        {children}
      </div>

      {/* Overlay com gradiente + formulário */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(249,250,251,0.3) 0%, rgba(249,250,251,0.98) 20%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 16,
        paddingLeft: 16,
        paddingRight: 16,
      }}>
        <GateForm empId={empId} slug={slug} nomeEmpreendimento={nomeEmpreendimento} />
      </div>

      {/* Espaço extra para o formulário não ficar cortado */}
      <div style={{ height: 520 }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
