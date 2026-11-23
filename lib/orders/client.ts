'use client'

import type { CatalogType } from '@/lib/catalog'
import type { DatosCliente, ItemCarrito } from '@/types'
import type { CreateOrderRequest, CreateOrderResponse, CreatedOrder, DocumentType } from '@/lib/orders/shared'

/** Sends the cart to the server, which prices it again and saves the order. */
export async function submitOrder(params: {
  items: ItemCarrito[]
  datos: DatosCliente
  catalog: CatalogType
  shippingOptionId: string
  receiptPath: string | null
}): Promise<{ ok: true; order: CreatedOrder } | { ok: false; message: string }> {
  const { items, datos, catalog, shippingOptionId, receiptPath } = params
  const body: CreateOrderRequest = {
    catalog,
    items: items.map(i => ({
      productId: i.producto.id,
      quantity: i.cantidad,
      variations: i.variacionesSeleccionadas,
    })),
    customer: {
      name: datos.nombre,
      phone: datos.celular,
      documentType: datos.tipoDocumento as DocumentType,
      documentNumber: datos.numeroDocumento,
      deliveryType: datos.tipoEntrega,
      city: datos.ciudad,
      cityCode: datos.ciudadCodigo,
      address: datos.direccion,
      pickupBranch: datos.sucursalRecogida,
      notes: datos.notas,
    },
    invoice: {
      wanted: datos.quiereFactura === 'si',
      email: datos.facturaCorreo,
      otherHolder: datos.facturaOtroTitular === 'si',
      name: datos.facturaNombre,
      documentType: (datos.facturaTipoDocumento || '') as DocumentType | '',
      documentNumber: datos.facturaNumeroDocumento,
    },
    paymentMethod: datos.metodoPago,
    shippingOptionId,
    receiptPath,
    acceptsPolicies: datos.aceptaPoliticas === 'si',
  }

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => null)) as CreateOrderResponse | null
    if (data?.ok) return { ok: true, order: data.order }
    return {
      ok: false,
      message: data && !data.ok ? data.message : 'No pudimos registrar tu pedido. Intenta de nuevo.',
    }
  } catch {
    return { ok: false, message: 'Sin conexión. Revisa tu internet e intenta de nuevo.' }
  }
}
