'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'

type Estado = 'online' | 'offline' | 'reconectado'

export default function ConnectionStatus() {
  const [estado, setEstado] = useState<Estado>('online')
  // Se incrementa cuando se bloquea una navegación estando offline (para "remarcar" el aviso)
  const [nudge, setNudge] = useState(0)

  useEffect(() => {
    if (!navigator.onLine) setEstado('offline')

    const handleOffline = () => setEstado('offline')
    const handleOnline = () => {
      setEstado('reconectado')
      window.setTimeout(() => setEstado('online'), 3500)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Bloquea navegaciones internas mientras no hay conexión para evitar
  // la pantalla de error del navegador (ERR_INTERNET_DISCONNECTED).
  useEffect(() => {
    const remarcarOffline = () => {
      setEstado('offline')
      setNudge(n => n + 1)
    }

    const onClickCapture = (e: MouseEvent) => {
      if (navigator.onLine) return
      // Respeta clics con modificadores (abrir en pestaña nueva, etc.)
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }

      const target = e.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (anchor.target && anchor.target !== '_self') return
      if (/^(mailto:|tel:|sms:|whatsapp:)/i.test(href)) return

      // Permitir solo si es un enlace externo de otro origen (igual fallará, pero no es navegación interna)
      const esInterno =
        href.startsWith('/') ||
        href.startsWith(window.location.origin)
      if (!esInterno) return

      e.preventDefault()
      e.stopPropagation()
      remarcarOffline()
    }

    // Evita que los formularios (búsqueda, etc.) provoquen una navegación dura offline.
    const onSubmitCapture = (e: Event) => {
      if (navigator.onLine) return
      e.preventDefault()
      e.stopPropagation()
      remarcarOffline()
    }

    document.addEventListener('click', onClickCapture, true)
    document.addEventListener('submit', onSubmitCapture, true)
    // Disparado por useGuardedRouter cuando se bloquea un push/replace offline.
    window.addEventListener('offline-nav-blocked', remarcarOffline)
    return () => {
      document.removeEventListener('click', onClickCapture, true)
      document.removeEventListener('submit', onSubmitCapture, true)
      window.removeEventListener('offline-nav-blocked', remarcarOffline)
    }
  }, [])

  const visible = estado !== 'online'
  const offline = estado === 'offline'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`${estado}-${nudge}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-[200] flex justify-center px-4"
        >
          <div
            className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-[12px] font-light tracking-[0.3px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md ${
              offline
                ? 'border-[rgba(248,113,113,0.35)] bg-[rgba(40,12,12,0.92)] text-red-200'
                : 'border-[rgba(74,222,128,0.35)] bg-[rgba(10,32,18,0.92)] text-emerald-200'
            }`}
          >
            {offline ? (
              <WifiOff size={15} className="shrink-0" />
            ) : (
              <Wifi size={15} className="shrink-0" />
            )}
            <span>
              {offline
                ? 'Sin conexión a internet. Revisa tu red para seguir navegando.'
                : 'Conexión restablecida'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
