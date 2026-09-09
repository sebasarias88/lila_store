import toast from 'react-hot-toast'

const MAX_NOMBRE_TOAST = 40

export function truncateProductoNombre(
  nombre: string,
  max = MAX_NOMBRE_TOAST,
): string {
  const n = nombre.trim()
  if (n.length <= max) return n
  const corte = n.slice(0, max)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return (ultimoEspacio > 12 ? corte.slice(0, ultimoEspacio) : corte.trimEnd()) + '…'
}

export function toastProductoAgregado(nombre: string, emoji = '✨') {
  toast.success(`${truncateProductoNombre(nombre)} al carrito ${emoji}`, {
    className: 'app-toast-producto',
  })
}
