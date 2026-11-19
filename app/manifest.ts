import type { MetadataRoute } from 'next'

/**
 * Web App Manifest: name, icons and colors used when the store is added
 * to the home screen on Android/iPhone ("install as app").
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lila Store',
    short_name: 'Lila Store',
    description: 'Maquillaje, skincare y cuidado capilar en Armenia y Quimbaya, Quindío. Envíos a toda Colombia.',
    lang: 'es-CO',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F9F6FF',
    theme_color: '#A989E0',
    categories: ['shopping', 'beauty'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
