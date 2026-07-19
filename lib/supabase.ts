import { createBrowserClient } from '@supabase/ssr'

type BrowserClient = ReturnType<typeof createBrowserClient>

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Add them in Vercel → Project → Settings → Environment Variables ' +
        '(Production and Preview), then redeploy. ' +
        'Values: Supabase → Project Settings → API.',
    )
  }

  return { url, anonKey }
}

export function createClient() {
  const { url, anonKey } = getSupabaseEnv()
  return createBrowserClient(url, anonKey)
}

let browserClient: BrowserClient | undefined

function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}

/**
 * Lazy singleton: no crea el client en import-time.
 * Evita que el build de Vercel muera al prerenderizar /admin/login
 * solo por evaluar el módulo (sin las env vars aún no se usa).
 */
export const supabase: BrowserClient = new Proxy({} as BrowserClient, {
  get(_target, prop, _receiver) {
    const client = getBrowserClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
