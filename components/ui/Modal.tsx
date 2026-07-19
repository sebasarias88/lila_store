'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ReactNode } from 'react'
import { useScrollLock } from '@/lib/useScrollLock'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useScrollLock(open)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-[rgba(58,46,61,0.42)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className={`fixed left-1/2 top-1/2 z-50 flex w-full max-h-[min(90vh,100dvh)] -translate-x-1/2 -translate-y-1/2 flex-col ${sizes[size]} max-md:inset-0 max-md:left-0 max-md:top-0 max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            {title ? (
              <div className="mobile-admin-modal-header">
                <div className="mobile-admin-bar">
                  <div className="mobile-admin-bar-row">
                    <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-[var(--text-primary)]">
                      {title}
                    </h2>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] active:bg-[var(--bg-muted)]"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className="mobile-admin-modal-body flex min-h-0 flex-1 flex-col overflow-hidden md:block md:overflow-y-auto md:overscroll-contain md:px-6 md:py-5"
              data-lenis-prevent
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
