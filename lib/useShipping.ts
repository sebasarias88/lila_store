'use client'

import { useEffect, useState } from 'react'
import type { ShippingCity, ShippingOption } from '@/lib/shippingShared'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

let citiesPromise: Promise<ShippingCity[]> | null = null

function loadCities(): Promise<ShippingCity[]> {
  citiesPromise ??= fetch('/api/shipping/cities')
    .then(async r => {
      if (!r.ok) throw new Error(String(r.status))
      const data = (await r.json()) as { cities?: ShippingCity[] }
      if (!data.cities?.length) throw new Error('empty')
      return data.cities
    })
    .catch(error => {
      citiesPromise = null // allow a retry on the next mount
      throw error
    })
  return citiesPromise
}

/** Destination cities (DANE codes) for the checkout. Loaded once per visit. */
export function useShippingCities(enabled: boolean) {
  const [state, setState] = useState<{ status: LoadStatus; cities: ShippingCity[] }>({
    status: 'idle',
    cities: [],
  })
  useEffect(() => {
    if (!enabled) return
    let active = true
    setState(s => (s.status === 'ready' ? s : { status: 'loading', cities: [] }))
    loadCities()
      .then(cities => active && setState({ status: 'ready', cities }))
      .catch(() => active && setState({ status: 'error', cities: [] }))
    return () => {
      active = false
    }
  }, [enabled])
  return state
}

/**
 * Live Mipaquete quote for the cart. Re-quotes (debounced) when the city,
 * subtotal or number of units change; stale responses are discarded.
 */
export function useShippingQuote(params: {
  cityCode: string
  subtotal: number
  units: number
  enabled: boolean
}) {
  const { cityCode, subtotal, units, enabled } = params
  const [state, setState] = useState<{ status: LoadStatus; options: ShippingOption[]; key: string }>({
    status: 'idle',
    options: [],
    key: '',
  })
  const key = enabled && cityCode ? `${cityCode}|${subtotal}|${units}` : ''

  useEffect(() => {
    if (!key) {
      setState({ status: 'idle', options: [], key: '' })
      return
    }
    const controller = new AbortController()
    setState(s => ({ status: 'loading', options: s.key.startsWith(cityCode) ? s.options : [], key }))
    const timer = setTimeout(() => {
      fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityCode, subtotal, units }),
        signal: controller.signal,
      })
        .then(async r => {
          const data = (await r.json().catch(() => ({}))) as { options?: ShippingOption[] }
          if (!r.ok || !data.options?.length) throw new Error(String(r.status))
          setState({ status: 'ready', options: data.options, key })
        })
        .catch(error => {
          if ((error as Error).name === 'AbortError') return
          setState({ status: 'error', options: [], key })
        })
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, cityCode, subtotal, units])

  return { status: state.status, options: state.options }
}
