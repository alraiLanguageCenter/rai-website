-- =========================================================================
-- Phase 2: Teacher + Student portals — schema, roles, RLS
-- =========================================================================

-- Profiles: one row per auth.users user, with a role
do $$ begin
  create type user_role as enum ('admin','teacher','student');
exception when duplicate_object then null;
end $$;

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null default 'student',
  display_name text,
  email        text,
  phone        text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles(role);

-- Helper functions
create or replace function is_teacher() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('teacher','admin'))
$$ language sql security definer stable;

create or replace function is_student() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'student')
$$ language sql security definer stable;

create or replace function current_role_name() returns text as $$
  select role::text from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Make sure existing admin_users entries are mirrored as 'admin' profiles
insert into profiles (id, role, email)
select id, 'admin'::user_role, email from admin_users
on conflict (id) do update set role = 'admin';

-- =========================================================================
-- Classes
-- =========================================================================
do $$ begin
  create type class_status as enum ('upcoming','ongoing','completed','cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists classes (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text,
  level           text,        -- A1..C2 or 'mixed'
  kind            text not null default 'group',  -- 'group' | 'private'
  teacher_id      uuid references profiles(id) on delete set null,
  schedule_entry_id uuid references schedule_entries(id) on delete set null,
  capacity        int default 12,
  status          class_status not null default 'upcoming',
  created_at      timestamptz not null default now()
);

create index if not exists classes_teacher_idx on classes(teacher_id);

-- Enrollments
create table if not exists enrollments (
  id         uuid primary key default uuid_generate_v4(),
  class_id   uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  unique (class_id, student_id)
);

create index if not exists enrollments_student_idx on enrollments(student_id);
create index if not exists enrollments_class_idx on enrollments(class_id);

-- =========================================================================
-- Lesson materials (PDFs, links, documents)
-- =========================================================================
do $$ begin
  create type material_kind as enum ('pdf','document','link','video','audio');
exception when duplicate_object then null;
end $$;

create table if not exists lesson_materials (
  id           uuid primary key default uuid_generate_v4(),
  class_id     uuid references classes(id) on delete cascade,
  teacher_id   uuid references profiles(id) on delete set null,
  title        text not null,
  description  text,
  kind         material_kind not null default 'pdf',
  url          text not null,             -- public Storage URL or external link
  /** when class_id is null and visibility is 'all' it is visible to every student */
  visibility   text not null default 'class',  -- 'class' | 'all' | 'private'
  visible_to   uuid[],                    -- when 'private', list of student profile IDs
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists materials_class_idx on lesson_materials(class_id);
create index if not exists materials_visibility_idx on lesson_materials(visibility);

-- =========================================================================
-- Exams (MCQ) + submissions
-- =========================================================================
do $$ begin
  create type exam_status as enum ('draft','open','closed');
exception when duplicate_object then null;
end $$;

create table if not exists exams (
  id            uuid primary key default uuid_generate_v4(),
  class_id      uuid references classes(id) on delete set null,
  teacher_id    uuid references profiles(id) on delete set null,
  title         text not null,
  description   text,
  status        exam_status not null default 'draft',
  duration_min  int default 30,
  due_at        timestamptz,
  total_points  int default 100,
  created_at    timestamptz not null default now()
);

create index if not exists exams_class_idx on exams(class_id);

create table if not exists exam_questions (
  id           uuid primary key default uuid_generate_v4(),
  exam_id      uuid not null references exams(id) on delete cascade,
  prompt       text not null,
  options      jsonb not null,     -- ["A","B","C","D"]
  correct_idx  int not null,
  points       int not null default 1,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists exam_questions_exam_idx on exam_questions(exam_id);

create table if not exists exam_submissions (
  id           uuid primary key default uuid_generate_v4(),
  exam_id      uuid not null references exams(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade,
  answers      jsonb not null,     -- [{questionId, selectedIdx}]
  score        int not null,
  max_score    int not null,
  submitted_at timestamptz not null default now(),
  teacher_notes text,
  unique (exam_id, student_id)
);

create index if not exists exam_submissions_student_idx on exam_submissions(student_id);
create index if not exists exam_submissions_exam_idx on exam_submissions(exam_id);

-- =========================================================================
-- Complaints
-- =========================================================================
do $$ begin
  create type complaint_status as enum ('open','reviewing','resolved','dismissed');
exception when duplicate_object then null;
end $$;

create table if not exists complaints (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references profiles(id) on delete set null,
  subject     text not null,
  body        text not null,
  status      complaint_status not null default 'open',
  admin_response text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- =========================================================================
-- Session requests (extra session / private session)
-- =========================================================================
do $$ begin
  create type session_kind as enum ('extra','private','makeup');
exception when duplicate_object then null;
end $$;

create table if not exists session_requests (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid references profiles(id) on delete set null,
  kind            session_kind not null default 'extra',
  preferred_slots jsonb not null,        -- array of ISO timestamps
  notes           text,
  status          booking_status not null default 'pending',
  approved_slot   timestamptz,
  admin_notes     text,
  created_at      timestamptz not null default now(),
  decided_at      timestamptz
);

-- =========================================================================
-- AI Tutor chat (private student conversations with the tutor)
-- =========================================================================
create table if not exists tutor_conversations (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references profiles(id) on delete cascade,
  title       text not null default 'New conversation',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists tutor_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references tutor_conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists tutor_msgs_conv_idx on tutor_messages(conversation_id, created_at);

-- =========================================================================
-- Book library (interactive PDF readers)
-- =========================================================================
create table if not exists book_library (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  author      text,
  description text,
  language    text not null default 'en',
  level       text,             -- A1..C2
  cover_url   text,
  pdf_url     text not null,
  is_public   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- =========================================================================
-- RLS
-- =========================================================================
alter table profiles            enable row level security;
alter table classes             enable row level security;
alter table enrollments         enable row level security;
alter table lesson_materials    enable row level security;
alter table exams               enable row level security;
alter table exam_questions      enable row level security;
alter table exam_submissions    enable row level security;
alter table complaints          enable row level security;
alter table session_requests    enable row level security;
alter table tutor_conversations enable row level security;
alter table tutor_messages      enable row level security;
alter table book_library        enable row level security;

-- Profiles: a user can read & update their own profile; admins read all
drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles for select to authenticated using (auth.uid() = id or is_admin());
drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles for all to authenticated using (is_admin()) with check (is_admin());

-- Classes: admin all; teacher reads own; student reads enrolled
drop policy if exists classes_admin_all on classes;
create policy classes_admin_all on classes for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists classes_teacher_own on classes;
create policy classes_teacher_own on classes for select to authenticated using (teacher_id = auth.uid() or is_admin());
drop policy if exists classes_student_enrolled on classes;
create policy classes_student_enrolled on classes for select to authenticated using (
  exists (select 1 from enrollments e where e.class_id = classes.id and e.student_id = auth.uid())
);

-- Enrollments
drop policy if exists enrollments_admin on enrollments;
create policy enrollments_admin on enrollments for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists enrollments_student_self on enrollments;
create policy enrollments_student_self on enrollments for select to authenticated using (student_id = auth.uid());
drop policy if exists enrollments_teacher on enrollments;
create policy enrollments_teacher on enrollments for select to authenticated using (
  exists (select 1 from classes c where c.id = enrollments.class_id and c.teacher_id = auth.uid())
);

-- Materials
drop policy if exists materials_admin on lesson_materials;
create policy materials_admin on lesson_materials for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists materials_teacher_own on lesson_materials;
create policy materials_teacher_own on lesson_materials for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists materials_student_read on lesson_materials;
create policy materials_student_read on lesson_materials for select to authenticated using (
  visibility = 'all'
  or (visibility = 'private' and auth.uid() = any(visible_to))
  or (visibility = 'class' and exists (
    select 1 from enrollments e where e.class_id = lesson_materials.class_id and e.student_id = auth.uid()
  ))
);

-- Exams
drop policy if exists exams_admin on exams;
create policy exams_admin on exams for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists exams_teacher_own on exams;
create policy exams_teacher_own on exams for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists exams_student_read on exams;
create policy exams_student_read on exams for select to authenticated using (
  status = 'open' and (
    class_id is null or exists (
      select 1 from enrollments e where e.class_id = exams.class_id and e.student_id = auth.uid()
    )
  )
);

-- Exam questions
drop policy if exists eq_admin on exam_questions;
create policy eq_admin on exam_questions for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists eq_teacher on exam_questions;
create policy eq_teacher on exam_questions for all to authenticated using (
  exists (select 1 from exams e where e.id = exam_questions.exam_id and e.teacher_id = auth.uid())
) with check (
  exists (select 1 from exams e where e.id = exam_questions.exam_id and e.teacher_id = auth.uid())
);
drop policy if exists eq_student_read on exam_questions;
create policy eq_student_read on exam_questions for select to authenticated using (
  exists (
    select 1 from exams e
    where e.id = exam_questions.exam_id
      and e.status = 'open'
      and (e.class_id is null or exists (
        select 1 from enrollments en where en.class_id = e.class_id and en.student_id = auth.uid()
      ))
  )
);

-- Submissions
drop policy if exists subs_admin on exam_submissions;
create policy subs_admin on exam_submissions for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists subs_student_self on exam_submissions;
create policy subs_student_self on exam_submissions for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists subs_teacher on exam_submissions;
create policy subs_teacher on exam_submissions for select to authenticated using (
  exists (select 1 from exams e where e.id = exam_submissions.exam_id and e.teacher_id = auth.uid())
);

-- Complaints
drop policy if exists complaints_admin on complaints;
create policy complaints_admin on complaints for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists complaints_student_self on complaints;
create policy complaints_student_self on complaints for select to authenticated using (student_id = auth.uid());
drop policy if exists complaints_student_insert on complaints;
create policy complaints_student_insert on complaints for insert to authenticated with check (student_id = auth.uid());

-- Session requests
drop policy if exists sess_admin on session_requests;
create policy sess_admin on session_requests for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists sess_student_self on session_requests;
create policy sess_student_self on session_requests for select to authenticated using (student_id = auth.uid());
drop policy if exists sess_student_insert on session_requests;
create policy sess_student_insert on session_requests for insert to authenticated with check (student_id = auth.uid());

-- Tutor convo
drop policy if exists tc_self on tutor_conversations;
create policy tc_self on tutor_conversations for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists tm_self on tutor_messages;
create policy tm_self on tutor_messages for all to authenticated using (
  exists (select 1 from tutor_conversations c where c.id = tutor_messages.conversation_id and c.student_id = auth.uid())
) with check (
  exists (select 1 from tutor_conversations c where c.id = tutor_messages.conversation_id and c.student_id = auth.uid())
);

-- Library: public read; admin full
drop policy if exists books_public on book_library;
create policy books_public on book_library for select to anon, authenticated using (is_public = true);
drop policy if exists books_admin on book_library;
create policy books_admin on book_library for all to authenticated using (is_admin()) with check (is_admin());

-- =========================================================================
-- Seed a starter book so /student/library has something to show
-- =========================================================================
insert into book_library (title, author, description, language, level, cover_url, pdf_url, is_public, sort_order) values
  ('Common English Idioms — A Pocket Guide', 'Rai Language Center', 'A short illustrated reference for everyday idioms with example dialogues.', 'en', 'B1', null, '/sample-books/idioms.pdf', true, 1),
  ('IELTS Speaking — 30 Practice Topics',    'Rai Language Center', 'Practice prompts with model answers and useful phrases.',               'en', 'B2', null, '/sample-books/ielts-speaking.pdf', true, 2),
  ('Business English — Email Templates',      'Rai Language Center', '20 ready-to-adapt email templates for the modern workplace.',             'en', 'B2', null, '/sample-books/business-emails.pdf', true, 3)
on conflict do nothing;
