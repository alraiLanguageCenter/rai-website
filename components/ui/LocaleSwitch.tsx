'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';

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

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--color-ink)] ring-1 ring-[var(--color-line)] transition hover:ring-[var(--color-rlc-800)] hover:text-[var(--color-rlc-800)] disabled:opacity-50 ${className ?? ''}`}
      aria-label={`Switch to ${t('switchTo')}`}
    >
      <Globe className="h-3.5 w-3.5 text-[var(--color-gold)]" />
      <span>{t('switchTo')}</span>
    </button>
  );
}
