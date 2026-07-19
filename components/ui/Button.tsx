'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  fullWidth?: boolean
}

const variants = {
  primary: 'ui-btn--primary',
  outline: 'ui-btn--outline',
  ghost: 'ui-btn--ghost',
  danger:
    'bg-transparent text-[var(--danger)] border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]',
}

const sizes = {
  sm: 'px-3.5 py-2 text-[12px] font-semibold',
  md: 'px-5 py-3 text-[13px] font-semibold',
  lg: 'px-7 py-3.5 text-[14px] font-semibold',
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      className={`
        ui-btn inline-flex items-center justify-center gap-2
        rounded-full transition-all duration-200
        cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && <Loader2 size={12} className="animate-spin" />}
      {children}
    </motion.button>
  )
}
