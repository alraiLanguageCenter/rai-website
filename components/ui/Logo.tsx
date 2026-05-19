'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export function Logo({
  className,
  withText = true,
  animated = false,
  variant = 'light',
}: {
  className?: string;
  withText?: boolean;
  animated?: boolean;
  /** 'light' (cream bg) uses darken-blend to drop the white box. 'dark' (green bg) uses lighten-blend. */
  variant?: 'light' | 'dark';
}) {
  const locale = useLocale();
  const reduced = useReducedMotion();

  // Light bg (cream): mix-blend-darken makes the white box disappear cleanly.
  // Dark bg (green): wrap in a cream badge so the colored logo reads — the badge
  // becomes a deliberate brand-mark element instead of an unwanted white box.
  const isDark = variant === 'dark';

  const inner = (
    <>
      <motion.div
        initial={animated && !reduced ? { scale: 0.85, opacity: 0 } : false}
        animate={animated && !reduced ? { scale: [1, 1.03, 1], opacity: 1 } : false}
        transition={{
          scale: { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
          opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
        }}
        whileHover={reduced ? undefined : { scale: 1.08 }}
        className={`shrink-0 ${isDark ? 'rounded-md bg-[var(--color-cream)] p-2 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.4)] ring-1 ring-[var(--color-gold)]/40' : ''}`}
      >
        <Image
          src="/brand/rlc-logo.jpg"
          alt="Rai Language Center"
          width={128}
          height={128}
          priority
          className={`object-contain ${isDark ? 'h-14 w-14 lg:h-16 lg:w-16' : 'h-20 w-20 mix-blend-darken lg:h-24 lg:w-24'}`}
        />
      </motion.div>
      {withText && (
        <span className="flex flex-col leading-tight">
          <span
            className={`text-[0.68rem] uppercase tracking-[0.18em] ${
              variant === 'dark' ? 'text-[var(--color-cream)]/70' : 'text-[var(--color-rlc-800)]/70'
            }`}
          >
            {locale === 'ar' ? 'منذ ١٩٩٥' : 'Since 1995'}
          </span>
          <span
            className={`text-base font-semibold ${
              variant === 'dark' ? 'text-[var(--color-cream)]' : 'text-[var(--color-rlc-900)]'
            }`}
          >
            {locale === 'ar' ? 'مركز الراعي للغات' : 'Rai Language Center'}
          </span>
        </span>
      )}
    </>
  );

  return (
    <Link
      href={`/${locale}`}
      className={`group inline-flex items-center gap-3 ${className ?? ''}`}
      aria-label="Rai Language Center home"
    >
      {inner}
    </Link>
  );
}
