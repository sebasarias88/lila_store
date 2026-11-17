import type { User } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'

/**
 * Returns the signed-in user only if they are an admin (private.admin_users),
 * checked through the `public.is_admin()` RPC. Otherwise returns null.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.rpc('is_admin')
  if (error || data !== true) return null
  return user
}
