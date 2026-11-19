/*
 * Lila Store service worker — offline support.
 *
 * Strategy (kept deliberately small and safe):
 * - Pages (navigations): network first. Successful pages are saved so they can be
 *   reopened without internet. If the network fails: saved copy → /offline page.
 * - /_next/static/* (hashed, immutable files): cache first.
 * - Images from img.lilastore.com.co are NOT stored here: they already have a
 *   1-year immutable HTTP cache, which the browser serves even offline.
 * - Files precached at install (offline page, logo, manifest) are served cache first,
 *   so the offline page shows the logo without internet.
 * - /admin and /api are never touched.
 *
 * To ship a new service worker, bump VERSION.
 */
const VERSION = 'v1'
const PAGE_CACHE = `lila-pages-${VERSION}`
const STATIC_CACHE = `lila-static-${VERSION}`
const OFFLINE_URL = '/offline'
const MAX_PAGES = 40
const PRECACHE = [OFFLINE_URL, '/icon.png', '/icons/icon-192.png', '/manifest.webmanifest']
// Assets (not pages) from PRECACHE, matched by pathname so query strings don't matter.
const PRECACHE_PATHS = new Set(PRECACHE.filter(path => path !== OFFLINE_URL))

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      await cache.addAll(PRECACHE)
      // Also store the CSS/JS the offline page needs, so it renders styled without internet.
      const offline = await cache.match(OFFLINE_URL)
      const html = offline ? await offline.text() : ''
      const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])]
      await Promise.all(assets.map(url => cache.add(url).catch(() => undefined)))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keep = [PAGE_CACHE, STATIC_CACHE]
      const names = await caches.keys()
      await Promise.all(names.filter(n => n.startsWith('lila-') && !keep.includes(n)).map(n => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

function isBypassed(url) {
  return url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')
}

async function trimPages(cache) {
  const keys = await cache.keys()
  const extra = keys.length - MAX_PAGES
  for (let i = 0; i < extra; i++) await cache.delete(keys[i])
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(PAGE_CACHE)
      await cache.put(request, response.clone())
      trimPages(cache)
    }
    return response
  } catch {
    const cached = await caches.match(request, { ignoreSearch: false })
    if (cached) return cached
    return (await caches.match(OFFLINE_URL)) || Response.error()
  }
}

async function handleStatic(request) {
  const cached = await caches.match(request, { ignoreSearch: true })
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || isBypassed(url)) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  if (url.pathname.startsWith('/_next/static/') || PRECACHE_PATHS.has(url.pathname)) {
    event.respondWith(handleStatic(request))
  }
})
