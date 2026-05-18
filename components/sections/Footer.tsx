'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Facebook, Instagram, Youtube, MessageCircle, Users } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SITE } from '@/lib/site';

const SOCIAL = [
  { href: SITE.social.facebookPage, label: 'Facebook', Icon: Facebook },
  { href: SITE.social.facebookGroup, label: 'Facebook Group', Icon: Users },
  { href: SITE.social.instagram, label: 'Instagram', Icon: Instagram },
  { href: SITE.social.whatsapp, label: 'WhatsApp Channel', Icon: MessageCircle },
  { href: SITE.social.youtube, label: 'YouTube', Icon: Youtube },
];

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale() as 'ar' | 'en';
  const year = new Date().getFullYear();

  const nav = [
    { href: '#story', label: tNav('story') },
    { href: '#courses', label: tNav('courses') },
    { href: '#journey', label: tNav('journey') },
    { href: '#schedule', label: tNav('schedule') },
    { href: '#wins', label: tNav('wins') },
    { href: '#assess', label: tNav('assess') },
    { href: '#contact', label: tNav('contact') },
  ];

  return (
    <footer className="relative bg-[var(--color-rlc-900)] text-[var(--color-cream)]">
      <div className="grain opacity-[0.03]" aria-hidden />
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="text-[var(--color-cream)]"><Logo /></div>
            <p className="mt-6 max-w-sm font-[var(--font-display)] text-2xl text-[var(--color-cream)] lg:text-3xl">{t('tagline')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {SOCIAL.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer noopener" aria-label={label}
                   className="group inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-cream)]/10 transition hover:bg-[var(--color-gold)] hover:text-[var(--color-rlc-900)]">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-7">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="opacity-80 transition hover:opacity-100 hover:text-[var(--color-gold)]">{n.label}</a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-70">{locale === 'ar' ? 'تواصل' : 'Get in touch'}</div>
            <div className="mt-3 space-y-1 text-sm">
              {SITE.contact.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="block opacity-90 hover:text-[var(--color-gold)]" dir="ltr">{p}</a>
              ))}
              <a href={`mailto:${SITE.contact.email}`} className="block opacity-90 hover:text-[var(--color-gold)]" dir="ltr">{SITE.contact.email}</a>
            </div>
            <div className="mt-5 text-sm opacity-80">
              {SITE.contact.addressLines[locale].map((line, i) => <div key={i}>{line}</div>)}
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-[var(--color-cream)]/15 pt-6 text-xs uppercase tracking-[0.14em] opacity-70 md:flex-row md:items-center">
          <span>{t('rights', { year })}</span>
          <span>{t('made')}</span>
        </div>
      </div>
    </footer>
  );
}
