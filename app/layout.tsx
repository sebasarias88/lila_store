import type { Metadata, Viewport } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import ScrollToTop from '@/components/ScrollToTop'
import ConnectionStatus from '@/components/ConnectionStatus'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import { getSiteUrl } from '@/lib/seo'
import {
  SEO_DEFAULT_KEYWORDS,
  SEO_HOME_DESCRIPTION,
  SEO_HOME_TITLE,
  SITE_BRAND_NAME,
} from '@/lib/seo-brand'

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
    default: SEO_HOME_TITLE,
    template: `%s | ${SITE_BRAND_NAME}`,
  },
  description: SEO_HOME_DESCRIPTION,
  keywords: [...SEO_DEFAULT_KEYWORDS],
  applicationName: SITE_BRAND_NAME,
  authors: [{ name: SITE_BRAND_NAME }],
  creator: SITE_BRAND_NAME,
  publisher: SITE_BRAND_NAME,
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: SITE_BRAND_NAME,
    title: SEO_HOME_TITLE,
    description: SEO_HOME_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_HOME_TITLE,
    description: SEO_HOME_DESCRIPTION,
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

export const viewport: Viewport = {
  themeColor: '#A989E0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${nunito.variable} ${baloo.variable}`}>
      <head>
        {process.env.NEXT_PUBLIC_IMAGE_BASE_URL ? (
          // Product photos come from R2: open the connection early.
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_IMAGE_BASE_URL} crossOrigin="" />
        ) : null}
      </head>
      <body className="min-h-screen antialiased">
        <ScrollToTop />
        <ConnectionStatus />
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
