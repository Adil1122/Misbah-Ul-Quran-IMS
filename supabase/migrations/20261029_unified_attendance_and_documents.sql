-- ==============================================================================
-- MISBAH-UL-QURAN IMS — UNIFIED ATTENDANCE, INCIDENTS, MEDICAL & STORAGE MIGRATION
-- Migration Date: 2026-10-29
-- ==============================================================================

-- 1. Ensure 'medical_records' table exists for standalone medical tracking
CREATE TABLE IF NOT EXISTS medical_records (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL DEFAULT 'uk' REFERENCES campuses(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    condition TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'HIGH',
    allergies TEXT,
    medication_notes TEXT,
    emergency_contact TEXT,
    reported_by TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medical_records_read_policy" ON medical_records;
CREATE POLICY "medical_records_read_policy" ON medical_records
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "medical_records_write_policy" ON medical_records
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 2. Verify 'incident_logs' table columns and RLS
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

ALTER TABLE incident_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "incident_logs_read_policy" ON incident_logs;
CREATE POLICY "incident_logs_read_policy" ON incident_logs
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "incident_logs_write_policy" ON incident_logs;
CREATE POLICY "incident_logs_write_policy" ON incident_logs
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 3. Verify 'document_uplouds' table columns and RLS
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

ALTER TABLE document_uplouds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_uplouds_read_policy" ON document_uplouds;
CREATE POLICY "document_uplouds_read_policy" ON document_uplouds
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "document_uplouds_write_policy" ON document_uplouds;
CREATE POLICY "document_uplouds_write_policy" ON document_uplouds
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 4. Storage Bucket Setup: 'misbah-documents' (Private bucket with signed access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'misbah-documents',
    'misbah-documents',
    false,
    26214400, -- 25 MB
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 26214400;

DROP POLICY IF EXISTS "misbah_documents_upload_policy" ON storage.objects;
CREATE POLICY "misbah_documents_upload_policy" ON storage.objects
    FOR INSERT TO authenticated, anon
    WITH CHECK (bucket_id = 'misbah-documents');

DROP POLICY IF EXISTS "misbah_documents_select_policy" ON storage.objects;
CREATE POLICY "misbah_documents_select_policy" ON storage.objects
    FOR SELECT TO authenticated, anon
    USING (bucket_id = 'misbah-documents');

DROP POLICY IF EXISTS "misbah_documents_update_policy" ON storage.objects;
CREATE POLICY "misbah_documents_update_policy" ON storage.objects
    FOR UPDATE TO authenticated, anon
    USING (bucket_id = 'misbah-documents');

DROP POLICY IF EXISTS "misbah_documents_delete_policy" ON storage.objects;
CREATE POLICY "misbah_documents_delete_policy" ON storage.objects
    FOR DELETE TO authenticated, anon
    USING (bucket_id = 'misbah-documents');
