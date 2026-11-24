/**
 * Misbah-ul-Quran IMS — Auth Guard & Teacher Provisioning Regression Test Suite
 * 
 * Validates:
 * 1. Missing-token rejection on /sync and /api/database/sync (HTTP 401 AUTH_TOKEN_REQUIRED)
 * 2. Invalid/expired token rejection (HTTP 401 INVALID_CREDENTIALS)
 * 3. Valid authenticated request acceptance (HTTP 200 success: true)
 * 4. Teacher provisioning with proper foreign key linkage (teacher_profiles.teacher_id === users.id)
 * 5. Supabase / database persistence verification
 * 6. Teacher retrieval after simulated state refresh (GET /api/database/state)
 * 7. Client-side IMSStateService authentication guard enforcement
 */

import http from 'http';
import app from '../server.ts';
import { IMSStateService } from '../src/services/imsStateService.ts';

async function runRegressionTestSuite() {
  console.log('========================================================================');
  console.log('MISBAH-UL-QURAN IMS: AUTH & TEACHER PROVISIONING REGRESSION TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
      failed++;
    }
  }

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  const timestamp = Date.now();
  const validSuperToken = 'Bearer jwt-superadmin-master';

  try {
    // ------------------------------------------------------------------------
    // REGRESSION TEST 1: Missing-Token Rejection on Sync Endpoints
    // ------------------------------------------------------------------------
    console.log('--- 1. Missing-Token Rejection (HTTP 401 AUTH_TOKEN_REQUIRED) ---');

    // 1a. POST /api/database/sync without Authorization
    const syncResNoAuth = await fetch(`${baseUrl}/api/database/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { campuses: [] } }),
    });
    const syncNoAuthBody = await syncResNoAuth.json();

    assert(
      syncResNoAuth.status === 401,
      'POST /api/database/sync with missing token returns HTTP 401',
      `Got status ${syncResNoAuth.status}`
    );
    assert(
      syncNoAuthBody.code === 'AUTH_TOKEN_REQUIRED',
      'Missing token error code is AUTH_TOKEN_REQUIRED',
      `Got code: ${syncNoAuthBody.code}`
    );
    assert(
      syncNoAuthBody.error && syncNoAuthBody.error.includes('Missing Authorization header'),
      'Missing token returns explicit Bearer token required error',
      syncNoAuthBody.error
    );

    // 1b. POST /sync alias without Authorization
    const syncAliasRes = await fetch(`${baseUrl}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: {} }),
    });
    const syncAliasBody = await syncAliasRes.json();
    assert(
      syncAliasRes.status === 401 && syncAliasBody.code === 'AUTH_TOKEN_REQUIRED',
      'POST /sync alias also strictly enforces Bearer token authentication (HTTP 401)'
    );

    // 1c. GET /api/database/state without Authorization
    const stateNoAuth = await fetch(`${baseUrl}/api/database/state`);
    const stateNoAuthBody = await stateNoAuth.json();
    assert(
      stateNoAuth.status === 401 && stateNoAuthBody.code === 'AUTH_TOKEN_REQUIRED',
      'GET /api/database/state with missing token returns HTTP 401 AUTH_TOKEN_REQUIRED'
    );

    // 1d. POST /api/teachers/provision without Authorization
    const teacherNoAuth = await fetch(`${baseUrl}/api/teachers/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Unauthenticated Teacher' }),
    });
    const teacherNoAuthBody = await teacherNoAuth.json();
    assert(
      teacherNoAuth.status === 401 && teacherNoAuthBody.code === 'AUTH_TOKEN_REQUIRED',
      'POST /api/teachers/provision with missing token returns HTTP 401 AUTH_TOKEN_REQUIRED'
    );

    // ------------------------------------------------------------------------
    // REGRESSION TEST 2: Invalid & Empty Token Rejection
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Invalid & Empty Token Rejection ---');

    const emptyTokenRes = await fetch(`${baseUrl}/api/database/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer    ',
      },
      body: JSON.stringify({ data: {} }),
    });
    const emptyTokenBody = await emptyTokenRes.json();
    assert(
      emptyTokenRes.status === 401 && emptyTokenBody.code === 'AUTH_TOKEN_EMPTY',
      'Empty Bearer token returns HTTP 401 AUTH_TOKEN_EMPTY'
    );

    const invalidTokenRes = await fetch(`${baseUrl}/api/database/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-unregistered-token-99999',
      },
      body: JSON.stringify({ data: {} }),
    });
    const invalidTokenBody = await invalidTokenRes.json();
    assert(
      invalidTokenRes.status === 401 && invalidTokenBody.code === 'INVALID_CREDENTIALS',
      'Unrecognized Bearer token returns HTTP 401 INVALID_CREDENTIALS'
    );

    // ------------------------------------------------------------------------
    // REGRESSION TEST 3: Valid Authenticated Requests
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Valid Authenticated Requests Accepted ---');

    const validSyncRes = await fetch(`${baseUrl}/api/database/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: validSuperToken,
      },
      body: JSON.stringify({
        data: {
          campuses: [
            { id: 'uk', code: 'UK-01', name: 'UK Campus', country: 'United Kingdom', city: 'London', address: '142 Whitechapel Road', timezone: 'Europe/London', currencyCode: 'GBP', phone: '+44 20 7946 0192', email: 'london@misbahulquran.org', isActive: true },
            { id: 'kts', code: 'KTS-01', name: 'KTS Pakistan Campus', country: 'Pakistan', city: 'Haripur', address: 'Sector 3, Khalabat', timezone: 'Asia/Karachi', currencyCode: 'PKR', phone: '+92 995 612345', email: 'kts@misbahulquran.org', isActive: true },
          ],
        },
      }),
    });
    const validSyncBody = await validSyncRes.json();
    assert(
      validSyncRes.status === 200 && validSyncBody.success === true,
      'POST /api/database/sync with valid Bearer token returns HTTP 200 success: true'
    );

    const validSyncAliasRes = await fetch(`${baseUrl}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: validSuperToken,
      },
      body: JSON.stringify({ data: {} }),
    });
    const validSyncAliasBody = await validSyncAliasRes.json();
    assert(
      validSyncAliasRes.status === 200 && validSyncAliasBody.success === true,
      'POST /sync alias with valid Bearer token returns HTTP 200 success: true'
    );

    // ------------------------------------------------------------------------
    // REGRESSION TEST 4: Teacher Provisioning & Foreign Key Integrity
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Teacher Provisioning & Foreign Key Integrity ---');

    const teacherCode = `TCH-REG-${timestamp.toString().slice(-4)}`;
    const teacherEmail = `ustadh.reg.${timestamp}@misbah.org`;
    const teacherName = `Ustadh Bilal Reg_${timestamp.toString().slice(-4)}`;

    const provRes = await fetch(`${baseUrl}/api/teachers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: validSuperToken,
        'X-Campus-Id': 'uk',
      },
      body: JSON.stringify({
        fullName: teacherName,
        email: teacherEmail,
        phone: '+44 7700 900777',
        campusId: 'uk',
        employeeCode: teacherCode,
        specialization: 'Qiraat Sab\'ah & Tajweed',
        qualification: 'Ijazah in Hafs an Asim',
        baseMonthlySalary: 2750,
        salaryCurrency: 'GBP',
        initialPassword: 'TeacherPassword2026!',
        assignedClassIds: [],
      }),
    });

    const provBody = await provRes.json();
    assert(
      provRes.status === 200 && provBody.success === true,
      'Teacher provisioning succeeds with HTTP 200',
      provBody.error
    );
    assert(
      Boolean(provBody.teacher && provBody.user),
      'Response returns both teacher profile and user account objects'
    );
    assert(
      provBody.teacher.userId === provBody.user.id,
      'teacher_profiles.teacher_id correctly linked to users.id foreign key',
      `teacher.userId: ${provBody.teacher?.userId}, user.id: ${provBody.user?.id}`
    );
    assert(
      provBody.teacher.employeeCode === teacherCode,
      'Teacher employee code matches payload',
      provBody.teacher?.employeeCode
    );
    assert(
      provBody.user.role === 'TEACHER',
      'Linked user has role TEACHER',
      provBody.user?.role
    );
    assert(
      provBody.teacher.baseMonthlySalary === 2750 && provBody.teacher.salaryCurrency === 'GBP',
      'Salary and currency properly persisted',
      `${provBody.teacher?.baseMonthlySalary} ${provBody.teacher?.salaryCurrency}`
    );

    const createdTeacherId = provBody.teacher.id;
    const createdUserId = provBody.user.id;

    // ------------------------------------------------------------------------
    // REGRESSION TEST 5: Database Persistence & Retrieval After Refresh
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Database Persistence & Retrieval After Refresh ---');

    const stateRes = await fetch(`${baseUrl}/api/database/state`, {
      headers: { Authorization: validSuperToken },
    });
    const stateBody = await stateRes.json();

    assert(stateRes.status === 200, 'GET /api/database/state returns HTTP 200 OK');
    assert(stateBody.success === true, 'Database state retrieval indicates success: true');

    const retrievedTeacher = (stateBody.data?.teachers || []).find(
      (t: any) => t.id === createdTeacherId || t.employeeCode === teacherCode
    );
    assert(
      Boolean(retrievedTeacher),
      'Newly provisioned teacher is present in retrieved database state after refresh'
    );
    assert(
      retrievedTeacher?.fullName === teacherName,
      'Retrieved teacher fullName matches provisioned value',
      retrievedTeacher?.fullName
    );
    assert(
      retrievedTeacher?.userId === createdUserId,
      'Retrieved teacher has correct linked userId',
      retrievedTeacher?.userId
    );
    assert(
      retrievedTeacher?.campusId === 'uk',
      'Retrieved teacher has correct campusId (uk)',
      retrievedTeacher?.campusId
    );

    const retrievedUser = (stateBody.data?.users || []).find(
      (u: any) => u.id === createdUserId || u.email === teacherEmail
    );
    assert(
      Boolean(retrievedUser),
      'Linked user account is present in retrieved database state after refresh'
    );

    // ------------------------------------------------------------------------
    // REGRESSION TEST 6: Client-Side IMSStateService Auth Guard
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Client-Side IMSStateService Auth Guard ---');

    // 6a. When logged out, getValidAccessToken() must return null
    IMSStateService.logout();
    const tokenWhenLoggedOut = IMSStateService.getValidAccessToken();
    assert(
      tokenWhenLoggedOut === null,
      'IMSStateService.getValidAccessToken() returns null when logged out'
    );

    // 6b. When logged out, createTeacher must reject with error and not report false save
    const unauthSaveResult = await IMSStateService.createTeacher({
      fullName: 'Unauthenticated Test Faculty',
      campusId: 'uk',
    });
    assert(
      unauthSaveResult.success === false,
      'IMSStateService.createTeacher fails when unauthenticated'
    );
    assert(
      Boolean(unauthSaveResult.error && unauthSaveResult.error.includes('Unauthorized')),
      'Error explicitly indicates Unauthorized'
    );

    // 6c. Login as Super Admin establishes valid token
    const loginResult = IMSStateService.login('superadmin', 'Adminmisbah@123');
    assert(loginResult.success === true, 'IMSStateService.login succeeds with Super Admin credentials');

    const tokenWhenLoggedIn = IMSStateService.getValidAccessToken();
    assert(
      Boolean(tokenWhenLoggedIn && tokenWhenLoggedIn.length > 5),
      'IMSStateService.getValidAccessToken() returns valid token when logged in'
    );

    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    console.log('\n--- Cleanup Test Records ---');
    if (createdTeacherId) {
      const delTch = await fetch(`${baseUrl}/api/teachers/${createdTeacherId}`, {
        method: 'DELETE',
        headers: { Authorization: validSuperToken },
      });
      assert(delTch.status === 200, 'DELETE /api/teachers/:id removes test teacher');
    }
    if (createdUserId) {
      const delUsr = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
        method: 'DELETE',
        headers: { Authorization: validSuperToken },
      });
      assert(delUsr.status === 200, 'DELETE /api/users/:id removes test user');
    }

    server.close();

    console.log('\n========================================================================');
    console.log(`REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    server.close();
    console.error('Fatal regression test error:', err);
    process.exit(1);
  }
}

runRegressionTestSuite();
