'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Award, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';

type Item = { title: string; body: string };
const icons = [Award, Sparkles, Users, TrendingUp];

export function WhyUs() {
  const t = useTranslations('why');
  const items = t.raw('items') as Item[];

  return (
    <Section id="why" tone="cream" className="overflow-hidden">
      {/* ===== Animated ambient background ===== */}
      <AmbientBackdrop />

      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
      </Reveal>

      <div className="relative mt-16 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-3 md:gap-5 md:[grid-auto-flow:dense]">
        <Reveal className="md:col-span-3 md:row-span-2" delay={0.05}><FeatureTile item={items[0]} Icon={icons[0]} large /></Reveal>
        <Reveal className="md:col-span-3 md:row-span-2" delay={0.12}>
          <ImageTile src="/brand/classroom.jpg" label="curriculum" item={items[1]} />
        </Reveal>
        <Reveal className="md:col-span-2 md:row-span-1" delay={0.18}><FeatureTile item={items[2]} Icon={icons[2]} /></Reveal>
        <Reveal className="md:col-span-2 md:row-span-1" delay={0.24}><FeatureTile item={items[3]} Icon={icons[3]} /></Reveal>
        <Reveal className="md:col-span-2 md:row-span-1" delay={0.3}><AccentTile /></Reveal>
      </div>
    </Section>
  );
}

/* -------------------- Ambient backdrop -------------------- */
/**
 * Layered animated background for WhyUs:
 *   - Conic gradient field that slowly rotates
 *   - Three drifting blurred blobs (gold + green)
 *   - Aurora sweep that floats across the top
 *   - Faint dotted grid for texture
 *   - Floating gold particles
 */
function AmbientBackdrop() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {/* Dotted texture grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(8,57,34,0.35) 1px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Conic rotating field */}
      {!reduced && (
        <motion.div
          className="absolute -inset-[20%]"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(201,162,74,0.10), transparent 18%, rgba(14,81,50,0.10) 36%, transparent 60%, rgba(201,162,74,0.10) 80%, transparent 100%)',
            filter: 'blur(40px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Three drifting blobs */}
      {!reduced && (
        <>
          <motion.span
            className="absolute -top-20 start-[8%] block h-[420px] w-[420px] rounded-full bg-[var(--color-gold)]/22 blur-[110px]"
            animate={{ x: [0, 60, -30, 20, 0], y: [0, 30, -20, 40, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="absolute top-1/3 end-[6%] block h-[360px] w-[360px] rounded-full bg-[var(--color-rlc-700)]/18 blur-[100px]"
            animate={{ x: [0, -40, 30, -10, 0], y: [0, -20, 30, -10, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          />
          <motion.span
            className="absolute bottom-[-80px] start-[35%] block h-[480px] w-[480px] rounded-full bg-[var(--color-gold)]/15 blur-[120px]"
            animate={{ x: [0, 40, -50, 25, 0], y: [0, -25, 35, -15, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          />
        </>
      )}

      {/* Aurora ribbon sweeping across the top */}
      {!reduced && (
        <motion.div
          className="absolute -top-10 inset-x-0 h-40"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(201,162,74,0.18) 25%, rgba(14,81,50,0.20) 55%, rgba(201,162,74,0.14) 80%, transparent 100%)',
            filter: 'blur(28px)',
          }}
          animate={{ x: ['-30%', '30%', '-30%'] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Floating gold particles */}
      {!reduced &&
        Array.from({ length: 16 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[var(--color-gold)]"
            style={{
              top: `${(i * 67) % 100}%`,
              left: `${(i * 41) % 100}%`,
              opacity: 0.5,
            }}
            animate={{
              y: [0, -22, 0],
              opacity: [0.15, 0.6, 0.15],
              scale: [1, 1.4, 1],
            }}
            transition={{ duration: 5 + (i % 4), delay: i * 0.25, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

      {/* Gold sweep curve */}
      <svg
        className="absolute inset-x-0 top-1/2 h-40 w-full -translate-y-1/2 opacity-30"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="whyus-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C9A24A" stopOpacity="0" />
            <stop offset="50%" stopColor="#C9A24A" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,100 Q360,40 720,120 T1440,80"
          stroke="url(#whyus-gold)"
          strokeWidth="1.2"
          fill="none"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </div>
  );
}

/* -------------------- Tiles (relative so they sit above backdrop) -------------------- */

function FeatureTile({ item, Icon, large = false }: { item: Item; Icon: React.ComponentType<{ className?: string }>; large?: boolean }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-sm bg-[var(--color-ivory)]/85 p-8 ring-1 ring-[var(--color-line)] backdrop-blur-sm transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(8,57,34,0.25)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-rlc-800)]/8 text-[var(--color-rlc-800)] transition group-hover:bg-[var(--color-gold)]/20 group-hover:text-[var(--color-gold)]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className={`mt-8 font-[var(--font-display)] text-[var(--color-rlc-900)] ${large ? 'text-3xl' : 'text-xl'}`}>{item.title}</h3>
      <p className="mt-3 text-[var(--color-ink-soft)]">{item.body}</p>
    </div>
  );
}

function ImageTile({ src, label, item }: { src: string; label: string; item: Item }) {
  return (
    <div className="group relative h-full min-h-[260px] overflow-hidden rounded-sm bg-[var(--color-rlc-900)] ring-1 ring-[var(--color-line)]">
      <Image src={src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover opacity-80 transition-transform duration-[1.8s] ease-out group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-rlc-900)]/95 via-[var(--color-rlc-900)]/45 to-[var(--color-rlc-900)]/10" />
      <div className="absolute inset-x-8 bottom-8 text-[var(--color-cream)]">
        <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-70">{label}</div>
        <h3 className="mt-2 font-[var(--font-display)] text-2xl">{item.title}</h3>
        <p className="mt-2 max-w-md text-sm opacity-85">{item.body}</p>
      </div>
    </div>
  );
}

function AccentTile() {
  return (
    <div className="relative h-full overflow-hidden rounded-sm bg-[var(--color-rlc-900)] p-8 text-[var(--color-cream)]">
      <span aria-hidden className="absolute -end-10 -top-10 text-[14rem] leading-none text-[var(--color-gold)]/20 font-[var(--font-display)]">✦</span>
      <div className="relative">
        <div className="font-[var(--font-display)] text-5xl text-[var(--color-gold)]">A+</div>
        <p className="mt-3 max-w-[18ch] text-sm opacity-85">Top scores in IELTS &amp; TOEFL year after year.</p>
      </div>
    </div>
  );
}
