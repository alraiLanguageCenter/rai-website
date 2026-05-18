'use client';

import { useTranslations } from 'next-intl';
import { Counter } from '@/components/motion/Counter';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { SITE } from '@/lib/site';

export function TrustStrip() {
  const t = useTranslations('trust');
  const items = [
    { label: t('since'), value: '1995', isCounter: false },
    { label: t('years'), value: SITE.stats.yearsActive, suffix: '+', isCounter: true },
    { label: t('students'), value: SITE.stats.studentsTaught, suffix: '+', isCounter: true },
    { label: t('exams'), value: '✓', isCounter: false },
  ] as const;

  return (
    <Section tone="ivory" className="!py-16 lg:!py-20 border-y border-[var(--color-line)]">
      <div className="grid grid-cols-2 gap-y-10 gap-x-4 md:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={i} delay={i * 0.08} y={16}>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)] md:text-5xl">
                {item.isCounter
                  ? <Counter to={item.value as number} suffix={'suffix' in item ? item.suffix : ''} />
                  : <span>{item.value}</span>}
              </div>
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)] md:text-sm">{item.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
