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
  variant?: 'light' | 'dark';
}) {
  const locale = useLocale();
  const reduced = useReducedMotion();
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
        className="shrink-0"
      >
        <Image
          src="/brand/rlc-logo-transparent.png"
          alt="Rai Language Center"
          /* Intrinsic ratio matches the source PNG (2400×2103 ≈ 1.14:1). The
             rendered size is controlled by the h-/w- classes below; object-
             contain preserves the aspect ratio inside the square container. */
          width={240}
          height={210}
          priority
          /* Light variant lives in the header — bumped a step up so the
             mark reads clearly on the cream backdrop. Dark variant stays
             a step smaller because the footer already has plenty of room
             from the tagline + columns next to it. */
          /* Light variant fixed at 125×125 (header). Dark variant kept smaller
             for the footer where the logo lives next to the tagline + columns. */
          className={`object-contain ${isDark ? 'h-16 w-16 lg:h-20 lg:w-20' : 'h-[125px] w-[125px]'}`}
        />
      </motion.div>
      {withText && (
        <span className="flex flex-col leading-tight">
          <span
            className={`text-[0.68rem] uppercase tracking-[0.18em] ${
              isDark ? 'text-[var(--color-cream)]/70' : 'text-[var(--color-rlc-800)]/70'
            }`}
          >
            {locale === 'ar' ? 'منذ ١٩٩٥' : 'Since 1995'}
          </span>
          <span
            className={`text-base font-semibold ${
              isDark ? 'text-[var(--color-cream)]' : 'text-[var(--color-rlc-900)]'
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
