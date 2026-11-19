import { cache } from 'react'
import { createSupabasePublic } from '@/lib/supabase-public'
import type { Sucursal } from '@/lib/negocio'

/** Columns the storefront needs (admin selects its own). */
export const SUCURSAL_PUBLIC_COLUMNS = 'id, ciudad, direccion, telefono, nota, orden'

/**
 * Active stores, in the admin's order. Server only (cookie-less client, ISR friendly).
 * Throws on DB errors so ISR keeps serving the last good page.
 */
export const getSucursales = cache(async (): Promise<Sucursal[]> => {
  const { data, error } = await createSupabasePublic()
    .from('sucursales')
    .select(SUCURSAL_PUBLIC_COLUMNS)
    .eq('activa', true)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(`[sucursales] ${error.message}`)
  return (data ?? []) as Sucursal[]
})
