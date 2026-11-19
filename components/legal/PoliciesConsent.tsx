'use client'

import Link from 'next/link'

/**
 * Checkout consent (Ley 1581 de 2012): unchecked by default, required to send
 * the order. The acceptance is recorded in the WhatsApp order message.
 */
export default function PoliciesConsent({
  checked,
  error,
  onChange,
  compact = false,
}: {
  checked: boolean
  error?: string
  onChange: (checked: boolean) => void
  compact?: boolean
}) {
  return (
    <div>
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-[18px] border px-3.5 py-3 transition-colors ${
          error
            ? 'border-red-300 bg-red-50/60'
            : 'border-[var(--border)] bg-[var(--bg-surface)]'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? 'policies-consent-error' : undefined}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--accent-primary)]"
        />
        <span
          className={`font-medium leading-snug text-[var(--text-secondary)] ${
            compact ? 'text-[12px]' : 'text-[13px]'
          }`}
        >
          Acepto los{' '}
          <Link
            href="/terminos-y-condiciones"
            target="_blank"
            className="font-bold text-[var(--accent-deep)] underline underline-offset-2"
          >
            términos y condiciones
          </Link>{' '}
          y autorizo el tratamiento de mis datos según la{' '}
          <Link
            href="/politica-de-privacidad"
            target="_blank"
            className="font-bold text-[var(--accent-deep)] underline underline-offset-2"
          >
            política de privacidad
          </Link>
          . *
        </span>
      </label>
      {error ? (
        <p id="policies-consent-error" className="mt-1.5 text-[12px] font-medium text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
