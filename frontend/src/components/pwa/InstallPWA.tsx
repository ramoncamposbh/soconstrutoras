'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

type Platform = 'android' | 'ios' | 'desktop' | null;

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'desktop';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}

export default function InstallPWA() {
  const [platform, setPlatform]   = useState<Platform>(null);
  const [deferredPrompt, setPrompt] = useState<any>(null);
  const [showIOS, setShowIOS]     = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    setPlatform(detectPlatform());

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  if (installed || !platform) return null;

  /* ── Android / Desktop: botão que dispara o prompt nativo ── */
  if ((platform === 'android' || platform === 'desktop') && deferredPrompt) {
    return (
      <button
        onClick={async () => {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') setInstalled(true);
          setPrompt(null);
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.22)',
          color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'background 0.15s',
        }}
        title="Instalar app"
      >
        <Download size={14} />
        Instalar app
      </button>
    );
  }

  /* ── iOS: ícone que abre banner de instrução ── */
  if (platform === 'ios') {
    return (
      <>
        <button
          onClick={() => setShowIOS(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          title="Instalar app"
        >
          <Download size={14} />
          Instalar app
        </button>

        {/* Banner iOS */}
        {showIOS && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)', maxWidth: 360,
            background: '#fff', borderRadius: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
            padding: '20px 20px 16px',
            zIndex: 99999,
          }}>
            {/* Fechar */}
            <button onClick={() => setShowIOS(false)} style={{
              position: 'absolute', top: 14, right: 14,
              background: '#f3f4f6', border: 'none', borderRadius: '50%',
              width: 28, height: 28, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={14} color="#6B7280" />
            </button>

            {/* Ícone do app */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img src="/icons/apple-touch-icon.png" alt="FAICOH"
                style={{ width: 52, height: 52, borderRadius: 12 }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>FAICOH</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>faicoh.com.br</p>
              </div>
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 14 }}>
              Instalar no iPhone / iPad
            </p>

            {/* Passos */}
            {[
              {
                num: 1,
                icon: <Share size={16} color="#0E8F6E" />,
                text: <>Toque no ícone <strong>Compartilhar</strong> na barra do Safari</>,
              },
              {
                num: 2,
                icon: <span style={{ fontSize: 16 }}>＋</span>,
                text: <>Role e toque em <strong>"Adicionar à Tela de Início"</strong></>,
              },
              {
                num: 3,
                icon: <span style={{ fontSize: 16 }}>✓</span>,
                text: <>Toque em <strong>Adicionar</strong> no canto superior direito</>,
              },
            ].map(step => (
              <div key={step.num} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#f0faf7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#0E8F6E', fontWeight: 700,
                }}>
                  {step.icon}
                </div>
                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.4 }}>
                  {step.text}
                </p>
              </div>
            ))}

            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
              Disponível somente pelo Safari no iOS
            </p>
          </div>
        )}
      </>
    );
  }

  return null;
}
