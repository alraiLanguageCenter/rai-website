'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Facebook, Instagram, Youtube, MessageCircle, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { SITE } from '@/lib/site';
import { formatDigits } from '@/lib/utils';

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
  const reduced = useReducedMotion();
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
    <footer className="relative overflow-hidden bg-[var(--color-rlc-900)] text-[var(--color-cream)]">
      <div className="grain opacity-[0.03]" aria-hidden />

      {/* Animated gold gradient bar across the top edge */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(201,162,74,0) 25%, #E0BC65 50%, rgba(201,162,74,0) 75%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={reduced ? undefined : { backgroundPosition: ['-100% 0', '200% 0'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Drifting blurred green/gold orbs */}
      {!reduced && (
        <>
          <motion.span aria-hidden className="pointer-events-none absolute -start-32 top-10 h-80 w-80 rounded-full bg-[var(--color-gold)]/8 blur-3xl"
            animate={{ y: [0, 20, 0], x: [0, 16, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span aria-hidden className="pointer-events-none absolute -end-32 bottom-0 h-96 w-96 rounded-full bg-[var(--color-rlc-700)]/15 blur-3xl"
            animate={{ y: [0, -24, 0], x: [0, -18, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        </>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo variant="dark" />
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-sm font-[var(--font-display)] text-2xl text-[var(--color-cream)] lg:text-3xl"
            >
              {(t('tagline').split('. ') as string[]).map((part, i, arr) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: 0.15 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  {part}{i < arr.length - 1 ? '. ' : ''}
                </motion.span>
              ))}
            </motion.p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {SOCIAL.map(({ href, label, Icon }, i) => (
                <motion.a
                  key={label}
                  href={href} target="_blank" rel="noreferrer noopener" aria-label={label}
                  whileHover={reduced ? undefined : { scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                  className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-cream)]/10 text-[var(--color-cream)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-rlc-900)]"
                >
                  <Icon className="h-4 w-4" />
                  {!reduced && (
                    <motion.span
                      aria-hidden
                      className="absolute -inset-1 rounded-full border border-[var(--color-gold)]/40"
                      animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
                      transition={{ duration: 3.2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    />
                  )}
                </motion.a>
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
            <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-70">{locale === 'ar' ? 'تواصل معنا' : 'Get in touch'}</div>
            <div className="mt-3 space-y-1 text-sm">
              {SITE.contact.phones.map((p) => (
                <a
                  key={p}
                  href={`tel:${p.replace(/\s/g, '')}`}
                  /* dir is LTR in English so the +XXX prefix reads left-to-right;
                     in Arabic we keep LTR for the underlying tel URI but the
                     visible digits are converted to Arabic-Indic. */
                  dir="ltr"
                  className="block opacity-90 hover:text-[var(--color-gold)]"
                >
                  {formatDigits(p, locale)}
                </a>
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
