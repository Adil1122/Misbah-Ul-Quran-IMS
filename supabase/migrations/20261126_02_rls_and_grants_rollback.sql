-- =============================================================================
-- ROLLBACK for 20261126_02_rls_and_grants
-- WARNING: this restores the previous, INSECURE state (anon key can read and
-- modify every table). Use only to recover from an outage, then re-apply 02.
-- =============================================================================

BEGIN;

-- 1. Drop all current policies on public tables
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- 2. Previous RLS state: these 7 tables had RLS disabled
ALTER TABLE public.campuses         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_timings   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users            DISABLE ROW LEVEL SECURITY;

-- 3. Previous grants (from fix_grants.sql)
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
-- user_campus_access was private from creation (migration 01); keep it private.
REVOKE ALL ON public.user_campus_access FROM anon, authenticated;

-- 4. Previous helper functions and policies
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text AS $$
    SELECT role FROM public.users WHERE id = auth.uid()::text OR email = auth.jwt()->>'email';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_campus()
RETURNS text AS $$
    SELECT active_campus_id FROM public.users WHERE id = auth.uid()::text OR email = auth.jwt()->>'email';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Anon read campuses"          ON public.campuses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read for campuses"    ON public.campuses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Super admin manage campuses" ON public.campuses FOR ALL TO authenticated USING (public.auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Anon read users for login lookup" ON public.users FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE VIEW public.profiles AS
SELECT id, email, username, first_name || ' ' || last_name AS full_name,
       role, active_campus_id, status, image, contact_number, created_at, updated_at
FROM public.users;

-- 5. New helper functions
DROP FUNCTION IF EXISTS public.app_shares_campus_with(text);
DROP FUNCTION IF EXISTS public.app_is_parent_of(text);
DROP FUNCTION IF EXISTS public.app_is_teacher_of_class(text);
DROP FUNCTION IF EXISTS public.app_is_staff_for(text);
DROP FUNCTION IF EXISTS public.app_is_admin_for(text);
DROP FUNCTION IF EXISTS public.app_has_campus(text);
DROP FUNCTION IF EXISTS public.app_current_role();
DROP FUNCTION IF EXISTS public.app_current_user_id();

NOTIFY pgrst, 'reload schema';

COMMIT;
