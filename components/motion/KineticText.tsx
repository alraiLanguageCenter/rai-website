'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

type Props = {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'span';
};

export function KineticText({ text, className, delay = 0, as = 'h1' }: Props) {
  const reduced = useReducedMotion();
  const words = text.split(' ');

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

  return (
    <Wrapper
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
      style={{ perspective: 1000 }}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-baseline" style={{ marginInlineEnd: '0.25em' }}>
          <motion.span className="inline-block" variants={child}>{word}</motion.span>
        </span>
      ))}
    </Wrapper>
  );
}
