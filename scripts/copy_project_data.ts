/**
 * Copies every row, login and uploaded file from the OLD Supabase project to the NEW one.
 *
 *   npx tsx scripts/copy_project_data.ts             dry run: reads both projects, changes nothing
 *   npx tsx scripts/copy_project_data.ts --apply     performs the copy, then verifies it
 *   npx tsx scripts/copy_project_data.ts --verify    only compares OLD and NEW
 *   npx tsx scripts/copy_project_data.ts --wipe-new  empties the NEW project (rows, logins, files) to retry
 *
 * Needs in .env:
 *   OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_ROLE_KEY            the project being copied (only ever read)
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY               the NEW project (schema from 20261127_00_baseline.sql)
 *
 * - The OLD project is never written to.
 * - --apply refuses to run unless every NEW table and the NEW login list are empty.
 * - Logins are recreated with the same Auth user id and email. Passwords cannot be copied
 *   (Supabase never exposes them), so each gets a random temporary password, written ONLY to
 *   backups/<timestamp>_copy/_temporary_passwords.txt (git-ignored). Suspended logins stay suspended.
 * - A full snapshot of the OLD project is saved to backups/<timestamp>_copy/ first.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const OLD_URL = (process.env.OLD_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const OLD_KEY = (process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || '').trim();
const NEW_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const NEW_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const MODE = process.argv.includes('--apply') ? 'apply'
  : process.argv.includes('--verify') ? 'verify'
  : process.argv.includes('--wipe-new') ? 'wipe'
  : 'dry-run';

// Parents before children (from the foreign keys in the baseline).
const TABLE_ORDER = [
  'campuses', 'users', 'user_campus_access', 'parent_profiles', 'teacher_profiles', 'classes', 'students',
  'teacher_attendances', 'student_attendances', 'payment_invoices', 'incident_logs', 'medical_records',
  'academic_progress', 'exam_results', 'teaching_materials', 'teacher_salary_records', 'expense_logs',
  'announcements', 'event_announcements', 'notification_logs', 'documents', 'news', 'slider_images',
  'prayer_timings', 'audit_logs',
];
const KEY_COLUMN: Record<string, string> = { user_campus_access: 'user_id' };
const BUCKET = 'misbah-documents';
const PAGE = 1000;

function fail(msg: string): never {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

if (!OLD_URL || !OLD_KEY) fail('OLD_SUPABASE_URL and OLD_SUPABASE_SERVICE_ROLE_KEY must be set in .env.');
if (!NEW_URL || !NEW_KEY) fail('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the NEW project) must be set in .env.');
if (new URL(OLD_URL).host === new URL(NEW_URL).host) fail('OLD and NEW point to the same project. Nothing to copy.');

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const oldDb = createClient(OLD_URL, OLD_KEY, opts);
const newDb = createClient(NEW_URL, NEW_KEY, opts);

async function listTables(url: string, key: string): Promise<string[]> {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/openapi+json' },
  });
  if (!res.ok) fail(`Could not read the table list of ${new URL(url).host}: HTTP ${res.status}`);
  const spec: any = await res.json();
  return Object.keys(spec.definitions || {}).sort();
}

async function readAll(db: SupabaseClient, table: string): Promise<any[]> {
  const rows: any[] = [];
  const key = KEY_COLUMN[table] || 'id';
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select('*').order(key).range(from, from + PAGE - 1);
    if (error) fail(`Reading ${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function listAuthUsers(db: SupabaseClient): Promise<any[]> {
  const users: any[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail(`Listing logins: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function listFiles(db: SupabaseClient, prefix = ''): Promise<string[]> {
  const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) {
    if (/not found/i.test(error.message)) return [];
    fail(`Listing files in ${BUCKET}/${prefix}: ${error.message}`);
  }
  const out: string[] = [];
  for (const item of data || []) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) out.push(...(await listFiles(db, full))); // folder
    else out.push(full);
  }
  return out;
}

function stable(v: any): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
}

function tempPassword(): string {
  const pick = (set: string, n: number) => Array.from({ length: n }, () => set[crypto.randomInt(set.length)]).join('');
  const chars = pick('ABCDEFGHJKLMNPQRSTUVWXYZ', 3) + pick('abcdefghijkmnpqrstuvwxyz', 6) + pick('23456789', 3) + pick('!@#$%*?', 2);
  return chars.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

function isBanned(u: any): boolean {
  return !!u.banned_until && new Date(u.banned_until).getTime() > Date.now();
}

async function snapshotOld(dir: string) {
  const data: Record<string, any[]> = {};
  for (const t of TABLE_ORDER) data[t] = await readAll(oldDb, t);
  const authUsers = await listAuthUsers(oldDb);
  const files = await listFiles(oldDb);
  fs.mkdirSync(dir, { recursive: true });
  for (const t of TABLE_ORDER) fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(data[t], null, 2));
  fs.writeFileSync(path.join(dir, '_auth_users.json'), JSON.stringify(authUsers, null, 2));
  const fileBytes: Record<string, Buffer> = {};
  for (const f of files) {
    const { data: blob, error } = await oldDb.storage.from(BUCKET).download(f);
    if (error || !blob) fail(`Downloading ${f}: ${error?.message}`);
    const buf = Buffer.from(await blob.arrayBuffer());
    fileBytes[f] = buf;
    const target = path.join(dir, '_storage', BUCKET, f);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buf);
  }
  return { data, authUsers, files, fileBytes };
}

async function verify(): Promise<boolean> {
  console.log('\nVerifying OLD vs NEW …');
  let ok = true;
  for (const t of TABLE_ORDER) {
    const [a, b] = [await readAll(oldDb, t), await readAll(newDb, t)];
    const setB = new Map(b.map((r) => [stable(r), r]));
    const missing = a.filter((r) => !setB.has(stable(r)));
    const extra = b.length - (a.length - missing.length);
    const good = a.length === b.length && missing.length === 0;
    if (!good) ok = false;
    console.log(`  ${good ? '✔' : '✖'} ${t.padEnd(24)} old ${String(a.length).padStart(4)}  new ${String(b.length).padStart(4)}${good ? '' : `  (${missing.length} differ, ${extra} extra)`}`);
    if (!good) {
      const keyCol = KEY_COLUMN[t] || 'id';
      const byKey = new Map(b.map((r) => [r[keyCol], r]));
      for (const r of missing.slice(0, 5)) {
        const other = byKey.get(r[keyCol]);
        const cols = other ? Object.keys(r).filter((c) => stable(r[c]) !== stable(other[c])) : ['(row missing)'];
        console.log(`      ${keyCol}=${r[keyCol]}: ${cols.join(', ')}`);
      }
    }
  }
  const [oa, na] = [await listAuthUsers(oldDb), await listAuthUsers(newDb)];
  const linked = new Set((await readAll(oldDb, 'users')).map((u) => u.auth_user_id).filter(Boolean));
  const naById = new Map(na.map((u) => [u.id, u]));
  const authProblems = oa.filter((u) => linked.has(u.id)).filter((u) => {
    const n = naById.get(u.id);
    return !n || (n.email || '').toLowerCase() !== (u.email || '').toLowerCase() || isBanned(n) !== isBanned(u);
  });
  const authOk = authProblems.length === 0;
  if (!authOk) ok = false;
  console.log(`  ${authOk ? '✔' : '✖'} ${'logins (linked)'.padEnd(24)} old ${String(linked.size).padStart(4)}  new ${String(na.length).padStart(4)}${authOk ? '' : `  (${authProblems.length} missing or different)`}`);
  const [of, nf] = [await listFiles(oldDb), await listFiles(newDb)];
  const filesOk = of.length === nf.length && of.every((f) => nf.includes(f));
  if (!filesOk) ok = false;
  console.log(`  ${filesOk ? '✔' : '✖'} ${'stored files'.padEnd(24)} old ${String(of.length).padStart(4)}  new ${String(nf.length).padStart(4)}`);
  return ok;
}

async function wipeNew() {
  console.log(`Emptying NEW project ${new URL(NEW_URL).host} (the OLD project is not touched) …`);
  for (const t of [...TABLE_ORDER].reverse()) {
    const { error, count } = await newDb.from(t).delete({ count: 'exact' }).not(KEY_COLUMN[t] || 'id', 'is', null);
    if (error) fail(`Emptying ${t}: ${error.message}`);
    if (count) console.log(`  ${t}: ${count} rows removed`);
  }
  for (const u of await listAuthUsers(newDb)) {
    const { error } = await newDb.auth.admin.deleteUser(u.id);
    if (error) fail(`Removing login ${u.email}: ${error.message}`);
    console.log(`  login removed: ${u.email}`);
  }
  const files = await listFiles(newDb);
  if (files.length) {
    const { error } = await newDb.storage.from(BUCKET).remove(files);
    if (error) fail(`Removing files: ${error.message}`);
    console.log(`  ${files.length} files removed`);
  }
  console.log('Done. The NEW project is empty.');
}

async function main() {
  console.log(`OLD (read only): ${new URL(OLD_URL).host}`);
  console.log(`NEW (target)   : ${new URL(NEW_URL).host}`);
  console.log(`Mode           : ${MODE}`);

  if (MODE === 'wipe') return wipeNew();
  if (MODE === 'verify') return process.exit((await verify()) ? 0 : 1);

  // Schema check: both projects must expose exactly the expected tables.
  const [oldTables, newTables] = [await listTables(OLD_URL, OLD_KEY), await listTables(NEW_URL, NEW_KEY)];
  for (const [name, list] of [['OLD', oldTables], ['NEW', newTables]] as const) {
    const missing = TABLE_ORDER.filter((t) => !list.includes(t));
    const unknown = list.filter((t) => !TABLE_ORDER.includes(t));
    if (missing.length) fail(`${name} project is missing tables: ${missing.join(', ')}${name === 'NEW' ? ' — run 20261127_00_baseline.sql first.' : ''}`);
    if (unknown.length) fail(`${name} project has tables this script does not know: ${unknown.join(', ')}`);
  }

  // Target must be empty.
  const nonEmpty: string[] = [];
  for (const t of TABLE_ORDER) {
    const { count, error } = await newDb.from(t).select('*', { count: 'exact', head: true });
    if (error) fail(`Counting NEW ${t}: ${error.message}`);
    if (count) nonEmpty.push(`${t} (${count})`);
  }
  const newLogins = await listAuthUsers(newDb);
  const newFiles = await listFiles(newDb);
  if (nonEmpty.length || newLogins.length || newFiles.length) {
    const what = [...nonEmpty, newLogins.length ? `${newLogins.length} logins` : '', newFiles.length ? `${newFiles.length} files` : ''].filter(Boolean);
    fail(`The NEW project is not empty: ${what.join(', ')}. Run with --wipe-new first if this is a retry.`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.resolve(process.cwd(), 'backups', `${stamp}_copy`);
  console.log(`\nSnapshot of OLD → ${path.relative(process.cwd(), dir)}`);
  const snap = await snapshotOld(dir);

  const appUsers = snap.data.users;
  const linkedIds = new Set(appUsers.map((u) => u.auth_user_id).filter(Boolean));
  const toCreate = snap.authUsers.filter((u) => linkedIds.has(u.id));
  const skipped = snap.authUsers.filter((u) => !linkedIds.has(u.id));
  const missingAuth = [...linkedIds].filter((id) => !snap.authUsers.some((u) => u.id === id));
  if (missingAuth.length) fail(`${missingAuth.length} app users point to logins that do not exist in OLD.`);

  console.log('\nPlan:');
  for (const t of TABLE_ORDER) console.log(`  ${t.padEnd(24)} ${String(snap.data[t].length).padStart(4)} rows`);
  console.log(`  logins to recreate       ${String(toCreate.length).padStart(4)} (${toCreate.filter(isBanned).length} suspended)`);
  if (skipped.length) console.log(`  logins skipped           ${String(skipped.length).padStart(4)} (not linked to any app user)`);
  console.log(`  stored files             ${String(snap.files.length).padStart(4)}`);

  if (MODE === 'dry-run') {
    console.log('\nDry run: nothing was written. Run again with --apply to copy.');
    return;
  }

  // 1. Logins (same id, same email, temporary password).
  console.log('\nCreating logins …');
  const passwords: string[] = [];
  for (const u of toCreate) {
    const password = tempPassword();
    const { data, error } = await newDb.auth.admin.createUser({
      id: u.id,
      email: u.email,
      password,
      email_confirm: true,
      user_metadata: u.user_metadata || {},
      app_metadata: u.app_metadata || {},
      ...(isBanned(u) ? { ban_duration: '876000h' } : {}),
    } as any);
    if (error) fail(`Creating login ${u.email}: ${error.message}`);
    if (data.user?.id !== u.id) fail(`Login ${u.email} was created with a different id; stopping. Run --wipe-new and report this.`);
    const app = appUsers.find((a) => a.auth_user_id === u.id);
    passwords.push(`${u.email}\t${app?.username || ''}\t${app?.role || ''}\t${password}${isBanned(u) ? '\t(suspended)' : ''}`);
    console.log(`  ✔ ${u.email}${isBanned(u) ? ' (suspended)' : ''}`);
  }
  const pwFile = path.join(dir, '_temporary_passwords.txt');
  fs.writeFileSync(pwFile, [
    'TEMPORARY PASSWORDS for the new Supabase project. PRIVATE: do not share in chat or email.',
    'Give each person their own password privately and ask them to change it after signing in.',
    'Delete this file once everyone has a new password.',
    '',
    'email\tusername\trole\ttemporary password',
    ...passwords,
    '',
  ].join('\n'));

  // 2. Rows, parents first.
  console.log('\nCopying rows …');
  for (const t of TABLE_ORDER) {
    const rows = snap.data[t];
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await newDb.from(t).insert(rows.slice(i, i + 500));
      if (error) fail(`Inserting into ${t}: ${error.message}. Fix the cause, run --wipe-new, then --apply again.`);
    }
    console.log(`  ✔ ${t.padEnd(24)} ${rows.length}`);
  }

  // 3. Files.
  if (snap.files.length) console.log('\nCopying files …');
  for (const f of snap.files) {
    const { error } = await newDb.storage.from(BUCKET).upload(f, snap.fileBytes[f], { upsert: false });
    if (error) fail(`Uploading ${f}: ${error.message}`);
    console.log(`  ✔ ${f}`);
  }

  const ok = await verify();
  console.log(`\nTemporary passwords: ${path.relative(process.cwd(), pwFile)} (private)`);
  console.log(ok ? '\n✔ Copy complete and verified.' : '\n✖ Copy finished but verification found differences (see above).');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => fail(e?.message || String(e)));
