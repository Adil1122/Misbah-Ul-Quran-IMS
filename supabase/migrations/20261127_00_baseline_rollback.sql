-- =============================================================================
-- ROLLBACK for 20261127_00_baseline.sql — NEW PROJECT ONLY
-- -----------------------------------------------------------------------------
-- Drops every table and function the baseline created, and the documents bucket
-- if it is empty. It aborts if any table holds data, so it cannot destroy real
-- records. Use it only to retry the baseline on a fresh project.
-- =============================================================================
BEGIN;

DO $$
DECLARE t text; n bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY['academic_progress', 'announcements', 'audit_logs', 'campuses', 'classes', 'documents', 'event_announcements', 'exam_results', 'expense_logs', 'incident_logs', 'medical_records', 'news', 'notification_logs', 'parent_profiles', 'payment_invoices', 'prayer_timings', 'slider_images', 'student_attendances', 'students', 'teacher_attendances', 'teacher_profiles', 'teacher_salary_records', 'teaching_materials', 'user_campus_access', 'users'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
      IF n > 0 THEN
        RAISE EXCEPTION 'Rollback aborted: public.% has % rows. This rollback is only for an empty project.', t, n;
      END IF;
    END IF;
  END LOOP;
END $$;

DROP TABLE IF EXISTS public.academic_progress CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.campuses CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.event_announcements CASCADE;
DROP TABLE IF EXISTS public.exam_results CASCADE;
DROP TABLE IF EXISTS public.expense_logs CASCADE;
DROP TABLE IF EXISTS public.incident_logs CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.parent_profiles CASCADE;
DROP TABLE IF EXISTS public.payment_invoices CASCADE;
DROP TABLE IF EXISTS public.prayer_timings CASCADE;
DROP TABLE IF EXISTS public.slider_images CASCADE;
DROP TABLE IF EXISTS public.student_attendances CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.teacher_attendances CASCADE;
DROP TABLE IF EXISTS public.teacher_profiles CASCADE;
DROP TABLE IF EXISTS public.teacher_salary_records CASCADE;
DROP TABLE IF EXISTS public.teaching_materials CASCADE;
DROP TABLE IF EXISTS public.user_campus_access CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.app_current_role CASCADE;
DROP FUNCTION IF EXISTS public.app_current_user_id CASCADE;
DROP FUNCTION IF EXISTS public.app_has_campus CASCADE;
DROP FUNCTION IF EXISTS public.app_is_admin_for CASCADE;
DROP FUNCTION IF EXISTS public.app_is_parent_of CASCADE;
DROP FUNCTION IF EXISTS public.app_is_staff_for CASCADE;
DROP FUNCTION IF EXISTS public.app_is_teacher_of_class CASCADE;
DROP FUNCTION IF EXISTS public.app_shares_campus_with CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.validate_teacher_attendance_time_rules CASCADE;
DELETE FROM storage.buckets b WHERE b.id = 'misbah-documents'
  AND NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = b.id);

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT 'public tables left' AS check_name, count(*)::text AS value FROM pg_tables WHERE schemaname = 'public';
