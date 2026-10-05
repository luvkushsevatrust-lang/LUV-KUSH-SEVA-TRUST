import { createClient } from '@supabase/supabase-js';

// Supabase project credentials provided by user
export const SUPABASE_PROJECT_ID = 'yjbowhkgwatrwmuyvkja';

/**
 * Normalizes any Supabase URL, project ref, or environment variable
 * into a valid https://<project-ref>.supabase.co URL.
 */
export function normalizeSupabaseUrl(rawUrlOrId?: string): string {
  if (!rawUrlOrId || typeof rawUrlOrId !== 'string') {
    return `https://${SUPABASE_PROJECT_ID}.supabase.co`;
  }
  let trimmed = rawUrlOrId.trim();
  // Remove wrapping quotes if present
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (!trimmed) {
    return `https://${SUPABASE_PROJECT_ID}.supabase.co`;
  }

  // If it's already a full HTTP or HTTPS URL
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  // If it's something like "yjbowhkgwatrwmuyvkja.supabase.co"
  if (trimmed.includes('.')) {
    return `https://${trimmed}`;
  }

  // If it's just the project ref / ID like "yjbowhkgwatrwmuyvkja"
  return `https://${trimmed}.supabase.co`;
}

export const SUPABASE_URL = normalizeSupabaseUrl(import.meta.env?.VITE_SUPABASE_URL);

export const SUPABASE_ANON_KEY =
  ((import.meta.env?.VITE_SUPABASE_ANON_KEY as string)?.trim()) ||
  'sb_publishable_zCqUt1Wk7zPM3Geklq7Bcw_vmj5rJx9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
