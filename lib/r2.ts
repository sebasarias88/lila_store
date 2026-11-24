import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Cloudflare R2 client (S3-compatible). SERVER ONLY — never import from client components.
 * Required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 * R2_BUCKET, R2_PUBLIC_BASE_URL (e.g. https://img.lilastore.com.co).
 */

/** Immutable keys (timestamp + random) → cache for 1 year in browsers and CDN. */
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

/** Top-level key prefixes the app is allowed to write or delete. */
export const ALLOWED_KEY_PREFIXES = [
  'productos/',
  'categorias/',
  'banners/',
  'promociones/',
  'variaciones/',
  'thumbs/',
  'videos/',
] as const

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing env var ${name}`)
  return value
}

let client: S3Client | undefined

export function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
        secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
      },
    })
  }
  return client
}

export function getR2Bucket(): string {
  return requireEnv('R2_BUCKET')
}

export function getR2PublicBaseUrl(): string {
  return requireEnv('R2_PUBLIC_BASE_URL').replace(/\/$/, '')
}

export function publicUrlForKey(key: string): string {
  return `${getR2PublicBaseUrl()}/${key}`
}

/** Returns the object key if the URL belongs to our R2 public domain, otherwise null. */
export function keyFromPublicUrl(url: string): string | null {
  const base = `${getR2PublicBaseUrl()}/`
  if (!url.startsWith(base)) return null
  const key = decodeURIComponent(url.slice(base.length))
  if (!key || key.includes('..')) return null
  return isAllowedKey(key) ? key : null
}

export function isAllowedKey(key: string): boolean {
  return ALLOWED_KEY_PREFIXES.some(prefix => key.startsWith(prefix))
}

export async function putImageObject(params: {
  key: string
  body: Buffer | Uint8Array
  contentType: string
}): Promise<void> {
  if (!isAllowedKey(params.key)) throw new Error('Key not allowed')
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: IMMUTABLE_CACHE_CONTROL,
    }),
  )
}

export async function deleteImageObjects(keys: string[]): Promise<void> {
  const safeKeys = keys.filter(isAllowedKey)
  if (!safeKeys.length) return
  await getR2Client().send(
    new DeleteObjectsCommand({
      Bucket: getR2Bucket(),
      Delete: { Objects: safeKeys.map(Key => ({ Key })), Quiet: true },
    }),
  )
}

/**
 * Short-lived signed URL so the admin's browser uploads a video DIRECTLY to R2
 * (videos are too big to pass through a Vercel function, ~4.5MB limit).
 * The signature fixes the key, content type and cache header: nothing else can be uploaded with it.
 */
export async function createVideoUploadUrl(params: {
  key: string
  contentType: string
}): Promise<string> {
  if (!params.key.startsWith('videos/')) throw new Error('Key not allowed')
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: params.key,
      ContentType: params.contentType,
      CacheControl: IMMUTABLE_CACHE_CONTROL,
    }),
    { expiresIn: 600, signableHeaders: new Set(['content-type', 'cache-control']) },
  )
}

export type R2Object = { key: string; size: number; lastModified: number }

/** Every object in the bucket (1 request per 1000 files). */
export async function listAllObjects(): Promise<R2Object[]> {
  const out: R2Object[] = []
  let token: string | undefined
  for (let page = 0; page < 200; page++) {
    const res = await getR2Client().send(
      new ListObjectsV2Command({ Bucket: getR2Bucket(), ContinuationToken: token, MaxKeys: 1000 }),
    )
    for (const o of res.Contents ?? []) {
      if (o.Key) out.push({ key: o.Key, size: o.Size ?? 0, lastModified: o.LastModified?.getTime() ?? 0 })
    }
    if (!res.IsTruncated || !res.NextContinuationToken) break
    token = res.NextContinuationToken
  }
  return out
}
