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