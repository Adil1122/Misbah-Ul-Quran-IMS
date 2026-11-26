-- =============================================================================
-- Misbah-ul-Quran IMS — Migration 20261126_03_integrity
-- -----------------------------------------------------------------------------
-- Purpose :
--   1. Referential integrity: deleting a campus, student or teacher can no
--      longer silently wipe attendance / medical / finance history
--      (ON DELETE CASCADE -> RESTRICT). Missing FKs are added.
--   2. Naming: document_uplouds -> documents, medical_logs -> medical_records
--      (the name the code already expects). Drop the empty, unused
--      document_uploads table.
--   3. Data quality: deactivate (NOT delete) duplicate classes, give every
--      active class a code, enforce unique class codes per campus.
-- Safety  : No row is deleted. Pre-checks abort before any change if orphan
--           data would violate a new foreign key. One transaction.
-- Rollback: 20261126_03_integrity_rollback.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Pre-checks (abort with a clear message; nothing changes if they fail)
-- -----------------------------------------------------------------------------
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.document_uploads;
  IF n > 0 THEN RAISE EXCEPTION 'Pre-check failed: document_uploads is not empty (% rows); refusing to drop it.', n; END IF;

  SELECT count(*) INTO n FROM public.medical_logs m
   WHERE m.student_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = m.student_id);
  IF n > 0 THEN RAISE EXCEPTION 'Pre-check failed: % medical rows reference missing students.', n; END IF;

  SELECT count(*) INTO n FROM public.academic_progress p
   WHERE (p.student_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = p.student_id))
      OR (p.teacher_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = p.teacher_id));
  IF n > 0 THEN RAISE EXCEPTION 'Pre-check failed: % academic_progress rows reference missing students/teachers.', n; END IF;

  SELECT count(*) INTO n FROM public.exam_results e
   WHERE (e.student_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = e.student_id))
      OR (e.class_id   IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classes c  WHERE c.id = e.class_id));
  IF n > 0 THEN RAISE EXCEPTION 'Pre-check failed: % exam_results rows reference missing students/classes.', n; END IF;
END $$;

-- Audit entries that point at users who no longer exist (e.g. removed test
-- accounts): keep the entry, clear the dangling user reference — exactly what
-- ON DELETE SET NULL would have done.
UPDATE public.audit_logs a
   SET user_id = NULL
 WHERE a.user_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.user_id);

-- -----------------------------------------------------------------------------
-- 1. Renames (policies, indexes, triggers and FKs follow the table)
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.document_uplouds RENAME TO documents;
ALTER INDEX IF EXISTS public.document_uplouds_pkey               RENAME TO documents_pkey;
ALTER INDEX IF EXISTS public.document_uplouds_type_reference_idx RENAME TO documents_type_reference_idx;
ALTER TABLE public.documents RENAME CONSTRAINT document_uplouds_campus_id_fkey TO documents_campus_id_fkey;

ALTER TABLE IF EXISTS public.medical_logs RENAME TO medical_records;
ALTER INDEX IF EXISTS public.medical_logs_pkey RENAME TO medical_records_pkey;
ALTER TABLE public.medical_records RENAME CONSTRAINT medical_logs_campus_id_fkey TO medical_records_campus_id_fkey;

DROP TABLE IF EXISTS public.document_uploads;

-- -----------------------------------------------------------------------------
-- 2. Foreign keys: protect history (CASCADE -> RESTRICT), add missing ones
-- -----------------------------------------------------------------------------
-- Helper: (re)create a FK with the given rule.
CREATE OR REPLACE FUNCTION pg_temp.set_fk(p_table text, p_name text, p_col text, p_ref text, p_rule text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', p_table, p_name);
  EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s ON DELETE %s',
                 p_table, p_name, p_col, p_ref, p_rule);
END $$;

-- Campus deletion must never cascade through the whole school.
SELECT pg_temp.set_fk('academic_progress',   'academic_progress_campus_id_fkey',   'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('audit_logs',          'audit_logs_campus_id_fkey',          'campus_id', 'public.campuses(id)', 'SET NULL');
SELECT pg_temp.set_fk('classes',             'classes_campus_id_fkey',             'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('documents',           'documents_campus_id_fkey',           'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('event_announcements', 'event_announcements_campus_id_fkey', 'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('exam_results',        'exam_results_campus_id_fkey',        'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('expense_logs',        'expense_logs_campus_id_fkey',        'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('incident_logs',       'incident_logs_campus_id_fkey',       'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('medical_records',     'medical_records_campus_id_fkey',     'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('news',                'news_campus_id_fkey',                'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('payment_invoices',    'payment_invoices_campus_id_fkey',    'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('prayer_timings',      'prayer_timings_campus_id_fkey',      'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('slider_images',       'slider_images_campus_id_fkey',       'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('student_attendances', 'student_attendances_campus_id_fkey', 'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('students',            'students_campus_id_fkey',            'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('teacher_attendances', 'teacher_attendances_campus_id_fkey', 'campus_id', 'public.campuses(id)', 'RESTRICT');
SELECT pg_temp.set_fk('teacher_profiles',    'teacher_profiles_campus_id_fkey',    'campus_id', 'public.campuses(id)', 'RESTRICT');

-- Student history survives (students are archived, not deleted).
SELECT pg_temp.set_fk('student_attendances', 'student_attendances_student_id_fkey', 'student_id', 'public.students(id)', 'RESTRICT');
SELECT pg_temp.set_fk('student_attendances', 'student_attendances_class_id_fkey',   'class_id',   'public.classes(id)',  'RESTRICT');
SELECT pg_temp.set_fk('medical_records',     'medical_records_student_id_fkey',     'student_id', 'public.students(id)', 'RESTRICT');
SELECT pg_temp.set_fk('exam_results',        'exam_results_student_id_fkey',        'student_id', 'public.students(id)', 'RESTRICT');
SELECT pg_temp.set_fk('exam_results',        'exam_results_class_id_fkey',          'class_id',   'public.classes(id)',  'RESTRICT');
SELECT pg_temp.set_fk('academic_progress',   'academic_progress_student_id_fkey',   'student_id', 'public.students(id)', 'RESTRICT');

-- Teacher history survives (teachers with history are deactivated, not deleted).
SELECT pg_temp.set_fk('teacher_attendances', 'teacher_attendances_teacher_id_fkey', 'teacher_id', 'public.users(id)', 'RESTRICT');
SELECT pg_temp.set_fk('academic_progress',   'academic_progress_teacher_id_fkey',   'teacher_id', 'public.users(id)', 'SET NULL');

-- Log tables keep their entries when the actor is removed.
SELECT pg_temp.set_fk('audit_logs',          'audit_logs_user_id_fkey',             'user_id',     'public.users(id)', 'SET NULL');
SELECT pg_temp.set_fk('medical_records',     'medical_records_reported_by_fkey',    'reported_by', 'public.users(id)', 'SET NULL');

-- Indexes for the new FK columns.
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx          ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS medical_records_student_id_idx  ON public.medical_records (student_id);
CREATE INDEX IF NOT EXISTS teacher_attendances_teacher_idx ON public.teacher_attendances (teacher_id);

-- -----------------------------------------------------------------------------
-- 3. Classes: deactivate duplicates, backfill codes, unique code per campus
-- -----------------------------------------------------------------------------
-- Keep the oldest class for each (campus, name); deactivate the rest if no
-- student, attendance or exam row points at them.
WITH ranked AS (
  SELECT c.id,
         row_number() OVER (PARTITION BY c.campus_id, lower(btrim(c.name)) ORDER BY c.created_at, c.id) AS rn
  FROM public.classes c
  WHERE c.is_active
)
UPDATE public.classes c
   SET is_active = false
  FROM ranked r
 WHERE c.id = r.id
   AND r.rn > 1
   AND NOT EXISTS (SELECT 1 FROM public.students s            WHERE s.class_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM public.student_attendances a WHERE a.class_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM public.exam_results e        WHERE e.class_id = c.id);

-- Every class gets a code.
UPDATE public.classes
   SET code = upper(campus_id) || '-CLS-' || upper(id)
 WHERE code IS NULL OR btrim(code) = '';

-- Unique code per campus among active classes.
CREATE UNIQUE INDEX IF NOT EXISTS classes_campus_code_active_key
  ON public.classes (campus_id, upper(code)) WHERE is_active;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Result check
SELECT 'documents rows' AS check_name, (SELECT count(*) FROM public.documents)::text AS value
UNION ALL SELECT 'medical_records exists', (to_regclass('public.medical_records') IS NOT NULL)::text
UNION ALL SELECT 'old names gone', (to_regclass('public.document_uplouds') IS NULL AND to_regclass('public.medical_logs') IS NULL AND to_regclass('public.document_uploads') IS NULL)::text
UNION ALL SELECT 'active classes', (SELECT count(*) FROM public.classes WHERE is_active)::text
UNION ALL SELECT 'deactivated classes', (SELECT count(*) FROM public.classes WHERE NOT is_active)::text
UNION ALL SELECT 'FKs that still CASCADE', (SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace AND confdeltype = 'c')::text;
