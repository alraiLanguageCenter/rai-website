'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';

type WinCard = {
  name: string;
  role: string;
  initials: string;
  quote: string;
  meta?: string;
  accent?: 'gold' | 'green';
};

const WINS: WinCard[] = [
  { name: 'Lara H.',     role: 'Advanced English', initials: 'LH', quote: 'I reached my goal — thank you RLC!',                meta: 'Certificate of Achievement', accent: 'gold' },
  { name: 'Reem K.',     role: 'IELTS Prep',       initials: 'RK', quote: 'Overall band score 7.5 on first attempt.',           meta: 'IELTS · 7.5',                accent: 'green' },
  { name: 'Salma A.',    role: 'Business English', initials: 'SA', quote: 'From learning English to leading with confidence.', meta: 'Marketing Manager',          accent: 'gold' },
  { name: 'Youssef K.',  role: 'Kids Program',     initials: 'YK', quote: 'I speak English with confidence now!',               meta: '⭐ Star of the week',        accent: 'green' },
  { name: 'Nadine H.',   role: 'Business English', initials: 'NH', quote: 'Better English, better opportunities, better me.',   meta: 'Senior Project Manager',     accent: 'gold' },
  { name: 'Fatima M.',   role: 'Advanced English', initials: 'FM', quote: '“RLC helped me gain the confidence to speak in any situation. A great experience.”', meta: 'Advanced English Course', accent: 'green' },
  { name: 'Omar B.',     role: 'TOEFL Prep',       initials: 'OB', quote: 'A different language is a different vision of life.', meta: 'Scored 105/120',            accent: 'gold' },
];

export function WallOfWins() {
  const t = useTranslations('wins');
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
    direction: 'ltr', // we always advance forward visually; RTL handled by content
  });

  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 4500);
    return () => clearInterval(id);
  }, [emblaApi]);

  return (
    <Section id="wins" tone="rlc-dark" bleed className="py-24 lg:py-32">
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow inline-flex items-center gap-3 !text-[var(--color-gold)]">
            <Trophy className="h-3.5 w-3.5" />{t('eyebrow')}
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display-lg mt-6 max-w-3xl !text-[var(--color-cream)]">{t('title')}</h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-5 max-w-xl body-lg text-[var(--color-cream)]/75">{t('lede')}</p>
        </Reveal>
      </div>

      <div className="mt-12 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5 px-6 lg:px-10">
          {WINS.concat(WINS).map((w, i) => (
            <article key={i}
              className="group relative shrink-0 basis-[85%] overflow-hidden rounded-sm bg-[var(--color-cream)] p-7 ring-1 ring-[var(--color-line)] md:basis-[42%] lg:basis-[26%]">
              <div className={`absolute end-0 top-0 h-28 w-28 -translate-y-1/2 translate-x-1/2 rounded-full ${w.accent === 'gold' ? 'bg-[var(--color-gold)]/20' : 'bg-[var(--color-rlc-700)]/20'}`} />
              <div className="relative flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-rlc-900)] font-[var(--font-display)] text-[var(--color-gold)]">{w.initials}</div>
                <div>
                  <div className="font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{w.name}</div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{w.role}</div>
                </div>
              </div>
              <p className="relative mt-6 body-lg text-[var(--color-ink)]">{w.quote}</p>
              {w.meta && (
                <div className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-100)] px-3 py-1 text-xs text-[var(--color-rlc-800)]">
                  {w.meta}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl items-center gap-3 px-6 lg:px-10">
        <button onClick={() => emblaApi?.scrollPrev()} aria-label="Previous"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[var(--color-cream)]/30 text-[var(--color-cream)] transition hover:bg-[var(--color-cream)]/10">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <button onClick={() => emblaApi?.scrollNext()} aria-label="Next"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[var(--color-cream)]/30 text-[var(--color-cream)] transition hover:bg-[var(--color-cream)]/10">
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
        <span className="ms-2 text-xs uppercase tracking-[0.14em] text-[var(--color-cream)]/60">{t('swipeHint')}</span>
      </div>
    </Section>
  );
}
