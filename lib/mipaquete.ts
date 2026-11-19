/**
 * Mipaquete.com API v2 client (shipping quotes with Colombian carriers). SERVER ONLY.
 * Docs: https://api.documentacion.mipaquete.com/
 *
 * Env:
 *   MIPAQUETE_API_KEY     (required) key created in Mipaquete → Integraciones → Clave de Api
 *   MIPAQUETE_API_URL     (optional) defaults to https://api-v2.mpr.mipaquete.com
 *   MIPAQUETE_ORIGIN_DANE (optional) 8-digit DANE code of the dispatch store; defaults to Quimbaya
 *
 * The origin is never sent to the browser: customers only see carrier, cost and days.
 */

const DEFAULT_API_URL = 'https://api-v2.mpr.mipaquete.com'
/** Every order ships from the Quimbaya store (Calle 18 No 5-23). */
const DEFAULT_ORIGIN_DANE = '63594000'
/** Any stable id works as Mipaquete's session-tracker header. */
const SESSION_TRACKER = '4d1c2f6e-5b8a-4e0f-9a3d-lila00store01'
const TIMEOUT_MS = 10_000

import {
  DANE_CODE_RE,
  type ShippingCity,
  type ShippingOption,
  type ShippingPackage,
} from './shippingShared'

export { DANE_CODE_RE }
export type { ShippingCity, ShippingOption, ShippingPackage }

export class MipaqueteError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

export function isMipaqueteConfigured(): boolean {
  return Boolean(process.env.MIPAQUETE_API_KEY?.trim())
}

function originDane(): string {
  const code = process.env.MIPAQUETE_ORIGIN_DANE?.trim()
  return code && DANE_CODE_RE.test(code) ? code : DEFAULT_ORIGIN_DANE
}

async function mpFetch(path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<unknown> {
  const apiKey = process.env.MIPAQUETE_API_KEY?.trim()
  if (!apiKey) throw new MipaqueteError('MIPAQUETE_API_KEY is not set')
  const base = (process.env.MIPAQUETE_API_URL?.trim() || DEFAULT_API_URL).replace(/\/$/, '')

  const response = await fetch(`${base}${path}`, {
    method: init.method,
    headers: {
      apikey: apiKey,
      'session-tracker': SESSION_TRACKER,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    console.error('[mipaquete]', path, response.status, data)
    throw new MipaqueteError(`Mipaquete ${path} failed (${response.status})`, response.status)
  }
  return data
}

type Row = Record<string, unknown>
const str = (row: Row, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return ''
}
const num = (row: Row, ...keys: string[]) => {
  for (const key of keys) {
    const value = Number(row[key])
    if (Number.isFinite(value)) return value
  }
  return NaN
}
const asRows = (data: unknown, ...wrappers: string[]): Row[] => {
  if (Array.isArray(data)) return data as Row[]
  if (data && typeof data === 'object') {
    for (const key of wrappers) {
      const inner = (data as Row)[key]
      if (Array.isArray(inner)) return inner as Row[]
    }
  }
  return []
}

/** Every Colombian municipality Mipaquete can deliver to, with its DANE code. */
export async function fetchShippingCities(): Promise<ShippingCity[]> {
  const data = await mpFetch('/getLocations', { method: 'GET' })
  const cities = asRows(data, 'locations', 'data', 'result')
    .map(row => ({
      code: str(row, 'locationCode', 'code', 'location_code', 'daneCode').padStart(8, '0'),
      name: str(row, 'locationName', 'name', 'location_name', 'cityName'),
      department: str(row, 'departmentOrStateName', 'departmentName', 'department', 'stateName'),
    }))
    .filter(c => DANE_CODE_RE.test(c.code) && c.name)
  if (!cities.length) throw new MipaqueteError('Mipaquete returned no locations')
  return cities.sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/** Quotes one package from the dispatch store to `destinyCode`. Cheapest first. */
export async function quoteShipping(params: {
  destinyCode: string
  pkg: ShippingPackage
  declaredValue: number
}): Promise<ShippingOption[]> {
  const data = await mpFetch('/quoteShipping', {
    method: 'POST',
    body: {
      originLocationCode: originDane(),
      destinyLocationCode: params.destinyCode,
      height: params.pkg.heightCm,
      width: params.pkg.widthCm,
      length: params.pkg.lengthCm,
      weight: params.pkg.weightKg,
      quantity: 1,
      declaredValue: Math.max(1, Math.round(params.declaredValue)),
      saleValue: 0, // 0 = prepaid shipping (no cash on delivery)
    },
  })

  return asRows(data, 'deliveryCompanies', 'data', 'result')
    .map(row => {
      const minutes = num(row, 'shippingTime')
      return {
        id: str(row, 'deliveryCompanyId', 'id', '_id'),
        carrier: str(row, 'deliveryCompanyName', 'name', 'companyName'),
        cost: Math.round(num(row, 'shippingCost', 'price', 'totalCost', 'value')),
        days: Number.isFinite(minutes) && minutes > 0 ? Math.max(1, Math.ceil(minutes / 1440)) : null,
      }
    })
    .filter(o => o.id && o.carrier && Number.isFinite(o.cost) && o.cost > 0)
    .sort((a, b) => a.cost - b.cost)
}
