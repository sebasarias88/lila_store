import { createClient } from '@supabase/supabase-js'

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Add them in Vercel → Project → Settings → Environment Variables, then redeploy.',
    )
  }

  return { url, anonKey }
}

/**
 * Cliente Supabase sin cookies/sesión — lecturas públicas del catálogo.
 * Permite ISR/cache sin disparar Auth en cada request.
 */
export function createSupabasePublic() {
  const { url, anonKey } = getSupabaseEnv()
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
