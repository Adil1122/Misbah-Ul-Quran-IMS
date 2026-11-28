-- =============================================================================
-- ROLLBACK for 20261127_05_remaining_entities
-- WARNING: drops the new tables and columns INCLUDING any data written to them
-- since migration 05 (parents, salaries, announcements, notifications, teaching
-- materials, new expense/progress/exam/event/document fields). Take a backup
-- first: npm run db:backup. Files in the storage bucket are NOT deleted.
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS public.notification_logs;
DROP TABLE IF EXISTS public.announcements;
DROP TABLE IF EXISTS public.teaching_materials;
DROP TABLE IF EXISTS public.teacher_salary_records;
DROP TABLE IF EXISTS public.parent_profiles;

ALTER TABLE public.students            DROP COLUMN IF EXISTS portal_access_active;
ALTER TABLE public.expense_logs        DROP CONSTRAINT IF EXISTS expense_logs_category_check,
                                       DROP CONSTRAINT IF EXISTS expense_logs_currency_check,
                                       DROP CONSTRAINT IF EXISTS expense_logs_amount_check,
                                       DROP COLUMN IF EXISTS created_by,
                                       DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.academic_progress   DROP COLUMN IF EXISTS class_id, DROP COLUMN IF EXISTS subject,
                                       DROP COLUMN IF EXISTS score, DROP COLUMN IF EXISTS max_score,
                                       DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.exam_results        DROP CONSTRAINT IF EXISTS exam_results_marks_check,
                                       DROP COLUMN IF EXISTS exam_title, DROP COLUMN IF EXISTS audit_notes,
                                       DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.event_announcements DROP CONSTRAINT IF EXISTS event_announcements_class_id_fkey,
                                       DROP CONSTRAINT IF EXISTS event_announcements_type_check,
                                       DROP COLUMN IF EXISTS reminders_sent, DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.documents           DROP COLUMN IF EXISTS category, DROP COLUMN IF EXISTS mime_type,
                                       DROP COLUMN IF EXISTS size_bytes, DROP COLUMN IF EXISTS storage_bucket,
                                       DROP COLUMN IF EXISTS uploaded_by;

DROP INDEX IF EXISTS public.expense_logs_campus_date_idx;
DROP INDEX IF EXISTS public.academic_progress_student_date_idx;
DROP INDEX IF EXISTS public.exam_results_student_idx;
DROP INDEX IF EXISTS public.exam_results_class_idx;
DROP INDEX IF EXISTS public.event_announcements_campus_date_idx;

-- Restore the admin-only policies of migration 02 on the reserved tables.
DROP POLICY IF EXISTS events_read    ON public.event_announcements;
DROP POLICY IF EXISTS events_write   ON public.event_announcements;
DROP POLICY IF EXISTS exams_read     ON public.exam_results;
DROP POLICY IF EXISTS exams_write    ON public.exam_results;
DROP POLICY IF EXISTS progress_read  ON public.academic_progress;
DROP POLICY IF EXISTS progress_write ON public.academic_progress;
CREATE POLICY events_admin   ON public.event_announcements FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY exams_admin    ON public.exam_results FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY progress_admin ON public.academic_progress FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- The storage bucket is left in place (it may contain uploaded files).

NOTIFY pgrst, 'reload schema';

COMMIT;
