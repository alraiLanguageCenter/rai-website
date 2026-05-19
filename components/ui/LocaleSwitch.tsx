'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';

/**
 * A polished pill that toggles AR ↔ EN with a small flag icon, a glyph from the
 * target language as a "preview", and a subtle hover lift + gold ring transition.
 */
export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = locale === 'ar' ? 'en' : 'ar';
    const segments = pathname.split('/');
    if (segments[1] === 'ar' || segments[1] === 'en') segments[1] = next;
    else segments.splice(1, 0, next);
    startTransition(() => router.push(segments.join('/') || `/${next}`));
  }

  // Target locale glyph as a tiny preview chip
  const isArNow = locale === 'ar';
  const targetGlyph = isArNow ? 'EN' : 'ع';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={`Switch to ${t('switchTo')}`}
      className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[var(--color-cream)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] ring-1 ring-[var(--color-line)] transition-all duration-300 hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)] hover:shadow-[0_8px_22px_-12px_rgba(201,162,74,0.55)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
    >
      {/* Spinning gold ring on hover */}
      <span
        aria-hidden
        className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)] transition-transform duration-700 ease-out group-hover:rotate-[180deg]"
      >
        <Globe className="h-3 w-3" />
      </span>
      <span className="leading-none">{t('switchTo')}</span>
      <span
        aria-hidden
        className="ms-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-rlc-800)]/10 px-1.5 font-[var(--font-display)] text-[0.65rem] font-semibold text-[var(--color-rlc-800)] transition group-hover:bg-[var(--color-rlc-800)] group-hover:text-[var(--color-cream)]"
      >
        {targetGlyph}
      </span>
    </button>
  );
}
