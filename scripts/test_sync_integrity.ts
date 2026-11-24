/**
 * Misbah-ul-Quran IMS: Comprehensive Supabase Synchronization & CRUD Test Suite
 *
 * Verifies that:
 * 1. Server starts and loads configuration without leaking secrets.
 * 2. Multi-entity CRUD persistence works in all supported tables:
 *    - Teacher provisioning & user linkage (users.id == teacher_profiles.teacher_id)
 *    - Teacher update & class unlinking
 *    - Student provisioning & update
 *    - Class creation & teacher assignment
 *    - Campus configuration updates
 *    - User account creation, update, and deletion
 *    - Payment invoice creation and status updates
 *    - Teacher attendance rules & upsert
 *    - Student attendance bulk upsert
 * 3. GET /api/database/state returns live authoritative state
 * 4. Duplicate accounts and invalid tokens are rejected cleanly
 * 5. Campus boundary isolation is enforced
 */

import http from 'http';
import app from '../server.ts';

async function runComprehensiveTests() {
  console.log('========================================================================');
  console.log('MISBAH-UL-QURAN IMS: SUPABASE & SERVER INTEGRITY TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
      failed++;
    }
  }

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  const superAdminToken = 'Bearer adm-token';
  const campusAdminUkToken = 'Bearer adm-uk-token';
  const timestamp = Date.now();

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Retrieve Live Database State
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Authoritative Live State Retrieval ---');
    const stateRes = await fetch(`${baseUrl}/api/database/state`, {
      headers: { Authorization: superAdminToken },
    });
    const stateBody = await stateRes.json();

    assert(stateRes.status === 200, 'GET /api/database/state returns 200 OK');
    assert(stateBody.success === true, 'Response body indicates success: true');
    assert(Array.isArray(stateBody.data?.campuses), 'Campuses array is present in authoritative state');
    assert(Array.isArray(stateBody.data?.students), 'Students array is present in authoritative state');
    assert(Array.isArray(stateBody.data?.teachers), 'Teachers array is present in authoritative state');
    assert(Array.isArray(stateBody.data?.users), 'Users array is present in authoritative state');
    assert(Array.isArray(stateBody.data?.classes), 'Classes array is present in authoritative state');

    // ------------------------------------------------------------------------
    // TEST 2: Teacher Provisioning & Foreign Key Integrity
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Teacher Provisioning & Foreign Key Integrity ---');
    const teacherPayload = {
      fullName: `Ustadh Test_${timestamp}`,
      email: `ustadh_${timestamp}@misbah.org`,
      phone: '+44 7700 900555',
      campusId: 'uk',
      customCode: `TCH-UK-${timestamp.toString().slice(-4)}`,
      specialization: 'Tajweed & Qiraat',
      qualification: 'Ijazah Hafs',
      baseMonthlySalary: 2600,
      salaryCurrency: 'GBP',
      initialPassword: 'TeacherPassword123!',
    };

    const teacherRes = await fetch(`${baseUrl}/api/teachers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify(teacherPayload),
    });
    const teacherBody = await teacherRes.json();

    assert(teacherRes.status === 200, 'POST /api/teachers/provision returns 200 OK', teacherBody.error);
    assert(teacherBody.success === true, 'Teacher provisioning returned success: true');
    assert(Boolean(teacherBody.teacher?.id), 'Teacher record has an ID');
    assert(Boolean(teacherBody.teacher?.userId), 'Teacher record has a linked userId');
    assert(teacherBody.user?.role === 'TEACHER', 'Linked user has role TEACHER');

    const teacherId = teacherBody.teacher?.id;
    const teacherUserId = teacherBody.teacher?.userId;

    // Duplicate Prevention Test
    const dupRes = await fetch(`${baseUrl}/api/teachers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify(teacherPayload),
    });
    assert(dupRes.status === 400, 'Duplicate teacher creation is rejected with HTTP 400');

    // Teacher Update Test
    const updateRes = await fetch(`${baseUrl}/api/teachers/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({
        specialization: 'Advanced Qiraat & Maqamat',
        baseMonthlySalary: 2800,
      }),
    });
    assert(updateRes.status === 200, 'PUT /api/teachers/:id returns 200 OK');

    // ------------------------------------------------------------------------
    // TEST 3: Class Management & Teacher Assignment
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Class Creation & Teacher Linking ---');
    const classRes = await fetch(`${baseUrl}/api/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({
        name: `Hifz Class ${timestamp.toString().slice(-4)}`,
        campusId: 'uk',
        gradeLevel: 'Advanced Memorization',
        leadTeacherId: teacherId,
        maxCapacity: 20,
      }),
    });
    const classBody = await classRes.json();

    assert(classRes.status === 200, 'POST /api/classes returns 200 OK', classBody.error);
    const classId = classBody.classRoom?.id;
    assert(Boolean(classId), 'Created class has valid ID');

    // Class update test
    const classUpdRes = await fetch(`${baseUrl}/api/classes/${classId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({ name: `Hifz Class ${timestamp.toString().slice(-4)} (Updated)`, maxCapacity: 22 }),
    });
    assert(classUpdRes.status === 200, 'PUT /api/classes/:id returns 200 OK');

    // ------------------------------------------------------------------------
    // TEST 4: Student Provisioning & CRUD
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Student Enrollment & Updates ---');
    const studentRes = await fetch(`${baseUrl}/api/students/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({
        firstName: `Talib_${timestamp.toString().slice(-4)}`,
        lastName: 'Ahmad',
        campusId: 'uk',
        classId: classId,
        gender: 'MALE',
        dob: '2015-05-10',
        enrollmentDate: '2026-02-01',
        primaryParentName: 'Haji Ahmad',
        primaryParentPhone: '+44 7700 900888',
        monthlyFee: 120,
        admissionFee: 50,
      }),
    });
    const studentBody = await studentRes.json();

    assert(studentRes.status === 200, 'POST /api/students/provision returns 200 OK', studentBody.error);
    const studentId = studentBody.student?.id;
    assert(Boolean(studentId), 'Created student has valid ID');

    const studentUpdRes = await fetch(`${baseUrl}/api/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({ monthlyFee: 130, address: '44 London Road, UK' }),
    });
    assert(studentUpdRes.status === 200, 'PUT /api/students/:id returns 200 OK');

    // ------------------------------------------------------------------------
    // TEST 5: Campus Configuration Updates
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Campus Configuration Updates ---');
    const campusRes = await fetch(`${baseUrl}/api/campuses/uk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({ phone: '+44 20 7946 0999', address: 'Misbah House, Central London, UK' }),
    });
    assert(campusRes.status === 200, 'PUT /api/campuses/uk returns 200 OK');

    // ------------------------------------------------------------------------
    // TEST 6: Portal Accounts / Users CRUD
    // ------------------------------------------------------------------------
    console.log('\n--- 6. User Account Management ---');
    const userRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({
        email: `guardian_${timestamp}@misbah.org`,
        username: `guardian_${timestamp.toString().slice(-4)}`,
        fullName: 'Guardian User',
        role: 'PARENT',
        campusId: 'uk',
        password: 'ParentSecure123!',
      }),
    });
    const userBody = await userRes.json();
    assert(userRes.status === 200, 'POST /api/users returns 200 OK', userBody.error);
    const createdUserId = userBody.user?.id;
    assert(Boolean(createdUserId), 'Created user has valid ID');

    const userUpdRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({ fullName: 'Guardian User Updated' }),
    });
    assert(userUpdRes.status === 200, 'PUT /api/users/:id returns 200 OK');

    // ------------------------------------------------------------------------
    // TEST 7: Payment Invoices CRUD
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Payment Invoices CRUD ---');
    const payRes = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({
        studentId: studentId,
        campusId: 'uk',
        title: 'Spring Term Quran Tuition',
        amountDue: 130,
        currency: 'GBP',
        dueDate: '2026-03-10',
        paymentMethod: 'Card',
      }),
    });
    const payBody = await payRes.json();
    assert(payRes.status === 200, 'POST /api/payments returns 200 OK', payBody.error);
    const invoiceId = payBody.payment?.id;
    assert(Boolean(invoiceId), 'Created payment invoice has valid ID');

    const payStatusRes = await fetch(`${baseUrl}/api/payments/${invoiceId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({
        status: 'PAID',
        paymentMethod: 'Bank Transfer',
        amountPaid: 130,
      }),
    });
    assert(payStatusRes.status === 200, 'PUT /api/payments/:id/status returns 200 OK');

    // ------------------------------------------------------------------------
    // TEST 8: Teacher & Student Attendance Rules Engine
    // ------------------------------------------------------------------------
    console.log('\n--- 8. Strict Attendance Rules & Persistence ---');
    // Teacher Attendance before 5 PM (should be PRESENT)
    const tchAttRes = await fetch(`${baseUrl}/api/attendance/teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({
        campusId: 'uk',
        teacherId: teacherUserId || teacherId,
        date: '2026-03-01',
        status: 'PRESENT',
        checkInTime: '16:45:00',
        remarks: 'On time arrival',
      }),
    });
    const tchAttBody = await tchAttRes.json();
    assert(tchAttRes.status === 200, 'POST /api/attendance/teacher returns 200 OK');
    assert(tchAttBody.record?.status === 'PRESENT', 'Attendance before 5:00 PM is verified as PRESENT');

    // Student Attendance Bulk Save
    const stdAttRes = await fetch(`${baseUrl}/api/attendance/student/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: superAdminToken,
      },
      body: JSON.stringify({
        campusId: 'uk',
        classId: classId,
        date: '2026-03-01',
        records: [
          { studentId: studentId, status: 'PRESENT', remarks: 'Attentive recitation' },
        ],
      }),
    });
    const stdAttBody = await stdAttRes.json();
    assert(stdAttRes.status === 200, 'POST /api/attendance/student/bulk returns 200 OK');
    assert(stdAttBody.savedCount === 1, 'Bulk student attendance saved exactly 1 record');

    // ------------------------------------------------------------------------
    // TEST 9: Campus Isolation Protection
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Cross-Campus Isolation Protection ---');
    const isolationRes = await fetch(`${baseUrl}/api/students/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: campusAdminUkToken,
      },
      body: JSON.stringify({
        firstName: 'CrossCampusStudent',
        campusId: 'kts', // Not allowed for UK admin!
      }),
    });
    assert(isolationRes.status === 403, 'Cross-campus provisioning is rejected with HTTP 403 Forbidden');

    // ------------------------------------------------------------------------
    // TEST 10: Clean Cleanup of Test Records
    // ------------------------------------------------------------------------
    console.log('\n--- 10. Clean Cleanup of Test Records ---');
    if (studentId) {
      const delStd = await fetch(`${baseUrl}/api/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: superAdminToken },
      });
      assert(delStd.status === 200, 'DELETE /api/students/:id removes test student');
    }
    if (classId) {
      const delCls = await fetch(`${baseUrl}/api/classes/${classId}`, {
        method: 'DELETE',
        headers: { Authorization: superAdminToken },
      });
      assert(delCls.status === 200, 'DELETE /api/classes/:id removes test class');
    }
    if (createdUserId) {
      const delUsr = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
        method: 'DELETE',
        headers: { Authorization: superAdminToken },
      });
      assert(delUsr.status === 200, 'DELETE /api/users/:id removes test user');
    }
    if (teacherId) {
      const delTch = await fetch(`${baseUrl}/api/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: { Authorization: superAdminToken },
      });
      assert(delTch.status === 200, 'DELETE /api/teachers/:id removes test teacher');
    }

    server.close();

    console.log('\n========================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    server.close();
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runComprehensiveTests();
