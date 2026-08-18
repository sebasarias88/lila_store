import { supabase } from '@/lib/supabase'

export const CONFIG_TRANSFERENCIA_ACTIVO = 'transferencia_activo'
export const CONFIG_TRANSFERENCIA_BANCO = 'transferencia_banco'
export const CONFIG_TRANSFERENCIA_TIPO = 'transferencia_tipo_cuenta'
export const CONFIG_TRANSFERENCIA_NUMERO = 'transferencia_numero_cuenta'
export const CONFIG_TRANSFERENCIA_TITULAR = 'transferencia_titular'
export const CONFIG_TRANSFERENCIA_LLAVE = 'transferencia_llave'

export const BUCKET_COMPROBANTES = 'comprobantes-pago'
export const COMPROBANTE_SIGNED_TTL_SEC = 60 * 60 * 24 * 7 // 7 días
const COMPROBANTE_MAX_BYTES = 10 * 1024 * 1024

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

function extDeArchivo(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase() || ''
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/heic' || file.type === 'image/heif') return 'heic'
  return 'jpg'
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
    return { ok: false, message: 'El archivo no puede superar 10 MB' }
  }
  return { ok: true }
}

export async function subirComprobantePago(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const valid = validarArchivoComprobante(file)
  if (!valid.ok) return valid

  const ext = extDeArchivo(file)
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_COMPROBANTES)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    })

  if (uploadError) {
    console.error('[comprobante] upload:', uploadError)
    return {
      ok: false,
      message: 'No pudimos subir el comprobante. Intenta de nuevo o envía el pedido sin archivo.',
    }
  }

  const { data, error: signError } = await supabase.storage
    .from(BUCKET_COMPROBANTES)
    .createSignedUrl(path, COMPROBANTE_SIGNED_TTL_SEC)

  if (signError || !data?.signedUrl) {
    console.error('[comprobante] signed url:', signError)
    return {
      ok: false,
      message: 'El archivo se subió, pero no pudimos generar el enlace. Intenta de nuevo.',
    }
  }

  return { ok: true, url: data.signedUrl }
}
