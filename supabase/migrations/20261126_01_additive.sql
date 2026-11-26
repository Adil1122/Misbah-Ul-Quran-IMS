-- =============================================================================
-- Misbah-ul-Quran IMS — Migration 20261126_01_additive
-- -----------------------------------------------------------------------------
-- Purpose : Additive, backward-compatible schema fixes. Adds missing columns,
--           the user_campus_access junction, the Supabase Auth link column,
--           standard updated_at triggers, CHECK constraints and indexes.
-- Safety  : Adds only. No table, column or row is dropped or deleted.
--           Two columns change type text -> jsonb (students contact details,
--           audit_logs.details); every existing value is valid JSON (verified
--           against the 2026-11-26 backup). If any value were not, the whole
--           transaction aborts and nothing changes.
-- Rollback: 20261126_01_additive_rollback.sql
-- Run in  : Supabase Dashboard -> SQL Editor -> paste the whole file -> Run.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Pre-checks: abort with a clear message if live data would violate the
--    constraints added below. (Nothing is modified if this raises.)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n FROM public.users
   WHERE email IS NOT NULL
   GROUP BY lower(email) HAVING count(*) > 1 LIMIT 1;
  IF n IS NOT NULL THEN RAISE EXCEPTION 'Pre-check failed: duplicate user emails (case-insensitive).'; END IF;

  SELECT count(*) INTO n FROM public.users
   WHERE username IS NOT NULL
   GROUP BY lower(username) HAVING count(*) > 1 LIMIT 1;
  IF n IS NOT NULL THEN RAISE EXCEPTION 'Pre-check failed: duplicate usernames (case-insensitive).'; END IF;

  SELECT count(*) INTO n FROM public.students
   WHERE lower(coalesce(gender, 'female')) NOT IN ('male', 'female');
  IF n > 0 THEN RAISE EXCEPTION 'Pre-check failed: % students with unexpected gender values.', n; END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Shared updated_at trigger function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Identity: link app users to Supabase Auth + campus access junction
-- -----------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_user_id_fkey') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_key ON public.users (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON public.users (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON public.users (lower(username)) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_campus_access (
  user_id    text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campus_id  text NOT NULL REFERENCES public.campuses(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, campus_id)
);
COMMENT ON TABLE public.user_campus_access IS
  'Which campuses each user may access. Source of truth for campus isolation (replaces users.allowed_campus_ids). campus_id = ''all'' means every campus.';

-- New table is private from the start: RLS on, no anon/authenticated grants.
ALTER TABLE public.user_campus_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_campus_access FROM anon, authenticated;

-- Backfill from users.allowed_campus_ids (jsonb array) plus active_campus_id.
INSERT INTO public.user_campus_access (user_id, campus_id)
SELECT DISTINCT u.id, c.id
FROM public.users u
CROSS JOIN LATERAL (
  SELECT jsonb_array_elements_text(
           CASE WHEN jsonb_typeof(u.allowed_campus_ids) = 'array' THEN u.allowed_campus_ids ELSE '[]'::jsonb END
         ) AS campus_id
  UNION
  SELECT u.active_campus_id WHERE u.active_campus_id IS NOT NULL
) a
JOIN public.campuses c ON c.id = a.campus_id
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Students: fields the UI captures but the DB could not store
-- -----------------------------------------------------------------------------
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS blood_group     text,
  ADD COLUMN IF NOT EXISTS medical_notes   text,
  ADD COLUMN IF NOT EXISTS quran_milestone text,
  ADD COLUMN IF NOT EXISTS archived_at     timestamptz;

-- Contact details were JSON stored as text -> real jsonb.
ALTER TABLE public.students
  ALTER COLUMN primary_contact_details TYPE jsonb
    USING CASE WHEN primary_contact_details IS NULL OR btrim(primary_contact_details) = '' THEN NULL
               ELSE primary_contact_details::jsonb END,
  ALTER COLUMN secondary_contact_details TYPE jsonb
    USING CASE WHEN secondary_contact_details IS NULL OR btrim(secondary_contact_details) = '' THEN NULL
               ELSE secondary_contact_details::jsonb END;

-- -----------------------------------------------------------------------------
-- 4. Classes: fields the UI captures but the DB could not store
-- -----------------------------------------------------------------------------
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS grade_level   text,
  ADD COLUMN IF NOT EXISTS room          text,
  ADD COLUMN IF NOT EXISTS schedule_time text;

-- -----------------------------------------------------------------------------
-- 5. Finance: real FK to the student an invoice belongs to
-- -----------------------------------------------------------------------------
ALTER TABLE public.payment_invoices
  ADD COLUMN IF NOT EXISTS student_id text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_invoices_student_id_fkey') THEN
    ALTER TABLE public.payment_invoices
      ADD CONSTRAINT payment_invoices_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;
  END IF;
END $$;

UPDATE public.payment_invoices p
   SET student_id = p.reference_id
 WHERE p.student_id IS NULL
   AND p.reference_id IS NOT NULL
   AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = p.reference_id);

-- -----------------------------------------------------------------------------
-- 6. Audit log: details is JSON -> jsonb; add updated_at-free append-only shape
-- -----------------------------------------------------------------------------
ALTER TABLE public.audit_logs
  ALTER COLUMN details TYPE jsonb
    USING CASE
            WHEN details IS NULL OR btrim(details) = '' THEN NULL
            WHEN left(btrim(details), 1) IN ('{', '[') THEN details::jsonb
            ELSE jsonb_build_object('message', details)
          END;

-- -----------------------------------------------------------------------------
-- 7. Medical log: columns the code expects (table is renamed in migration 03)
-- -----------------------------------------------------------------------------
ALTER TABLE public.medical_logs
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'SUBMITTED',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

-- -----------------------------------------------------------------------------
-- 8. CHECK constraints (case-insensitive so existing rows and code stay valid)
--    Added NOT VALID, then VALIDATEd, so a violation reports clearly.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('users',               'users_role_check',                  $c$CHECK (upper(role) IN ('SUPER_ADMIN','CAMPUS_ADMIN','TEACHER','STUDENT','PARENT'))$c$),
    ('students',            'students_gender_check',             $c$CHECK (gender IS NULL OR lower(gender) IN ('male','female'))$c$),
    ('students',            'students_status_check',             $c$CHECK (status IS NULL OR lower(status) IN ('active','inactive','archived'))$c$),
    ('students',            'students_approval_status_check',    $c$CHECK (approval_status IS NULL OR upper(approval_status) IN ('PENDING_APPROVAL','APPROVED','REJECTED','ACTION_REQUIRED'))$c$),
    ('students',            'students_fees_nonnegative_check',   $c$CHECK (coalesce(admission_fee_amount,0) >= 0 AND coalesce(monthly_fee_amount,0) >= 0)$c$),
    ('students',            'students_fee_due_day_check',        $c$CHECK (fee_due_day IS NULL OR fee_due_day BETWEEN 1 AND 31)$c$),
    ('teacher_attendances', 'teacher_attendances_status_check',  $c$CHECK (upper(status) IN ('PRESENT','ABSENT','LATE','LEAVE'))$c$),
    ('student_attendances', 'student_attendances_status_check',  $c$CHECK (upper(status) IN ('PRESENT','ABSENT','LATE','EXCUSED'))$c$),
    ('payment_invoices',    'payment_invoices_status_check',     $c$CHECK (payment_status IS NULL OR lower(payment_status) IN ('unpaid','paid','partial','pending','overdue','cancelled'))$c$),
    ('payment_invoices',    'payment_invoices_currency_check',   $c$CHECK (upper(currency) IN ('PKR','GBP'))$c$),
    ('payment_invoices',    'payment_invoices_amount_check',     $c$CHECK (amount >= 0)$c$),
    ('campuses',            'campuses_currency_check',           $c$CHECK (upper(currency_code) IN ('PKR','GBP'))$c$),
    ('classes',             'classes_capacity_check',            $c$CHECK (capacity IS NULL OR capacity > 0)$c$),
    ('classes',             'classes_admission_fee_check',       $c$CHECK (coalesce(admission_fee,0) >= 0)$c$),
    ('teacher_profiles',    'teacher_profiles_salary_check',     $c$CHECK (coalesce(salary,0) >= 0)$c$)
  ) AS t(tbl, cname, def)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = r.cname) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s NOT VALID', r.tbl, r.cname, r.def);
      EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', r.tbl, r.cname);
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 9. updated_at triggers on every table that has the column
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public' AND c.column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 10. Indexes from the real query patterns (server.ts / supabaseClient.ts)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS students_campus_id_idx               ON public.students (campus_id);
CREATE INDEX IF NOT EXISTS students_class_id_idx                ON public.students (class_id);
CREATE INDEX IF NOT EXISTS students_parent_id_idx               ON public.students (parent_id);
CREATE INDEX IF NOT EXISTS classes_campus_id_idx                ON public.classes (campus_id);
CREATE INDEX IF NOT EXISTS classes_teacher_id_idx               ON public.classes (teacher_id);
CREATE INDEX IF NOT EXISTS teacher_profiles_campus_id_idx       ON public.teacher_profiles (campus_id);
CREATE INDEX IF NOT EXISTS teacher_attendances_campus_date_idx  ON public.teacher_attendances (campus_id, date);
CREATE INDEX IF NOT EXISTS student_attendances_class_date_idx   ON public.student_attendances (class_id, date);
CREATE INDEX IF NOT EXISTS student_attendances_student_id_idx   ON public.student_attendances (student_id);
CREATE INDEX IF NOT EXISTS payment_invoices_campus_created_idx  ON public.payment_invoices (campus_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_invoices_student_id_idx      ON public.payment_invoices (student_id);
CREATE INDEX IF NOT EXISTS incident_logs_campus_created_idx     ON public.incident_logs (campus_id, created_at DESC);
CREATE INDEX IF NOT EXISTS incident_logs_student_id_idx         ON public.incident_logs (student_id);
CREATE INDEX IF NOT EXISTS audit_logs_campus_created_idx        ON public.audit_logs (campus_id, created_at DESC);
CREATE INDEX IF NOT EXISTS document_uplouds_type_reference_idx  ON public.document_uplouds (type, reference_id);
CREATE INDEX IF NOT EXISTS user_campus_access_campus_id_idx     ON public.user_campus_access (campus_id);

-- Make PostgREST pick up the new columns immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Result check (shown in the SQL Editor after COMMIT):
SELECT 'user_campus_access rows' AS check_name, (SELECT count(*) FROM public.user_campus_access)::text AS value
UNION ALL
SELECT 'students.primary_contact_details type',
       (SELECT data_type FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'primary_contact_details')
UNION ALL
SELECT 'audit_logs.details type',
       (SELECT data_type FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'details')
UNION ALL
SELECT 'check constraints added',
       (SELECT count(*) FROM pg_constraint WHERE contype = 'c' AND connamespace = 'public'::regnamespace)::text
UNION ALL
SELECT 'secondary indexes',
       (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%\_idx')::text;
