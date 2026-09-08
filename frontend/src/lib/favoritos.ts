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
// Retorna IDs ou lança erro (para distinguir falha de lista vazia)
async function apiIds(): Promise<string[]> {
  const r = await favoritosApi.listarIds();
  return Array.isArray(r.data) ? r.data : [];
}

// Retorna lista ou lança erro (para distinguir falha de lista vazia)
async function apiListar(): Promise<Empreendimento[]> {
  const r = await favoritosApi.listar();
  return Array.isArray(r.data) ? r.data : [];
}

// ── Hook: lista completa ───────────────────────────────────────────────────
export function useFavoritos(): Empreendimento[] {
  const [lista, setLista] = useState<Empreendimento[]>([]);

  const carregar = useCallback(async () => {
    if (isLogado()) {
      try {
        // Para usuário logado, a API é fonte de verdade.
        // Lista vazia = nenhum favorito (não cai no localStorage de outro usuário).
        const apiLista = await apiListar();
        localStorage.setItem(LS_KEY, JSON.stringify(apiLista));
        setLista(apiLista);
      } catch {
        // Só usa localStorage se a API falhar por erro de rede / offline
        setLista(lsLer());
      }
    } else {
      // Visitante não logado — lista sempre vazia (não lê localStorage)
      setLista([]);
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
      try {
        // API é fonte de verdade para usuário logado
        const ids = await apiIds();
        setFav(ids.includes(id));
      } catch {
        // Offline: usa localStorage como fallback
        setFav(lsLer().some(f => f.id === id));
      }
      return;
    }
    // Visitante não logado — nunca favorito
    setFav(false);
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
    // Visitante não logado — não salva em lugar nenhum
    return false;
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
