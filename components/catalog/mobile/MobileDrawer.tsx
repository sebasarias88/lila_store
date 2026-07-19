'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ReactNode } from 'react'
import { useScrollLock } from '@/lib/useScrollLock'

type MobileDrawerProps = {
  open: boolean
  onClose: () => void
  title?: string
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right' | 'bottom'
}

export default function MobileDrawer({
  open,
  onClose,
  title,
  header,
  children,
  footer,
  side = 'left',
}: MobileDrawerProps) {
  useScrollLock(open)

  const panelClass =
    side === 'bottom'
      ? 'mobile-drawer-panel fixed inset-x-0 bottom-0 z-50 flex max-h-[min(92dvh,100dvh)] min-h-0 flex-col rounded-t-xl border-t border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-dropdown)] mobile-safe-bottom'
      : side === 'right'
        ? 'fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-sm min-h-0 flex-col border-l border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-dropdown)]'
        : 'fixed left-0 top-0 z-50 flex h-[100dvh] w-full max-w-[min(100%,20rem)] min-h-0 flex-col border-r border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-dropdown)]'

  const initial =
    side === 'bottom' ? { y: '100%' } : side === 'right' ? { x: '100%' } : { x: '-100%' }
  const animate = side === 'bottom' ? { y: 0 } : { x: 0 }
  const exit = initial

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-40 bg-[var(--overlay-backdrop)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title ?? (typeof header === 'string' ? header : 'Panel')}
            className={panelClass}
            initial={initial}
            animate={animate}
            exit={exit}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            onClick={e => e.stopPropagation()}
            data-lenis-prevent
          >
            {(title || header) && (
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-4">
                {header ?? (
                  <h2 className="text-[12px] font-medium uppercase tracking-[2.5px] text-[var(--text-primary)]">
                    {title}
                  </h2>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors active:bg-[var(--bg-muted)] active:text-[var(--text-primary)]"
                  aria-label="Cerrar panel"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

            {footer ? (
              <div className="mobile-drawer-footer shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
