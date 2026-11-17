import { getAdminUser } from '@/lib/adminAuth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import MobileAdminShell from '@/components/admin/mobile/MobileAdminShell'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Being signed in is not enough: the account must be in private.admin_users.
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login')

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
