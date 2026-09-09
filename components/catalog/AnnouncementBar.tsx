'use client'

import { Fragment } from 'react'

const DEFAULT_MESSAGES = [
  '✨ 10% OFF con LILA10',
  '💖 Envío gratis en compras seleccionadas',
  '🛍️ Pedidos fáciles por WhatsApp',
  '⭐ Novedades cada semana',
  '🎀 Belleza fresca y accesible',
  '🌸 Catálogo Lila-store',
]

type AnnouncementBarProps = {
  messages?: string[]
}

export default function AnnouncementBar({
  messages = DEFAULT_MESSAGES,
}: AnnouncementBarProps) {
  const items = messages.filter(Boolean)
  if (!items.length) return null

  const track = [...items, ...items]

  return (
    <div
      className="catalog-announcement fixed inset-x-0 top-0 z-40 h-9 overflow-hidden"
      role="region"
      aria-label="Anuncios"
    >
      <div className="announcement-marquee flex h-full w-max items-center gap-5 px-4">
        {track.map((text, i) => (
          <Fragment key={`${text}-${i}`}>
            <span className="shrink-0 text-[11px] font-bold leading-none tracking-[0.02em] sm:text-[12px]">
              {text}
            </span>
            <span className="shrink-0 text-[10px] opacity-80" aria-hidden>
              ♡
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
