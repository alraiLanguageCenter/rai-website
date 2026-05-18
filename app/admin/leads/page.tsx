'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { toast } from 'sonner';

type Contact = { id: string; name: string; email: string; phone: string | null; course: string; message: string; locale: string; created_at: string };
type Attempt = { id: string; email: string | null; name: string | null; level: string; score: number; locale: string; created_at: string };

export default function LeadsPage() {
  return <AdminShell><Body /></AdminShell>;
}
function Body() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    sb.from('contact_submissions').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (error) toast.error('Contacts load failed'); setContacts((data ?? []) as Contact[]); });
    sb.from('quiz_attempts').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (error) toast.error('Attempts load failed'); setAttempts((data ?? []) as Attempt[]); });
  }, []);

  const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Leads</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Contact submissions and placement-test results.</p>

      <h2 className="mt-10 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">Contact form</h2>
      <div className="mt-4 overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ivory)] text-left text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Message</th></tr>
          </thead>
          <tbody className="bg-[var(--color-cream)]">
            {contacts === null && <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">Loading...</td></tr>}
            {(contacts ?? []).map((c) => (
              <tr key={c.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-soft)]">{fmt.format(new Date(c.created_at))}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3" dir="ltr"><a href={`mailto:${c.email}`} className="text-[var(--color-rlc-800)] hover:underline">{c.email}</a></td>
                <td className="px-4 py-3"><span className="rounded-full bg-[var(--color-rlc-100)] px-2 py-0.5 text-xs">{c.course}</span></td>
                <td className="px-4 py-3 max-w-md truncate">{c.message}</td>
              </tr>
            ))}
            {contacts?.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No contacts yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">Placement attempts</h2>
      <div className="mt-4 overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ivory)] text-left text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th></tr>
          </thead>
          <tbody className="bg-[var(--color-cream)]">
            {attempts === null && <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">Loading...</td></tr>}
            {(attempts ?? []).map((a) => (
              <tr key={a.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-soft)]">{fmt.format(new Date(a.created_at))}</td>
                <td className="px-4 py-3 font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{a.level}</td>
                <td className="px-4 py-3">{a.score}</td>
                <td className="px-4 py-3">{a.name ?? '—'}</td>
                <td className="px-4 py-3" dir="ltr">{a.email ? <a href={`mailto:${a.email}`} className="text-[var(--color-rlc-800)] hover:underline">{a.email}</a> : '—'}</td>
              </tr>
            ))}
            {attempts?.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No attempts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
