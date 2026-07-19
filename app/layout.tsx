import type { Metadata } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import ScrollToTop from '@/components/ScrollToTop'
import ConnectionStatus from '@/components/ConnectionStatus'
import { getSiteUrl } from '@/lib/seo'

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-baloo-2',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Catálogo detal — lila-store',
    template: '%s | lila-store',
  },
  description:
    'Catálogo detal de belleza y cuidado capilar en Carrera 15 #19-25 Local 8, Armenia, Quindío. Envíos a toda Colombia.',
  keywords: [
    'belleza',
    'cuidado capilar',
    'cosmética',
    'catálogo detal',
    'lila-store',
    'Armenia',
    'Quindío',
    'Colombia',
  ],
  applicationName: 'lila-store',
  authors: [{ name: 'lila-store' }],
  creator: 'lila-store',
  publisher: 'lila-store',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'lila-store',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${nunito.variable} ${baloo.variable}`}>
      <body className="min-h-screen antialiased">
        <ScrollToTop />
        <ConnectionStatus />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
