import { cache } from 'react'
import { createSupabaseServer } from '@/lib/supabase-server'

export type SiteConfigMap = Record<string, string>

export const getSiteConfig = cache(async (): Promise<SiteConfigMap> => {
  try {
    const supabase = await createSupabaseServer()
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

export function getSiteName(config: SiteConfigMap): string {
  void config
  return 'lila-store'
}

export function getSiteDescription(config: SiteConfigMap): string {
  const seo = config.seo_descripcion?.trim()
  const hero = config.hero_subtitulo?.trim()
  const clean = (text?: string) => (text && !/ritual/i.test(text) ? text : '')
  return (
    clean(seo) ||
    clean(hero) ||
    'Catálogo detal de belleza en Armenia y Quimbaya, Quindío. Envíos a toda Colombia.'
  )
}

export function getSiteKeywords(config: SiteConfigMap): string[] {
  const raw = config.seo_keywords?.trim()
  if (raw) {
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }
  return [
    'belleza',
    'cuidado capilar',
    'cosmética',
    'catálogo detal',
    'lila-store',
    'Armenia',
    'Quindío',
    'Colombia',
  ]
}

