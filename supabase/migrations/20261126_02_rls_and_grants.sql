-- =============================================================================
-- Misbah-ul-Quran IMS — Migration 20261126_02_rls_and_grants
-- -----------------------------------------------------------------------------
-- Purpose : Close the public (anon key) access to the database and enforce
--           campus isolation with Row Level Security based on Supabase Auth.
--
--   * anon (public key, not signed in): may only READ campuses, news,
--     slider_images, prayer_timings (login-page content). Nothing else.
--   * authenticated (signed in): access decided per row by the policies below.
--   * service_role (Express server): unaffected (bypasses RLS).
--
-- Roles (from public.users.role, linked by users.auth_user_id = auth.uid()):
--   SUPER_ADMIN   everything
--   CAMPUS_ADMIN  everything for campuses in user_campus_access
--   TEACHER       reads their campus; attendance for their own classes
--   PARENT        reads only their own children's records
--
-- Also: drops the `profiles` view (unused by the app; it bypassed RLS and
--       exposed users) and the legacy auth_user_role()/auth_user_campus().
-- Safety  : No data is changed. One transaction. Rollback file provided.
-- Rollback: 20261126_02_rls_and_grants_rollback.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER so they can read users / access rows
--    without recursive RLS checks; empty search_path, fully-qualified names)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_current_user_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT u.id FROM public.users u
  WHERE u.auth_user_id = (SELECT auth.uid()) AND coalesce(u.status, 1) = 1
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_current_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT upper(u.role) FROM public.users u
  WHERE u.auth_user_id = (SELECT auth.uid()) AND coalesce(u.status, 1) = 1
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_has_campus(p_campus_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_campus_access a
    WHERE a.user_id = public.app_current_user_id()
      AND (a.campus_id = p_campus_id OR a.campus_id = 'all')
  );
$$;

-- Super Admin, or Campus Admin of that campus.
CREATE OR REPLACE FUNCTION public.app_is_admin_for(p_campus_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE public.app_current_role()
    WHEN 'SUPER_ADMIN'  THEN true
    WHEN 'CAMPUS_ADMIN' THEN public.app_has_campus(p_campus_id)
    ELSE false
  END;
$$;

-- Any staff member (admin or teacher) of that campus.
CREATE OR REPLACE FUNCTION public.app_is_staff_for(p_campus_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.app_is_admin_for(p_campus_id)
      OR (public.app_current_role() = 'TEACHER' AND public.app_has_campus(p_campus_id));
$$;

CREATE OR REPLACE FUNCTION public.app_is_teacher_of_class(p_class_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = p_class_id AND c.teacher_id = public.app_current_user_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.app_is_parent_of(p_student_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id AND s.parent_id = public.app_current_user_id()
  );
$$;

-- Two users share at least one campus (for staff directories).
CREATE OR REPLACE FUNCTION public.app_shares_campus_with(p_user_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_campus_access other
    WHERE other.user_id = p_user_id
      AND (public.app_has_campus(other.campus_id) OR other.campus_id = 'all' AND public.app_current_role() = 'SUPER_ADMIN')
  );
$$;

REVOKE ALL ON FUNCTION
  public.app_current_user_id(), public.app_current_role(), public.app_has_campus(text),
  public.app_is_admin_for(text), public.app_is_staff_for(text), public.app_is_teacher_of_class(text),
  public.app_is_parent_of(text), public.app_shares_campus_with(text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.app_current_user_id(), public.app_current_role(), public.app_has_campus(text),
  public.app_is_admin_for(text), public.app_is_staff_for(text), public.app_is_teacher_of_class(text),
  public.app_is_parent_of(text), public.app_shares_campus_with(text)
TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Remove legacy objects that leaked data or relied on invalid assumptions
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.profiles;

DO $$
DECLARE p record;
BEGIN
  -- Drop every existing policy on public tables; the full set is recreated below.
  FOR p IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.auth_user_role();
DROP FUNCTION IF EXISTS public.auth_user_campus();

-- -----------------------------------------------------------------------------
-- 3. Grants: deny by default, then grant only what RLS will further restrict
-- -----------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;

-- Public login-page content.
GRANT SELECT ON public.campuses, public.news, public.slider_images, public.prayer_timings TO anon;

-- Signed-in users: CRUD is possible only where a policy allows it. Never TRUNCATE.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- Audit log is append-only for app users.
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
-- Credentials/campus access are managed by the server only.
REVOKE INSERT, UPDATE, DELETE ON public.users, public.user_campus_access FROM authenticated;

-- -----------------------------------------------------------------------------
-- 4. Enable RLS on every table (7 core tables had it switched off)
-- -----------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Policies
-- -----------------------------------------------------------------------------

-- campuses ---------------------------------------------------------------------
CREATE POLICY campuses_read_public  ON public.campuses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY campuses_write_super  ON public.campuses FOR ALL    TO authenticated
  USING (public.app_current_role() = 'SUPER_ADMIN') WITH CHECK (public.app_current_role() = 'SUPER_ADMIN');

-- public content ---------------------------------------------------------------
CREATE POLICY news_read_public      ON public.news           FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY news_write_admin      ON public.news           FOR ALL    TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY slider_read_public    ON public.slider_images  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY slider_write_admin    ON public.slider_images  FOR ALL    TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY prayer_read_public    ON public.prayer_timings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY prayer_write_admin    ON public.prayer_timings FOR ALL    TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- users (read only for app users; writes go through the server) ---------------
CREATE POLICY users_read_self       ON public.users FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));
CREATE POLICY users_read_staff      ON public.users FOR SELECT TO authenticated
  USING (public.app_current_role() IN ('SUPER_ADMIN', 'CAMPUS_ADMIN', 'TEACHER') AND public.app_shares_campus_with(id));

-- user_campus_access ---------------------------------------------------------------
CREATE POLICY uca_read_self         ON public.user_campus_access FOR SELECT TO authenticated
  USING (user_id = public.app_current_user_id() OR public.app_current_role() = 'SUPER_ADMIN');

-- teacher_profiles -------------------------------------------------------------
CREATE POLICY teacher_profiles_read  ON public.teacher_profiles FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id) OR teacher_id = public.app_current_user_id());
CREATE POLICY teacher_profiles_write ON public.teacher_profiles FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- classes ----------------------------------------------------------------------
CREATE POLICY classes_read          ON public.classes FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id)
         OR EXISTS (SELECT 1 FROM public.students s WHERE s.class_id = classes.id AND public.app_is_parent_of(s.id)));
CREATE POLICY classes_write         ON public.classes FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- students ---------------------------------------------------------------------
CREATE POLICY students_read         ON public.students FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id) OR parent_id = public.app_current_user_id());
CREATE POLICY students_write        ON public.students FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- teacher_attendances ----------------------------------------------------------
CREATE POLICY teacher_att_read      ON public.teacher_attendances FOR SELECT TO authenticated
  USING (public.app_is_admin_for(campus_id) OR teacher_id = public.app_current_user_id());
CREATE POLICY teacher_att_write     ON public.teacher_attendances FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- student_attendances ----------------------------------------------------------
CREATE POLICY student_att_read      ON public.student_attendances FOR SELECT TO authenticated
  USING (public.app_is_admin_for(campus_id) OR public.app_is_teacher_of_class(class_id) OR public.app_is_parent_of(student_id));
CREATE POLICY student_att_write     ON public.student_attendances FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id) OR public.app_is_teacher_of_class(class_id))
  WITH CHECK (public.app_is_admin_for(campus_id) OR public.app_is_teacher_of_class(class_id));

-- payment_invoices -------------------------------------------------------------
CREATE POLICY invoices_read         ON public.payment_invoices FOR SELECT TO authenticated
  USING (public.app_is_admin_for(campus_id) OR (student_id IS NOT NULL AND public.app_is_parent_of(student_id)));
CREATE POLICY invoices_write        ON public.payment_invoices FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- incident_logs / medical_logs ---------------------------------------------------
CREATE POLICY incidents_read        ON public.incident_logs FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id));
CREATE POLICY incidents_insert      ON public.incident_logs FOR INSERT TO authenticated
  WITH CHECK (public.app_is_staff_for(campus_id));
CREATE POLICY incidents_modify      ON public.incident_logs FOR UPDATE TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY incidents_delete      ON public.incident_logs FOR DELETE TO authenticated
  USING (public.app_is_admin_for(campus_id));

CREATE POLICY medical_read          ON public.medical_logs FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id));
CREATE POLICY medical_insert        ON public.medical_logs FOR INSERT TO authenticated
  WITH CHECK (public.app_is_staff_for(campus_id));
CREATE POLICY medical_modify        ON public.medical_logs FOR UPDATE TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY medical_delete        ON public.medical_logs FOR DELETE TO authenticated
  USING (public.app_is_admin_for(campus_id));

-- documents --------------------------------------------------------------------
CREATE POLICY documents_read        ON public.document_uplouds FOR SELECT TO authenticated
  USING (public.app_is_staff_for(campus_id));
CREATE POLICY documents_write       ON public.document_uplouds FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));

-- audit_logs (append-only) -------------------------------------------------------
CREATE POLICY audit_read_admin      ON public.audit_logs FOR SELECT TO authenticated
  USING (public.app_current_role() = 'SUPER_ADMIN'
         OR (campus_id IS NOT NULL AND public.app_is_admin_for(campus_id)));
CREATE POLICY audit_insert_self     ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.app_current_user_id() IS NOT NULL
              AND (user_id IS NULL OR user_id = public.app_current_user_id()));

-- reserved tables (no app feature yet): admins of the campus only ---------------
CREATE POLICY events_admin          ON public.event_announcements FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY exams_admin           ON public.exam_results FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY progress_admin        ON public.academic_progress FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY expenses_admin        ON public.expense_logs FOR ALL TO authenticated
  USING (public.app_is_admin_for(campus_id)) WITH CHECK (public.app_is_admin_for(campus_id));
CREATE POLICY legacy_docs_super     ON public.document_uploads FOR ALL TO authenticated
  USING (public.app_current_role() = 'SUPER_ADMIN') WITH CHECK (public.app_current_role() = 'SUPER_ADMIN');

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Result check
SELECT 'tables without RLS' AS check_name,
       (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity)::text AS value
UNION ALL
SELECT 'policies', (SELECT count(*) FROM pg_policies WHERE schemaname = 'public')::text
UNION ALL
SELECT 'tables anon can read',
       (SELECT string_agg(DISTINCT table_name, ', ' ORDER BY table_name) FROM information_schema.role_table_grants
         WHERE grantee = 'anon' AND table_schema = 'public' AND privilege_type = 'SELECT')
UNION ALL
SELECT 'anon write privileges (should be 0)',
       (SELECT count(*) FROM information_schema.role_table_grants
         WHERE grantee = 'anon' AND table_schema = 'public' AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE'))::text;
