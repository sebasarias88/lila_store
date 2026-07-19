import Link from 'next/link'

export default function MayoreoProductoNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-[10px] font-light uppercase tracking-[4px] text-[var(--gold-subtle)]">
        404
      </p>
      <h1 className="text-3xl font-thin uppercase tracking-[2px] text-[var(--text-primary)]">
        Producto no encontrado
      </h1>
      <p className="text-[13px] font-light text-[var(--text-subtle)]">
        El producto que buscas no existe o no está disponible en el catálogo mayorista.
      </p>
      <Link
        href="/mayorista/productos"
        className="rounded-[2px] border border-[var(--border)] px-6 py-3 text-[10px] font-light uppercase tracking-[2.5px] text-[var(--gold)] transition-all hover:bg-[var(--gold-muted)]"
      >
        Ver catálogo mayorista
      </Link>
    </div>
  )
}
