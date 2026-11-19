import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import {
  deleteImageObjects,
  keyFromPublicUrl,
  publicUrlForKey,
  putImageObject,
} from '@/lib/r2'
import { thumbKeyFor } from '@/lib/imageVariants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // Vercel body limit is ~4.5MB
const MAX_DELETE_BATCH = 50

const ALLOWED_FOLDERS = ['productos', 'categorias', 'banners', 'promociones', 'variaciones'] as const
type ImageFolder = (typeof ALLOWED_FOLDERS)[number]

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

function isImageFolder(value: unknown): value is ImageFolder {
  return typeof value === 'string' && (ALLOWED_FOLDERS as readonly string[]).includes(value)
}

/** Rejects cross-site requests (defense in depth on top of SameSite cookies). */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/** Upload one image (multipart: file, folder). Returns { url }. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError('Origen no permitido', 403)

  const admin = await getAdminUser()
  if (!admin) return jsonError('No autorizado', 401)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError('Solicitud inválida', 400)
  }

  const file = form.get('file')
  const thumb = form.get('thumb')
  const folder = form.get('folder')

  if (!isImageFolder(folder)) return jsonError('Carpeta no válida', 400)
  if (!(file instanceof File)) return jsonError('Falta el archivo', 400)

  const extension = EXTENSION_BY_TYPE[file.type]
  if (!extension) return jsonError('Formato no permitido (usa JPG, PNG o WEBP)', 415)
  if (file.size > MAX_UPLOAD_BYTES) return jsonError('La imagen supera 4MB tras optimizar', 413)

  const key = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`

  // The browser sends a 640px WebP thumbnail. If it couldn't (tiny images), the original is
  // small anyway, so it doubles as the thumbnail: every image always has one.
  const thumbFile =
    thumb instanceof File && thumb.type === 'image/webp' && thumb.size <= MAX_UPLOAD_BYTES ? thumb : file

  try {
    const body = Buffer.from(await file.arrayBuffer())
    await putImageObject({ key, body, contentType: file.type })
    // Lightweight version for cards and lists. If it fails, the site falls back to the full image.
    await putImageObject({
      key: thumbKeyFor(key),
      body: Buffer.from(await thumbFile.arrayBuffer()),
      contentType: thumbFile.type,
    }).catch(error => console.error('[admin/images] thumbnail upload failed', error))
  } catch (error) {
    console.error('[admin/images] upload failed', error)
    return jsonError('No se pudo subir la imagen', 502)
  }

  return NextResponse.json({ url: publicUrlForKey(key) })
}

/** Delete images by public URL. Body: { urls: string[] }. Non-R2 URLs are ignored. */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return jsonError('Origen no permitido', 403)

  const admin = await getAdminUser()
  if (!admin) return jsonError('No autorizado', 401)

  let urls: unknown
  try {
    ;({ urls } = await request.json())
  } catch {
    return jsonError('Solicitud inválida', 400)
  }

  if (!Array.isArray(urls) || urls.length > MAX_DELETE_BATCH) {
    return jsonError('Lista de imágenes no válida', 400)
  }

  const keys = urls
    .filter((u): u is string => typeof u === 'string')
    .map(keyFromPublicUrl)
    .filter((k): k is string => k !== null)

  try {
    await deleteImageObjects([...keys, ...keys.map(thumbKeyFor)])
  } catch (error) {
    console.error('[admin/images] delete failed', error)
    return jsonError('No se pudieron eliminar las imágenes', 502)
  }

  return NextResponse.json({ deleted: keys.length })
}
