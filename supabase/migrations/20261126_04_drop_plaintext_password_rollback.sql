-- =============================================================================
-- ROLLBACK for 20261126_04_drop_plaintext_password
-- Re-creates users.password with the placeholder value (no real passwords are
-- restored — they live in Supabase Auth) and re-activates KTS class 2.
-- =============================================================================

BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password varchar;
UPDATE public.users SET password = '!supabase-auth-managed' WHERE password IS NULL;
ALTER TABLE public.users ALTER COLUMN password SET NOT NULL;

UPDATE public.classes SET is_active = true WHERE id = '2' AND campus_id = 'kts';

NOTIFY pgrst, 'reload schema';

COMMIT;
