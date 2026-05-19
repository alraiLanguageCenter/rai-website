'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  GraduationCap, User, Mail, Phone, MapPin, Sparkles, Send, CheckCircle2,
  Globe, BookOpen, Languages, Target, Heart, ChevronLeft,
} from 'lucide-react';
import Image from 'next/image';

type Lang = 'ar' | 'en';

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  ageGroup: string;
  location: string;
  nativeLanguage: string;
  targetLanguage: string;
  targetLevel: string;
  goals: string;
  source: string;
};

const INITIAL: FormData = {
  fullName: '', email: '', phone: '',
  gender: '', dateOfBirth: '', ageGroup: '',
  location: '', nativeLanguage: '', targetLanguage: '',
  targetLevel: '', goals: '', source: '',
};

const TARGET_LANGUAGES = [
  { value: 'english',  ar: 'الإنجليزية',  en: 'English' },
  { value: 'french',   ar: 'الفرنسية',    en: 'French' },
  { value: 'german',   ar: 'الألمانية',   en: 'German' },
  { value: 'russian',  ar: 'الروسية',     en: 'Russian' },
  { value: 'spanish',  ar: 'الإسبانية',   en: 'Spanish' },
  { value: 'turkish',  ar: 'التركية',     en: 'Turkish' },
  { value: 'arabic',   ar: 'العربية',     en: 'Arabic (for foreigners)' },
];

const SOURCES = [
  { value: 'facebook',   ar: 'فيسبوك',                en: 'Facebook' },
  { value: 'instagram',  ar: 'إنستغرام',              en: 'Instagram' },
  { value: 'friend',     ar: 'صديق',                  en: 'A friend' },
  { value: 'qr',         ar: 'كود QR على إعلان',      en: 'QR code on a flyer' },
  { value: 'school',     ar: 'مدرسة / جامعة',          en: 'School / University' },
  { value: 'search',     ar: 'بحث جوجل',              en: 'Google search' },
  { value: 'other',      ar: 'مصدر آخر',              en: 'Other' },
];

export default function RegisterPage() {
  const reduced = useReducedMotion();
  const [lang, setLang] = useState<Lang>('en');
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; applicationId?: string; error?: string } | null>(null);

  // Read ?lang= and default by Accept-Language on first load (client-side only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('lang');
    if (q === 'ar' || q === 'en') { setLang(q); return; }
    if (typeof navigator !== 'undefined' && /^ar\b/i.test(navigator.language)) setLang('ar');
  }, []);

  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!data.fullName.trim()) return isAr ? 'يرجى إدخال اسمك الكامل.' : 'Please enter your full name.';
      if (!/.+@.+\..+/.test(data.email)) return isAr ? 'بريد إلكتروني غير صحيح.' : 'Invalid email.';
      if (data.phone.trim().length < 5) return isAr ? 'رقم هاتف غير صحيح.' : 'Invalid phone number.';
    }
    if (s === 1) {
      if (!data.ageGroup) return isAr ? 'اختر الفئة العمرية.' : 'Please pick an age group.';
    }
    if (s === 2) {
      if (!data.targetLanguage) return isAr ? 'اختر اللغة التي تريد تعلّمها.' : 'Pick the language you want to learn.';
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) { alert(err); return; }
    setStep((s) => (s < 3 ? ((s + 1) as 0 | 1 | 2 | 3) : s));
  }
  function back() {
    setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3) : s));
  }

  async function submit() {
    const err = validateStep(0) || validateStep(1) || validateStep(2);
    if (err) { alert(err); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/student-application', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, website, locale: lang }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setResult({ ok: true, applicationId: json.applicationId });
      } else {
        setResult({ ok: false, error: json.error || (isAr ? 'تعذّر إرسال الطلب.' : 'Could not submit.') });
      }
    } catch {
      setResult({ ok: false, error: isAr ? 'تعذّر الاتصال بالخادم.' : "Couldn't reach the server." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      lang={lang}
      dir={dir}
      className="relative min-h-screen overflow-hidden bg-[var(--color-cream)] text-[var(--color-ink)]"
    >
      {/* ===== Animated brand backdrop ===== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
        {/* Conic field */}
        {!reduced && (
          <motion.div
            className="absolute -inset-[20%]"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, rgba(201,162,74,0.10), transparent 18%, rgba(14,81,50,0.10) 36%, transparent 60%, rgba(201,162,74,0.10) 80%, transparent 100%)',
              filter: 'blur(40px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {/* Drifting blobs */}
        {!reduced && (
          <>
            <motion.span className="absolute -top-24 start-[10%] block h-[420px] w-[420px] rounded-full bg-[var(--color-gold)]/22 blur-[100px]"
              animate={{ x: [0, 60, -30, 0], y: [0, 30, -20, 0] }} transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.span className="absolute bottom-[-100px] end-[8%] block h-[360px] w-[360px] rounded-full bg-[var(--color-rlc-700)]/22 blur-[90px]"
              animate={{ x: [0, -40, 20, 0], y: [0, -30, 20, 0] }} transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
          </>
        )}
        {/* Dotted texture */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(8,57,34,0.4) 1px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        }} />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-6 sm:py-12">
        {/* ===== Header bar ===== */}
        <header className="flex items-center justify-between gap-3">
          <a href="/" className="inline-flex items-center gap-3 text-[var(--color-rlc-900)] hover:text-[var(--color-rlc-700)]">
            <Image src="/brand/rlc-logo-transparent.png" alt="RLC" width={40} height={40} className="h-10 w-10 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">Since 1995</span>
              <span className="font-[var(--font-display)] text-base text-[var(--color-rlc-900)]">Rai Language Center</span>
            </div>
          </a>
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-3 py-1.5 text-sm font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60"
          >
            <Globe className="h-3.5 w-3.5" />
            {isAr ? 'EN' : 'العربية'}
          </button>
        </header>

        {/* ===== Title ===== */}
        <div className="mt-8 sm:mt-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)]/15 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-rlc-800)]">
            <Sparkles className="h-3 w-3 text-[var(--color-gold)]" />
            {isAr ? 'تسجيل طالب جديد' : 'New Student Registration'}
          </div>
          <h1 className="mt-4 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)] sm:text-5xl">
            {isAr ? 'ابدأ رحلتك معنا' : 'Begin your journey with us'}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--color-ink-soft)] sm:text-base">
            {isAr
              ? 'املأ هذا النموذج وسيراجع فريقنا طلبك ويرسل لك رقم الطالب الخاصّ بك خلال يومين عمل.'
              : 'Fill this in and our team will review your application and send you your personal student number within two business days.'}
          </p>
        </div>

        {/* ===== Step indicator ===== */}
        {!result?.ok && (
          <div className="mt-8 flex items-center gap-2">
            {[0, 1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                  step >= s
                    ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]'
                    : 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]'
                }`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s + 1}
                </span>
                {s < 3 && (
                  <span className={`h-px flex-1 ${step > s ? 'bg-[var(--color-rlc-800)]' : 'bg-[var(--color-line)]'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== Form card ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex-1 rounded-2xl bg-[var(--color-cream)] p-6 shadow-[0_20px_50px_-20px_rgba(8,57,34,0.25)] ring-1 ring-[var(--color-line)] sm:p-10"
        >
          <AnimatePresence mode="wait">
            {result?.ok ? (
              <SuccessPanel isAr={isAr} applicationId={result.applicationId} />
            ) : (
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 && (
                  <fieldset className="grid gap-5">
                    <Legend icon={User} title={isAr ? 'بياناتك الأساسية' : 'Your basics'} subtitle={isAr ? 'كيف نتواصل معك' : 'How we reach you'} />
                    <Input
                      label={isAr ? 'الاسم الكامل' : 'Full name'}
                      Icon={User}
                      value={data.fullName}
                      onChange={(v) => set('fullName', v)}
                      placeholder={isAr ? 'اسمك بالكامل' : 'Your full name'}
                      dir={dir}
                      required
                    />
                    <Input
                      label={isAr ? 'البريد الإلكتروني' : 'Email'}
                      Icon={Mail}
                      type="email"
                      value={data.email}
                      onChange={(v) => set('email', v)}
                      placeholder="you@example.com"
                      dir="ltr"
                      required
                    />
                    <Input
                      label={isAr ? 'رقم الواتساب (مع رمز الدولة)' : 'WhatsApp number (with country code)'}
                      Icon={Phone}
                      type="tel"
                      value={data.phone}
                      onChange={(v) => set('phone', v)}
                      placeholder="+963 ..."
                      dir="ltr"
                      required
                    />
                    <Input
                      label={isAr ? 'مدينتك / موقعك' : 'City / location'}
                      Icon={MapPin}
                      value={data.location}
                      onChange={(v) => set('location', v)}
                      placeholder={isAr ? 'مثلاً: اللاذقية، سوريا' : 'e.g. Latakia, Syria'}
                      dir={dir}
                    />
                  </fieldset>
                )}

                {step === 1 && (
                  <fieldset className="grid gap-5">
                    <Legend icon={Heart} title={isAr ? 'عنك' : 'About you'} subtitle={isAr ? 'لنُلائم لك الفصل الأنسب' : 'So we can place you in the right class'} />
                    <RadioRow
                      label={isAr ? 'الفئة العمرية' : 'Age group'}
                      value={data.ageGroup}
                      onChange={(v) => set('ageGroup', v)}
                      options={[
                        { value: 'child',        ar: 'طفل (٧–١٢)',  en: 'Child (7–12)' },
                        { value: 'teen',         ar: 'مراهق (١٣–١٧)', en: 'Teen (13–17)' },
                        { value: 'adult',        ar: 'بالغ (١٨+)',  en: 'Adult (18+)' },
                        { value: 'professional', ar: 'موظّف / مهني',  en: 'Professional' },
                      ]}
                      isAr={isAr}
                      required
                    />
                    <RadioRow
                      label={isAr ? 'الجنس' : 'Gender'}
                      value={data.gender}
                      onChange={(v) => set('gender', v)}
                      options={[
                        { value: 'male',                 ar: 'ذكر',         en: 'Male' },
                        { value: 'female',               ar: 'أنثى',         en: 'Female' },
                        { value: 'prefer_not_to_say',    ar: 'أفضّل عدم القول', en: 'Prefer not to say' },
                      ]}
                      isAr={isAr}
                    />
                    <Input
                      label={isAr ? 'لغتك الأم' : 'Native language'}
                      Icon={Languages}
                      value={data.nativeLanguage}
                      onChange={(v) => set('nativeLanguage', v)}
                      placeholder={isAr ? 'مثلاً: العربية' : 'e.g. Arabic'}
                      dir={dir}
                    />
                  </fieldset>
                )}

                {step === 2 && (
                  <fieldset className="grid gap-5">
                    <Legend icon={BookOpen} title={isAr ? 'ما تريد تعلّمه' : 'What you want to learn'} subtitle={isAr ? 'اللغة المستهدفة ومستواك الحالي' : 'Your target language and current level'} />
                    <SelectGrid
                      label={isAr ? 'اللغة المستهدفة' : 'Target language'}
                      value={data.targetLanguage}
                      onChange={(v) => set('targetLanguage', v)}
                      options={TARGET_LANGUAGES.map((l) => ({ value: l.value, label: isAr ? l.ar : l.en }))}
                      required
                    />
                    <RadioRow
                      label={isAr ? 'مستواك الحالي / المستهدف' : 'Current / target level'}
                      value={data.targetLevel}
                      onChange={(v) => set('targetLevel', v)}
                      options={[
                        { value: 'beginner',     ar: 'مبتدئ',         en: 'Beginner' },
                        { value: 'A2',           ar: 'أساسي A2',       en: 'Elementary A2' },
                        { value: 'B1',           ar: 'متوسط B1',       en: 'Intermediate B1' },
                        { value: 'B2',           ar: 'متوسط عالٍ B2',   en: 'Upper-int. B2' },
                        { value: 'C1',           ar: 'متقدّم C1',       en: 'Advanced C1' },
                        { value: 'not_sure',     ar: 'لست متأكداً',     en: 'Not sure' },
                      ]}
                      isAr={isAr}
                    />
                    <Textarea
                      label={isAr ? 'لماذا تريد تعلّم هذه اللغة؟ (اختياري)' : 'Why do you want to learn this language? (optional)'}
                      Icon={Target}
                      value={data.goals}
                      onChange={(v) => set('goals', v)}
                      placeholder={isAr ? 'العمل، السفر، الدراسة، أو لمتعتك الشخصية...' : 'Work, travel, study, or just for love of the language...'}
                      dir={dir}
                    />
                  </fieldset>
                )}

                {step === 3 && (
                  <fieldset className="grid gap-5">
                    <Legend icon={Sparkles} title={isAr ? 'كيف وجدتنا؟' : 'How did you find us?'} subtitle={isAr ? 'تساعدنا للوصول لطلاب أكثر' : 'Helps us reach more students like you'} />
                    <SelectGrid
                      label={isAr ? 'مصدر تعرّفك علينا' : 'Where you heard of us'}
                      value={data.source}
                      onChange={(v) => set('source', v)}
                      options={SOURCES.map((s) => ({ value: s.value, label: isAr ? s.ar : s.en }))}
                    />
                    {/* Honeypot — invisible to humans */}
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="absolute -z-10 h-0 w-0 opacity-0"
                      placeholder="Website"
                    />
                    {result && !result.ok && (
                      <div className="rounded-sm bg-[var(--color-rose)]/10 p-3 text-sm text-[var(--color-rose)]">
                        {result.error}
                      </div>
                    )}
                    <div className="rounded-sm bg-[var(--color-rlc-100)] p-4 text-sm leading-relaxed text-[var(--color-rlc-800)]">
                      {isAr
                        ? 'بإرسال هذا الطلب، أنت توافق على مراجعة طلبك من قبل فريقنا. سنرسل لك رقم الطالب الخاص بك عبر البريد والواتساب بمجرد الموافقة.'
                        : 'By submitting, you agree that our team will review your application. We will send your personal student number by email and WhatsApp once approved.'}
                    </div>
                  </fieldset>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          {!result?.ok && (
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-rlc-800)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                {isAr ? 'السابق' : 'Back'}
              </button>
              {step < 3 ? (
                <button
                  onClick={next}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-6 py-3 text-sm font-semibold text-[var(--color-cream)] shadow-[0_12px_28px_-12px_rgba(8,57,34,0.55)] transition hover:bg-[var(--color-rlc-700)] hover:-translate-y-0.5"
                >
                  {isAr ? 'التالي' : 'Continue'}
                  <span aria-hidden className="rtl:rotate-180">→</span>
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-rlc-900)] shadow-[0_12px_28px_-12px_rgba(201,162,74,0.6)] transition hover:bg-[var(--color-gold-bright)] hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {submitting
                    ? (isAr ? 'جارٍ الإرسال...' : 'Submitting...')
                    : (<>{isAr ? 'إرسال الطلب' : 'Submit application'} <Send className="h-4 w-4 rtl:rotate-180" /></>)
                  }
                </button>
              )}
            </div>
          )}
        </motion.div>

        <footer className="mt-8 text-center text-xs text-[var(--color-ink-soft)]">
          © {new Date().getFullYear()} Rai Language Center — Latakia, Syria
        </footer>
      </div>
    </main>
  );
}

/* -------------------- Helpers -------------------- */

function Legend({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">{title}</h2>
        <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
      </div>
    </div>
  );
}

function Input({
  label, Icon, value, onChange, placeholder, type = 'text', dir, required,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: 'ltr' | 'rtl';
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
        <Icon className="h-3 w-3 text-[var(--color-gold)]" />
        {label}{required && <span className="text-[var(--color-rose)]">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="mt-2 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-base ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
      />
    </label>
  );
}

function Textarea({
  label, Icon, value, onChange, placeholder, dir,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
        <Icon className="h-3 w-3 text-[var(--color-gold)]" />
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        rows={4}
        className="mt-2 w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-base ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
      />
    </label>
  );
}

function RadioRow({
  label, value, onChange, options, isAr, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; ar: string; en: string }[];
  isAr: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
        {label}{required && <span className="text-[var(--color-rose)]"> *</span>}
      </span>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`group inline-flex items-center justify-between gap-2 rounded-sm px-4 py-3 text-start text-sm font-medium transition ${
                active
                  ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)] ring-1 ring-[var(--color-rlc-800)]'
                  : 'bg-[var(--color-ivory)] text-[var(--color-ink)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60'
              }`}
            >
              <span>{isAr ? o.ar : o.en}</span>
              {active && <CheckCircle2 className="h-4 w-4 text-[var(--color-gold)]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectGrid({
  label, value, onChange, options, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
        {label}{required && <span className="text-[var(--color-rose)]"> *</span>}
      </span>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`rounded-sm px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)] ring-1 ring-[var(--color-rlc-800)]'
                  : 'bg-[var(--color-ivory)] text-[var(--color-ink)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuccessPanel({ isAr, applicationId }: { isAr: boolean; applicationId?: string }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
        className="grid h-24 w-24 place-items-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)] shadow-[0_18px_40px_-12px_rgba(8,57,34,0.55)]"
      >
        <GraduationCap className="h-12 w-12" />
      </motion.div>
      <h2 className="mt-6 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
        {isAr ? 'تمّ استلام طلبك! 🌿' : 'Your application is in! 🌿'}
      </h2>
      <p className="mt-3 max-w-md text-sm text-[var(--color-ink-soft)]">
        {isAr
          ? 'سيراجع فريقنا طلبك ويرسل لك رقم الطالب الخاصّ بك خلال يومين عمل عبر البريد الإلكتروني والواتساب.'
          : 'Our team will review your application and send you your personal student number within two business days by email and WhatsApp.'}
      </p>
      {applicationId && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-ivory)] px-4 py-2 text-xs font-mono text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">
          {isAr ? 'مرجع الطلب:' : 'Application ref:'} {applicationId.slice(0, 8)}
        </div>
      )}
      <a
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-6 py-3 text-sm font-semibold text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)]"
      >
        {isAr ? 'العودة للموقع' : 'Back to the site'}
        <span aria-hidden className="rtl:rotate-180">→</span>
      </a>
    </motion.div>
  );
}
