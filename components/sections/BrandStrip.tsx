'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

export function BrandStrip() {
  const t = useTranslations('brandStrip');
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-8%']);

  const words = [t('learn'), t('connect'), t('succeed')];

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-[var(--color-rlc-900)] py-20 lg:py-24 text-[var(--color-cream)]">
      {/* gold sweep curve */}
      <svg aria-hidden viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-full w-full opacity-25">
        <defs>
          <linearGradient id="bs-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C9A24A" stopOpacity="0" />
            <stop offset="50%" stopColor="#E0BC65" stopOpacity="1" />
            <stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,140 Q360,60 720,120 T1440,140"
          stroke="url(#bs-gold)" strokeWidth="1.5" fill="none"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M0,90 Q360,150 720,80 T1440,90"
          stroke="url(#bs-gold)" strokeWidth="1" fill="none" opacity="0.6"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </svg>

      <motion.div style={{ x }} className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:gap-x-16">
          {words.map((word, i) => (
            <motion.h2 key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: 0.12 * i, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="display-lg font-[var(--font-display)] italic text-[var(--color-cream)]"
            >
              {word}{i < 2 ? <span className="ms-3 inline-block h-2 w-2 rounded-full bg-[var(--color-gold)] align-middle" /> : null}
            </motion.h2>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-center text-[var(--color-cream)]/80"
        >
          {t('tagline')}
        </motion.p>
      </motion.div>
    </section>
  );
}
