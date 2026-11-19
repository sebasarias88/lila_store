import type { ReactNode } from 'react'
import { LEGAL_UPDATED_AT } from '@/lib/legal'

/** Shared layout for the legal pages: readable width, clear headings. */
export default function LegalPage({
  title,
  intro,
  children,
}: {
  title: string
  intro: ReactNode
  children: ReactNode
}) {
  return (
    <article className="legal-page mx-auto max-w-3xl px-5 pb-12 pt-28 sm:px-6 sm:pt-36 lg:pb-16 max-md:pt-[7rem]">
      <header className="mb-10 border-b border-[var(--border)] pb-8">
        <h1 className="text-[28px] font-extrabold leading-tight text-[var(--text-primary)] sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] font-semibold text-[var(--text-muted)]">
          Última actualización: {LEGAL_UPDATED_AT}
        </p>
        <div className="mt-5 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {intro}
        </div>
      </header>
      <div className="space-y-9 text-[15px] leading-relaxed text-[var(--text-secondary)] [&_h2]:mb-3 [&_h2]:text-[19px] [&_h2]:font-extrabold [&_h2]:text-[var(--text-primary)] [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p+p]:mt-3 [&_strong]:text-[var(--text-primary)] [&_ul]:mt-3 [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  )
}
