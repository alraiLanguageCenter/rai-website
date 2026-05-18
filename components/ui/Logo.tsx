'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export function Logo({ className, withText = true, animated = false }: { className?: string; withText?: boolean; animated?: boolean }) {
  const locale = useLocale();
  const reduced = useReducedMotion();

  const inner = (
    <>
      <motion.div
        initial={animated && !reduced ? { rotate: -20, scale: 0.8, opacity: 0 } : false}
        animate={animated && !reduced ? { rotate: 0, scale: 1, opacity: 1 } : false}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="shrink-0"
      >
        <Image
          src="/brand/rlc-logo.svg"
          alt="RLC"
          width={44}
          height={44}
          priority
          className="h-11 w-11"
        />
      </motion.div>
      {withText && (
        <span className="flex flex-col leading-tight">
          <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-rlc-800)]/70">
            {locale === 'ar' ? 'منذ ١٩٩٥' : 'Since 1995'}
          </span>
          <span className="text-base font-semibold text-[var(--color-rlc-900)]">
            {locale === 'ar' ? 'مركز الراعي للغات' : 'Rai Language Center'}
          </span>
        </span>
      )}
    </>
  );

  return (
    <Link href={`/${locale}`} className={`group inline-flex items-center gap-3 ${className ?? ''}`} aria-label="Rai Language Center home">
      {inner}
    </Link>
  );
}
