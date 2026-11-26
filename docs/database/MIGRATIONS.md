# Database migrations — Misbah-ul-Quran IMS

## How migrations are applied

This project has no automated migration runner. Each migration is a single SQL file that you run
**once**, in order, in **Supabase Dashboard → SQL Editor → New query → paste → Run**.

Every migration file:

- runs inside one `BEGIN … COMMIT` transaction — if any statement fails, nothing changes;
- starts with **pre-checks** that abort with a readable message when live data would break a new rule;
- is **idempotent** where possible (`IF NOT EXISTS`, `IF EXISTS`), so running it twice is harmless;
- ends with a small **result table** to confirm what happened;
- has a matching `*_rollback.sql`.

**Before every migration:** take a backup (`npx tsx scripts/backup_supabase.ts`, see
[BACKUP_RECOVERY.md](BACKUP_RECOVERY.md)). **After:** restart the server if the migration came with code changes.

## Baseline

The database was originally created from a MySQL import. The files in
[`supabase/migrations/_legacy/`](../../supabase/migrations/_legacy/) are that history. **Do not run them**: several of them
disable Row Level Security and grant the public key full access, which would undo the security work below.

The live schema as of the start of the 2026-11-26 re-architecture is recorded in
`backups/catalog_snapshot_2026-11-26.csv` (private, git-ignored).

## History

| # | File | Applied | What it does | Code changes shipped with it |
|---|---|---|---|---|
| 01 | `20261126_01_additive.sql` | 2026-11-26 | **Additive only.** Student fields (`blood_group`, `medical_notes`, `quran_milestone`, `archived_at`); class fields (`grade_level`, `room`, `schedule_time`); `payment_invoices.student_id` FK; `users.auth_user_id` → `auth.users`; new `user_campus_access` table (backfilled); contact details and `audit_logs.details` text → `jsonb`; 15 CHECK constraints; `set_updated_at()` trigger on all tables; 16 indexes. | Server reads/writes the new columns; student/teacher attendance, incidents, medical and document writes now report database errors instead of silently succeeding; audit log ordered by `created_at`. |
| — | *(script)* `scripts/migrate_users_to_supabase_auth.ts --apply` | 2026-11-26 | Created a Supabase Auth login for each existing user with their current password and linked it. | Server-verified login (`/api/auth/login`), Supabase-JWT verification in `authenticateUser`, password change/reset endpoints, Auth-backed account create/update/suspend/delete; removed forged-token backdoors and client-side password checks. |
| — | *(script)* `… --scrub` | 2026-11-26 | Replaced plain-text passwords in `users.password` with a placeholder after logins were confirmed. | — |
| 02 | `20261126_02_rls_and_grants.sql` | 2026-11-26 | **Security.** Revoked all `anon` write access and all `anon` reads except public content; enabled RLS on every table; role/campus policies; append-only audit log; dropped the leaking `profiles` view and legacy `auth_user_role()` / `auth_user_campus()`. | — |
| 03 | `20261126_03_integrity.sql` | 2026-11-26 | `ON DELETE CASCADE` → `RESTRICT` for campus/student/teacher history; added missing FKs; renamed `document_uplouds` → `documents` and `medical_logs` → `medical_records`; dropped empty `document_uploads`; deactivated duplicate classes; backfilled class codes; unique class code per campus. | Table names updated; student delete = archive (+ audit); teacher delete deactivates when history exists and removes the Auth login otherwise; unsafe `.or()` filters replaced; inactive classes hidden. |
| 04 | `20261126_04_drop_plaintext_password.sql` | 2026-11-26 | Dropped `users.password`; deactivated the remaining empty duplicate class (KTS B-2, id `2`). | Inserts no longer write a password; removed the invented `'admin123'` from the state mapping. |
| — | *(code only)* Step 7 | 2026-11-26 | — | Supabase is the single source of truth: the local JSON file no longer stores Supabase-backed data; `/api/database/state` never falls back to stale copies; admin-only + database-verified campus checks on student/class/payment edits; parent and teacher scoping; audit log loaded from Supabase. |

## Rolling back

Run the matching `*_rollback.sql` for the **most recent** migration first, then the previous one, and so on.
Read the header of each rollback file before running it:

- `02_…_rollback.sql` restores the previous, insecure access (public key can read and modify everything). Use only to recover from an outage, then re-apply 02.
- `03_…_rollback.sql` does not re-activate deactivated classes or restore audit `user_id` values that pointed at deleted users.
- `04_…_rollback.sql` re-creates `users.password` with the placeholder only; real passwords live in Supabase Auth.
- Code and schema must match: if you roll back 03 or 04, also revert the code changes listed above (see git history).

## Writing the next migration

1. Name it `YYYYMMDD_NN_short_description.sql` and add a `…_rollback.sql`.
2. Copy the header block from an existing migration (purpose, safety, rollback).
3. Add pre-checks for any constraint that existing data could violate.
4. Wrap it in `BEGIN … COMMIT` and finish with `NOTIFY pgrst, 'reload schema';` and a result query.
5. New tables: enable RLS and add policies in the same migration; never `GRANT ALL … TO anon`.
6. Update [SCHEMA.md](SCHEMA.md) / [ERD.md](ERD.md) and add a row to the table above.
