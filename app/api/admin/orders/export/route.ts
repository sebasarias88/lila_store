import { getAdminUser } from '@/lib/adminAuth'
import { createSupabaseServer } from '@/lib/supabase-server'
import { ORDER_STATUS, PAYMENT_STATUS, documentShort, orderCode, type OrderStatus, type PaymentStatus } from '@/lib/orders/shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Excel-friendly CSV (; separator, UTF-8 BOM). Contains personal data: admin only. */
function cell(value: unknown): string {
  const s = value == null ? '' : String(value)
  // Formula injection guard for spreadsheet apps.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  if (!(await getAdminUser())) return new Response('Sin permiso', { status: 403 })
  const url = new URL(request.url)
  const before = url.searchParams.get('before')
  const onlyFinished = url.searchParams.get('scope') === 'finished'
  const db = await createSupabaseServer()

  let q = db
    .from('orders')
    .select('*, order_items(product_name, product_sku, variations, quantity, unit_price, line_total)')
    .order('created_at', { ascending: true })
    .limit(5000)
  if (before && DATE_RE.test(before)) q = q.lt('created_at', `${before}T05:00:00Z`)
  if (onlyFinished) q = q.in('status', ['delivered', 'cancelled'])
  const { data, error } = await q
  if (error) return new Response('No se pudo exportar', { status: 500 })

  const header = [
    'Pedido', 'Fecha', 'Catálogo', 'Estado', 'Pago', 'Estado del pago', 'Cliente', 'Celular', 'Documento',
    'Entrega', 'Ciudad', 'Dirección / tienda', 'Factura electrónica', 'Correo factura', 'Factura a nombre de',
    'Productos', 'Subtotal', 'Envío', 'Recargo', 'Total', 'Transportadora', 'Guía',
  ]
  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))

  const rows = (data ?? []).map(o => {
    const items = (o.order_items ?? []) as { product_name: string; product_sku: string | null; variations: Record<string, string> | null; quantity: number; line_total: number | null }[]
    const productos = items
      .map(i => `${i.quantity} x ${i.product_name}${i.variations ? ` (${Object.values(i.variations).join(', ')})` : ''}${i.product_sku ? ` [${i.product_sku}]` : ''}`)
      .join(' | ')
    return [
      orderCode(o.order_number), fmtDate(o.created_at), o.catalog === 'mayoreo' ? 'Mayorista' : 'Detal',
      ORDER_STATUS[o.status as OrderStatus]?.label ?? o.status, o.payment_method,
      PAYMENT_STATUS[o.payment_status as PaymentStatus]?.label ?? o.payment_status,
      o.customer_name, o.customer_phone, o.document_number ? `${documentShort(o.document_type)} ${o.document_number}` : '',
      o.delivery_type === 'recogida' ? 'Recoge en tienda' : 'Envío', o.city,
      o.delivery_type === 'recogida' ? o.pickup_branch : o.address,
      o.wants_invoice ? 'Sí' : 'No', o.invoice_email,
      o.invoice_name ? `${o.invoice_name} (${documentShort(o.invoice_document_type)} ${o.invoice_document_number ?? ''})` : '',
      productos, o.subtotal, o.shipping_cost ?? 'A convenir', o.surcharge, o.total, o.carrier, o.tracking_number,
    ].map(cell).join(';')
  })

  const csv = '\uFEFF' + [header.map(cell).join(';'), ...rows].join('\r\n')
  const name = `pedidos-lila${before ? `-hasta-${before}` : ''}.csv`
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  })
}
