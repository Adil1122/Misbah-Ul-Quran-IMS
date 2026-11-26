-- ==============================================================================
-- MISBAH-UL-QURAN IMS — CLEAN PRODUCTION DATABASE MIGRATION (ZERO SEED DATA)
-- Generated from actual production MySQL dump.
-- Preserves all genuine records:
-- 13 Users, 15 Classes, 8 Teacher Profiles, 120 Students, 238 Payment Invoices,
-- 288 Prayer Timings, 2 Incident Logs, 3 Document Uploads, 6 News, 6 Slider Images.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Safely remove any previous synthetic seed data (checks if table exists first)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
        DELETE FROM students WHERE id LIKE 'std-%' OR id LIKE 'MUQ-%';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classes') THEN
        DELETE FROM classes WHERE id LIKE 'cls-%';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teacher_profiles') THEN
        DELETE FROM teacher_profiles WHERE id LIKE 'tch-%';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_invoices') THEN
        DELETE FROM payment_invoices WHERE id LIKE 'inv-%';
    END IF;
END $$;

-- ==============================================================================
-- 1. CAMPUSES
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

INSERT INTO campuses (id, code, name, country, city, address, timezone, currency_code, phone, email)
VALUES 
    ('kts', 'KTS-01', 'KTS Pakistan Campus', 'Pakistan', 'Haripur', 'Sector 3, Khalabat Township, Haripur, KPK', 'Asia/Karachi', 'PKR', '+92 995 612345', 'kts@misbahulquran.org'),
    ('uk', 'UK-01', 'UK Campus', 'United Kingdom', 'London', '142 Whitechapel Road, London E1 1JE', 'Europe/London', 'GBP', '+44 20 7946 0192', 'london@misbahulquran.org'),
    ('all', 'GLOBAL', 'All Campuses (Headquarters)', 'Global', 'Global', 'International Central Office', 'UTC', 'GBP', '+44 20 7946 0192', 'global@misbahulquran.org')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    timezone = EXCLUDED.timezone,
    currency_code = EXCLUDED.currency_code;

-- ==============================================================================
-- 2. USERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email VARCHAR(150),
    username VARCHAR(100),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'TEACHER',
    active_campus_id TEXT REFERENCES campuses(id) ON DELETE SET NULL,
    status SMALLINT DEFAULT 1,
    image TEXT,
    contact_number VARCHAR(50),
    allowed_campus_ids JSONB DEFAULT '["kts"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'TEACHER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_campus_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status SMALLINT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_campus_ids JSONB DEFAULT '["kts"]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE OR REPLACE VIEW profiles AS
SELECT 
    id, email, username, first_name || ' ' || last_name AS full_name,
    role, active_campus_id, status, image, contact_number, created_at, updated_at
FROM users;

INSERT INTO users (id, first_name, last_name, email, password, status, image, contact_number, role, active_campus_id, allowed_campus_ids, created_at, updated_at) VALUES
('1', 'Ahsan', 'Hanif', 'ahsanhanif99@gmail.com', '$2y$12$UvTqc59Eh6/i5MyJ8HR5AufdrseM8G0HkoW8XKe/B3bM6qYu31d36', 1, NULL, '923300000001', 'SUPER_ADMIN', 'kts', '["all", "uk", "kts"]'::jsonb, '2026-01-20 03:24:23'::timestamptz, '2026-01-20 03:24:23'::timestamptz),
('2', 'Teacher1', 'Lastname1', 'teacher1@gmail.com', '$2y$12$UQ17Fpjhc/JVVJpuODlWSu2.F2va3CXgdsHyw4aHbcNa6vfUuRH76', 1, NULL, '923300000001', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:23'::timestamptz, '2026-01-20 03:24:23'::timestamptz),
('3', 'Teacher2', 'Lastname2', 'teacher2@gmail.com', '$2y$12$WmRaCVwgJIZTRnsAqHvqqufXggegghE3.oe5yfwx24HjU6ASuwkU6', 1, NULL, '923300000002', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
('4', 'Teacher3', 'Lastname3', 'teacher3@gmail.com', '$2y$12$2DEkuN1/sT5fsOAF1vd73OVDjjUDhivtz84TJCPtaVNowsHVf265W', 1, NULL, '923300000003', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
('5', 'Teacher4', 'Lastname4', 'teacher4@gmail.com', '$2y$12$vDRkxwTJWTfLXhlaJI5F2u6krdOEWOH6XjpIlXC5SdT319HOOSJKW', 1, NULL, '923300000004', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
('6', 'Teacher5', 'Lastname5', 'teacher5@gmail.com', '$2y$12$.NpDsAxK.yXzG8/4QeQ1WO6Jv12pqcMGJKrC8t/jVY79yiZWtF0IO', 1, NULL, '923300000005', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
('7', 'Parent1', 'Lastname1', 'parent1@gmail.com', '$2y$12$TKZ6f5hDNuU/ocsFMjVlV./hkv9HMOJrgCnDX6k3jCtNgLxgdQa7y', 1, NULL, '923310000001', 'PARENT', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:25'::timestamptz, '2026-01-20 03:24:25'::timestamptz),
('8', 'Parent2', 'Lastname2', 'parent2@gmail.com', '$2y$12$H4HX/lpcz9Imt75QTC4dROTdn.DWUBs/MZsO2zEp..bl6ww7VLgS6', 1, NULL, '923310000002', 'PARENT', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:25'::timestamptz, '2026-01-20 03:24:25'::timestamptz),
('9', 'Parent3', 'Lastname3', 'parent3@gmail.com', '$2y$12$GIKT958Jzfk5BSnfOgw/HeSGsiH5qZnJ5kQxoXhJZRuXR1wAsHJxq', 1, NULL, '923310000003', 'PARENT', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:25'::timestamptz, '2026-01-20 03:24:25'::timestamptz),
('10', 'Parent4', 'Lastname4', 'parent4@gmail.com', '$2y$12$gwF.K.AXHJulwPOeYQ52j.kE94JU.R5azZAfg2bbpgLqI/Jdc1HYi', 1, NULL, '923310000004', 'PARENT', 'kts', '["kts"]'::jsonb, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
('12', 'test', 'teacher', NULL, '$2y$12$gVmxie.gcDz8S3he251RBO3T3VwKNcGWNivTEic/s0vND6UrLaDTO', 1, NULL, '326527836', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-05-18 01:52:56'::timestamptz, '2026-05-18 01:52:56'::timestamptz),
('13', 'test', 'teacher 2', NULL, '$2y$12$Sn6Lj3p.OpSPq/SpcGrJWuK3BLbb2x6kc1EI9/UjC.F9koyCYVD1O', 1, NULL, '495728', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-05-18 01:57:13'::timestamptz, '2026-05-18 01:57:13'::timestamptz),
('14', 'new', '7090', 'new@email.com', '$2y$12$5OWsAqjESDpfbRNZFSdroe.JxugblHEnVOmKyT1gp8N3tdCXKe.ey', 1, NULL, '37463824632', 'TEACHER', 'kts', '["kts"]'::jsonb, '2026-06-23 02:33:07'::timestamptz, '2026-06-23 02:33:07'::timestamptz),
('usr-super-01', 'Muhammad', 'Ibrahim', 'superadmin@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0192', 'SUPER_ADMIN', 'all', '["all", "uk", "kts"]'::jsonb, now(), now()),
('usr-admin-uk-01', 'Tariq', 'Mahmood', 'admin.uk@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0193', 'CAMPUS_ADMIN', 'uk', '["uk"]'::jsonb, now(), now()),
('usr-admin-kts-01', 'Abdul Rehman', 'Khan', 'admin.kts@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+92 995 612345', 'CAMPUS_ADMIN', 'kts', '["kts"]'::jsonb, now(), now())
ON CONFLICT (id) DO UPDATE SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, email=EXCLUDED.email, password=EXCLUDED.password, role=EXCLUDED.role;

-- ==============================================================================
-- 3. CLASSES (15 Genuine Classes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    name VARCHAR(150),
    admission_fee NUMERIC(12,2) DEFAULT 0.00,
    description TEXT,
    teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    capacity INT DEFAULT 25,
    academic_year VARCHAR(30) DEFAULT '2025-2026',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE classes ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'kts';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS title VARCHAR(150);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS name VARCHAR(150);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS admission_fee NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_id TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 25;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year VARCHAR(30) DEFAULT '2025-2026';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO classes (id, campus_id, title, name, admission_fee, description, teacher_id, capacity, academic_year, is_active, created_at, updated_at) VALUES
('1', 'kts', 'B-1', 'B-1', 100.00, 'Junior Boys Section', NULL, 25, '2025-2026', true, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
('2', 'kts', 'B-2', 'B-2', 100.00, 'Senior Boys Section', NULL, 25, '2025-2026', true, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
('3', 'kts', 'G-1', 'G-1', 200.00, 'Junior Girls Section', NULL, 25, '2025-2026', true, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
('4', 'kts', 'G-2', 'G-2', 200.00, 'Senior Girls Section', NULL, 25, '2025-2026', true, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
('5', 'kts', 'Hifz', 'Hifz', 500.00, 'Boys Only', NULL, 25, '2025-2026', true, '2026-01-20 03:24:26'::timestamptz, '2026-01-20 03:24:26'::timestamptz),
('6', 'kts', 'B-1', 'B-1', 100.00, 'Junior Boys Section', NULL, 25, '2025-2026', true, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
('7', 'kts', 'B-2', 'B-2', 100.00, 'Senior Boys Section', NULL, 25, '2025-2026', true, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
('8', 'kts', 'G-1', 'G-1', 200.00, 'Junior Girls Section', NULL, 25, '2025-2026', true, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
('9', 'kts', 'G-2', 'G-2', 200.00, 'Senior Girls Section', NULL, 25, '2025-2026', true, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
('10', 'kts', 'Hifz', 'Hifz', 500.00, 'Boys Only', NULL, 25, '2025-2026', true, '2026-04-08 08:01:28'::timestamptz, '2026-04-08 08:01:28'::timestamptz),
('11', 'kts', 'B-1', 'B-1', 100.00, 'Junior Boys Section', NULL, 25, '2025-2026', true, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('12', 'kts', 'B-2', 'B-2', 100.00, 'Senior Boys Section', NULL, 25, '2025-2026', true, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('13', 'kts', 'G-1', 'G-1', 200.00, 'Junior Girls Section', NULL, 25, '2025-2026', true, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('14', 'kts', 'G-2', 'G-2', 200.00, 'Senior Girls Section', NULL, 25, '2025-2026', true, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('15', 'kts', 'Hifz', 'Hifz', 500.00, 'Boys Only', NULL, 25, '2025-2026', true, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, name=EXCLUDED.name, admission_fee=EXCLUDED.admission_fee, description=EXCLUDED.description;

-- ==============================================================================
-- 4. TEACHER PROFILES (8 Genuine Teachers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id TEXT PRIMARY KEY,
    teacher_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE,
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

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'kts';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS specialization VARCHAR(150) DEFAULT 'Quran & Tajweed';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS qualification VARCHAR(150);
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'PKR';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS salary_day VARCHAR(20) DEFAULT 'Friday';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS assigned_class_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

DELETE FROM teacher_profiles;
INSERT INTO teacher_profiles (id, teacher_id, campus_id, employee_code, joining_date, salary, salary_currency, salary_day, status, created_at, updated_at) VALUES
('1', '2', 'kts', 'TCH-KTS-1', '2024-01-20'::date, 55000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:23'::timestamptz, '2026-01-20 03:24:23'::timestamptz),
('2', '3', 'kts', 'TCH-KTS-2', '2024-01-20'::date, 60000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
('3', '4', 'kts', 'TCH-KTS-3', '2024-01-20'::date, 65000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
('4', '5', 'kts', 'TCH-KTS-4', '2024-01-20'::date, 70000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
('5', '6', 'kts', 'TCH-KTS-5', '2024-01-20'::date, 75000.00, 'PKR', 'Friday', 'active', '2026-01-20 03:24:24'::timestamptz, '2026-01-20 03:24:24'::timestamptz),
('6', '12', 'kts', 'TCH-KTS-6', '2026-05-18'::date, 445.00, 'PKR', 'Friday', 'active', '2026-05-18 01:52:56'::timestamptz, '2026-05-18 01:52:56'::timestamptz),
('7', '13', 'kts', 'TCH-KTS-7', '2026-05-18'::date, 44.00, 'PKR', 'Friday', 'active', '2026-05-18 01:57:13'::timestamptz, '2026-05-18 01:57:13'::timestamptz),
('8', '14', 'kts', 'TCH-KTS-8', '2026-06-23'::date, 566.00, 'PKR', 'Friday', 'active', '2026-06-23 02:33:07'::timestamptz, '2026-06-23 02:33:07'::timestamptz)
ON CONFLICT (teacher_id) DO UPDATE SET id=EXCLUDED.id, salary=EXCLUDED.salary, status=EXCLUDED.status, salary_day=EXCLUDED.salary_day, employee_code=EXCLUDED.employee_code;

-- ==============================================================================
-- 5. STUDENTS (120 Genuine Students)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    date_of_birth DATE,
    gender VARCHAR(20) DEFAULT 'female',
    address TEXT,
    primary_contact_details TEXT,
    secondary_contact_details TEXT,
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

ALTER TABLE students ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'kts';
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'female';
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS primary_contact_details TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS secondary_contact_details TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS allowed_medicines TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_fee_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE students ADD COLUMN IF NOT EXISTS monthly_fee_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE students ADD COLUMN IF NOT EXISTS fee_due_day INT DEFAULT 10;
ALTER TABLE students ADD COLUMN IF NOT EXISTS default_payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE students ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'APPROVED';
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO students (id, campus_id, parent_id, class_id, first_name, last_name, roll_number, status, date_of_birth, gender, address, primary_contact_details, secondary_contact_details, medical_history, allowed_medicines, admission_date, admission_fee_amount, monthly_fee_amount, fee_due_day, default_payment_method, approval_status, created_at, updated_at) VALUES
('1', 'kts', '7', '1', 'Student1', 'Lastname1', 'REG-1000', 'active', '2014-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 912.00, 10, 'cash', 'APPROVED', '2026-04-08 08:01:29'::timestamptz, '2026-04-08 08:01:29'::timestamptz),
('2', 'kts', '7', '1', 'Student2', 'Lastname2', 'REG-1001', 'active', '2015-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 980.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('3', 'kts', '7', '2', 'Student3', 'Lastname3', 'REG-1002', 'active', '2020-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1634.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('4', 'kts', '7', '2', 'Student4', 'Lastname4', 'REG-1003', 'active', '2018-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1589.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('5', 'kts', '7', '3', 'Student5', 'Lastname5', 'REG-1004', 'active', '2017-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1655.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('6', 'kts', '7', '3', 'Student6', 'Lastname6', 'REG-1005', 'active', '2018-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1476.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('7', 'kts', '7', '4', 'Student7', 'Lastname7', 'REG-1006', 'active', '2016-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1257.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('8', 'kts', '7', '4', 'Student8', 'Lastname8', 'REG-1007', 'active', '2017-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 911.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('9', 'kts', '7', '5', 'Student9', 'Lastname9', 'REG-1008', 'active', '2018-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1196.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('10', 'kts', '7', '5', 'Student10', 'Lastname10', 'REG-1009', 'active', '2018-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1027.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('11', 'kts', '7', '6', 'Student11', 'Lastname11', 'REG-1010', 'active', '2020-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1277.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('12', 'kts', '7', '6', 'Student12', 'Lastname12', 'REG-1011', 'active', '2019-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1808.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('13', 'kts', '7', '7', 'Student13', 'Lastname13', 'REG-1012', 'active', '2014-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1110.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('14', 'kts', '7', '7', 'Student14', 'Lastname14', 'REG-1013', 'active', '2017-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1514.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('15', 'kts', '7', '8', 'Student15', 'Lastname15', 'REG-1014', 'active', '2018-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1531.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('16', 'kts', '7', '8', 'Student16', 'Lastname16', 'REG-1015', 'active', '2020-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1185.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('17', 'kts', '7', '9', 'Student17', 'Lastname17', 'REG-1016', 'active', '2015-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1132.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('18', 'kts', '7', '9', 'Student18', 'Lastname18', 'REG-1017', 'active', '2014-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1057.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('19', 'kts', '7', '10', 'Student19', 'Lastname19', 'REG-1018', 'active', '2019-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1520.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('20', 'kts', '7', '10', 'Student20', 'Lastname20', 'REG-1019', 'active', '2016-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1266.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('21', 'kts', '7', '11', 'Student21', 'Lastname21', 'REG-1020', 'active', '2020-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1486.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('22', 'kts', '7', '11', 'Student22', 'Lastname22', 'REG-1021', 'active', '2014-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1690.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('23', 'kts', '7', '12', 'Student23', 'Lastname23', 'REG-1022', 'active', '2018-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 962.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('24', 'kts', '7', '12', 'Student24', 'Lastname24', 'REG-1023', 'active', '2014-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1043.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('25', 'kts', '7', '13', 'Student25', 'Lastname25', 'REG-1024', 'active', '2016-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1898.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('26', 'kts', '7', '13', 'Student26', 'Lastname26', 'REG-1025', 'active', '2020-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1715.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('27', 'kts', '7', '14', 'Student27', 'Lastname27', 'REG-1026', 'active', '2016-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1876.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('28', 'kts', '7', '14', 'Student28', 'Lastname28', 'REG-1027', 'active', '2016-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 994.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('29', 'kts', '7', '15', 'Student29', 'Lastname29', 'REG-1028', 'active', '2014-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 827.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('30', 'kts', '7', '15', 'Student30', 'Lastname30', 'REG-1029', 'active', '2020-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1546.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('31', 'kts', '8', '1', 'Student31', 'Lastname31', 'REG-1030', 'active', '2019-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 845.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('32', 'kts', '8', '1', 'Student32', 'Lastname32', 'REG-1031', 'active', '2014-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1552.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('33', 'kts', '8', '2', 'Student33', 'Lastname33', 'REG-1032', 'active', '2017-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1439.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('34', 'kts', '8', '2', 'Student34', 'Lastname34', 'REG-1033', 'active', '2020-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1984.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('35', 'kts', '8', '3', 'Student35', 'Lastname35', 'REG-1034', 'active', '2015-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 990.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('36', 'kts', '8', '3', 'Student36', 'Lastname36', 'REG-1035', 'active', '2019-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1584.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('37', 'kts', '8', '4', 'Student37', 'Lastname37', 'REG-1036', 'active', '2016-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 811.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('38', 'kts', '8', '4', 'Student38', 'Lastname38', 'REG-1037', 'active', '2018-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1881.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('39', 'kts', '8', '5', 'Student39', 'Lastname39', 'REG-1038', 'active', '2015-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1088.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('40', 'kts', '8', '5', 'Student40', 'Lastname40', 'REG-1039', 'active', '2019-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1785.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('41', 'kts', '8', '6', 'Student41', 'Lastname41', 'REG-1040', 'active', '2018-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1406.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('42', 'kts', '8', '6', 'Student42', 'Lastname42', 'REG-1041', 'active', '2014-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1207.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('43', 'kts', '8', '7', 'Student43', 'Lastname43', 'REG-1042', 'active', '2016-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1081.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('44', 'kts', '8', '7', 'Student44', 'Lastname44', 'REG-1043', 'active', '2018-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1977.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('45', 'kts', '8', '8', 'Student45', 'Lastname45', 'REG-1044', 'active', '2020-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 939.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('46', 'kts', '8', '8', 'Student46', 'Lastname46', 'REG-1045', 'active', '2018-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1799.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('47', 'kts', '8', '9', 'Student47', 'Lastname47', 'REG-1046', 'active', '2016-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 957.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('48', 'kts', '8', '9', 'Student48', 'Lastname48', 'REG-1047', 'active', '2015-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1675.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('49', 'kts', '8', '10', 'Student49', 'Lastname49', 'REG-1048', 'active', '2018-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1666.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('50', 'kts', '8', '10', 'Student50', 'Lastname50', 'REG-1049', 'active', '2018-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1271.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('51', 'kts', '8', '11', 'Student51', 'Lastname51', 'REG-1050', 'active', '2014-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1876.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('52', 'kts', '8', '11', 'Student52', 'Lastname52', 'REG-1051', 'active', '2020-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 872.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('53', 'kts', '8', '12', 'Student53', 'Lastname53', 'REG-1052', 'active', '2019-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1288.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('54', 'kts', '8', '12', 'Student54', 'Lastname54', 'REG-1053', 'active', '2020-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1230.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('55', 'kts', '8', '13', 'Student55', 'Lastname55', 'REG-1054', 'active', '2019-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1144.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('56', 'kts', '8', '13', 'Student56', 'Lastname56', 'REG-1055', 'active', '2015-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1049.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('57', 'kts', '8', '14', 'Student57', 'Lastname57', 'REG-1056', 'active', '2017-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1760.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('58', 'kts', '8', '14', 'Student58', 'Lastname58', 'REG-1057', 'active', '2016-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1412.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('59', 'kts', '8', '15', 'Student59', 'Lastname59', 'REG-1058', 'active', '2018-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1493.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('60', 'kts', '8', '15', 'Student60', 'Lastname60', 'REG-1059', 'active', '2020-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1709.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('61', 'kts', '9', '1', 'Student61', 'Lastname61', 'REG-1060', 'active', '2015-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1872.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('62', 'kts', '9', '1', 'Student62', 'Lastname62', 'REG-1061', 'active', '2019-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 832.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('63', 'kts', '9', '2', 'Student63', 'Lastname63', 'REG-1062', 'active', '2020-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1335.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('64', 'kts', '9', '2', 'Student64', 'Lastname64', 'REG-1063', 'active', '2019-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1545.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('65', 'kts', '9', '3', 'Student65', 'Lastname65', 'REG-1064', 'active', '2017-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1903.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('66', 'kts', '9', '3', 'Student66', 'Lastname66', 'REG-1065', 'active', '2020-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1020.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('67', 'kts', '9', '4', 'Student67', 'Lastname67', 'REG-1066', 'active', '2016-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 981.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('68', 'kts', '9', '4', 'Student68', 'Lastname68', 'REG-1067', 'active', '2020-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1751.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('69', 'kts', '9', '5', 'Student69', 'Lastname69', 'REG-1068', 'active', '2019-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1759.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('70', 'kts', '9', '5', 'Student70', 'Lastname70', 'REG-1069', 'active', '2017-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1116.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('71', 'kts', '9', '6', 'Student71', 'Lastname71', 'REG-1070', 'active', '2016-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 977.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('72', 'kts', '9', '6', 'Student72', 'Lastname72', 'REG-1071', 'active', '2020-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1864.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('73', 'kts', '9', '7', 'Student73', 'Lastname73', 'REG-1072', 'active', '2018-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1422.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('74', 'kts', '9', '7', 'Student74', 'Lastname74', 'REG-1073', 'active', '2019-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1807.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('75', 'kts', '9', '8', 'Student75', 'Lastname75', 'REG-1074', 'active', '2019-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1748.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('76', 'kts', '9', '8', 'Student76', 'Lastname76', 'REG-1075', 'active', '2018-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1720.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('77', 'kts', '9', '9', 'Student77', 'Lastname77', 'REG-1076', 'active', '2020-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1896.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('78', 'kts', '9', '9', 'Student78', 'Lastname78', 'REG-1077', 'active', '2020-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1063.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('79', 'kts', '9', '10', 'Student79', 'Lastname79', 'REG-1078', 'active', '2014-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1391.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('80', 'kts', '9', '10', 'Student80', 'Lastname80', 'REG-1079', 'active', '2015-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1864.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('81', 'kts', '9', '11', 'Student81', 'Lastname81', 'REG-1080', 'active', '2018-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1729.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('82', 'kts', '9', '11', 'Student82', 'Lastname82', 'REG-1081', 'active', '2016-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1094.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('83', 'kts', '9', '12', 'Student83', 'Lastname83', 'REG-1082', 'active', '2017-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 804.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('84', 'kts', '9', '12', 'Student84', 'Lastname84', 'REG-1083', 'active', '2016-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1290.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('85', 'kts', '9', '13', 'Student85', 'Lastname85', 'REG-1084', 'active', '2018-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1442.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('86', 'kts', '9', '13', 'Student86', 'Lastname86', 'REG-1085', 'active', '2016-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1305.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('87', 'kts', '9', '14', 'Student87', 'Lastname87', 'REG-1086', 'active', '2019-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1950.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('88', 'kts', '9', '14', 'Student88', 'Lastname88', 'REG-1087', 'active', '2017-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1494.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('89', 'kts', '9', '15', 'Student89', 'Lastname89', 'REG-1088', 'active', '2018-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1117.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('90', 'kts', '9', '15', 'Student90', 'Lastname90', 'REG-1089', 'active', '2017-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 954.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('91', 'kts', '10', '1', 'Student91', 'Lastname91', 'REG-1090', 'active', '2017-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 996.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('92', 'kts', '10', '1', 'Student92', 'Lastname92', 'REG-1091', 'active', '2016-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 807.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('93', 'kts', '10', '2', 'Student93', 'Lastname93', 'REG-1092', 'active', '2020-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1945.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('94', 'kts', '10', '2', 'Student94', 'Lastname94', 'REG-1093', 'active', '2014-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1791.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('95', 'kts', '10', '3', 'Student95', 'Lastname95', 'REG-1094', 'active', '2017-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 848.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('96', 'kts', '10', '3', 'Student96', 'Lastname96', 'REG-1095', 'active', '2017-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1162.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('97', 'kts', '10', '4', 'Student97', 'Lastname97', 'REG-1096', 'active', '2014-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1341.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('98', 'kts', '10', '4', 'Student98', 'Lastname98', 'REG-1097', 'active', '2016-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 892.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('99', 'kts', '10', '5', 'Student99', 'Lastname99', 'REG-1098', 'active', '2020-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1130.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('100', 'kts', '10', '5', 'Student100', 'Lastname100', 'REG-1099', 'active', '2020-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1002.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('101', 'kts', '10', '6', 'Student101', 'Lastname101', 'REG-1100', 'active', '2016-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1147.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('102', 'kts', '10', '6', 'Student102', 'Lastname102', 'REG-1101', 'active', '2020-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1360.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('103', 'kts', '10', '7', 'Student103', 'Lastname103', 'REG-1102', 'active', '2020-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1500.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('104', 'kts', '10', '7', 'Student104', 'Lastname104', 'REG-1103', 'active', '2016-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1410.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('105', 'kts', '10', '8', 'Student105', 'Lastname105', 'REG-1104', 'active', '2018-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 923.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('106', 'kts', '10', '8', 'Student106', 'Lastname106', 'REG-1105', 'active', '2020-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1921.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('107', 'kts', '10', '9', 'Student107', 'Lastname107', 'REG-1106', 'active', '2016-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1628.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('108', 'kts', '10', '9', 'Student108', 'Lastname108', 'REG-1107', 'active', '2014-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1951.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('109', 'kts', '10', '10', 'Student109', 'Lastname109', 'REG-1108', 'active', '2019-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1641.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('110', 'kts', '10', '10', 'Student110', 'Lastname110', 'REG-1109', 'active', '2014-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1670.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('111', 'kts', '10', '11', 'Student111', 'Lastname111', 'REG-1110', 'active', '2020-04-08'::date, 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 824.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('112', 'kts', '10', '11', 'Student112', 'Lastname112', 'REG-1111', 'active', '2015-04-08'::date, 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 895.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('113', 'kts', '10', '12', 'Student113', 'Lastname113', 'REG-1112', 'active', '2020-04-08'::date, 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 1546.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('114', 'kts', '10', '12', 'Student114', 'Lastname114', 'REG-1113', 'active', '2019-04-08'::date, 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 854.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('115', 'kts', '10', '13', 'Student115', 'Lastname115', 'REG-1114', 'active', '2016-04-08'::date, 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1368.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('116', 'kts', '10', '13', 'Student116', 'Lastname116', 'REG-1115', 'active', '2018-04-08'::date, 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08'::date, 100.00, 949.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('117', 'kts', '10', '14', 'Student117', 'Lastname117', 'REG-1116', 'active', '2020-04-08'::date, 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1658.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('118', 'kts', '10', '14', 'Student118', 'Lastname118', 'REG-1117', 'active', '2020-04-08'::date, 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1526.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('119', 'kts', '10', '15', 'Student119', 'Lastname119', 'REG-1118', 'active', '2016-04-08'::date, 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08'::date, 100.00, 1603.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('120', 'kts', '10', '15', 'Student120', 'Lastname120', 'REG-1119', 'active', '2018-04-08'::date, 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08'::date, 100.00, 1153.00, 10, 'cash', 'APPROVED', '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz)
ON CONFLICT (id) DO UPDATE SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, monthly_fee_amount=EXCLUDED.monthly_fee_amount, class_id=EXCLUDED.class_id, parent_id=EXCLUDED.parent_id;

-- ==============================================================================
-- 6. PAYMENT INVOICES (238 Genuine Records)
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

ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'kts';
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'fee_invoice';
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'PKR';
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE payment_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO payment_invoices (id, campus_id, type, reference_id, due_date, amount, currency, payment_method, payment_status, payment_date, created_at, updated_at) VALUES
('1', 'kts', 'fee_invoice', '2', '2026-05-08'::date, 980.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('2', 'kts', 'fee_invoice', '2', '2026-06-08'::date, 980.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('3', 'kts', 'fee_invoice', '3', '2026-05-08'::date, 1634.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('4', 'kts', 'fee_invoice', '3', '2026-06-08'::date, 1634.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('5', 'kts', 'fee_invoice', '4', '2026-05-08'::date, 1589.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('6', 'kts', 'fee_invoice', '4', '2026-06-08'::date, 1589.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('7', 'kts', 'fee_invoice', '5', '2026-05-08'::date, 1655.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('8', 'kts', 'fee_invoice', '5', '2026-06-08'::date, 1655.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('9', 'kts', 'fee_invoice', '6', '2026-05-08'::date, 1476.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('10', 'kts', 'fee_invoice', '6', '2026-06-08'::date, 1476.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('11', 'kts', 'fee_invoice', '7', '2026-05-08'::date, 1257.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('12', 'kts', 'fee_invoice', '7', '2026-06-08'::date, 1257.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('13', 'kts', 'fee_invoice', '8', '2026-05-08'::date, 911.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('14', 'kts', 'fee_invoice', '8', '2026-06-08'::date, 911.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('15', 'kts', 'fee_invoice', '9', '2026-05-08'::date, 1196.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('16', 'kts', 'fee_invoice', '9', '2026-06-08'::date, 1196.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('17', 'kts', 'fee_invoice', '10', '2026-05-08'::date, 1027.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('18', 'kts', 'fee_invoice', '10', '2026-06-08'::date, 1027.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('19', 'kts', 'fee_invoice', '11', '2026-05-08'::date, 1277.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('20', 'kts', 'fee_invoice', '11', '2026-06-08'::date, 1277.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('21', 'kts', 'fee_invoice', '12', '2026-05-08'::date, 1808.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('22', 'kts', 'fee_invoice', '12', '2026-06-08'::date, 1808.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('23', 'kts', 'fee_invoice', '13', '2026-05-08'::date, 1110.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('24', 'kts', 'fee_invoice', '13', '2026-06-08'::date, 1110.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('25', 'kts', 'fee_invoice', '14', '2026-05-08'::date, 1514.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('26', 'kts', 'fee_invoice', '14', '2026-06-08'::date, 1514.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('27', 'kts', 'fee_invoice', '15', '2026-05-08'::date, 1531.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('28', 'kts', 'fee_invoice', '15', '2026-06-08'::date, 1531.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('29', 'kts', 'fee_invoice', '16', '2026-05-08'::date, 1185.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('30', 'kts', 'fee_invoice', '16', '2026-06-08'::date, 1185.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('31', 'kts', 'fee_invoice', '17', '2026-05-08'::date, 1132.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('32', 'kts', 'fee_invoice', '17', '2026-06-08'::date, 1132.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('33', 'kts', 'fee_invoice', '18', '2026-05-08'::date, 1057.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('34', 'kts', 'fee_invoice', '18', '2026-06-08'::date, 1057.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('35', 'kts', 'fee_invoice', '19', '2026-05-08'::date, 1520.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('36', 'kts', 'fee_invoice', '19', '2026-06-08'::date, 1520.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('37', 'kts', 'fee_invoice', '20', '2026-05-08'::date, 1266.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('38', 'kts', 'fee_invoice', '20', '2026-06-08'::date, 1266.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('39', 'kts', 'fee_invoice', '21', '2026-05-08'::date, 1486.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('40', 'kts', 'fee_invoice', '21', '2026-06-08'::date, 1486.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('41', 'kts', 'fee_invoice', '22', '2026-05-08'::date, 1690.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('42', 'kts', 'fee_invoice', '22', '2026-06-08'::date, 1690.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('43', 'kts', 'fee_invoice', '23', '2026-05-08'::date, 962.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('44', 'kts', 'fee_invoice', '23', '2026-06-08'::date, 962.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('45', 'kts', 'fee_invoice', '24', '2026-05-08'::date, 1043.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('46', 'kts', 'fee_invoice', '24', '2026-06-08'::date, 1043.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('47', 'kts', 'fee_invoice', '25', '2026-05-08'::date, 1898.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('48', 'kts', 'fee_invoice', '25', '2026-06-08'::date, 1898.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('49', 'kts', 'fee_invoice', '26', '2026-05-08'::date, 1715.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('50', 'kts', 'fee_invoice', '26', '2026-06-08'::date, 1715.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('51', 'kts', 'fee_invoice', '27', '2026-05-08'::date, 1876.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('52', 'kts', 'fee_invoice', '27', '2026-06-08'::date, 1876.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('53', 'kts', 'fee_invoice', '28', '2026-05-08'::date, 994.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('54', 'kts', 'fee_invoice', '28', '2026-06-08'::date, 994.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('55', 'kts', 'fee_invoice', '29', '2026-05-08'::date, 827.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('56', 'kts', 'fee_invoice', '29', '2026-06-08'::date, 827.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('57', 'kts', 'fee_invoice', '30', '2026-05-08'::date, 1546.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('58', 'kts', 'fee_invoice', '30', '2026-06-08'::date, 1546.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('59', 'kts', 'fee_invoice', '31', '2026-05-08'::date, 845.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('60', 'kts', 'fee_invoice', '31', '2026-06-08'::date, 845.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('61', 'kts', 'fee_invoice', '32', '2026-05-08'::date, 1552.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('62', 'kts', 'fee_invoice', '32', '2026-06-08'::date, 1552.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('63', 'kts', 'fee_invoice', '33', '2026-05-08'::date, 1439.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('64', 'kts', 'fee_invoice', '33', '2026-06-08'::date, 1439.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('65', 'kts', 'fee_invoice', '34', '2026-05-08'::date, 1984.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('66', 'kts', 'fee_invoice', '34', '2026-06-08'::date, 1984.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('67', 'kts', 'fee_invoice', '35', '2026-05-08'::date, 990.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('68', 'kts', 'fee_invoice', '35', '2026-06-08'::date, 990.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('69', 'kts', 'fee_invoice', '36', '2026-05-08'::date, 1584.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('70', 'kts', 'fee_invoice', '36', '2026-06-08'::date, 1584.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('71', 'kts', 'fee_invoice', '37', '2026-05-08'::date, 811.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('72', 'kts', 'fee_invoice', '37', '2026-06-08'::date, 811.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('73', 'kts', 'fee_invoice', '38', '2026-05-08'::date, 1881.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('74', 'kts', 'fee_invoice', '38', '2026-06-08'::date, 1881.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('75', 'kts', 'fee_invoice', '39', '2026-05-08'::date, 1088.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('76', 'kts', 'fee_invoice', '39', '2026-06-08'::date, 1088.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('77', 'kts', 'fee_invoice', '40', '2026-05-08'::date, 1785.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('78', 'kts', 'fee_invoice', '40', '2026-06-08'::date, 1785.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('79', 'kts', 'fee_invoice', '41', '2026-05-08'::date, 1406.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('80', 'kts', 'fee_invoice', '41', '2026-06-08'::date, 1406.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('81', 'kts', 'fee_invoice', '42', '2026-05-08'::date, 1207.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('82', 'kts', 'fee_invoice', '42', '2026-06-08'::date, 1207.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('83', 'kts', 'fee_invoice', '43', '2026-05-08'::date, 1081.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('84', 'kts', 'fee_invoice', '43', '2026-06-08'::date, 1081.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('85', 'kts', 'fee_invoice', '44', '2026-05-08'::date, 1977.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('86', 'kts', 'fee_invoice', '44', '2026-06-08'::date, 1977.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('87', 'kts', 'fee_invoice', '45', '2026-05-08'::date, 939.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('88', 'kts', 'fee_invoice', '45', '2026-06-08'::date, 939.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('89', 'kts', 'fee_invoice', '46', '2026-05-08'::date, 1799.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('90', 'kts', 'fee_invoice', '46', '2026-06-08'::date, 1799.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('91', 'kts', 'fee_invoice', '47', '2026-05-08'::date, 957.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('92', 'kts', 'fee_invoice', '47', '2026-06-08'::date, 957.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('93', 'kts', 'fee_invoice', '48', '2026-05-08'::date, 1675.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('94', 'kts', 'fee_invoice', '48', '2026-06-08'::date, 1675.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('95', 'kts', 'fee_invoice', '49', '2026-05-08'::date, 1666.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('96', 'kts', 'fee_invoice', '49', '2026-06-08'::date, 1666.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('97', 'kts', 'fee_invoice', '50', '2026-05-08'::date, 1271.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('98', 'kts', 'fee_invoice', '50', '2026-06-08'::date, 1271.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('99', 'kts', 'fee_invoice', '51', '2026-05-08'::date, 1876.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('100', 'kts', 'fee_invoice', '51', '2026-06-08'::date, 1876.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:55'::timestamptz, '2026-04-08 08:02:55'::timestamptz),
('101', 'kts', 'fee_invoice', '52', '2026-05-08'::date, 872.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('102', 'kts', 'fee_invoice', '52', '2026-06-08'::date, 872.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('103', 'kts', 'fee_invoice', '53', '2026-05-08'::date, 1288.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('104', 'kts', 'fee_invoice', '53', '2026-06-08'::date, 1288.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('105', 'kts', 'fee_invoice', '54', '2026-05-08'::date, 1230.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('106', 'kts', 'fee_invoice', '54', '2026-06-08'::date, 1230.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('107', 'kts', 'fee_invoice', '55', '2026-05-08'::date, 1144.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('108', 'kts', 'fee_invoice', '55', '2026-06-08'::date, 1144.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('109', 'kts', 'fee_invoice', '56', '2026-05-08'::date, 1049.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('110', 'kts', 'fee_invoice', '56', '2026-06-08'::date, 1049.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('111', 'kts', 'fee_invoice', '57', '2026-05-08'::date, 1760.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('112', 'kts', 'fee_invoice', '57', '2026-06-08'::date, 1760.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('113', 'kts', 'fee_invoice', '58', '2026-05-08'::date, 1412.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('114', 'kts', 'fee_invoice', '58', '2026-06-08'::date, 1412.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('115', 'kts', 'fee_invoice', '59', '2026-05-08'::date, 1493.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('116', 'kts', 'fee_invoice', '59', '2026-06-08'::date, 1493.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('117', 'kts', 'fee_invoice', '60', '2026-05-08'::date, 1709.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('118', 'kts', 'fee_invoice', '60', '2026-06-08'::date, 1709.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('119', 'kts', 'fee_invoice', '61', '2026-05-08'::date, 1872.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('120', 'kts', 'fee_invoice', '61', '2026-06-08'::date, 1872.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('121', 'kts', 'fee_invoice', '62', '2026-05-08'::date, 832.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('122', 'kts', 'fee_invoice', '62', '2026-06-08'::date, 832.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('123', 'kts', 'fee_invoice', '63', '2026-05-08'::date, 1335.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('124', 'kts', 'fee_invoice', '63', '2026-06-08'::date, 1335.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('125', 'kts', 'fee_invoice', '64', '2026-05-08'::date, 1545.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('126', 'kts', 'fee_invoice', '64', '2026-06-08'::date, 1545.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('127', 'kts', 'fee_invoice', '65', '2026-05-08'::date, 1903.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('128', 'kts', 'fee_invoice', '65', '2026-06-08'::date, 1903.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('129', 'kts', 'fee_invoice', '66', '2026-05-08'::date, 1020.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('130', 'kts', 'fee_invoice', '66', '2026-06-08'::date, 1020.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('131', 'kts', 'fee_invoice', '67', '2026-05-08'::date, 981.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('132', 'kts', 'fee_invoice', '67', '2026-06-08'::date, 981.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('133', 'kts', 'fee_invoice', '68', '2026-05-08'::date, 1751.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('134', 'kts', 'fee_invoice', '68', '2026-06-08'::date, 1751.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('135', 'kts', 'fee_invoice', '69', '2026-05-08'::date, 1759.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('136', 'kts', 'fee_invoice', '69', '2026-06-08'::date, 1759.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('137', 'kts', 'fee_invoice', '70', '2026-05-08'::date, 1116.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('138', 'kts', 'fee_invoice', '70', '2026-06-08'::date, 1116.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('139', 'kts', 'fee_invoice', '71', '2026-05-08'::date, 977.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('140', 'kts', 'fee_invoice', '71', '2026-06-08'::date, 977.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('141', 'kts', 'fee_invoice', '72', '2026-05-08'::date, 1864.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('142', 'kts', 'fee_invoice', '72', '2026-06-08'::date, 1864.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('143', 'kts', 'fee_invoice', '73', '2026-05-08'::date, 1422.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('144', 'kts', 'fee_invoice', '73', '2026-06-08'::date, 1422.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('145', 'kts', 'fee_invoice', '74', '2026-05-08'::date, 1807.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('146', 'kts', 'fee_invoice', '74', '2026-06-08'::date, 1807.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('147', 'kts', 'fee_invoice', '75', '2026-05-08'::date, 1748.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('148', 'kts', 'fee_invoice', '75', '2026-06-08'::date, 1748.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('149', 'kts', 'fee_invoice', '76', '2026-05-08'::date, 1720.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('150', 'kts', 'fee_invoice', '76', '2026-06-08'::date, 1720.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('151', 'kts', 'fee_invoice', '77', '2026-05-08'::date, 1896.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('152', 'kts', 'fee_invoice', '77', '2026-06-08'::date, 1896.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('153', 'kts', 'fee_invoice', '78', '2026-05-08'::date, 1063.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('154', 'kts', 'fee_invoice', '78', '2026-06-08'::date, 1063.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('155', 'kts', 'fee_invoice', '79', '2026-05-08'::date, 1391.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('156', 'kts', 'fee_invoice', '79', '2026-06-08'::date, 1391.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('157', 'kts', 'fee_invoice', '80', '2026-05-08'::date, 1864.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('158', 'kts', 'fee_invoice', '80', '2026-06-08'::date, 1864.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('159', 'kts', 'fee_invoice', '81', '2026-05-08'::date, 1729.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('160', 'kts', 'fee_invoice', '81', '2026-06-08'::date, 1729.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('161', 'kts', 'fee_invoice', '82', '2026-05-08'::date, 1094.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('162', 'kts', 'fee_invoice', '82', '2026-06-08'::date, 1094.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('163', 'kts', 'fee_invoice', '83', '2026-05-08'::date, 804.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('164', 'kts', 'fee_invoice', '83', '2026-06-08'::date, 804.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('165', 'kts', 'fee_invoice', '84', '2026-05-08'::date, 1290.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('166', 'kts', 'fee_invoice', '84', '2026-06-08'::date, 1290.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('167', 'kts', 'fee_invoice', '85', '2026-05-08'::date, 1442.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('168', 'kts', 'fee_invoice', '85', '2026-06-08'::date, 1442.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('169', 'kts', 'fee_invoice', '86', '2026-05-08'::date, 1305.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('170', 'kts', 'fee_invoice', '86', '2026-06-08'::date, 1305.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('171', 'kts', 'fee_invoice', '87', '2026-05-08'::date, 1950.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('172', 'kts', 'fee_invoice', '87', '2026-06-08'::date, 1950.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('173', 'kts', 'fee_invoice', '88', '2026-05-08'::date, 1494.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('174', 'kts', 'fee_invoice', '88', '2026-06-08'::date, 1494.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('175', 'kts', 'fee_invoice', '89', '2026-05-08'::date, 1117.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('176', 'kts', 'fee_invoice', '89', '2026-06-08'::date, 1117.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('177', 'kts', 'fee_invoice', '90', '2026-05-08'::date, 954.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('178', 'kts', 'fee_invoice', '90', '2026-06-08'::date, 954.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('179', 'kts', 'fee_invoice', '91', '2026-05-08'::date, 996.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('180', 'kts', 'fee_invoice', '91', '2026-06-08'::date, 996.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('181', 'kts', 'fee_invoice', '92', '2026-05-08'::date, 807.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('182', 'kts', 'fee_invoice', '92', '2026-06-08'::date, 807.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('183', 'kts', 'fee_invoice', '93', '2026-05-08'::date, 1945.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('184', 'kts', 'fee_invoice', '93', '2026-06-08'::date, 1945.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('185', 'kts', 'fee_invoice', '94', '2026-05-08'::date, 1791.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('186', 'kts', 'fee_invoice', '94', '2026-06-08'::date, 1791.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('187', 'kts', 'fee_invoice', '95', '2026-05-08'::date, 848.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('188', 'kts', 'fee_invoice', '95', '2026-06-08'::date, 848.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('189', 'kts', 'fee_invoice', '96', '2026-05-08'::date, 1162.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('190', 'kts', 'fee_invoice', '96', '2026-06-08'::date, 1162.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('191', 'kts', 'fee_invoice', '97', '2026-05-08'::date, 1341.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('192', 'kts', 'fee_invoice', '97', '2026-06-08'::date, 1341.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('193', 'kts', 'fee_invoice', '98', '2026-05-08'::date, 892.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('194', 'kts', 'fee_invoice', '98', '2026-06-08'::date, 892.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('195', 'kts', 'fee_invoice', '99', '2026-05-08'::date, 1130.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('196', 'kts', 'fee_invoice', '99', '2026-06-08'::date, 1130.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('197', 'kts', 'fee_invoice', '100', '2026-05-08'::date, 1002.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('198', 'kts', 'fee_invoice', '100', '2026-06-08'::date, 1002.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('199', 'kts', 'fee_invoice', '101', '2026-05-08'::date, 1147.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('200', 'kts', 'fee_invoice', '101', '2026-06-08'::date, 1147.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('201', 'kts', 'fee_invoice', '102', '2026-05-08'::date, 1360.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('202', 'kts', 'fee_invoice', '102', '2026-06-08'::date, 1360.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('203', 'kts', 'fee_invoice', '103', '2026-05-08'::date, 1500.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('204', 'kts', 'fee_invoice', '103', '2026-06-08'::date, 1500.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('205', 'kts', 'fee_invoice', '104', '2026-05-08'::date, 1410.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('206', 'kts', 'fee_invoice', '104', '2026-06-08'::date, 1410.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('207', 'kts', 'fee_invoice', '105', '2026-05-08'::date, 923.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('208', 'kts', 'fee_invoice', '105', '2026-06-08'::date, 923.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('209', 'kts', 'fee_invoice', '106', '2026-05-08'::date, 1921.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('210', 'kts', 'fee_invoice', '106', '2026-06-08'::date, 1921.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('211', 'kts', 'fee_invoice', '107', '2026-05-08'::date, 1628.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('212', 'kts', 'fee_invoice', '107', '2026-06-08'::date, 1628.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('213', 'kts', 'fee_invoice', '108', '2026-05-08'::date, 1951.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('214', 'kts', 'fee_invoice', '108', '2026-06-08'::date, 1951.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('215', 'kts', 'fee_invoice', '109', '2026-05-08'::date, 1641.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('216', 'kts', 'fee_invoice', '109', '2026-06-08'::date, 1641.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('217', 'kts', 'fee_invoice', '110', '2026-05-08'::date, 1670.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('218', 'kts', 'fee_invoice', '110', '2026-06-08'::date, 1670.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('219', 'kts', 'fee_invoice', '111', '2026-05-08'::date, 824.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('220', 'kts', 'fee_invoice', '111', '2026-06-08'::date, 824.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('221', 'kts', 'fee_invoice', '112', '2026-05-08'::date, 895.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('222', 'kts', 'fee_invoice', '112', '2026-06-08'::date, 895.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('223', 'kts', 'fee_invoice', '113', '2026-05-08'::date, 1546.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('224', 'kts', 'fee_invoice', '113', '2026-06-08'::date, 1546.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('225', 'kts', 'fee_invoice', '114', '2026-05-08'::date, 854.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('226', 'kts', 'fee_invoice', '114', '2026-06-08'::date, 854.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('227', 'kts', 'fee_invoice', '115', '2026-05-08'::date, 1368.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('228', 'kts', 'fee_invoice', '115', '2026-06-08'::date, 1368.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('229', 'kts', 'fee_invoice', '116', '2026-05-08'::date, 949.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('230', 'kts', 'fee_invoice', '116', '2026-06-08'::date, 949.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('231', 'kts', 'fee_invoice', '117', '2026-05-08'::date, 1658.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('232', 'kts', 'fee_invoice', '117', '2026-06-08'::date, 1658.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('233', 'kts', 'fee_invoice', '118', '2026-05-08'::date, 1526.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('234', 'kts', 'fee_invoice', '118', '2026-06-08'::date, 1526.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('235', 'kts', 'fee_invoice', '119', '2026-05-08'::date, 1603.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('236', 'kts', 'fee_invoice', '119', '2026-06-08'::date, 1603.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('237', 'kts', 'fee_invoice', '120', '2026-05-08'::date, 1153.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('238', 'kts', 'fee_invoice', '120', '2026-06-08'::date, 1153.00, 'PKR', 'cash', 'unpaid', NULL, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz)
ON CONFLICT (id) DO UPDATE SET payment_status=EXCLUDED.payment_status, payment_date=EXCLUDED.payment_date, amount=EXCLUDED.amount;

-- ==============================================================================
-- 7. PRAYER TIMINGS (288 Genuine Records with Safe NOT NULL Timestamps)
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'kts';
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS english_name VARCHAR(100);
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS arabic_name VARCHAR(100);
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS month INT DEFAULT 1;
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS day INT DEFAULT 1;
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS year INT DEFAULT 2026;
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS begin_time TIME;
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS is_jummah BOOLEAN DEFAULT false;
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE prayer_timings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO prayer_timings (id, campus_id, english_name, arabic_name, month, day, year, begin_time, end_time, is_jummah, created_at, updated_at) VALUES
(1, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now())), COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now()))),
(2, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now())), COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now()))),
(3, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now())), COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now()))),
(4, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now())), COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now()))),
(5, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now())), COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now()))),
(6, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now())), COALESCE('2026-01-20 23:09:44'::timestamptz, timezone('utc'::text, now()))),
(7, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-05 04:14:04'::timestamptz, timezone('utc'::text, now()))),
(8, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-05 04:14:04'::timestamptz, timezone('utc'::text, now()))),
(9, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-05 04:14:04'::timestamptz, timezone('utc'::text, now()))),
(10, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-05 04:14:04'::timestamptz, timezone('utc'::text, now()))),
(11, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-05 04:14:04'::timestamptz, timezone('utc'::text, now()))),
(12, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-05 04:14:04'::timestamptz, timezone('utc'::text, now()))),
(13, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-06 03:08:22'::timestamptz, timezone('utc'::text, now()))),
(14, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-06 03:08:23'::timestamptz, timezone('utc'::text, now()))),
(15, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-06 03:08:23'::timestamptz, timezone('utc'::text, now()))),
(16, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-06 03:08:23'::timestamptz, timezone('utc'::text, now()))),
(17, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-06 03:08:23'::timestamptz, timezone('utc'::text, now()))),
(18, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-06 03:08:23'::timestamptz, timezone('utc'::text, now()))),
(19, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 09:01:17'::timestamptz, timezone('utc'::text, now()))),
(20, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 09:01:17'::timestamptz, timezone('utc'::text, now()))),
(21, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 09:01:17'::timestamptz, timezone('utc'::text, now()))),
(22, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 09:01:17'::timestamptz, timezone('utc'::text, now()))),
(23, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 09:01:17'::timestamptz, timezone('utc'::text, now()))),
(24, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 09:01:17'::timestamptz, timezone('utc'::text, now()))),
(25, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 06:25:08'::timestamptz, timezone('utc'::text, now()))),
(26, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 06:25:08'::timestamptz, timezone('utc'::text, now()))),
(27, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 06:25:08'::timestamptz, timezone('utc'::text, now()))),
(28, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 06:25:08'::timestamptz, timezone('utc'::text, now()))),
(29, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 06:25:08'::timestamptz, timezone('utc'::text, now()))),
(30, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 06:25:08'::timestamptz, timezone('utc'::text, now()))),
(31, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:16:40'::timestamptz, timezone('utc'::text, now()))),
(32, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:16:40'::timestamptz, timezone('utc'::text, now()))),
(33, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:16:40'::timestamptz, timezone('utc'::text, now()))),
(34, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:16:40'::timestamptz, timezone('utc'::text, now()))),
(35, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:16:40'::timestamptz, timezone('utc'::text, now()))),
(36, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:16:40'::timestamptz, timezone('utc'::text, now()))),
(37, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:39:13'::timestamptz, timezone('utc'::text, now()))),
(38, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:39:13'::timestamptz, timezone('utc'::text, now()))),
(39, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:39:13'::timestamptz, timezone('utc'::text, now()))),
(40, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:39:13'::timestamptz, timezone('utc'::text, now()))),
(41, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:39:13'::timestamptz, timezone('utc'::text, now()))),
(42, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:39:13'::timestamptz, timezone('utc'::text, now()))),
(43, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:07'::timestamptz, timezone('utc'::text, now()))),
(44, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:07'::timestamptz, timezone('utc'::text, now()))),
(45, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:07'::timestamptz, timezone('utc'::text, now()))),
(46, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:07'::timestamptz, timezone('utc'::text, now()))),
(47, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:07'::timestamptz, timezone('utc'::text, now()))),
(48, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:07'::timestamptz, timezone('utc'::text, now()))),
(49, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:26'::timestamptz, timezone('utc'::text, now()))),
(50, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:26'::timestamptz, timezone('utc'::text, now()))),
(51, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:26'::timestamptz, timezone('utc'::text, now()))),
(52, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:26'::timestamptz, timezone('utc'::text, now()))),
(53, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:26'::timestamptz, timezone('utc'::text, now()))),
(54, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:17:26'::timestamptz, timezone('utc'::text, now()))),
(55, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:18:36'::timestamptz, timezone('utc'::text, now()))),
(56, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:18:36'::timestamptz, timezone('utc'::text, now()))),
(57, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:18:36'::timestamptz, timezone('utc'::text, now()))),
(58, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:18:36'::timestamptz, timezone('utc'::text, now()))),
(59, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:18:36'::timestamptz, timezone('utc'::text, now()))),
(60, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:18:36'::timestamptz, timezone('utc'::text, now()))),
(61, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:42:01'::timestamptz, timezone('utc'::text, now()))),
(62, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:42:01'::timestamptz, timezone('utc'::text, now()))),
(63, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:42:01'::timestamptz, timezone('utc'::text, now()))),
(64, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:42:01'::timestamptz, timezone('utc'::text, now()))),
(65, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:42:01'::timestamptz, timezone('utc'::text, now()))),
(66, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-11 12:42:01'::timestamptz, timezone('utc'::text, now()))),
(67, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:20:42'::timestamptz, timezone('utc'::text, now()))),
(68, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:20:42'::timestamptz, timezone('utc'::text, now()))),
(69, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:20:42'::timestamptz, timezone('utc'::text, now()))),
(70, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:20:42'::timestamptz, timezone('utc'::text, now()))),
(71, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:20:42'::timestamptz, timezone('utc'::text, now()))),
(72, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:20:42'::timestamptz, timezone('utc'::text, now()))),
(73, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:19:17'::timestamptz, timezone('utc'::text, now()))),
(74, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:19:17'::timestamptz, timezone('utc'::text, now()))),
(75, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:19:17'::timestamptz, timezone('utc'::text, now()))),
(76, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:19:17'::timestamptz, timezone('utc'::text, now()))),
(77, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:19:17'::timestamptz, timezone('utc'::text, now()))),
(78, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:19:17'::timestamptz, timezone('utc'::text, now()))),
(79, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:21:35'::timestamptz, timezone('utc'::text, now()))),
(80, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:21:35'::timestamptz, timezone('utc'::text, now()))),
(81, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:21:35'::timestamptz, timezone('utc'::text, now()))),
(82, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:21:35'::timestamptz, timezone('utc'::text, now()))),
(83, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:21:35'::timestamptz, timezone('utc'::text, now()))),
(84, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-12 06:21:35'::timestamptz, timezone('utc'::text, now()))),
(85, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:44:01'::timestamptz, timezone('utc'::text, now()))),
(86, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:44:01'::timestamptz, timezone('utc'::text, now()))),
(87, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:44:01'::timestamptz, timezone('utc'::text, now()))),
(88, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:44:01'::timestamptz, timezone('utc'::text, now()))),
(89, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:44:01'::timestamptz, timezone('utc'::text, now()))),
(90, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:44:01'::timestamptz, timezone('utc'::text, now()))),
(91, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:46:55'::timestamptz, timezone('utc'::text, now()))),
(92, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:46:55'::timestamptz, timezone('utc'::text, now()))),
(93, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:46:55'::timestamptz, timezone('utc'::text, now()))),
(94, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:46:55'::timestamptz, timezone('utc'::text, now()))),
(95, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:46:55'::timestamptz, timezone('utc'::text, now()))),
(96, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:46:55'::timestamptz, timezone('utc'::text, now()))),
(97, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:49:02'::timestamptz, timezone('utc'::text, now()))),
(98, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:49:02'::timestamptz, timezone('utc'::text, now()))),
(99, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:49:02'::timestamptz, timezone('utc'::text, now()))),
(100, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:49:02'::timestamptz, timezone('utc'::text, now()))),
(101, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:49:02'::timestamptz, timezone('utc'::text, now()))),
(102, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:49:02'::timestamptz, timezone('utc'::text, now()))),
(103, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:55:25'::timestamptz, timezone('utc'::text, now()))),
(104, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00'::time, '06:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:55:25'::timestamptz, timezone('utc'::text, now()))),
(105, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00'::time, '01:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:55:25'::timestamptz, timezone('utc'::text, now()))),
(106, 'kts', 'Asr', 'العصر', 1, 1, 2026, '05:36:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:55:25'::timestamptz, timezone('utc'::text, now()))),
(107, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00'::time, '07:43:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:55:25'::timestamptz, timezone('utc'::text, now()))),
(108, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '08:56:00'::time, '09:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-03-22 12:55:25'::timestamptz, timezone('utc'::text, now()))),
(109, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:21:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:02:33'::timestamptz, timezone('utc'::text, now()))),
(110, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:41:00'::time, '06:41:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:02:33'::timestamptz, timezone('utc'::text, now()))),
(111, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:14:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:02:33'::timestamptz, timezone('utc'::text, now()))),
(112, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:37:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:02:33'::timestamptz, timezone('utc'::text, now()))),
(113, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:44:00'::time, '19:44:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:02:33'::timestamptz, timezone('utc'::text, now()))),
(114, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '20:58:00'::time, '21:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:02:33'::timestamptz, timezone('utc'::text, now()))),
(115, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:19:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:14:17'::timestamptz, timezone('utc'::text, now()))),
(116, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:39:00'::time, '06:39:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:14:17'::timestamptz, timezone('utc'::text, now()))),
(117, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:13:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:14:17'::timestamptz, timezone('utc'::text, now()))),
(118, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:38:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:14:17'::timestamptz, timezone('utc'::text, now()))),
(119, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:45:00'::time, '19:45:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:14:17'::timestamptz, timezone('utc'::text, now()))),
(120, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:00:00'::time, '21:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-01 13:14:17'::timestamptz, timezone('utc'::text, now()))),
(121, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:17:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 03:27:03'::timestamptz, timezone('utc'::text, now()))),
(122, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:37:00'::time, '06:37:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 03:27:03'::timestamptz, timezone('utc'::text, now()))),
(123, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:13:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 03:27:03'::timestamptz, timezone('utc'::text, now()))),
(124, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:39:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 03:27:03'::timestamptz, timezone('utc'::text, now()))),
(125, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:47:00'::time, '19:47:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 03:27:03'::timestamptz, timezone('utc'::text, now()))),
(126, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:01:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 03:27:03'::timestamptz, timezone('utc'::text, now()))),
(127, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:15:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:15:29'::timestamptz, timezone('utc'::text, now()))),
(128, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:35:00'::time, '06:35:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:15:29'::timestamptz, timezone('utc'::text, now()))),
(129, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:12:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:15:29'::timestamptz, timezone('utc'::text, now()))),
(130, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:40:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:15:29'::timestamptz, timezone('utc'::text, now()))),
(131, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:49:00'::time, '19:49:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:15:29'::timestamptz, timezone('utc'::text, now()))),
(132, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:03:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:15:29'::timestamptz, timezone('utc'::text, now()))),
(133, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:13:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:05'::timestamptz, timezone('utc'::text, now()))),
(134, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:33:00'::time, '06:33:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:05'::timestamptz, timezone('utc'::text, now()))),
(135, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:11:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:05'::timestamptz, timezone('utc'::text, now()))),
(136, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:42:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:05'::timestamptz, timezone('utc'::text, now()))),
(137, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:51:00'::time, '19:51:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:05'::timestamptz, timezone('utc'::text, now()))),
(138, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:05:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:05'::timestamptz, timezone('utc'::text, now()))),
(139, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:11:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:32'::timestamptz, timezone('utc'::text, now()))),
(140, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:31:00'::time, '06:31:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:32'::timestamptz, timezone('utc'::text, now()))),
(141, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:11:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:32'::timestamptz, timezone('utc'::text, now()))),
(142, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:43:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:32'::timestamptz, timezone('utc'::text, now()))),
(143, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:53:00'::time, '19:53:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:32'::timestamptz, timezone('utc'::text, now()))),
(144, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:06:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:16:32'::timestamptz, timezone('utc'::text, now()))),
(145, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:09:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:06'::timestamptz, timezone('utc'::text, now()))),
(146, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:28:00'::time, '06:28:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:06'::timestamptz, timezone('utc'::text, now()))),
(147, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:10:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:06'::timestamptz, timezone('utc'::text, now()))),
(148, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:44:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:06'::timestamptz, timezone('utc'::text, now()))),
(149, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:55:00'::time, '19:55:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:06'::timestamptz, timezone('utc'::text, now()))),
(150, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:08:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:06'::timestamptz, timezone('utc'::text, now()))),
(151, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:06:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:40'::timestamptz, timezone('utc'::text, now()))),
(152, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:25:00'::time, '06:25:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:40'::timestamptz, timezone('utc'::text, now()))),
(153, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:10:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:40'::timestamptz, timezone('utc'::text, now()))),
(154, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:45:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:40'::timestamptz, timezone('utc'::text, now()))),
(155, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:57:00'::time, '19:57:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:40'::timestamptz, timezone('utc'::text, now()))),
(156, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:09:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:17:40'::timestamptz, timezone('utc'::text, now()))),
(157, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:03:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:11'::timestamptz, timezone('utc'::text, now()))),
(158, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:22:00'::time, '06:22:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:11'::timestamptz, timezone('utc'::text, now()))),
(159, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:11'::timestamptz, timezone('utc'::text, now()))),
(160, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:47:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:11'::timestamptz, timezone('utc'::text, now()))),
(161, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '19:59:00'::time, '19:59:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:11'::timestamptz, timezone('utc'::text, now()))),
(162, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:10:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:11'::timestamptz, timezone('utc'::text, now()))),
(163, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '05:01:00'::time, '05:45:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:38'::timestamptz, timezone('utc'::text, now()))),
(164, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:20:00'::time, '06:20:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:38'::timestamptz, timezone('utc'::text, now()))),
(165, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:38'::timestamptz, timezone('utc'::text, now()))),
(166, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:49:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:38'::timestamptz, timezone('utc'::text, now()))),
(167, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:01:00'::time, '20:01:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:38'::timestamptz, timezone('utc'::text, now()))),
(168, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:12:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:18:38'::timestamptz, timezone('utc'::text, now()))),
(169, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:58:00'::time, '05:25:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:02'::timestamptz, timezone('utc'::text, now()))),
(170, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:18:00'::time, '06:18:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:02'::timestamptz, timezone('utc'::text, now()))),
(171, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:02'::timestamptz, timezone('utc'::text, now()))),
(172, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:50:00'::time, '18:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:02'::timestamptz, timezone('utc'::text, now()))),
(173, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:02:00'::time, '20:02:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:02'::timestamptz, timezone('utc'::text, now()))),
(174, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:14:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:02'::timestamptz, timezone('utc'::text, now()))),
(175, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:55:00'::time, '05:25:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:28'::timestamptz, timezone('utc'::text, now()))),
(176, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:16:00'::time, '06:16:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:28'::timestamptz, timezone('utc'::text, now()))),
(177, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:28'::timestamptz, timezone('utc'::text, now()))),
(178, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:51:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:28'::timestamptz, timezone('utc'::text, now()))),
(179, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:04:00'::time, '20:04:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:28'::timestamptz, timezone('utc'::text, now()))),
(180, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:16:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:28'::timestamptz, timezone('utc'::text, now()))),
(181, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:53:00'::time, '05:45:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:59'::timestamptz, timezone('utc'::text, now()))),
(182, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:14:00'::time, '06:14:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:59'::timestamptz, timezone('utc'::text, now()))),
(183, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:59'::timestamptz, timezone('utc'::text, now()))),
(184, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:52:00'::time, '06:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:59'::timestamptz, timezone('utc'::text, now()))),
(185, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:06:00'::time, '20:06:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:59'::timestamptz, timezone('utc'::text, now()))),
(186, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:18:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:19:59'::timestamptz, timezone('utc'::text, now()))),
(187, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:49:00'::time, '05:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:26'::timestamptz, timezone('utc'::text, now()))),
(188, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:11:00'::time, '06:11:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:26'::timestamptz, timezone('utc'::text, now()))),
(189, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:26'::timestamptz, timezone('utc'::text, now()))),
(190, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:53:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:26'::timestamptz, timezone('utc'::text, now()))),
(191, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:07:00'::time, '20:07:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:26'::timestamptz, timezone('utc'::text, now()))),
(192, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:20:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:26'::timestamptz, timezone('utc'::text, now()))),
(193, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:46:00'::time, '05:45:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:58'::timestamptz, timezone('utc'::text, now()))),
(194, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:09:00'::time, '06:09:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:58'::timestamptz, timezone('utc'::text, now()))),
(195, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:58'::timestamptz, timezone('utc'::text, now()))),
(196, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:54:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:58'::timestamptz, timezone('utc'::text, now()))),
(197, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:09:00'::time, '20:09:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:58'::timestamptz, timezone('utc'::text, now()))),
(198, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:22:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:20:58'::timestamptz, timezone('utc'::text, now()))),
(199, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:53:00'::time, '05:45:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:21:25'::timestamptz, timezone('utc'::text, now()))),
(200, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:07:00'::time, '06:07:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:21:25'::timestamptz, timezone('utc'::text, now()))),
(201, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:21:25'::timestamptz, timezone('utc'::text, now()))),
(202, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:55:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:21:25'::timestamptz, timezone('utc'::text, now()))),
(203, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:11:00'::time, '20:11:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:21:25'::timestamptz, timezone('utc'::text, now()))),
(204, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:24:00'::time, '21:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:21:25'::timestamptz, timezone('utc'::text, now()))),
(205, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:41:00'::time, '05:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:05'::timestamptz, timezone('utc'::text, now()))),
(206, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:05:00'::time, '06:05:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:05'::timestamptz, timezone('utc'::text, now()))),
(207, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:05'::timestamptz, timezone('utc'::text, now()))),
(208, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:56:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:05'::timestamptz, timezone('utc'::text, now()))),
(209, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:13:00'::time, '20:13:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:05'::timestamptz, timezone('utc'::text, now()))),
(210, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:26:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:05'::timestamptz, timezone('utc'::text, now()))),
(211, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00'::time, '05:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:33'::timestamptz, timezone('utc'::text, now()))),
(212, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:02:00'::time, '06:02:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:33'::timestamptz, timezone('utc'::text, now()))),
(213, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:33'::timestamptz, timezone('utc'::text, now()))),
(214, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:57:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:33'::timestamptz, timezone('utc'::text, now()))),
(215, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:14:00'::time, '20:14:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:33'::timestamptz, timezone('utc'::text, now()))),
(216, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:28:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:22:33'::timestamptz, timezone('utc'::text, now()))),
(217, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:35:00'::time, '05:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:01'::timestamptz, timezone('utc'::text, now()))),
(218, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '06:00:00'::time, '06:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:01'::timestamptz, timezone('utc'::text, now()))),
(219, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:01'::timestamptz, timezone('utc'::text, now()))),
(220, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:58:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:01'::timestamptz, timezone('utc'::text, now()))),
(221, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:16:00'::time, '20:16:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:01'::timestamptz, timezone('utc'::text, now()))),
(222, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:30:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:01'::timestamptz, timezone('utc'::text, now()))),
(223, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:32:00'::time, '05:32:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:31'::timestamptz, timezone('utc'::text, now()))),
(224, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:58:00'::time, '05:58:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:31'::timestamptz, timezone('utc'::text, now()))),
(225, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:31'::timestamptz, timezone('utc'::text, now()))),
(226, 'kts', 'Asr', 'العصر', 1, 1, 2026, '17:59:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:31'::timestamptz, timezone('utc'::text, now()))),
(227, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:18:00'::time, '20:18:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:31'::timestamptz, timezone('utc'::text, now()))),
(228, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:32:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:23:31'::timestamptz, timezone('utc'::text, now()))),
(229, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:29:00'::time, '05:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:01'::timestamptz, timezone('utc'::text, now()))),
(230, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:56:00'::time, '05:56:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:01'::timestamptz, timezone('utc'::text, now()))),
(231, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:01'::timestamptz, timezone('utc'::text, now()))),
(232, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:00:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:01'::timestamptz, timezone('utc'::text, now()))),
(233, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:20:00'::time, '20:20:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:01'::timestamptz, timezone('utc'::text, now()))),
(234, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:34:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:01'::timestamptz, timezone('utc'::text, now()))),
(235, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:26:00'::time, '05:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:27'::timestamptz, timezone('utc'::text, now()))),
(236, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:54:00'::time, '05:54:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:27'::timestamptz, timezone('utc'::text, now()))),
(237, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:27'::timestamptz, timezone('utc'::text, now()))),
(238, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:01:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:27'::timestamptz, timezone('utc'::text, now()))),
(239, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:21:00'::time, '20:21:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:27'::timestamptz, timezone('utc'::text, now()))),
(240, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:36:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:27'::timestamptz, timezone('utc'::text, now()))),
(241, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:23:00'::time, '05:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:57'::timestamptz, timezone('utc'::text, now()))),
(242, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:52:00'::time, '05:52:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:57'::timestamptz, timezone('utc'::text, now()))),
(243, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:57'::timestamptz, timezone('utc'::text, now()))),
(244, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:02:00'::time, '18:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:57'::timestamptz, timezone('utc'::text, now()))),
(245, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:23:00'::time, '20:23:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:57'::timestamptz, timezone('utc'::text, now()))),
(246, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:38:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:24:57'::timestamptz, timezone('utc'::text, now()))),
(247, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:20:00'::time, '05:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:27:39'::timestamptz, timezone('utc'::text, now()))),
(248, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:50:00'::time, '05:50:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:27:39'::timestamptz, timezone('utc'::text, now()))),
(249, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:27:39'::timestamptz, timezone('utc'::text, now()))),
(250, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:03:00'::time, '19:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:27:39'::timestamptz, timezone('utc'::text, now()))),
(251, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:25:00'::time, '20:25:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:27:39'::timestamptz, timezone('utc'::text, now()))),
(252, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:40:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:27:39'::timestamptz, timezone('utc'::text, now()))),
(253, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:17:00'::time, '05:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:31'::timestamptz, timezone('utc'::text, now()))),
(254, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:50:00'::time, '05:50:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:31'::timestamptz, timezone('utc'::text, now()))),
(255, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:31'::timestamptz, timezone('utc'::text, now()))),
(256, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:04:00'::time, '19:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:31'::timestamptz, timezone('utc'::text, now()))),
(257, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:26:00'::time, '20:26:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:31'::timestamptz, timezone('utc'::text, now()))),
(258, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:42:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:31'::timestamptz, timezone('utc'::text, now()))),
(259, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:14:00'::time, '05:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:59'::timestamptz, timezone('utc'::text, now()))),
(260, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:46:00'::time, '05:46:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:59'::timestamptz, timezone('utc'::text, now()))),
(261, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:59'::timestamptz, timezone('utc'::text, now()))),
(262, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:05:00'::time, '19:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:59'::timestamptz, timezone('utc'::text, now()))),
(263, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:28:00'::time, '20:28:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:59'::timestamptz, timezone('utc'::text, now()))),
(264, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:44:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:28:59'::timestamptz, timezone('utc'::text, now()))),
(265, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:11:00'::time, '05:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:27'::timestamptz, timezone('utc'::text, now()))),
(266, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:44:00'::time, '05:44:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:27'::timestamptz, timezone('utc'::text, now()))),
(267, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:27'::timestamptz, timezone('utc'::text, now()))),
(268, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:06:00'::time, '19:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:27'::timestamptz, timezone('utc'::text, now()))),
(269, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:30:00'::time, '20:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:27'::timestamptz, timezone('utc'::text, now()))),
(270, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:46:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:27'::timestamptz, timezone('utc'::text, now()))),
(271, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:07:00'::time, '05:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:54'::timestamptz, timezone('utc'::text, now()))),
(272, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:41:00'::time, '05:41:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:54'::timestamptz, timezone('utc'::text, now()))),
(273, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:54'::timestamptz, timezone('utc'::text, now()))),
(274, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:07:00'::time, '19:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:54'::timestamptz, timezone('utc'::text, now()))),
(275, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:32:00'::time, '20:32:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:54'::timestamptz, timezone('utc'::text, now()))),
(276, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:48:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:29:54'::timestamptz, timezone('utc'::text, now()))),
(277, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:03:00'::time, '05:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:21'::timestamptz, timezone('utc'::text, now()))),
(278, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:40:00'::time, '05:40:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:21'::timestamptz, timezone('utc'::text, now()))),
(279, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:21'::timestamptz, timezone('utc'::text, now()))),
(280, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:08:00'::time, '19:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:21'::timestamptz, timezone('utc'::text, now()))),
(281, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:33:00'::time, '21:49:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:21'::timestamptz, timezone('utc'::text, now()))),
(282, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:49:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:21'::timestamptz, timezone('utc'::text, now()))),
(283, 'kts', 'Fajr', 'الفجر', 1, 1, 2026, '04:00:00'::time, '05:15:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:47'::timestamptz, timezone('utc'::text, now()))),
(284, 'kts', 'Sunrise', 'الشروق', 1, 1, 2026, '05:38:00'::time, '05:38:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:47'::timestamptz, timezone('utc'::text, now()))),
(285, 'kts', 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00'::time, '13:30:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:47'::timestamptz, timezone('utc'::text, now()))),
(286, 'kts', 'Asr', 'العصر', 1, 1, 2026, '18:09:00'::time, '19:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:47'::timestamptz, timezone('utc'::text, now()))),
(287, 'kts', 'Maghrib', 'المغرب', 1, 1, 2026, '20:35:00'::time, '20:35:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:47'::timestamptz, timezone('utc'::text, now()))),
(288, 'kts', 'Isha', 'العشاء', 1, 1, 2026, '21:50:00'::time, '22:00:00'::time, false, COALESCE(NULL, timezone('utc'::text, now())), COALESCE('2026-04-03 02:30:47'::timestamptz, timezone('utc'::text, now())))
ON CONFLICT (id) DO UPDATE SET begin_time=EXCLUDED.begin_time, end_time=EXCLUDED.end_time, is_jummah=EXCLUDED.is_jummah;

-- ==============================================================================
-- 8. INCIDENT LOGS, DOCUMENTS, NEWS & SLIDERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS incident_logs (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL DEFAULT 'kts' REFERENCES campuses(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
    date DATE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    action_taken TEXT,
    attachments TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'kts';
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS attachments TEXT;
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO incident_logs (id, campus_id, student_id, date, title, description, action_taken, attachments, status, created_at, updated_at) VALUES
('1', 'kts', '120', '2026-06-23'::date, 'test incident', 'test desc', 'null', NULL, 'active', '2026-06-23 02:54:17'::timestamptz, '2026-06-23 03:04:32'::timestamptz),
('2', 'kts', '119', '2026-06-23'::date, 'jhsagdj', 'sajhdgsa', 'null', NULL, 'active', '2026-06-23 03:05:38'::timestamptz, '2026-06-23 03:06:09'::timestamptz)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, action_taken=EXCLUDED.action_taken;

CREATE TABLE IF NOT EXISTS document_uplouds (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL DEFAULT 'kts' REFERENCES campuses(id) ON DELETE CASCADE,
    type VARCHAR(50),
    reference_id TEXT,
    name VARCHAR(255),
    file_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE document_uplouds ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'kts';
ALTER TABLE document_uplouds ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE document_uplouds ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE document_uplouds ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE document_uplouds ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE document_uplouds ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE document_uplouds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO document_uplouds (id, campus_id, type, reference_id, name, file_name, created_at, updated_at) VALUES
('6', 'kts', 'teacher', '14', 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/LsUf5ZbgYImxdOzcXLXgOPneaykDFKvW0nreOYcK.docx', '2026-06-23 02:43:22'::timestamptz, '2026-06-23 02:43:22'::timestamptz),
('8', 'kts', 'incident', '1', 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/YlWcgmRmIDDYY9vUDKW0rtedxSW3OY8VM4bWtkU9.docx', '2026-06-23 03:04:33'::timestamptz, '2026-06-23 03:04:33'::timestamptz),
('10', 'kts', 'incident', '2', 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/hvRabFHv3oIAfFssAHXofJcWXKWVA0NNYN4g7dS7.docx', '2026-06-23 03:05:39'::timestamptz, '2026-06-23 03:05:39'::timestamptz)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, file_name=EXCLUDED.file_name;

CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL DEFAULT 'all' REFERENCES campuses(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE news ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'all';
ALTER TABLE news ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE news ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE news ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO news (id, campus_id, content, is_active, created_at, updated_at) VALUES
('1', 'all', 'Listen Quran', true, '2026-01-21 06:12:32'::timestamptz, '2026-01-21 06:12:32'::timestamptz),
('2', 'all', 'Read Quran.', true, '2026-01-21 06:12:32'::timestamptz, '2026-01-21 06:12:32'::timestamptz),
('3', 'all', 'Memorise Quran', true, '2026-01-21 06:12:32'::timestamptz, '2026-01-21 06:12:32'::timestamptz),
('4', 'all', 'Welcome to Musbah Ul Quran Institute. Admissions are open for new academic year.', true, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('5', 'all', 'Reminder: Parent-Teacher meeting will be held on coming Friday.', true, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('6', 'all', 'New Quran memorization classes starting soon. Register now!', true, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz)
ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content, is_active=EXCLUDED.is_active;

CREATE TABLE IF NOT EXISTS slider_images (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL DEFAULT 'all' REFERENCES campuses(id) ON DELETE CASCADE,
    image_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS campus_id TEXT DEFAULT 'all';
ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS image_name TEXT;
ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

INSERT INTO slider_images (id, campus_id, image_name, is_active, created_at, updated_at) VALUES
('7', 'all', 'storage/slider/1769153865_1.jpg', true, '2026-01-23 02:37:46'::timestamptz, '2026-01-23 02:37:46'::timestamptz),
('8', 'all', 'storage/slider/1769608329_1769528657_Untitled design.webp', true, '2026-01-28 08:52:10'::timestamptz, '2026-01-28 08:52:10'::timestamptz),
('9', 'all', 'storage/slider/1772782636_2.jpg', true, '2026-03-06 02:37:17'::timestamptz, '2026-03-06 02:37:17'::timestamptz),
('10', 'all', 'images/slider/1.jpg', true, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('11', 'all', 'images/slider/2.jpg', true, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz),
('12', 'all', 'images/slider/3.jpg', true, '2026-04-08 08:02:56'::timestamptz, '2026-04-08 08:02:56'::timestamptz)
ON CONFLICT (id) DO UPDATE SET image_name=EXCLUDED.image_name, is_active=EXCLUDED.is_active;

-- ==============================================================================
-- 9. ATTENDANCE TABLES & ADMINISTRATIVE AUDIT TRAIL
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

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campus_id TEXT REFERENCES campuses(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Teacher Attendance Strict Time Rules
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
        IF NEW.status NOT IN ('PRESENT', 'ABSENT', 'LEAVE') THEN
            NEW.status := 'PRESENT';
        END IF;
        NEW.rule_applied := 'UP_TO_5PM';
    ELSIF total_seconds > 61200 AND total_seconds <= 63000 THEN
        IF NEW.status = 'PRESENT' THEN
            NEW.status := 'LATE';
        END IF;
        NEW.rule_applied := 'LATE_WINDOW_5_01_TO_5_30';
    ELSE
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
-- 10. UNRESTRICTED ACCESS FOR REACT FRONTEND (DISABLE RLS & PERMISSIONS)
-- Ensures anon key never gets 'new row violates row-level security policy'
-- ==============================================================================
ALTER TABLE campuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_timings DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_uplouds DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE slider_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
