'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Book = { id: string; title: string; author: string | null; description: string | null; language: string; level: string | null; cover_url: string | null; pdf_url: string };

export default function StudentLibraryPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data } = await sb.from('book_library').select('*').eq('is_public', true).order('sort_order');
      setBooks((data ?? []) as Book[]);
    })();
  }, []);

  return (
    <div>
      <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
        <BookOpen className="h-7 w-7 text-[var(--color-gold)]" /> Library
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Read with an interactive book-style reader. Flip pages, zoom, take your time.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {books === null && <div className="col-span-full grid h-24 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
        {books?.length === 0 && <div className="col-span-full rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)]">No books in the library yet.</div>}
        {(books ?? []).map((b) => (
          <Link key={b.id} href={`/student/library/${b.id}`} className="group block overflow-hidden rounded-sm bg-[var(--color-cream)] ring-1 ring-[var(--color-line)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(8,57,34,0.3)]">
            <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-[var(--color-rlc-800)] to-[var(--color-rlc-900)]">
              {b.cover_url ? <img src={b.cover_url} alt="" className="h-full w-full object-cover" /> : (
                <div className="absolute inset-0 grid place-items-center text-center text-[var(--color-cream)]">
                  <div>
                    <BookOpen className="mx-auto h-10 w-10 text-[var(--color-gold)]" />
                    <div className="mt-3 px-4 font-[var(--font-display)] text-lg italic">{b.title}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{b.title}</div>
              {b.author && <div className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{b.author}</div>}
              <div className="mt-3 flex gap-2 text-[0.65rem] uppercase tracking-[0.14em]">
                <span className="rounded-full bg-[var(--color-rlc-100)] px-2 py-0.5 text-[var(--color-rlc-800)]">{b.language}</span>
                {b.level && <span className="rounded-full bg-[var(--color-ivory)] px-2 py-0.5">{b.level}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
