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

// ── Cache compartilhado de IDs (evita N chamadas, uma por card) ───────────
let _idsCache: string[] = [];
let _idsCacheTs = 0;
let _idsFetching: Promise<string[]> | null = null;

async function apiIdsCached(forceRefresh = false): Promise<string[]> {
  const agora = Date.now();
  // Usa cache se tem menos de 60s e não é refresh forçado
  if (!forceRefresh && agora - _idsCacheTs < 60_000) return _idsCache;
  // Deduplicação: se já está buscando, aguarda a mesma Promise
  if (!_idsFetching) {
    _idsFetching = favoritosApi.listarIds()
      .then(r => {
        _idsCache = Array.isArray(r.data) ? r.data : [];
        _idsCacheTs = Date.now();
        return _idsCache;
      })
      .finally(() => { _idsFetching = null; });
  }
  return _idsFetching;
}

function invalidarCache() {
  _idsCacheTs = 0;
}

async function apiListar(): Promise<Empreendimento[]> {
  const r = await favoritosApi.listar();
  return Array.isArray(r.data) ? r.data : [];
}

// ── Hook: lista completa ───────────────────────────────────────────────────
export function useFavoritos(): Empreendimento[] {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [lista, setLista] = useState<Empreendimento[]>([]);

  const carregar = useCallback(async () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY);
      setLista([]);
      return;
    }
    try {
      const apiLista = await apiListar();
      localStorage.setItem(LS_KEY, JSON.stringify(apiLista));
      setLista(apiLista);
    } catch {
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

// ── Hook: true se favoritado — usa cache compartilhado ────────────────────
export function useEhFavorito(id: string): boolean {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [fav, setFav] = useState(false);

  const checar = useCallback(async () => {
    if (authLoading) return;
    if (!isAuthenticated) { setFav(false); return; }
    try {
      const ids = await apiIdsCached();
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

// ── Toggle — atualiza cache local imediatamente, sincroniza API em background
export async function toggleFavorito(emp: Empreendimento): Promise<boolean> {
  try {
    const ids = await apiIdsCached();
    const era = ids.includes(emp.id);

    // Atualiza cache local imediatamente (antes da API responder)
    if (era) {
      _idsCache = _idsCache.filter(i => i !== emp.id);
      lsRemover(emp.id);
    } else {
      _idsCache = [..._idsCache, emp.id];
    }
    _idsCacheTs = Date.now(); // marca cache como fresco

    // Notifica componentes com o cache já atualizado
    emitir();

    // Sincroniza com API em background
    if (era) {
      await favoritosApi.remover(emp.id);
    } else {
      await favoritosApi.adicionar(emp.id);
    }

    // Invalida cache para próxima leitura buscar do servidor
    invalidarCache();

    return !era;
  } catch {
    // Em caso de erro, invalida cache para forçar re-fetch correto
    invalidarCache();
    emitir();
    return false;
  }
}

// ── Remover ────────────────────────────────────────────────────────────────
export async function removerFavorito(id: string): Promise<void> {
  // Atualiza cache local
  _idsCache = _idsCache.filter(i => i !== id);
  lsRemover(id);
  emitir();
  // API em background
  try { await favoritosApi.remover(id); } catch { /* ignora */ }
  invalidarCache();
}
