'use client'

import { InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/Input'
import { formatCopInput, parseCopInput, sanitizeCopInput } from '@/lib/currency'

type CopInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  label?: string
  hint?: string
  error?: string
  value: string
  onChange: (value: string) => void
}

export function CopInput({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder = '45.000',
  onBlur,
  ...props
}: CopInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(sanitizeCopInput(e.target.value))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const parsed = parseCopInput(value)
    if (parsed !== null) {
      onChange(formatCopInput(parsed))
    }
    onBlur?.(e)
  }

  return (
    <Input
      {...props}
      label={label}
      hint={hint}
      error={error}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  )
}
