'use client'

import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { Toaster, ToastPosition } from 'react-hot-toast'

function useIsMobileToast() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isMobile
}

function AppToaster() {
  const isMobile = useIsMobileToast()

  const position: ToastPosition = isMobile ? 'top-center' : 'top-right'
  const containerClassName = isMobile
    ? 'app-toast-container app-toast-container--mobile'
    : 'app-toast-container app-toast-container--desktop'

  const shared = {
    duration: 3800,
    className: isMobile ? 'app-toast app-toast--mobile' : 'app-toast app-toast--desktop',
    success: {
      iconTheme: {
        primary: '#8FD9B6',
        secondary: '#FFFFFF',
      },
    },
    error: {
      iconTheme: {
        primary: '#E8798A',
        secondary: '#FFFFFF',
      },
    },
  }

  const mobileStyle = {
    background: '#FFFFFF',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontFamily: 'var(--font-nunito), Nunito, sans-serif',
    fontSize: '13px',
    fontWeight: '400',
    letterSpacing: '0.02em',
    lineHeight: '1.45',
    padding: '0.875rem 1rem',
    boxShadow: 'var(--shadow-soft)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  }

  const desktopStyle = {
    background: '#FFFFFF',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontFamily: 'var(--font-nunito), Nunito, sans-serif',
    fontSize: '13px',
    fontWeight: '500',
    letterSpacing: '0.03em',
    lineHeight: '1.5',
    padding: '0.8125rem 1rem',
    minWidth: '17.5rem',
    maxWidth: '22rem',
    boxShadow: 'var(--shadow-soft)',
  }

  return (
    <Toaster
      position={position}
      reverseOrder={false}
      gutter={isMobile ? 10 : 12}
      containerClassName={containerClassName}
      toastOptions={{
        ...shared,
        style: isMobile ? mobileStyle : desktopStyle,
      }}
    />
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      allowNestedScroll: true,
    })

    ;(window as Window & { __lenis?: Lenis }).__lenis = lenis

    let frameId = 0
    function raf(time: number) {
      lenis.raf(time)
      frameId = requestAnimationFrame(raf)
    }
    frameId = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(frameId)
      delete (window as Window & { __lenis?: Lenis }).__lenis
      lenis.destroy()
    }
  }, [])

  return (
    <>
      {children}
      <AppToaster />
    </>
  )
}
