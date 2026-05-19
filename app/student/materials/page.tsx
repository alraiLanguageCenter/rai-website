'use client';

import { useEffect, useState } from 'react';
import { Library, ExternalLink } from 'lucide-react';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Material = { id: string; title: string; url: string; kind: string; visibility: string; class_id: string | null; created_at: string };

export default function StudentMaterialsPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const [rows, setRows] = useState<Material[] | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      // RLS filters: visible_to=me OR enrolled OR visibility='all'
      const { data } = await sb.from('lesson_materials').select('*').order('created_at', { ascending: false });
      setRows((data ?? []) as Material[]);
    })();
  }, []);

  return (
    <div>
      <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
        <Library className="h-7 w-7 text-[var(--color-gold)]" /> Materials
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">PDFs, documents, and links your teachers shared with you.</p>

      <div className="mt-8 grid gap-3">
        {rows === null && <div className="grid h-24 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
        {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)]">No materials yet.</div>}
        {(rows ?? []).map((m) => (
          <a key={m.id} href={m.url} target="_blank" rel="noreferrer noopener"
            className="flex items-center gap-3 rounded-sm bg-[var(--color-cream)] px-4 py-3 ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]">
            <Library className="h-4 w-4 text-[var(--color-gold)]" />
            <span className="flex-1 font-medium">{m.title}</span>
            <span className="rounded-full bg-[var(--color-ivory)] px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]">{m.kind}</span>
            <ExternalLink className="h-4 w-4 text-[var(--color-rlc-800)]" />
          </a>
        ))}
      </div>
    </div>
  );
}
