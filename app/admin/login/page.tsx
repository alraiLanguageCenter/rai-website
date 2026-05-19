'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Logo } from '@/components/ui/Logo';
import {
  Mail, ArrowRight, ShieldAlert, KeyRound, ArrowLeft, GraduationCap, UserPlus,
  Sparkles, Loader2, BookOpen,
} from 'lucide-react';

type Panel = 'signin' | 'reset' | 'reset-sent';

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const reduced = useReducedMotion();
  const [panel, setPanel] = useState<Panel>('signin');
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const denied = sp.get('denied') === '1';

  // If we were redirected here as a non-admin, sign out so they can try a different account.
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
        else setMagicSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPending(false);
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const sb = getSupabaseBrowser();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/login`,
      });
      if (error) { setError(error.message); return; }
      setPanel('reset-sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--color-cream)] px-5 py-10 sm:px-6">
      {/* === Animated brand backdrop === */}
      <Backdrop reduced={!!reduced} />

      <div className="relative w-full max-w-md">
        {/* Logo + title strip */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center"
        >
          <Logo />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 overflow-hidden rounded-2xl bg-[var(--color-ivory)] p-7 shadow-[0_30px_70px_-25px_rgba(8,57,34,0.4)] ring-1 ring-[var(--color-line)] sm:p-9"
        >
          <AnimatePresence mode="wait">
            {panel === 'signin' && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 14 }}
                  className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]"
                >
                  <Mail className="h-5 w-5" />
                  {!reduced && (
                    <motion.span
                      aria-hidden
                      className="absolute -inset-1 rounded-full border border-[var(--color-gold)]/40"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.8, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <h1 className="mt-6 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">Admin sign in</h1>

                {denied && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-start gap-2 rounded-sm bg-[var(--color-rose)]/10 p-3 text-xs text-[var(--color-rose)]"
                  >
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>That account does not have admin access. Sign in with an admin account, or use the student / teacher portal below.</span>
                  </motion.div>
                )}

                <div className="mt-4 inline-flex rounded-full bg-[var(--color-cream)] p-1 ring-1 ring-[var(--color-line)]">
                  <button onClick={() => { setMode('password'); setError(null); setMagicSent(false); }}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition ${mode === 'password' ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)]'}`}>
                    Password
                  </button>
                  <button onClick={() => { setMode('magic'); setError(null); setMagicSent(false); }}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition ${mode === 'magic' ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)]'}`}>
                    Magic link
                  </button>
                </div>

                {magicSent ? (
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
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-6 py-3 text-sm font-semibold text-[var(--color-cream)] shadow-[0_12px_28px_-12px_rgba(8,57,34,0.55)] transition hover:bg-[var(--color-rlc-700)] hover:-translate-y-0.5 disabled:opacity-50">
                      {pending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                      ) : (
                        <>{mode === 'password' ? 'Sign in' : 'Send magic link'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                      )}
                    </button>
                  </form>
                )}

                {/* Forgot password */}
                {mode === 'password' && !magicSent && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => { setPanel('reset'); setError(null); }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-rlc-800)] transition hover:text-[var(--color-gold)]"
                    >
                      <KeyRound className="h-3 w-3" /> Forgot your password?
                    </button>
                  </div>
                )}

                {/* Portal switcher */}
                <div className="mt-7 border-t border-[var(--color-line)] pt-5">
                  <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">Not an admin?</div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <PortalLink href="/student/login" Icon={GraduationCap} title="Student portal" subtitle="Take exams, AI tutor, marks" />
                    <PortalLink href="/teacher/login" Icon={BookOpen}      title="Teacher portal" subtitle="Classes, exams, grades" />
                  </div>
                  <a
                    href="/register"
                    className="group mt-3 inline-flex w-full items-center justify-between gap-2 rounded-sm bg-gradient-to-br from-[var(--color-gold)]/15 to-[var(--color-gold-soft)]/30 px-4 py-3 text-sm font-semibold text-[var(--color-rlc-900)] ring-1 ring-[var(--color-gold)]/40 transition hover:from-[var(--color-gold)]/25 hover:to-[var(--color-gold-soft)]/50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-[var(--color-gold)]" />
                      Apply as a new student
                    </span>
                    <Sparkles className="h-4 w-4 text-[var(--color-gold)] transition group-hover:scale-110" />
                  </a>
                </div>
              </motion.div>
            )}

            {panel === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35 }}
              >
                <button onClick={() => setPanel('signin')} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)]">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h1 className="mt-6 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">Reset your password</h1>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                  Enter your email and we'll send a secure link to set a new password.
                </p>
                <form onSubmit={sendReset} className="mt-6 space-y-3">
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@railanguagecenter.com" dir="ltr"
                    className="w-full rounded-sm border-0 bg-[var(--color-cream)] px-4 py-3 ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
                  />
                  {error && <p className="text-xs text-[var(--color-rose)]">{error}</p>}
                  <button type="submit" disabled={pending || !email}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-6 py-3 text-sm font-semibold text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] disabled:opacity-50">
                    {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {panel === 'reset-sent' && (
              <motion.div
                key="reset-sent"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45 }}
                className="text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]">
                  <Mail className="h-7 w-7" />
                </div>
                <h2 className="mt-6 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">Check your inbox 🌿</h2>
                <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
                  We sent a password-reset link to <strong>{email}</strong>. Click the link to set a new password, then come back here to sign in.
                </p>
                <button
                  onClick={() => { setPanel('signin'); setError(null); }}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-rlc-800)] hover:text-[var(--color-gold)]"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-soft)]">
          Need access? Contact the director to be added as admin.
        </p>
      </div>
    </main>
  );
}

function PortalLink({
  href, Icon, title, subtitle,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-start gap-2 rounded-sm bg-[var(--color-cream)] px-3 py-2.5 text-start ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-rlc-800)]/10 text-[var(--color-rlc-800)] transition group-hover:bg-[var(--color-rlc-800)] group-hover:text-[var(--color-gold)]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-[var(--color-rlc-900)]">{title}</div>
        <div className="text-[0.65rem] text-[var(--color-ink-soft)]">{subtitle}</div>
      </div>
    </a>
  );
}

/* -------------------- Animated backdrop -------------------- */

function Backdrop({ reduced }: { reduced: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {/* Conic field */}
      {!reduced && (
        <motion.div
          className="absolute -inset-[20%]"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(201,162,74,0.10), transparent 18%, rgba(14,81,50,0.10) 36%, transparent 60%, rgba(201,162,74,0.10) 80%, transparent 100%)',
            filter: 'blur(40px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {/* Drifting blobs */}
      {!reduced && (
        <>
          <motion.span className="absolute -top-32 start-[8%] block h-[400px] w-[400px] rounded-full bg-[var(--color-gold)]/25 blur-[100px]"
            animate={{ x: [0, 50, -30, 0], y: [0, 30, -20, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span className="absolute bottom-[-120px] end-[6%] block h-[360px] w-[360px] rounded-full bg-[var(--color-rlc-700)]/22 blur-[90px]"
            animate={{ x: [0, -40, 30, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
        </>
      )}
      {/* Dotted texture */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(8,57,34,0.4) 1px, transparent 1.5px)',
        backgroundSize: '22px 22px',
      }} />
      {/* Floating particles */}
      {!reduced && Array.from({ length: 10 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[var(--color-gold)]"
          style={{ top: `${(i * 43) % 100}%`, left: `${(i * 67) % 100}%`, opacity: 0.5 }}
          animate={{ y: [0, -16, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 4 + (i % 4), delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
