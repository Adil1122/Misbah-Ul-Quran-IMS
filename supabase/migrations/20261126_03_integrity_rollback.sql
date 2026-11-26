-- =============================================================================
-- ROLLBACK for 20261126_03_integrity
-- Restores the previous names and the previous ON DELETE rules.
-- Notes:
--  * Classes deactivated by migration 03 are NOT re-activated automatically
--    (the list is in the 2026-11-26 backup); generated class codes are kept.
--  * The empty document_uploads table is recreated with its original shape.
--  * audit_logs.user_id values cleared for deleted users cannot be restored
--    (they pointed at users that no longer exist).
-- =============================================================================

BEGIN;

DROP INDEX IF EXISTS public.classes_campus_code_active_key;
DROP INDEX IF EXISTS public.audit_logs_user_id_idx;
DROP INDEX IF EXISTS public.medical_records_student_id_idx;
DROP INDEX IF EXISTS public.teacher_attendances_teacher_idx;

CREATE OR REPLACE FUNCTION pg_temp.set_fk(p_table text, p_name text, p_col text, p_ref text, p_rule text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', p_table, p_name);
  IF p_rule IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s ON DELETE %s',
                   p_table, p_name, p_col, p_ref, p_rule);
  END IF;
END $$;

-- FKs that did not exist before migration 03
SELECT pg_temp.set_fk('medical_records',   'medical_records_student_id_fkey',   'student_id',  NULL, NULL);
SELECT pg_temp.set_fk('medical_records',   'medical_records_reported_by_fkey',  'reported_by', NULL, NULL);
SELECT pg_temp.set_fk('exam_results',      'exam_results_student_id_fkey',      'student_id',  NULL, NULL);
SELECT pg_temp.set_fk('exam_results',      'exam_results_class_id_fkey',        'class_id',    NULL, NULL);
SELECT pg_temp.set_fk('academic_progress', 'academic_progress_student_id_fkey', 'student_id',  NULL, NULL);
SELECT pg_temp.set_fk('academic_progress', 'academic_progress_teacher_id_fkey', 'teacher_id',  NULL, NULL);
SELECT pg_temp.set_fk('audit_logs',        'audit_logs_user_id_fkey',           'user_id',     NULL, NULL);

-- Previous rules (from the 2026-11-26 catalog snapshot)
SELECT pg_temp.set_fk('student_attendances', 'student_attendances_student_id_fkey', 'student_id', 'public.students(id)', 'CASCADE');
SELECT pg_temp.set_fk('student_attendances', 'student_attendances_class_id_fkey',   'class_id',   'public.classes(id)',  'CASCADE');
SELECT pg_temp.set_fk('teacher_attendances', 'teacher_attendances_teacher_id_fkey', 'teacher_id', 'public.users(id)',    'CASCADE');

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['academic_progress','audit_logs','classes','documents','event_announcements','exam_results',
                           'expense_logs','incident_logs','medical_records','news','payment_invoices','prayer_timings',
                           'slider_images','student_attendances','students','teacher_attendances','teacher_profiles']
  LOOP
    PERFORM pg_temp.set_fk(t, t || '_campus_id_fkey', 'campus_id', 'public.campuses(id)', 'CASCADE');
  END LOOP;
END $$;

-- Names
ALTER TABLE public.medical_records RENAME CONSTRAINT medical_records_campus_id_fkey TO medical_logs_campus_id_fkey;
ALTER INDEX IF EXISTS public.medical_records_pkey RENAME TO medical_logs_pkey;
ALTER TABLE IF EXISTS public.medical_records RENAME TO medical_logs;

ALTER TABLE public.documents RENAME CONSTRAINT documents_campus_id_fkey TO document_uplouds_campus_id_fkey;
ALTER INDEX IF EXISTS public.documents_type_reference_idx RENAME TO document_uplouds_type_reference_idx;
ALTER INDEX IF EXISTS public.documents_pkey RENAME TO document_uplouds_pkey;
ALTER TABLE IF EXISTS public.documents RENAME TO document_uplouds;

CREATE TABLE IF NOT EXISTS public.document_uploads (
  id serial PRIMARY KEY,
  type varchar,
  reference_id integer,
  name varchar,
  file_name varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

COMMIT;
