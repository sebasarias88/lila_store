import type { Metadata } from 'next'
import { adminMetadata } from '@/lib/seo'

export const metadata: Metadata = adminMetadata

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
