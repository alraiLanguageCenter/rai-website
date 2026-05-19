'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  MessageCircle,
  GraduationCap,
  Briefcase,
  UserRound,
  Laptop2,
  X,
  Sparkles,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { StaggerGroup, staggerItem, Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

type Accent = 'green' | 'gold' | 'deep';

const META: Record<string, { Icon: React.ComponentType<{ className?: string }>; accent: Accent }> = {
  kids:     { Icon: BookOpen,       accent: 'gold' },
  adults:   { Icon: MessageCircle,  accent: 'green' },
  exams:    { Icon: GraduationCap,  accent: 'deep' },
  business: { Icon: Briefcase,      accent: 'green' },
  private:  { Icon: UserRound,      accent: 'gold' },
  online:   { Icon: Laptop2,        accent: 'deep' },
};

type CourseItem = { id: string; title: string; tag: string; badge?: string; summary: string; details: string; cta: string };

export function Courses() {
  const t = useTranslations('courses');
  const items = t.raw('items') as CourseItem[];
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = items.find((i) => i.id === openId) ?? null;
  const reduced = useReducedMotion();

  return (
    <Section id="courses" tone="ivory" className="overflow-hidden">
      {/* Drifting ambient blobs */}
      {!reduced && (
        <>
          <motion.span aria-hidden className="pointer-events-none absolute -end-20 -top-10 h-72 w-72 rounded-full bg-[var(--color-gold)]/10 blur-3xl"
            animate={{ y: [0, 14, 0], x: [0, -10, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span aria-hidden className="pointer-events-none absolute -start-24 bottom-0 h-80 w-80 rounded-full bg-[var(--color-rlc-700)]/10 blur-3xl"
            animate={{ y: [0, -18, 0], x: [0, 12, 0] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }} />
        </>
      )}

      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-gold)]" />
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="mt-5 max-w-2xl body-lg text-[var(--color-ink-soft)]">{t('lede')}</p>
      </Reveal>

      <StaggerGroup className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
        {items.map((item) => {
          const meta = META[item.id] ?? { Icon: BookOpen, accent: 'green' as const };
          return (
            <CourseCard key={item.id} item={item} Icon={meta.Icon} accent={meta.accent} onOpen={() => setOpenId(item.id)} />
          );
        })}
      </StaggerGroup>

      {/* MORE → Open catalog */}
      <div className="mt-12 flex justify-center">
        <CatalogTrigger />
      </div>

      <AnimatePresence>
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-ink)]/60 p-6 backdrop-blur-sm"
            onClick={() => setOpenId(null)} role="dialog" aria-modal="true">
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl rounded-sm bg-[var(--color-cream)] p-8 lg:p-12"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setOpenId(null)} aria-label="Close"
                className="absolute end-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-line)]/40">
                <X className="h-4 w-4" />
              </button>
              {opened.badge && <span className="inline-block rounded-full bg-[var(--color-gold)]/15 px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">{opened.badge}</span>}
              <div className="mt-3 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">{opened.tag}</div>
              <h3 className="mt-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{opened.title}</h3>
              <p className="mt-6 body-lg text-[var(--color-ink-soft)]">{opened.details}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#book" size="lg" magnetic onClick={() => setOpenId(null)}>{opened.cta}</Button>
                <Button href="#assess" size="lg" variant="secondary" onClick={() => setOpenId(null)}>Free placement</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

/* --------------------- Card --------------------- */

function CourseCard({
  item, Icon, accent, onOpen,
}: {
  item: CourseItem;
  Icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();

  // Accent → CSS variables for the card
  const accentVars: React.CSSProperties =
    accent === 'gold'
      ? { ['--accent' as never]: '#C9A24A', ['--accent-soft' as never]: 'rgba(201,162,74,0.14)' }
      : accent === 'deep'
        ? { ['--accent' as never]: '#083922', ['--accent-soft' as never]: 'rgba(8,57,34,0.12)' }
        : { ['--accent' as never]: '#1A6F45', ['--accent-soft' as never]: 'rgba(26,111,69,0.12)' };

  return (
    <motion.button
      variants={staggerItem}
      onClick={onOpen}
      whileHover={reduced ? undefined : { y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={accentVars}
      className="group relative flex h-full flex-col overflow-hidden rounded-md bg-[var(--color-cream)] p-7 text-start ring-1 ring-[var(--color-line)] transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(8,57,34,0.35)]"
    >
      <span aria-hidden
        className="absolute inset-0 origin-top-left scale-x-0 bg-gradient-to-br from-[var(--accent-soft)] via-transparent to-transparent transition-transform duration-700 ease-out group-hover:scale-x-100" />
      <span aria-hidden
        className="absolute inset-x-0 bottom-0 h-px w-0 bg-[var(--accent)] transition-all duration-500 group-hover:w-full" />

      {!reduced && (
        <motion.span
          aria-hidden
          className="absolute end-5 top-5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
          style={{ opacity: 0.55 }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {item.badge && (
        <div className="relative inline-flex">
          <span
            className="inline-block rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
          >
            {item.badge}
          </span>
        </div>
      )}

      <div className="relative mt-6">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full text-[var(--accent)] transition-transform duration-500 ease-out group-hover:rotate-[12deg]"
             style={{ backgroundColor: 'var(--accent-soft)' }}>
          <Icon className="h-6 w-6" />
          {!reduced && (
            <motion.span
              aria-hidden
              className="absolute -inset-1 rounded-full border"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        <div className="mt-7 text-[0.7rem] uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>{item.tag}</div>
        <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">{item.title}</h3>
        <p className="mt-3 text-[var(--color-ink-soft)]">{item.summary}</p>

        <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-rlc-800)] transition group-hover:text-[color:var(--accent)]">
          {item.cta}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 rtl:rotate-[-90deg]" />
        </div>
      </div>
    </motion.button>
  );
}

/* ----------------------- Full catalog (More button) ----------------------- */

type CourseEntry = {
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  duration?: { en: string; ar: string };
};

type Language = {
  code: string;
  flag: string;
  name: { en: string; ar: string };
  motto: { en: string; ar: string };
  courses: CourseEntry[];
};

const LANGUAGES: Language[] = [
  {
    code: 'en', flag: '🇬🇧',
    name: { en: 'English', ar: 'الإنجليزية' },
    motto: { en: 'The language of global opportunity.', ar: 'لغة الفرص العالمية.' },
    courses: [
      {
        title: { en: 'General English (A1–C2)',  ar: 'إنجليزية عامة (A1–C2)' },
        duration: { en: '3 months · 36 hours', ar: '٣ أشهر · ٣٦ ساعة' },
        description: {
          en: 'Build your English from absolute beginner all the way to mastery. Small groups, balanced focus on reading, writing, listening, and speaking, with weekly progress checks and confident speaking practice.',
          ar: 'ابنِ مستواك في الإنجليزية من المبتدئ المطلق وصولاً إلى الإتقان. مجموعات صغيرة، تركيز متوازن على القراءة والكتابة والاستماع والمحادثة، مع تقييمات أسبوعية وتدريب على المحادثة بثقة.',
        },
      },
      {
        title: { en: 'Kids & Teens (ages 7–17)',  ar: 'الأطفال واليافعون (٧–١٧)' },
        duration: { en: '3 months · 24 hours', ar: '٣ أشهر · ٢٤ ساعة' },
        description: {
          en: 'Age-grouped classes that mix games, songs, stories, and Cambridge curriculum. Kids leave each session smiling — and ready to use what they learned at school the next day.',
          ar: 'صفوف مقسّمة بحسب الأعمار تجمع بين الألعاب والأغاني والقصص ومنهاج كامبردج. يخرج الأطفال من كل حصة مبتسمين ومستعدين لاستخدام ما تعلّموه في المدرسة في اليوم التالي.',
        },
      },
      {
        title: { en: 'IELTS Preparation',         ar: 'تحضير IELTS' },
        duration: { en: '8 weeks · intensive', ar: '٨ أسابيع · مكثّف' },
        description: {
          en: 'Eight weeks of focused prep covering all four bands: listening, reading, writing, and speaking. Full mock tests every fortnight, with personalised feedback from IELTS-certified instructors.',
          ar: 'ثمانية أسابيع من التحضير المركّز تغطي الأقسام الأربعة: الاستماع والقراءة والكتابة والمحادثة. اختبارات تجريبية كاملة كل أسبوعين مع تغذية راجعة شخصية من مدرّسين معتمدين.',
        },
      },
      {
        title: { en: 'TOEFL Preparation',         ar: 'تحضير TOEFL' },
        duration: { en: '8 weeks · intensive', ar: '٨ أسابيع · مكثّف' },
        description: {
          en: 'Built for the TOEFL iBT format. Integrated-skills practice, strategy for the speaking and writing sections, and 4 full mock exams so you walk in on test day knowing exactly what to expect.',
          ar: 'مصمّم لصيغة TOEFL iBT. تدريب على المهارات المتكاملة، واستراتيجيات قسمَي المحادثة والكتابة، و٤ اختبارات تجريبية كاملة لتدخل يوم الاختبار وأنت تعرف ما الذي ينتظرك.',
        },
      },
      {
        title: { en: 'Cambridge FCE / CAE',       ar: 'Cambridge FCE / CAE' },
        duration: { en: '10 weeks', ar: '١٠ أسابيع' },
        description: {
          en: 'Official Cambridge English exam preparation. FCE (B2) and CAE (C1) tracks. Get the internationally recognised certificate that opens doors to universities and employers worldwide.',
          ar: 'تحضير رسمي لاختبارات كامبردج للغة الإنجليزية. مساران: FCE (B2) و CAE (C1). احصل على الشهادة المعترف بها دولياً والتي تفتح أبواب الجامعات وأصحاب العمل حول العالم.',
        },
      },
      {
        title: { en: 'Business English',          ar: 'إنجليزية الأعمال' },
        duration: { en: '12 weeks', ar: '١٢ أسبوع' },
        description: {
          en: 'Emails, meetings, presentations, negotiations, and the social English you need to thrive at work. Real-world case studies and role-plays drawn from finance, tech, healthcare, and trade.',
          ar: 'البريد الإلكتروني والاجتماعات والعروض والمفاوضات واللغة الاجتماعية التي تحتاجها لتنجح في العمل. حالات عملية وأدوار واقعية من قطاعات المال والتقنية والصحة والتجارة.',
        },
      },
      {
        title: { en: 'Medical English',           ar: 'الإنجليزية الطبية' },
        duration: { en: '10 weeks', ar: '١٠ أسابيع' },
        description: {
          en: 'For doctors, nurses, pharmacists, and medical students. Patient communication, medical terminology, case discussion, and the English of conferences, journals, and licensing exams.',
          ar: 'للأطباء والممرضين والصيادلة وطلاب الطب. التواصل مع المرضى والمصطلحات الطبية ومناقشة الحالات ولغة المؤتمرات والمجلات والاختبارات.',
        },
      },
      {
        title: { en: 'Conversation Club',         ar: 'نادي المحادثة' },
        duration: { en: 'Weekly · drop-in', ar: 'أسبوعي · حضور حر' },
        description: {
          en: 'A weekly free-form circle led by a native or near-native facilitator. Themed topics every week — culture, current events, debates, travel — designed to break the silence and build fluency.',
          ar: 'حلقة محادثة أسبوعية حرّة بإشراف ميسّر بمستوى أصلي أو شبه أصلي. موضوع جديد كل أسبوع — ثقافة، أحداث جارية، مناظرات، سفر — مصمّمة لكسر الصمت وبناء الطلاقة.',
        },
      },
      {
        title: { en: 'Private 1-on-1',            ar: 'دروس خصوصية' },
        duration: { en: 'Flexible · paced for you', ar: 'مرن · على إيقاعك' },
        description: {
          en: 'Fully personalised tutoring at your pace, around your schedule. Your instructor designs the syllabus around your goals — exam prep, conversation, business, academic — and pivots as you progress.',
          ar: 'تعليم مخصّص بالكامل على إيقاعك ووفق جدولك. يصمّم المعلّم المنهاج حول أهدافك — تحضير امتحانات، محادثة، أعمال، أكاديمي — ويعدّله مع تقدّمك.',
        },
      },
      {
        title: { en: 'Online Live Classes',       ar: 'صفوف أونلاين' },
        duration: { en: 'Live · interactive', ar: 'مباشر · تفاعلي' },
        description: {
          en: 'Same teachers, same curriculum, same quality — from anywhere. Live interactive classes via Zoom with breakout rooms, shared whiteboards, and recordings for review.',
          ar: 'نفس المدرّسين، نفس المنهاج، نفس الجودة — من أي مكان. صفوف مباشرة تفاعلية عبر Zoom مع غرف فرعية ولوحات مشتركة وتسجيلات للمراجعة.',
        },
      },
    ],
  },
  {
    code: 'fr', flag: '🇫🇷',
    name: { en: 'French', ar: 'الفرنسية' },
    motto: { en: 'The language of art, diplomacy, and culture.', ar: 'لغة الفن والدبلوماسية والثقافة.' },
    courses: [
      {
        title: { en: 'General French (A1–B2)',    ar: 'فرنسية عامة (A1–B2)' },
        duration: { en: '3 months · 36 hours', ar: '٣ أشهر · ٣٦ ساعة' },
        description: {
          en: 'From your very first "bonjour" to comfortable conversation about culture, work, and travel. Balanced grammar, pronunciation drills, and lots of speaking practice with Francophone instructors.',
          ar: 'من أول "بونجور" إلى محادثة مريحة عن الثقافة والعمل والسفر. تركيز متوازن على القواعد والنطق والكثير من تمارين المحادثة مع مدرّسين فرنكوفونيين.',
        },
      },
      {
        title: { en: 'DELF / DALF Preparation',   ar: 'تحضير DELF / DALF' },
        duration: { en: '10 weeks', ar: '١٠ أسابيع' },
        description: {
          en: 'Official French certification prep. DELF B1/B2 for university and immigration, DALF C1/C2 for advanced academic and professional contexts. Includes full mock exams.',
          ar: 'تحضير رسمي لشهادات اللغة الفرنسية. DELF B1/B2 للجامعة والهجرة، DALF C1/C2 للسياقات الأكاديمية والمهنية المتقدّمة. يشمل اختبارات تجريبية كاملة.',
        },
      },
      {
        title: { en: 'Business French',           ar: 'الفرنسية للأعمال' },
        duration: { en: '8 weeks', ar: '٨ أسابيع' },
        description: {
          en: 'Professional French for international business, hospitality, and luxury sectors. Emails, meetings, presentations, and the cultural codes that matter when working with French-speaking partners.',
          ar: 'فرنسية احترافية للأعمال الدولية والضيافة والقطاعات الراقية. البريد الإلكتروني والاجتماعات والعروض والمفاتيح الثقافية التي تهمّ عند التعامل مع شركاء ناطقين بالفرنسية.',
        },
      },
      {
        title: { en: 'Kids & Teens French',       ar: 'الفرنسية للأطفال' },
        duration: { en: '3 months · 24 hours', ar: '٣ أشهر · ٢٤ ساعة' },
        description: {
          en: 'Songs, games, and stories tailored by age group. Children build authentic French pronunciation from day one and discover the joy of a second language.',
          ar: 'أغانٍ وألعاب وقصص مصمّمة بحسب الفئة العمرية. يبني الأطفال نطقاً فرنسياً أصيلاً منذ اليوم الأول ويكتشفون متعة لغة ثانية.',
        },
      },
      {
        title: { en: 'Conversation Club',         ar: 'نادي المحادثة' },
        duration: { en: 'Weekly · drop-in', ar: 'أسبوعي · حضور حر' },
        description: {
          en: 'Weekly French-only conversation circle. Themed nights — cinema, cuisine, current events — for intermediate and advanced speakers ready to practise.',
          ar: 'حلقة محادثة أسبوعية بالفرنسية فقط. ليالٍ مواضيعية — سينما ومطبخ وأحداث جارية — للمتوسّطين والمتقدّمين الجاهزين للتدرّب.',
        },
      },
    ],
  },
  {
    code: 'de', flag: '🇩🇪',
    name: { en: 'German', ar: 'الألمانية' },
    motto: { en: 'The language of engineering and ideas.', ar: 'لغة الهندسة والأفكار.' },
    courses: [
      {
        title: { en: 'General German (A1–B2)',    ar: 'ألمانية عامة (A1–B2)' },
        duration: { en: '3 months · 36 hours', ar: '٣ أشهر · ٣٦ ساعة' },
        description: {
          en: 'A clear path from beginner to upper-intermediate German. Methodical grammar coverage, pronunciation drills, and conversation practice with experienced instructors.',
          ar: 'مسار واضح من المبتدئ إلى المستوى المتوسط العالي في الألمانية. تغطية منهجية للقواعد وتمارين النطق وممارسة المحادثة مع مدرّسين ذوي خبرة.',
        },
      },
      {
        title: { en: 'Goethe-Zertifikat Prep',    ar: 'تحضير شهادة جوته' },
        duration: { en: '8 weeks', ar: '٨ أسابيع' },
        description: {
          en: 'Official Goethe-Institut exam preparation, A2 through C1. Required for many German universities and the path to working and studying in Germany.',
          ar: 'تحضير رسمي لاختبارات معهد جوته من A2 إلى C1. مطلوبة لكثير من الجامعات الألمانية وطريقك للعمل والدراسة في ألمانيا.',
        },
      },
      {
        title: { en: 'TestDaF Preparation',       ar: 'تحضير TestDaF' },
        duration: { en: '8 weeks', ar: '٨ أسابيع' },
        description: {
          en: 'For students planning to study at a German university. Covers the four TestDaF modules with timed practice and detailed scoring feedback.',
          ar: 'للطلاب الذين يخطّطون للدراسة في جامعة ألمانية. يغطّي وحدات TestDaF الأربع بتمارين موقوتة وتغذية راجعة مفصّلة على الدرجات.',
        },
      },
      {
        title: { en: 'Conversation Club',         ar: 'نادي المحادثة' },
        duration: { en: 'Weekly · drop-in', ar: 'أسبوعي · حضور حر' },
        description: {
          en: 'Weekly Stammtisch-style conversation circle. Practise everyday German, discuss current events, and overcome the fear of speaking with native and near-native facilitators.',
          ar: 'حلقة محادثة أسبوعية على نمط الـ Stammtisch. تدرّب على الألمانية اليومية وناقش الأحداث الجارية وتغلّب على الخوف من التحدّث مع ميسّرين بمستوى أصلي أو شبه أصلي.',
        },
      },
    ],
  },
  {
    code: 'ru', flag: '🇷🇺',
    name: { en: 'Russian', ar: 'الروسية' },
    motto: { en: 'The language of literature and science.', ar: 'لغة الأدب والعلم.' },
    courses: [
      {
        title: { en: 'General Russian (A1–B2)',   ar: 'روسية عامة (A1–B2)' },
        duration: { en: '3 months · 36 hours', ar: '٣ أشهر · ٣٦ ساعة' },
        description: {
          en: 'Master the Cyrillic alphabet in the first week and build steady progress through cases, verbs of motion, and the structures that make Russian feel logical.',
          ar: 'أتقن الأبجدية السيريلية في الأسبوع الأول وابنِ تقدّماً ثابتاً عبر الحالات وأفعال الحركة والقواعد التي تجعل الروسية تبدو منطقية.',
        },
      },
      {
        title: { en: 'TORFL Preparation',         ar: 'تحضير TORFL' },
        duration: { en: '8 weeks', ar: '٨ أسابيع' },
        description: {
          en: 'The official Russian state exam. Required for Russian university admission and citizenship. Five sub-tests covered with full mock exam practice.',
          ar: 'الاختبار الرسمي للدولة الروسية. مطلوب للقبول في الجامعات الروسية والحصول على الجنسية. تغطية للأقسام الخمسة مع اختبارات تجريبية كاملة.',
        },
      },
      {
        title: { en: 'Conversation Club',         ar: 'نادي المحادثة' },
        duration: { en: 'Weekly · drop-in', ar: 'أسبوعي · حضور حر' },
        description: {
          en: 'Weekly Russian conversation circle. Discuss Russian culture, literature, cinema, and current events while building real conversational fluency.',
          ar: 'حلقة محادثة روسية أسبوعية. ناقش الثقافة الروسية والأدب والسينما والأحداث الجارية مع بناء طلاقة محادثة حقيقية.',
        },
      },
    ],
  },
  {
    code: 'es', flag: '🇪🇸',
    name: { en: 'Spanish', ar: 'الإسبانية' },
    motto: { en: 'The language of two continents.', ar: 'لغة قارّتَين.' },
    courses: [
      {
        title: { en: 'General Spanish (A1–B2)',   ar: 'إسبانية عامة (A1–B2)' },
        duration: { en: '3 months · 36 hours', ar: '٣ أشهر · ٣٦ ساعة' },
        description: {
          en: 'One of the easiest world languages to start, and the second-most-spoken on Earth. Build confident conversation skills for travel, work, or just love of the language.',
          ar: 'من أسهل لغات العالم للبدء، وثاني أكثر لغة منطوقة على كوكب الأرض. ابنِ مهارات محادثة واثقة للسفر أو العمل أو حبّاً باللغة.',
        },
      },
      {
        title: { en: 'DELE Preparation',          ar: 'تحضير DELE' },
        duration: { en: '8 weeks', ar: '٨ أسابيع' },
        description: {
          en: 'The official Instituto Cervantes certification. DELE B1/B2/C1 with full mock exams. Recognised by universities, employers, and immigration authorities in Spanish-speaking countries.',
          ar: 'الشهادة الرسمية لمعهد سرفانتس. DELE B1/B2/C1 مع اختبارات تجريبية كاملة. معتمدة من الجامعات وأصحاب العمل وسلطات الهجرة في الدول الناطقة بالإسبانية.',
        },
      },
      {
        title: { en: 'Conversation Club',         ar: 'نادي المحادثة' },
        duration: { en: 'Weekly · drop-in', ar: 'أسبوعي · حضور حر' },
        description: {
          en: 'Weekly Spanish-only chat circle with themed nights — tapas culture, Latin American cinema, current events. Open to all levels above A2.',
          ar: 'حلقة دردشة أسبوعية بالإسبانية فقط مع ليالٍ مواضيعية — ثقافة التاباس وسينما أمريكا اللاتينية والأحداث الجارية. مفتوحة لكل المستويات فوق A2.',
        },
      },
    ],
  },
  {
    code: 'tr', flag: '🇹🇷',
    name: { en: 'Turkish', ar: 'التركية' },
    motto: { en: 'The language of a new generation of business.', ar: 'لغة جيل جديد من الأعمال.' },
    courses: [
      {
        title: { en: 'General Turkish (A1–B2)',   ar: 'تركية عامة (A1–B2)' },
        duration: { en: '3 months · 36 hours', ar: '٣ أشهر · ٣٦ ساعة' },
        description: {
          en: 'Learn the structure of Turkish from the ground up — vowel harmony, agglutination, and a logic that makes building sentences feel like solving a beautiful puzzle.',
          ar: 'تعلّم بنية اللغة التركية من الصفر — تناغم الحركات والإلصاق والمنطق الذي يجعل بناء الجمل وكأنه حلّ أحجية جميلة.',
        },
      },
      {
        title: { en: 'TÖMER Preparation',         ar: 'تحضير TÖMER' },
        duration: { en: '8 weeks', ar: '٨ أسابيع' },
        description: {
          en: 'Official TÖMER certification — required for studying at Turkish universities and many work permits. Full mock exams and targeted weak-area drilling.',
          ar: 'شهادة TÖMER الرسمية — مطلوبة للدراسة في الجامعات التركية وكثير من تصاريح العمل. اختبارات تجريبية كاملة وتدريب موجّه للنقاط الضعيفة.',
        },
      },
      {
        title: { en: 'Conversation Club',         ar: 'نادي المحادثة' },
        duration: { en: 'Weekly · drop-in', ar: 'أسبوعي · حضور حر' },
        description: {
          en: 'Weekly Turkish conversation circle. Discuss Turkish culture, food, and the latest series — perfect for building real fluency between formal class hours.',
          ar: 'حلقة محادثة تركية أسبوعية. ناقش الثقافة التركية والمطبخ وأحدث المسلسلات — مثاليّة لبناء طلاقة حقيقية بين ساعات الصف الرسمية.',
        },
      },
    ],
  },
  {
    code: 'ar', flag: '🇸🇾',
    name: { en: 'Arabic (for foreigners)', ar: 'العربية لغير الناطقين بها' },
    motto: { en: 'A language with roots in every great civilisation.', ar: 'لغة لها جذور في كل حضارة عظيمة.' },
    courses: [
      {
        title: { en: 'Modern Standard Arabic',     ar: 'العربية الفصحى الحديثة' },
        duration: { en: '3 months · 36 hours', ar: '٣ أشهر · ٣٦ ساعة' },
        description: {
          en: 'The shared written language of all Arabic-speaking countries. Read news, literature, and official documents — the foundation every serious learner of Arabic needs.',
          ar: 'اللغة المكتوبة المشتركة لكل الدول الناطقة بالعربية. اقرأ الأخبار والأدب والوثائق الرسمية — الأساس الذي يحتاجه كل متعلّم جادّ للعربية.',
        },
      },
      {
        title: { en: 'Levantine Colloquial',       ar: 'اللهجة الشامية' },
        duration: { en: '8 weeks', ar: '٨ أسابيع' },
        description: {
          en: 'The everyday spoken Arabic of Syria, Lebanon, Jordan, and Palestine. Built around real conversations and the rhythm of how people actually talk on the street.',
          ar: 'اللهجة المنطوقة اليومية في سوريا ولبنان والأردن وفلسطين. مبنيّة حول محادثات حقيقية وإيقاع الكلام كما هو في الشارع.',
        },
      },
      {
        title: { en: 'Quranic Arabic',             ar: 'العربية القرآنية' },
        duration: { en: '10 weeks', ar: '١٠ أسابيع' },
        description: {
          en: 'Read and understand the Qur\'an in its original Arabic. Classical grammar, root systems, and the vocabulary of the sacred text — taught with respect for tradition and clarity for the modern learner.',
          ar: 'اقرأ القرآن وافهمه بلغته الأصلية. النحو الكلاسيكي ونظام الجذور ومفردات النص المقدّس — يُدرَّس باحترام للتقليد ووضوح للمتعلّم المعاصر.',
        },
      },
    ],
  },
];

function CatalogTrigger() {
  const locale = useLocale() as 'ar' | 'en';
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-7 py-3.5 text-sm font-semibold text-[var(--color-cream)] shadow-[0_14px_30px_-14px_rgba(8,57,34,0.55)] transition hover:bg-[var(--color-rlc-700)] hover:-translate-y-0.5"
      >
        <BookOpen className="h-4 w-4" />
        {locale === 'ar' ? 'تصفّح كل اللغات والدورات' : 'Browse all languages & courses'}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 rtl:rotate-[-90deg]" />
      </button>

      <AnimatePresence>
        {open && <CatalogBook onClose={() => setOpen(false)} locale={locale} />}
      </AnimatePresence>
    </>
  );
}

/* ----------------------- The Book ----------------------- */
/**
 * 3D interactive flip book.
 * - A real-feeling book with spine, cover shadow, and page-corner curl.
 * - Pages flip with rotateY animation that respects locale (RTL flips from the left).
 * - Each course on a page is clickable: clicking reveals the course brief in an
 *   animated overlay sliding in from the side of the open page.
 */
function CatalogBook({ onClose, locale }: { onClose: () => void; locale: 'ar' | 'en' }) {
  const [pageIdx, setPageIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedCourseIdx, setSelectedCourseIdx] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const total = LANGUAGES.length;
  const lang = LANGUAGES[pageIdx];

  function go(d: 1 | -1) {
    setDirection(d);
    setPageIdx((p) => (p + d + total) % total);
    setSelectedCourseIdx(null);
  }
  function jumpTo(i: number) {
    setDirection(i > pageIdx ? 1 : -1);
    setPageIdx(i);
    setSelectedCourseIdx(null);
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selectedCourseIdx !== null) { setSelectedCourseIdx(null); return; }
        onClose();
      } else if (e.key === 'ArrowRight') go(locale === 'ar' ? -1 : 1);
      else if (e.key === 'ArrowLeft') go(locale === 'ar' ? 1 : -1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locale, onClose, selectedCourseIdx]);

  const selectedCourse = selectedCourseIdx !== null ? lang.courses[selectedCourseIdx] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-ink)]/75 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
      role="dialog" aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{ perspective: 2200, transformStyle: 'preserve-3d' }}
        className="relative w-full max-w-5xl"
      >
        {/* Floating close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 end-0 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-rlc-900)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-ivory)]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Book shell (cover + page) */}
        <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
          {/* Cast shadow under the book */}
          <span aria-hidden className="pointer-events-none absolute -inset-x-8 -bottom-6 h-12 rounded-[50%] bg-black/40 blur-2xl" />

          {/* The "book" — two-panel layout */}
          <div
            className="relative grid overflow-hidden rounded-md shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(0,0,0,0.05)]"
            style={{
              gridTemplateColumns: 'minmax(0,11fr) minmax(0,14fr)',
              backgroundColor: 'var(--color-cream)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* === LEFT PAGE: cover-ish — language flag, motto, TOC === */}
            <div
              className="relative flex flex-col justify-between bg-gradient-to-br from-[var(--color-rlc-900)] via-[var(--color-rlc-800)] to-[var(--color-rlc-900)] p-8 text-[var(--color-cream)] sm:p-10"
              style={{
                boxShadow: 'inset -22px 0 32px -28px rgba(0,0,0,0.7)',
                minHeight: 540,
              }}
            >
              {/* gold corner accent */}
              <span aria-hidden className="pointer-events-none absolute -end-4 -top-4 h-24 w-24 rounded-full bg-[var(--color-gold)]/25 blur-2xl" />
              <span aria-hidden className="pointer-events-none absolute -start-6 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-gold)]/15 blur-3xl" />

              <div className="relative">
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                  {locale === 'ar' ? 'كتاب الدورات' : 'Course Catalogue'}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-cream)]/55">
                  Rai Language Center — Latakia
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={lang.code}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-10"
                  >
                    <div className="text-7xl leading-none">{lang.flag}</div>
                    <h3 className="mt-6 font-[var(--font-display)] text-4xl text-[var(--color-cream)] sm:text-5xl">
                      {lang.name[locale]}
                    </h3>
                    <p className="mt-4 max-w-xs text-sm italic text-[var(--color-cream)]/80">
                      {lang.motto[locale]}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* TOC: jump to language */}
              <div className="relative mt-10">
                <div className="text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-cream)]/60">
                  {locale === 'ar' ? 'الفهرس' : 'Contents'}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {LANGUAGES.map((l, i) => (
                    <button
                      key={l.code}
                      onClick={() => jumpTo(i)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition ${
                        i === pageIdx
                          ? 'bg-[var(--color-gold)] text-[var(--color-rlc-900)]'
                          : 'bg-[var(--color-cream)]/10 text-[var(--color-cream)]/80 hover:bg-[var(--color-cream)]/20'
                      }`}
                    >
                      <span className="text-sm leading-none">{l.flag}</span>
                      {l.name[locale]}
                    </button>
                  ))}
                </div>
                <div className="mt-6 text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                  {locale === 'ar' ? `صفحة ${pageIdx + 1} من ${total}` : `Page ${pageIdx + 1} of ${total}`}
                </div>
              </div>
            </div>

            {/* === RIGHT PAGE: course list with page-flip + clickable courses === */}
            <div
              className="relative bg-[var(--color-cream)]"
              style={{
                perspective: 1600,
                boxShadow: 'inset 22px 0 28px -28px rgba(0,0,0,0.18)',
                minHeight: 540,
              }}
            >
              {/* Paper texture: subtle striped lines */}
              <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{ background: 'repeating-linear-gradient(180deg, transparent 0, transparent 27px, rgba(8,57,34,0.4) 27px, rgba(8,57,34,0.4) 28px)' }} />
              {/* Margin rail */}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 start-6 w-px bg-[var(--color-gold)]/40" />
              {/* Page corner curl */}
              {!reduced && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-0 end-0 h-12 w-12"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 50%, var(--color-cream) 50%)',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  }}
                  animate={{ scale: [1, 1.06, 1], rotate: [0, -2, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={lang.code}
                  custom={direction}
                  initial={{ rotateY: direction > 0 ? 95 : -95, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: direction > 0 ? -95 : 95, opacity: 0 }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: locale === 'ar' ? 'right center' : 'left center',
                  }}
                  className="relative h-full px-8 py-10 sm:px-12"
                >
                  <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                    {locale === 'ar' ? 'دوراتنا في' : 'Our courses in'} {lang.name[locale]}
                  </div>
                  <h4 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)] sm:text-3xl">
                    {locale === 'ar' ? 'انقر على أيّ دورة لقراءة موجزها' : 'Click any course to read its brief'}
                  </h4>

                  <ul className="mt-8 grid gap-2.5">
                    {lang.courses.map((c, i) => {
                      const active = i === selectedCourseIdx;
                      return (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <button
                            onClick={() => setSelectedCourseIdx(active ? null : i)}
                            className={`group/btn flex w-full items-center justify-between gap-4 rounded-sm px-4 py-3 text-start text-sm transition ${
                              active
                                ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)] ring-1 ring-[var(--color-rlc-800)]'
                                : 'bg-[var(--color-ivory)] text-[var(--color-ink)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]'
                            }`}
                          >
                            <span className="inline-flex items-center gap-3">
                              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-semibold ${
                                active ? 'bg-[var(--color-gold)] text-[var(--color-rlc-900)]' : 'bg-[var(--color-cream)] text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)]'
                              }`}>
                                {i + 1}
                              </span>
                              <span className="font-medium">{c.title[locale]}</span>
                            </span>
                            <span className={`text-xs transition ${active ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-soft)] opacity-0 group-hover/btn:opacity-100'}`}>
                              {active ? (locale === 'ar' ? 'مفتوح ↓' : 'Open ↓') : (locale === 'ar' ? 'موجز' : 'Brief')}
                            </span>
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>

                  {/* Bottom CTA */}
                  <div className="mt-8 flex flex-wrap justify-end gap-3">
                    <Button href="#book" size="md" variant="gold" onClick={onClose}>
                      {locale === 'ar' ? 'احجز جلسة تعارف' : 'Book a discovery session'}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Course brief overlay: slides in from outer edge */}
              <AnimatePresence>
                {selectedCourse && (
                  <motion.div
                    key={`brief-${pageIdx}-${selectedCourseIdx}`}
                    initial={{ opacity: 0, x: locale === 'ar' ? -40 : 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: locale === 'ar' ? -40 : 40 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex flex-col bg-[var(--color-cream)] px-8 py-10 sm:px-12"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(201,162,74,0.10), transparent 50%)',
                    }}
                  >
                    <button
                      onClick={() => setSelectedCourseIdx(null)}
                      className="absolute end-6 top-6 inline-flex items-center gap-1 rounded-full bg-[var(--color-ivory)] px-3 py-1.5 text-[0.7rem] font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]"
                    >
                      ← {locale === 'ar' ? 'العودة للقائمة' : 'Back to list'}
                    </button>

                    <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                      {lang.flag} {lang.name[locale]}
                    </div>
                    <h4 className="mt-2 max-w-md font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)] sm:text-4xl">
                      {selectedCourse.title[locale]}
                    </h4>
                    {selectedCourse.duration && (
                      <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-rlc-100)] px-3 py-1 text-xs text-[var(--color-rlc-800)]">
                        ⏱ {selectedCourse.duration[locale]}
                      </div>
                    )}
                    <p className="mt-6 max-w-prose body-lg leading-relaxed text-[var(--color-ink-soft)]">
                      {selectedCourse.description[locale]}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-3 pt-8">
                      <Button href="#book" size="md" variant="gold" onClick={onClose}>
                        {locale === 'ar' ? 'احجز هذه الدورة' : 'Book this course'}
                      </Button>
                      <Button href="#assess" size="md" variant="secondary" onClick={onClose}>
                        {locale === 'ar' ? 'اختبار تحديد المستوى' : 'Free placement test'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spine: vertical bar between the two pages */}
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[44%] w-[2px] bg-gradient-to-b from-transparent via-black/30 to-transparent" />
          </div>

          {/* Page navigation */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => go(locale === 'ar' ? 1 : -1)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-4 py-2 text-xs font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-cream)]/40 transition hover:bg-[var(--color-cream)]/90"
            >
              {locale === 'ar' ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              {locale === 'ar' ? 'الصفحة السابقة' : 'Previous page'}
            </button>

            <div className="flex gap-1.5">
              {LANGUAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jumpTo(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`h-2 w-2 rounded-full transition ${i === pageIdx ? 'bg-[var(--color-gold)] scale-150' : 'bg-[var(--color-cream)]/30 hover:bg-[var(--color-cream)]/60'}`}
                />
              ))}
            </div>

            <button
              onClick={() => go(locale === 'ar' ? -1 : 1)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs font-medium text-[var(--color-rlc-900)] transition hover:bg-[var(--color-gold-bright)]"
            >
              {locale === 'ar' ? 'الصفحة التالية' : 'Next page'}
              {locale === 'ar' ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
