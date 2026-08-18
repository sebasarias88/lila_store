import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ItemCarrito, Producto } from '@/types'
import { getLineKey, itemLineKey } from '@/lib/cart'
import type { CatalogType } from '@/lib/catalog'
import {
  getStockCatalogo,
  mensajeStockRestante,
  stockRestanteParaProducto,
  type StockProductoFresh,
} from '@/lib/stock'

export type AgregarResultado =
  | { ok: true }
  | { ok: false; restantes: number; message: string }

type CartStore = {
  items: ItemCarrito[]
  agregar: (
    producto: Producto,
    variacionesSeleccionadas?: Record<string, string>,
    catalogType?: CatalogType,
    cantidad?: number,
  ) => AgregarResultado
  quitar: (lineKey: string) => void
  actualizarCantidad: (
    lineKey: string,
    cantidad: number,
    catalogType?: CatalogType,
  ) => AgregarResultado
  vaciar: () => void
  /** Actualiza stock/disponibilidad de productos en el carrito con datos frescos. */
  aplicarStockFresco: (freshById: Record<string, StockProductoFresh>) => void
  total: () => number
  cantidad: () => number
}

export const useCarrito = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (
        producto,
        variacionesSeleccionadas,
        catalogType = 'detal',
        cantidad = 1,
      ) => {
        const qty = Math.max(1, Math.floor(cantidad) || 1)
        const restantes = stockRestanteParaProducto(
          producto,
          get().items,
          catalogType,
        )
        if (restantes <= 0) {
          return {
            ok: false,
            restantes: 0,
            message: mensajeStockRestante(0),
          }
        }
        const toAdd = Math.min(qty, restantes)
        const lineKey = getLineKey(producto.id, variacionesSeleccionadas)
        const items = get().items
        const existe = items.find(i => itemLineKey(i) === lineKey)

        if (existe) {
          set({
            items: items.map(i =>
              itemLineKey(i) === lineKey
                ? { ...i, cantidad: i.cantidad + toAdd }
                : i,
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                producto,
                cantidad: toAdd,
                variacionesSeleccionadas,
                lineKey,
              },
            ],
          })
        }

        if (toAdd < qty) {
          const left = restantes - toAdd
          return {
            ok: false,
            restantes: left,
            message: mensajeStockRestante(restantes),
          }
        }
        return { ok: true }
      },

      quitar: lineKey => {
        set({ items: get().items.filter(i => itemLineKey(i) !== lineKey) })
      },

      actualizarCantidad: (lineKey, cantidad, catalogType = 'detal') => {
        if (cantidad <= 0) {
          get().quitar(lineKey)
          return { ok: true }
        }

        const items = get().items
        const item = items.find(i => itemLineKey(i) === lineKey)
        if (!item) return { ok: true }

        const maxForLine =
          stockRestanteParaProducto(
            item.producto,
            items,
            catalogType,
            lineKey,
          ) + item.cantidad

        const stock = getStockCatalogo(item.producto, catalogType)
        const capped = Math.min(Math.floor(cantidad), maxForLine, stock)

        set({
          items: items.map(i =>
            itemLineKey(i) === lineKey ? { ...i, cantidad: capped } : i,
          ),
        })

        if (capped < cantidad) {
          return {
            ok: false,
            restantes: Math.max(0, stock - capped),
            message: mensajeStockRestante(
              stockRestanteParaProducto(item.producto, get().items, catalogType),
            ),
          }
        }
        return { ok: true }
      },

      vaciar: () => set({ items: [] }),

      aplicarStockFresco: freshById => {
        set({
          items: get().items.map(i => {
            const fresh = freshById[i.producto.id]
            if (!fresh) return i
            return {
              ...i,
              producto: {
                ...i.producto,
                stock_detal: fresh.stock_detal,
                stock_mayoreo: fresh.stock_mayoreo,
                disponible: fresh.disponible,
                disponible_detal: fresh.disponible_detal,
                disponible_mayoreo: fresh.disponible_mayoreo,
              },
            }
          }),
        })
      },

      total: () =>
        get().items.reduce(
          (acc, i) => acc + i.producto.precio * i.cantidad,
          0,
        ),

      cantidad: () =>
        get().items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    { name: 'carrito-lila-store' },
  ),
)
