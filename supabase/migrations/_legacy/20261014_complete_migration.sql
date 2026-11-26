-- ==============================================================================
-- MISBAH-UL-QURAN IMS — COMPLETE SUPABASE POSTGRESQL PRODUCTION MIGRATION
-- Generated: 2026-10-14
-- Preserves all legacy MySQL records (users, teachers, classes, invoices, timings)
-- and provisions multi-campus UK & KTS Pakistan institutional architecture.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- CLEAN INITIALIZATION / SAFE RE-RUN PROTECTION
-- Drops existing tables/views with CASCADE so the schema and legacy data re-provision
-- without column mismatch or policy duplicate errors.
-- ==============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. Drop any views first
    FOR r IN (
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
          AND table_name IN ('profiles')
    ) LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;

    -- 2. Drop tables cleanly
    FOR r IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE' 
          AND table_name IN (
            'audit_logs', 'incident_logs', 'medical_logs', 'academic_progress', 
            'payment_invoices', 'fee_payments', 'student_fees', 'fee_structures', 
            'student_attendances', 'teacher_attendances', 'students', 'classes', 
            'teacher_profiles', 'teachers', 'parents', 'user_campuses', 'profiles', 
            'users', 'campuses', 'prayer_timings', 'news', 'slider_images', 'document_uplouds'
          )
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END $$;


-- ==============================================================================
-- 1. CAMPUSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS campuses (
    id TEXT PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Karachi',
    currency_code VARCHAR(10) NOT NULL DEFAULT 'PKR',
    phone VARCHAR(50),
    email VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- Ensure all columns exist even if campuses table was created previously:
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS code VARCHAR(30);
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS name VARCHAR(150);
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Pakistan';
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Haripur';
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Karachi';
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'PKR';
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO campuses (id, code, name, country, city, address, timezone, currency_code, phone, email)
VALUES 
    ('all', 'GLOBAL', 'All Campuses (Headquarters)', 'Global', 'Global', 'International Central Office', 'UTC', 'GBP', '+44 20 7946 0192', 'global@misbahulquran.org'),
    ('uk', 'UK-01', 'UK Campus', 'United Kingdom', 'London', '142 Whitechapel Road, London E1 1JE', 'Europe/London', 'GBP', '+44 20 7946 0192', 'london@misbahulquran.org'),
    ('kts', 'KTS-01', 'KTS Pakistan Campus', 'Pakistan', 'Haripur', 'Sector 3, Khalabat Township, Haripur, KPK', 'Asia/Karachi', 'PKR', '+92 995 612345', 'kts@misbahulquran.org')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    timezone = EXCLUDED.timezone,
    currency_code = EXCLUDED.currency_code;

-- ==============================================================================
-- 2. USERS TABLE (Accounts across Super Admin, Campus Admin, Teachers, Parents)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email VARCHAR(150),
    username VARCHAR(100),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'TEACHER', -- SUPER_ADMIN, CAMPUS_ADMIN, TEACHER, PARENT
    active_campus_id TEXT REFERENCES campuses(id) ON DELETE SET NULL,
    status SMALLINT DEFAULT 1,
    image TEXT,
    contact_number VARCHAR(50),
    allowed_campus_ids JSONB DEFAULT '["kts"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Profiles view / table for Supabase Auth integration compatibility
CREATE OR REPLACE VIEW profiles AS
SELECT 
    id, email, username, first_name || ' ' || last_name AS full_name,
    role, active_campus_id, status, image, contact_number, created_at, updated_at
FROM users;

-- Legacy MySQL Users Data Insertion:
INSERT INTO users (id, first_name, last_name, email, password, status, image, contact_number, role, active_campus_id, allowed_campus_ids, created_at, updated_at)
VALUES
(1::text, 'Ahsan', 'Hanif', 'ahsanhanif99@gmail.com', '$2y$12$UvTqc59Eh6/i5MyJ8HR5AufdrseM8G0HkoW8XKe/B3bM6qYu31d36', 1, NULL, '923300000001', 'SUPER_ADMIN', 'kts', '["all", "uk", "kts"]'::jsonb, '2026-01-20 03:24:23'::timestamptz, '2026-01-20 03:24:23'::timestamptz),
(2::text, 'Teacher1', 'Lastname1', 'teacher1@gmail.com', '$2y$12$UQ17Fpjhc/JVVJpuODlWSu2.F2va3CXgdsHyw4aHbcNa6vfUuRH76', 1, NULL, '923300000001', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:23'::timestamptz, '2026-01-20 03:24:23'::timestamptz),
(3::text, 'Teacher2', 'Lastname2', 'teacher2@gmail.com', '$2y$12$WmRaCVwgJIZTRnsAqHvqqufXggegghE3.oe5yfwx24HjU6ASuwkU6', 1, NULL, '923300000002', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
(4::text, 'Teacher3', 'Lastname3', 'teacher3@gmail.com', '$2y$12$2DEkuN1/sT5fsOAF1vd73OVDjjUDhivtz84TJCPtaVNowsHVf265W', 1, NULL, '923300000003', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
(5::text, 'Teacher4', 'Lastname4', 'teacher4@gmail.com', '$2y$12$vDRkxwTJWTfLXhlaJI5F2u6krdOEWOH6XjpIlXC5SdT319HOOSJKW', 1, NULL, '923300000004', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
(6::text, 'Teacher5', 'Lastname5', 'teacher5@gmail.com', '$2y$12$.NpDsAxK.yXzG8/4QeQ1WO6Jv12pqcMGJKrC8t/jVY79yiZWtF0IO', 1, NULL, '923300000005', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
(7::text, 'Parent1', 'Lastname1', 'parent1@gmail.com', '$2y$12$TKZ6f5hDNuU/ocsFMjVlV./hkv9HMOJrgCnDX6k3jCtNgLxgdQa7y', 1, NULL, '923310000001', 'PARENT', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:25'::timestamptz, '2026-01-20 03:24:25'::timestamptz),
(8::text, 'Parent2', 'Lastname2', 'parent2@gmail.com', '$2y$12$H4HX/lpcz9Imt75QTC4dROTdn.DWUBs/MZsO2zEp..bl6ww7VLgS6', 1, NULL, '923310000002', 'PARENT', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:25'::timestamptz, '2026-01-20 03:24:25'::timestamptz),
(9::text, 'Parent3', 'Lastname3', 'parent3@gmail.com', '$2y$12$GIKT958Jzfk5BSnfOgw/HeSGsiH5qZnJ5kQxoXhJZRuXR1wAsHJxq', 1, NULL, '923310000003', 'PARENT', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:25'::timestamptz, '2026-01-20 03:24:25'::timestamptz),
(10::text, 'Parent4', 'Lastname4', 'parent4@gmail.com', '$2y$12$gwF.K.AXHJulwPOeYQ52j.kE94JU.R5azZAfg2bbpgLqI/Jdc1HYi', 1, NULL, '923310000004', 'PARENT', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
(12::text, 'test', 'teacher', NULL, '$2y$12$gVmxie.gcDz8S3he251RBO3T3VwKNcGWNivTEic/s0vND6UrLaDTO', 1, NULL, '326527836', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-05-18 01:52:56'::timestamptz, '2026-05-18 01:52:56'::timestamptz),
(13::text, 'test', 'teacher 2', NULL, '$2y$12$Sn6Lj3p.OpSPq/SpcGrJWuK3BLbb2x6kc1EI9/UjC.F9koyCYVD1O', 1, NULL, '495728', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-05-18 01:57:13'::timestamptz, '2026-05-18 01:57:13'::timestamptz),
(14::text, 'new', '7090', 'new@email.com', '$2y$12$5OWsAqjESDpfbRNZFSdroe.JxugblHEnVOmKyT1gp8N3tdCXKe.ey', 1, NULL, '37463824632', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-06-23 02:33:07'::timestamptz, '2026-06-23 02:33:07'::timestamptz),
('usr-super-01', 'Muhammad', 'Ibrahim', 'superadmin@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0192', 'SUPER_ADMIN', 'all', '["all", "uk", "kts"]'::jsonb, now(), now()),
('usr-admin-uk-01', 'Tariq', 'Mahmood', 'admin.uk@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0193', 'CAMPUS_ADMIN', 'uk', '["uk"]'::jsonb, now(), now()),
('usr-admin-kts-01', 'Abdul Rehman', 'Khan', 'admin.kts@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+92 995 612345', 'CAMPUS_ADMIN', 'kts', '["kts"]'::jsonb, now(), now()),
('usr-teach-uk-01', 'Hasan', 'Al-Baqir', 'teacher.uk@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0194', 'TEACHER', 'uk', '["uk"]'::jsonb, now(), now()),
('usr-parent-uk-01', 'Farhan', 'Siddique', 'parent.uk@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0195', 'PARENT', 'uk', '["uk"]'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. CLASSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    admission_fee NUMERIC(12,2) DEFAULT 0.00,
    description TEXT,
    teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    capacity INT DEFAULT 25,
    academic_year VARCHAR(30) DEFAULT '2025-2026',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Legacy MySQL Classes Insertion:
INSERT INTO classes (id, campus_id, title, admission_fee, description, teacher_id, created_at, updated_at)
VALUES
(1::text, 'kts', 'B-1', 100.00, 'Junior Boys Section', NULL, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
(2::text, 'kts', 'B-2', 100.00, 'Senior Boys Section', NULL, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
(3::text, 'kts', 'G-1', 200.00, 'Junior Girls Section', NULL, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
(4::text, 'kts', 'G-2', 200.00, 'Senior Girls Section', NULL, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
(5::text, 'kts', 'Hifz', 500.00, 'Boys Only', NULL, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
(6::text, 'kts', 'B-1', 100.00, 'Junior Boys Section', NULL, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
(7::text, 'kts', 'B-2', 100.00, 'Senior Boys Section', NULL, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
(8::text, 'kts', 'G-1', 200.00, 'Junior Girls Section', NULL, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
(9::text, 'kts', 'G-2', 200.00, 'Senior Girls Section', NULL, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
(10::text, 'kts', 'Hifz', 500.00, 'Boys Only', NULL, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
(11::text, 'kts', 'B-1', 100.00, 'Junior Boys Section', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(12::text, 'kts', 'B-2', 100.00, 'Senior Boys Section', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(13::text, 'kts', 'G-1', 200.00, 'Junior Girls Section', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(14::text, 'kts', 'G-2', 200.00, 'Senior Girls Section', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(15::text, 'kts', 'Hifz', 500.00, 'Boys Only', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('cls-uk-01', 'uk', 'Hifz Section London', 15.00, 'Memorization & Tajweed', 'usr-teach-uk-01', now(), now()),
('cls-uk-02', 'uk', 'Noorani Qaida Group A', 15.00, 'Foundation Reading', 'usr-teach-uk-01', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. TEACHER PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id TEXT PRIMARY KEY,
    teacher_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(150) DEFAULT 'Quran & Tajweed',
    qualification VARCHAR(150),
    joining_date DATE,
    salary NUMERIC(12,2) DEFAULT 0.00,
    salary_currency VARCHAR(10) DEFAULT 'PKR',
    salary_day VARCHAR(20) DEFAULT 'Friday',
    status VARCHAR(20) DEFAULT 'active',
    assigned_class_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Legacy MySQL Teacher Profiles Insertion:
INSERT INTO teacher_profiles (id, teacher_id, campus_id, employee_code, joining_date, salary, salary_currency, salary_day, status, created_at, updated_at)
VALUES
(1::text, 2::text, 'kts', 'TCH-KTS-1', '2024-01-20'::date, 55000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:23'::timestamptz, '2026-01-20 03:24:23'::timestamptz),
(2::text, 3::text, 'kts', 'TCH-KTS-2', '2024-01-20'::date, 60000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
(3::text, 4::text, 'kts', 'TCH-KTS-3', '2024-01-20'::date, 65000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
(4::text, 5::text, 'kts', 'TCH-KTS-4', '2024-01-20'::date, 70000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
(5::text, 6::text, 'kts', 'TCH-KTS-5', '2024-01-20'::date, 75000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
(6::text, 12::text, 'kts', 'TCH-KTS-6', '2026-05-18'::date, 445.00, 'PKR', 'Friday', 'active', '2026-05-18 01:52:56'::timestamptz, '2026-05-18 01:52:56'::timestamptz),
(7::text, 13::text, 'kts', 'TCH-KTS-7', '2026-05-18'::date, 44.00, 'PKR', 'Friday', 'active', '2026-05-18 01:57:13'::timestamptz, '2026-05-18 01:57:13'::timestamptz),
(8::text, 14::text, 'kts', 'TCH-KTS-8', '2026-06-23'::date, 566.00, 'PKR', 'Friday', 'active', '2026-06-23 02:33:07'::timestamptz, '2026-06-23 02:33:07'::timestamptz),
('tch-uk-01', 'usr-teach-uk-01', 'uk', 'TCH-UK-001', '2024-01-10'::date, 2800.00, 'GBP', 'Friday', 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 5. STUDENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    date_of_birth DATE,
    gender VARCHAR(20) DEFAULT 'female',
    address TEXT,
    primary_contact_details JSONB,
    secondary_contact_details JSONB,
    medical_history TEXT,
    allowed_medicines TEXT,
    admission_date DATE,
    admission_fee_amount NUMERIC(12,2) DEFAULT 0.00,
    monthly_fee_amount NUMERIC(12,2) DEFAULT 0.00,
    fee_due_day INT DEFAULT 10,
    default_payment_method VARCHAR(50) DEFAULT 'cash',
    approval_status VARCHAR(50) DEFAULT 'APPROVED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Legacy MySQL Student Insertion:
INSERT INTO students (id, campus_id, parent_id, class_id, first_name, last_name, roll_number, status, date_of_birth, gender, address, admission_date, admission_fee_amount, monthly_fee_amount, fee_due_day, default_payment_method, created_at, updated_at)
VALUES
('std-uk-01', 'uk', 'usr-parent-uk-01', 'cls-uk-01', 'Bilal', 'Siddique', 'MUQ-UK-2026-0001', 'active', '2013-05-12'::date, 'male', '14 Romford Road, London E15 4BZ', '2024-01-15'::date, 15.00, 30.00, 10, 'Bank Transfer (SumUp)', now(), now()),
('std-uk-02', 'uk', 'usr-parent-uk-01', 'cls-uk-02', 'Maryam', 'Siddique', 'MUQ-UK-2026-0002', 'active', '2016-08-22'::date, 'female', '14 Romford Road, London E15 4BZ', '2024-02-01'::date, 15.00, 25.00, 10, 'Bank Transfer (SumUp)', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 6. ATTENDANCE MANAGEMENT (STUDENT & STRICT TIME-WINDOW TEACHER ATTENDANCE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_attendances (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    arrival_time VARCHAR(20),
    rule_applied VARCHAR(100),
    remarks TEXT,
    recorded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, class_id, date)
);

CREATE TABLE IF NOT EXISTS teacher_attendances (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    rule_applied VARCHAR(100),
    is_system_generated BOOLEAN NOT NULL DEFAULT false,
    remarks TEXT,
    recorded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(teacher_id, date)
);

-- Teacher Attendance Strict Time Rule Validation Trigger
CREATE OR REPLACE FUNCTION validate_teacher_attendance_time_rules()
RETURNS TRIGGER AS $$
DECLARE
    campus_tz text;
    local_time time;
    check_ts timestamptz;
    total_seconds int;
BEGIN
    SELECT COALESCE(timezone, 'Asia/Karachi') INTO campus_tz FROM campuses WHERE id = NEW.campus_id;
    IF campus_tz IS NULL THEN
        campus_tz := 'Asia/Karachi';
    END IF;

    check_ts := COALESCE(NEW.check_in_time, timezone('utc'::text, now()));
    local_time := (check_ts AT TIME ZONE campus_tz)::time;
    total_seconds := EXTRACT(HOUR FROM local_time) * 3600 + EXTRACT(MINUTE FROM local_time) * 60 + EXTRACT(SECOND FROM local_time);

    IF total_seconds <= 61200 THEN
        -- Up to 5:00:00 PM: Allow PRESENT or ABSENT
        IF NEW.status NOT IN ('PRESENT', 'ABSENT', 'LEAVE') THEN
            NEW.status := 'PRESENT';
        END IF;
        NEW.rule_applied := 'UP_TO_5PM';
    ELSIF total_seconds > 61200 AND total_seconds <= 63000 THEN
        -- Between 5:00:01 PM and 5:30:00 PM: Allow LATE or ABSENT
        IF NEW.status = 'PRESENT' THEN
            NEW.status := 'LATE';
        END IF;
        NEW.rule_applied := 'LATE_WINDOW_5_01_TO_5_30';
    ELSE
        -- After 5:30:00 PM: Status MUST be ABSENT
        NEW.status := 'ABSENT';
        NEW.is_system_generated := true;
        NEW.rule_applied := 'AFTER_5_30PM_AUTO_ABSENT';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_teacher_attendance_rules ON teacher_attendances;
CREATE TRIGGER trigger_enforce_teacher_attendance_rules
    BEFORE INSERT OR UPDATE ON teacher_attendances
    FOR EACH ROW
    EXECUTE FUNCTION validate_teacher_attendance_time_rules();

-- ==============================================================================
-- 7. PAYMENT INVOICES (238 Preserved Legacy Invoices + Multi-Currency)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS payment_invoices (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'fee_invoice',
    reference_id TEXT,
    due_date DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migrating 238 Historical MySQL Payment Invoices:
INSERT INTO payment_invoices (id, campus_id, type, reference_id, due_date, amount, currency, payment_method, payment_status, payment_date, created_at, updated_at)
VALUES
(1::text, 'kts', 'fee_invoice', 2::text, '2026-05-08'::date, 980.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(2::text, 'kts', 'fee_invoice', 2::text, '2026-06-08'::date, 980.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(3::text, 'kts', 'fee_invoice', 3::text, '2026-05-08'::date, 1634.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(4::text, 'kts', 'fee_invoice', 3::text, '2026-06-08'::date, 1634.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(5::text, 'kts', 'fee_invoice', 4::text, '2026-05-08'::date, 1589.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(6::text, 'kts', 'fee_invoice', 4::text, '2026-06-08'::date, 1589.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(7::text, 'kts', 'fee_invoice', 5::text, '2026-05-08'::date, 1655.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(8::text, 'kts', 'fee_invoice', 5::text, '2026-06-08'::date, 1655.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(9::text, 'kts', 'fee_invoice', 6::text, '2026-05-08'::date, 1476.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(10::text, 'kts', 'fee_invoice', 6::text, '2026-06-08'::date, 1476.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(11::text, 'kts', 'fee_invoice', 7::text, '2026-05-08'::date, 1257.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(12::text, 'kts', 'fee_invoice', 7::text, '2026-06-08'::date, 1257.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(13::text, 'kts', 'fee_invoice', 8::text, '2026-05-08'::date, 911.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(14::text, 'kts', 'fee_invoice', 8::text, '2026-06-08'::date, 911.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(15::text, 'kts', 'fee_invoice', 9::text, '2026-05-08'::date, 1196.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(16::text, 'kts', 'fee_invoice', 9::text, '2026-06-08'::date, 1196.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(17::text, 'kts', 'fee_invoice', 10::text, '2026-05-08'::date, 1027.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(18::text, 'kts', 'fee_invoice', 10::text, '2026-06-08'::date, 1027.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(19::text, 'kts', 'fee_invoice', 11::text, '2026-05-08'::date, 1277.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(20::text, 'kts', 'fee_invoice', 11::text, '2026-06-08'::date, 1277.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(21::text, 'kts', 'fee_invoice', 12::text, '2026-05-08'::date, 1808.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(22::text, 'kts', 'fee_invoice', 12::text, '2026-06-08'::date, 1808.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(23::text, 'kts', 'fee_invoice', 13::text, '2026-05-08'::date, 1110.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(24::text, 'kts', 'fee_invoice', 13::text, '2026-06-08'::date, 1110.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(25::text, 'kts', 'fee_invoice', 14::text, '2026-05-08'::date, 1514.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(26::text, 'kts', 'fee_invoice', 14::text, '2026-06-08'::date, 1514.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(27::text, 'kts', 'fee_invoice', 15::text, '2026-05-08'::date, 1531.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(28::text, 'kts', 'fee_invoice', 15::text, '2026-06-08'::date, 1531.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(29::text, 'kts', 'fee_invoice', 16::text, '2026-05-08'::date, 1185.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(30::text, 'kts', 'fee_invoice', 16::text, '2026-06-08'::date, 1185.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(31::text, 'kts', 'fee_invoice', 17::text, '2026-05-08'::date, 1132.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(32::text, 'kts', 'fee_invoice', 17::text, '2026-06-08'::date, 1132.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(33::text, 'kts', 'fee_invoice', 18::text, '2026-05-08'::date, 1057.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(34::text, 'kts', 'fee_invoice', 18::text, '2026-06-08'::date, 1057.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(35::text, 'kts', 'fee_invoice', 19::text, '2026-05-08'::date, 1520.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(36::text, 'kts', 'fee_invoice', 19::text, '2026-06-08'::date, 1520.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(37::text, 'kts', 'fee_invoice', 20::text, '2026-05-08'::date, 1266.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(38::text, 'kts', 'fee_invoice', 20::text, '2026-06-08'::date, 1266.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(39::text, 'kts', 'fee_invoice', 21::text, '2026-05-08'::date, 1486.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(40::text, 'kts', 'fee_invoice', 21::text, '2026-06-08'::date, 1486.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(41::text, 'kts', 'fee_invoice', 22::text, '2026-05-08'::date, 1690.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(42::text, 'kts', 'fee_invoice', 22::text, '2026-06-08'::date, 1690.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(43::text, 'kts', 'fee_invoice', 23::text, '2026-05-08'::date, 962.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(44::text, 'kts', 'fee_invoice', 23::text, '2026-06-08'::date, 962.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(45::text, 'kts', 'fee_invoice', 24::text, '2026-05-08'::date, 1043.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(46::text, 'kts', 'fee_invoice', 24::text, '2026-06-08'::date, 1043.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(47::text, 'kts', 'fee_invoice', 25::text, '2026-05-08'::date, 1898.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(48::text, 'kts', 'fee_invoice', 25::text, '2026-06-08'::date, 1898.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(49::text, 'kts', 'fee_invoice', 26::text, '2026-05-08'::date, 1715.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(50::text, 'kts', 'fee_invoice', 26::text, '2026-06-08'::date, 1715.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(51::text, 'kts', 'fee_invoice', 27::text, '2026-05-08'::date, 1876.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(52::text, 'kts', 'fee_invoice', 27::text, '2026-06-08'::date, 1876.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(53::text, 'kts', 'fee_invoice', 28::text, '2026-05-08'::date, 994.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(54::text, 'kts', 'fee_invoice', 28::text, '2026-06-08'::date, 994.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(55::text, 'kts', 'fee_invoice', 29::text, '2026-05-08'::date, 827.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(56::text, 'kts', 'fee_invoice', 29::text, '2026-06-08'::date, 827.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(57::text, 'kts', 'fee_invoice', 30::text, '2026-05-08'::date, 1546.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(58::text, 'kts', 'fee_invoice', 30::text, '2026-06-08'::date, 1546.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(59::text, 'kts', 'fee_invoice', 31::text, '2026-05-08'::date, 845.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(60::text, 'kts', 'fee_invoice', 31::text, '2026-06-08'::date, 845.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(61::text, 'kts', 'fee_invoice', 32::text, '2026-05-08'::date, 1552.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(62::text, 'kts', 'fee_invoice', 32::text, '2026-06-08'::date, 1552.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(63::text, 'kts', 'fee_invoice', 33::text, '2026-05-08'::date, 1439.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(64::text, 'kts', 'fee_invoice', 33::text, '2026-06-08'::date, 1439.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(65::text, 'kts', 'fee_invoice', 34::text, '2026-05-08'::date, 1984.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(66::text, 'kts', 'fee_invoice', 34::text, '2026-06-08'::date, 1984.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(67::text, 'kts', 'fee_invoice', 35::text, '2026-05-08'::date, 990.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(68::text, 'kts', 'fee_invoice', 35::text, '2026-06-08'::date, 990.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(69::text, 'kts', 'fee_invoice', 36::text, '2026-05-08'::date, 1584.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(70::text, 'kts', 'fee_invoice', 36::text, '2026-06-08'::date, 1584.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(71::text, 'kts', 'fee_invoice', 37::text, '2026-05-08'::date, 811.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(72::text, 'kts', 'fee_invoice', 37::text, '2026-06-08'::date, 811.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(73::text, 'kts', 'fee_invoice', 38::text, '2026-05-08'::date, 1881.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(74::text, 'kts', 'fee_invoice', 38::text, '2026-06-08'::date, 1881.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(75::text, 'kts', 'fee_invoice', 39::text, '2026-05-08'::date, 1088.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(76::text, 'kts', 'fee_invoice', 39::text, '2026-06-08'::date, 1088.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(77::text, 'kts', 'fee_invoice', 40::text, '2026-05-08'::date, 1785.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(78::text, 'kts', 'fee_invoice', 40::text, '2026-06-08'::date, 1785.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(79::text, 'kts', 'fee_invoice', 41::text, '2026-05-08'::date, 1406.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(80::text, 'kts', 'fee_invoice', 41::text, '2026-06-08'::date, 1406.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(81::text, 'kts', 'fee_invoice', 42::text, '2026-05-08'::date, 1207.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(82::text, 'kts', 'fee_invoice', 42::text, '2026-06-08'::date, 1207.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(83::text, 'kts', 'fee_invoice', 43::text, '2026-05-08'::date, 1081.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(84::text, 'kts', 'fee_invoice', 43::text, '2026-06-08'::date, 1081.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(85::text, 'kts', 'fee_invoice', 44::text, '2026-05-08'::date, 1977.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(86::text, 'kts', 'fee_invoice', 44::text, '2026-06-08'::date, 1977.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(87::text, 'kts', 'fee_invoice', 45::text, '2026-05-08'::date, 939.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(88::text, 'kts', 'fee_invoice', 45::text, '2026-06-08'::date, 939.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(89::text, 'kts', 'fee_invoice', 46::text, '2026-05-08'::date, 1799.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(90::text, 'kts', 'fee_invoice', 46::text, '2026-06-08'::date, 1799.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(91::text, 'kts', 'fee_invoice', 47::text, '2026-05-08'::date, 957.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(92::text, 'kts', 'fee_invoice', 47::text, '2026-06-08'::date, 957.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(93::text, 'kts', 'fee_invoice', 48::text, '2026-05-08'::date, 1675.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(94::text, 'kts', 'fee_invoice', 48::text, '2026-06-08'::date, 1675.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(95::text, 'kts', 'fee_invoice', 49::text, '2026-05-08'::date, 1666.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(96::text, 'kts', 'fee_invoice', 49::text, '2026-06-08'::date, 1666.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(97::text, 'kts', 'fee_invoice', 50::text, '2026-05-08'::date, 1271.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(98::text, 'kts', 'fee_invoice', 50::text, '2026-06-08'::date, 1271.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(99::text, 'kts', 'fee_invoice', 51::text, '2026-05-08'::date, 1876.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(100::text, 'kts', 'fee_invoice', 51::text, '2026-06-08'::date, 1876.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
(101::text, 'kts', 'fee_invoice', 52::text, '2026-05-08'::date, 872.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(102::text, 'kts', 'fee_invoice', 52::text, '2026-06-08'::date, 872.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(103::text, 'kts', 'fee_invoice', 53::text, '2026-05-08'::date, 1288.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(104::text, 'kts', 'fee_invoice', 53::text, '2026-06-08'::date, 1288.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(105::text, 'kts', 'fee_invoice', 54::text, '2026-05-08'::date, 1230.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(106::text, 'kts', 'fee_invoice', 54::text, '2026-06-08'::date, 1230.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(107::text, 'kts', 'fee_invoice', 55::text, '2026-05-08'::date, 1144.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(108::text, 'kts', 'fee_invoice', 55::text, '2026-06-08'::date, 1144.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(109::text, 'kts', 'fee_invoice', 56::text, '2026-05-08'::date, 1049.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(110::text, 'kts', 'fee_invoice', 56::text, '2026-06-08'::date, 1049.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(111::text, 'kts', 'fee_invoice', 57::text, '2026-05-08'::date, 1760.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(112::text, 'kts', 'fee_invoice', 57::text, '2026-06-08'::date, 1760.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(113::text, 'kts', 'fee_invoice', 58::text, '2026-05-08'::date, 1412.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(114::text, 'kts', 'fee_invoice', 58::text, '2026-06-08'::date, 1412.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(115::text, 'kts', 'fee_invoice', 59::text, '2026-05-08'::date, 1493.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(116::text, 'kts', 'fee_invoice', 59::text, '2026-06-08'::date, 1493.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(117::text, 'kts', 'fee_invoice', 60::text, '2026-05-08'::date, 1709.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(118::text, 'kts', 'fee_invoice', 60::text, '2026-06-08'::date, 1709.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(119::text, 'kts', 'fee_invoice', 61::text, '2026-05-08'::date, 1872.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(120::text, 'kts', 'fee_invoice', 61::text, '2026-06-08'::date, 1872.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(121::text, 'kts', 'fee_invoice', 62::text, '2026-05-08'::date, 832.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(122::text, 'kts', 'fee_invoice', 62::text, '2026-06-08'::date, 832.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(123::text, 'kts', 'fee_invoice', 63::text, '2026-05-08'::date, 1335.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(124::text, 'kts', 'fee_invoice', 63::text, '2026-06-08'::date, 1335.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(125::text, 'kts', 'fee_invoice', 64::text, '2026-05-08'::date, 1545.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(126::text, 'kts', 'fee_invoice', 64::text, '2026-06-08'::date, 1545.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(127::text, 'kts', 'fee_invoice', 65::text, '2026-05-08'::date, 1903.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(128::text, 'kts', 'fee_invoice', 65::text, '2026-06-08'::date, 1903.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(129::text, 'kts', 'fee_invoice', 66::text, '2026-05-08'::date, 1020.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(130::text, 'kts', 'fee_invoice', 66::text, '2026-06-08'::date, 1020.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(131::text, 'kts', 'fee_invoice', 67::text, '2026-05-08'::date, 981.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(132::text, 'kts', 'fee_invoice', 67::text, '2026-06-08'::date, 981.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(133::text, 'kts', 'fee_invoice', 68::text, '2026-05-08'::date, 1751.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(134::text, 'kts', 'fee_invoice', 68::text, '2026-06-08'::date, 1751.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(135::text, 'kts', 'fee_invoice', 69::text, '2026-05-08'::date, 1759.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(136::text, 'kts', 'fee_invoice', 69::text, '2026-06-08'::date, 1759.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(137::text, 'kts', 'fee_invoice', 70::text, '2026-05-08'::date, 1116.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(138::text, 'kts', 'fee_invoice', 70::text, '2026-06-08'::date, 1116.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(139::text, 'kts', 'fee_invoice', 71::text, '2026-05-08'::date, 977.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(140::text, 'kts', 'fee_invoice', 71::text, '2026-06-08'::date, 977.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(141::text, 'kts', 'fee_invoice', 72::text, '2026-05-08'::date, 1864.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(142::text, 'kts', 'fee_invoice', 72::text, '2026-06-08'::date, 1864.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(143::text, 'kts', 'fee_invoice', 73::text, '2026-05-08'::date, 1422.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(144::text, 'kts', 'fee_invoice', 73::text, '2026-06-08'::date, 1422.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(145::text, 'kts', 'fee_invoice', 74::text, '2026-05-08'::date, 1807.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(146::text, 'kts', 'fee_invoice', 74::text, '2026-06-08'::date, 1807.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(147::text, 'kts', 'fee_invoice', 75::text, '2026-05-08'::date, 1748.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(148::text, 'kts', 'fee_invoice', 75::text, '2026-06-08'::date, 1748.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(149::text, 'kts', 'fee_invoice', 76::text, '2026-05-08'::date, 1720.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(150::text, 'kts', 'fee_invoice', 76::text, '2026-06-08'::date, 1720.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(151::text, 'kts', 'fee_invoice', 77::text, '2026-05-08'::date, 1896.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(152::text, 'kts', 'fee_invoice', 77::text, '2026-06-08'::date, 1896.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(153::text, 'kts', 'fee_invoice', 78::text, '2026-05-08'::date, 1063.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(154::text, 'kts', 'fee_invoice', 78::text, '2026-06-08'::date, 1063.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(155::text, 'kts', 'fee_invoice', 79::text, '2026-05-08'::date, 1391.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(156::text, 'kts', 'fee_invoice', 79::text, '2026-06-08'::date, 1391.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(157::text, 'kts', 'fee_invoice', 80::text, '2026-05-08'::date, 1864.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(158::text, 'kts', 'fee_invoice', 80::text, '2026-06-08'::date, 1864.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(159::text, 'kts', 'fee_invoice', 81::text, '2026-05-08'::date, 1729.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(160::text, 'kts', 'fee_invoice', 81::text, '2026-06-08'::date, 1729.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(161::text, 'kts', 'fee_invoice', 82::text, '2026-05-08'::date, 1094.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(162::text, 'kts', 'fee_invoice', 82::text, '2026-06-08'::date, 1094.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(163::text, 'kts', 'fee_invoice', 83::text, '2026-05-08'::date, 804.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(164::text, 'kts', 'fee_invoice', 83::text, '2026-06-08'::date, 804.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(165::text, 'kts', 'fee_invoice', 84::text, '2026-05-08'::date, 1290.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(166::text, 'kts', 'fee_invoice', 84::text, '2026-06-08'::date, 1290.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(167::text, 'kts', 'fee_invoice', 85::text, '2026-05-08'::date, 1442.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(168::text, 'kts', 'fee_invoice', 85::text, '2026-06-08'::date, 1442.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(169::text, 'kts', 'fee_invoice', 86::text, '2026-05-08'::date, 1305.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(170::text, 'kts', 'fee_invoice', 86::text, '2026-06-08'::date, 1305.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(171::text, 'kts', 'fee_invoice', 87::text, '2026-05-08'::date, 1950.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(172::text, 'kts', 'fee_invoice', 87::text, '2026-06-08'::date, 1950.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(173::text, 'kts', 'fee_invoice', 88::text, '2026-05-08'::date, 1494.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(174::text, 'kts', 'fee_invoice', 88::text, '2026-06-08'::date, 1494.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(175::text, 'kts', 'fee_invoice', 89::text, '2026-05-08'::date, 1117.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(176::text, 'kts', 'fee_invoice', 89::text, '2026-06-08'::date, 1117.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(177::text, 'kts', 'fee_invoice', 90::text, '2026-05-08'::date, 954.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(178::text, 'kts', 'fee_invoice', 90::text, '2026-06-08'::date, 954.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(179::text, 'kts', 'fee_invoice', 91::text, '2026-05-08'::date, 996.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(180::text, 'kts', 'fee_invoice', 91::text, '2026-06-08'::date, 996.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(181::text, 'kts', 'fee_invoice', 92::text, '2026-05-08'::date, 807.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(182::text, 'kts', 'fee_invoice', 92::text, '2026-06-08'::date, 807.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(183::text, 'kts', 'fee_invoice', 93::text, '2026-05-08'::date, 1945.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(184::text, 'kts', 'fee_invoice', 93::text, '2026-06-08'::date, 1945.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(185::text, 'kts', 'fee_invoice', 94::text, '2026-05-08'::date, 1791.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(186::text, 'kts', 'fee_invoice', 94::text, '2026-06-08'::date, 1791.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(187::text, 'kts', 'fee_invoice', 95::text, '2026-05-08'::date, 848.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(188::text, 'kts', 'fee_invoice', 95::text, '2026-06-08'::date, 848.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(189::text, 'kts', 'fee_invoice', 96::text, '2026-05-08'::date, 1162.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(190::text, 'kts', 'fee_invoice', 96::text, '2026-06-08'::date, 1162.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(191::text, 'kts', 'fee_invoice', 97::text, '2026-05-08'::date, 1341.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(192::text, 'kts', 'fee_invoice', 97::text, '2026-06-08'::date, 1341.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(193::text, 'kts', 'fee_invoice', 98::text, '2026-05-08'::date, 892.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(194::text, 'kts', 'fee_invoice', 98::text, '2026-06-08'::date, 892.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(195::text, 'kts', 'fee_invoice', 99::text, '2026-05-08'::date, 1130.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(196::text, 'kts', 'fee_invoice', 99::text, '2026-06-08'::date, 1130.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(197::text, 'kts', 'fee_invoice', 100::text, '2026-05-08'::date, 1002.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(198::text, 'kts', 'fee_invoice', 100::text, '2026-06-08'::date, 1002.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(199::text, 'kts', 'fee_invoice', 101::text, '2026-05-08'::date, 1147.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(200::text, 'kts', 'fee_invoice', 101::text, '2026-06-08'::date, 1147.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(201::text, 'kts', 'fee_invoice', 102::text, '2026-05-08'::date, 1360.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(202::text, 'kts', 'fee_invoice', 102::text, '2026-06-08'::date, 1360.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(203::text, 'kts', 'fee_invoice', 103::text, '2026-05-08'::date, 1500.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(204::text, 'kts', 'fee_invoice', 103::text, '2026-06-08'::date, 1500.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(205::text, 'kts', 'fee_invoice', 104::text, '2026-05-08'::date, 1410.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(206::text, 'kts', 'fee_invoice', 104::text, '2026-06-08'::date, 1410.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(207::text, 'kts', 'fee_invoice', 105::text, '2026-05-08'::date, 923.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(208::text, 'kts', 'fee_invoice', 105::text, '2026-06-08'::date, 923.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(209::text, 'kts', 'fee_invoice', 106::text, '2026-05-08'::date, 1921.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(210::text, 'kts', 'fee_invoice', 106::text, '2026-06-08'::date, 1921.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(211::text, 'kts', 'fee_invoice', 107::text, '2026-05-08'::date, 1628.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(212::text, 'kts', 'fee_invoice', 107::text, '2026-06-08'::date, 1628.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(213::text, 'kts', 'fee_invoice', 108::text, '2026-05-08'::date, 1951.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(214::text, 'kts', 'fee_invoice', 108::text, '2026-06-08'::date, 1951.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(215::text, 'kts', 'fee_invoice', 109::text, '2026-05-08'::date, 1641.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(216::text, 'kts', 'fee_invoice', 109::text, '2026-06-08'::date, 1641.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(217::text, 'kts', 'fee_invoice', 110::text, '2026-05-08'::date, 1670.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(218::text, 'kts', 'fee_invoice', 110::text, '2026-06-08'::date, 1670.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(219::text, 'kts', 'fee_invoice', 111::text, '2026-05-08'::date, 824.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(220::text, 'kts', 'fee_invoice', 111::text, '2026-06-08'::date, 824.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(221::text, 'kts', 'fee_invoice', 112::text, '2026-05-08'::date, 895.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(222::text, 'kts', 'fee_invoice', 112::text, '2026-06-08'::date, 895.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(223::text, 'kts', 'fee_invoice', 113::text, '2026-05-08'::date, 1546.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(224::text, 'kts', 'fee_invoice', 113::text, '2026-06-08'::date, 1546.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(225::text, 'kts', 'fee_invoice', 114::text, '2026-05-08'::date, 854.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(226::text, 'kts', 'fee_invoice', 114::text, '2026-06-08'::date, 854.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(227::text, 'kts', 'fee_invoice', 115::text, '2026-05-08'::date, 1368.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(228::text, 'kts', 'fee_invoice', 115::text, '2026-06-08'::date, 1368.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(229::text, 'kts', 'fee_invoice', 116::text, '2026-05-08'::date, 949.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(230::text, 'kts', 'fee_invoice', 116::text, '2026-06-08'::date, 949.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(231::text, 'kts', 'fee_invoice', 117::text, '2026-05-08'::date, 1658.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(232::text, 'kts', 'fee_invoice', 117::text, '2026-06-08'::date, 1658.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(233::text, 'kts', 'fee_invoice', 118::text, '2026-05-08'::date, 1526.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(234::text, 'kts', 'fee_invoice', 118::text, '2026-06-08'::date, 1526.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(235::text, 'kts', 'fee_invoice', 119::text, '2026-05-08'::date, 1603.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(236::text, 'kts', 'fee_invoice', 119::text, '2026-06-08'::date, 1603.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(237::text, 'kts', 'fee_invoice', 120::text, '2026-05-08'::date, 1153.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(238::text, 'kts', 'fee_invoice', 120::text, '2026-06-08'::date, 1153.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('inv-uk-2026-001', 'uk', 'tuition_fee', 'std-uk-01', '2026-10-10'::date, 30.00, 'GBP', 'Bank Transfer (SumUp)', 'paid', '2026-10-08'::date, now(), now()),
('inv-uk-2026-002', 'uk', 'tuition_fee', 'std-uk-02', '2026-10-10'::date, 25.00, 'GBP', 'Bank Transfer (SumUp)', 'paid', '2026-10-08'::date, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 8. PRAYER TIMINGS (288 Preserved Records)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS prayer_timings (
    id INT PRIMARY KEY,
    campus_id TEXT NOT NULL DEFAULT 'kts' REFERENCES campuses(id) ON DELETE CASCADE,
    english_name VARCHAR(100) NOT NULL,
    arabic_name VARCHAR(100),
    month INT NOT NULL DEFAULT 1,
    day INT NOT NULL DEFAULT 1,
    year INT NOT NULL DEFAULT 2026,
    begin_time TIME,
    end_time TIME,
    is_jummah BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE prayer_timings ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE prayer_timings ALTER COLUMN updated_at DROP NOT NULL;

-- Migrating 288 Legacy Prayer Timings:
INSERT INTO prayer_timings (id, campus_id, english_name, arabic_name, month, day, year, begin_time, end_time, is_jummah, created_at, updated_at)
VALUES
(1, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-01-20 23:09:44'::timestamptz, '2026-01-20 23:09:44'::timestamptz),
(2, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-01-20 23:09:44'::timestamptz, '2026-01-20 23:09:44'::timestamptz),
(3, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-01-20 23:09:44'::timestamptz, '2026-01-20 23:09:44'::timestamptz),
(4, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-01-20 23:09:44'::timestamptz, '2026-01-20 23:09:44'::timestamptz),
(5, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-01-20 23:09:44'::timestamptz, '2026-01-20 23:09:44'::timestamptz),
(6, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-01-20 23:09:44'::timestamptz, '2026-01-20 23:09:44'::timestamptz),
(7, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-05 04:14:04'::timestamptz, '2026-03-05 04:14:04'::timestamptz),
(8, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-05 04:14:04'::timestamptz, '2026-03-05 04:14:04'::timestamptz),
(9, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-05 04:14:04'::timestamptz, '2026-03-05 04:14:04'::timestamptz),
(10, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-05 04:14:04'::timestamptz, '2026-03-05 04:14:04'::timestamptz),
(11, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-05 04:14:04'::timestamptz, '2026-03-05 04:14:04'::timestamptz),
(12, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-05 04:14:04'::timestamptz, '2026-03-05 04:14:04'::timestamptz),
(13, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-06 03:08:22'::timestamptz, '2026-03-06 03:08:22'::timestamptz),
(14, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-06 03:08:23'::timestamptz, '2026-03-06 03:08:23'::timestamptz),
(15, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-06 03:08:23'::timestamptz, '2026-03-06 03:08:23'::timestamptz),
(16, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-06 03:08:23'::timestamptz, '2026-03-06 03:08:23'::timestamptz),
(17, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-06 03:08:23'::timestamptz, '2026-03-06 03:08:23'::timestamptz),
(18, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-06 03:08:23'::timestamptz, '2026-03-06 03:08:23'::timestamptz),
(19, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-11 09:01:17'::timestamptz, '2026-03-11 09:01:17'::timestamptz),
(20, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-11 09:01:17'::timestamptz, '2026-03-11 09:01:17'::timestamptz),
(21, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-11 09:01:17'::timestamptz, '2026-03-11 09:01:17'::timestamptz),
(22, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-11 09:01:17'::timestamptz, '2026-03-11 09:01:17'::timestamptz),
(23, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-11 09:01:17'::timestamptz, '2026-03-11 09:01:17'::timestamptz),
(24, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-11 09:01:17'::timestamptz, '2026-03-11 09:01:17'::timestamptz),
(25, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-11 06:25:08'::timestamptz, '2026-03-11 06:25:08'::timestamptz),
(26, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-11 06:25:08'::timestamptz, '2026-03-11 06:25:08'::timestamptz),
(27, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-11 06:25:08'::timestamptz, '2026-03-11 06:25:08'::timestamptz),
(28, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-11 06:25:08'::timestamptz, '2026-03-11 06:25:08'::timestamptz),
(29, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-11 06:25:08'::timestamptz, '2026-03-11 06:25:08'::timestamptz),
(30, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-11 06:25:08'::timestamptz, '2026-03-11 06:25:08'::timestamptz),
(31, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:16:40'::timestamptz, '2026-03-12 06:16:40'::timestamptz),
(32, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-12 06:16:40'::timestamptz, '2026-03-12 06:16:40'::timestamptz),
(33, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-12 06:16:40'::timestamptz, '2026-03-12 06:16:40'::timestamptz),
(34, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:16:40'::timestamptz, '2026-03-12 06:16:40'::timestamptz),
(35, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-12 06:16:40'::timestamptz, '2026-03-12 06:16:40'::timestamptz),
(36, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-12 06:16:40'::timestamptz, '2026-03-12 06:16:40'::timestamptz),
(37, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-11 12:39:13'::timestamptz, '2026-03-11 12:39:13'::timestamptz),
(38, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-11 12:39:13'::timestamptz, '2026-03-11 12:39:13'::timestamptz),
(39, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-11 12:39:13'::timestamptz, '2026-03-11 12:39:13'::timestamptz),
(40, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-11 12:39:13'::timestamptz, '2026-03-11 12:39:13'::timestamptz),
(41, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-11 12:39:13'::timestamptz, '2026-03-11 12:39:13'::timestamptz),
(42, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-11 12:39:13'::timestamptz, '2026-03-11 12:39:13'::timestamptz),
(43, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:17:07'::timestamptz, '2026-03-12 06:17:07'::timestamptz),
(44, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-12 06:17:07'::timestamptz, '2026-03-12 06:17:07'::timestamptz),
(45, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-12 06:17:07'::timestamptz, '2026-03-12 06:17:07'::timestamptz),
(46, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:17:07'::timestamptz, '2026-03-12 06:17:07'::timestamptz),
(47, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-12 06:17:07'::timestamptz, '2026-03-12 06:17:07'::timestamptz),
(48, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-12 06:17:07'::timestamptz, '2026-03-12 06:17:07'::timestamptz),
(49, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:17:26'::timestamptz, '2026-03-12 06:17:26'::timestamptz),
(50, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-12 06:17:26'::timestamptz, '2026-03-12 06:17:26'::timestamptz),
(51, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-12 06:17:26'::timestamptz, '2026-03-12 06:17:26'::timestamptz),
(52, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:17:26'::timestamptz, '2026-03-12 06:17:26'::timestamptz),
(53, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-12 06:17:26'::timestamptz, '2026-03-12 06:17:26'::timestamptz),
(54, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-12 06:17:26'::timestamptz, '2026-03-12 06:17:26'::timestamptz),
(55, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:18:36'::timestamptz, '2026-03-12 06:18:36'::timestamptz),
(56, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-12 06:18:36'::timestamptz, '2026-03-12 06:18:36'::timestamptz),
(57, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-12 06:18:36'::timestamptz, '2026-03-12 06:18:36'::timestamptz),
(58, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:18:36'::timestamptz, '2026-03-12 06:18:36'::timestamptz),
(59, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-12 06:18:36'::timestamptz, '2026-03-12 06:18:36'::timestamptz),
(60, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-12 06:18:36'::timestamptz, '2026-03-12 06:18:36'::timestamptz),
(61, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-11 12:42:01'::timestamptz, '2026-03-11 12:42:01'::timestamptz),
(62, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-11 12:42:01'::timestamptz, '2026-03-11 12:42:01'::timestamptz),
(63, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-11 12:42:01'::timestamptz, '2026-03-11 12:42:01'::timestamptz),
(64, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-11 12:42:01'::timestamptz, '2026-03-11 12:42:01'::timestamptz),
(65, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-11 12:42:01'::timestamptz, '2026-03-11 12:42:01'::timestamptz),
(66, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-11 12:42:01'::timestamptz, '2026-03-11 12:42:01'::timestamptz),
(67, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:20:42'::timestamptz, '2026-03-12 06:20:42'::timestamptz),
(68, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-12 06:20:42'::timestamptz, '2026-03-12 06:20:42'::timestamptz),
(69, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-12 06:20:42'::timestamptz, '2026-03-12 06:20:42'::timestamptz),
(70, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:20:42'::timestamptz, '2026-03-12 06:20:42'::timestamptz),
(71, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-12 06:20:42'::timestamptz, '2026-03-12 06:20:42'::timestamptz),
(72, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-12 06:20:42'::timestamptz, '2026-03-12 06:20:42'::timestamptz),
(73, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:19:17'::timestamptz, '2026-03-12 06:19:17'::timestamptz),
(74, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-12 06:19:17'::timestamptz, '2026-03-12 06:19:17'::timestamptz),
(75, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-12 06:19:17'::timestamptz, '2026-03-12 06:19:17'::timestamptz),
(76, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:19:17'::timestamptz, '2026-03-12 06:19:17'::timestamptz),
(77, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-12 06:19:17'::timestamptz, '2026-03-12 06:19:17'::timestamptz),
(78, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-12 06:19:17'::timestamptz, '2026-03-12 06:19:17'::timestamptz),
(79, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:21:35'::timestamptz, '2026-03-12 06:21:35'::timestamptz),
(80, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-12 06:21:35'::timestamptz, '2026-03-12 06:21:35'::timestamptz),
(81, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-12 06:21:35'::timestamptz, '2026-03-12 06:21:35'::timestamptz),
(82, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-12 06:21:35'::timestamptz, '2026-03-12 06:21:35'::timestamptz),
(83, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-12 06:21:35'::timestamptz, '2026-03-12 06:21:35'::timestamptz),
(84, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-12 06:21:35'::timestamptz, '2026-03-12 06:21:35'::timestamptz),
(85, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-22 12:44:01'::timestamptz, '2026-03-22 12:44:01'::timestamptz),
(86, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-22 12:44:01'::timestamptz, '2026-03-22 12:44:01'::timestamptz),
(87, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-22 12:44:01'::timestamptz, '2026-03-22 12:44:01'::timestamptz),
(88, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-22 12:44:01'::timestamptz, '2026-03-22 12:44:01'::timestamptz),
(89, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-22 12:44:01'::timestamptz, '2026-03-22 12:44:01'::timestamptz),
(90, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-22 12:44:01'::timestamptz, '2026-03-22 12:44:01'::timestamptz),
(91, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-22 12:46:55'::timestamptz, '2026-03-22 12:46:55'::timestamptz),
(92, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-22 12:46:55'::timestamptz, '2026-03-22 12:46:55'::timestamptz),
(93, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-22 12:46:55'::timestamptz, '2026-03-22 12:46:55'::timestamptz),
(94, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-22 12:46:55'::timestamptz, '2026-03-22 12:46:55'::timestamptz),
(95, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-22 12:46:55'::timestamptz, '2026-03-22 12:46:55'::timestamptz),
(96, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-22 12:46:55'::timestamptz, '2026-03-22 12:46:55'::timestamptz),
(97, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-22 12:49:02'::timestamptz, '2026-03-22 12:49:02'::timestamptz),
(98, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-22 12:49:02'::timestamptz, '2026-03-22 12:49:02'::timestamptz),
(99, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-22 12:49:02'::timestamptz, '2026-03-22 12:49:02'::timestamptz),
(100, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-22 12:49:02'::timestamptz, '2026-03-22 12:49:02'::timestamptz),
(101, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-22 12:49:02'::timestamptz, '2026-03-22 12:49:02'::timestamptz),
(102, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-22 12:49:02'::timestamptz, '2026-03-22 12:49:02'::timestamptz),
(103, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, (0 = 1), '2026-03-22 12:55:25'::timestamptz, '2026-03-22 12:55:25'::timestamptz),
(104, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, (0 = 1), '2026-03-22 12:55:25'::timestamptz, '2026-03-22 12:55:25'::timestamptz),
(105, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, (0 = 1), '2026-03-22 12:55:25'::timestamptz, '2026-03-22 12:55:25'::timestamptz),
(106, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, (0 = 1), '2026-03-22 12:55:25'::timestamptz, '2026-03-22 12:55:25'::timestamptz),
(107, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, (0 = 1), '2026-03-22 12:55:25'::timestamptz, '2026-03-22 12:55:25'::timestamptz),
(108, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, (0 = 1), '2026-03-22 12:55:25'::timestamptz, '2026-03-22 12:55:25'::timestamptz),
(109, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:21:00'::time, '06:00:00'::time, (0 = 1), '2026-04-01 13:02:33'::timestamptz, '2026-04-01 13:02:33'::timestamptz),
(110, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:41:00'::time, '06:41:00'::time, (0 = 1), '2026-04-01 13:02:33'::timestamptz, '2026-04-01 13:02:33'::timestamptz),
(111, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:14:00'::time, '13:30:00'::time, (0 = 1), '2026-04-01 13:02:33'::timestamptz, '2026-04-01 13:02:33'::timestamptz),
(112, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:37:00'::time, '18:00:00'::time, (0 = 1), '2026-04-01 13:02:33'::timestamptz, '2026-04-01 13:02:33'::timestamptz),
(113, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:44:00'::time, '19:44:00'::time, (0 = 1), '2026-04-01 13:02:33'::timestamptz, '2026-04-01 13:02:33'::timestamptz),
(114, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '20:58:00'::time, '21:15:00'::time, (0 = 1), '2026-04-01 13:02:33'::timestamptz, '2026-04-01 13:02:33'::timestamptz),
(115, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:19:00'::time, '06:00:00'::time, (0 = 1), '2026-04-01 13:14:17'::timestamptz, '2026-04-01 13:14:17'::timestamptz),
(116, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:39:00'::time, '06:39:00'::time, (0 = 1), '2026-04-01 13:14:17'::timestamptz, '2026-04-01 13:14:17'::timestamptz),
(117, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:13:00'::time, '13:30:00'::time, (0 = 1), '2026-04-01 13:14:17'::timestamptz, '2026-04-01 13:14:17'::timestamptz),
(118, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:38:00'::time, '18:00:00'::time, (0 = 1), '2026-04-01 13:14:17'::timestamptz, '2026-04-01 13:14:17'::timestamptz),
(119, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:45:00'::time, '19:45:00'::time, (0 = 1), '2026-04-01 13:14:17'::timestamptz, '2026-04-01 13:14:17'::timestamptz),
(120, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:00:00'::time, '21:15:00'::time, (0 = 1), '2026-04-01 13:14:17'::timestamptz, '2026-04-01 13:14:17'::timestamptz),
(121, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:17:00'::time, '06:00:00'::time, (0 = 1), '2026-04-03 03:27:03'::timestamptz, '2026-04-03 03:27:03'::timestamptz),
(122, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:37:00'::time, '06:37:00'::time, (0 = 1), '2026-04-03 03:27:03'::timestamptz, '2026-04-03 03:27:03'::timestamptz),
(123, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:13:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 03:27:03'::timestamptz, '2026-04-03 03:27:03'::timestamptz),
(124, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:39:00'::time, '18:00:00'::time, (0 = 1), '2026-04-03 03:27:03'::timestamptz, '2026-04-03 03:27:03'::timestamptz),
(125, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:47:00'::time, '19:47:00'::time, (0 = 1), '2026-04-03 03:27:03'::timestamptz, '2026-04-03 03:27:03'::timestamptz),
(126, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:01:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 03:27:03'::timestamptz, '2026-04-03 03:27:03'::timestamptz),
(127, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:15:00'::time, '06:00:00'::time, (0 = 1), '2026-04-03 02:15:29'::timestamptz, '2026-04-03 02:15:29'::timestamptz),
(128, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:35:00'::time, '06:35:00'::time, (0 = 1), '2026-04-03 02:15:29'::timestamptz, '2026-04-03 02:15:29'::timestamptz),
(129, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:12:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:15:29'::timestamptz, '2026-04-03 02:15:29'::timestamptz),
(130, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:40:00'::time, '18:00:00'::time, (0 = 1), '2026-04-03 02:15:29'::timestamptz, '2026-04-03 02:15:29'::timestamptz),
(131, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:49:00'::time, '19:49:00'::time, (0 = 1), '2026-04-03 02:15:29'::timestamptz, '2026-04-03 02:15:29'::timestamptz),
(132, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:03:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:15:29'::timestamptz, '2026-04-03 02:15:29'::timestamptz),
(133, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:13:00'::time, '06:00:00'::time, (0 = 1), '2026-04-03 02:16:05'::timestamptz, '2026-04-03 02:16:05'::timestamptz),
(134, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:33:00'::time, '06:33:00'::time, (0 = 1), '2026-04-03 02:16:05'::timestamptz, '2026-04-03 02:16:05'::timestamptz),
(135, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:11:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:16:05'::timestamptz, '2026-04-03 02:16:05'::timestamptz),
(136, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:42:00'::time, '18:00:00'::time, (0 = 1), '2026-04-03 02:16:05'::timestamptz, '2026-04-03 02:16:05'::timestamptz),
(137, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:51:00'::time, '19:51:00'::time, (0 = 1), '2026-04-03 02:16:05'::timestamptz, '2026-04-03 02:16:05'::timestamptz),
(138, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:05:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:16:05'::timestamptz, '2026-04-03 02:16:05'::timestamptz),
(139, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:11:00'::time, '06:00:00'::time, (0 = 1), '2026-04-03 02:16:32'::timestamptz, '2026-04-03 02:16:32'::timestamptz),
(140, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:31:00'::time, '06:31:00'::time, (0 = 1), '2026-04-03 02:16:32'::timestamptz, '2026-04-03 02:16:32'::timestamptz),
(141, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:11:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:16:32'::timestamptz, '2026-04-03 02:16:32'::timestamptz),
(142, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:43:00'::time, '18:00:00'::time, (0 = 1), '2026-04-03 02:16:32'::timestamptz, '2026-04-03 02:16:32'::timestamptz),
(143, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:53:00'::time, '19:53:00'::time, (0 = 1), '2026-04-03 02:16:32'::timestamptz, '2026-04-03 02:16:32'::timestamptz),
(144, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:06:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:16:32'::timestamptz, '2026-04-03 02:16:32'::timestamptz),
(145, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:09:00'::time, '06:00:00'::time, (0 = 1), '2026-04-03 02:17:06'::timestamptz, '2026-04-03 02:17:06'::timestamptz),
(146, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:28:00'::time, '06:28:00'::time, (0 = 1), '2026-04-03 02:17:06'::timestamptz, '2026-04-03 02:17:06'::timestamptz),
(147, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:10:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:17:06'::timestamptz, '2026-04-03 02:17:06'::timestamptz),
(148, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:44:00'::time, '18:00:00'::time, (0 = 1), '2026-04-03 02:17:06'::timestamptz, '2026-04-03 02:17:06'::timestamptz),
(149, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:55:00'::time, '19:55:00'::time, (0 = 1), '2026-04-03 02:17:06'::timestamptz, '2026-04-03 02:17:06'::timestamptz),
(150, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:08:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:17:06'::timestamptz, '2026-04-03 02:17:06'::timestamptz),
(151, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:06:00'::time, '06:00:00'::time, (0 = 1), '2026-04-03 02:17:40'::timestamptz, '2026-04-03 02:17:40'::timestamptz),
(152, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:25:00'::time, '06:25:00'::time, (0 = 1), '2026-04-03 02:17:40'::timestamptz, '2026-04-03 02:17:40'::timestamptz),
(153, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:10:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:17:40'::timestamptz, '2026-04-03 02:17:40'::timestamptz),
(154, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:45:00'::time, '18:00:00'::time, (0 = 1), '2026-04-03 02:17:40'::timestamptz, '2026-04-03 02:17:40'::timestamptz),
(155, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:57:00'::time, '19:57:00'::time, (0 = 1), '2026-04-03 02:17:40'::timestamptz, '2026-04-03 02:17:40'::timestamptz),
(156, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:09:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:17:40'::timestamptz, '2026-04-03 02:17:40'::timestamptz),
(157, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:03:00'::time, '06:00:00'::time, (0 = 1), '2026-04-03 02:18:11'::timestamptz, '2026-04-03 02:18:11'::timestamptz),
(158, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:22:00'::time, '06:22:00'::time, (0 = 1), '2026-04-03 02:18:11'::timestamptz, '2026-04-03 02:18:11'::timestamptz),
(159, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:18:11'::timestamptz, '2026-04-03 02:18:11'::timestamptz),
(160, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:47:00'::time, '18:00:00'::time, (0 = 1), '2026-04-03 02:18:11'::timestamptz, '2026-04-03 02:18:11'::timestamptz),
(161, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:59:00'::time, '19:59:00'::time, (0 = 1), '2026-04-03 02:18:11'::timestamptz, '2026-04-03 02:18:11'::timestamptz),
(162, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:10:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:18:11'::timestamptz, '2026-04-03 02:18:11'::timestamptz),
(163, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:01:00'::time, '05:45:00'::time, (0 = 1), '2026-04-03 02:18:38'::timestamptz, '2026-04-03 02:18:38'::timestamptz),
(164, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:20:00'::time, '06:20:00'::time, (0 = 1), '2026-04-03 02:18:38'::timestamptz, '2026-04-03 02:18:38'::timestamptz),
(165, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:18:38'::timestamptz, '2026-04-03 02:18:38'::timestamptz),
(166, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:49:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:18:38'::timestamptz, '2026-04-03 02:18:38'::timestamptz),
(167, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:01:00'::time, '20:01:00'::time, (0 = 1), '2026-04-03 02:18:38'::timestamptz, '2026-04-03 02:18:38'::timestamptz),
(168, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:12:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:18:38'::timestamptz, '2026-04-03 02:18:38'::timestamptz),
(169, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:58:00'::time, '05:25:00'::time, (0 = 1), '2026-04-03 02:19:02'::timestamptz, '2026-04-03 02:19:02'::timestamptz),
(170, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:18:00'::time, '06:18:00'::time, (0 = 1), '2026-04-03 02:19:02'::timestamptz, '2026-04-03 02:19:02'::timestamptz),
(171, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:19:02'::timestamptz, '2026-04-03 02:19:02'::timestamptz),
(172, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:50:00'::time, '18:00:00'::time, (0 = 1), '2026-04-03 02:19:02'::timestamptz, '2026-04-03 02:19:02'::timestamptz),
(173, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:02:00'::time, '20:02:00'::time, (0 = 1), '2026-04-03 02:19:02'::timestamptz, '2026-04-03 02:19:02'::timestamptz),
(174, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:14:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:19:02'::timestamptz, '2026-04-03 02:19:02'::timestamptz),
(175, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:55:00'::time, '05:25:00'::time, (0 = 1), '2026-04-03 02:19:28'::timestamptz, '2026-04-03 02:19:28'::timestamptz),
(176, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:16:00'::time, '06:16:00'::time, (0 = 1), '2026-04-03 02:19:28'::timestamptz, '2026-04-03 02:19:28'::timestamptz),
(177, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:19:28'::timestamptz, '2026-04-03 02:19:28'::timestamptz),
(178, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:51:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:19:28'::timestamptz, '2026-04-03 02:19:28'::timestamptz),
(179, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:04:00'::time, '20:04:00'::time, (0 = 1), '2026-04-03 02:19:28'::timestamptz, '2026-04-03 02:19:28'::timestamptz),
(180, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:16:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:19:28'::timestamptz, '2026-04-03 02:19:28'::timestamptz),
(181, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:53:00'::time, '05:45:00'::time, (0 = 1), '2026-04-03 02:19:59'::timestamptz, '2026-04-03 02:19:59'::timestamptz),
(182, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:14:00'::time, '06:14:00'::time, (0 = 1), '2026-04-03 02:19:59'::timestamptz, '2026-04-03 02:19:59'::timestamptz),
(183, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:19:59'::timestamptz, '2026-04-03 02:19:59'::timestamptz),
(184, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:52:00'::time, '06:30:00'::time, (0 = 1), '2026-04-03 02:19:59'::timestamptz, '2026-04-03 02:19:59'::timestamptz),
(185, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:06:00'::time, '20:06:00'::time, (0 = 1), '2026-04-03 02:19:59'::timestamptz, '2026-04-03 02:19:59'::timestamptz),
(186, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:18:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:19:59'::timestamptz, '2026-04-03 02:19:59'::timestamptz),
(187, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:49:00'::time, '05:30:00'::time, (0 = 1), '2026-04-03 02:20:26'::timestamptz, '2026-04-03 02:20:26'::timestamptz),
(188, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:11:00'::time, '06:11:00'::time, (0 = 1), '2026-04-03 02:20:26'::timestamptz, '2026-04-03 02:20:26'::timestamptz),
(189, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:20:26'::timestamptz, '2026-04-03 02:20:26'::timestamptz),
(190, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:53:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:20:26'::timestamptz, '2026-04-03 02:20:26'::timestamptz),
(191, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:07:00'::time, '20:07:00'::time, (0 = 1), '2026-04-03 02:20:26'::timestamptz, '2026-04-03 02:20:26'::timestamptz),
(192, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:20:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:20:26'::timestamptz, '2026-04-03 02:20:26'::timestamptz),
(193, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:46:00'::time, '05:45:00'::time, (0 = 1), '2026-04-03 02:20:58'::timestamptz, '2026-04-03 02:20:58'::timestamptz),
(194, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:09:00'::time, '06:09:00'::time, (0 = 1), '2026-04-03 02:20:58'::timestamptz, '2026-04-03 02:20:58'::timestamptz),
(195, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:20:58'::timestamptz, '2026-04-03 02:20:58'::timestamptz),
(196, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:54:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:20:58'::timestamptz, '2026-04-03 02:20:58'::timestamptz),
(197, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:09:00'::time, '20:09:00'::time, (0 = 1), '2026-04-03 02:20:58'::timestamptz, '2026-04-03 02:20:58'::timestamptz),
(198, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:22:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:20:58'::timestamptz, '2026-04-03 02:20:58'::timestamptz),
(199, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:53:00'::time, '05:45:00'::time, (0 = 1), '2026-04-03 02:21:25'::timestamptz, '2026-04-03 02:21:25'::timestamptz),
(200, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:07:00'::time, '06:07:00'::time, (0 = 1), '2026-04-03 02:21:25'::timestamptz, '2026-04-03 02:21:25'::timestamptz),
(201, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:21:25'::timestamptz, '2026-04-03 02:21:25'::timestamptz),
(202, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:55:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:21:25'::timestamptz, '2026-04-03 02:21:25'::timestamptz),
(203, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:11:00'::time, '20:11:00'::time, (0 = 1), '2026-04-03 02:21:25'::timestamptz, '2026-04-03 02:21:25'::timestamptz),
(204, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:24:00'::time, '21:30:00'::time, (0 = 1), '2026-04-03 02:21:25'::timestamptz, '2026-04-03 02:21:25'::timestamptz),
(205, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:41:00'::time, '05:30:00'::time, (0 = 1), '2026-04-03 02:22:05'::timestamptz, '2026-04-03 02:22:05'::timestamptz),
(206, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:05:00'::time, '06:05:00'::time, (0 = 1), '2026-04-03 02:22:05'::timestamptz, '2026-04-03 02:22:05'::timestamptz),
(207, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:22:05'::timestamptz, '2026-04-03 02:22:05'::timestamptz),
(208, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:56:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:22:05'::timestamptz, '2026-04-03 02:22:05'::timestamptz),
(209, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:13:00'::time, '20:13:00'::time, (0 = 1), '2026-04-03 02:22:05'::timestamptz, '2026-04-03 02:22:05'::timestamptz),
(210, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:26:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:22:05'::timestamptz, '2026-04-03 02:22:05'::timestamptz),
(211, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '05:30:00'::time, (0 = 1), '2026-04-03 02:22:33'::timestamptz, '2026-04-03 02:22:33'::timestamptz),
(212, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:02:00'::time, '06:02:00'::time, (0 = 1), '2026-04-03 02:22:33'::timestamptz, '2026-04-03 02:22:33'::timestamptz),
(213, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:22:33'::timestamptz, '2026-04-03 02:22:33'::timestamptz),
(214, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:57:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:22:33'::timestamptz, '2026-04-03 02:22:33'::timestamptz),
(215, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:14:00'::time, '20:14:00'::time, (0 = 1), '2026-04-03 02:22:33'::timestamptz, '2026-04-03 02:22:33'::timestamptz),
(216, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:28:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:22:33'::timestamptz, '2026-04-03 02:22:33'::timestamptz),
(217, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:35:00'::time, '05:30:00'::time, (0 = 1), '2026-04-03 02:23:01'::timestamptz, '2026-04-03 02:23:01'::timestamptz),
(218, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:00:00'::time, '06:00:00'::time, (0 = 1), '2026-04-03 02:23:01'::timestamptz, '2026-04-03 02:23:01'::timestamptz),
(219, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:23:01'::timestamptz, '2026-04-03 02:23:01'::timestamptz),
(220, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:58:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:23:01'::timestamptz, '2026-04-03 02:23:01'::timestamptz),
(221, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:16:00'::time, '20:16:00'::time, (0 = 1), '2026-04-03 02:23:01'::timestamptz, '2026-04-03 02:23:01'::timestamptz),
(222, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:30:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:23:01'::timestamptz, '2026-04-03 02:23:01'::timestamptz),
(223, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:32:00'::time, '05:32:00'::time, (0 = 1), '2026-04-03 02:23:31'::timestamptz, '2026-04-03 02:23:31'::timestamptz),
(224, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:58:00'::time, '05:58:00'::time, (0 = 1), '2026-04-03 02:23:31'::timestamptz, '2026-04-03 02:23:31'::timestamptz),
(225, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:23:31'::timestamptz, '2026-04-03 02:23:31'::timestamptz),
(226, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:59:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:23:31'::timestamptz, '2026-04-03 02:23:31'::timestamptz),
(227, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:18:00'::time, '20:18:00'::time, (0 = 1), '2026-04-03 02:23:31'::timestamptz, '2026-04-03 02:23:31'::timestamptz),
(228, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:32:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:23:31'::timestamptz, '2026-04-03 02:23:31'::timestamptz),
(229, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:29:00'::time, '05:30:00'::time, (0 = 1), '2026-04-03 02:24:01'::timestamptz, '2026-04-03 02:24:01'::timestamptz),
(230, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:56:00'::time, '05:56:00'::time, (0 = 1), '2026-04-03 02:24:01'::timestamptz, '2026-04-03 02:24:01'::timestamptz),
(231, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:24:01'::timestamptz, '2026-04-03 02:24:01'::timestamptz),
(232, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:00:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:24:01'::timestamptz, '2026-04-03 02:24:01'::timestamptz),
(233, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:20:00'::time, '20:20:00'::time, (0 = 1), '2026-04-03 02:24:01'::timestamptz, '2026-04-03 02:24:01'::timestamptz),
(234, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:34:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:24:01'::timestamptz, '2026-04-03 02:24:01'::timestamptz),
(235, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:26:00'::time, '05:30:00'::time, (0 = 1), '2026-04-03 02:24:27'::timestamptz, '2026-04-03 02:24:27'::timestamptz),
(236, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:54:00'::time, '05:54:00'::time, (0 = 1), '2026-04-03 02:24:27'::timestamptz, '2026-04-03 02:24:27'::timestamptz),
(237, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:24:27'::timestamptz, '2026-04-03 02:24:27'::timestamptz),
(238, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:01:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:24:27'::timestamptz, '2026-04-03 02:24:27'::timestamptz),
(239, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:21:00'::time, '20:21:00'::time, (0 = 1), '2026-04-03 02:24:27'::timestamptz, '2026-04-03 02:24:27'::timestamptz),
(240, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:36:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:24:27'::timestamptz, '2026-04-03 02:24:27'::timestamptz),
(241, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:23:00'::time, '05:30:00'::time, (0 = 1), '2026-04-03 02:24:57'::timestamptz, '2026-04-03 02:24:57'::timestamptz),
(242, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:52:00'::time, '05:52:00'::time, (0 = 1), '2026-04-03 02:24:57'::timestamptz, '2026-04-03 02:24:57'::timestamptz),
(243, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:24:57'::timestamptz, '2026-04-03 02:24:57'::timestamptz),
(244, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:02:00'::time, '18:30:00'::time, (0 = 1), '2026-04-03 02:24:57'::timestamptz, '2026-04-03 02:24:57'::timestamptz),
(245, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:23:00'::time, '20:23:00'::time, (0 = 1), '2026-04-03 02:24:57'::timestamptz, '2026-04-03 02:24:57'::timestamptz),
(246, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:38:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:24:57'::timestamptz, '2026-04-03 02:24:57'::timestamptz),
(247, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:20:00'::time, '05:15:00'::time, (0 = 1), '2026-04-03 02:27:39'::timestamptz, '2026-04-03 02:27:39'::timestamptz),
(248, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:50:00'::time, '05:50:00'::time, (0 = 1), '2026-04-03 02:27:39'::timestamptz, '2026-04-03 02:27:39'::timestamptz),
(249, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:27:39'::timestamptz, '2026-04-03 02:27:39'::timestamptz),
(250, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:03:00'::time, '19:00:00'::time, (0 = 1), '2026-04-03 02:27:39'::timestamptz, '2026-04-03 02:27:39'::timestamptz),
(251, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:25:00'::time, '20:25:00'::time, (0 = 1), '2026-04-03 02:27:39'::timestamptz, '2026-04-03 02:27:39'::timestamptz),
(252, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:40:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:27:39'::timestamptz, '2026-04-03 02:27:39'::timestamptz),
(253, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:17:00'::time, '05:15:00'::time, (0 = 1), '2026-04-03 02:28:31'::timestamptz, '2026-04-03 02:28:31'::timestamptz),
(254, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:50:00'::time, '05:50:00'::time, (0 = 1), '2026-04-03 02:28:31'::timestamptz, '2026-04-03 02:28:31'::timestamptz),
(255, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:28:31'::timestamptz, '2026-04-03 02:28:31'::timestamptz),
(256, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:04:00'::time, '19:00:00'::time, (0 = 1), '2026-04-03 02:28:31'::timestamptz, '2026-04-03 02:28:31'::timestamptz),
(257, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:26:00'::time, '20:26:00'::time, (0 = 1), '2026-04-03 02:28:31'::timestamptz, '2026-04-03 02:28:31'::timestamptz),
(258, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:42:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:28:31'::timestamptz, '2026-04-03 02:28:31'::timestamptz),
(259, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:14:00'::time, '05:15:00'::time, (0 = 1), '2026-04-03 02:28:59'::timestamptz, '2026-04-03 02:28:59'::timestamptz),
(260, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:46:00'::time, '05:46:00'::time, (0 = 1), '2026-04-03 02:28:59'::timestamptz, '2026-04-03 02:28:59'::timestamptz),
(261, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:28:59'::timestamptz, '2026-04-03 02:28:59'::timestamptz),
(262, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:05:00'::time, '19:00:00'::time, (0 = 1), '2026-04-03 02:28:59'::timestamptz, '2026-04-03 02:28:59'::timestamptz),
(263, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:28:00'::time, '20:28:00'::time, (0 = 1), '2026-04-03 02:28:59'::timestamptz, '2026-04-03 02:28:59'::timestamptz),
(264, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:44:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:28:59'::timestamptz, '2026-04-03 02:28:59'::timestamptz),
(265, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:11:00'::time, '05:15:00'::time, (0 = 1), '2026-04-03 02:29:27'::timestamptz, '2026-04-03 02:29:27'::timestamptz),
(266, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:44:00'::time, '05:44:00'::time, (0 = 1), '2026-04-03 02:29:27'::timestamptz, '2026-04-03 02:29:27'::timestamptz),
(267, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:29:27'::timestamptz, '2026-04-03 02:29:27'::timestamptz),
(268, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:06:00'::time, '19:00:00'::time, (0 = 1), '2026-04-03 02:29:27'::timestamptz, '2026-04-03 02:29:27'::timestamptz),
(269, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:30:00'::time, '20:30:00'::time, (0 = 1), '2026-04-03 02:29:27'::timestamptz, '2026-04-03 02:29:27'::timestamptz),
(270, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:46:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:29:27'::timestamptz, '2026-04-03 02:29:27'::timestamptz),
(271, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:07:00'::time, '05:15:00'::time, (0 = 1), '2026-04-03 02:29:54'::timestamptz, '2026-04-03 02:29:54'::timestamptz),
(272, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:41:00'::time, '05:41:00'::time, (0 = 1), '2026-04-03 02:29:54'::timestamptz, '2026-04-03 02:29:54'::timestamptz),
(273, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:29:54'::timestamptz, '2026-04-03 02:29:54'::timestamptz),
(274, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:07:00'::time, '19:00:00'::time, (0 = 1), '2026-04-03 02:29:54'::timestamptz, '2026-04-03 02:29:54'::timestamptz),
(275, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:32:00'::time, '20:32:00'::time, (0 = 1), '2026-04-03 02:29:54'::timestamptz, '2026-04-03 02:29:54'::timestamptz),
(276, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:48:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:29:54'::timestamptz, '2026-04-03 02:29:54'::timestamptz),
(277, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:03:00'::time, '05:15:00'::time, (0 = 1), '2026-04-03 02:30:21'::timestamptz, '2026-04-03 02:30:21'::timestamptz),
(278, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:40:00'::time, '05:40:00'::time, (0 = 1), '2026-04-03 02:30:21'::timestamptz, '2026-04-03 02:30:21'::timestamptz),
(279, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:30:21'::timestamptz, '2026-04-03 02:30:21'::timestamptz),
(280, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:08:00'::time, '19:00:00'::time, (0 = 1), '2026-04-03 02:30:21'::timestamptz, '2026-04-03 02:30:21'::timestamptz),
(281, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:33:00'::time, '21:49:00'::time, (0 = 1), '2026-04-03 02:30:21'::timestamptz, '2026-04-03 02:30:21'::timestamptz),
(282, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:49:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:30:21'::timestamptz, '2026-04-03 02:30:21'::timestamptz),
(283, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:00:00'::time, '05:15:00'::time, (0 = 1), '2026-04-03 02:30:47'::timestamptz, '2026-04-03 02:30:47'::timestamptz),
(284, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:38:00'::time, '05:38:00'::time, (0 = 1), '2026-04-03 02:30:47'::timestamptz, '2026-04-03 02:30:47'::timestamptz),
(285, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, (0 = 1), '2026-04-03 02:30:47'::timestamptz, '2026-04-03 02:30:47'::timestamptz),
(286, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:09:00'::time, '19:00:00'::time, (0 = 1), '2026-04-03 02:30:47'::timestamptz, '2026-04-03 02:30:47'::timestamptz),
(287, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:35:00'::time, '20:35:00'::time, (0 = 1), '2026-04-03 02:30:47'::timestamptz, '2026-04-03 02:30:47'::timestamptz),
(288, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:50:00'::time, '22:00:00'::time, (0 = 1), '2026-04-03 02:30:47'::timestamptz, '2026-04-03 02:30:47'::timestamptz)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 9. INCIDENT LOGS, MEDICAL LOGS, AUDIT TRAIL & ACADEMICS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS incident_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campus_id TEXT NOT NULL DEFAULT 'kts' REFERENCES campuses(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
    date DATE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    action_taken TEXT,
    attachments JSONB,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS medical_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campus_id TEXT NOT NULL DEFAULT 'kts' REFERENCES campuses(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
    condition_title VARCHAR(150) NOT NULL,
    details TEXT,
    medication TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campus_id TEXT REFERENCES campuses(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS academic_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    sabaq_surah VARCHAR(100),
    sabaq_ayah VARCHAR(100),
    sabqi_juz VARCHAR(50),
    manzil_juz VARCHAR(50),
    tajweed_score INT DEFAULT 5,
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS news (
    id INT PRIMARY KEY,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS slider_images (
    id INT PRIMARY KEY,
    image_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS document_uplouds (
    id INT PRIMARY KEY,
    type VARCHAR(100),
    reference_id INT,
    name VARCHAR(255),
    file_name VARCHAR(255),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Migrating news:
INSERT INTO news VALUES
(1, 'Listen Quran', (1 = 1), '2026-01-21 06:12:32'::timestamptz, '2026-01-21 06:12:32'::timestamptz),
(2, 'Read Quran.', (1 = 1), '2026-01-21 06:12:32'::timestamptz, '2026-01-21 06:12:32'::timestamptz),
(3, 'Memorise Quran', (1 = 1), '2026-01-21 06:12:32'::timestamptz, '2026-01-21 06:12:32'::timestamptz),
(4, 'Welcome to Musbah Ul Quran Institute. Admissions are open for new academic year.', (1 = 1), '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(5, 'Reminder: Parent-Teacher meeting will be held on coming Friday.', (1 = 1), '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(6, 'New Quran memorization classes starting soon. Register now!', (1 = 1), '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz)
ON CONFLICT (id) DO NOTHING;

-- Migrating slider_images:
INSERT INTO slider_images VALUES
(7, 'storage/slider/1769153865_1.jpg', (1 = 1), '2026-01-23 02:37:46'::timestamptz, '2026-01-23 02:37:46'::timestamptz),
(8, 'storage/slider/1769608329_1769528657_Untitled design.webp', (1 = 1), '2026-01-28 08:52:10'::timestamptz, '2026-01-28 08:52:10'::timestamptz),
(9, 'storage/slider/1772782636_2.jpg', (1 = 1), '2026-03-06 02:37:17'::timestamptz, '2026-03-06 02:37:17'::timestamptz),
(10, 'images/slider/1.jpg', (1 = 1), '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(11, 'images/slider/2.jpg', (1 = 1), '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
(12, 'images/slider/3.jpg', (1 = 1), '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz)
ON CONFLICT (id) DO NOTHING;

-- Migrating document_uplouds:
INSERT INTO document_uplouds VALUES
(6, 'teacher', 14, 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/LsUf5ZbgYImxdOzcXLXgOPneaykDFKvW0nreOYcK.docx', '2026-06-23 02:43:22'::timestamptz, '2026-06-23 02:43:22'::timestamptz),
(8, 'incident', 1, 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/YlWcgmRmIDDYY9vUDKW0rtedxSW3OY8VM4bWtkU9.docx', '2026-06-23 03:04:33'::timestamptz, '2026-06-23 03:04:33'::timestamptz),
(10, 'incident', 2, 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/hvRabFHv3oIAfFssAHXofJcWXKWVA0NNYN4g7dS7.docx', '2026-06-23 03:05:39'::timestamptz, '2026-06-23 03:05:39'::timestamptz)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ==============================================================================
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_progress ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text AS $$
    SELECT role FROM users WHERE id = auth.uid()::text OR email = auth.jwt()->>'email';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_campus()
RETURNS text AS $$
    SELECT active_campus_id FROM users WHERE id = auth.uid()::text OR email = auth.jwt()->>'email';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Campus access policy
DROP POLICY IF EXISTS "Public read for campuses" ON campuses;
CREATE POLICY "Public read for campuses" ON campuses FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Super admin manage campuses" ON campuses;
CREATE POLICY "Super admin manage campuses" ON campuses FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');

-- Student RLS policies
DROP POLICY IF EXISTS "Super admin full access on students" ON students;
CREATE POLICY "Super admin full access on students" ON students FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');
DROP POLICY IF EXISTS "Campus admin own campus students" ON students;
CREATE POLICY "Campus admin own campus students" ON students FOR ALL TO authenticated USING (auth_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth_user_campus());
DROP POLICY IF EXISTS "Teacher view students in class" ON students;
CREATE POLICY "Teacher view students in class" ON students FOR SELECT TO authenticated USING (
    auth_user_role() = 'TEACHER' AND class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()::text
    )
);
DROP POLICY IF EXISTS "Parent view own children" ON students;
CREATE POLICY "Parent view own children" ON students FOR SELECT TO authenticated USING (
    auth_user_role() = 'PARENT' AND parent_id = auth.uid()::text
);

-- Attendance RLS policies
DROP POLICY IF EXISTS "Super admin full student attendance" ON student_attendances;
CREATE POLICY "Super admin full student attendance" ON student_attendances FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');
DROP POLICY IF EXISTS "Campus admin own student attendance" ON student_attendances;
CREATE POLICY "Campus admin own student attendance" ON student_attendances FOR ALL TO authenticated USING (auth_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth_user_campus());
DROP POLICY IF EXISTS "Teacher manage own class student attendance" ON student_attendances;
CREATE POLICY "Teacher manage own class student attendance" ON student_attendances FOR ALL TO authenticated USING (
    auth_user_role() = 'TEACHER' AND class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "Super admin full teacher attendance" ON teacher_attendances;
CREATE POLICY "Super admin full teacher attendance" ON teacher_attendances FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');
DROP POLICY IF EXISTS "Campus admin own teacher attendance" ON teacher_attendances;
CREATE POLICY "Campus admin own teacher attendance" ON teacher_attendances FOR ALL TO authenticated USING (auth_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth_user_campus());
DROP POLICY IF EXISTS "Teacher own self attendance" ON teacher_attendances;
CREATE POLICY "Teacher own self attendance" ON teacher_attendances FOR ALL TO authenticated USING (teacher_id = auth.uid()::text);

-- Invoices RLS policies
DROP POLICY IF EXISTS "Super admin full invoices" ON payment_invoices;
CREATE POLICY "Super admin full invoices" ON payment_invoices FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');
DROP POLICY IF EXISTS "Campus admin own invoices" ON payment_invoices;
CREATE POLICY "Campus admin own invoices" ON payment_invoices FOR ALL TO authenticated USING (auth_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth_user_campus());
DROP POLICY IF EXISTS "Parent view own invoices" ON payment_invoices;
CREATE POLICY "Parent view own invoices" ON payment_invoices FOR SELECT TO authenticated USING (
    auth_user_role() = 'PARENT' AND reference_id IN (SELECT id FROM students WHERE parent_id = auth.uid()::text)
);

-- ==============================================================================
-- 11. POSTGRES ROLE PRIVILEGES (FOR SUPABASE POSTGREST REST API)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Allow anon & authenticated read/write access subject to RLS or direct operational table usage
DROP POLICY IF EXISTS "Anon read users for login lookup" ON users;
CREATE POLICY "Anon read users for login lookup" ON users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anon read campuses" ON campuses;
CREATE POLICY "Anon read campuses" ON campuses FOR SELECT TO anon, authenticated USING (true);
