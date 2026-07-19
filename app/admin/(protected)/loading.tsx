export default function AdminLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <span
        className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent-secondary)]"
        aria-hidden
      />
      <p className="text-[12px] font-bold text-[var(--text-subtle)]">
        Cargando
      </p>
      <span className="sr-only">Cargando panel</span>
    </div>
  )
}
