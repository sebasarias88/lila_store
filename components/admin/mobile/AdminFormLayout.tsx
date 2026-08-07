'use client'

import { ReactNode } from 'react'

type AdminFormLayoutProps = {
  children: ReactNode
  footer: ReactNode
}

export default function AdminFormLayout({ children, footer }: AdminFormLayoutProps) {
  return (
    <div className="mobile-admin-form flex min-h-0 flex-1 flex-col md:block">
      <div
        className="mobile-admin-form-scroll mobile-admin-below-bar min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 md:space-y-8 md:overflow-visible md:p-0 md:pt-0"
        data-lenis-prevent
      >
        {children}
      </div>
      <div className="mobile-admin-form-footer mt-4 shrink-0 border-t border-[rgba(169,137,224,0.18)] bg-[var(--bg-card)] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:sticky md:-mx-6 md:mt-0 md:px-6 md:py-4 md:pb-4">
        {footer}
      </div>
    </div>
  )
}
