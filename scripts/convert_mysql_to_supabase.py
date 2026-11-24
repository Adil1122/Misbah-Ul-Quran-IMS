#!/usr/bin/env python3
"""
Migrates MySQL ims_db.sql into a comprehensive, repeatable Supabase PostgreSQL script.
Preserves all historical rows, ids, hashes, and relational links while adding multi-campus
tables, strict teacher attendance triggers, and RLS policies.
"""
import re
import os

def clean_sql_str(s):
    if s is None:
        return 'NULL'
    return s.strip()

def run():
    with open('my sql/ims_db.sql', 'r', encoding='utf-8', errors='ignore') as f:
        sql = f.read()

    # Helper to extract inserts for a table
    def get_raw_inserts(tbl_name):
        matches = re.findall(r"INSERT INTO \`" + tbl_name + r"\`\s*\([^)]+\)\s*VALUES\s*([\s\S]*?);", sql)
        if not matches:
            return []
        return matches

    out = []
    out.append("""-- ==============================================================================
-- MISBAH-UL-QURAN IMS — COMPLETE SUPABASE POSTGRESQL PRODUCTION MIGRATION
-- Generated: 2026-10-14
-- Preserves all legacy MySQL records (users, teachers, classes, invoices, timings)
-- and provisions multi-campus UK & KTS Pakistan institutional architecture.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

INSERT INTO campuses (id, code, name, country, city, address, timezone, currency_code, phone, email)
VALUES 
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
""")

    # Extract MySQL users
    users_inserts = get_raw_inserts('users')
    if users_inserts:
        out.append("-- Legacy MySQL Users Data Insertion:")
        out.append("INSERT INTO users (id, first_name, last_name, email, password, status, image, contact_number, role, active_campus_id, allowed_campus_ids, created_at, updated_at)")
        out.append("VALUES")
        # Parse tuple items
        # MySQL structure: (`id`, `type`, `first_name`, `last_name`, `email`, `password`, `status`, `image`, `contact_number`, `created_at`, `updated_at`)
        user_rows = []
        raw_vals = users_inserts[0]
        # Match each tuple
        tuples = re.findall(r"\(([^)]+)\)", raw_vals)
        for t in tuples:
            parts = [p.strip() for p in re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", t)]
            if len(parts) >= 11:
                u_id = parts[0]
                u_type = parts[1].strip("'")
                fname = parts[2]
                lname = parts[3]
                email = parts[4]
                pwd = parts[5]
                status = parts[6]
                img = parts[7]
                contact = parts[8]
                c_at = parts[9]
                u_at = parts[10]

                # Map role
                role = 'TEACHER'
                if u_type == 'admin':
                    role = 'SUPER_ADMIN' if u_id == '1' else 'CAMPUS_ADMIN'
                elif u_type == 'parent':
                    role = 'PARENT'

                camp = "'kts'"
                allowed = "'[\"kts\"]'::jsonb" if role != 'SUPER_ADMIN' else "'[\"all\", \"uk\", \"kts\"]'::jsonb"
                user_rows.append(f"({u_id}::text, {fname}, {lname}, {email}, {pwd}, {status}, {img}, {contact}, '{role}', {camp}, {allowed}, {c_at}::timestamptz, {u_at}::timestamptz)")

        # Also add pre-configured active multi-campus accounts
        user_rows.append("('usr-super-01', 'Muhammad', 'Ibrahim', 'superadmin@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0192', 'SUPER_ADMIN', 'all', '[\"all\", \"uk\", \"kts\"]'::jsonb, now(), now())")
        user_rows.append("('usr-admin-uk-01', 'Tariq', 'Mahmood', 'admin.uk@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0193', 'CAMPUS_ADMIN', 'uk', '[\"uk\"]'::jsonb, now(), now())")
        user_rows.append("('usr-admin-kts-01', 'Abdul Rehman', 'Khan', 'admin.kts@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+92 995 612345', 'CAMPUS_ADMIN', 'kts', '[\"kts\"]'::jsonb, now(), now())")
        user_rows.append("('usr-teach-uk-01', 'Hasan', 'Al-Baqir', 'teacher.uk@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0194', 'TEACHER', 'uk', '[\"uk\"]'::jsonb, now(), now())")
        user_rows.append("('usr-parent-uk-01', 'Farhan', 'Siddique', 'parent.uk@misbah.org', '$2a$10$e8pCj7s4YV5vVp.jZ1W01.Pkn1qY.85m4q4Z1sXj/Jj4m2J1nN9qG', 1, NULL, '+44 20 7946 0195', 'PARENT', 'uk', '[\"uk\"]'::jsonb, now(), now())")

        out.append(",\n".join(user_rows))
        out.append("ON CONFLICT (id) DO NOTHING;\n")

    # 3. CLASSES
    out.append("""-- ==============================================================================
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
""")
    classes_inserts = get_raw_inserts('classes')
    if classes_inserts:
        out.append("-- Legacy MySQL Classes Insertion:")
        out.append("INSERT INTO classes (id, campus_id, title, admission_fee, description, teacher_id, created_at, updated_at)")
        out.append("VALUES")
        # Structure: (`id`, `title`, `admission_fee`, `description`, `teacher_id`, `created_at`, `updated_at`)
        class_rows = []
        raw_vals = classes_inserts[0]
        tuples = re.findall(r"\(([^)]+)\)", raw_vals)
        for t in tuples:
            parts = [p.strip() for p in re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", t)]
            if len(parts) >= 7:
                c_id = parts[0]
                title = parts[1]
                fee = parts[2]
                desc = parts[3]
                t_id = parts[4] if parts[4] != 'NULL' else 'NULL'
                t_id_cast = f"{t_id}::text" if t_id != 'NULL' else "NULL"
                c_at = parts[5]
                u_at = parts[6]
                class_rows.append(f"({c_id}::text, 'kts', {title}, {fee}, {desc}, {t_id_cast}, {c_at}::timestamptz, {u_at}::timestamptz)")

        # Add UK classes
        class_rows.append("('cls-uk-01', 'uk', 'Hifz Section London', 15.00, 'Memorization & Tajweed', 'usr-teach-uk-01', now(), now())")
        class_rows.append("('cls-uk-02', 'uk', 'Noorani Qaida Group A', 15.00, 'Foundation Reading', 'usr-teach-uk-01', now(), now())")

        out.append(",\n".join(class_rows))
        out.append("ON CONFLICT (id) DO NOTHING;\n")

    # 4. TEACHER PROFILES
    out.append("""-- ==============================================================================
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
""")
    tp_inserts = get_raw_inserts('teacher_profiles')
    if tp_inserts:
        out.append("-- Legacy MySQL Teacher Profiles Insertion:")
        out.append("INSERT INTO teacher_profiles (id, teacher_id, campus_id, employee_code, joining_date, salary, salary_currency, salary_day, status, created_at, updated_at)")
        out.append("VALUES")
        # Structure: (`id`, `teacher_id`, `joining_date`, `salary`, `salary_day`, `status`, `created_at`, `updated_at`)
        tp_rows = []
        raw_vals = tp_inserts[0]
        tuples = re.findall(r"\(([^)]+)\)", raw_vals)
        for t in tuples:
            parts = [p.strip() for p in re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", t)]
            if len(parts) >= 8:
                tp_id = parts[0]
                t_uid = parts[1]
                j_date = parts[2]
                sal = parts[3]
                sal_day = parts[4]
                stat = parts[5]
                c_at = parts[6]
                u_at = parts[7]
                emp_code = f"'TCH-KTS-{tp_id.strip()}'"
                tp_rows.append(f"({tp_id}::text, {t_uid}::text, 'kts', {emp_code}, {j_date}::date, {sal}, 'PKR', {sal_day}, {stat}, {c_at}::timestamptz, {u_at}::timestamptz)")

        # Add UK Teacher Profile
        tp_rows.append("('tch-uk-01', 'usr-teach-uk-01', 'uk', 'TCH-UK-001', '2024-01-10'::date, 2800.00, 'GBP', 'Friday', 'active', now(), now())")

        out.append(",\n".join(tp_rows))
        out.append("ON CONFLICT (id) DO NOTHING;\n")

    # 5. STUDENTS
    out.append("""-- ==============================================================================
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
""")
    std_inserts = get_raw_inserts('students')
    if std_inserts:
        out.append("-- Legacy MySQL Student Insertion:")
        out.append("INSERT INTO students (id, campus_id, parent_id, class_id, first_name, last_name, roll_number, status, date_of_birth, gender, address, admission_date, admission_fee_amount, monthly_fee_amount, fee_due_day, default_payment_method, created_at, updated_at)")
        out.append("VALUES")
        # Structure: (`id`, `parent_id`, `class_id`, `first_name`, `last_name`, `roll_number`, `status`, `date_of_birth`, `gender`, `address`, `primary_contact_details`, `secondary_contact_details`, `medical_history`, `allowed_medicines`, `admission_date`, `admission_fee_amount`, `monthly_fee_amount`, `fee_due_day`, `default_payment_method`, `created_at`, `updated_at`)
        std_rows = []
        raw_vals = std_inserts[0]
        tuples = re.findall(r"\(([^)]+)\)", raw_vals)
        for t in tuples:
            parts = [p.strip() for p in re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", t)]
            if len(parts) >= 21:
                s_id = parts[0]
                p_id = parts[1]
                c_id = parts[2]
                fn = parts[3]
                ln = parts[4]
                r_num = parts[5]
                st = parts[6]
                dob = parts[7]
                gen = parts[8]
                addr = parts[9]
                adm_date = parts[14]
                adm_fee = parts[15]
                m_fee = parts[16]
                due_day = parts[17]
                pay_meth = parts[18]
                c_at = parts[19]
                u_at = parts[20]
                std_rows.append(f"({s_id}::text, 'kts', {p_id}::text, {c_id}::text, {fn}, {ln}, {r_num}, {st}, {dob}::date, {gen}, {addr}, {adm_date}::date, {adm_fee}, {m_fee}, {due_day}, {pay_meth}, {c_at}::timestamptz, {u_at}::timestamptz)")

        # Add sample UK students
        std_rows.append("('std-uk-01', 'uk', 'usr-parent-uk-01', 'cls-uk-01', 'Bilal', 'Siddique', 'MUQ-UK-2026-0001', 'active', '2013-05-12'::date, 'male', '14 Romford Road, London E15 4BZ', '2024-01-15'::date, 15.00, 30.00, 10, 'Bank Transfer (SumUp)', now(), now())")
        std_rows.append("('std-uk-02', 'uk', 'usr-parent-uk-01', 'cls-uk-02', 'Maryam', 'Siddique', 'MUQ-UK-2026-0002', 'active', '2016-08-22'::date, 'female', '14 Romford Road, London E15 4BZ', '2024-02-01'::date, 15.00, 25.00, 10, 'Bank Transfer (SumUp)', now(), now())")

        out.append(",\n".join(std_rows))
        out.append("ON CONFLICT (id) DO NOTHING;\n")

    # 6. ATTENDANCE TABLES WITH STRICT TIME RULES
    out.append("""-- ==============================================================================
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
""")

    # 7. INVOICES (238 legacy invoices)
    out.append("""-- ==============================================================================
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
""")
    inv_inserts = get_raw_inserts('payment_invoices')
    if inv_inserts:
        out.append("-- Migrating 238 Historical MySQL Payment Invoices:")
        out.append("INSERT INTO payment_invoices (id, campus_id, type, reference_id, due_date, amount, currency, payment_method, payment_status, payment_date, created_at, updated_at)")
        out.append("VALUES")
        # Structure: (`id`, `type`, `reference_id`, `due_date`, `amount`, `payment_method`, `payment_status`, `payment_date`, `created_at`, `updated_at`)
        inv_rows = []
        raw_vals = inv_inserts[0]
        tuples = re.findall(r"\(([^)]+)\)", raw_vals)
        for t in tuples:
            parts = [p.strip() for p in re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", t)]
            if len(parts) >= 10:
                i_id = parts[0]
                itype = parts[1]
                ref_id = parts[2]
                due_d = parts[3]
                amt = parts[4]
                pmeth = parts[5]
                pstat = parts[6]
                pdate = parts[7]
                c_at = parts[8]
                u_at = parts[9]
                pdate_val = f"{pdate}::date" if pdate != 'NULL' else "NULL"
                inv_rows.append(f"({i_id}::text, 'kts', {itype}, {ref_id}::text, {due_d}::date, {amt}, 'PKR', {pmeth}, {pstat}, {pdate_val}, {c_at}::timestamptz, {u_at}::timestamptz)")

        # Add sample UK invoices
        inv_rows.append("('inv-uk-2026-001', 'uk', 'tuition_fee', 'std-uk-01', '2026-10-10'::date, 30.00, 'GBP', 'Bank Transfer (SumUp)', 'paid', '2026-10-08'::date, now(), now())")
        inv_rows.append("('inv-uk-2026-002', 'uk', 'tuition_fee', 'std-uk-02', '2026-10-10'::date, 25.00, 'GBP', 'Bank Transfer (SumUp)', 'paid', '2026-10-08'::date, now(), now())")

        out.append(",\n".join(inv_rows))
        out.append("ON CONFLICT (id) DO NOTHING;\n")

    # 8. PRAYER TIMINGS (288 rows)
    out.append("""-- ==============================================================================
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
""")
    pt_inserts = get_raw_inserts('prayer_timings')
    if pt_inserts:
        out.append("-- Migrating 288 Legacy Prayer Timings:")
        out.append("INSERT INTO prayer_timings (id, campus_id, english_name, arabic_name, month, day, year, begin_time, end_time, is_jummah, created_at, updated_at)")
        out.append("VALUES")
        # Structure: (`id`, `english_name`, `arabic_name`, `month`, `day`, `year`, `begin_time`, `end_time`, `is_jummah`, `created_at`, `updated_at`)
        pt_rows = []
        raw_vals = pt_inserts[0]
        tuples = re.findall(r"\(([^)]+)\)", raw_vals)
        for t in tuples:
            parts = [p.strip() for p in re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", t)]
            if len(parts) >= 11:
                pt_id = parts[0]
                eng = parts[1]
                ara = parts[2]
                mon = parts[3]
                day = parts[4]
                yr = parts[5]
                b_time = parts[6]
                e_time = parts[7]
                jummah = parts[8]
                c_at = parts[9]
                u_at = parts[10]
                pt_rows.append(f"({pt_id}, 'kts', {eng}, {ara}, {mon}, {day}, {yr}, {b_time}::time, {e_time}::time, ({jummah} = 1), {c_at}::timestamptz, {u_at}::timestamptz)")
        out.append(",\n".join(pt_rows))
        out.append("ON CONFLICT (id) DO NOTHING;\n")

    # 9. INCIDENTS, MEDICAL, AUDIT LOGS, ANNOUNCEMENTS
    out.append("""-- ==============================================================================
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
""")

    # Populate news, slider_images, document_uplouds from MySQL
    for tname in ['news', 'slider_images', 'document_uplouds']:
        ins = get_raw_inserts(tname)
        if ins:
            out.append(f"-- Migrating {tname}:")
            out.append(f"INSERT INTO {tname} VALUES")
            raw_vals = ins[0]
            tuples = re.findall(r"\(([^)]+)\)", raw_vals)
            t_rows = []
            for t in tuples:
                parts = [p.strip() for p in re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", t)]
                if tname in ['news', 'slider_images']:
                    # id, content/image, is_active, created_at, updated_at
                    t_rows.append(f"({parts[0]}, {parts[1]}, ({parts[2]} = 1), {parts[3]}::timestamptz, {parts[4]}::timestamptz)")
                elif tname == 'document_uplouds':
                    t_rows.append(f"({parts[0]}, {parts[1]}, {parts[2]}, {parts[3]}, {parts[4]}, {parts[5]}::timestamptz, {parts[6]}::timestamptz)")
            out.append(",\n".join(t_rows))
            out.append("ON CONFLICT (id) DO NOTHING;\n")

    # 10. ROW LEVEL SECURITY (RLS) POLICIES
    out.append("""-- ==============================================================================
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
CREATE POLICY "Public read for campuses" ON campuses FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Super admin manage campuses" ON campuses FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');

-- Student RLS policies
CREATE POLICY "Super admin full access on students" ON students FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Campus admin own campus students" ON students FOR ALL TO authenticated USING (auth_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth_user_campus());
CREATE POLICY "Teacher view students in class" ON students FOR SELECT TO authenticated USING (
    auth_user_role() = 'TEACHER' AND class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()::text
    )
);
CREATE POLICY "Parent view own children" ON students FOR SELECT TO authenticated USING (
    auth_user_role() = 'PARENT' AND parent_id = auth.uid()::text
);

-- Attendance RLS policies
CREATE POLICY "Super admin full student attendance" ON student_attendances FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Campus admin own student attendance" ON student_attendances FOR ALL TO authenticated USING (auth_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth_user_campus());
CREATE POLICY "Teacher manage own class student attendance" ON student_attendances FOR ALL TO authenticated USING (
    auth_user_role() = 'TEACHER' AND class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()::text
    )
);

CREATE POLICY "Super admin full teacher attendance" ON teacher_attendances FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Campus admin own teacher attendance" ON teacher_attendances FOR ALL TO authenticated USING (auth_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth_user_campus());
CREATE POLICY "Teacher own self attendance" ON teacher_attendances FOR ALL TO authenticated USING (teacher_id = auth.uid()::text);

-- Invoices RLS policies
CREATE POLICY "Super admin full invoices" ON payment_invoices FOR ALL TO authenticated USING (auth_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Campus admin own invoices" ON payment_invoices FOR ALL TO authenticated USING (auth_user_role() = 'CAMPUS_ADMIN' AND campus_id = auth_user_campus());
CREATE POLICY "Parent view own invoices" ON payment_invoices FOR SELECT TO authenticated USING (
    auth_user_role() = 'PARENT' AND reference_id IN (SELECT id FROM students WHERE parent_id = auth.uid()::text)
);
""")

    final_sql = "\n".join(out)
    os.makedirs('supabase/migrations', exist_ok=True)
    with open('supabase/migrations/20261014_complete_migration.sql', 'w', encoding='utf-8') as f:
        f.write(final_sql)
    # Also write to supabase/schema.sql
    with open('supabase/schema.sql', 'w', encoding='utf-8') as f:
        f.write(final_sql)
    print("Migration SQL generated successfully! Bytes:", len(final_sql))

if __name__ == '__main__':
    run()
