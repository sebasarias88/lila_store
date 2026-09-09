import { cache } from 'react'
import { createSupabasePublic } from '@/lib/supabase-public'
import type { AnuncioModal } from '@/types'
import { isAnuncioVigente } from '@/lib/anuncio-modal'

/** Anuncio modal activo y vigente (si hay varios, el más reciente). */
export const getAnuncioModalVigente = cache(async (): Promise<AnuncioModal | null> => {
  try {
    const supabase = createSupabasePublic()
    const { data, error } = await supabase
      .from('anuncio_modal')
      .select('id,activo,imagen_url,titulo,descripcion,texto_boton,producto_id,enlace_manual,fecha_inicio,fecha_fin,mostrar_una_vez_por_sesion,created_at,producto:productos(id, nombre, slug)')
      .eq('activo', true)
      .order('fecha_inicio', { ascending: false })
      .limit(5)

    if (error || !data?.length) return null

    const vigente = (data as unknown as AnuncioModal[]).find(a => isAnuncioVigente(a))
    return vigente ?? null
  } catch {
    return null
  }
})
