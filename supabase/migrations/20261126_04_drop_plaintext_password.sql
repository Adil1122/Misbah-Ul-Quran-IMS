-- =============================================================================
-- Misbah-ul-Quran IMS — Migration 20261126_04_drop_plaintext_password
-- -----------------------------------------------------------------------------
-- Purpose :
--   1. Remove the legacy users.password column. Credentials now live only in
--      Supabase Auth (auth.users, bcrypt-hashed). The column holds only the
--      placeholder '!supabase-auth-managed' (plain-text values were scrubbed
--      on 2026-11-26 after logins were confirmed; a copy is in the private backup).
--   2. Duplicate-class follow-up: keep KTS "B-2" class 12 (it has a student) and
--      deactivate the empty duplicate class 2.
-- Safety  : Pre-checks abort if any real password is still stored or any user
--           lacks a Supabase Auth login. One transaction.
-- Rollback: 20261126_04_drop_plaintext_password_rollback.sql
-- =============================================================================

BEGIN;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.users
   WHERE password IS NOT NULL AND password <> '!supabase-auth-managed';
  IF n > 0 THEN RAISE EXCEPTION 'Pre-check failed: % users still have a stored password. Run the --scrub step first.', n; END IF;

  SELECT count(*) INTO n FROM public.users WHERE auth_user_id IS NULL AND coalesce(status, 1) = 1;
  IF n > 0 THEN RAISE EXCEPTION 'Pre-check failed: % active users have no Supabase Auth login.', n; END IF;
END $$;

ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- Duplicate-class follow-up (only if class 2 is still unused).
UPDATE public.classes c
   SET is_active = false
 WHERE c.id = '2' AND c.campus_id = 'kts' AND c.is_active
   AND NOT EXISTS (SELECT 1 FROM public.students s            WHERE s.class_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM public.student_attendances a WHERE a.class_id = c.id)
   AND EXISTS     (SELECT 1 FROM public.classes k WHERE k.id = '12' AND k.campus_id = 'kts' AND k.is_active);

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT 'users.password column exists' AS check_name,
       EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password')::text AS value
UNION ALL
SELECT 'active KTS B-2 classes',
       (SELECT count(*) FROM public.classes WHERE campus_id = 'kts' AND lower(btrim(name)) = 'b-2' AND is_active)::text;
