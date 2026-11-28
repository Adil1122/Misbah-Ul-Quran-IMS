-- =============================================================================
-- Misbah-ul-Quran IMS — Migration 20261127_06_progress_teacher_nullable
-- -----------------------------------------------------------------------------
-- Purpose : academic_progress.teacher_id had NOT NULL while its foreign key
--           (migration 03) says ON DELETE SET NULL. Deleting a teacher who
--           recorded progress would therefore fail. Allow NULL so progress
--           history is kept with the teacher reference cleared.
--           The app always fills teacher_id when recording progress.
-- Safety  : Relaxes one constraint. No data changes. One transaction.
-- Rollback: 20261127_06_progress_teacher_nullable_rollback.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.academic_progress ALTER COLUMN teacher_id DROP NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT 'academic_progress.teacher_id nullable' AS check_name,
       (SELECT is_nullable FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'academic_progress' AND column_name = 'teacher_id') AS value;
