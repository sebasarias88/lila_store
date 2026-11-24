import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client with the SECRET key (service role). Server-only: it bypasses
 * RLS, so it is used exclusively by API routes that validate everything first
 * (creating orders, payment webhooks). Never import it from a client component.
 *
 * Vercel → Settings → Environment Variables:
 *   SUPABASE_SECRET_KEY = sb_secret_…  (Sensitive, never NEXT_PUBLIC_)
 */
export function createSupabaseSecret(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseSecret() must only run on the server')
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim()
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
