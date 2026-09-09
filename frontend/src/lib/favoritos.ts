'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import { favoritosApi } from './api';
import type { Empreendimento } from '@/types';

// ── localStorage ──────────────────────────────────────────────────────────
const LS_KEY = 'sc_favoritos';

function lsRemover(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const lista: Empreendimento[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    localStorage.setItem(LS_KEY, JSON.stringify(lista.filter(f => f.id !== id)));
  } catch { /* ignora */ }
}

function emitir() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('favoritos-changed'));
}

// Verifica cookie APENAS para toggleFavorito (função não-hook)
function isLogadoCookie() {
  if (typeof window === 'undefined') return false;
  const { default: Cookies } = require('js-cookie');
  return !!Cookies.get('token');
}

// ── API helpers ────────────────────────────────────────────────────────────
async function apiIds(): Promise<string[]> {
  const r = await favoritosApi.listarIds();
  return Array.isArray(r.data) ? r.data : [];
}

async function apiListar(): Promise<Empreendimento[]> {
  const r = await favoritosApi.listar();
  return Array.isArray(r.data) ? r.data : [];
}

// ── Hook: lista completa ───────────────────────────────────────────────────
// Usa useAuth como fonte de verdade — não lê localStorage para visitantes
export function useFavoritos(): Empreendimento[] {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [lista, setLista] = useState<Empreendimento[]>([]);

  const carregar = useCallback(async () => {
    if (authLoading) return; // Aguarda auth resolver

    if (!isAuthenticated) {
      // Visitante — limpa localStorage órfão e mostra vazio
      if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY);
      setLista([]);
      return;
    }

    // Usuário autenticado — API é fonte de verdade
    try {
      const apiLista = await apiListar();
      localStorage.setItem(LS_KEY, JSON.stringify(apiLista));
      setLista(apiLista);
    } catch {
      // Falha de rede — mostra vazio (não cai em localStorage de outro usuário)
      setLista([]);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    carregar();
    const h = () => carregar();
    window.addEventListener('favoritos-changed', h);
    return () => window.removeEventListener('favoritos-changed', h);
  }, [carregar]);

  return lista;
}

// ── Hook: true se favoritado ───────────────────────────────────────────────
export function useEhFavorito(id: string): boolean {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [fav, setFav] = useState(false);

  const checar = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setFav(false);
      return;
    }

    try {
      const ids = await apiIds();
      setFav(ids.includes(id));
    } catch {
      setFav(false);
    }
  }, [id, isAuthenticated, authLoading]);

  useEffect(() => {
    checar();
    const h = () => checar();
    window.addEventListener('favoritos-changed', h);
    return () => window.removeEventListener('favoritos-changed', h);
  }, [checar]);

  return fav;
}

// ── Toggle (adicionar/remover) ─────────────────────────────────────────────
// toggleFavorito é chamada de CardEmpreendimento que já verifica isAuthenticated
// antes de chamar — aqui apenas executa a operação na API
export async function toggleFavorito(emp: Empreendimento): Promise<boolean> {
  if (!isLogadoCookie()) return false;

  try {
    const ids = await apiIds();
    const era = ids.includes(emp.id);
    if (era) {
      await favoritosApi.remover(emp.id);
      lsRemover(emp.id);
    } else {
      await favoritosApi.adicionar(emp.id);
    }
    emitir();
    return !era;
  } catch {
    return false;
  }
}

// ── Remover ────────────────────────────────────────────────────────────────
export async function removerFavorito(id: string): Promise<void> {
  if (isLogadoCookie()) {
    try { await favoritosApi.remover(id); } catch { /* ignora */ }
  }
  lsRemover(id);
  emitir();
}
