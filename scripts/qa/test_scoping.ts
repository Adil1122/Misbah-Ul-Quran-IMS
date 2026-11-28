/**
 * Scoping suite: what each role receives from /api/database/state, admin-only endpoints,
 * database-verified campus checks, and Supabase as the single source of truth.
 * Usage: npm run dev   (in another terminal)  then  npm run test:scoping
 */
import fs from 'fs';
import { admin, api, check, createQaUser, requireServer, runSuite, section } from './helpers.ts';

runSuite('Scoping suite', async () => {
  await requireServer();
  const { data: ktsStudent } = await admin.from('students').select('id, first_name').eq('campus_id', 'kts').neq('status', 'archived').limit(1).maybeSingle();
  const { data: ktsClass } = await admin.from('classes').select('id').eq('campus_id', 'kts').eq('is_active', true).limit(1).maybeSingle();
  if (!ktsStudent || !ktsClass) throw new Error('Needs at least one active KTS student and class in the database.');

  section('Super admin: data comes only from Supabase');
  const sa = await createQaUser('SUPER_ADMIN', ['all', 'uk', 'kts'], { loginViaServer: true });
  const { count: invoices } = await admin.from('payment_invoices').select('id', { count: 'exact', head: true });
  const { count: activeStudents } = await admin.from('students').select('id', { count: 'exact', head: true }).neq('status', 'archived');
  let [status, body] = await api('GET', '/api/database/state', sa.token);
  check('state loads', status === 200, `(HTTP ${status})`);
  check('invoices match Supabase (no stale local copies)', (body?.data?.payments || []).length === invoices);
  check('students match Supabase (archived excluded)', (body?.data?.students || []).length === activeStudents);
  check('audit log is loaded', (body?.data?.auditLogs || []).length > 0);
  check('no password field on any user', (body?.data?.users || []).every((u: any) => !('password' in u)));

  section('UK teacher');
  const teacher = await createQaUser('TEACHER', ['uk'], { loginViaServer: true });
  [status, body] = await api('GET', '/api/database/state', teacher.token);
  check('no KTS students in state', status === 200 && (body.data.students || []).every((s: any) => s.campusId !== 'kts'));
  check('no audit log or invoices in state', (body.data.auditLogs || []).length === 0 && (body.data.payments || []).length === 0);
  [status] = await api('PUT', `/api/students/${ktsStudent.id}`, teacher.token, { firstName: 'QA-HACK' });
  check('cannot edit students', status === 403, `(HTTP ${status})`);
  [status] = await api('DELETE', `/api/classes/${ktsClass.id}`, teacher.token);
  check('cannot delete classes', status === 403, `(HTTP ${status})`);
  [status] = await api('PUT', '/api/payments/qa-none/status', teacher.token, { status: 'PAID' });
  check('cannot change payment status', status === 403, `(HTTP ${status})`);

  section('UK campus admin');
  const ukAdmin = await createQaUser('CAMPUS_ADMIN', ['uk'], { loginViaServer: true });
  [status] = await api('PUT', `/api/students/${ktsStudent.id}`, ukAdmin.token, { firstName: 'QA-HACK' });
  check('cannot edit a KTS student', status === 403, `(HTTP ${status})`);
  [status] = await api('PUT', `/api/classes/${ktsClass.id}`, ukAdmin.token, { room: 'QA-HACK' });
  check('cannot edit a KTS class', status === 403, `(HTTP ${status})`);
  [status] = await api('PUT', '/api/students/qa-does-not-exist', ukAdmin.token, { firstName: 'x' });
  check('unknown record is a 404', status === 404, `(HTTP ${status})`);
  const { data: after } = await admin.from('students').select('first_name').eq('id', ktsStudent.id).single();
  check('KTS student unchanged', after?.first_name === ktsStudent.first_name);

  section('No local storage');
  const [syncStatus] = await api('POST', '/api/database/sync', sa.token, { data: { payments: [{ id: 'qa-phantom', campusId: 'uk' }] } });
  check('bulk browser sync is refused', syncStatus === 410, `(HTTP ${syncStatus})`);
  check('no local JSON data file exists', !fs.existsSync('data/ims_database.json'));
});
