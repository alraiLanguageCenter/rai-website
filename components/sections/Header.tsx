'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5 lg:px-10">
        <Logo animated />
        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href}
               className="group relative text-sm font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-rlc-800)]">
              {item.label}
              <span className="absolute -bottom-1 start-0 h-px w-0 bg-[var(--color-gold)] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitch className="hidden md:inline-flex" />
          <Button href="#book" size="md" magnetic className="hidden md:inline-flex">{t('bookSession')}</Button>
          <button type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[var(--color-line)] lg:hidden"
            onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
            <span className="relative block h-3 w-4">
              <span className={cn('absolute inset-x-0 top-0 h-0.5 bg-current transition-transform', open && 'translate-y-1.5 rotate-45')} />
              <span className={cn('absolute inset-x-0 bottom-0 h-0.5 bg-current transition-transform', open && '-translate-y-1 -rotate-45')} />
            </span>
          </button>
        </div>
      </div>
      <div className={cn('lg:hidden overflow-hidden transition-[max-height,opacity] duration-500', open ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0')}>
        <div className="border-t border-[var(--color-line)] bg-[var(--color-cream)] px-6 py-6">
          <nav className="flex flex-col gap-4">
            {nav.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="text-lg font-medium text-[var(--color-ink)]">{item.label}</a>
            ))}
          </nav>
          <div className="mt-6 flex items-center gap-3">
            <LocaleSwitch />
            <Button href="#book" size="md">{t('bookSession')}</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
