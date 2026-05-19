-- Rai Language Center — initial schema
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. Contact submissions
-- =========================================================================
create table if not exists contact_submissions (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  phone       text,
  course      text not null,
  message     text not null,
  locale      text not null check (locale in ('ar','en')),
  user_agent  text,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

-- =========================================================================
-- 2. Announcements (flyers/news visible on landing page)
-- =========================================================================
create table if not exists announcements (
  id          uuid primary key default uuid_generate_v4(),
  title_ar    text not null,
  title_en    text not null,
  body_ar     text,
  body_en     text,
  flyer_url   text,             -- public Storage URL
  cta_url     text,
  cta_label_ar text,
  cta_label_en text,
  starts_at   timestamptz default now(),
  ends_at     timestamptz,
  published   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists announcements_active_idx on announcements (published, starts_at, ends_at);

-- =========================================================================
-- 3. Schedule entries (courses & exams)
-- =========================================================================
do $$ begin
  create type schedule_kind as enum ('course','exam');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type schedule_status as enum ('open','closed','full');
exception when duplicate_object then null;
end $$;

create table if not exists schedule_entries (
  id              uuid primary key default uuid_generate_v4(),
  kind            schedule_kind not null,
  title_ar        text not null,
  title_en        text not null,
  description_ar  text,
  description_en  text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  room            text,
  capacity        int,
  seats_taken     int not null default 0,
  registration_url text,
  status          schedule_status not null default 'open',
  published       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists schedule_starts_idx on schedule_entries (starts_at);

-- =========================================================================
-- 4. Assessment bookings (student requests + admin approval)
-- =========================================================================
do $$ begin
  create type booking_status as enum ('pending','approved','rejected','cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type age_group as enum ('child','teen','adult','professional');
exception when duplicate_object then null;
end $$;

create table if not exists assessment_bookings (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  email           text not null,
  phone           text not null,
  age_group       age_group not null,
  preferred_slots jsonb not null,         -- array of ISO timestamps
  notes           text,
  status          booking_status not null default 'pending',
  approved_slot   timestamptz,
  room            text,
  admin_notes     text,
  notified_email  boolean not null default false,
  notified_wapp   boolean not null default false,
  locale          text not null check (locale in ('ar','en')),
  created_at      timestamptz not null default now(),
  decided_at      timestamptz,
  decided_by      uuid                    -- admin user id
);

-- =========================================================================
-- 5. Quiz CMS (admin-editable)
-- =========================================================================
create table if not exists quiz_levels (
  code        text primary key,           -- A1, A2, B1, B2, C1, C2
  label_en    text not null,
  label_ar    text not null,
  min_score   int not null,               -- score >= min_score → this level
  description_en text,
  description_ar text,
  sort_order  int not null default 0
);

create table if not exists quiz_questions (
  id          uuid primary key default uuid_generate_v4(),
  prompt_en   text not null,
  prompt_ar   text not null,
  options     jsonb not null,             -- [{en, ar}] indexed
  correct_idx int not null,
  difficulty  int not null default 1,     -- 1-3
  skill_tag   text,                       -- grammar | vocab | reading | listening
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists quiz_recommendations (
  id          uuid primary key default uuid_generate_v4(),
  level_code  text not null references quiz_levels(code) on delete cascade,
  age_group   age_group,
  books       jsonb not null default '[]', -- ["Headway Elementary", ...]
  course_slug text,                        -- maps to a course id on landing
  notes_en    text,
  notes_ar    text
);

create table if not exists quiz_attempts (
  id              uuid primary key default uuid_generate_v4(),
  email           text,
  name            text,
  age_group       age_group,
  level           text not null,
  score           int not null,
  answers         jsonb not null,
  locale          text not null,
  created_at      timestamptz not null default now()
);

-- =========================================================================
-- 6. Admin users (allow-list — Supabase Auth provides accounts)
-- =========================================================================
create table if not exists admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'admin',
  created_at  timestamptz not null default now()
);

-- =========================================================================
-- RLS POLICIES
-- =========================================================================
alter table contact_submissions   enable row level security;
alter table announcements         enable row level security;
alter table schedule_entries      enable row level security;
alter table assessment_bookings   enable row level security;
alter table quiz_levels           enable row level security;
alter table quiz_questions        enable row level security;
alter table quiz_recommendations  enable row level security;
alter table quiz_attempts         enable row level security;
alter table admin_users           enable row level security;

-- Helper: is_admin()
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from admin_users where id = auth.uid())
$$ language sql security definer stable;

-- Contact: anon insert
drop policy if exists anon_insert on contact_submissions;
create policy anon_insert on contact_submissions for insert to anon with check (true);
drop policy if exists admin_read_contact on contact_submissions;
create policy admin_read_contact on contact_submissions for select to authenticated using (is_admin());

-- Announcements: public read of active rows; admin full
drop policy if exists public_read_active on announcements;
create policy public_read_active on announcements for select to anon, authenticated
  using (published = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
drop policy if exists admin_all_ann on announcements;
create policy admin_all_ann on announcements for all to authenticated using (is_admin()) with check (is_admin());

-- Schedule: public read published; admin full
drop policy if exists public_read_schedule on schedule_entries;
create policy public_read_schedule on schedule_entries for select to anon, authenticated using (published = true);
drop policy if exists admin_all_schedule on schedule_entries;
create policy admin_all_schedule on schedule_entries for all to authenticated using (is_admin()) with check (is_admin());

-- Bookings: anon insert; admin read/update
drop policy if exists anon_insert_book on assessment_bookings;
create policy anon_insert_book on assessment_bookings for insert to anon with check (true);
drop policy if exists admin_all_book on assessment_bookings;
create policy admin_all_book on assessment_bookings for all to authenticated using (is_admin()) with check (is_admin());

-- Quiz: public read questions/levels/recs (active); admin all
drop policy if exists public_read_levels on quiz_levels;
create policy public_read_levels on quiz_levels for select to anon, authenticated using (true);
drop policy if exists admin_all_levels on quiz_levels;
create policy admin_all_levels on quiz_levels for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists public_read_q on quiz_questions;
create policy public_read_q on quiz_questions for select to anon, authenticated using (active = true);
drop policy if exists admin_all_q on quiz_questions;
create policy admin_all_q on quiz_questions for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists public_read_recs on quiz_recommendations;
create policy public_read_recs on quiz_recommendations for select to anon, authenticated using (true);
drop policy if exists admin_all_recs on quiz_recommendations;
create policy admin_all_recs on quiz_recommendations for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists anon_insert_attempt on quiz_attempts;
create policy anon_insert_attempt on quiz_attempts for insert to anon with check (true);
drop policy if exists admin_read_attempt on quiz_attempts;
create policy admin_read_attempt on quiz_attempts for select to authenticated using (is_admin());

-- Admin users: admin reads own
drop policy if exists admin_self on admin_users;
create policy admin_self on admin_users for select to authenticated using (auth.uid() = id);

-- =========================================================================
-- Seed: CEFR levels
-- =========================================================================
insert into quiz_levels (code, label_en, label_ar, min_score, description_en, description_ar, sort_order) values
  ('A1', 'Beginner',         'مبتدئ',          0,  'Basic phrases. Introduces self.',                'عبارات أساسية. التعريف بالنفس.', 1),
  ('A2', 'Elementary',       'تأسيسي',         4,  'Familiar topics. Simple direct exchange.',       'مواضيع مألوفة. تبادل مباشر بسيط.', 2),
  ('B1', 'Intermediate',     'متوسط',          8,  'Main points of clear input. Travel situations.', 'النقاط الرئيسية لمحتوى واضح. مواقف سفر.', 3),
  ('B2', 'Upper-Intermediate','فوق المتوسط',   12, 'Complex texts. Fluent interaction.',             'نصوص معقدة. تفاعل سلس.', 4),
  ('C1', 'Advanced',         'متقدم',          15, 'Long, demanding texts. Implicit meaning.',       'نصوص طويلة وصعبة. المعنى الضمني.', 5),
  ('C2', 'Mastery',           'متمكّن',        18, 'Effortless. Nuance and idiom.',                  'بلا جهد. الفروق الدقيقة والمصطلحات.', 6)
on conflict (code) do update set
  label_en=excluded.label_en, label_ar=excluded.label_ar,
  min_score=excluded.min_score, description_en=excluded.description_en, description_ar=excluded.description_ar;

-- =========================================================================
-- Seed: starter recommendations (admin can edit/extend)
-- =========================================================================
insert into quiz_recommendations (level_code, books, course_slug, notes_en, notes_ar) values
  ('A1', '["New Headway Beginner", "English File Beginner"]'::jsonb, 'adults',  'Start with foundations.', 'ابدأ بالأساسيات.'),
  ('A2', '["New Headway Elementary", "Solutions Elementary"]'::jsonb, 'adults', 'Build core vocabulary.', 'بناء المفردات الأساسية.'),
  ('B1', '["New Headway Pre-Intermediate", "English File Intermediate"]'::jsonb, 'adults', 'Bridge to fluency.', 'الجسر نحو الطلاقة.'),
  ('B2', '["Cambridge IELTS 18", "Objective First"]'::jsonb, 'exams',  'IELTS / FCE-ready.', 'جاهز لـ IELTS / FCE.'),
  ('C1', '["Objective Advanced", "Cambridge IELTS 19"]'::jsonb, 'exams', 'Polish for high scores.', 'تلميع للحصول على درجات عالية.'),
  ('C2', '["Objective Proficiency", "Practical English Usage"]'::jsonb, 'business', 'Refine for professional excellence.', 'تطوير للتميّز المهني.')
on conflict do nothing;

-- =========================================================================
-- Seed: sample placement questions (admin can edit/add)
-- =========================================================================
insert into quiz_questions (prompt_en, prompt_ar, options, correct_idx, difficulty, skill_tag, sort_order) values
  ('I ___ from Latakia.', 'أنا ___ من اللاذقية.',
   '[{"en":"am","ar":"am"},{"en":"is","ar":"is"},{"en":"are","ar":"are"},{"en":"be","ar":"be"}]'::jsonb, 0, 1, 'grammar', 1),
  ('She ___ to the gym every Monday.', 'هي ___ إلى النادي كل اثنين.',
   '[{"en":"go","ar":"go"},{"en":"goes","ar":"goes"},{"en":"going","ar":"going"},{"en":"went","ar":"went"}]'::jsonb, 1, 1, 'grammar', 2),
  ('Choose the synonym of "happy".', 'اختر مرادف "happy".',
   '[{"en":"sad","ar":"sad"},{"en":"angry","ar":"angry"},{"en":"glad","ar":"glad"},{"en":"tired","ar":"tired"}]'::jsonb, 2, 1, 'vocab', 3),
  ('If I ___ more time, I would learn another language.', 'لو ___ وقتاً أكثر، سأتعلم لغة أخرى.',
   '[{"en":"have","ar":"have"},{"en":"had","ar":"had"},{"en":"will have","ar":"will have"},{"en":"having","ar":"having"}]'::jsonb, 1, 2, 'grammar', 4),
  ('The deadline has been ___ to next Friday.', 'تم ___ الموعد النهائي إلى الجمعة القادمة.',
   '[{"en":"extended","ar":"extended"},{"en":"extended out","ar":"extended out"},{"en":"extending","ar":"extending"},{"en":"extend","ar":"extend"}]'::jsonb, 0, 2, 'vocab', 5),
  ('Despite ___ tired, she finished the report.', 'رغم ___ متعبة، أنهت التقرير.',
   '[{"en":"being","ar":"being"},{"en":"to be","ar":"to be"},{"en":"is","ar":"is"},{"en":"was","ar":"was"}]'::jsonb, 0, 2, 'grammar', 6),
  ('His argument was ___ — he contradicted himself twice.', 'كانت حجته ___ — تناقض مع نفسه مرتين.',
   '[{"en":"coherent","ar":"coherent"},{"en":"incoherent","ar":"incoherent"},{"en":"persuasive","ar":"persuasive"},{"en":"eloquent","ar":"eloquent"}]'::jsonb, 1, 3, 'vocab', 7),
  ('Had the contract been signed earlier, we ___ this delay.', 'لو وُقّع العقد في وقت أبكر، ___ هذا التأخير.',
   '[{"en":"would avoid","ar":"would avoid"},{"en":"would have avoided","ar":"would have avoided"},{"en":"will avoid","ar":"will avoid"},{"en":"had avoided","ar":"had avoided"}]'::jsonb, 1, 3, 'grammar', 8),
  ('The novel''s ___ tone made the violence almost poetic.', 'النبرة ___ للرواية جعلت العنف شعرياً تقريباً.',
   '[{"en":"jarring","ar":"jarring"},{"en":"lyrical","ar":"lyrical"},{"en":"mundane","ar":"mundane"},{"en":"derivative","ar":"derivative"}]'::jsonb, 1, 3, 'vocab', 9),
  ('Choose the past tense of "bring".', 'اختر صيغة الماضي من "bring".',
   '[{"en":"brought","ar":"brought"},{"en":"brang","ar":"brang"},{"en":"bringed","ar":"bringed"},{"en":"brung","ar":"brung"}]'::jsonb, 0, 1, 'grammar', 10),
  ('I''ve been studying English ___ five years.', 'أدرس الإنجليزية ___ خمس سنوات.',
   '[{"en":"since","ar":"since"},{"en":"for","ar":"for"},{"en":"during","ar":"during"},{"en":"in","ar":"in"}]'::jsonb, 1, 2, 'grammar', 11),
  ('The CEO''s remarks were widely ___ by the press.', 'تصريحات الرئيس ___ على نطاق واسع من قبل الصحافة.',
   '[{"en":"praised","ar":"praised"},{"en":"appraised","ar":"appraised"},{"en":"raised","ar":"raised"},{"en":"phrased","ar":"phrased"}]'::jsonb, 0, 2, 'vocab', 12),
  ('Pick the most formal greeting:', 'اختر التحية الأكثر رسمية:',
   '[{"en":"Hey!","ar":"Hey!"},{"en":"Hi there","ar":"Hi there"},{"en":"Dear Sir/Madam","ar":"Dear Sir/Madam"},{"en":"What''s up","ar":"What''s up"}]'::jsonb, 2, 1, 'vocab', 13),
  ('She''d rather ___ alone than with a noisy crowd.', 'تفضّل ___ وحدها على البقاء مع جمهور صاخب.',
   '[{"en":"working","ar":"working"},{"en":"work","ar":"work"},{"en":"to work","ar":"to work"},{"en":"worked","ar":"worked"}]'::jsonb, 1, 3, 'grammar', 14),
  ('The opposite of "ambiguous" is:', 'عكس "ambiguous" هو:',
   '[{"en":"obscure","ar":"obscure"},{"en":"vague","ar":"vague"},{"en":"clear","ar":"clear"},{"en":"hidden","ar":"hidden"}]'::jsonb, 2, 2, 'vocab', 15)
on conflict do nothing;
