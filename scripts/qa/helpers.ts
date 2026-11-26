/**
 * Shared helpers for the QA test suites.
 *
 * Every suite runs against the configured Supabase project (and, for API tests, the
 * dev server at BASE_URL). Suites create TEMPORARY accounts and records with a `qa-`
 * prefix and random passwords, and remove them in `cleanup()` — no real user's
 * credentials are needed or read.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true } as any);

export const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
export const ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
export const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

/** Service-role client: used only to set up and tear down test fixtures. */
export const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ---------------------------------------------------------------------------
// Assertions / reporting
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

export function check(label: string, condition: boolean, detail = ''): void {
  if (condition) passed++;
  else failed++;
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` ${detail}` : ''}`);
}

export function section(title: string): void {
  console.log(`\n--- ${title}`);
}

export function report(suite: string): number {
  console.log(`\n${suite}: ${passed} passed, ${failed} failed`);
  return failed;
}

// ---------------------------------------------------------------------------
// HTTP against the dev server
// ---------------------------------------------------------------------------
export async function api(method: string, route: string, token?: string | null, body?: unknown): Promise<[number, any]> {
  const res = await fetch(BASE_URL + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return [res.status, await res.json().catch(() => ({}))];
}

export async function requireServer(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err: any) {
    console.error(`Dev server not reachable at ${BASE_URL} (${err.message}). Start it with "npm run dev" first.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Temporary QA accounts and records
// ---------------------------------------------------------------------------
const created = {
  users: [] as { id: string; authId: string }[],
  students: [] as string[],
  classes: [] as string[],
  teacherProfiles: [] as string[],
};

export interface QaUser {
  id: string;
  email: string;
  password: string;
  /** Supabase access token obtained through the server's /api/auth/login (only if loginViaServer). */
  token: string | null;
  /** supabase-js client signed in as this user (RLS applies). */
  client: SupabaseClient;
}

export function randomPassword(): string {
  return 'Qa-' + crypto.randomBytes(12).toString('base64url');
}

export async function createQaUser(
  role: 'SUPER_ADMIN' | 'CAMPUS_ADMIN' | 'TEACHER' | 'PARENT',
  campuses: string[],
  opts: { loginViaServer?: boolean } = {}
): Promise<QaUser> {
  const password = randomPassword();
  const id = `usr-qa-${role.toLowerCase().replace('_', '-')}-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  const email = `${id}@qa.invalid`;

  const { data: auth, error: authErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (authErr || !auth?.user) throw new Error(`QA auth user: ${authErr?.message}`);
  created.users.push({ id, authId: auth.user.id });

  const primary = campuses.find((c) => c !== 'all') || null;
  const { error: rowErr } = await admin.from('users').insert([{
    id, auth_user_id: auth.user.id, email, username: id, first_name: 'QA', last_name: role,
    role, active_campus_id: primary, allowed_campus_ids: campuses, status: 1,
  }]);
  if (rowErr) throw new Error(`QA users row: ${rowErr.message}`);
  const { error: accErr } = await admin.from('user_campus_access').insert(campuses.map((campus_id) => ({ user_id: id, campus_id })));
  if (accErr) throw new Error(`QA campus access: ${accErr.message}`);

  const client = anonClient();
  const { error: signErr } = await client.auth.signInWithPassword({ email, password });
  if (signErr) throw new Error(`QA sign-in: ${signErr.message}`);

  let token: string | null = null;
  if (opts.loginViaServer) {
    const [status, body] = await api('POST', '/api/auth/login', null, { identifier: id, password });
    if (status !== 200) throw new Error(`QA server login failed (${status}): ${body?.error}`);
    token = body.session.access_token;
  }
  return { id, email, password, token, client };
}

/** Records created through the API that the suite must remove afterwards. */
export function trackStudent(id?: string | null) { if (id) created.students.push(id); }
export function trackClass(id?: string | null) { if (id) created.classes.push(id); }
export function trackTeacher(profileId?: string | null, userId?: string | null, authId?: string | null) {
  if (profileId) created.teacherProfiles.push(profileId);
  if (userId && authId) created.users.push({ id: userId, authId });
}

/** Removes everything this run created (child rows first). Safe to call more than once. */
export async function cleanup(): Promise<void> {
  for (const sid of created.students) {
    await admin.from('student_attendances').delete().eq('student_id', sid);
    await admin.from('students').delete().eq('id', sid);
  }
  for (const cid of created.classes) {
    await admin.from('student_attendances').delete().eq('class_id', cid);
    await admin.from('classes').delete().eq('id', cid);
  }
  for (const pid of created.teacherProfiles) await admin.from('teacher_profiles').delete().eq('id', pid);
  for (const u of created.users) {
    await admin.from('teacher_attendances').delete().eq('teacher_id', u.id);
    await admin.from('teacher_profiles').delete().eq('teacher_id', u.id);
    await admin.from('user_campus_access').delete().eq('user_id', u.id);
    await admin.from('users').delete().eq('id', u.id);
    await admin.auth.admin.deleteUser(u.authId);
  }
  created.students = []; created.classes = []; created.teacherProfiles = []; created.users = [];

  const { count } = await admin.from('users').select('id', { count: 'exact', head: true }).like('id', 'usr-qa-%');
  console.log(`\ncleanup: QA users remaining = ${count ?? 0}`);
}

/** Runs a suite body with guaranteed cleanup and a non-zero exit code on failure. */
export async function runSuite(name: string, body: () => Promise<void>): Promise<void> {
  let crashed = false;
  try {
    await body();
  } catch (err: any) {
    crashed = true;
    console.error(`\n${name} crashed: ${err?.message || err}`);
  } finally {
    await cleanup();
  }
  const failures = report(name);
  process.exit(crashed || failures > 0 ? 1 : 0);
}

export function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
