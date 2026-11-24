/**
 * Server-side pricing of an order. The browser cart is never trusted: every
 * line is priced again with fresh database data using the same functions the
 * catalog uses (category discounts, variation prices, wholesale catalog).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogType } from '@/lib/catalog'
import type { ItemCarrito, Producto, VariacionTipo } from '@/types'
import { PRODUCTO_DETAIL_SELECT } from '@/lib/productQueries'
import { withProductoCategorias } from '@/lib/producto-categorias'
import {
  buildVariacionPrecioOverride,
  getItemPrecios,
  normalizarVariacionesProducto,
} from '@/lib/variaciones'
import { MAX_UNITS_PER_PRODUCT, productoAgotado, productoComprableEnCatalogo } from '@/lib/stock'
import type { CreateOrderItem } from '@/lib/orders/shared'

export class OrderInputError extends Error {
  constructor(public code: string, message: string) {
    super(message)
  }
}

export type PricedLine = {
  productId: string
  productName: string
  productSku: string | null
  variations: Record<string, string> | null
  unitPrice: number | null
  unitPriceBefore: number | null
  quantity: number
  lineTotal: number | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function shortName(name: string) {
  return name.length > 40 ? `${name.slice(0, 40)}…` : name
}

export async function priceOrderLines(
  supabase: SupabaseClient,
  items: CreateOrderItem[],
  catalog: CatalogType,
): Promise<PricedLine[]> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderInputError('empty_cart', 'Tu carrito está vacío.')
  }
  if (items.length > 60) {
    throw new OrderInputError('too_many_lines', 'Tu pedido tiene demasiadas líneas. Escríbenos por WhatsApp.')
  }
  for (const item of items) {
    const qty = Number(item?.quantity)
    if (!UUID_RE.test(String(item?.productId)) || !Number.isInteger(qty) || qty < 1 || qty > MAX_UNITS_PER_PRODUCT) {
      throw new OrderInputError('invalid_items', 'Hay un producto inválido en tu carrito. Actualiza la página e intenta de nuevo.')
    }
  }

  const ids = [...new Set(items.map(i => i.productId))]
  const [{ data: productsRaw, error: pErr }, { data: tiposRaw, error: vErr }] = await Promise.all([
    supabase.from('productos').select(PRODUCTO_DETAIL_SELECT).in('id', ids),
    supabase
      .from('variacion_tipos')
      .select('*, opciones:variacion_opciones(*)')
      .in('producto_id', ids),
  ])
  if (pErr || vErr) throw new Error(pErr?.message || vErr?.message)

  const products = new Map(
    withProductoCategorias((productsRaw ?? []) as unknown as Producto[]).map(p => [p.id, p]),
  )
  const tiposByProduct = new Map<string, VariacionTipo[]>()
  for (const t of (tiposRaw ?? []) as VariacionTipo[]) {
    const list = tiposByProduct.get(t.producto_id) ?? []
    list.push(t)
    tiposByProduct.set(t.producto_id, list)
  }

  const unitsByProduct = new Map<string, number>()
  const lines: PricedLine[] = []

  for (const item of items) {
    const producto = products.get(item.productId)
    if (!producto || !productoComprableEnCatalogo(producto, catalog)) {
      const name = producto ? shortName(producto.nombre) : 'Un producto'
      throw new OrderInputError(
        'product_unavailable',
        producto && productoAgotado(producto)
          ? `“${name}” se agotó. Quítalo del carrito para continuar.`
          : `“${name}” ya no está disponible. Quítalo del carrito para continuar.`,
      )
    }

    const units = (unitsByProduct.get(producto.id) ?? 0) + item.quantity
    unitsByProduct.set(producto.id, units)
    if (units > MAX_UNITS_PER_PRODUCT) {
      throw new OrderInputError(
        'too_many_units',
        `Máximo ${MAX_UNITS_PER_PRODUCT} unidades de “${shortName(producto.nombre)}” por pedido.`,
      )
    }

    // Variations: exactly one available option per type, matched by name.
    const tipos = normalizarVariacionesProducto(tiposByProduct.get(producto.id))
    const requested = item.variations && typeof item.variations === 'object' ? item.variations : {}
    const selection: Record<string, string[]> = {}
    const variations: Record<string, string> = {}
    for (const tipo of tipos) {
      const wanted = typeof requested[tipo.nombre] === 'string' ? requested[tipo.nombre].trim() : ''
      const opcion = tipo.opciones?.find(o => o.nombre.trim() === wanted)
      if (!opcion) {
        throw new OrderInputError(
          'variations_required',
          `Vuelve a elegir las opciones de “${shortName(producto.nombre)}” (por ejemplo el ${tipo.nombre.toLowerCase()}): quítalo del carrito y agrégalo de nuevo.`,
        )
      }
      selection[tipo.id] = [opcion.id]
      variations[tipo.nombre] = opcion.nombre
    }

    const cartItem: ItemCarrito = {
      producto,
      cantidad: item.quantity,
      variacionesSeleccionadas: tipos.length ? variations : undefined,
      variacionPrecioOverride: tipos.length ? buildVariacionPrecioOverride(tipos, selection) : null,
    }
    const { precio, precioAntes, consultar } = getItemPrecios(cartItem, catalog)
    const unitPrice = consultar || precio == null ? null : Math.round(precio)

    lines.push({
      productId: producto.id,
      productName: producto.nombre.slice(0, 200),
      productSku: producto.sku?.slice(0, 80) || null,
      variations: tipos.length ? variations : null,
      unitPrice,
      unitPriceBefore: unitPrice != null && precioAntes != null && precioAntes > unitPrice ? Math.round(precioAntes) : null,
      quantity: item.quantity,
      lineTotal: unitPrice == null ? null : unitPrice * item.quantity,
    })
  }

  return lines
}
