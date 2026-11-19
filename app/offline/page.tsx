import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Sin conexión',
  robots: { index: false, follow: false },
}

/**
 * Fully static page (no database) precached by the service worker.
 * Works without JavaScript: "Reintentar" is a plain link.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-base)] px-6 text-center">
      <Image src="/icon.png" alt="Lila Store" width={96} height={96} priority className="mb-7 rounded-[24px]" />
      <p className="mb-2 text-[13px] font-bold text-[var(--accent-deep)]">Sin conexión</p>
      <h1 className="max-w-md text-[26px] font-extrabold leading-tight text-[var(--text-primary)]">
        Parece que no tienes internet
      </h1>
      <p className="mt-3 max-w-sm text-[15px] font-medium leading-relaxed text-[var(--text-secondary)]">
        Revisa tus datos o el Wi‑Fi. Las páginas que ya visitaste siguen disponibles y tu carrito
        está guardado en este dispositivo 💕
      </p>
      {/* Plain <a> on purpose: must work offline without JavaScript (full reload). */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--accent-primary)] px-8 py-3 text-[14px] font-bold text-white"
      >
        Reintentar
      </a>
    </main>
  )
}
