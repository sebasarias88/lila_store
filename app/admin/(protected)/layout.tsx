import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import MobileAdminShell from '@/components/admin/mobile/MobileAdminShell'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  return (
    <div className="admin-shell min-h-screen bg-[var(--bg-base)]">
      <AdminSidebar />
      <MobileAdminShell>
        <main className="min-h-screen md:ml-64 max-md:pt-[calc(5.25rem+1.25rem+env(safe-area-inset-top,0px))]">
          {children}
        </main>
      </MobileAdminShell>
    </div>
  )
}
