'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

type Props = {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'span';
};

/** Heuristic: does the string contain any Arabic-block code points? */
const ARABIC_RANGE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

export function KineticText({ text, className, delay = 0, as = 'h1' }: Props) {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  // Arabic letterforms have descenders (ج ح خ ع غ م ن ل ي ى ...) that extend
  // well below the Latin baseline. The default per-word `overflow-hidden`
  // clip — sized to Latin font metrics — would chop off those tails. Detect
  // Arabic content and switch to overflow-visible with a touch of bottom
  // padding so descenders have breathing room while the reveal animation
  // still looks great.
  const isArabic = ARABIC_RANGE.test(text);

  const container: Variants = {
    hidden: {},
    show: {
      transition: { delayChildren: delay, staggerChildren: reduced ? 0 : 0.06 },
    },
  };
  const child: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : '0.6em', rotateX: reduced ? 0 : -25 },
    show: {
      opacity: 1,
      y: '0em',
      rotateX: 0,
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const Wrapper = motion[as];

  const wordClass = isArabic
    ? 'inline-block align-baseline overflow-visible pb-[0.15em]'
    : 'inline-block align-baseline overflow-hidden';

  return (
    <Wrapper
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
      style={{ perspective: 1000 }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={wordClass}
          style={{ marginInlineEnd: '0.25em' }}
        >
          <motion.span className="inline-block" variants={child}>{word}</motion.span>
        </span>
      ))}
    </Wrapper>
  );
}
