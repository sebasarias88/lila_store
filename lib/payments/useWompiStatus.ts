'use client'

import { useEffect, useState } from 'react'

/** Whether online payment (Wompi) is configured on this deployment. */
export function useWompiStatus(): { enabled: boolean; sandbox: boolean } {
  const [state, setState] = useState({ enabled: false, sandbox: false })
  useEffect(() => {
    let cancelled = false
    fetch('/api/payments/wompi', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: { enabled?: boolean; sandbox?: boolean } | null) => {
        if (!cancelled && d) setState({ enabled: Boolean(d.enabled), sandbox: Boolean(d.sandbox) })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return state
}
