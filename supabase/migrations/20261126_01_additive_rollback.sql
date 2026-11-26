-- =============================================================================
-- ROLLBACK for 20261126_01_additive
-- Reverts every object that migration added. Data written into the NEW columns
-- after the migration (blood_group, medical_notes, quran_milestone, grade_level,
-- room, schedule_time, student_id, auth_user_id, user_campus_access rows) is lost
-- on rollback — take a backup first (npx tsx scripts/backup_supabase.ts).
-- =============================================================================

BEGIN;

-- Indexes
DROP INDEX IF EXISTS public.students_campus_id_idx;
DROP INDEX IF EXISTS public.students_class_id_idx;
DROP INDEX IF EXISTS public.students_parent_id_idx;
DROP INDEX IF EXISTS public.classes_campus_id_idx;
DROP INDEX IF EXISTS public.classes_teacher_id_idx;
DROP INDEX IF EXISTS public.teacher_profiles_campus_id_idx;
DROP INDEX IF EXISTS public.teacher_attendances_campus_date_idx;
DROP INDEX IF EXISTS public.student_attendances_class_date_idx;
DROP INDEX IF EXISTS public.student_attendances_student_id_idx;
DROP INDEX IF EXISTS public.payment_invoices_campus_created_idx;
DROP INDEX IF EXISTS public.payment_invoices_student_id_idx;
DROP INDEX IF EXISTS public.incident_logs_campus_created_idx;
DROP INDEX IF EXISTS public.incident_logs_student_id_idx;
DROP INDEX IF EXISTS public.audit_logs_campus_created_idx;
DROP INDEX IF EXISTS public.document_uplouds_type_reference_idx;
DROP INDEX IF EXISTS public.users_auth_user_id_key;
DROP INDEX IF EXISTS public.users_email_lower_key;
DROP INDEX IF EXISTS public.users_username_lower_key;

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tgrelid::regclass::text FROM pg_trigger WHERE tgname = 'set_updated_at' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %s', t);
  END LOOP;
END $$;
DROP FUNCTION IF EXISTS public.set_updated_at();

-- CHECK constraints
ALTER TABLE public.users               DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.students            DROP CONSTRAINT IF EXISTS students_gender_check;
ALTER TABLE public.students            DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE public.students            DROP CONSTRAINT IF EXISTS students_approval_status_check;
ALTER TABLE public.students            DROP CONSTRAINT IF EXISTS students_fees_nonnegative_check;
ALTER TABLE public.students            DROP CONSTRAINT IF EXISTS students_fee_due_day_check;
ALTER TABLE public.teacher_attendances DROP CONSTRAINT IF EXISTS teacher_attendances_status_check;
ALTER TABLE public.student_attendances DROP CONSTRAINT IF EXISTS student_attendances_status_check;
ALTER TABLE public.payment_invoices    DROP CONSTRAINT IF EXISTS payment_invoices_status_check;
ALTER TABLE public.payment_invoices    DROP CONSTRAINT IF EXISTS payment_invoices_currency_check;
ALTER TABLE public.payment_invoices    DROP CONSTRAINT IF EXISTS payment_invoices_amount_check;
ALTER TABLE public.campuses            DROP CONSTRAINT IF EXISTS campuses_currency_check;
ALTER TABLE public.classes             DROP CONSTRAINT IF EXISTS classes_capacity_check;
ALTER TABLE public.classes             DROP CONSTRAINT IF EXISTS classes_admission_fee_check;
ALTER TABLE public.teacher_profiles    DROP CONSTRAINT IF EXISTS teacher_profiles_salary_check;

-- Column type reverts (jsonb -> text, preserving values as JSON text)
ALTER TABLE public.audit_logs
  ALTER COLUMN details TYPE text USING details::text;
ALTER TABLE public.students
  ALTER COLUMN primary_contact_details   TYPE text USING primary_contact_details::text,
  ALTER COLUMN secondary_contact_details TYPE text USING secondary_contact_details::text;

-- Added columns
ALTER TABLE public.medical_logs     DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.payment_invoices DROP CONSTRAINT IF EXISTS payment_invoices_student_id_fkey;
ALTER TABLE public.payment_invoices DROP COLUMN IF EXISTS student_id;
ALTER TABLE public.classes          DROP COLUMN IF EXISTS grade_level, DROP COLUMN IF EXISTS room, DROP COLUMN IF EXISTS schedule_time;
ALTER TABLE public.students         DROP COLUMN IF EXISTS blood_group, DROP COLUMN IF EXISTS medical_notes,
                                    DROP COLUMN IF EXISTS quran_milestone, DROP COLUMN IF EXISTS archived_at;

-- Identity
DROP TABLE IF EXISTS public.user_campus_access;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;
ALTER TABLE public.users DROP COLUMN IF EXISTS auth_user_id;

NOTIFY pgrst, 'reload schema';

COMMIT;
