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
        <div className="flex items-center gap-2.5">
          <LocaleSwitch className="hidden md:inline-flex" />
          <a
            href="/admin/login"
            className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[var(--color-rlc-800)] ring-1 ring-[var(--color-rlc-800)]/30 transition hover:bg-[var(--color-rlc-800)] hover:text-[var(--color-cream)] hover:ring-[var(--color-rlc-800)] md:inline-flex"
          >
            <LogIn className="h-3.5 w-3.5" />
            {t('login')}
          </a>
          <Button href="#book" size="md" magnetic className="hidden md:inline-flex">
            {t('bookSession')}
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[var(--color-line)] lg:hidden"
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
          <nav className="flex flex-col gap-4">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-lg font-semibold text-[var(--color-ink)]"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--color-rlc-800)]"
            >
              <LogIn className="h-4 w-4" />
              {t('login')}
            </a>
          </nav>
          <div className="mt-6 flex items-center gap-3">
            <LocaleSwitch />
            <Button href="#book" size="md">
              {t('bookSession')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
