'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { Calendar, Plus, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { bookingSchema, type BookingInput } from '@/lib/validators/booking';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

export function Booking() {
  const t = useTranslations('book');
  const tv = useTranslations('validation');
  const locale = useLocale() as 'ar' | 'en';
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      locale, website: '', name: '', email: '', phone: '', ageGroup: undefined,
      preferredSlots: [''] as unknown as string[], notes: '',
    },
  });
  const { fields, append, remove } = useFieldArray({
    control, name: 'preferredSlots' as never,
  });

  const inputCls = 'w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-[var(--color-ink)] ring-1 ring-[var(--color-line)] transition placeholder:text-[var(--color-ink-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]';
  const ages = ['child', 'teen', 'adult', 'professional'] as const;

  async function onSubmit(data: BookingInput) {
    setPending(true);
    try {
      // normalize slot strings to ISO (browsers give local datetime)
      const cleaned = {
        ...data,
        preferredSlots: data.preferredSlots.filter(Boolean).map((s) => new Date(s).toISOString()),
      };
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) throw new Error('failed');
      toast.success(t('form.successTitle'), { description: t('form.successBody') });
      setDone(true);
      reset();
    } catch {
      toast.error(t('form.errorTitle'), { description: t('form.errorBody') });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Section id="book" tone="cream">
        <Reveal>
          <div className="mx-auto max-w-xl rounded-sm bg-[var(--color-rlc-100)] p-12 text-center ring-1 ring-[var(--color-line)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]">
              <Calendar className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{t('form.successTitle')}</h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">{t('form.successBody')}</p>
            <Button className="mt-8" size="md" variant="secondary" onClick={() => setDone(false)}>{t('eyebrow')}</Button>
          </div>
        </Reveal>
      </Section>
    );
  }

  return (
    <Section id="book" tone="cream">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <span className="eyebrow inline-flex items-center gap-3">
              <Calendar className="h-3.5 w-3.5 text-[var(--color-gold)]" />{t('eyebrow')}
            </span>
          </Reveal>
          <Reveal delay={0.1}><h2 className="display-lg mt-6 text-[var(--color-rlc-900)]">{t('title')}</h2></Reveal>
          <Reveal delay={0.2}><p className="mt-6 body-lg text-[var(--color-ink-soft)]">{t('lede')}</p></Reveal>
          <Reveal delay={0.3}>
            <ul className="mt-8 space-y-3 text-sm text-[var(--color-ink-soft)]">
              <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />{locale === 'ar' ? 'يستغرق التقييم نحو ٤٥ دقيقة.' : 'The assessment takes around 45 minutes.'}</li>
              <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />{locale === 'ar' ? 'يشمل تقييم القراءة والكتابة والمحادثة والاستماع.' : 'Covers reading, writing, speaking and listening.'}</li>
              <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />{locale === 'ar' ? 'تقرير مفصل وخطة دراسة مقترحة.' : 'Detailed report and a suggested study plan.'}</li>
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate
              className="grid gap-5 rounded-sm bg-[var(--color-cream)] p-8 ring-1 ring-[var(--color-line)] lg:p-10">
              <input type="text" {...register('website')} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -z-10 h-0 w-0 opacity-0" />
              <input type="hidden" {...register('locale')} />

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('form.name')}</span>
                  <input type="text" {...register('name')} placeholder={t('form.namePh')} className={`${inputCls} mt-2`} />
                  {errors.name && <span className="mt-1 block text-xs text-[var(--color-rose)]">{tv('nameMin')}</span>}
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('form.email')}</span>
                  <input type="email" {...register('email')} placeholder={t('form.emailPh')} className={`${inputCls} mt-2`} />
                  {errors.email && <span className="mt-1 block text-xs text-[var(--color-rose)]">{tv('emailInvalid')}</span>}
                </label>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('form.phone')}</span>
                  <input type="tel" {...register('phone')} placeholder={t('form.phonePh')} className={`${inputCls} mt-2`} dir="ltr" />
                  {errors.phone && <span className="mt-1 block text-xs text-[var(--color-rose)]">{tv('phoneInvalid')}</span>}
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('form.ageGroup')}</span>
                  <select {...register('ageGroup')} defaultValue="" className={`${inputCls} mt-2`}>
                    <option value="" disabled>{t('form.ageGroupPh')}</option>
                    {ages.map((a) => <option key={a} value={a}>{t(`form.ages.${a}`)}</option>)}
                  </select>
                  {errors.ageGroup && <span className="mt-1 block text-xs text-[var(--color-rose)]">{tv('ageRequired')}</span>}
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('form.slots')}</span>
                  {fields.length < 3 && (
                    <button type="button" onClick={() => append('')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-rlc-800)] hover:text-[var(--color-gold)]">
                      <Plus className="h-3.5 w-3.5" />{t('form.addSlot')}
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Controller
                        name={`preferredSlots.${idx}` as const}
                        control={control}
                        render={({ field: f }) => (
                          <input
                            type="datetime-local"
                            value={f.value as string}
                            onChange={f.onChange}
                            className={`${inputCls}`}
                            dir="ltr"
                          />
                        )}
                      />
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(idx)} aria-label="Remove"
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-[var(--color-line)] text-[var(--color-rose)] transition hover:bg-[var(--color-rose)]/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.preferredSlots && <span className="mt-1 block text-xs text-[var(--color-rose)]">{tv('slotRequired')}</span>}
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('form.notes')}</span>
                <textarea {...register('notes')} placeholder={t('form.notesPh')} rows={4} className={`${inputCls} mt-2 resize-none`} />
              </label>

              <div className="mt-2">
                <Button type="submit" size="lg" disabled={pending} magnetic variant="gold">
                  {pending ? t('form.submitting') : t('form.submit')}
                  <Send className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
