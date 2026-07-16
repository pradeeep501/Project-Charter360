'use client';

import { createClient } from '@supabase/supabase-js';

let cached = null;

/**
 * Returns a Supabase client if the public env vars are configured, otherwise
 * null. When null, the store falls back to browser localStorage.
 */
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!cached) cached = createClient(url, key);
  return cached;
}

export function isCloudBacked() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
