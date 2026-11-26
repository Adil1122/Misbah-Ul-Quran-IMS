/**
 * Supabase Auth integration for the Misbah-ul-Quran IMS server.
 *
 * - Credentials live only in Supabase Auth (auth.users). public.users holds the
 *   application profile and links to it through users.auth_user_id.
 * - Bearer tokens are Supabase access tokens (signed JWTs) and are verified with
 *   supabase.auth.getUser(), never parsed or trusted from their contents.
 * - Campus access comes from public.user_campus_access.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Value stored in the legacy NOT NULL users.password column; never a real password. */
export const AUTH_MANAGED_PASSWORD = '!supabase-auth-managed';

/** Ban length used to block a deactivated account at the Auth layer (~100 years). */
const DEACTIVATED_BAN = '876000h';

export interface AppAuthUser {
  id: string;
  authUserId: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  campusId: string;
  allowedCampusIds: string[];
  isActive: boolean;
  teacherProfileId?: string;
}

/** Escapes a value for use inside a PostgREST ILIKE pattern so it matches literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** Creates a short-lived anon-key client used only to verify a password via signInWithPassword. */
export function createPasswordVerifier(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function loadCampusIds(admin: SupabaseClient, userId: string, fallback: string | null): Promise<string[]> {
  const { data } = await admin.from('user_campus_access').select('campus_id').eq('user_id', userId);
  const ids = (data || []).map((r: any) => r.campus_id as string);
  if (ids.length > 0) return ids;
  return fallback ? [fallback] : [];
}

function toAppUser(row: any, campusIds: string[], teacherProfileId?: string): AppAuthUser {
  const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email || row.username || row.id;
  const allowed = campusIds.includes('all') ? ['all', ...campusIds.filter((c) => c !== 'all')] : campusIds;
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email || '',
    username: row.username || '',
    fullName,
    role: String(row.role || '').toUpperCase(),
    campusId: row.active_campus_id || (allowed.includes('all') ? 'all' : allowed[0] || 'all'),
    allowedCampusIds: allowed.length > 0 ? allowed : ['all'],
    isActive: row.status === 1 || row.status === true || row.status === 'active',
    teacherProfileId,
  };
}

/** Loads the application user linked to a Supabase Auth user id. */
export async function loadAppUserByAuthId(admin: SupabaseClient, authUserId: string): Promise<AppAuthUser | null> {
  const { data: row, error } = await admin.from('users').select('*').eq('auth_user_id', authUserId).maybeSingle();
  if (error || !row) return null;
  const [campusIds, profile] = await Promise.all([
    loadCampusIds(admin, row.id, row.active_campus_id),
    admin.from('teacher_profiles').select('id').eq('teacher_id', row.id).maybeSingle(),
  ]);
  return toAppUser(row, campusIds, profile.data?.id);
}

/** Verifies a bearer token with Supabase Auth and returns the linked application user. */
export async function verifyAccessToken(admin: SupabaseClient, token: string): Promise<AppAuthUser | null> {
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return loadAppUserByAuthId(admin, data.user.id);
}

/** Finds an application user by email or username (case-insensitive, literal match). */
export async function findUserRowByIdentifier(admin: SupabaseClient, identifier: string): Promise<any | null> {
  const pattern = escapeLike(identifier.trim());
  if (!pattern) return null;
  const byEmail = await admin.from('users').select('*').ilike('email', pattern).limit(1);
  if (byEmail.data && byEmail.data.length > 0) return byEmail.data[0];
  const byUsername = await admin.from('users').select('*').ilike('username', pattern).limit(1);
  if (byUsername.data && byUsername.data.length > 0) return byUsername.data[0];
  return null;
}

/** True if another application user already uses this email or username. */
export async function identifierTaken(admin: SupabaseClient, email: string, username: string, exceptUserId?: string): Promise<boolean> {
  for (const value of [email, username]) {
    if (!value) continue;
    const row = await findUserRowByIdentifier(admin, value);
    if (row && row.id !== exceptUserId) return true;
  }
  return false;
}

/** Creates the Supabase Auth account for an application user. Returns the auth user id. */
export async function createAuthAccount(
  admin: SupabaseClient,
  params: { email: string; password: string; appUserId: string; role: string; isActive?: boolean }
): Promise<string> {
  if (!params.password || params.password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    app_metadata: { app_user_id: params.appUserId, role: params.role },
    ban_duration: params.isActive === false ? DEACTIVATED_BAN : undefined,
  });
  if (error || !data?.user) throw new Error(`Auth account creation failed: ${error?.message || 'unknown error'}`);
  return data.user.id;
}

/** Best-effort removal of an Auth account (used to roll back a failed provisioning). */
export async function deleteAuthAccount(admin: SupabaseClient, authUserId: string | null | undefined): Promise<void> {
  if (!authUserId) return;
  const { error } = await admin.auth.admin.deleteUser(authUserId);
  if (error) console.error('[Auth] Failed to delete auth account during rollback:', error.message);
}

/** Applies email / password / active-status changes to the Auth account. */
export async function updateAuthAccount(
  admin: SupabaseClient,
  authUserId: string,
  changes: { email?: string; password?: string; isActive?: boolean; role?: string; appUserId?: string }
): Promise<void> {
  const attrs: Record<string, any> = {};
  if (changes.email) {
    attrs.email = changes.email;
    attrs.email_confirm = true;
  }
  if (changes.password) {
    if (changes.password.length < 8) throw new Error('Password must be at least 8 characters long.');
    attrs.password = changes.password;
  }
  if (changes.isActive !== undefined) attrs.ban_duration = changes.isActive ? 'none' : DEACTIVATED_BAN;
  if (changes.role || changes.appUserId) {
    attrs.app_metadata = { ...(changes.appUserId ? { app_user_id: changes.appUserId } : {}), ...(changes.role ? { role: changes.role } : {}) };
  }
  if (Object.keys(attrs).length === 0) return;
  const { error } = await admin.auth.admin.updateUserById(authUserId, attrs);
  if (error) throw new Error(`Auth account update failed: ${error.message}`);
}

/** Replaces a user's campus access rows. 'all' grants every campus. */
export async function setCampusAccess(admin: SupabaseClient, userId: string, campusIds: string[]): Promise<void> {
  const unique = Array.from(new Set(campusIds.filter(Boolean)));
  const { error: delErr } = await admin.from('user_campus_access').delete().eq('user_id', userId);
  if (delErr) throw new Error(`Campus access update failed: ${delErr.message}`);
  if (unique.length === 0) return;
  const { error: insErr } = await admin
    .from('user_campus_access')
    .insert(unique.map((campus_id) => ({ user_id: userId, campus_id })));
  if (insErr) throw new Error(`Campus access update failed: ${insErr.message}`);
}

/** Campus list implied by a single campus selection in the admin UI. */
export function campusIdsFor(campusId: string | undefined | null): string[] {
  if (!campusId || campusId === 'all') return ['all', 'uk', 'kts'];
  return [campusId];
}

// -----------------------------------------------------------------------------
// Simple in-memory login rate limiter (per identifier and per IP).
// -----------------------------------------------------------------------------
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; first: number }>();

export function isRateLimited(keys: string[]): boolean {
  const now = Date.now();
  return keys.some((k) => {
    const a = attempts.get(k);
    return Boolean(a && now - a.first < WINDOW_MS && a.count >= MAX_ATTEMPTS);
  });
}

export function recordFailedAttempt(keys: string[]): void {
  const now = Date.now();
  for (const k of keys) {
    const a = attempts.get(k);
    if (!a || now - a.first >= WINDOW_MS) attempts.set(k, { count: 1, first: now });
    else a.count += 1;
  }
}

export function clearAttempts(keys: string[]): void {
  keys.forEach((k) => attempts.delete(k));
}
