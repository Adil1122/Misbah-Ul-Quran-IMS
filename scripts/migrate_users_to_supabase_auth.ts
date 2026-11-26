/**
 * One-off migration: create a Supabase Auth account for every public.users row
 * that is not yet linked (users.auth_user_id IS NULL), reusing the user's
 * current password so nobody has to reset it. Then link the row.
 *
 * Usage:
 *   npx tsx scripts/migrate_users_to_supabase_auth.ts           # dry run (no changes)
 *   npx tsx scripts/migrate_users_to_supabase_auth.ts --apply   # create + link accounts
 *   npx tsx scripts/migrate_users_to_supabase_auth.ts --scrub   # after logins are confirmed:
 *        overwrite users.password with a placeholder for every LINKED user
 *
 * Never prints passwords. Idempotent: linked users are skipped.
 */
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { AUTH_MANAGED_PASSWORD } from '../server/authService.ts';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const APPLY = process.argv.includes('--apply');
const SCRUB = process.argv.includes('--scrub');

if (!url || !key) {
  console.error('Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function listAllAuthUsers() {
  const all: any[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    all.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return all;
}

async function scrub() {
  const { data: rows, error } = await admin.from('users').select('id, auth_user_id, password');
  if (error) throw new Error(error.message);
  const linked = (rows || []).filter((r) => r.auth_user_id && r.password !== AUTH_MANAGED_PASSWORD);
  const unlinked = (rows || []).filter((r) => !r.auth_user_id);
  if (unlinked.length > 0) {
    console.error(`Refusing to scrub: ${unlinked.length} user(s) are not linked to Supabase Auth yet: ${unlinked.map((r) => r.id).join(', ')}`);
    process.exit(2);
  }
  for (const r of linked) {
    const { error: upErr } = await admin.from('users').update({ password: AUTH_MANAGED_PASSWORD }).eq('id', r.id);
    console.log(`${r.id.padEnd(28)} ${upErr ? 'ERROR ' + upErr.message : 'plain-text password removed'}`);
  }
  console.log(`Done. ${linked.length} row(s) scrubbed.`);
}

async function migrate() {
  console.log(APPLY ? 'MODE: APPLY (changes will be made)\n' : 'MODE: DRY RUN (no changes) — re-run with --apply\n');
  const { data: rows, error } = await admin
    .from('users')
    .select('id, email, role, status, password, auth_user_id')
    .order('created_at');
  if (error) throw new Error(error.message);

  const authUsers = await listAllAuthUsers();
  const authByEmail = new Map(authUsers.map((u) => [String(u.email || '').toLowerCase(), u]));
  let created = 0, linked = 0, skipped = 0, failed = 0;

  for (const r of rows || []) {
    const tag = `${r.id.padEnd(28)} ${String(r.role).padEnd(12)}`;
    if (r.auth_user_id) { console.log(`${tag} already linked — skip`); skipped++; continue; }
    const email = String(r.email || '').trim().toLowerCase();
    if (!email) { console.log(`${tag} NO EMAIL — cannot create a login (add an email first)`); failed++; continue; }

    const existing = authByEmail.get(email);
    if (existing) {
      // An Auth account with this email already exists: link it, do not touch its password.
      console.log(`${tag} Auth account with this email exists — ${APPLY ? 'linking' : 'would link'}`);
      if (APPLY) {
        const { error: linkErr } = await admin.from('users').update({ auth_user_id: existing.id }).eq('id', r.id);
        if (linkErr) { console.log(`   link FAILED: ${linkErr.message}`); failed++; continue; }
      }
      linked++;
      continue;
    }

    const password = String(r.password || '');
    if (password.length < 6 || password === AUTH_MANAGED_PASSWORD) {
      console.log(`${tag} stored password unusable — ${APPLY ? 'creating with random password (needs admin reset)' : 'would create with random password'}`);
    } else {
      console.log(`${tag} ${APPLY ? 'creating Auth account with current password' : 'would create Auth account with current password'}`);
    }
    if (!APPLY) { created++; continue; }

    const usable = password.length >= 6 && password !== AUTH_MANAGED_PASSWORD;
    const { data, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: usable ? password : `Reset-${crypto.randomUUID()}`,
      email_confirm: true,
      app_metadata: { app_user_id: r.id, role: String(r.role).toUpperCase() },
      ban_duration: r.status === 1 || r.status === true ? undefined : '876000h',
    });
    if (createErr || !data?.user) { console.log(`   create FAILED: ${createErr?.message}`); failed++; continue; }

    const { error: linkErr } = await admin.from('users').update({ auth_user_id: data.user.id }).eq('id', r.id);
    if (linkErr) {
      console.log(`   link FAILED (${linkErr.message}) — removing the new Auth account`);
      await admin.auth.admin.deleteUser(data.user.id);
      failed++;
      continue;
    }
    created++;
  }

  console.log(`\nSummary: created=${created} linked=${linked} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(2);
}

(SCRUB ? scrub() : migrate()).catch((err) => {
  console.error('Migration failed:', err?.message || err);
  process.exit(1);
});
