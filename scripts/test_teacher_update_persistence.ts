import app from '../server.ts';
import http from 'http';

async function runTests() {
  console.log('================================================================');
  console.log('MISBAH-UL-QURAN IMS — TEACHER UPDATE PERSISTENCE & ZERO-ROW AUDIT');
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

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Audit server running at ${baseUrl}\n`);

  try {
    // --------------------------------------------------------------------------
    // 1. VERIFY CONFIGURED HOST DIAGNOSTICS (No Credentials Exposed)
    // --------------------------------------------------------------------------
    console.log('--- 1. Testing Safe Supabase Host Diagnostics ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health check returns HTTP 200');
    assert(typeof healthData.database?.supabaseProjectHost === 'string', 'Database report includes supabaseProjectHost string', healthData.database?.supabaseProjectHost);
    assert(!JSON.stringify(healthData).includes('service_role') && !JSON.stringify(healthData).includes('eyJ'), 'Health check never exposes JWT tokens or secrets');

    const diagRes = await fetch(`${baseUrl}/api/database/diagnostics`);
    const diagData = await diagRes.json();
    assert(diagRes.status === 200, 'Diagnostics endpoint returns HTTP 200');
    assert(typeof diagData.configuredSupabaseHost === 'string', 'Diagnostics returns safe configuredSupabaseHost', diagData.configuredSupabaseHost);
    assert(typeof diagData.serviceRoleConfigured === 'boolean', 'Diagnostics reports boolean for serviceRoleConfigured without revealing secret');

    // --------------------------------------------------------------------------
    // 2. CONFIRM ZERO AFFECTED ROWS CANNOT PRODUCE SUCCESS (The Root Bug!)
    // --------------------------------------------------------------------------
    console.log('\n--- 2. Testing Non-Existent Target: PUT /api/teachers/tch-1793220021931-653 ---');
    const testPayload = {
      fullName: 'Persistence Test 2910',
      employeeCode: 'TCH-KTS-282',
      campusId: 'uk',
      email: 'teacher@gmail.com',
      employmentStatus: 'FULL_TIME',
      portalAccessActive: true,
      baseMonthlySalary: 85000,
      salaryCurrency: 'GBP',
    };

    // When targeting non-existent teacher tch-1793220021931-653:
    const zeroRowRes = await fetch(`${baseUrl}/api/teachers/tch-1793220021931-653`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
      body: JSON.stringify(testPayload),
    });

    const zeroRowBody = await zeroRowRes.json();
    assert(zeroRowRes.status === 404, 'Zero affected rows correctly rejects with HTTP 404 (not false HTTP 200)', `Status: ${zeroRowRes.status}`);
    assert(zeroRowBody.success === false, 'zeroRowBody.success is false');
    assert(zeroRowBody.code === 'ZERO_ROWS_AFFECTED' || zeroRowBody.code === 'TEACHER_NOT_FOUND', 'Correct error code returned', zeroRowBody.code);
    assert(zeroRowBody.diagnostic !== undefined, 'Diagnostic payload is provided in response');
    assert(zeroRowBody.diagnostic?.affectedRowCount === 0, 'Diagnostic confirms affectedRowCount is 0');

    // --------------------------------------------------------------------------
    // 3. PROVISION TEACHER AND EXECUTE PERSISTENCE UPDATE WITH EXACT TEST PAYLOAD
    // --------------------------------------------------------------------------
    console.log('\n--- 3. Provisioning Teacher & Updating with Test Payload ---');
    const provisionRes = await fetch(`${baseUrl}/api/teachers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
      body: JSON.stringify({
        fullName: 'Initial Teacher Name',
        email: 'teacher.initial@gmail.com',
        phone: '+44 7700 900888',
        campusId: 'uk',
        employeeCode: 'TCH-UK-INITIAL',
        specialization: 'Quran & Tajweed',
        qualification: 'Hafiz',
        baseMonthlySalary: 2400,
        salaryCurrency: 'GBP',
        initialPassword: 'TempPassword123!',
        assignedClassIds: [],
      }),
    });

    const provBody = await provisionRes.json();
    assert(provisionRes.status === 200 && provBody.success === true, 'Teacher provisioning succeeded');
    const provisionedTeacherId = provBody.teacher.id;
    const provisionedUserId = provBody.user.id;

    console.log(`Provisioned teacher ID: ${provisionedTeacherId}, User ID: ${provisionedUserId}`);

    // Now execute PUT with user's exact test payload!
    const updateRes = await fetch(`${baseUrl}/api/teachers/${provisionedTeacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
      body: JSON.stringify(testPayload),
    });

    const updateBody = await updateRes.json();
    assert(updateRes.status === 200 && updateBody.success === true, 'Targeted update succeeded with HTTP 200 only after verified persistence');
    assert(Boolean(updateBody.diagnostic), 'Response includes safe diagnostic object');
    assert(updateBody.diagnostic.matchedTeacherProfileId === provisionedTeacherId, 'Matched teacher profile ID matches', updateBody.diagnostic.matchedTeacherProfileId);
    assert(updateBody.diagnostic.linkedUserId === provisionedUserId, 'Linked users.id matches correctly', updateBody.diagnostic.linkedUserId);
    assert(Boolean(updateBody.diagnostic.tableUpdated), 'Diagnostic reports tables updated', updateBody.diagnostic.tableUpdated);
    assert(updateBody.diagnostic.affectedRowCount.total >= 2, 'Affected rows count confirmed (> 0 rows for both teacher and user)', JSON.stringify(updateBody.diagnostic.affectedRowCount));

    // --------------------------------------------------------------------------
    // 4. VERIFY SAVED TEACHER PROFILE & USER ACCOUNT DIRECTLY
    // --------------------------------------------------------------------------
    console.log('\n--- 4. Direct Persistence Verification ---');
    const verified = updateBody.diagnostic.verified;
    assert(Boolean(verified && verified.teacherProfile && verified.user), 'Direct verified records returned');
    assert(verified.teacherProfile.salary === 85000, 'Verified teacher salary is 85000', String(verified.teacherProfile.salary));
    assert(verified.teacherProfile.salaryCurrency === 'GBP', 'Verified salary currency is GBP', verified.teacherProfile.salaryCurrency);
    assert(verified.teacherProfile.employeeCode === 'TCH-KTS-282', 'Verified employee code is TCH-KTS-282', verified.teacherProfile.employeeCode);
    assert(verified.teacherProfile.campusId === 'uk', 'Verified campus ID is uk', verified.teacherProfile.campusId);
    assert(verified.user.email === 'teacher@gmail.com', 'Verified linked user email is teacher@gmail.com', verified.user.email);
    assert(verified.user.fullName === 'Persistence Test 2910', 'Verified user full name is Persistence Test 2910', verified.user.fullName);
    assert(verified.user.campusId === 'uk', 'Verified user campusId is uk', verified.user.campusId);

    // --------------------------------------------------------------------------
    // 5. VERIFY STATE RETRIEVAL AFTER REFRESH (GET /api/database/state)
    // --------------------------------------------------------------------------
    console.log('\n--- 5. Verifying State Retrieval After Refresh ---');
    const stateRes = await fetch(`${baseUrl}/api/database/state`, {
      headers: {
        Authorization: 'Bearer adm-token',
      },
    });
    const stateData = await stateRes.json();
    assert(stateRes.status === 200 && stateData.success === true, 'State retrieval returns HTTP 200');

    const freshTeacher = (stateData.data?.teachers || []).find((t: any) => t.id === provisionedTeacherId);
    const freshUser = (stateData.data?.users || []).find((u: any) => u.id === provisionedUserId);

    assert(Boolean(freshTeacher), 'Fresh state contains updated teacher profile');
    assert(freshTeacher?.baseMonthlySalary === 85000, 'Fresh teacher salary matches 85000', String(freshTeacher?.baseMonthlySalary));
    assert(freshTeacher?.salaryCurrency === 'GBP', 'Fresh salary currency matches GBP', freshTeacher?.salaryCurrency);
    assert(freshTeacher?.employeeCode === 'TCH-KTS-282', 'Fresh employee code matches TCH-KTS-282', freshTeacher?.employeeCode);
    assert(freshTeacher?.fullName === 'Persistence Test 2910', 'Fresh full name matches', freshTeacher?.fullName);
    assert(Boolean(freshUser), 'Fresh state contains linked user account');
    assert(freshUser?.email === 'teacher@gmail.com', 'Fresh user email matches', freshUser?.email);
    assert(freshUser?.campusId === 'uk', 'Fresh user campus matches uk', freshUser?.campusId);

    // --------------------------------------------------------------------------
    // 6. CLEAN UP TEST RECORD
    // --------------------------------------------------------------------------
    console.log('\n--- 6. Cleaning Up Test Record via DELETE ---');
    const delRes = await fetch(`${baseUrl}/api/teachers/${provisionedTeacherId}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
    });
    const delBody = await delRes.json();
    assert(delRes.status === 200 && delBody.success === true, 'Delete teacher succeeded with HTTP 200');

    // Deleting non-existent teacher must reject with 404 (zero rows affected)
    const delNonExistent = await fetch(`${baseUrl}/api/teachers/${provisionedTeacherId}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer adm-token',
        'X-Campus-Id': 'uk',
      },
    });
    assert(delNonExistent.status === 404, 'Deleting already-deleted teacher rejects with HTTP 404 (zero rows affected)');

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
