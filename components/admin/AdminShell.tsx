'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Megaphone, CalendarRange, ClipboardList, FileQuestion, Users, LogOut, Image as ImageIcon, MessageSquare, MessageCircle, CalendarPlus, Sparkles } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin/announcements', label: 'Announcements', Icon: Megaphone },
  { href: '/admin/schedule',      label: 'Schedule',      Icon: CalendarRange },
  { href: '/admin/bookings',      label: 'Bookings',      Icon: ClipboardList },
  { href: '/admin/sessions',      label: 'Sessions',      Icon: CalendarPlus },
  { href: '/admin/complaints',    label: 'Complaints',    Icon: MessageCircle },
  { href: '/admin/quiz',          label: 'Quiz CMS',      Icon: FileQuestion },
  { href: '/admin/assessments',   label: 'Assessments',   Icon: Sparkles },
  { href: '/admin/chatbot',       label: 'Chatbot',       Icon: MessageSquare },
  { href: '/admin/leads',         label: 'Leads',         Icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    sb.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) { router.replace('/admin/login'); return; }
      setEmail(data.user.email ?? null);
      setChecked(true);
    });
  }, [router]);

  async function logout() {
    const sb = getSupabaseBrowser();
    await sb.auth.signOut();
    router.replace('/admin/login');
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
          <Logo />
          {/* Mobile sign-out / email — compact, inline with logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="hidden truncate text-xs text-[var(--color-ink-soft)] sm:inline">{email ?? '—'}</span>
            <button onClick={logout} aria-label="Sign out" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-rose)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rose)]/10">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <nav className="mt-5 flex flex-row gap-1 overflow-x-auto pb-1 lg:mt-10 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={cn(
                  'group inline-flex items-center gap-3 whitespace-nowrap rounded-sm px-3 py-2.5 text-sm transition',
                  active
                    ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rlc-100)] hover:text-[var(--color-rlc-800)]'
                )}>
                <n.Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden rounded-sm bg-[var(--color-cream)] p-4 ring-1 ring-[var(--color-line)] lg:block">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Signed in</div>
          <div className="mt-1 truncate text-sm">{email ?? '—'}</div>
          <button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-rose)] hover:underline">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="overflow-auto p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}

export { ImageIcon };
