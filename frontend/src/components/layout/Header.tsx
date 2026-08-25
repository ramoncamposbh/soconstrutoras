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
  { href: '/lancamentos', label: 'Lançamentos', icon: Rocket },
  { href: '/repasse',     label: 'Repasse',     icon: Home },
  { href: '/parceiros',   label: 'Parceiros',   icon: Handshake },
  { href: '/favoritos',   label: 'Favoritos',   icon: Heart },
  { href: '/simuladores', label: 'Simuladores', icon: Calculator },
  { href: '/melhor-m2',   label: 'Oport. m²',  icon: Ruler },
];

const BG     = '#0B1D2A';
const BORDER = '#1A3547';
const MUTED  = '#AAB5B2';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen]         = useState(false);
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

  /* ── Botão direita ────────────────────────────────── */
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
            background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: '5px 12px 5px 8px', display: 'flex', alignItems: 'center',
            gap: 7, cursor: 'pointer',
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: '#0E8F6E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {user?.nome?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
            {user?.nome?.split(' ')[0]}
          </span>
          <ChevronDown size={12} color={MUTED} />
        </button>

        {userMenuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 46, background: '#0F2536',
            border: `1px solid ${BORDER}`, borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            minWidth: 170, padding: '6px 0', zIndex: 200,
          }}>
            {(user?.role === 'construtora' || user?.role === 'admin') && (
              <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                fontSize: 13, color: MUTED, textDecoration: 'none',
              }}>
                <LayoutDashboard size={15} color="#0E8F6E" /> Painel
              </Link>
            )}
            {user?.role === 'parceiro' && (
              <Link href="/dashboard/leads" onClick={() => setUserMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                fontSize: 13, color: MUTED, textDecoration: 'none',
              }}>
                <Bell size={15} color="#0E8F6E" /> Meus Leads
              </Link>
            )}
            <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />
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

  return (
    <header style={{ background: BG, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 50 }}>

      {/* ── Mobile ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 14px', position: 'relative' }}
        className="md:hidden">

        {/* Hambúrguer esquerda */}
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

        {/* Logo centralizada no mobile */}
        <Link href="/" style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', textDecoration: 'none',
        }}>
          <div style={{ height: 44, overflow: 'hidden' }}>
            <Image
              src="/logo-faicoh.png"
              alt="Faicoh"
              width={280}
              height={150}
              style={{ height: 82, width: 'auto', marginTop: -14 }}
              priority
            />
          </div>
        </Link>

        {/* Botão direita */}
        <div style={{ marginLeft: 'auto' }}>{renderUserBtn()}</div>
      </div>

      {/* ── Desktop ────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', height: 62, padding: '0 24px', gap: 16 }}
        className="hidden md:flex">

        {/* Logo ESQUERDA */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ height: 50, overflow: 'hidden' }}>
            <Image
              src="/logo-faicoh.png"
              alt="Faicoh"
              width={320}
              height={172}
              style={{ height: 95, width: 'auto', marginTop: -16 }}
              priority
            />
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, padding: '7px 10px', borderRadius: 8,
                textDecoration: 'none', whiteSpace: 'nowrap',
                color: isActive(href) ? '#fff' : MUTED,
                background: isActive(href) ? BORDER : 'transparent',
                fontWeight: isActive(href) ? 600 : 400,
              }}
              onMouseEnter={e => {
                if (!isActive(href)) {
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                  (e.currentTarget as HTMLElement).style.background = BORDER;
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

        {/* Botão direita */}
        {renderUserBtn()}
      </div>
    </header>
  );
}
