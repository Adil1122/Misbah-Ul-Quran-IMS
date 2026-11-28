-- =============================================================================
-- ROLLBACK for 20261127_06_progress_teacher_nullable
-- Fails (and changes nothing) if any progress row has no teacher.
-- =============================================================================

BEGIN;

ALTER TABLE public.academic_progress ALTER COLUMN teacher_id SET NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
