'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, X } from 'lucide-react'
import { ReactNode } from 'react'
import { useScrollLock } from '@/lib/useScrollLock'

type MobileBottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  headerContent?: ReactNode
  /** close = X, back = chevron (requires onBack) */
  headerAction?: 'close' | 'back'
  onBack?: () => void
  /** auto = fit content, tall = ~92dvh max */
  height?: 'auto' | 'tall' | 'full'
  showClose?: boolean
}

export default function MobileBottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  headerContent,
  headerAction = 'close',
  onBack,
  height = 'tall',
  showClose = true,
}: MobileBottomSheetProps) {
  useScrollLock(open)

  const heightClass =
    height === 'full'
      ? 'max-h-[min(96dvh,100dvh)]'
      : height === 'auto'
        ? 'max-h-[min(70dvh,100dvh)]'
        : 'max-h-[min(88dvh,100dvh)]'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="mobile-sheet-backdrop fixed inset-0 z-[55] bg-[var(--overlay-backdrop)] backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`mobile-bottom-sheet fixed inset-x-0 bottom-0 z-[60] flex ${heightClass} min-h-0 flex-col rounded-t-xl border-t border-[var(--border)] bg-[var(--bg-card)] shadow-[0_-16px_48px_rgba(34,34,34,0.12)] mobile-safe-bottom`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.85 }}
            onClick={e => e.stopPropagation()}
            data-lenis-prevent
          >
            <div className="flex shrink-0 flex-col items-center pt-3 pb-1">
              <div className="mobile-sheet-handle h-1 w-10 rounded-full bg-[var(--border-input)]" aria-hidden />
            </div>

            {(title || headerContent || showClose || headerAction === 'back') && (
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 pb-4 pt-1">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  {headerAction === 'back' && onBack ? (
                    <button
                      type="button"
                      onClick={onBack}
                      className="mobile-catalog-icon-btn mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[var(--bg-muted)] active:text-[var(--text-primary)]"
                      aria-label="Volver"
                    >
                      <ChevronLeft size={22} />
                    </button>
                  ) : null}
                  {headerContent ?? (
                    <div className="min-w-0">
                      {title && (
                        <h2 className="text-[13px] font-semibold uppercase tracking-[2.5px] text-[var(--text-primary)]">
                          {title}
                        </h2>
                      )}
                      {subtitle && (
                        <p className="mt-1 text-[12px] font-light text-[var(--text-muted)]">{subtitle}</p>
                      )}
                    </div>
                  )}
                </div>
                {showClose && headerAction === 'close' ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="mobile-catalog-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-input)] bg-[var(--bg-muted)] text-[var(--text-muted)] active:border-[var(--gold)] active:text-[var(--gold)]"
                    aria-label="Cerrar"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

            {footer ? (
              <div className="mobile-sheet-footer shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
