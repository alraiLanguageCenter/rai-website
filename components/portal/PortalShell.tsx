'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

export type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

/**
 * Shared sidebar shell for Teacher + Student portals.
 * Verifies the user is signed in AND has the expected role before rendering;
 * redirects to /<role>/login otherwise.
 */
export function PortalShell({
  role,
  loginPath,
  nav,
  children,
}: {
  role: 'teacher' | 'student';
  loginPath: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<{ email: string | null; name: string | null } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) { router.replace(loginPath); return; }
      // Role check via REST so the browser hits RLS
      const { data: profile } = await sb
        .from('profiles')
        .select('role,display_name,email')
        .eq('id', auth.user.id)
        .maybeSingle();
      if (!alive) return;
      // Admins can use any portal
      const allowed = profile?.role === role || profile?.role === 'admin';
      if (!allowed) { router.replace(loginPath + '?denied=1'); return; }
      setUser({ email: profile?.email ?? auth.user.email ?? null, name: profile?.display_name ?? null });
      setChecked(true);
    })();
    return () => { alive = false; };
  }, [router, loginPath, role]);

  async function logout() {
    const sb = getSupabaseBrowser();
    await sb.auth.signOut();
    router.replace(loginPath);
  }

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="flex flex-col border-b border-[var(--color-line)] bg-[var(--color-ivory)] p-5 lg:border-b-0 lg:border-r">
        <Logo />
        <div className="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-[var(--color-gold)]/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">
          {role}
        </div>
        <nav className="mt-8 flex flex-row gap-1 overflow-x-auto lg:mt-10 lg:flex-col">
          {nav.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'group inline-flex items-center gap-3 whitespace-nowrap rounded-sm px-3 py-2.5 text-sm transition',
                  active
                    ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rlc-100)] hover:text-[var(--color-rlc-800)]'
                )}
              >
                <n.Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden rounded-sm bg-[var(--color-cream)] p-4 ring-1 ring-[var(--color-line)] lg:block">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Signed in</div>
          <div className="mt-1 truncate text-sm">{user?.name ?? user?.email ?? 'You'}</div>
          <button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-rose)] hover:underline">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-auto p-6 lg:p-10"
      >
        {children}
      </motion.main>
    </div>
  );
}

/** Shared login screen for portals (magic-link via Supabase). */
export function PortalLogin({
  role,
  successHref,
}: {
  role: 'teacher' | 'student';
  successHref: string;
}) {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const sb = getSupabaseBrowser();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}${successHref}` },
      });
      if (error) setError(error.message);
      else setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-cream)] px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center"><Logo /></div>
        <div className="mt-10 rounded-sm bg-[var(--color-ivory)] p-8 ring-1 ring-[var(--color-line)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-cream)]">
            {role} portal
          </div>
          <h1 className="mt-6 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">Sign in</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Enter your email and we&apos;ll send you a one-time login link.
          </p>
          {done ? (
            <div className="mt-6 rounded-sm bg-[var(--color-rlc-100)] p-5 text-sm text-[var(--color-rlc-800)]">
              Check <strong>{email}</strong> for your sign-in link.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" dir="ltr"
                className="w-full rounded-sm border-0 bg-[var(--color-cream)] px-4 py-3 ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
              />
              {error && <p className="text-xs text-[var(--color-rose)]">{error}</p>}
              <button type="submit" disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-6 py-3 text-sm font-medium text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] disabled:opacity-50">
                {pending ? 'Sending...' : 'Send magic link →'}
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-[var(--color-ink-soft)]">
          Need access? Ask the administrator to add you as a {role}.
        </p>
      </div>
    </main>
  );
}
