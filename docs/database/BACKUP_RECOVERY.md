# Backup and recovery — Misbah-ul-Quran IMS

## What protects the data

| Layer | What it covers | Who runs it |
|---|---|---|
| **Logical JSON backup** (`scripts/backup_supabase.ts`) | Every table and the Supabase Auth user list (no password hashes — Auth never exposes them) | You / before every migration |
| **Supabase platform backups** | Full database, including Auth password hashes | Supabase. Daily backups require a paid plan; Point-in-Time Recovery is a paid add-on. Check **Project Settings → Database → Backups**. |
| **Schema-level protection** | `RESTRICT` foreign keys, soft delete for students, deactivation for teachers, append-only audit log, RLS | Built into the database |

The free plan has **no** downloadable platform backups, so the logical backup is the main safety net until the project is on a paid plan.

## Taking a logical backup

```bash
npx tsx scripts/backup_supabase.ts
```

- Needs `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
- Writes `backups/<timestamp>/<table>.json`, `_auth_users.json` and `_manifest.json` (row counts).
- Read-only: it changes nothing.
- `backups/` is git-ignored because it contains personal data. Keep copies somewhere private (encrypted drive or private storage), not in email or chat.

**When:** before every migration, before bulk edits, and on a schedule (weekly at minimum). Keep at least the last 4 backups.

## Verifying a backup

Open `_manifest.json`: every table should be listed with a row count and `errors` should be empty.
A backup with errors is not complete — fix the cause and run it again.

## Recovering

### A single record changed or deleted by mistake

1. Find the record in the most recent `backups/<timestamp>/<table>.json`.
2. Re-insert or update it in the Supabase dashboard (**Table Editor**) or with an `INSERT`/`UPDATE` in the SQL Editor.
3. Students are archived, not deleted: to restore one, set `status = 'active'` and `archived_at = NULL`.
4. Teachers deactivated because they had history: set `users.status = 1` and un-ban the login
   (**Authentication → Users → … → Unban**, or the admin API).

### A migration went wrong

1. If the SQL Editor showed an error, the transaction rolled back — nothing changed. Fix the cause and re-run.
2. If it succeeded but the app misbehaves, run the matching `*_rollback.sql` (see [MIGRATIONS.md](MIGRATIONS.md)) and revert the code that shipped with it.

### Whole-database loss

1. Restore from a Supabase platform backup if the plan has one (this also restores Auth password hashes).
2. Otherwise: recreate the schema (legacy baseline + migrations 01–04), then load each table from the latest logical backup
   in foreign-key order — `campuses`, `users`, `user_campus_access`, `teacher_profiles`, `classes`, `students`,
   then attendance, invoices, incidents, medical records, documents, audit logs, content tables.
3. Auth accounts: recreate them with `auth.admin.createUser` using the ids from `_auth_users.json`, then set each user's
   password through an admin reset (passwords cannot be restored from a logical backup).

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` (secret key) bypasses all security. It belongs only in the server's `.env` — never in
  `VITE_*` variables, the browser, git, chat or email.
- The public anon key is safe to expose: with RLS it can only read campuses, news, slider images and prayer times.
- If the secret key is ever exposed, rotate it in **Project Settings → API Keys** and update `.env`.
