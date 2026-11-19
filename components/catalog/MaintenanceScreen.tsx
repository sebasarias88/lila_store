import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { WHATSAPP_NUMERO } from '@/lib/negocio'

/** Shown instead of the catalog while MAINTENANCE_MODE=true. No database access. */
export default function MaintenanceScreen() {
  const whatsappUrl = buildWhatsAppUrl(
    WHATSAPP_NUMERO,
    'Hola, quiero hacer un pedido mientras actualizan la tienda 💕',
  )

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-base)] px-6 text-center">
      <Image src="/icon.png" alt="Lila Store" width={96} height={96} priority className="mb-7 rounded-[24px]" />
      <p className="mb-2 text-[13px] font-bold text-[var(--accent-deep)]">Volvemos pronto ✨</p>
      <h1 className="max-w-md text-[26px] font-extrabold leading-tight text-[var(--text-primary)]">
        Estamos poniendo bonita la tienda
      </h1>
      <p className="mt-3 max-w-sm text-[15px] font-medium leading-relaxed text-[var(--text-secondary)]">
        Mientras tanto te atendemos por WhatsApp: cuéntanos qué buscas y te enviamos fotos,
        precios y disponibilidad.
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-primary)] px-8 py-3 text-[14px] font-bold text-white"
      >
        <MessageCircle size={16} aria-hidden />
        Pedir por WhatsApp
      </a>
    </main>
  )
}
