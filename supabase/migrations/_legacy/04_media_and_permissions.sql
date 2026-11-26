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