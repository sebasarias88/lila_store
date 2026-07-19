'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { adminPageTitle } from '@/lib/admin-nav'
import MobileAdminHeader from '@/components/admin/mobile/MobileAdminHeader'
import MobileNavigation from '@/components/admin/mobile/MobileNavigation'

export default function MobileAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <>
      <div className="md:hidden">
        <MobileAdminHeader
          title={adminPageTitle(pathname)}
          onMenuOpen={() => setNavOpen(true)}
        />
        <MobileNavigation open={navOpen} onClose={() => setNavOpen(false)} />
      </div>
      {children}
    </>
  )
}
