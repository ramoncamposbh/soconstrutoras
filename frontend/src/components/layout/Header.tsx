'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LogIn, LayoutDashboard, Bell, Heart, LogOut, ChevronDown,
  Menu, X, Home, Handshake, Calculator, Ruler, Rocket,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/lancamentos', label: 'Lançamentos',    icon: Rocket },
  { href: '/repasse',     label: 'Repasse',        icon: Home },
  { href: '/parceiros',   label: 'Parceiros',      icon: Handshake },
  { href: '/favoritos',   label: 'Favoritos',      icon: Heart },
  { href: '/simuladores', label: 'Simuladores',    icon: Calculator },
  { href: '/melhor-m2',   label: 'Oport. m²',     icon: Ruler },
];

const BG       = '#0B1D2A';
const BORDER   = '#1A3547';
const HOVER_BG = '#1A3547';
const MUTED    = '#AAB5B2';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef     = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current     && !menuRef.current.contains(e.target as Node))     setMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (href: string) => pathname === href;

  /* ── Botão direita (login ou avatar) ───────────────── */
  const renderUserBtn = () => {
    if (!isAuthenticated) {
      return (
        <Link href="/auth/login" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: '#0E8F6E', color: '#fff', fontSize: 12, fontWeight: 600,
          padding: '6px 14px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          <LogIn size={13} /> Entrar
        </Link>
      );
    }

    return (
      <div ref={userMenuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          style={{
            background: '#fff', border: '1px solid #E8ECEB', borderRadius: 10,
            padding: '5px 12px 5px 6px', display: 'flex', alignItems: 'center',
            gap: 7, cursor: 'pointer',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#D1FAE5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#0A6A52', flexShrink: 0,
          }}>
            {user?.nome?.[0]?.toUpperCase()}
          </div>
          <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: 9, color: '#9CA3AF' }}>Olá,</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1F2937' }}>
              {user?.nome?.split(' ')[0]}
            </span>
          </div>
          <ChevronDown size={12} color="#9CA3AF" />
        </button>

        {userMenuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 46, background: '#fff',
            border: '1px solid #E5E7EB', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            minWidth: 170, padding: '6px 0', zIndex: 200,
          }}>
            {(user?.role === 'construtora' || user?.role === 'admin') && (
              <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                fontSize: 13, color: '#374151', textDecoration: 'none',
              }}>
                <LayoutDashboard size={15} color="#0E8F6E" /> Painel
              </Link>
            )}
            {user?.role === 'parceiro' && (
              <Link href="/dashboard/leads" onClick={() => setUserMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                fontSize: 13, color: '#374151', textDecoration: 'none',
              }}>
                <Bell size={15} color="#0E8F6E" /> Meus Leads
              </Link>
            )}
            <div style={{ height: 1, background: '#F3F4F6', margin: '4px 0' }} />
            <button
              onClick={() => { logout(); setUserMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                fontSize: 13, color: '#EF4444', background: 'none', border: 'none',
                cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ── Logo ────────────────────────────────────────────── */
  const Logo = ({ size }: { size: 'sm' | 'md' }) => (
    <Link href="/" style={{
      display: 'flex', alignItems: 'center', gap: size === 'md' ? 8 : 6,
      textDecoration: 'none',
      position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    }}>
      <div style={{
        width: size === 'md' ? 48 : 40,
        height: size === 'md' ? 52 : 44,
        overflow: 'hidden', flexShrink: 0,
      }}>
        <Image
          src="/logo-faicoh.png"
          alt="Faicoh"
          width={186}
          height={100}
          style={{
            width: '186px', height: '100px',
            objectFit: 'cover', objectPosition: 'left center',
            marginTop: '-22px',
          }}
          priority
        />
      </div>
      <span style={{
        fontWeight: 800,
        fontSize: size === 'md' ? 20 : 17,
        letterSpacing: 2,
        color: '#fff',
      }}>
        FAICOH
      </span>
    </Link>
  );

  return (
    <header style={{ background: BG, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 50 }}>

      {/* ── Mobile ─────────────────────────────────────── */}
      <div
        className="flex md:hidden"
        style={{ alignItems: 'center', height: 56, padding: '0 14px', position: 'relative' }}
      >
        {/* Hambúrguer */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            style={{
              width: 36, height: 36, borderRadius: 9,
              border: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', cursor: 'pointer', color: MUTED,
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', left: 0, top: 44,
              background: '#0F2536', border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: '6px 0',
              minWidth: 200, zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <Link href="/" onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', fontSize: 13, color: '#22D497',
                textDecoration: 'none', fontWeight: 600,
              }}>
                <Home size={15} /> Início
              </Link>
              <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', fontSize: 13,
                  color: isActive(href) ? '#22D497' : MUTED,
                  textDecoration: 'none', fontWeight: isActive(href) ? 600 : 400,
                  background: isActive(href) ? 'rgba(34,212,151,0.07)' : 'transparent',
                }}>
                  <Icon size={15} strokeWidth={1.5} /> {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Logo centralizada */}
        <Logo size="sm" />

        {/* Botão direita */}
        <div style={{ marginLeft: 'auto' }}>{renderUserBtn()}</div>
      </div>

      {/* ── Desktop ────────────────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{ alignItems: 'center', height: 62, padding: '0 24px', position: 'relative' }}
      >
        {/* Links esquerda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(90deg, #0E8F6E, #22D497)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            padding: '7px 16px', borderRadius: 10, textDecoration: 'none',
            marginRight: 6, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <Home size={13} /> Início
          </Link>

          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, padding: '7px 10px', borderRadius: 8,
                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                color: isActive(href) ? '#fff' : MUTED,
                background: isActive(href) ? HOVER_BG : 'transparent',
              }}
              onMouseEnter={e => {
                if (!isActive(href)) {
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                  (e.currentTarget as HTMLElement).style.background = HOVER_BG;
                }
              }}
              onMouseLeave={e => {
                if (!isActive(href)) {
                  (e.currentTarget as HTMLElement).style.color = MUTED;
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <Icon size={13} strokeWidth={1.5} /> {label}
            </Link>
          ))}
        </div>

        {/* Logo centralizada */}
        <Logo size="md" />

        {/* Botão direita */}
        <div style={{ marginLeft: 'auto' }}>{renderUserBtn()}</div>
      </div>
    </header>
  );
}
