'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, X } from 'lucide-react';

// react-pdf renders client-only and needs its worker URL to be set once.
// We import lazily so it never ends up in the SSR bundle.
import type { DocumentProps } from 'react-pdf';

const PDF_OPTIONS = {
  cMapUrl: '/cmaps/',
};

export function BookReader({ pdfUrl, title }: { pdfUrl: string; title: string }) {
  const [Document, setDocument] = useState<React.ComponentType<DocumentProps> | null>(null);
  const [Page, setPage] = useState<React.ComponentType<{ pageNumber: number; width?: number; scale?: number }> | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const mod = await import('react-pdf');
        // pdfjs worker URL — use the bundled worker via dynamic import
        const pdfjs = mod.pdfjs;
        // ESM worker via CDN keeps build simple
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        setDocument(() => mod.Document as unknown as React.ComponentType<DocumentProps>);
        setPage(() => mod.Page as unknown as React.ComponentType<{ pageNumber: number; width?: number; scale?: number }>);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load reader');
      }
    })();
  }, []);

  function flip(dir: 1 | -1) {
    const next = Math.max(1, Math.min(numPages, pageNum + dir));
    if (next === pageNum) return;
    setDirection(dir);
    setPageNum(next);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') flip(1);
      else if (e.key === 'ArrowLeft') flip(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageNum, numPages]);

  if (error) {
    return <div className="rounded-sm bg-[var(--color-rose)]/10 p-6 text-sm text-[var(--color-rose)]">Failed to load reader: {error}</div>;
  }

  return (
    <div className="rounded-sm bg-[var(--color-rlc-900)] p-4 lg:p-8" style={{ perspective: 2400 }}>
      <div className="flex items-center justify-between text-[var(--color-cream)]">
        <div className="text-sm font-medium">{title}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))} className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-cream)]/10 hover:bg-[var(--color-cream)]/20"><ZoomOut className="h-4 w-4" /></button>
          <span className="w-12 text-center text-xs">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(2.5, s + 0.2))} className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-cream)]/10 hover:bg-[var(--color-cream)]/20"><ZoomIn className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-4 min-h-[60vh] overflow-hidden">
        {!Document || !Page ? (
          <div className="grid h-72 place-items-center text-[var(--color-cream)]/60">
            <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading reader…</div>
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }: { numPages: number }) => setNumPages(numPages)}
            onLoadError={(e: Error) => setError(e.message || 'PDF load error')}
            options={PDF_OPTIONS}
            loading={<div className="grid h-72 place-items-center text-[var(--color-cream)]/60"><div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading PDF…</div></div>}
            error={<div className="rounded-sm bg-[var(--color-rose)]/10 p-6 text-center text-sm text-[var(--color-rose)]">Could not load this PDF. The file may not be hosted publicly yet.</div>}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={pageNum}
                custom={direction}
                initial={{ rotateY: direction > 0 ? 70 : -70, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: direction > 0 ? -70 : 70, opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: direction > 0 ? 'left center' : 'right center', transformStyle: 'preserve-3d' }}
                className="mx-auto flex justify-center"
              >
                <div className="overflow-hidden rounded bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
                  <Page pageNumber={pageNum} scale={scale} />
                </div>
              </motion.div>
            </AnimatePresence>
          </Document>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[var(--color-cream)]">
        <button onClick={() => flip(-1)} disabled={pageNum <= 1}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)]/10 px-4 py-2 text-sm hover:bg-[var(--color-cream)]/20 disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <div className="text-xs uppercase tracking-[0.14em] opacity-70">{pageNum} / {numPages || '—'}</div>
        <button onClick={() => flip(1)} disabled={pageNum >= numPages}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-rlc-900)] hover:bg-[var(--color-gold-bright)] disabled:opacity-30">
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export { X };
