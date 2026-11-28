-- =============================================================================
-- Misbah-ul-Quran IMS — BASELINE schema for a NEW, EMPTY Supabase project
-- -----------------------------------------------------------------------------
-- Purpose : recreates the complete public schema exactly as it is on the original
--           project after migrations 20261126_01 … 20261127_06: 25 tables,
--           67 keys/checks, 52 foreign keys, 35 indexes, 10 functions,
--           23 triggers, RLS on 25 tables, 52 policies, grants and the
--           private 'misbah-documents' Storage bucket.
-- Source  : generated from supabase/audit/01_generate_schema_ddl.sql run on the
--           original project (2026-11-28). Do not edit by hand; regenerate instead.
-- Run on  : a NEW project only. It aborts if any of these tables already exists.
--           Do NOT run on a project that already has the schema (use 01 … 06 there).
-- Safety  : one transaction — if any statement fails, nothing is created.
-- Rollback: 20261127_00_baseline_rollback.sql (drops everything this creates; only
--           for a new project that holds no real data yet).
-- =============================================================================
BEGIN;

SET LOCAL check_function_bodies = off;

-- Pre-check: the target must be empty.
DO $$
DECLARE existing text;
BEGIN
  SELECT string_agg(c.relname, ', ') INTO existing
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v')
    AND c.relname IN ('academic_progress', 'announcements', 'audit_logs', 'campuses', 'classes', 'documents', 'event_announcements', 'exam_results', 'expense_logs', 'incident_logs', 'medical_records', 'news', 'notification_logs', 'parent_profiles', 'payment_invoices', 'prayer_timings', 'slider_images', 'student_attendances', 'students', 'teacher_attendances', 'teacher_profiles', 'teacher_salary_records', 'teaching_materials', 'user_campus_access', 'users');
  IF existing IS NOT NULL THEN
    RAISE EXCEPTION 'Baseline aborted: these tables already exist: %. This file is only for a new, empty project.', existing;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Functions (bodies are checked at run time, so order does not matter) (10)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_current_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT upper(u.role) FROM public.users u
  WHERE u.auth_user_id = (SELECT auth.uid()) AND coalesce(u.status, 1) = 1
  LIMIT 1;
$function$
;
CREATE OR REPLACE FUNCTION public.app_current_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT u.id FROM public.users u
  WHERE u.auth_user_id = (SELECT auth.uid()) AND coalesce(u.status, 1) = 1
  LIMIT 1;
$function$
;
CREATE OR REPLACE FUNCTION public.app_has_campus(p_campus_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_campus_access a
    WHERE a.user_id = public.app_current_user_id()
      AND (a.campus_id = p_campus_id OR a.campus_id = 'all')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.app_is_admin_for(p_campus_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT CASE public.app_current_role()
    WHEN 'SUPER_ADMIN'  THEN true
    WHEN 'CAMPUS_ADMIN' THEN public.app_has_campus(p_campus_id)
    ELSE false
  END;
$function$
;
CREATE OR REPLACE FUNCTION public.app_is_parent_of(p_student_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id AND s.parent_id = public.app_current_user_id()
  );
$function$
;
CREATE OR REPLACE FUNCTION public.app_is_staff_for(p_campus_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT public.app_is_admin_for(p_campus_id)
      OR (public.app_current_role() = 'TEACHER' AND public.app_has_campus(p_campus_id));
$function$
;
CREATE OR REPLACE FUNCTION public.app_is_teacher_of_class(p_class_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = p_class_id AND c.teacher_id = public.app_current_user_id()
  );
$function$
;
CREATE OR REPLACE FUNCTION public.app_shares_campus_with(p_user_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_campus_access other
    WHERE other.user_id = p_user_id
      AND (public.app_has_campus(other.campus_id) OR other.campus_id = 'all' AND public.app_current_role() = 'SUPER_ADMIN')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.validate_teacher_attendance_time_rules()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    campus_tz text;
    local_time time;
    check_ts timestamptz;
    total_seconds int;
BEGIN
    SELECT COALESCE(timezone, 'Asia/Karachi') INTO campus_tz FROM campuses WHERE id = NEW.campus_id;
    IF campus_tz IS NULL THEN campus_tz := 'Asia/Karachi'; END IF;
    check_ts := COALESCE(NEW.check_in_time, timezone('utc'::text, now()));
    local_time := (check_ts AT TIME ZONE campus_tz)::time;
    total_seconds := EXTRACT(HOUR FROM local_time) * 3600 + EXTRACT(MINUTE FROM local_time) * 60 + EXTRACT(SECOND FROM local_time);

    IF total_seconds <= 61200 THEN
        IF NEW.status NOT IN ('PRESENT', 'ABSENT', 'LEAVE') THEN NEW.status := 'PRESENT'; END IF;
        NEW.rule_applied := 'UP_TO_5PM';
    ELSIF total_seconds > 61200 AND total_seconds <= 63000 THEN
        IF NEW.status = 'PRESENT' THEN NEW.status := 'LATE'; END IF;
        NEW.rule_applied := 'LATE_WINDOW_5_01_TO_5_30';
    ELSE
        NEW.status := 'ABSENT';
        NEW.is_system_generated := true;
        NEW.rule_applied := 'AFTER_5_30PM_AUTO_ABSENT';
    END IF;
    RETURN NEW;
END;
$function$
;

-- -----------------------------------------------------------------------------
-- 2. Tables (25)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_progress (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  campus_id text,
  student_id text NOT NULL,
  teacher_id text,
  date date DEFAULT CURRENT_DATE NOT NULL,
  sabaq_surah character varying(100),
  sabaq_ayah character varying(100),
  sabqi_juz character varying(50),
  manzil_juz character varying(50),
  tajweed_score integer,
  feedback text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  class_id text,
  subject text,
  score numeric(6,2),
  max_score numeric(6,2),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.announcements (
  id text NOT NULL,
  campus_id text,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'NORMAL'::text NOT NULL,
  target_role text DEFAULT 'ALL'::text NOT NULL,
  published_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  campus_id text,
  user_id text,
  action character varying(100) NOT NULL,
  details jsonb,
  ip_address character varying(50),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.campuses (
  id text NOT NULL,
  code character varying(30) NOT NULL,
  name character varying(150) NOT NULL,
  country character varying(100) NOT NULL,
  city character varying(100) NOT NULL,
  address text NOT NULL,
  timezone character varying(50) DEFAULT 'Asia/Karachi'::character varying NOT NULL,
  currency_code character varying(10) DEFAULT 'PKR'::character varying NOT NULL,
  phone character varying(50),
  email character varying(100),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.classes (
  id text NOT NULL,
  campus_id text NOT NULL,
  title character varying(150),
  name character varying(150),
  code character varying(50),
  admission_fee numeric(12,2) DEFAULT 0.00,
  description text,
  teacher_id text,
  capacity integer DEFAULT 25,
  academic_year character varying(30) DEFAULT '2025-2026'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  grade_level text,
  room text,
  schedule_time text
);
CREATE TABLE IF NOT EXISTS public.documents (
  id text NOT NULL,
  campus_id text DEFAULT 'kts'::text NOT NULL,
  type character varying(50),
  reference_id text,
  name character varying(255),
  file_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  category text,
  mime_type text,
  size_bytes bigint,
  storage_bucket text,
  uploaded_by text
);
CREATE TABLE IF NOT EXISTS public.event_announcements (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  campus_id text,
  type character varying(50) DEFAULT 'EXAM'::character varying NOT NULL,
  title character varying(150) NOT NULL,
  class_id text,
  date_time timestamp with time zone NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  reminders_sent jsonb DEFAULT '{"email": false, "whatsapp": false}'::jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.exam_results (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  campus_id text,
  student_id text NOT NULL,
  academic_year character varying(20) DEFAULT '2025-2026'::character varying NOT NULL,
  class_id text NOT NULL,
  subject character varying(100) NOT NULL,
  assessment_name character varying(150) NOT NULL,
  marks_obtained numeric(5,2) NOT NULL,
  max_marks numeric(5,2) DEFAULT 100 NOT NULL,
  grade character varying(10),
  teacher_name character varying(100),
  exam_date date NOT NULL,
  remarks text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  exam_title text,
  audit_notes text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.expense_logs (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  campus_id text,
  category character varying(50) NOT NULL,
  title character varying(150) NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency character varying(10) DEFAULT 'PKR'::character varying NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  approved_by text,
  receipt_number character varying(100),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_by text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.incident_logs (
  id text NOT NULL,
  campus_id text DEFAULT 'kts'::text NOT NULL,
  student_id text,
  date date,
  title character varying(255) NOT NULL,
  description text,
  action_taken text,
  attachments text,
  status character varying(50) DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.medical_records (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  campus_id text,
  student_id text NOT NULL,
  condition character varying(150) NOT NULL,
  severity character varying(20) DEFAULT 'LOW'::character varying,
  allergies text,
  medication_notes text,
  emergency_contact character varying(100),
  reported_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  status text DEFAULT 'SUBMITTED'::text NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.news (
  id integer NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  campus_id text DEFAULT 'all'::text
);
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id text NOT NULL,
  campus_id text,
  recipient_type text NOT NULL,
  channel text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'SENT'::text NOT NULL,
  sent_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.parent_profiles (
  id text NOT NULL,
  user_id text NOT NULL,
  campus_id text NOT NULL,
  phone text,
  cnic_or_id text,
  occupation text,
  address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.payment_invoices (
  id text NOT NULL,
  campus_id text NOT NULL,
  type character varying(50) DEFAULT 'fee_invoice'::character varying,
  reference_id text,
  due_date date NOT NULL,
  amount numeric(12,2) DEFAULT 0.00 NOT NULL,
  currency character varying(10) DEFAULT 'PKR'::character varying NOT NULL,
  payment_method character varying(50) DEFAULT 'cash'::character varying,
  payment_status character varying(50) DEFAULT 'unpaid'::character varying,
  payment_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  student_id text
);
CREATE TABLE IF NOT EXISTS public.prayer_timings (
  id integer NOT NULL,
  campus_id text DEFAULT 'kts'::text NOT NULL,
  english_name character varying(100) NOT NULL,
  arabic_name character varying(100),
  month integer DEFAULT 1 NOT NULL,
  day integer DEFAULT 1 NOT NULL,
  year integer DEFAULT 2026 NOT NULL,
  begin_time time without time zone,
  end_time time without time zone,
  is_jummah boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.slider_images (
  id integer NOT NULL,
  image_name character varying(255) NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  campus_id text DEFAULT 'all'::text
);
CREATE TABLE IF NOT EXISTS public.student_attendances (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  campus_id text NOT NULL,
  class_id text NOT NULL,
  student_id text NOT NULL,
  date date NOT NULL,
  status character varying(20) DEFAULT 'PRESENT'::character varying NOT NULL,
  arrival_time character varying(20),
  rule_applied character varying(100),
  remarks text,
  recorded_by character varying(100) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.students (
  id text NOT NULL,
  campus_id text NOT NULL,
  parent_id text,
  class_id text,
  first_name character varying(100) NOT NULL,
  last_name character varying(100) NOT NULL,
  roll_number character varying(50),
  status character varying(50) DEFAULT 'active'::character varying,
  date_of_birth date,
  gender character varying(20) DEFAULT 'female'::character varying,
  address text,
  admission_date date,
  admission_fee_amount numeric(12,2) DEFAULT 0.00,
  monthly_fee_amount numeric(12,2) DEFAULT 0.00,
  fee_due_day integer DEFAULT 10,
  default_payment_method character varying(50) DEFAULT 'cash'::character varying,
  approval_status character varying(50) DEFAULT 'APPROVED'::character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  primary_contact_details jsonb,
  secondary_contact_details jsonb,
  blood_group text,
  medical_notes text,
  quran_milestone text,
  archived_at timestamp with time zone,
  portal_access_active boolean DEFAULT true NOT NULL
);
CREATE TABLE IF NOT EXISTS public.teacher_attendances (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  campus_id text NOT NULL,
  teacher_id text NOT NULL,
  date date NOT NULL,
  status character varying(20) DEFAULT 'PRESENT'::character varying NOT NULL,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  rule_applied character varying(100),
  is_system_generated boolean DEFAULT false NOT NULL,
  remarks text,
  recorded_by character varying(100) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id text NOT NULL,
  teacher_id text NOT NULL,
  campus_id text NOT NULL,
  employee_code character varying(50) NOT NULL,
  specialization character varying(150) DEFAULT 'Quran & Tajweed'::character varying,
  qualification character varying(150),
  joining_date date,
  salary numeric(12,2) DEFAULT 0.00,
  salary_currency character varying(10) DEFAULT 'PKR'::character varying,
  salary_day character varying(20) DEFAULT 'Friday'::character varying,
  status character varying(20) DEFAULT 'active'::character varying,
  assigned_class_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.teacher_salary_records (
  id text NOT NULL,
  teacher_id text NOT NULL,
  campus_id text NOT NULL,
  month_year text NOT NULL,
  pay_period text,
  basic_salary numeric(12,2) DEFAULT 0 NOT NULL,
  allowances numeric(12,2) DEFAULT 0 NOT NULL,
  deductions numeric(12,2) DEFAULT 0 NOT NULL,
  net_salary numeric(12,2) DEFAULT 0 NOT NULL,
  currency text NOT NULL,
  payment_status text DEFAULT 'PENDING'::text NOT NULL,
  payment_date date,
  payment_method text DEFAULT 'CASH'::text NOT NULL,
  audit_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.teaching_materials (
  id text NOT NULL,
  campus_id text NOT NULL,
  class_id text,
  teacher_id text,
  title text NOT NULL,
  type text NOT NULL,
  file_name text NOT NULL,
  file_size_mb numeric(8,2) DEFAULT 0 NOT NULL,
  description text,
  uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.user_campus_access (
  user_id text NOT NULL,
  campus_id text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.users (
  id text NOT NULL,
  email character varying(150),
  username character varying(100),
  first_name character varying(100) NOT NULL,
  last_name character varying(100) NOT NULL,
  role character varying(50) DEFAULT 'TEACHER'::character varying NOT NULL,
  active_campus_id text,
  status smallint DEFAULT 1,
  image text,
  contact_number character varying(50),
  allowed_campus_ids jsonb DEFAULT '["kts"]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  auth_user_id uuid
);

-- -----------------------------------------------------------------------------
-- 3. Primary keys, unique and check constraints (67)
-- -----------------------------------------------------------------------------
ALTER TABLE public.academic_progress ADD CONSTRAINT academic_progress_pkey PRIMARY KEY (id);
ALTER TABLE public.announcements ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.campuses ADD CONSTRAINT campuses_pkey PRIMARY KEY (id);
ALTER TABLE public.classes ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
ALTER TABLE public.documents ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
ALTER TABLE public.event_announcements ADD CONSTRAINT event_announcements_pkey PRIMARY KEY (id);
ALTER TABLE public.exam_results ADD CONSTRAINT exam_results_pkey PRIMARY KEY (id);
ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.incident_logs ADD CONSTRAINT incident_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.medical_records ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);
ALTER TABLE public.news ADD CONSTRAINT news_pkey PRIMARY KEY (id);
ALTER TABLE public.notification_logs ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.parent_profiles ADD CONSTRAINT parent_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_invoices ADD CONSTRAINT payment_invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.prayer_timings ADD CONSTRAINT prayer_timings_pkey PRIMARY KEY (id);
ALTER TABLE public.slider_images ADD CONSTRAINT slider_images_pkey PRIMARY KEY (id);
ALTER TABLE public.student_attendances ADD CONSTRAINT student_attendances_pkey PRIMARY KEY (id);
ALTER TABLE public.students ADD CONSTRAINT students_pkey PRIMARY KEY (id);
ALTER TABLE public.teacher_attendances ADD CONSTRAINT teacher_attendances_pkey PRIMARY KEY (id);
ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_pkey PRIMARY KEY (id);
ALTER TABLE public.teaching_materials ADD CONSTRAINT teaching_materials_pkey PRIMARY KEY (id);
ALTER TABLE public.user_campus_access ADD CONSTRAINT user_campus_access_pkey PRIMARY KEY (user_id, campus_id);
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.campuses ADD CONSTRAINT campuses_code_key UNIQUE (code);
ALTER TABLE public.parent_profiles ADD CONSTRAINT parent_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.student_attendances ADD CONSTRAINT student_attendances_student_id_class_id_date_key UNIQUE (student_id, class_id, date);
ALTER TABLE public.students ADD CONSTRAINT students_roll_number_key UNIQUE (roll_number);
ALTER TABLE public.teacher_attendances ADD CONSTRAINT teacher_attendances_teacher_id_date_key UNIQUE (teacher_id, date);
ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_employee_code_key UNIQUE (employee_code);
ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_teacher_id_key UNIQUE (teacher_id);
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_teacher_id_month_year_key UNIQUE (teacher_id, month_year);
ALTER TABLE public.academic_progress ADD CONSTRAINT academic_progress_tajweed_score_check CHECK (((tajweed_score >= 1) AND (tajweed_score <= 5)));
ALTER TABLE public.announcements ADD CONSTRAINT announcements_priority_check CHECK ((upper(priority) = ANY (ARRAY['NORMAL'::text, 'URGENT'::text])));
ALTER TABLE public.announcements ADD CONSTRAINT announcements_target_role_check CHECK ((upper(target_role) = ANY (ARRAY['ALL'::text, 'TEACHERS'::text, 'PARENTS'::text, 'CAMPUS_ADMINS'::text])));
ALTER TABLE public.campuses ADD CONSTRAINT campuses_currency_check CHECK ((upper((currency_code)::text) = ANY (ARRAY['PKR'::text, 'GBP'::text])));
ALTER TABLE public.classes ADD CONSTRAINT classes_admission_fee_check CHECK ((COALESCE(admission_fee, (0)::numeric) >= (0)::numeric));
ALTER TABLE public.classes ADD CONSTRAINT classes_capacity_check CHECK (((capacity IS NULL) OR (capacity > 0)));
ALTER TABLE public.documents ADD CONSTRAINT documents_size_bytes_check CHECK (((size_bytes IS NULL) OR (size_bytes >= 0)));
ALTER TABLE public.event_announcements ADD CONSTRAINT event_announcements_type_check CHECK ((upper((type)::text) = ANY (ARRAY['EXAM'::text, 'COMPETITION'::text, 'PARENT_MEETING'::text, 'PAST_EVENT'::text])));
ALTER TABLE public.exam_results ADD CONSTRAINT exam_results_marks_check CHECK (((max_marks > (0)::numeric) AND (marks_obtained >= (0)::numeric) AND (marks_obtained <= max_marks)));
ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_category_check CHECK ((upper((category)::text) = ANY (ARRAY['UTILITIES'::text, 'MAINTENANCE'::text, 'EVENTS'::text, 'SALARIES'::text, 'EDUCATIONAL_MATERIALS'::text, 'FACILITIES'::text])));
ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_amount_check CHECK ((amount >= (0)::numeric));
ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_currency_check CHECK ((upper((currency)::text) = ANY (ARRAY['PKR'::text, 'GBP'::text])));
ALTER TABLE public.notification_logs ADD CONSTRAINT notification_logs_status_check CHECK ((upper(status) = ANY (ARRAY['DELIVERED'::text, 'SENT'::text])));
ALTER TABLE public.notification_logs ADD CONSTRAINT notification_logs_channel_check CHECK ((upper(channel) = ANY (ARRAY['EMAIL'::text, 'WHATSAPP'::text, 'BOTH'::text])));
ALTER TABLE public.notification_logs ADD CONSTRAINT notification_logs_recipient_type_check CHECK ((upper(recipient_type) = ANY (ARRAY['PARENTS'::text, 'TEACHERS'::text, 'ALL'::text])));
ALTER TABLE public.payment_invoices ADD CONSTRAINT payment_invoices_amount_check CHECK ((amount >= (0)::numeric));
ALTER TABLE public.payment_invoices ADD CONSTRAINT payment_invoices_currency_check CHECK ((upper((currency)::text) = ANY (ARRAY['PKR'::text, 'GBP'::text])));
ALTER TABLE public.payment_invoices ADD CONSTRAINT payment_invoices_status_check CHECK (((payment_status IS NULL) OR (lower((payment_status)::text) = ANY (ARRAY['unpaid'::text, 'paid'::text, 'partial'::text, 'pending'::text, 'overdue'::text, 'cancelled'::text]))));
ALTER TABLE public.student_attendances ADD CONSTRAINT student_attendances_status_check CHECK ((upper((status)::text) = ANY (ARRAY['PRESENT'::text, 'ABSENT'::text, 'LATE'::text, 'EXCUSED'::text])));
ALTER TABLE public.students ADD CONSTRAINT students_gender_check CHECK (((gender IS NULL) OR (lower((gender)::text) = ANY (ARRAY['male'::text, 'female'::text]))));
ALTER TABLE public.students ADD CONSTRAINT students_fees_nonnegative_check CHECK (((COALESCE(admission_fee_amount, (0)::numeric) >= (0)::numeric) AND (COALESCE(monthly_fee_amount, (0)::numeric) >= (0)::numeric)));
ALTER TABLE public.students ADD CONSTRAINT students_status_check CHECK (((status IS NULL) OR (lower((status)::text) = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text]))));
ALTER TABLE public.students ADD CONSTRAINT students_approval_status_check CHECK (((approval_status IS NULL) OR (upper((approval_status)::text) = ANY (ARRAY['PENDING_APPROVAL'::text, 'APPROVED'::text, 'REJECTED'::text, 'ACTION_REQUIRED'::text]))));
ALTER TABLE public.students ADD CONSTRAINT students_fee_due_day_check CHECK (((fee_due_day IS NULL) OR ((fee_due_day >= 1) AND (fee_due_day <= 31))));
ALTER TABLE public.teacher_attendances ADD CONSTRAINT teacher_attendances_status_check CHECK ((upper((status)::text) = ANY (ARRAY['PRESENT'::text, 'ABSENT'::text, 'LATE'::text, 'LEAVE'::text])));
ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_salary_check CHECK ((COALESCE(salary, (0)::numeric) >= (0)::numeric));
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_deductions_check CHECK ((deductions >= (0)::numeric));
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_allowances_check CHECK ((allowances >= (0)::numeric));
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_basic_salary_check CHECK ((basic_salary >= (0)::numeric));
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_currency_check CHECK ((upper(currency) = ANY (ARRAY['PKR'::text, 'GBP'::text])));
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_payment_status_check CHECK ((upper(payment_status) = ANY (ARRAY['PAID'::text, 'PENDING'::text])));
ALTER TABLE public.teaching_materials ADD CONSTRAINT teaching_materials_type_check CHECK ((upper(type) = ANY (ARRAY['VIDEO'::text, 'PDF'::text, 'AUDIO'::text, 'SYLLABUS'::text])));
ALTER TABLE public.teaching_materials ADD CONSTRAINT teaching_materials_file_size_mb_check CHECK (((file_size_mb >= (0)::numeric) AND (file_size_mb <= (500)::numeric)));
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK ((upper((role)::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'CAMPUS_ADMIN'::text, 'TEACHER'::text, 'STUDENT'::text, 'PARENT'::text])));

-- -----------------------------------------------------------------------------
-- 4. Foreign keys (52)
-- -----------------------------------------------------------------------------
ALTER TABLE public.academic_progress ADD CONSTRAINT academic_progress_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT;
ALTER TABLE public.academic_progress ADD CONSTRAINT academic_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;
ALTER TABLE public.academic_progress ADD CONSTRAINT academic_progress_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.academic_progress ADD CONSTRAINT academic_progress_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.documents ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD CONSTRAINT documents_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.event_announcements ADD CONSTRAINT event_announcements_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.event_announcements ADD CONSTRAINT event_announcements_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE public.exam_results ADD CONSTRAINT exam_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;
ALTER TABLE public.exam_results ADD CONSTRAINT exam_results_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT;
ALTER TABLE public.exam_results ADD CONSTRAINT exam_results_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.expense_logs ADD CONSTRAINT expense_logs_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.incident_logs ADD CONSTRAINT incident_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;
ALTER TABLE public.incident_logs ADD CONSTRAINT incident_logs_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.medical_records ADD CONSTRAINT medical_records_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.medical_records ADD CONSTRAINT medical_records_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.medical_records ADD CONSTRAINT medical_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;
ALTER TABLE public.news ADD CONSTRAINT news_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.notification_logs ADD CONSTRAINT notification_logs_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.notification_logs ADD CONSTRAINT notification_logs_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.parent_profiles ADD CONSTRAINT parent_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.parent_profiles ADD CONSTRAINT parent_profiles_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.payment_invoices ADD CONSTRAINT payment_invoices_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.payment_invoices ADD CONSTRAINT payment_invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;
ALTER TABLE public.prayer_timings ADD CONSTRAINT prayer_timings_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.slider_images ADD CONSTRAINT slider_images_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.student_attendances ADD CONSTRAINT student_attendances_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.student_attendances ADD CONSTRAINT student_attendances_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT;
ALTER TABLE public.student_attendances ADD CONSTRAINT student_attendances_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;
ALTER TABLE public.students ADD CONSTRAINT students_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD CONSTRAINT students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.teacher_attendances ADD CONSTRAINT teacher_attendances_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.teacher_attendances ADD CONSTRAINT teacher_attendances_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.teacher_profiles ADD CONSTRAINT teacher_profiles_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE public.teacher_salary_records ADD CONSTRAINT teacher_salary_records_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.teaching_materials ADD CONSTRAINT teaching_materials_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.teaching_materials ADD CONSTRAINT teaching_materials_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.teaching_materials ADD CONSTRAINT teaching_materials_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE public.user_campus_access ADD CONSTRAINT user_campus_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.user_campus_access ADD CONSTRAINT user_campus_access_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT;
ALTER TABLE public.users ADD CONSTRAINT users_active_campus_id_fkey FOREIGN KEY (active_campus_id) REFERENCES campuses(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 5. Indexes (35)
-- -----------------------------------------------------------------------------
CREATE INDEX academic_progress_student_date_idx ON public.academic_progress USING btree (student_id, date DESC);
CREATE INDEX academic_progress_class_idx ON public.academic_progress USING btree (class_id);
CREATE INDEX announcements_campus_published_idx ON public.announcements USING btree (campus_id, published_at DESC);
CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);
CREATE INDEX audit_logs_campus_created_idx ON public.audit_logs USING btree (campus_id, created_at DESC);
CREATE INDEX classes_campus_id_idx ON public.classes USING btree (campus_id);
CREATE INDEX classes_teacher_id_idx ON public.classes USING btree (teacher_id);
CREATE UNIQUE INDEX classes_campus_code_active_key ON public.classes USING btree (campus_id, upper((code)::text)) WHERE is_active;
CREATE INDEX documents_type_reference_idx ON public.documents USING btree (type, reference_id);
CREATE INDEX event_announcements_campus_date_idx ON public.event_announcements USING btree (campus_id, date_time);
CREATE INDEX exam_results_student_idx ON public.exam_results USING btree (student_id);
CREATE INDEX exam_results_class_idx ON public.exam_results USING btree (class_id);
CREATE INDEX expense_logs_campus_date_idx ON public.expense_logs USING btree (campus_id, date DESC);
CREATE INDEX incident_logs_student_id_idx ON public.incident_logs USING btree (student_id);
CREATE INDEX incident_logs_campus_created_idx ON public.incident_logs USING btree (campus_id, created_at DESC);
CREATE INDEX medical_records_student_id_idx ON public.medical_records USING btree (student_id);
CREATE INDEX notification_logs_campus_created_idx ON public.notification_logs USING btree (campus_id, created_at DESC);
CREATE INDEX parent_profiles_campus_id_idx ON public.parent_profiles USING btree (campus_id);
CREATE INDEX payment_invoices_campus_created_idx ON public.payment_invoices USING btree (campus_id, created_at DESC);
CREATE INDEX payment_invoices_student_id_idx ON public.payment_invoices USING btree (student_id);
CREATE INDEX student_attendances_student_id_idx ON public.student_attendances USING btree (student_id);
CREATE INDEX student_attendances_class_date_idx ON public.student_attendances USING btree (class_id, date);
CREATE INDEX students_parent_id_idx ON public.students USING btree (parent_id);
CREATE INDEX students_campus_id_idx ON public.students USING btree (campus_id);
CREATE INDEX students_class_id_idx ON public.students USING btree (class_id);
CREATE INDEX teacher_attendances_campus_date_idx ON public.teacher_attendances USING btree (campus_id, date);
CREATE INDEX teacher_attendances_teacher_idx ON public.teacher_attendances USING btree (teacher_id);
CREATE INDEX teacher_profiles_campus_id_idx ON public.teacher_profiles USING btree (campus_id);
CREATE INDEX teacher_salary_records_campus_idx ON public.teacher_salary_records USING btree (campus_id, month_year);
CREATE INDEX teaching_materials_campus_idx ON public.teaching_materials USING btree (campus_id, uploaded_at DESC);
CREATE INDEX teaching_materials_class_idx ON public.teaching_materials USING btree (class_id);
CREATE INDEX user_campus_access_campus_id_idx ON public.user_campus_access USING btree (campus_id);
CREATE UNIQUE INDEX users_auth_user_id_key ON public.users USING btree (auth_user_id) WHERE (auth_user_id IS NOT NULL);
CREATE UNIQUE INDEX users_username_lower_key ON public.users USING btree (lower((username)::text)) WHERE (username IS NOT NULL);
CREATE UNIQUE INDEX users_email_lower_key ON public.users USING btree (lower((email)::text)) WHERE (email IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 6. Triggers (23)
-- -----------------------------------------------------------------------------
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.academic_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.campuses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event_announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.exam_results FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expense_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.incident_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.parent_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payment_invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prayer_timings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.slider_images FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.student_attendances FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_enforce_teacher_attendance_rules BEFORE INSERT OR UPDATE ON public.teacher_attendances FOR EACH ROW EXECUTE FUNCTION validate_teacher_attendance_time_rules();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teacher_attendances FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teacher_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teacher_salary_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teaching_materials FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Row Level Security (25)
-- -----------------------------------------------------------------------------
ALTER TABLE public.academic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slider_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_campus_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 8. Policies (52)
-- -----------------------------------------------------------------------------
CREATE POLICY progress_read ON public.academic_progress AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_staff_for(campus_id) OR app_is_parent_of(student_id)));
CREATE POLICY progress_write ON public.academic_progress AS PERMISSIVE FOR ALL TO authenticated USING ((app_is_admin_for(campus_id) OR (teacher_id = app_current_user_id()))) WITH CHECK (app_is_staff_for(campus_id));
CREATE POLICY announcements_read ON public.announcements AS PERMISSIVE FOR SELECT TO authenticated USING (((campus_id IS NULL) OR app_has_campus(campus_id)));
CREATE POLICY announcements_write ON public.announcements AS PERMISSIVE FOR ALL TO authenticated USING (
CASE
    WHEN (campus_id IS NULL) THEN (app_current_role() = 'SUPER_ADMIN'::text)
    ELSE app_is_admin_for(campus_id)
END) WITH CHECK (
CASE
    WHEN (campus_id IS NULL) THEN (app_current_role() = 'SUPER_ADMIN'::text)
    ELSE app_is_admin_for(campus_id)
END);
CREATE POLICY audit_insert_self ON public.audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((app_current_user_id() IS NOT NULL) AND ((user_id IS NULL) OR (user_id = app_current_user_id()))));
CREATE POLICY audit_read_admin ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (((app_current_role() = 'SUPER_ADMIN'::text) OR ((campus_id IS NOT NULL) AND app_is_admin_for(campus_id))));
CREATE POLICY campuses_read_public ON public.campuses AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY campuses_write_super ON public.campuses AS PERMISSIVE FOR ALL TO authenticated USING ((app_current_role() = 'SUPER_ADMIN'::text)) WITH CHECK ((app_current_role() = 'SUPER_ADMIN'::text));
CREATE POLICY classes_read ON public.classes AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_staff_for(campus_id) OR (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.class_id = classes.id) AND app_is_parent_of(s.id))))));
CREATE POLICY classes_write ON public.classes AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY documents_read ON public.documents AS PERMISSIVE FOR SELECT TO authenticated USING (app_is_staff_for(campus_id));
CREATE POLICY documents_write ON public.documents AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY events_read ON public.event_announcements AS PERMISSIVE FOR SELECT TO authenticated USING (app_has_campus(campus_id));
CREATE POLICY events_write ON public.event_announcements AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY exams_read ON public.exam_results AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_staff_for(campus_id) OR app_is_parent_of(student_id)));
CREATE POLICY exams_write ON public.exam_results AS PERMISSIVE FOR ALL TO authenticated USING ((app_is_admin_for(campus_id) OR app_is_teacher_of_class(class_id))) WITH CHECK ((app_is_admin_for(campus_id) OR app_is_teacher_of_class(class_id)));
CREATE POLICY expenses_admin ON public.expense_logs AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY incidents_delete ON public.incident_logs AS PERMISSIVE FOR DELETE TO authenticated USING (app_is_admin_for(campus_id));
CREATE POLICY incidents_insert ON public.incident_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (app_is_staff_for(campus_id));
CREATE POLICY incidents_modify ON public.incident_logs AS PERMISSIVE FOR UPDATE TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY incidents_read ON public.incident_logs AS PERMISSIVE FOR SELECT TO authenticated USING (app_is_staff_for(campus_id));
CREATE POLICY medical_delete ON public.medical_records AS PERMISSIVE FOR DELETE TO authenticated USING (app_is_admin_for(campus_id));
CREATE POLICY medical_insert ON public.medical_records AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (app_is_staff_for(campus_id));
CREATE POLICY medical_modify ON public.medical_records AS PERMISSIVE FOR UPDATE TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY medical_read ON public.medical_records AS PERMISSIVE FOR SELECT TO authenticated USING (app_is_staff_for(campus_id));
CREATE POLICY news_read_public ON public.news AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY news_write_admin ON public.news AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY notifications_read ON public.notification_logs AS PERMISSIVE FOR SELECT TO authenticated USING (((campus_id IS NULL) OR app_is_staff_for(campus_id)));
CREATE POLICY notifications_write ON public.notification_logs AS PERMISSIVE FOR ALL TO authenticated USING (
CASE
    WHEN (campus_id IS NULL) THEN (app_current_role() = 'SUPER_ADMIN'::text)
    ELSE app_is_admin_for(campus_id)
END) WITH CHECK (
CASE
    WHEN (campus_id IS NULL) THEN (app_current_role() = 'SUPER_ADMIN'::text)
    ELSE app_is_admin_for(campus_id)
END);
CREATE POLICY parent_profiles_read ON public.parent_profiles AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = app_current_user_id()) OR app_is_staff_for(campus_id)));
CREATE POLICY parent_profiles_write ON public.parent_profiles AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY invoices_read ON public.payment_invoices AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_admin_for(campus_id) OR ((student_id IS NOT NULL) AND app_is_parent_of(student_id))));
CREATE POLICY invoices_write ON public.payment_invoices AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY prayer_read_public ON public.prayer_timings AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY prayer_write_admin ON public.prayer_timings AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY slider_read_public ON public.slider_images AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY slider_write_admin ON public.slider_images AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY student_att_read ON public.student_attendances AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_admin_for(campus_id) OR app_is_teacher_of_class(class_id) OR app_is_parent_of(student_id)));
CREATE POLICY student_att_write ON public.student_attendances AS PERMISSIVE FOR ALL TO authenticated USING ((app_is_admin_for(campus_id) OR app_is_teacher_of_class(class_id))) WITH CHECK ((app_is_admin_for(campus_id) OR app_is_teacher_of_class(class_id)));
CREATE POLICY students_read ON public.students AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_staff_for(campus_id) OR (parent_id = app_current_user_id())));
CREATE POLICY students_write ON public.students AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY teacher_att_read ON public.teacher_attendances AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_admin_for(campus_id) OR (teacher_id = app_current_user_id())));
CREATE POLICY teacher_att_write ON public.teacher_attendances AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY teacher_profiles_read ON public.teacher_profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_staff_for(campus_id) OR (teacher_id = app_current_user_id())));
CREATE POLICY teacher_profiles_write ON public.teacher_profiles AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY salary_read ON public.teacher_salary_records AS PERMISSIVE FOR SELECT TO authenticated USING ((app_is_admin_for(campus_id) OR (teacher_id = app_current_user_id())));
CREATE POLICY salary_write ON public.teacher_salary_records AS PERMISSIVE FOR ALL TO authenticated USING (app_is_admin_for(campus_id)) WITH CHECK (app_is_admin_for(campus_id));
CREATE POLICY materials_read ON public.teaching_materials AS PERMISSIVE FOR SELECT TO authenticated USING (app_is_staff_for(campus_id));
CREATE POLICY materials_write ON public.teaching_materials AS PERMISSIVE FOR ALL TO authenticated USING ((app_is_admin_for(campus_id) OR (teacher_id = app_current_user_id()))) WITH CHECK (app_is_staff_for(campus_id));
CREATE POLICY uca_read_self ON public.user_campus_access AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = app_current_user_id()) OR (app_current_role() = 'SUPER_ADMIN'::text)));
CREATE POLICY users_read_self ON public.users AS PERMISSIVE FOR SELECT TO authenticated USING ((auth_user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY users_read_staff ON public.users AS PERMISSIVE FOR SELECT TO authenticated USING (((app_current_role() = ANY (ARRAY['SUPER_ADMIN'::text, 'CAMPUS_ADMIN'::text, 'TEACHER'::text])) AND app_shares_campus_with(id)));

-- -----------------------------------------------------------------------------
-- 9. Grants: deny by default (a new Supabase project grants everything to the
--    API roles), then grant exactly what the original project grants.
-- -----------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.academic_progress TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.announcements TO authenticated;
GRANT INSERT, SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.campuses TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.campuses TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.classes TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.documents TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.event_announcements TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.exam_results TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.expense_logs TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.incident_logs TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.medical_records TO authenticated;
GRANT SELECT ON public.news TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.news TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.notification_logs TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.parent_profiles TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.payment_invoices TO authenticated;
GRANT SELECT ON public.prayer_timings TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.prayer_timings TO authenticated;
GRANT SELECT ON public.slider_images TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.slider_images TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.student_attendances TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.students TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.teacher_attendances TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.teacher_profiles TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.teacher_salary_records TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.teaching_materials TO authenticated;
GRANT SELECT ON public.user_campus_access TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_has_campus(p_campus_id text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_is_admin_for(p_campus_id text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_is_parent_of(p_student_id text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_is_staff_for(p_campus_id text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_is_teacher_of_class(p_class_id text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_shares_campus_with(p_user_id text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_teacher_attendance_time_rules() TO anon;
GRANT EXECUTE ON FUNCTION public.validate_teacher_attendance_time_rules() TO authenticated;

-- -----------------------------------------------------------------------------
-- 10. Private Storage bucket for documents (server-only access; no policies)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'misbah-documents', 'misbah-documents', false, 26214400,  -- 25 MB
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']
)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
                               allowed_mime_types = EXCLUDED.allowed_mime_types;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Result: compare with the expected numbers on the right.
SELECT 'tables' AS check_name, count(*)::text AS value, '25' AS expected
  FROM pg_tables WHERE schemaname = 'public'
UNION ALL SELECT 'tables with RLS', count(*)::text, '25' FROM pg_tables WHERE schemaname = 'public' AND rowsecurity
UNION ALL SELECT 'policies', count(*)::text, '52' FROM pg_policies WHERE schemaname = 'public'
UNION ALL SELECT 'foreign keys', count(*)::text, '52' FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public' AND c.contype = 'f'
UNION ALL SELECT 'triggers', count(*)::text, '23' FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND NOT t.tgisinternal
UNION ALL SELECT 'anon can read tables', count(DISTINCT table_name)::text, '4' FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee = 'anon'
UNION ALL SELECT 'documents bucket private', (SELECT (NOT public)::text FROM storage.buckets WHERE id = 'misbah-documents'), 'true';
