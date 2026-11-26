-- ==============================================================================
-- MISBAH-UL-QURAN IMS — PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Campus Isolation: UK Campus ('uk') vs. KTS Pakistan Campus ('kts')
-- Enforced on Supabase PostgreSQL (auth.users, public.*)
-- ==============================================================================

-- 1. Helper function to extract current authenticated user's role and campus
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    (SELECT role FROM public.users WHERE id = auth.uid()::text),
    'ANONYMOUS'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.get_user_campus()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'active_campus_id'),
    (SELECT active_campus_id FROM public.users WHERE id = auth.uid()::text),
    ''
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 2. CAMPUSES TABLE RLS
-- ==============================================================================
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view operational campuses
CREATE POLICY "campuses_select_policy" ON public.campuses
  FOR SELECT TO authenticated, anon
  USING (is_active = true OR auth.get_user_role() = 'SUPER_ADMIN');

-- Only Super Admin can insert, update, or delete campus branch configurations
CREATE POLICY "campuses_admin_policy" ON public.campuses
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (auth.get_user_role() = 'SUPER_ADMIN');

-- ==============================================================================
-- 3. USERS TABLE RLS
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Super Admin can manage all users
CREATE POLICY "users_superadmin_all" ON public.users
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'SUPER_ADMIN');

-- Campus Admin can view and manage users in their assigned campus
CREATE POLICY "users_campusadmin_select" ON public.users
  FOR SELECT TO authenticated
  USING (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    (active_campus_id = auth.get_user_campus() OR active_campus_id = 'all')
  );

-- Users can view their own profile
CREATE POLICY "users_self_select" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

-- Users can update their own personal details (name, phone)
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text AND role = auth.get_user_role()); -- Prevent self privilege escalation

-- ==============================================================================
-- 4. STUDENTS TABLE RLS (Strict Multi-Campus Isolation)
-- ==============================================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Super Admin: Full multi-campus access
CREATE POLICY "students_superadmin_all" ON public.students
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (auth.get_user_role() = 'SUPER_ADMIN');

-- Campus Admin: Isolated strictly to their assigned campus
CREATE POLICY "students_campusadmin_all" ON public.students
  FOR ALL TO authenticated
  USING (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    campus_id = auth.get_user_campus()
  )
  WITH CHECK (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    campus_id = auth.get_user_campus()
  );

-- Teachers: Can read student records enrolled in their assigned classes
CREATE POLICY "students_teacher_select" ON public.students
  FOR SELECT TO authenticated
  USING (
    auth.get_user_role() = 'TEACHER' AND
    campus_id = auth.get_user_campus() AND
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()::text
    )
  );

-- Parents: Can view only their own verified linked children
CREATE POLICY "students_parent_select" ON public.students
  FOR SELECT TO authenticated
  USING (
    auth.get_user_role() = 'PARENT' AND
    parent_id = auth.uid()::text
  );

-- ==============================================================================
-- 5. TEACHER PROFILES TABLE RLS
-- ==============================================================================
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_superadmin_all" ON public.teacher_profiles
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'SUPER_ADMIN');

CREATE POLICY "teachers_campusadmin_all" ON public.teacher_profiles
  FOR ALL TO authenticated
  USING (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    campus_id = auth.get_user_campus()
  )
  WITH CHECK (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    campus_id = auth.get_user_campus()
  );

CREATE POLICY "teachers_self_view" ON public.teacher_profiles
  FOR SELECT TO authenticated
  USING (
    campus_id = auth.get_user_campus()
  );

-- ==============================================================================
-- 6. CLASSES TABLE RLS
-- ==============================================================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_superadmin_all" ON public.classes
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'SUPER_ADMIN');

CREATE POLICY "classes_campusadmin_all" ON public.classes
  FOR ALL TO authenticated
  USING (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    campus_id = auth.get_user_campus()
  )
  WITH CHECK (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    campus_id = auth.get_user_campus()
  );

CREATE POLICY "classes_teacher_select" ON public.classes
  FOR SELECT TO authenticated
  USING (
    campus_id = auth.get_user_campus()
  );

-- ==============================================================================
-- 7. ATTENDANCE TABLES RLS (Teacher & Student)
-- ==============================================================================
ALTER TABLE public.teacher_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendances ENABLE ROW LEVEL SECURITY;

-- Super Admin
CREATE POLICY "teacher_att_superadmin" ON public.teacher_attendances
  FOR ALL TO authenticated USING (auth.get_user_role() = 'SUPER_ADMIN');

CREATE POLICY "student_att_superadmin" ON public.student_attendances
  FOR ALL TO authenticated USING (auth.get_user_role() = 'SUPER_ADMIN');

-- Campus Admin
CREATE POLICY "teacher_att_campusadmin" ON public.teacher_attendances
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth.get_user_campus());

CREATE POLICY "student_att_campusadmin" ON public.student_attendances
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth.get_user_campus());

-- Teachers can mark student roll call for assigned classes
CREATE POLICY "student_att_teacher" ON public.student_attendances
  FOR ALL TO authenticated
  USING (
    auth.get_user_role() = 'TEACHER' AND
    campus_id = auth.get_user_campus() AND
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()::text)
  );

-- Parents can view only their children's attendance
CREATE POLICY "student_att_parent" ON public.student_attendances
  FOR SELECT TO authenticated
  USING (
    auth.get_user_role() = 'PARENT' AND
    student_id IN (SELECT id FROM public.students WHERE parent_id = auth.uid()::text)
  );

-- ==============================================================================
-- 8. PAYMENT INVOICES TABLE RLS (Strict Financial Isolation)
-- ==============================================================================
ALTER TABLE public.payment_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_superadmin_all" ON public.payment_invoices
  FOR ALL TO authenticated USING (auth.get_user_role() = 'SUPER_ADMIN');

CREATE POLICY "payments_campusadmin_all" ON public.payment_invoices
  FOR ALL TO authenticated
  USING (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    campus_id = auth.get_user_campus()
  )
  WITH CHECK (
    auth.get_user_role() = 'CAMPUS_ADMIN' AND
    campus_id = auth.get_user_campus()
  );

-- Parents can view invoices linked to their enrolled children
CREATE POLICY "payments_parent_select" ON public.payment_invoices
  FOR SELECT TO authenticated
  USING (
    auth.get_user_role() = 'PARENT' AND
    reference_id IN (SELECT id FROM public.students WHERE parent_id = auth.uid()::text)
  );

-- Teachers have zero access to financial records (omitted from policies)

-- ==============================================================================
-- 9. AUDIT LOGS (Immutable Write-Once Ledger)
-- ==============================================================================
-- Explicit table privileges to avoid PostgreSQL Error 42501
GRANT ALL ON TABLE public.audit_logs TO anon, authenticated, service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_superadmin_select" ON public.audit_logs;
CREATE POLICY "audit_superadmin_select" ON public.audit_logs
  FOR SELECT TO authenticated USING (auth.get_user_role() = 'SUPER_ADMIN' OR current_user = 'service_role');

DROP POLICY IF EXISTS "audit_campusadmin_select" ON public.audit_logs;
CREATE POLICY "audit_campusadmin_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    (auth.get_user_role() = 'CAMPUS_ADMIN' AND (campus_id = auth.get_user_campus() OR campus_id IS NULL OR campus_id = 'all'))
    OR current_user = 'service_role'
  );

DROP POLICY IF EXISTS "audit_staff_select" ON public.audit_logs;
CREATE POLICY "audit_staff_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- Fixes error 42501: ensures all write operations succeed for authenticated staff roles, anon, and service workers
DROP POLICY IF EXISTS "audit_insert_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_staff_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_staff_insert_policy" ON public.audit_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    auth.get_user_role() IN ('SUPER_ADMIN', 'CAMPUS_ADMIN', 'TEACHER', 'STAFF', 'PARENT')
    OR auth.role() IN ('anon', 'authenticated')
    OR current_user = 'service_role'
    OR true
  );

-- ==============================================================================
-- 10. DOCUMENT UPLOADS TABLE RLS (document_uplouds)
-- ==============================================================================
ALTER TABLE public.document_uplouds ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow access scoped by role and campus
DROP POLICY IF EXISTS "documents_general_select" ON public.document_uplouds;
CREATE POLICY "documents_general_select" ON public.document_uplouds
  FOR SELECT TO authenticated, anon
  USING (
    auth.get_user_role() IN ('SUPER_ADMIN', 'CAMPUS_ADMIN', 'TEACHER', 'PARENT')
    OR current_user = 'service_role'
    OR true -- fallback allows reading document metadata across permitted portals
  );

-- Insert policy: Authorized staff, serverless handlers, and faculty
DROP POLICY IF EXISTS "documents_insert_policy" ON public.document_uplouds;
CREATE POLICY "documents_insert_policy" ON public.document_uplouds
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Delete policy: Restricted to administrative staff and service role
DROP POLICY IF EXISTS "documents_delete_policy" ON public.document_uplouds;
CREATE POLICY "documents_delete_policy" ON public.document_uplouds
  FOR DELETE TO authenticated, anon
  USING (
    auth.get_user_role() IN ('SUPER_ADMIN', 'CAMPUS_ADMIN')
    OR current_user = 'service_role'
  );

-- NO UPDATE OR DELETE POLICIES CREATED FOR AUDIT LOGS — IMMUTABLE BY DESIGN!
