import { supabase } from '@/lib/supabase'
import { optimizeImage } from '@/lib/optimizeImage'

export const CONFIG_TRANSFERENCIA_ACTIVO = 'transferencia_activo'
export const CONFIG_TRANSFERENCIA_BANCO = 'transferencia_banco'
export const CONFIG_TRANSFERENCIA_TIPO = 'transferencia_tipo_cuenta'
export const CONFIG_TRANSFERENCIA_NUMERO = 'transferencia_numero_cuenta'
export const CONFIG_TRANSFERENCIA_TITULAR = 'transferencia_titular'
export const CONFIG_TRANSFERENCIA_LLAVE = 'transferencia_llave'

export const BUCKET_COMPROBANTES = 'comprobantes-pago'
/** Receipts live under this folder; the admin route only serves paths like this. */
export const COMPROBANTE_PATH_RE =
  /^receipts\/\d{4}-\d{2}\/[0-9a-f-]{36}\.(webp|jpg|jpeg|png|pdf)$/
/** Same limit as the bucket (5 MB). */
const COMPROBANTE_MAX_BYTES = 5 * 1024 * 1024
const COMPROBANTE_MIME_OK = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

export type DatosTransferencia = {
  activo: boolean
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  titular: string
  llave: string
}

export function parseTransferenciaActivo(valor: string | null | undefined): boolean {
  return String(valor ?? '').trim().toLowerCase() === 'true'
}

export function datosTransferenciaDesdeConfig(
  config: Record<string, string>,
): DatosTransferencia {
  return {
    activo: parseTransferenciaActivo(config[CONFIG_TRANSFERENCIA_ACTIVO]),
    banco: (config[CONFIG_TRANSFERENCIA_BANCO] || '').trim(),
    tipoCuenta: (config[CONFIG_TRANSFERENCIA_TIPO] || '').trim(),
    numeroCuenta: (config[CONFIG_TRANSFERENCIA_NUMERO] || '').trim(),
    titular: (config[CONFIG_TRANSFERENCIA_TITULAR] || '').trim(),
    llave: (config[CONFIG_TRANSFERENCIA_LLAVE] || '').trim(),
  }
}

export function esMetodoTransferencia(nombre: string | null | undefined): boolean {
  return (nombre || '').trim().toLowerCase().includes('transferencia')
}

export function validarArchivoComprobante(
  file: File,
): { ok: true } | { ok: false; message: string } {
  const tipo = file.type.toLowerCase()
  const okTipo =
    tipo.startsWith('image/') ||
    tipo === 'application/pdf' ||
    /\.(jpe?g|png|webp|gif|heic|heif|pdf)$/i.test(file.name)
  if (!okTipo) {
    return { ok: false, message: 'El comprobante debe ser una imagen o un PDF' }
  }
  if (file.size > COMPROBANTE_MAX_BYTES) {
    return { ok: false, message: 'El archivo no puede superar 5 MB' }
  }
  return { ok: true }
}

/**
 * Uploads the customer's transfer receipt to the private bucket.
 * Images are compressed to WebP first. The returned URL points to the admin
 * panel (/admin/comprobantes/...), so only a signed-in admin can open it:
 * the receipt (personal data) is never exposed through a public link.
 */
export async function subirComprobantePago(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const valid = validarArchivoComprobante(file)
  if (!valid.ok) return valid

  let toUpload = file
  if (file.type.startsWith('image/')) {
    const optimized = await optimizeImage(file)
    if (optimized.ok) toUpload = optimized.file
  }

  const mime = toUpload.type.toLowerCase()
  if (!COMPROBANTE_MIME_OK.has(mime)) {
    return {
      ok: false,
      message: 'No pudimos leer ese formato. Envía una captura de pantalla (JPG o PNG) o un PDF.',
    }
  }
  if (toUpload.size > COMPROBANTE_MAX_BYTES) {
    return { ok: false, message: 'El archivo no puede superar 5 MB' }
  }

  const ext = mime === 'application/pdf' ? 'pdf' : mime.split('/')[1]
  const month = new Date().toISOString().slice(0, 7)
  const path = `receipts/${month}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_COMPROBANTES)
    .upload(path, toUpload, { upsert: false, contentType: mime })

  if (uploadError) {
    console.error('[comprobante] upload:', uploadError)
    return {
      ok: false,
      message: 'No pudimos subir el comprobante. Intenta de nuevo o envía el pedido sin archivo.',
    }
  }

  return { ok: true, url: `${window.location.origin}/admin/comprobantes/${path}` }
}
