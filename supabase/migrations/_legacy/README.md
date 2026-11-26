# ⚠️ Legacy SQL — DO NOT RUN

These files are the history of the database before the 2026-11-26 re-architecture.
They are kept for reference only.

**Running any of them against the live database would undo security and integrity fixes.** For example:

- `schema.sql` / `clean_production_migration.sql` contain `ALTER TABLE … DISABLE ROW LEVEL SECURITY`
  for the core tables, which would expose users and students to the public key again.
- `rls_policies.sql` creates functions in the `auth` schema, which Supabase does not allow, and its
  policies assume Supabase Auth ids that the old app never used.
- `20261029_unified_attendance_and_documents.sql` has a syntax error (a broken `DROP POLICY … FOR ALL`
  around line 29) and never applied; its `medical_records` table was created properly by migration
  `20261126_03_integrity.sql` (as a rename of `medical_logs`).
- `storage_setup.sql` defines the `misbah-documents` storage bucket, but it was never applied — no
  storage bucket exists yet. Re-create it with a new, reviewed migration (private bucket, policies for
  `authenticated` staff only, never `anon`) when document file storage is implemented.

The current migrations are in the parent folder (`20261126_01` … `20261126_04`);
see [docs/database/MIGRATIONS.md](../../../docs/database/MIGRATIONS.md).
