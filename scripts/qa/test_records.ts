/**
 * Records suite: every collection that used to live only in the browser or the local
 * JSON file is now saved to Supabase. Also covers document files in Storage, medical
 * records, parent accounts, admission approval and campus/role restrictions.
 * Usage: npm run dev   (in another terminal)  then  npm run test:records
 */
import crypto from 'crypto';
import { admin, api, check, createQaUser, randomPassword, requireServer, runSuite, section, trackStudent } from './helpers.ts';

const stamp = Date.now();
const created: { table: string; id: string }[] = [];
const createdFiles: string[] = [];

runSuite('Records suite', async () => {
  await requireServer();
  try {
    const sa = await createQaUser('SUPER_ADMIN', ['all', 'uk', 'kts'], { loginViaServer: true });
    const ukTeacher = await createQaUser('TEACHER', ['uk'], { loginViaServer: true });
    const tok = sa.token!;

    // Fixtures: a UK class and student created through the API.
    let [status, body] = await api('POST', '/api/classes', tok, { name: 'QA RECORDS CLASS', campusId: 'uk', code: `QA-R-${stamp}` });
    const classId: string = body?.classRoom?.id;
    created.push({ table: 'classes', id: classId });
    [status, body] = await api('POST', '/api/students/provision', tok, { firstName: 'QA', lastName: 'RECORDS', campusId: 'uk', classId, gender: 'FEMALE' });
    const studentId: string = body?.student?.id;
    trackStudent(studentId);
    check('fixtures created', !!classId && !!studentId, `(class=${classId}, student=${studentId})`);

    section('Each collection saves to Supabase and comes back in the app state');
    const today = new Date().toISOString().substring(0, 10);
    const samples: Record<string, { table: string; record: any; verify: (row: any) => boolean }> = {
      expenses: {
        table: 'expense_logs',
        record: { id: `qa-exp-${stamp}`, campusId: 'uk', category: 'UTILITIES', title: 'QA electricity', amount: 42.5, currency: 'GBP', date: today, approvedBy: 'QA' },
        verify: (r) => Number(r.amount) === 42.5 && r.category === 'UTILITIES',
      },
      examResults: {
        table: 'exam_results',
        record: { id: `qa-exam-${stamp}`, studentId, classId, academicYear: '2025-2026', subject: 'Tajweed', assessmentName: 'QA Test', marksObtained: 18, maxMarks: 20, grade: 'A', teacherName: 'QA', examDate: today },
        verify: (r) => Number(r.marks_obtained) === 18 && r.campus_id === 'uk',
      },
      academicProgress: {
        table: 'academic_progress',
        record: { id: `qa-prog-${stamp}`, studentId, studentName: 'QA RECORDS', campusId: 'uk', classId, teacherId: '', teacherName: '', date: today, sabaqSurah: 'Al-Mulk', sabaqAyah: '1-10', tajweedScore: 4 },
        verify: (r) => r.sabaq_surah === 'Al-Mulk' && r.tajweed_score === 4,
      },
      announcements: {
        table: 'announcements',
        record: { id: `qa-ann-${stamp}`, campusId: 'uk', title: 'QA notice', content: 'QA content', priority: 'URGENT', targetRole: 'ALL', publishedAt: new Date().toISOString() },
        verify: (r) => r.priority === 'URGENT' && r.campus_id === 'uk',
      },
      events: {
        table: 'event_announcements',
        record: { id: `qa-evt-${stamp}`, campusId: 'uk', type: 'PARENT_MEETING', title: 'QA meeting', classId, dateTime: `${today} 17:00:00`, description: 'QA', remindersSent: { email: true, whatsapp: false } },
        verify: (r) => r.type === 'PARENT_MEETING' && r.reminders_sent?.email === true,
      },
      notifications: {
        table: 'notification_logs',
        record: { id: `qa-notif-${stamp}`, campusId: 'uk', recipientType: 'PARENTS', channel: 'EMAIL', title: 'QA', message: 'QA message', status: 'DELIVERED' },
        verify: (r) => r.recipient_type === 'PARENTS' && r.sent_by === sa.id,
      },
      teachingMaterials: {
        table: 'teaching_materials',
        record: { id: `qa-mat-${stamp}`, title: 'QA syllabus', type: 'SYLLABUS', classId, teacherId: '', teacherName: '', fileSizeMb: 1.5, fileName: 'qa.pdf', description: 'QA' },
        verify: (r) => r.campus_id === 'uk' && Number(r.file_size_mb) === 1.5,
      },
      medicalRecords: {
        table: 'medical_records',
        record: { id: `qa-med-${stamp}`, campusId: 'uk', studentId, condition: 'QA allergy', severity: 'LOW', status: 'SUBMITTED' },
        verify: (r) => r.condition === 'QA allergy' && r.reported_by === sa.id,
      },
    };
    for (const [collection, sample] of Object.entries(samples)) {
      [status, body] = await api('POST', `/api/records/${collection}`, tok, { record: sample.record });
      created.push({ table: sample.table, id: sample.record.id });
      const { data: row } = await admin.from(sample.table).select('*').eq('id', sample.record.id).maybeSingle();
      check(`${collection}: saved to ${sample.table}`, status === 200 && !!row && sample.verify(row), status !== 200 ? `(HTTP ${status} ${body?.error})` : '');
    }
    [status, body] = await api('GET', '/api/database/state', tok);
    for (const [collection, sample] of Object.entries(samples)) {
      const list: any[] = body?.data?.[collection] || [];
      check(`${collection}: returned by the state API`, list.some((r) => r.id === sample.record.id));
    }

    section('Updates and deletes');
    [status] = await api('POST', '/api/records/examResults', tok, { record: { ...samples.examResults.record, marksObtained: 19 } });
    const { data: exam } = await admin.from('exam_results').select('marks_obtained').eq('id', samples.examResults.record.id).single();
    check('update overwrites the stored record', status === 200 && Number(exam?.marks_obtained) === 19);
    [status] = await api('POST', '/api/records/examResults', tok, { record: { ...samples.examResults.record, marksObtained: 25 } });
    check('database rejects marks above the maximum', status === 400, `(HTTP ${status})`);
    [status] = await api('DELETE', `/api/records/examResults/${samples.examResults.record.id}`, tok);
    const { data: gone } = await admin.from('exam_results').select('id').eq('id', samples.examResults.record.id).maybeSingle();
    check('delete removes the record', status === 200 && !gone);

    section('Role and campus rules');
    [status] = await api('POST', '/api/records/expenses', ukTeacher.token, { record: { ...samples.expenses.record, id: `qa-exp-t-${stamp}` } });
    check('teacher cannot record expenses', status === 403, `(HTTP ${status})`);
    [status] = await api('POST', '/api/records/announcements', ukTeacher.token, { record: { ...samples.announcements.record, id: `qa-ann-t-${stamp}` } });
    check('teacher cannot publish announcements', status === 403, `(HTTP ${status})`);
    [status] = await api('POST', '/api/records/notifications', ukTeacher.token, { record: { ...samples.notifications.record, id: `qa-n-kts-${stamp}`, campusId: 'kts' } });
    check('UK teacher cannot write KTS records', status === 403, `(HTTP ${status})`);
    [status] = await api('POST', '/api/records/academicProgress', ukTeacher.token, { record: { ...samples.academicProgress.record, id: `qa-prog-t-${stamp}` } });
    created.push({ table: 'academic_progress', id: `qa-prog-t-${stamp}` });
    check('UK teacher can record Quran progress for a UK student', status === 200, `(HTTP ${status})`);
    [status] = await api('POST', '/api/records/nonsense', tok, { record: { id: 'x' } });
    check('unknown collection is rejected', status === 404);

    section('Medical records and incidents');
    [status, body] = await api('POST', '/api/medicals', tok, { campusId: 'uk', studentId, condition: 'QA asthma', severity: 'MEDIUM' });
    const medId = body?.medicalRecord?.id;
    if (medId) created.push({ table: 'medical_records', id: medId });
    const { data: med } = await admin.from('medical_records').select('condition').eq('id', medId ?? '').maybeSingle();
    check('POST /api/medicals saves to medical_records', status === 200 && med?.condition === 'QA asthma', `(HTTP ${status} ${body?.error || ''})`);
    [status, body] = await api('GET', '/api/medicals?campusId=uk', tok);
    check('GET /api/medicals reads Supabase', status === 200 && (body?.data || []).some((m: any) => m.id === medId));
    [status, body] = await api('GET', '/api/incidents', tok);
    check('GET /api/incidents reads Supabase', status === 200 && Array.isArray(body?.data));

    section('Document files in Supabase Storage');
    const pdfBytes = Buffer.from(`%PDF-1.4\n% QA test file ${crypto.randomBytes(8).toString('hex')}\n%%EOF\n`);
    [status, body] = await api('POST', '/api/documents/upload', tok, {
      entityType: 'STUDENT', entityId: studentId, campusId: 'uk', name: 'qa-test.pdf', category: 'OTHER',
      mimeType: 'application/pdf', fileBase64: pdfBytes.toString('base64'),
    });
    const docId: string | undefined = body?.document?.id;
    const { data: docRow } = await admin.from('documents').select('*').eq('id', docId ?? '').maybeSingle();
    if (docRow?.file_name) createdFiles.push(docRow.file_name);
    if (docId) created.push({ table: 'documents', id: docId });
    check('upload stores the file in the private bucket', status === 200 && docRow?.storage_bucket === 'misbah-documents' && docRow?.size_bytes === pdfBytes.length, `(HTTP ${status} ${body?.error || ''})`);
    const dl = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/documents/${docId}/download`, { headers: { Authorization: `Bearer ${tok}` } });
    const dlBytes = Buffer.from(await dl.arrayBuffer());
    check('download returns the exact file', dl.status === 200 && dlBytes.equals(pdfBytes));
    const ktsTeacher = await createQaUser('TEACHER', ['kts'], { loginViaServer: true });
    const denied = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/documents/${docId}/download`, { headers: { Authorization: `Bearer ${ktsTeacher.token}` } });
    check('KTS teacher cannot download a UK document', denied.status === 403, `(HTTP ${denied.status})`);
    const { data: publicUrl } = admin.storage.from('misbah-documents').getPublicUrl(docRow?.file_name || 'x');
    const pub = await fetch(publicUrl.publicUrl);
    check('file is not publicly reachable', pub.status >= 400, `(HTTP ${pub.status})`);
    [status] = await api('DELETE', `/api/documents/${docId}`, tok);
    const { data: stillThere } = await admin.storage.from('misbah-documents').list(docRow?.file_name?.split('/').slice(0, -1).join('/') || '');
    check('delete removes metadata and file', status === 200 && !(stillThere || []).some((f) => docRow?.file_name?.endsWith(f.name)));

    section('Parents, admissions and portal access');
    const parentPassword = randomPassword();
    const parentEmail = `qa-parent-${stamp}@qa.invalid`;
    [status, body] = await api('POST', '/api/users', tok, { email: parentEmail, username: `qa-parent-${stamp}`, fullName: 'QA Parent', role: 'PARENT', campusId: 'uk', password: parentPassword });
    const parentUserId: string | undefined = body?.user?.id;
    const { data: parentProfile } = await admin.from('parent_profiles').select('*').eq('user_id', parentUserId ?? '').maybeSingle();
    check('creating a PARENT account creates its parent profile', status === 200 && !!parentProfile, `(HTTP ${status} ${body?.error || ''})`);
    await admin.from('students').update({ parent_id: parentUserId }).eq('id', studentId);
    [status, body] = await api('POST', '/api/auth/login', null, { identifier: parentEmail, password: parentPassword });
    check('parent can log in and gets their profile id', status === 200 && body?.user?.parentProfileId === parentProfile?.id);
    [status, body] = await api('GET', '/api/database/state', body?.session?.access_token);
    check('parent sees only their child', status === 200 && (body?.data?.students || []).length === 1 && body.data.students[0].id === studentId);
    check('parent profile lists the child', (body?.data?.parents?.[0]?.linkedStudentIds || []).includes(studentId));

    await admin.from('students').update({ approval_status: 'PENDING_APPROVAL' }).eq('id', studentId);
    [status, body] = await api('GET', '/api/database/state', tok);
    check('pending student appears in pending admissions', (body?.data?.pendingAdmissions || []).some((a: any) => a.studentId === studentId));
    [status] = await api('PUT', `/api/students/${studentId}`, tok, { approvalStatus: 'APPROVED', portalAccessActive: false });
    const { data: approved } = await admin.from('students').select('approval_status, portal_access_active').eq('id', studentId).single();
    check('approval and portal flag are saved', status === 200 && approved?.approval_status === 'APPROVED' && approved?.portal_access_active === false);

    if (parentUserId) {
      await admin.from('students').update({ parent_id: null }).eq('id', studentId);
      const { data: pu } = await admin.from('users').select('auth_user_id').eq('id', parentUserId).maybeSingle();
      await api('DELETE', `/api/users/${parentUserId}`, tok);
      const { data: puAfter } = await admin.from('users').select('id').eq('id', parentUserId).maybeSingle();
      check('parent account removed (profile cascades)', !puAfter);
      if (pu?.auth_user_id) await admin.auth.admin.deleteUser(pu.auth_user_id).catch(() => undefined);
    }
  } finally {
    if (createdFiles.length) await admin.storage.from('misbah-documents').remove(createdFiles);
    for (const { table, id } of created.reverse()) {
      if (!id) continue;
      if (table === 'classes') continue; // removed by the shared cleanup after the student
      await admin.from(table).delete().eq('id', id);
    }
    for (const { table, id } of created) if (table === 'classes' && id) {
      await admin.from('students').delete().eq('class_id', id).like('first_name', 'QA%');
      await admin.from('classes').delete().eq('id', id);
    }
    await admin.from('medical_records').delete().like('condition', 'QA%');
  }
});
