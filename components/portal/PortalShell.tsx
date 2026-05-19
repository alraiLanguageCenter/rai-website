'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
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
      <aside className="flex flex-col border-b border-[var(--color-line)] bg-[var(--color-ivory)] p-4 lg:border-b-0 lg:border-r lg:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-gold)]/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">
              {role}
            </span>
          </div>
          {/* Mobile sign-out — inline with logo so users can always log out on phones. */}
          <button
            onClick={logout}
            aria-label="Sign out"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-rose)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rose)]/10 lg:hidden"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
        <nav className="mt-5 flex flex-row gap-1 overflow-x-auto pb-1 lg:mt-10 lg:flex-col lg:overflow-visible lg:pb-0">
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
        className="overflow-auto p-5 sm:p-6 lg:p-10"
      >
        {children}
      </motion.main>
    </div>
  );
}

/** Shared portal login. Supports password sign-in (default) AND magic link. */
export function PortalLogin({
  role,
  successHref,
}: {
  role: 'teacher' | 'student';
  successHref: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const denied = sp.get('denied') === '1';

  // If we were redirected here because the account didn't match the role,
  // sign them out so they can switch accounts without a stale session.
  useEffect(() => {
    if (!denied) return;
    const sb = getSupabaseBrowser();
    sb.auth.signOut().catch(() => {});
  }, [denied]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const sb = getSupabaseBrowser();
      if (mode === 'password') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        router.push(successHref);
      } else {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}${successHref}` },
        });
        if (error) setError(error.message);
        else setDone(true);
      }
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
          {denied && (
            <div className="mt-4 flex items-start gap-2 rounded-sm bg-[var(--color-rose)]/10 p-3 text-xs text-[var(--color-rose)]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>That account isn&apos;t registered as a {role}. Sign in with a {role} account, or ask the administrator to grant access.</span>
            </div>
          )}
          <div className="mt-4 inline-flex rounded-full bg-[var(--color-cream)] p-1 ring-1 ring-[var(--color-line)]">
            <button onClick={() => { setMode('password'); setDone(false); setError(null); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${mode === 'password' ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)]'}`}>
              Password
            </button>
            <button onClick={() => { setMode('magic'); setDone(false); setError(null); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${mode === 'magic' ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)]'}`}>
              Magic link
            </button>
          </div>
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
              {mode === 'password' && (
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" autoComplete="current-password"
                  className="w-full rounded-sm border-0 bg-[var(--color-cream)] px-4 py-3 ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
                />
              )}
              {error && <p className="text-xs text-[var(--color-rose)]">{error}</p>}
              <button type="submit" disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-6 py-3 text-sm font-medium text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] disabled:opacity-50">
                {pending ? (mode === 'password' ? 'Signing in...' : 'Sending...') : (mode === 'password' ? 'Sign in →' : 'Send magic link →')}
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-[var(--color-ink-soft)]">
          {role === 'student' ? (
            <>
              First time here?{' '}
              <a href="/register" className="font-semibold text-[var(--color-rlc-800)] underline-offset-2 hover:underline">
                Apply as a new student
              </a>{' '}— once approved you&apos;ll receive your sign-in details by email.
            </>
          ) : (
            <>
              First time here? Ask the administrator to create your teacher account — you&apos;ll then sign in with the credentials they share.
            </>
          )}
        </p>
      </div>
    </main>
  );
}
