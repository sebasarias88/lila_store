'use client'

/**
 * Asks the server to refresh the public store after the admin saves data.
 * Debounced: saving a product touches several tables (product, categories,
 * variations, sections) and we only want one refresh for the whole save.
 */
const DEBOUNCE_MS = 1200
let timer: ReturnType<typeof setTimeout> | undefined

export function scheduleStorefrontRefresh(): void {
  if (typeof window === 'undefined') return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = undefined
    fetch('/api/admin/revalidate', { method: 'POST', keepalive: true }).catch(() => {
      // Not critical: pages still refresh on their own within 60 seconds.
    })
  }, DEBOUNCE_MS)
}

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

/**
 * fetch wrapper for the browser Supabase client: when the admin panel makes a
 * successful write to the database (REST, not RPC reads), schedule a store refresh.
 */
export function fetchWithStorefrontRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, init).then(response => {
    try {
      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const isAdminPage = window.location.pathname.startsWith('/admin')
      const isTableWrite = url.includes('/rest/v1/') && !url.includes('/rest/v1/rpc/')
      if (response.ok && isAdminPage && isTableWrite && WRITE_METHODS.has(method)) {
        scheduleStorefrontRefresh()
      }
    } catch {
      // Never break the original request.
    }
    return response
  })
}
