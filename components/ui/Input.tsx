'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

const baseInput = `
  admin-input w-full rounded-xl border px-4 py-3 text-[13px] md:rounded-[2px]
  transition-[border-color,box-shadow,background-color] duration-200 disabled:opacity-40
`

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="admin-form-label">{label}</label>}
      <input className={`${baseInput} ${className}`} {...props} />
      {hint && !error && <p className="admin-form-hint">{hint}</p>}
      {error && (
        <p className="text-[10px] tracking-[0.3px] text-red-400">{error}</p>
      )}
    </div>
  )
}

export function Textarea({ label, error, hint, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="admin-form-label">{label}</label>}
      <textarea
        rows={4}
        className={`${baseInput} resize-none ${className}`}
        {...props}
      />
      {hint && !error && <p className="admin-form-hint">{hint}</p>}
      {error && (
        <p className="text-[10px] tracking-[0.3px] text-red-400">{error}</p>
      )}
    </div>
  )
}

/** Select con el mismo lenguaje visual que admin-input */
export const adminSelectClass =
  'admin-select admin-input w-full rounded-xl px-4 py-3 text-[13px] md:rounded-[2px]'
