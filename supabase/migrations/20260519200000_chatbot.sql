-- Chatbot knowledge base — admin-editable Q&A snippets the chatbot retrieves
-- to ground its answers. Stored as plain text with a topic + simple search tsv.

create table if not exists chatbot_knowledge (
  id          uuid primary key default uuid_generate_v4(),
  topic       text not null,
  question    text not null,
  answer      text not null,
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists chatbot_knowledge_active_idx on chatbot_knowledge (active, sort_order);

alter table chatbot_knowledge enable row level security;

drop policy if exists public_read_chatbot on chatbot_knowledge;
create policy public_read_chatbot on chatbot_knowledge
  for select to anon, authenticated
  using (active = true);

drop policy if exists admin_all_chatbot on chatbot_knowledge;
create policy admin_all_chatbot on chatbot_knowledge
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- Seed with a few starter entries so the bot has something to ground on
insert into chatbot_knowledge (topic, question, answer, sort_order) values
  ('Pricing',    'How much do courses cost?',          'Course prices vary by program and group size. Please share your contact and we''ll send our full price list — or call us at +963 17 2566699.', 1),
  ('Schedule',   'When do new sessions start?',        'New sessions start every month. The exact schedule is on the Schedule section of our homepage, or contact us to reserve a spot for the next batch.', 2),
  ('Levels',     'How do you determine my level?',     'You can take our free AI Assessment on the homepage (25 multiple-choice + read-aloud + writing) — you''ll get a CEFR level and we can place you in the right class.', 3),
  ('Online',     'Do you offer online classes?',       'Yes — live online classes with the same instructors and curriculum as in-center. Great for students abroad and busy professionals.', 4),
  ('Location',   'Where are you located?',             'We''re in Latakia, Syria — Omar Ibn Al-Khattab Street (Al-Quwatli area). We''re open Saturday to Thursday, 9am to 9pm.', 5),
  ('Contact',    'How can I contact you?',             'Phone: +963 17 2566699 or +963 966 466699. Email: info@railanguagecenter.com. Or use the contact form on this site.', 6),
  ('Languages',  'What languages do you teach?',       'English (our specialty), French, German, Russian, Spanish, Turkish, and Arabic for foreigners. Tap "Browse all languages & courses" on the homepage for the full catalogue.', 7),
  ('Booking',    'How do I book an assessment?',       'Use the "Book a personal assessment" form on the homepage — pick three preferred slots and we''ll confirm one within 24 business hours by email and WhatsApp.', 8),
  ('Kids',       'Do you teach kids?',                 'Yes — our Kids & Teens program is for ages 7 to 17, with separate age cohorts and a curriculum built around games, stories, and group activities.', 9),
  ('Exam Prep',  'Do you prepare for IELTS / TOEFL?',  'Yes — intensive TOEFL & IELTS prep with weekly mock exams, time-management training, and specialised strategies for each section. Many of our students score 7.0+ IELTS.', 10);
