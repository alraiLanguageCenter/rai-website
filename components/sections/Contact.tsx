'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { contactSchema, type ContactInput } from '@/lib/validators/contact';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { SITE } from '@/lib/site';

export function Contact() {
  const t = useTranslations('contact');
  const tv = useTranslations('validation');
  const locale = useLocale() as 'ar' | 'en';
  const [pending, setPending] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { locale, website: '' },
  });

  async function onSubmit(data: ContactInput) {
    setPending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('failed');
      toast.success(t('form.successTitle'), { description: t('form.successBody') });
      reset({ locale, website: '', name: '', email: '', phone: '', course: undefined, message: '' });
    } catch {
      toast.error(t('form.errorTitle'), { description: t('form.errorBody') });
    } finally {
      setPending(false);
    }
  }

  const courseOptions = ['kids', 'adults', 'exams', 'business', 'other'] as const;
  const inputCls = 'w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-[var(--color-ink)] ring-1 ring-[var(--color-line)] transition placeholder:text-[var(--color-ink-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]';

  return (
    <Section id="contact" tone="cream">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal><span className="eyebrow inline-flex items-center gap-3"><span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}</span></Reveal>
          <Reveal delay={0.1}><h2 className="display-lg mt-6 text-[var(--color-rlc-900)]">{t('title')}</h2></Reveal>
          <Reveal delay={0.2}><p className="mt-6 max-w-md body-lg text-[var(--color-ink-soft)]">{t('lede')}</p></Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 space-y-6">
              <InfoRow icon={MapPin} title={t('info.addressTitle')}>
                {SITE.contact.addressLines[locale].map((line, i) => <div key={i}>{line}</div>)}
              </InfoRow>
              <InfoRow icon={Phone} title={t('info.phoneTitle')}>
                {SITE.contact.phones.map((p) => (
                  <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="block hover:text-[var(--color-rlc-800)]" dir="ltr">{p}</a>
                ))}
              </InfoRow>
              <InfoRow icon={Mail} title={t('info.emailTitle')}>
                <a href={`mailto:${SITE.contact.email}`} className="hover:text-[var(--color-rlc-800)]" dir="ltr">{SITE.contact.email}</a>
              </InfoRow>
              <InfoRow icon={Clock} title={t('info.hoursTitle')}>
                {t('info.hours').split('\n').map((line, i) => <div key={i}>{line}</div>)}
              </InfoRow>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.15}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate
              className="grid gap-5 rounded-sm bg-[var(--color-cream)] p-8 ring-1 ring-[var(--color-line)] lg:p-10">
              <input type="text" {...register('website')} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -z-10 h-0 w-0 opacity-0" />
              <input type="hidden" {...register('locale')} />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t('form.name')} error={errors.name && tv('nameMin')}>
                  <input type="text" {...register('name')} placeholder={t('form.namePh')} className={inputCls} aria-invalid={!!errors.name} />
                </Field>
                <Field label={t('form.email')} error={errors.email && tv('emailInvalid')}>
                  <input type="email" {...register('email')} placeholder={t('form.emailPh')} className={inputCls} aria-invalid={!!errors.email} />
                </Field>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t('form.phone')}>
                  <input type="tel" {...register('phone')} placeholder={t('form.phonePh')} className={inputCls} dir="ltr" />
                </Field>
                <Field label={t('form.course')} error={errors.course && tv('courseRequired')}>
                  <select {...register('course')} defaultValue="" className={inputCls} aria-invalid={!!errors.course}>
                    <option value="" disabled>{t('form.coursePh')}</option>
                    {courseOptions.map((opt) => (
                      <option key={opt} value={opt}>{t(`form.courseOptions.${opt}`)}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label={t('form.message')} error={errors.message && tv('messageMin')}>
                <textarea {...register('message')} placeholder={t('form.messagePh')} rows={5} className={`${inputCls} resize-none`} aria-invalid={!!errors.message} />
              </Field>
              <div className="mt-2">
                <Button type="submit" size="lg" disabled={pending} magnetic>
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

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <span className="mt-1 block text-xs text-[var(--color-rose)]">{error}</span>}
    </label>
  );
}

function InfoRow({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-rlc-800)]/8 text-[var(--color-rlc-800)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">{title}</div>
        <div className="mt-1 text-[var(--color-ink)]">{children}</div>
      </div>
    </div>
  );
}
