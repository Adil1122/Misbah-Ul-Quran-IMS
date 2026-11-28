-- =============================================================================
-- Misbah-ul-Quran IMS — Migration 20261127_05_remaining_entities
-- -----------------------------------------------------------------------------
-- Purpose : Give every remaining app feature a Supabase home so nothing is
--           stored only in the browser or in the server's local JSON file.
--   New tables : parent_profiles, teacher_salary_records, announcements,
--                notification_logs, teaching_materials
--   Extended   : expense_logs, academic_progress, exam_results,
--                event_announcements, documents, students
--   Storage    : private bucket "misbah-documents" for uploaded files
--   Security   : RLS + least-privilege grants on every new/extended table
-- Safety  : Additive. No existing row is changed or deleted. One transaction.
-- Rollback: 20261127_05_remaining_entities_rollback.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Parents (profile for users with role PARENT; children = students.parent_id)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parent_profiles (
  id          text PRIMARY KEY,
  user_id     text NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  campus_id   text NOT NULL REFERENCES public.campuses(id) ON DELETE RESTRICT,
  phone       text,
  cnic_or_id  text,
  occupation  text,
  address     text,
  created_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS parent_profiles_campus_id_idx ON public.parent_profiles (campus_id);

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS portal_access_active boolean NOT NULL DEFAULT true;

-- -----------------------------------------------------------------------------
-- 2. Finance: teacher salaries + expense details
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_salary_records (
  id             text PRIMARY KEY,
  teacher_id     text NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  campus_id      text NOT NULL REFERENCES public.campuses(id) ON DELETE RESTRICT,
  month_year     text NOT NULL,
  pay_period     text,
  basic_salary   numeric(12,2) NOT NULL DEFAULT 0 CHECK (basic_salary >= 0),
  allowances     numeric(12,2) NOT NULL DEFAULT 0 CHECK (allowances >= 0),
  deductions     numeric(12,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net_salary     numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL CHECK (upper(currency) IN ('PKR', 'GBP')),
  payment_status text NOT NULL DEFAULT 'PENDING' CHECK (upper(payment_status) IN ('PAID', 'PENDING')),
  payment_date   date,
  payment_method text NOT NULL DEFAULT 'CASH',
  audit_id       text,
  created_at     timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at     timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (teacher_id, month_year)
);
CREATE INDEX IF NOT EXISTS teacher_salary_records_campus_idx ON public.teacher_salary_records (campus_id, month_year);

ALTER TABLE public.expense_logs
  ADD COLUMN IF NOT EXISTS created_by text REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expense_logs_category_check') THEN
    ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_category_check
      CHECK (upper(category) IN ('UTILITIES','MAINTENANCE','EVENTS','SALARIES','EDUCATIONAL_MATERIALS','FACILITIES'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expense_logs_currency_check') THEN
    ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_currency_check CHECK (upper(currency) IN ('PKR','GBP'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expense_logs_amount_check') THEN
    ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_amount_check CHECK (amount >= 0);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS expense_logs_campus_date_idx ON public.expense_logs (campus_id, date DESC);

-- -----------------------------------------------------------------------------
-- 3. Academics: Quran progress + exam results
-- -----------------------------------------------------------------------------
ALTER TABLE public.academic_progress
  ADD COLUMN IF NOT EXISTS class_id   text REFERENCES public.classes(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS subject    text,
  ADD COLUMN IF NOT EXISTS score      numeric(6,2),
  ADD COLUMN IF NOT EXISTS max_score  numeric(6,2),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());
CREATE INDEX IF NOT EXISTS academic_progress_student_date_idx ON public.academic_progress (student_id, date DESC);
CREATE INDEX IF NOT EXISTS academic_progress_class_idx ON public.academic_progress (class_id);

ALTER TABLE public.exam_results
  ADD COLUMN IF NOT EXISTS exam_title  text,
  ADD COLUMN IF NOT EXISTS audit_notes text,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now());
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_results_marks_check') THEN
    ALTER TABLE public.exam_results ADD CONSTRAINT exam_results_marks_check
      CHECK (max_marks > 0 AND marks_obtained >= 0 AND marks_obtained <= max_marks);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS exam_results_student_idx ON public.exam_results (student_id);
CREATE INDEX IF NOT EXISTS exam_results_class_idx ON public.exam_results (class_id);

CREATE TABLE IF NOT EXISTS public.teaching_materials (
  id           text PRIMARY KEY,
  campus_id    text NOT NULL REFERENCES public.campuses(id) ON DELETE RESTRICT,
  class_id     text REFERENCES public.classes(id) ON DELETE SET NULL,
  teacher_id   text REFERENCES public.users(id) ON DELETE SET NULL,
  title        text NOT NULL,
  type         text NOT NULL CHECK (upper(type) IN ('VIDEO','PDF','AUDIO','SYLLABUS')),
  file_name    text NOT NULL,
  file_size_mb numeric(8,2) NOT NULL DEFAULT 0 CHECK (file_size_mb >= 0 AND file_size_mb <= 500),
  description  text,
  uploaded_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS teaching_materials_campus_idx ON public.teaching_materials (campus_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS teaching_materials_class_idx ON public.teaching_materials (class_id);

-- -----------------------------------------------------------------------------
-- 4. Communications: announcements, events, notification log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id           text PRIMARY KEY,
  campus_id    text REFERENCES public.campuses(id) ON DELETE RESTRICT,   -- NULL = all campuses
  title        text NOT NULL,
  content      text NOT NULL,
  priority     text NOT NULL DEFAULT 'NORMAL' CHECK (upper(priority) IN ('NORMAL','URGENT')),
  target_role  text NOT NULL DEFAULT 'ALL' CHECK (upper(target_role) IN ('ALL','TEACHERS','PARENTS','CAMPUS_ADMINS')),
  published_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by   text REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS announcements_campus_published_idx ON public.announcements (campus_id, published_at DESC);

ALTER TABLE public.event_announcements
  ADD COLUMN IF NOT EXISTS reminders_sent jsonb NOT NULL DEFAULT '{"email": false, "whatsapp": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT timezone('utc'::text, now());
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_announcements_class_id_fkey') THEN
    ALTER TABLE public.event_announcements ADD CONSTRAINT event_announcements_class_id_fkey
      FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_announcements_type_check') THEN
    ALTER TABLE public.event_announcements ADD CONSTRAINT event_announcements_type_check
      CHECK (upper(type) IN ('EXAM','COMPETITION','PARENT_MEETING','PAST_EVENT'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS event_announcements_campus_date_idx ON public.event_announcements (campus_id, date_time);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id             text PRIMARY KEY,
  campus_id      text REFERENCES public.campuses(id) ON DELETE RESTRICT,
  recipient_type text NOT NULL CHECK (upper(recipient_type) IN ('PARENTS','TEACHERS','ALL')),
  channel        text NOT NULL CHECK (upper(channel) IN ('EMAIL','WHATSAPP','BOTH')),
  title          text NOT NULL,
  message        text NOT NULL,
  status         text NOT NULL DEFAULT 'SENT' CHECK (upper(status) IN ('DELIVERED','SENT')),
  sent_by        text REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS notification_logs_campus_created_idx ON public.notification_logs (campus_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Documents: file metadata + private storage bucket
-- -----------------------------------------------------------------------------
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS category       text,
  ADD COLUMN IF NOT EXISTS mime_type      text,
  ADD COLUMN IF NOT EXISTS size_bytes     bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS uploaded_by    text REFERENCES public.users(id) ON DELETE SET NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'misbah-documents', 'misbah-documents', false, 26214400,  -- 25 MB
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']
)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
                               allowed_mime_types = EXCLUDED.allowed_mime_types;
-- No storage.objects policies are created on purpose: only the server (service role)
-- reads or writes files; the browser downloads through authenticated API routes.

-- -----------------------------------------------------------------------------
-- 6. updated_at triggers for the new tables
-- -----------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['parent_profiles','teacher_salary_records','teaching_materials','announcements',
                           'expense_logs','academic_progress','exam_results','event_announcements']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 7. Security: RLS + grants (default privileges were revoked in migration 02)
-- -----------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['parent_profiles','teacher_salary_records','teaching_materials','announcements','notification_logs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- parent_profiles
DROP POLICY IF EXISTS parent_profiles_read  ON public.parent_profiles;
DROP POLICY IF EXISTS parent_profiles_write ON public.parent_profiles;
CREATE POLICY parent_profiles_read  ON public.parent_profiles FOR SELECT TO authenticated
  USING (user_id = public.app_current_user_id() OR public.app_is_staff_for(campus_id));
CREATE POLICY parent_profiles_write ON public.parent_profiles FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- teacher_salary_records: admins of the campus, and the teacher for their own rows
DROP POLICY IF EXISTS salary_read  ON public.teacher_salary_records;
DROP POLICY IF EXISTS salary_write ON public.teacher_salary_records;
CREATE POLICY salary_read  ON public.teacher_salary_records FOR SELECT TO authenticated
  USING (public.app_is_admin_for(campus_id) OR teacher_id = public.app_current_user_id());
CREATE POLICY salary_write ON public.teacher_salary_records FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- teaching_materials: staff of the campus read; teachers upload for their campus
DROP POLICY IF EXISTS materials_read  ON public.teaching_materials;
DROP POLICY IF EXISTS materials_write ON public.teaching_materials;
CREATE POLICY materials_read  ON public.teaching_materials FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id));
CREATE POLICY materials_write ON public.teaching_materials FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id) OR teacher_id = public.app_current_user_id())
  WITH CHECK (public.app_is_staff_for(campus_id));

-- announcements: everyone signed in sees global + own-campus; admins publish
DROP POLICY IF EXISTS announcements_read  ON public.announcements;
DROP POLICY IF EXISTS announcements_write ON public.announcements;
CREATE POLICY announcements_read  ON public.announcements FOR SELECT TO authenticated
  USING (campus_id IS NULL OR public.app_has_campus(campus_id));
CREATE POLICY announcements_write ON public.announcements FOR ALL TO authenticated
  USING (CASE WHEN campus_id IS NULL THEN public.app_current_role() = 'SUPER_ADMIN' ELSE public.app_is_admin_for(campus_id) END)
  WITH CHECK (CASE WHEN campus_id IS NULL THEN public.app_current_role() = 'SUPER_ADMIN' ELSE public.app_is_admin_for(campus_id) END);

-- notification_logs: staff read, admins write
DROP POLICY IF EXISTS notifications_read  ON public.notification_logs;
DROP POLICY IF EXISTS notifications_write ON public.notification_logs;
CREATE POLICY notifications_read  ON public.notification_logs FOR SELECT TO authenticated
  USING (campus_id IS NULL OR public.app_is_staff_for(campus_id));
CREATE POLICY notifications_write ON public.notification_logs FOR ALL TO authenticated
  USING (CASE WHEN campus_id IS NULL THEN public.app_current_role() = 'SUPER_ADMIN' ELSE public.app_is_admin_for(campus_id) END)
  WITH CHECK (CASE WHEN campus_id IS NULL THEN public.app_current_role() = 'SUPER_ADMIN' ELSE public.app_is_admin_for(campus_id) END);

-- Widen the reserved tables now that the app uses them (were admin-only in 02).
DROP POLICY IF EXISTS events_admin   ON public.event_announcements;
DROP POLICY IF EXISTS exams_admin    ON public.exam_results;
DROP POLICY IF EXISTS progress_admin ON public.academic_progress;
DROP POLICY IF EXISTS events_read    ON public.event_announcements;
DROP POLICY IF EXISTS events_write   ON public.event_announcements;
DROP POLICY IF EXISTS exams_read     ON public.exam_results;
DROP POLICY IF EXISTS exams_write    ON public.exam_results;
DROP POLICY IF EXISTS progress_read  ON public.academic_progress;
DROP POLICY IF EXISTS progress_write ON public.academic_progress;

CREATE POLICY events_read    ON public.event_announcements FOR SELECT TO authenticated
  USING (public.app_has_campus(campus_id));
CREATE POLICY events_write   ON public.event_announcements FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

CREATE POLICY exams_read     ON public.exam_results FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id) OR public.app_is_parent_of(student_id));
CREATE POLICY exams_write    ON public.exam_results FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id) OR public.app_is_teacher_of_class(class_id))
  WITH CHECK (public.app_is_admin_for(campus_id) OR public.app_is_teacher_of_class(class_id));

CREATE POLICY progress_read  ON public.academic_progress FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id) OR public.app_is_parent_of(student_id));
CREATE POLICY progress_write ON public.academic_progress FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id) OR teacher_id = public.app_current_user_id())
  WITH CHECK (public.app_is_staff_for(campus_id));

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Result check
SELECT 'new tables' AS check_name,
       (SELECT string_agg(t, ', ' ORDER BY t) FROM unnest(ARRAY['parent_profiles','teacher_salary_records','teaching_materials','announcements','notification_logs']) t
         WHERE to_regclass('public.' || t) IS NOT NULL) AS value
UNION ALL SELECT 'tables without RLS', (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity)::text
UNION ALL SELECT 'anon write privileges', (SELECT count(*) FROM information_schema.role_table_grants
         WHERE grantee = 'anon' AND table_schema = 'public' AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE'))::text
UNION ALL SELECT 'documents bucket private', (SELECT (NOT public)::text FROM storage.buckets WHERE id = 'misbah-documents')
UNION ALL SELECT 'policies', (SELECT count(*) FROM pg_policies WHERE schemaname = 'public')::text;
