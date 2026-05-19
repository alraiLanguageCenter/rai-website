'use client';

import { useEffect, useState } from 'react';
import { FileQuestion, Download } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Attempt = { id: string; email: string | null; name: string | null; level: string; score: number; locale: string; created_at: string; answers: unknown };

export default function AdminAssessmentsPage() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [rows, setRows] = useState<Attempt[] | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data } = await sb.from('quiz_attempts').select('*').order('created_at', { ascending: false }).limit(500);
      setRows((data ?? []) as Attempt[]);
    })();
  }, []);

  function download() {
    if (!rows) return;
    const header = ['Date', 'Name', 'Email', 'Level', 'Score', 'Locale'];
    const lines = [header.join(',')];
    rows.forEach((r) => {
      const safe = (s: string | null | undefined) => (s ?? '').replace(/"/g, '""');
      lines.push([
        new Date(r.created_at).toISOString(),
        `"${safe(r.name)}"`,
        `"${safe(r.email)}"`,
        r.level,
        String(r.score),
        r.locale,
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rai-assessments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
            <FileQuestion className="h-6 w-6 text-[var(--color-gold)]" /> AI Assessment results
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">All placement test submissions, newest first.</p>
        </div>
        <button onClick={download} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Download className="h-4 w-4" /> Download CSV
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ivory)] text-left text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-cream)]">
            {rows === null && <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">Loading…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No assessments yet.</td></tr>}
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3 text-xs text-[var(--color-ink-soft)]">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{r.name ?? '—'}</td>
                <td className="px-4 py-3" dir="ltr">{r.email ?? '—'}</td>
                <td className="px-4 py-3 font-[var(--font-display)] text-base text-[var(--color-rlc-900)]">{r.level}</td>
                <td className="px-4 py-3">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
