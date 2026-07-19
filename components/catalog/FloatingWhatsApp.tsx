'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { catalogPath, type CatalogType } from '@/lib/catalog'
import { buildWhatsAppUrl, mensajeConsultaWhatsApp } from '@/lib/whatsapp'

type Props = {
  whatsapp: string
  catalogType?: CatalogType
  /** Mensaje prellenado al abrir el chat (si no se pasa, usa el del contexto flotante) */
  mensaje?: string
}

function WhatsAppIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/**
 * Botón flotante de WhatsApp solo desktop.
 * Verde recognizable + acabado pastel alineado al catálogo.
 */
export default function FloatingWhatsApp({
  whatsapp,
  catalogType = 'detal',
  mensaje,
}: Props) {
  const pathname = usePathname()
  const digits = whatsapp.replace(/\D/g, '')
  if (!digits) return null

  const carritoHref = catalogPath(catalogType, '/carrito')
  const isCarrito =
    pathname === carritoHref || pathname.startsWith(`${carritoHref}/`)

  if (isCarrito) return null

  const text = mensaje ?? mensajeConsultaWhatsApp('flotante', catalogType)
  const href = buildWhatsAppUrl(whatsapp, text)

  return (
    <motion.div
      className="fixed bottom-7 right-7 z-[40] hidden md:block"
      initial={{ opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.45, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative h-[3.75rem] w-[3.75rem]">
        {/* Soft pastel halo */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full bg-[rgba(232,136,181,0.22)] blur-[6px]"
        />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366]/40"
          animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeOut',
            repeatDelay: 0.6,
          }}
        />

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
          title="WhatsApp"
          className="group relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#3DDB7A] via-[#25D366] to-[#1EBE57] text-white shadow-[0_4px_0_0_rgba(22,163,74,0.35),0_10px_28px_-6px_rgba(232,136,181,0.4),0_8px_18px_-6px_rgba(37,211,102,0.55)] ring-[3px] ring-white transition-[transform,box-shadow,filter] duration-200 will-change-transform hover:scale-[1.06] hover:brightness-[1.03] hover:shadow-[0_5px_0_0_rgba(22,163,74,0.3),0_14px_32px_-6px_rgba(232,136,181,0.45),0_10px_22px_-6px_rgba(37,211,102,0.55)] active:translate-y-[2px] active:scale-[0.98] active:shadow-[0_2px_0_0_rgba(22,163,74,0.35),0_6px_16px_-4px_rgba(37,211,102,0.4)]"
        >
          {/* Soft shine on top of the button */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[3px] rounded-full bg-gradient-to-b from-white/35 via-white/5 to-transparent"
          />
          <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
            <WhatsAppIcon size={27} />
          </span>

          <span className="pointer-events-none absolute right-full top-1/2 mr-3 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 text-[12px] font-bold text-[var(--accent-deep)] opacity-0 shadow-[var(--shadow-soft)] transition-opacity duration-200 group-hover:opacity-100">
            <span aria-hidden>💬</span>
            Escríbenos
          </span>
        </a>
      </div>
    </motion.div>
  )
}
