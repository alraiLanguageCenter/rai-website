-- =====================================================================
-- Registration system, auto-assigned student numbers, and system settings
-- =====================================================================
-- Adds:
--   * student_applications  — public applications submitted via /register
--   * student_number_seq    — sequence used to assign permanent student IDs
--   * profiles.student_number column (unique)
--   * system_settings       — key/value config (chatbot model, api keys, etc.)
-- Plus the RLS, trigger that assigns the next student_number on approval, and
-- seed defaults for system_settings.

-- 1) Student number column on profiles (unique, nullable until assigned)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_number INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_number_unique
  ON public.profiles(student_number)
  WHERE student_number IS NOT NULL;

-- 2) Sequence used to mint new student numbers. Starts at 10001 so existing
--    records (if any) can be back-filled with lower numbers if desired.
CREATE SEQUENCE IF NOT EXISTS public.student_number_seq START WITH 10001;

-- 3) Applications table
CREATE TABLE IF NOT EXISTS public.student_applications (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name                TEXT NOT NULL,
  email                    TEXT NOT NULL,
  phone                    TEXT NOT NULL,
  gender                   TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  date_of_birth            DATE,
  age_group                TEXT CHECK (age_group IN ('child','teen','adult','professional')),
  location                 TEXT,
  native_language          TEXT,
  target_language          TEXT,
  target_level             TEXT,
  goals                    TEXT,
  source                   TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected','waitlisted')),
  assigned_student_number  INTEGER UNIQUE,
  decided_by               UUID REFERENCES public.profiles(id),
  decision_notes           TEXT,
  applied_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at               TIMESTAMPTZ,
  locale                   TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('ar','en')),
  user_agent               TEXT,
  notify_email_sent        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_student_applications_status_applied_at
  ON public.student_applications(status, applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_applications_email
  ON public.student_applications(email);

-- 4) Auto-assign student_number when status flips to 'approved'.
--    Idempotent: if a number was already assigned (re-approval) it's kept.
CREATE OR REPLACE FUNCTION public.assign_student_number_on_approve()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'approved'
     AND (OLD.status IS DISTINCT FROM 'approved')
     AND NEW.assigned_student_number IS NULL THEN
    NEW.assigned_student_number := nextval('public.student_number_seq');
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('approved','rejected','waitlisted') THEN
    NEW.decided_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_student_number ON public.student_applications;
CREATE TRIGGER trg_assign_student_number
  BEFORE UPDATE ON public.student_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_student_number_on_approve();

-- 5) System settings: key/value, JSONB values, secret flag for masked display.
CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB,
  description TEXT,
  is_secret   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES public.profiles(id)
);

-- Seed default rows so the settings page has something to show.
INSERT INTO public.system_settings (key, value, description, is_secret) VALUES
  ('chatbot_model',         '"deepseek-chat"',                   'AI model used by Nouha for the public chatbot, the student AI tutor, and the AI placement-test grader.', false),
  ('chatbot_temperature',   '0.6',                               'AI temperature (0–1). Higher = more creative, lower = more deterministic.', false),
  ('chatbot_max_tokens',    '350',                               'Maximum tokens per chatbot reply.', false),
  ('assessment_model',      '"deepseek-chat"',                   'Model used to grade the AI placement test and produce the report.', false),
  ('deepseek_api_key',      '""',                                'DeepSeek API key. Leave blank to fall back to the DEEPSEEK_API_KEY environment variable.', true),
  ('resend_api_key',        '""',                                'Resend (transactional email) API key. Leave blank to fall back to RESEND_API_KEY env var.', true),
  ('admin_inbox',           '"railanguagecenter@gmail.com"',     'Inbox that receives booking, registration, and assessment notifications.', false),
  ('whatsapp_phone',        '"+963966466699"',                   'WhatsApp number used for direct student outreach.', false),
  ('registration_open',     'true',                              'Whether the public /register form accepts new applications.', false),
  ('site_url',              '"https://railanguagecenter.com"',   'Canonical site URL used in emails and QR codes.', false)
ON CONFLICT (key) DO NOTHING;

-- 6) RLS
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings      ENABLE ROW LEVEL SECURITY;

-- Anyone (even unauthenticated) can submit a new application via the public form.
DROP POLICY IF EXISTS "anon insert applications" ON public.student_applications;
CREATE POLICY "anon insert applications"
  ON public.student_applications FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can read / update.
DROP POLICY IF EXISTS "admin select applications" ON public.student_applications;
CREATE POLICY "admin select applications"
  ON public.student_applications FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin update applications" ON public.student_applications;
CREATE POLICY "admin update applications"
  ON public.student_applications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin delete applications" ON public.student_applications;
CREATE POLICY "admin delete applications"
  ON public.student_applications FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Settings: admins manage. Non-admin authenticated users can read non-secret rows
-- so the public chatbot can pick up the model name; the API never returns secret rows.
DROP POLICY IF EXISTS "admin all settings" ON public.system_settings;
CREATE POLICY "admin all settings"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
