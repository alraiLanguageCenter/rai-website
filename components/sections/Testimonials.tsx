'use client';

import { useTranslations } from 'next-intl';
import { Quote } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';

type Item = { name: string; course: string; quote: string };

export function Testimonials() {
  const t = useTranslations('testimonials');
  const items = t.raw('items') as Item[];

  return (
    <Section id="testimonials" tone="ivory" bleed className="py-24 lg:py-36">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow inline-flex items-center gap-3">
            <span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
        </Reveal>
      </div>
      <div className="mt-16 overflow-x-auto pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex snap-x snap-mandatory gap-6 px-6 lg:px-10 [&>*]:snap-start">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.05} className="shrink-0">
              <article className="flex h-full w-[88vw] flex-col justify-between rounded-sm bg-[var(--color-cream)] p-8 ring-1 ring-[var(--color-line)] md:w-[420px] lg:w-[460px]">
                <div>
                  <Quote className="h-7 w-7 text-[var(--color-gold)]" />
                  <p className="mt-5 text-[var(--color-ink)] body-lg leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                </div>
                <div className="mt-8 flex items-center gap-4 border-t border-[var(--color-line)] pt-6">
                  <Avatar name={item.name} />
                  <div>
                    <div className="font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{item.name}</div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{item.course}</div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
          <div className="shrink-0 w-2" aria-hidden />
        </div>
      </div>
    </Section>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('');
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-rlc-900)] font-[var(--font-display)] text-[var(--color-gold)]">{initials}</div>
  );
}
