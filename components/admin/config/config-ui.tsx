import type { ReactNode } from 'react'
import {
  Truck,
  CreditCard,
  Type,
  LucideIcon,
  Store,
} from 'lucide-react'

export type Config = Record<string, string>

export type TabId = 'negocio' | 'contenido' | 'envios' | 'pagos'

export type PaymentMethodsControls = {
  metodos: string[]
  nuevo: string
  setNuevo: (value: string) => void
  agregar: () => void
  quitar: (metodo: string) => void
}

export const CONFIG_TABS: { id: TabId; label: string; icon: LucideIcon; desc: string }[] = [
  { id: 'negocio', label: 'Negocio', icon: Store, desc: 'Nombre y WhatsApp' },
  { id: 'contenido', label: 'Contenido', icon: Type, desc: 'Textos del inicio' },
  { id: 'envios', label: 'Envíos', icon: Truck, desc: 'Costos y tiempos' },
  { id: 'pagos', label: 'Pagos', icon: CreditCard, desc: 'Métodos de pago' },
]

export function InfoBanner({
  icon: Icon,
  children,
  compact,
}: {
  icon: LucideIcon
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-[rgba(232,136,181,0.22)] bg-[rgba(232,136,181,0.06)] shadow-[inset_0_1px_0_rgba(232,136,181,0.08)] md:rounded-xl ${
        compact ? 'px-3.5 py-3' : 'px-4 py-3.5'
      }`}
    >
      <Icon size={16} className="mt-0.5 shrink-0 text-[var(--accent-secondary)]" />
      <p className="text-[12px] font-light leading-relaxed text-[var(--text-muted)]">{children}</p>
    </div>
  )
}

export function FormSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-[rgba(232,136,181,0.35)] to-transparent" />
        <h3 className="shrink-0 text-[10px] font-medium uppercase tracking-[2.5px] text-[var(--accent-primary)]">
          {title}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-l from-[rgba(232,136,181,0.35)] to-transparent" />
      </div>
      {children}
    </section>
  )
}
