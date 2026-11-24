import app from '../server.ts';
import http from 'http';
import { IMSStateService } from '../src/services/imsStateService.ts';

async function runTests() {
  console.log('================================================================');
  console.log('MISBAH-UL-QURAN IMS — TEACHER PROVISIONING & SUPABASE VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string, details: string = '') {
    total++;
    if (cond) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}: ${details}`);
    }
  }

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // TEST 1: Super Admin Token Provisioning
    const timestamp = Date.now();
    const testEmployeeCode = `TCH-TEST-${timestamp.toString().slice(-4)}`;
    const testEmail = `teacher.test.${timestamp}@misbah.org`;

    const createPayload = {
      fullName: 'Qari Muhammad Bilal Test',
      email: testEmail,
      phone: '+44 7700 900555',
      campusId: 'uk',
      employeeCode: testEmployeeCode,
      specialization: 'Qiraat Asharah & Tajweed',
      qualification: 'Ijazah in Hafs an Asim',
      baseMonthlySalary: 2600,
      salaryCurrency: 'GBP',
      initialPassword: 'SecureTeacherPassword2026!',
      assignedClassIds: [],
    };

    const res = await fetch(`${baseUrl}/api/teachers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
      body: JSON.stringify(createPayload),
    });

    const body = await res.json();
    assert(res.status === 200 && body.success === true, 'Teacher Provisioning Request Succeeded with HTTP 200', JSON.stringify(body));
    assert(Boolean(body.teacher && body.user), 'Response contains both teacher profile and user account');
    assert(body.user.email === testEmail, 'User account email matches payload', body.user?.email);
    assert(body.user.role === 'TEACHER', 'User role is correctly set to TEACHER', body.user?.role);
    assert(body.user.campusId === 'uk', 'User is scoped to UK campus', body.user?.campusId);
    assert(body.teacher.employeeCode === testEmployeeCode, 'Teacher employeeCode matches', body.teacher?.employeeCode);
    assert(body.teacher.userId === body.user.id, 'Teacher profile teacher_id correctly links to user.id according to schema', `teacher.userId=${body.teacher?.userId}, user.id=${body.user?.id}`);
    assert(body.teacher.baseMonthlySalary === 2600, 'Teacher base salary correctly stored', String(body.teacher?.baseMonthlySalary));
    assert(body.teacher.salaryCurrency === 'GBP', 'Teacher salary currency is GBP', body.teacher?.salaryCurrency);

    // TEST 2: Duplicate Prevention (Retry with same email / code)
    const duplicateRes = await fetch(`${baseUrl}/api/teachers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
      body: JSON.stringify(createPayload),
    });

    const dupBody = await duplicateRes.json();
    assert(duplicateRes.status === 400, 'Duplicate Teacher Creation is rejected with HTTP 400', `Status: ${duplicateRes.status}`);
    assert(Boolean(dupBody.error && dupBody.error.includes('already exists')), 'Clear error message indicating duplicate account exists', dupBody.error);

    // TEST 3: Campus Isolation Enforcement (KTS Admin cannot provision for UK branch)
    const ktsAdminRes = await fetch(`${baseUrl}/api/teachers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-usr-admin-kts-01-12345',
        'X-Campus-Id': 'kts',
      },
      body: JSON.stringify({
        ...createPayload,
        employeeCode: `TCH-FAIL-${timestamp}`,
        email: `fail.${timestamp}@misbah.org`,
        campusId: 'uk', // Cross-campus attempt!
      }),
    });

    assert(ktsAdminRes.status === 403, 'Cross-Campus teacher creation blocked by Campus Guard (HTTP 403)', `Status: ${ktsAdminRes.status}`);

    // TEST 4: Teacher Update via PUT /api/teachers/:id
    const teacherId = body.teacher.id;
    const updateRes = await fetch(`${baseUrl}/api/teachers/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
      body: JSON.stringify({
        fullName: 'Qari Muhammad Bilal Test (Updated)',
        specialization: 'Advanced Tajweed & Sabaah',
        baseMonthlySalary: 2800,
      }),
    });
    const updateBody = await updateRes.json();
    assert(updateRes.status === 200 && updateBody.success === true, 'Teacher Profile Update via PUT /api/teachers/:id succeeded');

    // TEST 5: Teacher Deletion via DELETE /api/teachers/:id
    const deleteRes = await fetch(`${baseUrl}/api/teachers/${teacherId}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
    });
    const deleteBody = await deleteRes.json();
    assert(deleteRes.status === 200 && deleteBody.success === true, 'Teacher and Linked User Account cleanly removed via DELETE /api/teachers/:id');

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}% Success Rate)`);
    console.log('================================================================');

    if (passed !== total) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
