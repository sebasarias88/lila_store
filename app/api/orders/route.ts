import { createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createSupabaseSecret } from '@/lib/supabase-secret'
import { createSupabasePublic } from '@/lib/supabase-public'
import { OrderInputError, priceOrderLines } from '@/lib/orders/pricing'
import {
  EMAIL_RE,
  INVOICE_DOCUMENT_TYPES,
  DOCUMENT_TYPES,
  normalizeDocument,
  orderCode,
  validateDocument,
  type CreateOrderRequest,
  type CreateOrderResponse,
} from '@/lib/orders/shared'
import { CONFIG_MAYORISTA_MINIMO, MAYOREO_MIN_COMPRA, formatPrecio, parseMayoristaConfigMonto } from '@/lib/catalog'
import { parseCopValue } from '@/lib/currency'
import {
  calcularRecargoPago,
  findMetodoPagoByNombre,
  formatPorcentajeRecargo,
  metodoPagoVisibleEnCatalogo,
  recargoPorcentajeCatalogo,
} from '@/lib/payment-methods'
import { COMPROBANTE_PATH_RE, esMetodoTransferencia } from '@/lib/transferencia'
import { ARMENIA_DANE, DANE_CODE_RE, formatShippingDays } from '@/lib/shippingShared'
import { isMipaqueteConfigured } from '@/lib/mipaquete'
import { getShippingOptions } from '@/lib/shippingQuoteServer'
import { LEGAL_VERSION } from '@/lib/legal'
import type { MetodoPago } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY = 32 * 1024
const ARMENIA_NAMES = ['armenia', 'armenia quindío', 'armenia quindio']

function fail(status: number, error: string, message: string) {
  return NextResponse.json<CreateOrderResponse>({ ok: false, error, message }, { status })
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function clientIpHash(request: Request, salt: string): string | null {
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    ''
  if (!ip) return null
  // Only a keyed hash is stored, never the IP itself.
  return createHmac('sha256', salt).update(ip).digest('hex').slice(0, 32)
}

/**
 * Creates an order. Everything is validated and priced again here:
 * the amounts in the browser are only a preview.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return fail(403, 'forbidden', 'Solicitud no permitida.')
  }
  const secret = createSupabaseSecret()
  if (!secret) {
    console.error('[orders] SUPABASE_SECRET_KEY is missing')
    return fail(503, 'not_configured', 'No pudimos registrar tu pedido en este momento. Escríbenos por WhatsApp.')
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY) return fail(413, 'too_large', 'Tu pedido es demasiado grande.')
  let body: CreateOrderRequest
  try {
    body = JSON.parse(raw)
  } catch {
    return fail(400, 'invalid_json', 'Solicitud inválida.')
  }

  // Honeypot filled → pretend nothing happened (bots).
  if (text(body?.website, 100)) return fail(400, 'invalid', 'Solicitud inválida.')

  const catalog = body?.catalog === 'mayoreo' ? 'mayoreo' : 'detal'
  const c = body?.customer ?? ({} as CreateOrderRequest['customer'])
  const inv = body?.invoice ?? ({} as CreateOrderRequest['invoice'])

  // ── Customer ──────────────────────────────────────────────────────────
  const name = text(c.name, 120)
  const phone = text(c.phone, 20).replace(/[\s\-()]/g, '')
  const documentType = DOCUMENT_TYPES.some(d => d.id === c.documentType) ? c.documentType : ''
  const documentNumber = normalizeDocument(text(c.documentNumber, 30))
  const deliveryType = c.deliveryType === 'recogida' ? 'recogida' : 'envio'
  const city = text(c.city, 120)
  const cityCode = DANE_CODE_RE.test(text(c.cityCode, 8)) ? text(c.cityCode, 8) : ''
  const address = text(c.address, 200)
  const pickupBranch = text(c.pickupBranch, 200)
  const notes = text(c.notes, 500)

  if (name.length < 2) return fail(400, 'invalid_name', 'Escribe tu nombre completo.')
  if (!/^\+?[0-9]{7,15}$/.test(phone)) return fail(400, 'invalid_phone', 'Revisa tu número de celular.')
  const docError = validateDocument(documentType, documentNumber)
  if (docError) return fail(400, 'invalid_document', docError)
  if (deliveryType === 'envio' && (!address || !city)) {
    return fail(400, 'address_required', 'Escribe tu dirección y ciudad de entrega.')
  }
  if (deliveryType === 'recogida' && !pickupBranch) {
    return fail(400, 'branch_required', 'Elige la tienda donde vas a recoger.')
  }
  if (body?.acceptsPolicies !== true) {
    return fail(400, 'consent_required', 'Debes aceptar los términos y la política de privacidad.')
  }

  // ── Electronic invoice (optional) ─────────────────────────────────────
  const wantsInvoice = inv.wanted === true
  const invoiceEmail = wantsInvoice ? text(inv.email, 160).toLowerCase() : ''
  let invoiceName = ''
  let invoiceDocType = ''
  let invoiceDocNumber = ''
  if (wantsInvoice) {
    if (!EMAIL_RE.test(invoiceEmail)) return fail(400, 'invalid_email', 'Escribe un correo válido para la factura electrónica.')
    if (inv.otherHolder) {
      invoiceName = text(inv.name, 160)
      invoiceDocType = INVOICE_DOCUMENT_TYPES.some(d => d.id === inv.documentType) ? String(inv.documentType) : ''
      invoiceDocNumber = normalizeDocument(text(inv.documentNumber, 30))
      if (invoiceName.length < 2) return fail(400, 'invalid_invoice_name', 'Escribe el nombre o razón social de la factura.')
      const invDocError = validateDocument(invoiceDocType, invoiceDocNumber)
      if (invDocError) return fail(400, 'invalid_invoice_document', `Factura: ${invDocError.toLowerCase()}`)
    }
  }

  try {
    const publicDb = createSupabasePublic()
    const [lines, { data: configRows }, { data: metodos }] = await Promise.all([
      priceOrderLines(publicDb, body.items, catalog),
      publicDb.from('configuracion').select('clave, valor'),
      publicDb.from('metodos_pago').select('*').eq('activo', true),
    ])
    const config = Object.fromEntries((configRows ?? []).map(r => [r.clave, r.valor])) as Record<string, string>

    const subtotal = lines.reduce((acc, l) => acc + (l.lineTotal ?? 0), 0)
    const units = lines.reduce((acc, l) => acc + l.quantity, 0)

    if (catalog === 'mayoreo') {
      const min = parseMayoristaConfigMonto(config[CONFIG_MAYORISTA_MINIMO], MAYOREO_MIN_COMPRA)
      if (subtotal < min) {
        return fail(400, 'wholesale_minimum', `El pedido mayorista debe ser de al menos ${formatPrecio(min)}.`)
      }
    }

    // ── Payment method + surcharge ──────────────────────────────────────
    const metodo = findMetodoPagoByNombre((metodos ?? []) as MetodoPago[], text(body.paymentMethod, 80))
    const transferOn = config.transferencia_activo === 'true'
    if (!metodo || !metodoPagoVisibleEnCatalogo(metodo, catalog) || (esMetodoTransferencia(metodo.nombre) && !transferOn)) {
      return fail(400, 'invalid_payment', 'Elige un método de pago disponible.')
    }
    const paymentKind = esMetodoTransferencia(metodo.nombre)
      ? 'transfer'
      : /wompi/i.test(metodo.nombre)
        ? 'wompi'
        : 'other'
    const pct = recargoPorcentajeCatalogo(metodo, catalog)
    const surcharge = calcularRecargoPago(subtotal, pct)
    const surchargeLabel = surcharge > 0 ? `Recargo ${metodo.nombre} (${formatPorcentajeRecargo(pct)}%)` : null

    const receiptPath = typeof body.receiptPath === 'string' && COMPROBANTE_PATH_RE.test(body.receiptPath)
      ? body.receiptPath
      : null

    // ── Shipping (same rules as the checkout) ───────────────────────────
    let shippingCost: number | null = 0
    let shippingLabel = ''
    if (deliveryType === 'recogida') {
      shippingLabel = `Recoger en tienda: ${pickupBranch}`
    } else {
      const freeFrom = parseCopValue(config.envio_gratis_desde)
      const isArmenia = cityCode
        ? cityCode === ARMENIA_DANE
        : ARMENIA_NAMES.includes(city.split(',')[0].toLowerCase().trim())
      if (freeFrom > 0 && subtotal >= freeFrom) {
        shippingCost = 0
        shippingLabel = 'Envío gratis'
      } else if (isArmenia) {
        shippingCost = parseCopValue(config.envio_armenia || '5000')
        shippingLabel = `Armenia · ${config.tiempo_entrega_armenia || 'El mismo día'}`
      } else {
        let quoted = false
        if (cityCode && isMipaqueteConfigured() && subtotal > 0) {
          try {
            const options = await getShippingOptions(cityCode, subtotal, units)
            const chosen = options.find(o => o.id === text(body.shippingOptionId, 80)) ?? options[0]
            if (chosen) {
              shippingCost = chosen.cost
              shippingLabel = `${chosen.carrier} · ${formatShippingDays(chosen.days)}`
              quoted = true
            }
          } catch (err) {
            console.error('[orders] shipping quote failed, using fallback:', err)
          }
        }
        if (!quoted) {
          const fallback = parseCopValue(config.envio_nacional)
          shippingCost = fallback > 0 ? fallback : null // null = "a convenir"
          shippingLabel = `Nacional · ${config.tiempo_entrega_nacional || '2 a 3 días hábiles'}`
        }
      }
    }

    const { data, error } = await secret.rpc('create_order', {
      p_order: {
        catalog,
        payment_method: metodo.nombre,
        payment_kind: paymentKind,
        receipt_path: paymentKind === 'transfer' ? receiptPath : null,
        customer_name: name,
        customer_phone: phone,
        document_type: documentType,
        document_number: documentNumber,
        delivery_type: deliveryType,
        city: deliveryType === 'envio' ? city : null,
        city_code: deliveryType === 'envio' && cityCode ? cityCode : null,
        address: deliveryType === 'envio' ? address : null,
        pickup_branch: deliveryType === 'recogida' ? pickupBranch : null,
        notes,
        wants_invoice: wantsInvoice,
        invoice_email: invoiceEmail || null,
        invoice_name: invoiceName || null,
        invoice_document_type: invoiceDocType || null,
        invoice_document_number: invoiceDocNumber || null,
        shipping_label: shippingLabel.slice(0, 160),
        shipping_cost: shippingCost,
        surcharge_label: surchargeLabel,
        surcharge,
        subtotal,
        privacy_version: LEGAL_VERSION,
      },
      p_items: lines.map(l => ({
        product_id: l.productId,
        product_name: l.productName,
        product_sku: l.productSku,
        variations: l.variations,
        unit_price: l.unitPrice,
        unit_price_before: l.unitPriceBefore,
        quantity: l.quantity,
        line_total: l.lineTotal,
      })),
      p_ip_hash: clientIpHash(request, process.env.SUPABASE_SECRET_KEY || 'lila'),
    })

    if (error) {
      if (error.message.includes('rate_limited')) {
        return fail(429, 'rate_limited', 'Enviaste varios pedidos seguidos. Espera unos minutos o escríbenos por WhatsApp.')
      }
      console.error('[orders] create_order:', error.code, error.message)
      return fail(500, 'db_error', 'No pudimos registrar tu pedido. Intenta de nuevo.')
    }

    const created = data as {
      id: string
      order_number: number
      subtotal: number
      shipping_cost: number | null
      surcharge: number
      total: number
      has_unpriced_items: boolean
    }
    return NextResponse.json<CreateOrderResponse>(
      {
        ok: true,
        order: {
          id: created.id,
          number: created.order_number,
          code: orderCode(created.order_number),
          subtotal: Number(created.subtotal),
          shippingCost: created.shipping_cost == null ? null : Number(created.shipping_cost),
          shippingLabel,
          surcharge: Number(created.surcharge),
          surchargeLabel,
          total: Number(created.total),
          hasUnpricedItems: created.has_unpriced_items,
          lines: lines.map(l => ({ unitPrice: l.unitPrice, lineTotal: l.lineTotal })),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    if (err instanceof OrderInputError) return fail(400, err.code, err.message)
    console.error('[orders] unexpected:', err)
    return fail(500, 'server_error', 'No pudimos registrar tu pedido. Intenta de nuevo.')
  }
}
