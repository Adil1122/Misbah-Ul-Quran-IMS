/**
 * Workflow suite: the day-to-day operations through the real API, as a temporary super admin.
 * Covers new columns, attendance, soft delete, teacher deactivation and the renamed tables.
 * Usage: npm run dev   (in another terminal)  then  npm run test:workflows
 */
import { admin, api, check, createQaUser, randomPassword, requireServer, runSuite, section, trackClass, trackStudent, trackTeacher } from './helpers.ts';

runSuite('Workflow suite', async () => {
  await requireServer();
  const sa = await createQaUser('SUPER_ADMIN', ['all', 'uk', 'kts'], { loginViaServer: true });
  const tok = sa.token!;

  section('Classes');
  let [status, body] = await api('POST', '/api/classes', tok, {
    name: 'QA TEST CLASS', campusId: 'uk', code: `QA-${Date.now()}`, gradeLevel: 'Hifz Level 2', room: 'Room 7',
    scheduleTime: '4:00 PM - 6:00 PM', maxCapacity: 12,
  });
  const classId: string | undefined = body?.classRoom?.id;
  trackClass(classId);
  check('create class', status === 200 && !!classId, `(HTTP ${status} ${body?.error || ''})`);
  let { data: cls } = await admin.from('classes').select('grade_level, room, schedule_time, capacity').eq('id', classId!).single();
  check('class fields stored', cls?.grade_level === 'Hifz Level 2' && cls?.room === 'Room 7' && cls?.capacity === 12, JSON.stringify(cls));
  [status] = await api('PUT', `/api/classes/${classId}`, tok, { room: 'Room 9', gradeLevel: 'Hifz Level 3' });
  ({ data: cls } = await admin.from('classes').select('grade_level, room').eq('id', classId!).single());
  check('class update stored', status === 200 && cls?.room === 'Room 9' && cls?.grade_level === 'Hifz Level 3');

  section('Students');
  [status, body] = await api('POST', '/api/students/provision', tok, {
    firstName: 'QA', lastName: 'STUDENT', campusId: 'uk', classId, gender: 'MALE', bloodGroup: 'O+',
    medicalNotes: 'Asthma', quranMilestone: 'Juz 3', primaryParentName: 'QA Parent', primaryParentPhone: '000',
  });
  const studentId: string | undefined = body?.student?.id;
  trackStudent(studentId);
  check('create student', status === 200 && !!studentId, `(HTTP ${status} ${body?.error || ''})`);
  let { data: st } = await admin.from('students').select('*').eq('id', studentId!).single();
  check('student fields stored', st?.blood_group === 'O+' && st?.medical_notes === 'Asthma' && st?.quran_milestone === 'Juz 3' && st?.primary_contact_details?.phone === '000');
  [status] = await api('PUT', `/api/students/${studentId}`, tok, { bloodGroup: 'A-', quranMilestone: 'Juz 5', primaryParentPhone: '111', enrollmentDate: '2026-09-01' });
  ({ data: st } = await admin.from('students').select('*').eq('id', studentId!).single());
  check('student update stored (incl. parent phone, enrollment date)',
    status === 200 && st?.blood_group === 'A-' && st?.quran_milestone === 'Juz 5' && st?.primary_contact_details?.phone === '111' &&
    st?.primary_contact_details?.name === 'QA Parent' && st?.admission_date === '2026-09-01');
  const { error: badGender } = await admin.from('students').update({ gender: 'robot' }).eq('id', studentId!);
  check('database rejects invalid gender', badGender?.code === '23514');

  section('Attendance');
  [status, body] = await api('POST', '/api/attendance/student/bulk', tok, {
    campusId: 'uk', classId, date: '2026-11-25', records: [{ studentId, status: 'PRESENT' }],
  });
  const { count: attCount } = await admin.from('student_attendances').select('id', { count: 'exact', head: true }).eq('student_id', studentId!);
  check('student attendance saved to database', status === 200 && attCount === 1, `(HTTP ${status} ${body?.error || ''})`);

  const teacherPassword = randomPassword();
  [status, body] = await api('POST', '/api/teachers/provision', tok, {
    fullName: 'QA Teacher', email: `qa-teacher-${Date.now()}@qa.invalid`, campusId: 'uk', initialPassword: teacherPassword,
  });
  const teacherUserId: string | undefined = body?.user?.id;
  const teacherProfileId: string | undefined = body?.teacher?.id;
  const { data: tUser } = await admin.from('users').select('auth_user_id, email').eq('id', teacherUserId ?? '').maybeSingle();
  trackTeacher(teacherProfileId, teacherUserId, tUser?.auth_user_id);
  check('provision teacher with a login account', status === 200 && !!tUser?.auth_user_id, `(HTTP ${status} ${body?.error || ''})`);
  const { data: access } = await admin.from('user_campus_access').select('campus_id').eq('user_id', teacherUserId ?? '');
  check('teacher limited to their campus', JSON.stringify((access || []).map((a) => a.campus_id)) === '["uk"]');
  [status] = await api('POST', '/api/auth/login', null, { identifier: tUser?.email, password: teacherPassword });
  check('new teacher can log in', status === 200);

  [status, body] = await api('POST', '/api/attendance/teacher', tok, { campusId: 'uk', teacherId: teacherProfileId, date: '2026-11-25', status: 'PRESENT', checkInTime: '09:00:00' });
  const { count: tAtt } = await admin.from('teacher_attendances').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherUserId ?? '');
  check('teacher attendance saved (profile id mapped to user id)', status === 200 && tAtt === 1, `(HTTP ${status} ${body?.error || ''})`);

  section('Deletes keep history');
  [status] = await api('DELETE', `/api/teachers/${teacherProfileId}`, tok);
  const { data: tAfter } = await admin.from('users').select('status').eq('id', teacherUserId ?? '').maybeSingle();
  check('teacher with history is deactivated, not deleted', status === 200 && tAfter?.status === 0);
  [status] = await api('POST', '/api/auth/login', null, { identifier: tUser?.email, password: teacherPassword });
  check('deactivated teacher cannot log in', status === 403, `(HTTP ${status})`);

  [status] = await api('DELETE', `/api/students/${studentId}`, tok);
  ({ data: st } = await admin.from('students').select('status, archived_at').eq('id', studentId!).single());
  check('student delete archives the record', status === 200 && st?.status === 'archived' && !!st?.archived_at);
  const { count: keptAtt } = await admin.from('student_attendances').select('id', { count: 'exact', head: true }).eq('student_id', studentId!);
  check('archived student keeps attendance history', keptAtt === 1);
  const { data: auditRows } = await admin.from('audit_logs').select('id').eq('action', 'STUDENT_ARCHIVED').contains('details', { entity_id: studentId });
  check('archive recorded in audit log', (auditRows || []).length === 1);
  const { error: fkErr } = await admin.from('students').delete().eq('id', studentId!);
  check('database refuses to hard-delete a student with history', fkErr?.code === '23503');

  section('Renamed tables');
  [status] = await api('GET', '/api/documents', tok);
  check('documents endpoint works', status === 200, `(HTTP ${status})`);
  const { error: medErr } = await admin.from('medical_records').select('id').limit(1);
  check('medical_records table exists', !medErr);
});
