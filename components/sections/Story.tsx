'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';

export function Story() {
  const t = useTranslations('story');
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['10%', reduced ? '0%' : '-10%']);

  return (
    <Section id="story" tone="cream">
      <div ref={ref} className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Reveal>
            <span className="eyebrow inline-flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="display-lg mt-6 max-w-2xl text-[var(--color-rlc-900)]">{t('title')}</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-xl body-lg text-[var(--color-ink-soft)]">{t('p1')}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-5 max-w-xl body-lg text-[var(--color-ink-soft)]">{t('p2')}</p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="mt-10 flex items-center gap-4">
              <SignatureSVG />
              <div>
                <div className="font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{t('signature')}</div>
                <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('signatureTitle')}</div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal y={48}>
            <motion.div style={{ y: imgY }} className="relative aspect-[3/4] overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
              <Image
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80"
                alt=""
                fill priority={false} sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-rlc-900)]/65 via-transparent to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-[var(--color-cream)]">
                <div className="text-xs uppercase tracking-[0.16em] opacity-80">EST. 1995</div>
                <div className="mt-1 font-[var(--font-display)] text-2xl">Latakia · لاذقية</div>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function SignatureSVG() {
  return (
    <motion.svg viewBox="0 0 220 80" width="120" height="44" className="text-[var(--color-gold)]"
      initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
      <motion.path d="M10 50 C 30 10, 60 70, 80 40 S 130 10, 150 40 S 200 70, 210 30"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1, transition: { duration: 2, ease: [0.22, 1, 0.36, 1] } } }} />
    </motion.svg>
  );
}
