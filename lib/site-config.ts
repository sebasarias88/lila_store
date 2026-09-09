import { cache } from 'react'
import { createSupabasePublic } from '@/lib/supabase-public'
import {
  SITE_BRAND_NAME,
  SEO_HOME_DESCRIPTION,
  SEO_DEFAULT_KEYWORDS,
} from '@/lib/seo-brand'

export type SiteConfigMap = Record<string, string>

export const getSiteConfig = cache(async (): Promise<SiteConfigMap> => {
  try {
    const supabase = createSupabasePublic()
    const { data } = await supabase.from('configuracion').select('clave, valor')
    const config: SiteConfigMap = {}
    data?.forEach(row => {
      config[row.clave] = row.valor
    })
    return config
  } catch {
    return {}
  }
})

/** Nombre de marca para UI y SEO. Normaliza variantes "lila-store" / "lila store". */
export function getSiteName(config: SiteConfigMap): string {
  const raw = config.nombre_negocio?.trim()
  if (!raw) return SITE_BRAND_NAME
  if (/^lila([-\s]?store)?$/i.test(raw)) return SITE_BRAND_NAME
  return raw
}

export function getSiteDescription(config: SiteConfigMap): string {
  const seo = config.seo_descripcion?.trim()
  const hero = config.hero_subtitulo?.trim()
  const clean = (text?: string) => (text && !/ritual/i.test(text) ? text : '')
  return clean(seo) || clean(hero) || SEO_HOME_DESCRIPTION
}

export function getSiteKeywords(config: SiteConfigMap): string[] {
  const raw = config.seo_keywords?.trim()
  if (raw) {
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }
  return [...SEO_DEFAULT_KEYWORDS]
}
