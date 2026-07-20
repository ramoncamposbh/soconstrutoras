'use client';

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { favoritosApi } from './api';
import type { Empreendimento } from '@/types';

// ── localStorage ──────────────────────────────────────────────────────────
const LS_KEY = 'sc_favoritos';

function lsLer(): Empreendimento[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

function lsToggle(emp: Empreendimento): boolean {
  const lista = lsLer();
  const idx = lista.findIndex(f => f.id === emp.id);
  if (idx >= 0) { lista.splice(idx, 1); localStorage.setItem(LS_KEY, JSON.stringify(lista)); return false; }
  lista.push(emp); localStorage.setItem(LS_KEY, JSON.stringify(lista)); return true;
}

function lsRemover(id: string) {
  localStorage.setItem(LS_KEY, JSON.stringify(lsLer().filter(f => f.id !== id)));
}

function emitir() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('favoritos-changed'));
}

function isLogado() {
  return typeof window !== 'undefined' && !!Cookies.get('token');
}

// ── API helpers ────────────────────────────────────────────────────────────
async function apiIds(): Promise<string[]> {
  try {
    const r = await favoritosApi.listarIds();
    return Array.isArray(r.data) ? r.data : [];
  } catch { return []; }
}

async function apiListar(): Promise<Empreendimento[]> {
  try {
    const r = await favoritosApi.listar();
    return Array.isArray(r.data) ? r.data : [];
  } catch { return []; }
}

// ── Hook: lista completa ───────────────────────────────────────────────────
export function useFavoritos(): Empreendimento[] {
  const [lista, setLista] = useState<Empreendimento[]>([]);

  const carregar = useCallback(async () => {
    if (isLogado()) {
      const apiLista = await apiListar();
      if (apiLista.length > 0) {
        // API funcionou — espelha no localStorage para fallback offline
        localStorage.setItem(LS_KEY, JSON.stringify(apiLista));
        setLista(apiLista);
      } else {
        // API retornou vazio ou falhou — usa localStorage como fallback
        setLista(lsLer());
      }
    } else {
      setLista(lsLer());
    }
  }, []);

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
  const [fav, setFav] = useState(false);

  const checar = useCallback(async () => {
    if (isLogado()) {
      const ids = await apiIds();
      // Se API retornou IDs, usa API; senão, checa localStorage
      if (ids.length >= 0) {
        setFav(ids.includes(id));
        return;
      }
    }
    setFav(lsLer().some(f => f.id === id));
  }, [id]);

  useEffect(() => {
    checar();
    const h = () => checar();
    window.addEventListener('favoritos-changed', h);
    return () => window.removeEventListener('favoritos-changed', h);
  }, [checar]);

  return fav;
}

// ── Toggle (adicionar/remover) ─────────────────────────────────────────────
export async function toggleFavorito(emp: Empreendimento): Promise<boolean> {
  if (isLogado()) {
    try {
      const ids = await apiIds();
      const era = ids.includes(emp.id);
      if (era) {
        await favoritosApi.remover(emp.id);
        lsRemover(emp.id);
      } else {
        await favoritosApi.adicionar(emp.id);
        // Espelha no localStorage
        const lista = lsLer();
        if (!lista.some(f => f.id === emp.id)) {
          lista.push(emp);
          localStorage.setItem(LS_KEY, JSON.stringify(lista));
        }
      }
      emitir();
      return !era;
    } catch {
      // API falhou — salva no localStorage e notifica UI
      const adicionado = lsToggle(emp);
      emitir(); // ← faltava isso na versão anterior
      return adicionado;
    }
  } else {
    const adicionado = lsToggle(emp);
    emitir();
    return adicionado;
  }
}

// ── Remover ────────────────────────────────────────────────────────────────
export async function removerFavorito(id: string): Promise<void> {
  if (isLogado()) {
    try { await favoritosApi.remover(id); } catch { /* ignora */ }
  }
  lsRemover(id);
  emitir();
}
