'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { KineticText } from '@/components/motion/KineticText';

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const glyphY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '40%']);
  const glyphOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-18%']);
  const logoY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '20%']);
  const logoR = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 30]);

  const arGlyph = locale === 'ar' ? 'ع' : 'A';
  const enGlyph = locale === 'ar' ? 'A' : 'ع';

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-[var(--color-cream)]">
      <div className="absolute inset-0 gradient-mesh" aria-hidden />
      <div className="grain" aria-hidden />

      {/* Floating RLC logo behind, breathing */}
      <motion.div
        aria-hidden
        style={{ y: logoY, rotate: logoR }}
        animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -end-24 -bottom-24 select-none opacity-[0.06]"
      >
        <Image src="/brand/rlc-logo.svg" alt="" width={520} height={520} className="h-[520px] w-[520px]" />
      </motion.div>

      {/* Drifting language glyphs */}
      <motion.div aria-hidden style={{ y: glyphY, opacity: glyphOpacity }}
        className="pointer-events-none absolute -end-8 top-6 select-none font-[var(--font-display)] text-[clamp(18rem,32vw,32rem)] leading-none text-[var(--color-rlc-800)]/[0.05]">
        {arGlyph}
      </motion.div>
      <motion.div aria-hidden style={{ y: glyphY, opacity: glyphOpacity }}
        className="pointer-events-none absolute -start-6 -bottom-20 select-none font-[var(--font-display)] text-[clamp(14rem,26vw,26rem)] leading-none text-[var(--color-gold)]/[0.10]">
        {enGlyph}
      </motion.div>

      {/* Particles */}
      {!reduced && Array.from({ length: 14 }).map((_, i) => (
        <motion.span key={i} aria-hidden
          className="absolute h-1 w-1 rounded-full bg-[var(--color-gold)]"
          style={{ top: `${(i * 73) % 100}%`, left: `${(i * 47) % 100}%`, opacity: 0.35 }}
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
        />
      ))}

      <motion.div style={{ y: contentY }} className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-28 pb-20 lg:px-10 lg:pt-32">
        <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow inline-flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--color-gold)]" />
          {t('eyebrow')}
        </motion.span>

        <div className="mt-6">
          <KineticText text={t('headline')} as="h1"
            className="display-xl font-[var(--font-display)] text-[var(--color-rlc-900)]" delay={0.2} />
          <KineticText text={t('headlineAccent')} as="h1"
            className="display-xl font-[var(--font-display)] italic text-[var(--color-gold)]" delay={0.55} />
        </div>

        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-xl body-lg text-[var(--color-ink-soft)]">
          {t('lede')}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center gap-4">
          <Button href="#assess" size="lg" magnetic>
            {t('primaryCta')}
            <span aria-hidden className="rtl:rotate-180">→</span>
          </Button>
          <Button href="#courses" size="lg" variant="secondary">{t('secondaryCta')}</Button>
        </motion.div>

        <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1 }}
          className="absolute bottom-10 end-10 hidden flex-col items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] lg:flex">
          <span>{t('scrollHint')}</span>
          <motion.span className="block h-12 w-px bg-[var(--color-ink-soft)]/40"
            style={{ transformOrigin: 'top' }}
            animate={{ scaleY: [0.3, 1, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
