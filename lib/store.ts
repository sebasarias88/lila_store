import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ItemCarrito, Producto } from '@/types'
import { getLineKey, itemLineKey } from '@/lib/cart'

type CartStore = {
  items: ItemCarrito[]
  agregar: (producto: Producto, variacionesSeleccionadas?: Record<string, string>) => void
  quitar: (lineKey: string) => void
  actualizarCantidad: (lineKey: string, cantidad: number) => void
  vaciar: () => void
  total: () => number
  cantidad: () => number
}

export const useCarrito = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, variacionesSeleccionadas) => {
        const lineKey = getLineKey(producto.id, variacionesSeleccionadas)
        const items = get().items
        const existe = items.find(i => itemLineKey(i) === lineKey)
        if (existe) {
          set({
            items: items.map(i =>
              itemLineKey(i) === lineKey
                ? { ...i, cantidad: i.cantidad + 1 }
                : i,
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                producto,
                cantidad: 1,
                variacionesSeleccionadas,
                lineKey,
              },
            ],
          })
        }
      },

      quitar: (lineKey) => {
        set({ items: get().items.filter(i => itemLineKey(i) !== lineKey) })
      },

      actualizarCantidad: (lineKey, cantidad) => {
        if (cantidad <= 0) {
          get().quitar(lineKey)
          return
        }
        set({
          items: get().items.map(i =>
            itemLineKey(i) === lineKey ? { ...i, cantidad } : i,
          ),
        })
      },

      vaciar: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (acc, i) => acc + i.producto.precio * i.cantidad,
          0,
        ),

      cantidad: () =>
        get().items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    { name: 'carrito-vm-fashion' },
  ),
)
