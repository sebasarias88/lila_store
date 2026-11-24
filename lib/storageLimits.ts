/**
 * Free-tier limits shown in Admin → Almacenamiento (Nov 2026).
 * If the plans change, update the numbers here.
 */
const MB = 1024 ** 2
const GB = 1024 ** 3

export const STORAGE_LIMITS = {
  supabaseDatabase: 500 * MB,
  supabaseStorage: 1 * GB,
  supabaseEgress: 5 * GB,
  r2Storage: 10 * GB,
} as const

export const USAGE_LINKS = {
  supabase: 'https://supabase.com/dashboard/project/jmizyxecgumevgdjjdvo/settings/usage',
  cloudflare: 'https://dash.cloudflare.com/?to=/:account/r2/overview',
} as const

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < MB) return `${(n / 1024).toFixed(0)} KB`
  if (n < GB) return `${(n / MB).toFixed(1)} MB`
  return `${(n / GB).toFixed(2)} GB`
}
