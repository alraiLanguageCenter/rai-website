'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Logo } from '@/components/ui/Logo';
import { Mail, ArrowRight, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const denied = sp.get('denied') === '1';

  // If already signed in as a non-admin, sign them out so they can switch accounts.
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
        router.push('/admin');
      } else {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]">
            <Mail className="h-5 w-5" />
          </div>
          <h1 className="mt-6 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">Admin sign in</h1>
          {denied && (
            <div className="mt-4 flex items-start gap-2 rounded-sm bg-[var(--color-rose)]/10 p-3 text-xs text-[var(--color-rose)]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>That account does not have admin access. Sign in with an admin account.</span>
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
                placeholder="you@railanguagecenter.com" dir="ltr"
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
                {pending ? (mode === 'password' ? 'Signing in...' : 'Sending...') : (mode === 'password' ? <>Sign in <ArrowRight className="h-4 w-4" /></> : <>Send magic link <ArrowRight className="h-4 w-4" /></>)}
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-[var(--color-ink-soft)]">
          Need access? Contact the director to be added as admin.
        </p>
      </div>
    </main>
  );
}
