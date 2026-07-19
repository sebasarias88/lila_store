'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'

type GoldDecorationsProps = {
  className?: string
}

type SparkleEffectProps = {
  x: string
  y: string
  size: number
  delay: number
  opacity: number
}

function SparkleEffect({ x, y, size, delay, opacity }: SparkleEffectProps) {
  const gradId = `sparkGrad${delay}`

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, opacity, opacity * 0.6, opacity, 0],
        scale: [0, 1, 0.8, 1.1, 0],
        rotate: [0, 15, 0, -10, 0],
      }}
      transition={{
        duration: 3 + delay,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6C76A" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
        <path
          d="M20,2 L21.5,18.5 L38,20 L21.5,21.5 L20,38 L18.5,21.5 L2,20 L18.5,18.5 Z"
          fill={`url(#${gradId})`}
        />
        <line x1="20" y1="0" x2="20" y2="40" stroke="#E6C76A" strokeWidth="0.5" opacity="0.4" />
        <line x1="0" y1="20" x2="40" y2="20" stroke="#E6C76A" strokeWidth="0.5" opacity="0.4" />
      </svg>
    </motion.div>
  )
}

const GOLD_LINE_GRADIENT =
  'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.08) 20%, rgba(212,175,55,0.15) 50%, rgba(212,175,55,0.08) 80%, transparent 100%)'

export default function GoldDecorations({ className = '' }: GoldDecorationsProps) {
  const uid = useId().replace(/:/g, '')
  const grad1 = `goldGrad1-${uid}`
  const grad2 = `goldGrad2-${uid}`
  const grad3 = `goldGrad3-${uid}`

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      aria-hidden
    >
      {/* Shared gradient definitions */}
      <svg width={0} height={0} className="absolute" aria-hidden>
        <defs>
          <linearGradient id={grad1} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6C76A" stopOpacity={0} />
            <stop offset="30%" stopColor="#D4AF37" stopOpacity={1} />
            <stop offset="70%" stopColor="#E6C76A" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={grad2} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0} />
            <stop offset="25%" stopColor="#E6C76A" stopOpacity={0.9} />
            <stop offset="65%" stopColor="#D4AF37" stopOpacity={1} />
            <stop offset="100%" stopColor="#E6C76A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={grad3} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0} />
            <stop offset="40%" stopColor="#E6C76A" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {/* 1. Top-left brush stroke */}
      <motion.div
        className="absolute left-0 top-0"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <svg
          viewBox="0 0 300 200"
          className="absolute left-0 top-0 w-[320px] opacity-[0.15]"
          style={{ pointerEvents: 'none' }}
        >
          <path
            d="M-20,40 Q40,10 120,30 Q200,50 280,20 Q260,35 180,50 Q100,65 20,80 Z"
            fill={`url(#${grad1})`}
          />
          <path
            d="M10,60 Q80,35 160,55 Q240,75 300,45"
            stroke="#E6C76A"
            strokeWidth={1.5}
            fill="none"
            opacity={0.6}
          />
          <path
            d="M0,80 Q60,55 140,70 Q220,85 290,60"
            stroke="#D4AF37"
            strokeWidth={0.8}
            fill="none"
            opacity={0.4}
          />
        </svg>
      </motion.div>

      {/* 2. Top-right brush stroke (mirrored, larger) */}
      <motion.div
        className="absolute right-0 top-0"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <svg
          viewBox="0 0 300 200"
          className="absolute right-0 top-0 w-[380px] opacity-[0.18]"
          style={{
            pointerEvents: 'none',
            transform: 'scaleX(-1)',
          }}
        >
          <path
            d="M-10,45 Q50,8 135,28 Q215,48 290,15 Q275,30 185,48 Q105,62 18,78 Z"
            fill={`url(#${grad2})`}
          />
          <path
            d="M5,58 Q90,30 170,52 Q250,72 305,38"
            stroke="#E6C76A"
            strokeWidth={1.6}
            fill="none"
            opacity={0.65}
          />
          <path
            d="M-5,78 Q70,52 150,68 Q235,82 295,55"
            stroke="#D4AF37"
            strokeWidth={0.9}
            fill="none"
            opacity={0.45}
          />
        </svg>
      </motion.div>

      {/* 3. Bottom-left small accent (rotated 180°) */}
      <motion.div
        className="absolute bottom-0 left-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <svg
          viewBox="0 0 300 200"
          className="absolute bottom-0 left-0 w-[220px] opacity-10"
          style={{
            pointerEvents: 'none',
            transform: 'rotate(180deg)',
            transformOrigin: 'bottom left',
          }}
        >
          <path
            d="M-15,35 Q38,14 105,26 Q175,44 255,12 Q242,26 155,38 Q72,50 8,62 Z"
            fill={`url(#${grad3})`}
          />
          <path
            d="M12,52 Q75,38 145,48 Q210,62 275,40"
            stroke="#E6C76A"
            strokeWidth={1.2}
            fill="none"
            opacity={0.5}
          />
          <path
            d="M0,68 Q55,58 125,66 Q195,74 268,58"
            stroke="#D4AF37"
            strokeWidth={0.7}
            fill="none"
            opacity={0.35}
          />
        </svg>
      </motion.div>

      {/* 4. Sparkle / lens flare effects */}
      <SparkleEffect x="8%" y="15%" size={24} delay={0} opacity={0.9} />
      <SparkleEffect x="88%" y="8%" size={32} delay={1.5} opacity={0.85} />
      <SparkleEffect x="92%" y="75%" size={18} delay={0.8} opacity={0.7} />
      <SparkleEffect x="5%" y="80%" size={14} delay={2.2} opacity={0.6} />
      <SparkleEffect x="50%" y="5%" size={10} delay={3} opacity={0.5} />

      {/* 5. Horizontal gold line accents */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: 0,
          right: 0,
          height: '1px',
          background: GOLD_LINE_GRADIENT,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '70%',
          left: 0,
          right: 0,
          height: '1px',
          background: GOLD_LINE_GRADIENT,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
