import { cache } from 'react'
import { createSupabaseServer } from '@/lib/supabase-server'
import type { AnuncioModal } from '@/types'
import { isAnuncioVigente } from '@/lib/anuncio-modal'

/** Anuncio modal activo y vigente (si hay varios, el más reciente). */
export const getAnuncioModalVigente = cache(async (): Promise<AnuncioModal | null> => {
  try {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase
      .from('anuncio_modal')
      .select('*, producto:productos(id, nombre, slug)')
      .eq('activo', true)
      .order('fecha_inicio', { ascending: false })
      .limit(5)

    if (error || !data?.length) return null

    const vigente = (data as AnuncioModal[]).find(a => isAnuncioVigente(a))
    return vigente ?? null
  } catch {
    return null
  }
})
