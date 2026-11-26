/**
 * Security suite: anon-key exposure, login/token handling, and Row Level Security per role and campus.
 * Usage: npm run dev   (in another terminal)  then  npm run test:security
 */
import { admin, anonClient, api, check, createQaUser, requireServer, runSuite, section } from './helpers.ts';

const PRIVATE_TABLES = [
  'users', 'user_campus_access', 'students', 'teacher_profiles', 'classes', 'payment_invoices',
  'teacher_attendances', 'student_attendances', 'audit_logs', 'incident_logs', 'documents', 'medical_records',
];
const PUBLIC_TABLES = ['campuses', 'news', 'slider_images', 'prayer_timings'];

async function rowCount(client: ReturnType<typeof anonClient>, table: string, filter?: (q: any) => any): Promise<number | string> {
  let q: any = client.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? `denied` : (count ?? 0);
}

runSuite('Security suite', async () => {
  await requireServer();

  section('Public (anon) key');
  const anon = anonClient();
  for (const t of PRIVATE_TABLES) {
    const n = await rowCount(anon, t);
    check(`anon cannot read ${t}`, n === 0 || n === 'denied', `(${n})`);
  }
  for (const t of PUBLIC_TABLES) {
    const n = await rowCount(anon, t);
    check(`anon can read public ${t}`, typeof n === 'number' && n > 0, `(${n})`);
  }
  let r: any = await anon.from('students').insert([{ id: 'qa-anon-probe', campus_id: 'uk', first_name: 'x', last_name: 'y' }]);
  check('anon cannot insert', !!r.error);
  r = await anon.from('campuses').update({ name: 'QA' }).eq('id', 'uk').select();
  check('anon cannot update', !!r.error || (r.data || []).length === 0);
  r = await anon.from('students').delete().neq('id', '__none__').select();
  check('anon cannot delete', !!r.error || (r.data || []).length === 0);
  await admin.from('students').delete().eq('id', 'qa-anon-probe');

  section('Login and tokens');
  for (const forged of ['adm-token', 'jwt-superadmin-master', 'jwt-usr-super-01-1', 'usr-super-01', 'admin@misbah.org']) {
    const [status] = await api('POST', '/api/classes', forged, { name: 'QA forged', campusId: 'uk' });
    check(`forged token rejected: ${forged}`, status === 401, `(HTTP ${status})`);
  }
  let [status, body] = await api('POST', '/api/auth/login', null, { identifier: 'admin@misbah.org', password: 'definitely-not-the-password' });
  check('wrong password rejected', status === 401, `(HTTP ${status})`);
  const genericMessage = body?.error;
  [status, body] = await api('POST', '/api/auth/login', null, { identifier: 'nobody@qa.invalid', password: 'irrelevant-123' });
  check('unknown account gets the same message', status === 401 && body?.error === genericMessage);
  [status] = await api('POST', '/api/auth/login', null, { identifier: '%', password: 'irrelevant-123' });
  check('wildcard identifier matches nobody', status === 401);

  const teacher = await createQaUser('TEACHER', ['uk'], { loginViaServer: true });
  check('login by username returns a signed JWT', (teacher.token || '').split('.').length === 3);
  [status] = await api('POST', '/api/auth/login', null, { identifier: teacher.email.toUpperCase(), password: teacher.password });
  check('login by email is case-insensitive', status === 200);
  const newPassword = teacher.password + 'X9';
  [status] = await api('POST', '/api/auth/change-password', teacher.token, { currentPassword: 'wrong', newPassword });
  check('change-password rejects wrong current password', status === 400);
  [status] = await api('POST', '/api/auth/change-password', teacher.token, { currentPassword: teacher.password, newPassword });
  check('change-password works', status === 200);
  [status] = await api('POST', '/api/auth/login', null, { identifier: teacher.id, password: newPassword });
  check('new password works', status === 200);

  section('Row Level Security: UK teacher');
  const ukStudents = await rowCount(admin as any, 'students', (q) => q.eq('campus_id', 'uk'));
  const ktsStudents = await rowCount(admin as any, 'students', (q) => q.eq('campus_id', 'kts'));
  const T = teacher.client;
  check('sees UK students', (await rowCount(T, 'students', (q) => q.eq('campus_id', 'uk'))) === ukStudents);
  check('sees no KTS students', (await rowCount(T, 'students', (q) => q.eq('campus_id', 'kts'))) === 0);
  check('sees no KTS classes', (await rowCount(T, 'classes', (q) => q.eq('campus_id', 'kts'))) === 0);
  check('cannot read audit log', (await rowCount(T, 'audit_logs')) === 0);
  check('cannot read invoices', (await rowCount(T, 'payment_invoices')) === 0);
  r = await T.from('students').insert([{ id: 'qa-t-probe', campus_id: 'uk', first_name: 'x', last_name: 'y' }]);
  check('cannot create students', !!r.error);
  r = await T.from('users').update({ role: 'SUPER_ADMIN' }).eq('id', teacher.id).select();
  check('cannot promote self', !!r.error || (r.data || []).length === 0);
  r = await T.from('audit_logs').insert([{ action: 'QA_PROBE', user_id: teacher.id, campus_id: 'uk', details: { qa: true } }]);
  check('can append own audit entry', !r.error, r.error?.message || '');
  r = await T.from('audit_logs').insert([{ action: 'QA_FORGE', user_id: 'usr-super-01', campus_id: 'uk' }]);
  check('cannot write audit entry as someone else', !!r.error);

  section('Row Level Security: KTS teacher and UK campus admin');
  const kts = await createQaUser('TEACHER', ['kts']);
  check('KTS teacher sees KTS students', (await rowCount(kts.client, 'students', (q) => q.eq('campus_id', 'kts'))) === ktsStudents);
  check('KTS teacher sees no UK students', (await rowCount(kts.client, 'students', (q) => q.eq('campus_id', 'uk'))) === 0);
  const ukAdmin = await createQaUser('CAMPUS_ADMIN', ['uk']);
  check('UK admin sees no KTS students', (await rowCount(ukAdmin.client, 'students', (q) => q.eq('campus_id', 'kts'))) === 0);
  r = await ukAdmin.client.from('students').insert([{ id: 'qa-a-kts', campus_id: 'kts', first_name: 'x', last_name: 'y' }]);
  check('UK admin cannot create a KTS student', !!r.error);
  check('UK admin can read UK audit log', Number(await rowCount(ukAdmin.client, 'audit_logs', (q) => q.eq('campus_id', 'uk'))) > 0);
  r = await ukAdmin.client.from('audit_logs').delete().eq('action', 'QA_PROBE').select();
  check('audit entries cannot be deleted', !!r.error || (r.data || []).length === 0);

  section('Suspension');
  await admin.auth.admin.updateUserById((await admin.from('users').select('auth_user_id').eq('id', teacher.id).single()).data!.auth_user_id, { ban_duration: '876000h' });
  [status] = await api('POST', '/api/auth/login', null, { identifier: teacher.id, password: newPassword });
  check('suspended account cannot log in', status === 403, `(HTTP ${status})`);

  await admin.from('audit_logs').delete().eq('action', 'QA_PROBE');
  await admin.from('students').delete().in('id', ['qa-t-probe', 'qa-a-kts']);
});
