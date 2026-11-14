/**
 * Öffentliche Konfiguration. Der Publishable Key ist dafür gedacht, in der App zu stehen:
 * Row Level Security schützt die Daten, nicht der Schlüssel.
 * Für lokale Tests per EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY überschreibbar.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://ygielmdbgpxjqkpygsqs.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_2PJ6jyABb2GJNlteMpBefg_FAMKjG7C';
export const APP_SCHEME = 'auf3';
