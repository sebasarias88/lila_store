import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'lila-store — Belleza cute en Armenia y Quimbaya'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #F9F6FF 0%, #EEE8FC 45%, #F8EAF4 100%)',
          color: '#2A2240',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 2,
              background: '#A989E0',
            }}
          />
          <span
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#6E4FA8',
              fontWeight: 600,
            }}
          >
            Armenia · Quimbaya · Quindío
          </span>
          <div
            style={{
              width: 48,
              height: 2,
              background: '#A989E0',
            }}
          />
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: 2,
            textAlign: 'center',
            lineHeight: 1.1,
            color: '#6E4FA8',
          }}
        >
          lila-store
        </div>
        <p
          style={{
            marginTop: 28,
            fontSize: 26,
            fontWeight: 500,
            color: '#6B6080',
            textAlign: 'center',
            maxWidth: 760,
            lineHeight: 1.4,
          }}
        >
          Belleza cute · Maquillaje, skincare y cuidados ✨
        </p>
      </div>
    ),
    { ...size },
  )
}
