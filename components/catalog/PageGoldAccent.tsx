'use client'

import {
  GoldBrushStrokes,
  GoldDecorLayer,
  SparkleEffect,
} from '@/components/catalog/gold-decor-elements'

type PageGoldAccentProps = {
  className?: string
}

/** Acento dorado sutil para páginas interiores (catálogo, detalle, carrito). */
export default function PageGoldAccent({ className = '' }: PageGoldAccentProps) {
  return (
    <GoldDecorLayer className={className}>
      <GoldBrushStrokes
        intensity="subtle"
        showTopRight={false}
        showBottomAccent={false}
      />
      <SparkleEffect x="14%" y="6%" size={12} delay={0} opacity={0.12} />
      <SparkleEffect x="86%" y="10%" size={10} delay={1.2} opacity={0.08} />
    </GoldDecorLayer>
  )
}
