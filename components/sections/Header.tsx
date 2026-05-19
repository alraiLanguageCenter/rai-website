'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { LocaleSwitch } from '@/components/ui/LocaleSwitch';
import { Button } from '@/components/ui/Button';

export function Header() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = [
    { href: '#story', label: t('story') },
    { href: '#courses', label: t('courses') },
    { href: '#journey', label: t('journey') },
    { href: '#schedule', label: t('schedule') },
    { href: '#assess', label: t('assess') },
    { href: '#contact', label: t('contact') },
  ];

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'backdrop-blur-md bg-[var(--color-cream)]/85 border-b border-[var(--color-line)]'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-10">
        {/* Logo with NO wordmark — just the mark + "Since 1995" line */}
        <Logo animated withText={false} />
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative text-[15px] font-semibold tracking-wide text-[var(--color-ink)] transition hover:text-[var(--color-rlc-800)]"
            >
              {item.label}
              <span className="absolute -bottom-1 start-0 h-[2px] w-0 rounded-full bg-[var(--color-gold)] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-2.5">
          <LocaleSwitch className="hidden md:inline-flex" />

          {/* Login — elegant outlined pill that fills on hover with a small icon swap */}
          <a
            href="/admin/login"
            className="group relative hidden items-center gap-2 overflow-hidden rounded-full bg-[var(--color-cream)] px-4 py-2 text-sm font-semibold text-[var(--color-rlc-800)] ring-1 ring-[var(--color-rlc-800)]/30 transition-all duration-300 hover:bg-[var(--color-rlc-800)] hover:text-[var(--color-cream)] hover:ring-[var(--color-rlc-800)] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-12px_rgba(8,57,34,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] md:inline-flex"
          >
            <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-rlc-800)]/10 text-[var(--color-rlc-800)] transition group-hover:bg-[var(--color-cream)]/20 group-hover:text-[var(--color-gold)]">
              <LogIn className="h-3 w-3" />
            </span>
            <span className="leading-none">{t('login')}</span>
            <span aria-hidden className="-me-1 inline-block opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5">→</span>
          </a>

          {/* Book a session — primary CTA with magnetic lift + animated glow ring */}
          <span className="relative hidden md:inline-flex">
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-[var(--color-gold)]/30 blur-md opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <Button
              href="#book"
              size="md"
              magnetic
              className="relative shadow-[0_14px_28px_-14px_rgba(8,57,34,0.55)] hover:shadow-[0_20px_36px_-14px_rgba(201,162,74,0.55)]"
            >
              {t('bookSession')}
              <span aria-hidden className="ms-0.5 inline-block transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5">→</span>
            </Button>
          </span>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:ring-[var(--color-rlc-800)]/40 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <span className="relative block h-3 w-4">
              <span className={cn('absolute inset-x-0 top-0 h-0.5 bg-current transition-transform', open && 'translate-y-1.5 rotate-45')} />
              <span className={cn('absolute inset-x-0 bottom-0 h-0.5 bg-current transition-transform', open && '-translate-y-1 -rotate-45')} />
            </span>
          </button>
        </div>
      </div>
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-[max-height,opacity] duration-500',
          open ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="border-t border-[var(--color-line)] bg-[var(--color-cream)] px-6 py-6">
          <nav className="flex flex-col gap-3">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="group inline-flex items-center justify-between rounded-sm px-3 py-2.5 text-lg font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-rlc-100)] hover:text-[var(--color-rlc-800)]"
              >
                {item.label}
                <span aria-hidden className="text-[var(--color-gold)] opacity-0 transition group-hover:opacity-100 rtl:rotate-180">→</span>
              </a>
            ))}
            <a
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="group mt-1 inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-4 py-2.5 text-base font-semibold text-[var(--color-rlc-800)] ring-1 ring-[var(--color-rlc-800)]/30 transition hover:bg-[var(--color-rlc-800)] hover:text-[var(--color-cream)] hover:ring-[var(--color-rlc-800)]"
            >
              <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-rlc-800)]/10 text-[var(--color-rlc-800)] transition group-hover:bg-[var(--color-cream)]/20 group-hover:text-[var(--color-gold)]">
                <LogIn className="h-3 w-3" />
              </span>
              {t('login')}
            </a>
          </nav>
          <div className="mt-6 flex items-center gap-3">
            <LocaleSwitch />
            <Button href="#book" size="md" magnetic className="shadow-[0_10px_22px_-12px_rgba(8,57,34,0.55)]">
              {t('bookSession')}
              <span aria-hidden className="rtl:rotate-180">→</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
