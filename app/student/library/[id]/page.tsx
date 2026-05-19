'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StudentShell } from '@/components/portal/StudentShell';
import { BookReader } from '@/components/portal/BookReader';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Book = { id: string; title: string; author: string | null; pdf_url: string };

export default function StudentBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <StudentShell><Body bookId={id} /></StudentShell>;
}

function Body({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data } = await sb.from('book_library').select('id,title,author,pdf_url').eq('id', bookId).maybeSingle();
      setBook(data as Book | null);
    })();
  }, [bookId]);

  if (!book) return <div className="grid h-32 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>;

  return (
    <div>
      <Link href="/student/library" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Library
      </Link>
      <h1 className="mt-4 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{book.title}</h1>
      {book.author && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{book.author}</p>}

      <div className="mt-6">
        <BookReader pdfUrl={book.pdf_url} title={book.title} />
      </div>
    </div>
  );
}
