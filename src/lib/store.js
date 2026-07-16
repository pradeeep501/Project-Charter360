'use client';

// Storage abstraction. Uses Supabase when configured, otherwise localStorage.
// Both paths run in the browser and share the same charter document shape.

import { getSupabase } from './supabase';

const LS_KEY = 'project-charters-v1';

function lsRead() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function lsWrite(map) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(map));
}

export async function listCharters() {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('charters')
      .select('id, data, updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({ ...row.data, id: row.id }));
  }
  const map = lsRead();
  return Object.values(map).sort(
    (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''),
  );
}

export async function getCharter(id) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('charters')
      .select('id, data')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { ...data.data, id: data.id };
  }
  const map = lsRead();
  return map[id] || null;
}

export async function saveCharter(charter) {
  const next = { ...charter, updatedAt: new Date().toISOString() };
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb
      .from('charters')
      .upsert({ id: next.id, data: next, updated_at: next.updatedAt });
    if (error) throw error;
    return next;
  }
  const map = lsRead();
  map[next.id] = next;
  lsWrite(map);
  return next;
}

export async function deleteCharter(id) {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('charters').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const map = lsRead();
  delete map[id];
  lsWrite(map);
}
