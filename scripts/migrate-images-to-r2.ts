/**
 * Copies every image referenced in the database from Supabase Storage to Cloudflare R2,
 * and creates its 640px WebP thumbnail (thumbs/<key>.webp) for cards and lists.
 * It NEVER deletes anything from Supabase and NEVER updates the database.
 *
 * Output (gitignored): scripts/output/
 *   - r2-url-map.json   old URL → new URL
 *   - r2-url-map.sql    INSERTs for private.image_url_map (run it, then docs/r2-migration/01_switch_urls_to_r2.sql)
 *
 * Heavy images (PNG/JPEG over 300KB, or anything over 600KB) are re-encoded to WebP (max 1600px).
 * Re-running is safe: objects already in R2 are skipped.
 *
 * Usage (on Sebastian's Mac, needs network):
 *   pnpm tsx --env-file=.env.local scripts/migrate-images-to-r2.ts --dry-run
 *   pnpm tsx --env-file=.env.local scripts/migrate-images-to-r2.ts
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (catalog tables are public-read),
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { THUMB_MAX_EDGE_PX, THUMB_WEBP_QUALITY, thumbKeyFor } from '../lib/imageVariants'
import { getR2Bucket, getR2Client, publicUrlForKey, putImageObject } from '../lib/r2'

const DRY_RUN = process.argv.includes('--dry-run')
const CONCURRENCY = 3
const MAX_ATTEMPTS = 5
const OPTIMIZE_PNG_JPEG_OVER = 300 * 1024
const OPTIMIZE_ANY_OVER = 600 * 1024
const MAX_EDGE_PX = 1600
const STORAGE_MARKER = '/storage/v1/object/public/'
const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'output')

type Folder = 'productos' | 'variaciones' | 'categorias' | 'banners' | 'promociones'
type Job = { oldUrl: string; key: string }
type Result = {
  oldUrl: string
  newUrl: string
  originalBytes: number
  finalBytes: number
  converted: boolean
  skipped: boolean
}

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing env var ${name}`)
  return value
}

/** "<bucket>/<path>" → R2 key under one of the allowed folders, e.g. productos/123.webp. */
function keyFor(url: string, folder: Folder): string | null {
  const idx = url.indexOf(STORAGE_MARKER)
  if (idx === -1) return null
  const storagePath = decodeURIComponent(url.slice(idx + STORAGE_MARKER.length).split('?')[0])
  const withinBucket = storagePath.split('/').slice(1).join('/')
  if (!withinBucket || withinBucket.includes('..')) return null
  const rest = withinBucket.startsWith(`${folder}/`) ? withinBucket.slice(folder.length + 1) : withinBucket
  return `${folder}/${rest}`
}

async function collectJobs(): Promise<Job[]> {
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false } },
  )
  const byUrl = new Map<string, Folder>()
  const add = (url: string | null | undefined, folder: Folder) => {
    if (url && url.includes(STORAGE_MARKER) && !byUrl.has(url)) byUrl.set(url, folder)
  }

  const { data: productos, error } = await supabase.from('productos').select('imagenes')
  if (error) throw error
  productos?.forEach(p => (p.imagenes as string[] | null)?.forEach(u => add(u, 'productos')))

  const singles: [string, Folder][] = [
    ['variacion_opciones', 'variaciones'],
    ['categorias', 'categorias'],
    ['banners', 'banners'],
    ['promociones', 'promociones'],
    ['anuncio_modal', 'promociones'],
  ]
  for (const [table, folder] of singles) {
    const { data, error: tableError } = await supabase.from(table).select('imagen_url')
    if (tableError) throw tableError
    data?.forEach(row => add(row.imagen_url as string | null, folder))
  }

  return [...byUrl].flatMap(([oldUrl, folder]) => {
    const key = keyFor(oldUrl, folder)
    return key ? [{ oldUrl, key }] : []
  })
}

/** Downloads with retries: 429 (rate limit) and 5xx wait and try again (2s, 4s, 8s, 16s). */
async function download(url: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url)
    if (response.ok) return Buffer.from(await response.arrayBuffer())
    const retryable = response.status === 429 || response.status >= 500
    if (!retryable || attempt >= MAX_ATTEMPTS) throw new Error(`HTTP ${response.status}`)
    const retryAfter = Number(response.headers.get('retry-after'))
    await sleep(retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** (attempt - 1))
  }
}

async function existsInR2(key: string): Promise<boolean> {
  try {
    await getR2Client().send(new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key }))
    return true
  } catch {
    return false
  }
}

async function processJob(job: Job): Promise<Result> {
  const ext = job.key.split('.').pop()?.toLowerCase() ?? ''
  const original = await download(job.oldUrl)

  const shouldConvert =
    original.length > OPTIMIZE_ANY_OVER ||
    (['png', 'jpg', 'jpeg'].includes(ext) && original.length > OPTIMIZE_PNG_JPEG_OVER)

  let body: Buffer = original
  let key = job.key
  let contentType = CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream'

  if (shouldConvert) {
    const webp = await sharp(original)
      .rotate()
      .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
    if (webp.length < original.length) {
      body = webp
      key = job.key.replace(/\.[^./]+$/, '') + '.webp'
      contentType = 'image/webp'
    }
  }

  const base = {
    oldUrl: job.oldUrl,
    newUrl: publicUrlForKey(key),
    originalBytes: original.length,
    finalBytes: body.length,
    converted: key !== job.key,
  }
  if (DRY_RUN) return { ...base, skipped: false }

  const already = await existsInR2(key)
  if (!already) await putImageObject({ key, body, contentType })

  const thumbKey = thumbKeyFor(key)
  if (!(await existsInR2(thumbKey))) {
    const thumb = await sharp(body)
      .rotate()
      .resize({ width: THUMB_MAX_EDGE_PX, height: THUMB_MAX_EDGE_PX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: Math.round(THUMB_WEBP_QUALITY * 100) })
      .toBuffer()
    await putImageObject({ key: thumbKey, body: thumb, contentType: 'image/webp' })
  }

  return { ...base, skipped: already }
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

async function main() {
  const jobs = await collectJobs()
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Images referenced in DB: ${jobs.length}`)

  const results: Result[] = []
  const failures: { url: string; error: string }[] = []
  let cursor = 0

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++]
      try {
        results.push(await processJob(job))
      } catch (error) {
        failures.push({ url: job.oldUrl, error: error instanceof Error ? error.message : String(error) })
      }
      const done = results.length + failures.length
      if (done % 50 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  const mb = (b: number) => (b / 1048576).toFixed(1)
  const before = results.reduce((s, r) => s + r.originalBytes, 0)
  const after = results.reduce((s, r) => s + r.finalBytes, 0)
  console.log(
    `\nOK: ${results.length} | converted to WebP: ${results.filter(r => r.converted).length} | already in R2: ${results.filter(r => r.skipped).length} | failed: ${failures.length}`,
  )
  console.log(`Size: ${mb(before)} MB → ${mb(after)} MB`)
  failures.forEach(f => console.log(`  FAIL ${f.url} → ${f.error}`))

  await mkdir(OUTPUT_DIR, { recursive: true })
  const sorted = [...results].sort((a, b) => a.oldUrl.localeCompare(b.oldUrl))
  await writeFile(
    path.join(OUTPUT_DIR, DRY_RUN ? 'r2-url-map.dry-run.json' : 'r2-url-map.json'),
    JSON.stringify(sorted.map(({ oldUrl, newUrl }) => ({ oldUrl, newUrl })), null, 2),
  )

  if (!DRY_RUN) {
    const values = sorted.map(r => `  (${sqlLiteral(r.oldUrl)}, ${sqlLiteral(r.newUrl)})`).join(',\n')
    const sql = `-- Generated by scripts/migrate-images-to-r2.ts — ${new Date().toISOString()}
-- Only fills the mapping table. It does NOT change any catalog row yet.
begin;
create table if not exists private.image_url_map (
  old_url text primary key,
  new_url text not null,
  created_at timestamptz not null default now()
);
revoke all on private.image_url_map from public, anon, authenticated;
insert into private.image_url_map (old_url, new_url) values
${values}
on conflict (old_url) do update set new_url = excluded.new_url;
commit;
select count(*) as mapped from private.image_url_map;
`
    await writeFile(path.join(OUTPUT_DIR, 'r2-url-map.sql'), sql)
    console.log(`\nWrote scripts/output/r2-url-map.sql (${sorted.length} rows)`)
  }

  if (failures.length) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
