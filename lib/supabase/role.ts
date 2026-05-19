import 'server-only';
import { getSupabaseAdmin, isSupabaseConfigured } from './admin';

export type Role = 'admin' | 'teacher' | 'student' | null;

/**
 * Server-side role lookup. Uses the service-role key to read from the
 * `profiles` table (RLS-bypassing) so we always get a fresh role even
 * if the cookie session is stale.
 */
export async function getRoleForUser(userId: string): Promise<Role> {
  if (!isSupabaseConfigured()) return null;
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from('profiles').select('role').eq('id', userId).maybeSingle();
    return (data?.role as Role) ?? null;
  } catch {
    return null;
  }
}
