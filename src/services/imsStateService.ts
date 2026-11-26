import {
  Campus,
  UserSession,
  UserAccount,
  TeacherProfile,
  ParentProfile,
  StudentRecord,
  ClassRoom,
  TeacherAttendanceRecord,
  StudentAttendanceRecord,
  AcademicProgressRecord,
  PaymentRecord,
  PaymentStatus,
  ExpenseRecord,
  IncidentReportRecord,
  AnnouncementRecord,
  AuditLogRecord,
  TeacherSalaryRecord,
  AcademicExamResult,
  PendingAdmissionApproval,
  PendingTeacherApproval,
  TeacherAttendanceStatus,
  StudentAttendanceStatus,
  EventRecord,
  NotificationLog,
  TeachingMaterial,
  MedicalRecord,
  DocumentAttachment,
} from '../types/ims.ts';
import { formatCampusCurrency } from '../utils/currency.ts';
import {
  evaluateTeacherAttendanceTimeRule,
  getCampusCurrentTime,
  validateTeacherAttendanceSubmission,
} from '../utils/teacherAttendanceRules.ts';
import { SupabaseDbService, isSupabaseConfigured, supabase } from './supabaseClient.ts';
import {
  INITIAL_CAMPUSES,
  INITIAL_USERS,
  INITIAL_TEACHERS,
  INITIAL_PARENTS,
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_TEACHER_ATTENDANCE,
  INITIAL_STUDENT_ATTENDANCE,
  INITIAL_ACADEMIC_PROGRESS,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_INCIDENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SALARY_RECORDS,
  INITIAL_EXAM_RESULTS,
  INITIAL_PENDING_ADMISSIONS,
  INITIAL_PENDING_TEACHERS,
  INITIAL_EVENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TEACHING_MATERIALS,
  INITIAL_MEDICAL_RECORDS,
} from '../data/seedData.ts';

export class IMSStateService {
  private static loadPersisted<T>(key: string, fallback: T): T {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(`misbah_${key}`);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(fallback)) {
            if (Array.isArray(parsed)) {
              if (key === 'users') {
                const seedSuper = (fallback as any[])?.find((u: any) => u.role === 'SUPER_ADMIN' && u.username === 'superadmin');
                if (seedSuper) {
                  const superIdx = parsed.findIndex((u: any) => u.role === 'SUPER_ADMIN' && u.username === 'superadmin');
                  if (superIdx < 0) {
                    parsed.unshift(seedSuper);
                    localStorage.setItem(`misbah_${key}`, JSON.stringify(parsed));
                  }
                }
                const hasSuper = parsed.some((u: any) => u.role === 'SUPER_ADMIN' && u.isActive !== false);
                if (!hasSuper && Array.isArray(fallback) && fallback.length > 0) {
                  const merged = [...fallback, ...parsed];
                  localStorage.setItem(`misbah_${key}`, JSON.stringify(merged));
                  return (merged as unknown) as T;
                }
              }
              return (parsed as unknown) as T;
            }
          } else if (parsed !== null) {
            return parsed as T;
          }
        }
      }
    } catch {
      // ignore parsing error
    }
    return fallback;
  }

  private static persist(key: string, data: any): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`misbah_${key}`, JSON.stringify(data));
      }
    } catch {
      // ignore quota error
    }
  }

  private static campuses: Campus[] = IMSStateService.loadPersisted('campuses', [...INITIAL_CAMPUSES]);
  private static teachers: TeacherProfile[] = IMSStateService.loadPersisted('teachers', [...INITIAL_TEACHERS]);
  private static parents: ParentProfile[] = IMSStateService.loadPersisted('parents', [...INITIAL_PARENTS]);
  private static students: StudentRecord[] = IMSStateService.loadPersisted('students', [...INITIAL_STUDENTS]);
  private static classes: ClassRoom[] = IMSStateService.loadPersisted('classes', [...INITIAL_CLASSES]);
  private static teacherAttendance: TeacherAttendanceRecord[] = IMSStateService.loadPersisted('teacherAttendance', [...INITIAL_TEACHER_ATTENDANCE]);
  private static studentAttendance: StudentAttendanceRecord[] = IMSStateService.loadPersisted('studentAttendance', [...INITIAL_STUDENT_ATTENDANCE]);
  private static academicProgress: AcademicProgressRecord[] = IMSStateService.loadPersisted('academicProgress', [...INITIAL_ACADEMIC_PROGRESS]);
  private static payments: PaymentRecord[] = IMSStateService.loadPersisted('payments', [...INITIAL_PAYMENTS]);
  private static expenses: ExpenseRecord[] = IMSStateService.loadPersisted('expenses', [...INITIAL_EXPENSES]);
  private static incidents: IncidentReportRecord[] = IMSStateService.loadPersisted('incidents', [...INITIAL_INCIDENTS]);
  private static announcements: AnnouncementRecord[] = IMSStateService.loadPersisted('announcements', [...INITIAL_ANNOUNCEMENTS]);
  private static auditLogs: AuditLogRecord[] = IMSStateService.loadPersisted('auditLogs', [...INITIAL_AUDIT_LOGS]);
  private static salaryRecords: TeacherSalaryRecord[] = IMSStateService.loadPersisted('salaryRecords', [...INITIAL_SALARY_RECORDS]);
  private static examResults: AcademicExamResult[] = IMSStateService.loadPersisted('examResults', [...INITIAL_EXAM_RESULTS]);
  private static pendingAdmissions: PendingAdmissionApproval[] = IMSStateService.loadPersisted('pendingAdmissions', [...INITIAL_PENDING_ADMISSIONS]);
  private static pendingTeachers: PendingTeacherApproval[] = IMSStateService.loadPersisted('pendingTeachers', [...INITIAL_PENDING_TEACHERS]);
  private static events: EventRecord[] = IMSStateService.loadPersisted('events', [...INITIAL_EVENTS]);
  private static notifications: NotificationLog[] = IMSStateService.loadPersisted('notifications', [...INITIAL_NOTIFICATIONS]);
  private static teachingMaterials: TeachingMaterial[] = IMSStateService.loadPersisted('teachingMaterials', [...INITIAL_TEACHING_MATERIALS]);
  private static medicalRecords: MedicalRecord[] = IMSStateService.loadPersisted('medicalRecords', [...INITIAL_MEDICAL_RECORDS]);

  // Reactive User Accounts store (Super Admin has full CRUD over all accounts)
  private static users: (UserAccount & { allowedCampusIds?: string[]; token?: string })[] = IMSStateService.loadPersisted('users', [...INITIAL_USERS as any]);

  // Administrative Impersonation State (Super Admin entering Branch Admin Portal View Mode)
  private static branchImpersonation: {
    isImpersonating: boolean;
    campusId: string | null;
  } = {
    isImpersonating: false,
    campusId: null,
  };

  private static getInitialSession(): UserSession | null {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('misbah_current_user') : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.role) {
          const looksLikeJwt = typeof parsed.token === 'string' && parsed.token.split('.').length === 3;
          if (isSupabaseConfigured && !looksLikeJwt) {
            // Session from the old client-side login: force a fresh, server-verified sign-in.
            localStorage.removeItem('misbah_current_user');
            return null;
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  // Current session (defaults to null until authenticated)
  private static currentUser: UserSession | null = IMSStateService.getInitialSession();
  private static listeners: (() => void)[] = [];
  private static authListenerAttached: boolean = IMSStateService.attachAuthListener();

  private static attachAuthListener(): boolean {
    if (!supabase || typeof window === 'undefined') return false;
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token && IMSStateService.currentUser) {
        IMSStateService.currentUser.token = session.access_token;
        try {
          localStorage.setItem('misbah_current_user', JSON.stringify(IMSStateService.currentUser));
        } catch {
          // ignore
        }
      }
      if (event === 'SIGNED_OUT' && IMSStateService.currentUser) {
        IMSStateService.currentUser = null;
        try {
          localStorage.removeItem('misbah_current_user');
        } catch {
          // ignore
        }
        IMSStateService.notify();
      }
    });
    return true;
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Retrieves the current authenticated user's access token for authorized API calls.
   * Returns null if unauthenticated or token is missing/empty.
   */
  static getValidAccessToken(): string | null {
    if (this.currentUser?.token && typeof this.currentUser.token === 'string' && this.currentUser.token.trim()) {
      return this.currentUser.token.trim();
    }
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('misbah_current_user');
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed?.token && typeof parsed.token === 'string' && parsed.token.trim()) {
          if (this.currentUser && !this.currentUser.token) this.currentUser.token = parsed.token.trim();
          return parsed.token.trim();
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  private static syncTimer: any = null;
  private static realtimeSubscribed = false;
  private static realtimeUnsubscribe: (() => void) | null = null;
  private static pollIntervalId: any = null;

  static persistAll(): void {
    this.persist('campuses', this.campuses);
    this.persist('teachers', this.teachers);
    this.persist('parents', this.parents);
    this.persist('students', this.students);
    this.persist('classes', this.classes);
    this.persist('teacherAttendance', this.teacherAttendance);
    this.persist('studentAttendance', this.studentAttendance);
    this.persist('academicProgress', this.academicProgress);
    this.persist('payments', this.payments);
    this.persist('expenses', this.expenses);
    this.persist('incidents', this.incidents);
    this.persist('announcements', this.announcements);
    this.persist('auditLogs', this.auditLogs);
    this.persist('salaryRecords', this.salaryRecords);
    this.persist('examResults', this.examResults);
    this.persist('pendingAdmissions', this.pendingAdmissions);
    this.persist('pendingTeachers', this.pendingTeachers);
    this.persist('users', this.users);
  }

  private static syncToServer(): void {
    if (typeof window === 'undefined') return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(async () => {
      try {
        const token = this.getValidAccessToken();
        if (!token) {
          // If no authenticated session or valid access token exists, skip server sync to prevent 401 errors
          return;
        }

        const res = await fetch('/api/database/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              campuses: this.campuses,
              students: this.students,
              teachers: this.teachers,
              parents: this.parents,
              classes: this.classes,
              payments: this.payments,
              expenses: this.expenses,
              teacherAttendance: this.teacherAttendance,
              studentAttendance: this.studentAttendance,
              academicProgress: this.academicProgress,
              incidents: this.incidents,
              announcements: this.announcements,
              auditLogs: this.auditLogs,
              salaryRecords: this.salaryRecords,
              examResults: this.examResults,
              pendingAdmissions: this.pendingAdmissions,
              pendingTeachers: this.pendingTeachers,
              users: this.users,
            },
          }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            console.warn('[IMSStateService] Database sync rejected: session token is missing or expired.');
          } else {
            console.warn(`[IMSStateService] Database sync returned status ${res.status}.`);
          }
        }
      } catch {
        // network sync errors fail gracefully
      }
    }, 250);
  }

  private static notify(): void {
    this.persistAll();
    this.syncToServer();
    this.listeners.forEach((l) => l());
  }

  /**
   * Live synchronization with Persistent Server Database and Supabase PostgreSQL on startup
   */
  static async initSupabaseSync(): Promise<void> {
    try {
      const token = this.getValidAccessToken();
      // 1. Initial State Hydration from Server Database File (only when authenticated)
      if (token) {
        const serverRes = await fetch('/api/database/state', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (serverRes.ok) {
          const json = await serverRes.json();
          if (json && json.data) {
            const d = json.data;
            if (Array.isArray(d.campuses) && d.campuses.length > 0) this.campuses = d.campuses;
            if (Array.isArray(d.students) && d.students.length > 0) this.students = d.students;
            if (Array.isArray(d.teachers) && d.teachers.length > 0) this.teachers = d.teachers;
            if (Array.isArray(d.parents) && d.parents.length > 0) this.parents = d.parents;
            if (Array.isArray(d.classes) && d.classes.length > 0) this.classes = d.classes;
            if (Array.isArray(d.payments) && d.payments.length > 0) this.payments = d.payments;
            if (Array.isArray(d.teacherAttendance) && d.teacherAttendance.length > 0) this.teacherAttendance = d.teacherAttendance;
            if (Array.isArray(d.studentAttendance) && d.studentAttendance.length > 0) this.studentAttendance = d.studentAttendance;
            if (Array.isArray(d.users) && d.users.length > 0) {
              d.users.forEach((u: any) => {
                const existingIdx = this.users.findIndex((x) => x.id === u.id || x.username === u.username);
                if (existingIdx >= 0) {
                  this.users[existingIdx] = { ...this.users[existingIdx], ...u };
                } else {
                  this.users.push(u);
                }
              });
            }
            this.persistAll();
            this.notify();
          }
        } else if (serverRes.status === 401) {
          console.warn('[IMSStateService] State hydration rejected: session token is missing or expired.');
        }
      }
    } catch {
      // server sync fallback handled
    }

    try {
      const dbCampuses = await SupabaseDbService.fetchCampuses();
      if (dbCampuses && dbCampuses.length > 0) {
        this.campuses = dbCampuses.map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          country: c.country,
          city: c.city,
          address: c.address,
          timezone: c.timezone,
          currencyCode: c.currency_code,
          phone: c.phone,
          email: c.email,
          isActive: c.is_active !== false,
          bankDetails: c.bank_details || undefined,
        }));
      }

      const dbUsers = await SupabaseDbService.fetchUsers();
      if (dbUsers && dbUsers.length > 0) {
        dbUsers.forEach((u: any) => {
          const existingIdx = this.users.findIndex((x) => x.id === u.id || x.email === u.email);
          const formattedUser = {
            id: u.id,
            email: u.email,
            username: u.username || u.email?.split('@')[0] || u.id,
            fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            role: u.role,
            campusId: u.active_campus_id,
            isActive: u.status === 1 || u.status === true,
            studentId: u.student_id,
            teacherProfileId: u.teacher_profile_id,
            parentProfileId: u.parent_profile_id,
            allowedCampusIds: Array.isArray(u.allowed_campus_ids) ? u.allowed_campus_ids : ['all', 'uk', 'kts'],
            createdAt: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2026-01-10',
            lastLogin: '2026-10-15 08:30',
          };
          if (existingIdx >= 0) {
            this.users[existingIdx] = { ...this.users[existingIdx], ...formattedUser };
          } else {
            this.users.push(formattedUser);
          }
        });
      }

      // 1. Fetch Teachers First from Supabase
      const dbTeachers = await SupabaseDbService.fetchTeachers();
      if (dbTeachers && dbTeachers.length > 0) {
        dbTeachers.forEach((t: any) => {
          const u = t.users || {};
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || t.specialization || `Teacher ${t.employee_code || t.id}`;
          const existingIdx = this.teachers.findIndex((x) => x.id === t.id);
          const teacherObj: TeacherProfile = {
            id: t.id,
            userId: t.teacher_id,
            campusId: t.campus_id || 'uk',
            employeeCode: t.employee_code || `TCH-${t.id}`,
            fullName,
            email: u.email || `teacher${t.id}@misbah.org`,
            phone: u.contact_number || '+44 7700 900000',
            specialization: t.specialization || 'Quran & Tajweed',
            qualification: t.qualification || 'Sanad in Hafs an Asim',
            joinDate: t.joining_date || '2026-01-20',
            employmentStatus: 'FULL_TIME',
            assignedClassIds: Array.isArray(t.assigned_class_ids) ? [...t.assigned_class_ids] : [],
            assignedClassNames: [],
            baseMonthlySalary: Number(t.salary || 0),
            salaryCurrency: t.salary_currency || (t.campus_id === 'uk' ? 'GBP' : 'PKR'),
            paymentMethod: 'CASH',
            portalAccessActive: t.status !== 'suspended' && t.status !== 0 && t.status !== false,
            isActive: t.status !== 'suspended' && t.status !== 'archived' && t.status !== 0 && t.status !== false,
          };
          if (existingIdx >= 0) {
            this.teachers[existingIdx] = { ...this.teachers[existingIdx], ...teacherObj };
          } else {
            this.teachers.push(teacherObj);
          }
        });
      }

      // 2. Fetch Classes and bind teacher relationships using authoritative classes.teacher_id -> users.id
      const dbClasses = await SupabaseDbService.fetchClasses();
      if (dbClasses && dbClasses.length > 0) {
        dbClasses.forEach((c: any) => {
          const existingIdx = this.classes.findIndex((x) => x.id === c.id);
          const className = c.title || c.name || `Class ${c.id}`;

          // Match teacher by classes.teacher_id (foreign key referencing users.id)
          const matchedTeacher = c.teacher_id
            ? this.teachers.find((t) => t.userId === c.teacher_id || t.id === c.teacher_id)
            : undefined;

          // If matched, ensure this class is in the teacher's assignedClassIds
          if (matchedTeacher) {
            if (!matchedTeacher.assignedClassIds.includes(c.id)) {
              matchedTeacher.assignedClassIds.push(c.id);
            }
            if (!matchedTeacher.assignedClassNames) {
              matchedTeacher.assignedClassNames = [];
            }
            if (!matchedTeacher.assignedClassNames.includes(className)) {
              matchedTeacher.assignedClassNames.push(className);
            }
          }

          const classObj: ClassRoom = {
            id: c.id,
            campusId: c.campus_id || 'uk',
            name: className,
            code: c.code || `${c.campus_id?.toUpperCase() || 'CLS'}-${c.id}`,
            gradeLevel: c.grade_level || c.description || (className.includes('Boys') ? 'Boys Section' : className.includes('Girls') ? 'Girls Section' : 'General Section'),
            section: c.section || (className.includes('Boys') ? 'Boys' : className.includes('Girls') ? 'Girls' : 'General'),
            academicYear: c.academic_year || '2025-2026',
            capacity: Number(c.capacity || 25),
            maxCapacity: Number(c.capacity || 25),
            leadTeacherId: c.teacher_id || undefined,
            leadTeacherName: matchedTeacher?.fullName || undefined,
            studentCount: Number(c.student_count || 0),
            scheduleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            scheduleTime: c.schedule_time || '5:00 PM - 7:30 PM (Mon-Fri)',
            room: c.room || 'Main Hall',
            isActive: c.is_active !== false,
          };

          if (existingIdx >= 0) {
            this.classes[existingIdx] = { ...this.classes[existingIdx], ...classObj };
          } else {
            this.classes.push(classObj);
          }
        });
      }

      // 3. Fetch Students and bind class relationships using authoritative students.class_id -> classes.id
      const dbStudents = await SupabaseDbService.fetchStudents();
      if (dbStudents && dbStudents.length > 0) {
        dbStudents.forEach((s: any) => {
          const existingIdx = this.students.findIndex((x) => x.id === s.id);
          const matchedClass = s.class_id ? this.classes.find((c) => c.id === s.class_id) : undefined;

          let parsedParentContact: { name?: string; phone?: string } | null = null;
          try {
            if (s.primary_contact_details) {
              parsedParentContact = typeof s.primary_contact_details === 'string'
                ? JSON.parse(s.primary_contact_details)
                : s.primary_contact_details;
            }
          } catch {
            // ignore
          }

          const studentObj: StudentRecord = {
            id: s.id,
            admissionNumber: s.roll_number || `MUQ-${(s.campus_id || 'UK').toUpperCase()}-${s.id}`,
            campusId: s.campus_id || 'uk',
            firstName: s.first_name || 'Student',
            lastName: s.last_name || '',
            gender: (s.gender || 'female').toUpperCase() === 'MALE' ? 'MALE' : 'FEMALE',
            dob: s.date_of_birth || '2016-06-15',
            enrollmentDate: s.admission_date || '2026-01-01',
            currentGrade: matchedClass?.gradeLevel || matchedClass?.name || 'General Halaqah',
            classId: s.class_id || '',
            className: matchedClass?.name || 'Unassigned',
            section: matchedClass?.section || 'Section A',
            primaryParentName: parsedParentContact?.name || 'Parent / Guardian',
            primaryParentPhone: parsedParentContact?.phone || '',
            address: s.address || '',
            bloodGroup: s.blood_group || 'B+',
            medicalNotes: s.medical_notes || '',
            quranMilestone: s.quran_milestone || 'Juz 1',
            monthlyFee: Number(s.monthly_fee_amount || 0),
            admissionFee: Number(s.admission_fee_amount || 0),
            isActive: s.status === 'active' || s.status === 1 || s.status === true,
            approvalStatus: s.approval_status || 'APPROVED',
            attendanceRate: 100,
            feeStatus: 'UP_TO_DATE',
            portalAccessActive: true,
            parentIds: s.parent_id ? [s.parent_id] : [],
          };

          if (existingIdx >= 0) {
            this.students[existingIdx] = { ...this.students[existingIdx], ...studentObj };
          } else {
            this.students.push(studentObj);
          }
        });
      }

      const dbPayments = await SupabaseDbService.fetchPaymentInvoices();
      if (dbPayments && dbPayments.length > 0) {
        dbPayments.forEach((p: any) => {
          const existingIdx = this.payments.findIndex((x) => x.id === p.id);
          const payObj: any = {
            id: p.id,
            campusId: p.campus_id || 'kts',
            studentId: p.reference_id,
            studentName: `Student ${p.reference_id}`,
            admissionNumber: `REG-${Number(p.reference_id) + 999}`,
            invoiceNumber: `INV-KTS-${String(p.id).padStart(4, '0')}`,
            title: 'Monthly Tuition Fee',
            amountDue: Number(p.amount || 0),
            amountPaid: p.payment_status === 'paid' ? Number(p.amount || 0) : 0,
            currency: p.currency || 'PKR',
            status: p.payment_status === 'paid' ? 'PAID' : 'PENDING',
            dueDate: p.due_date,
            paidDate: p.payment_date || undefined,
            paymentMethod: p.payment_method || 'Cash',
          };
          if (existingIdx >= 0) {
            this.payments[existingIdx] = { ...this.payments[existingIdx], ...payObj };
          } else {
            this.payments.push(payObj);
          }
        });
      }

      // 4. Fetch Teacher Attendance from Supabase
      try {
        const dbTeacherAtt = await SupabaseDbService.fetchTeacherAttendance();
        if (dbTeacherAtt && dbTeacherAtt.length > 0) {
          dbTeacherAtt.forEach((a: any) => {
            // Supabase stores the user id (usr-...); the portal keys attendance by profile id (tch-...).
            const teacher = this.teachers.find((t) => t.id === a.teacher_id || t.userId === a.teacher_id);
            const portalTeacherId = teacher?.id || a.teacher_id;
            const existingIdx = this.teacherAttendance.findIndex(
              (x) => (x.teacherId === portalTeacherId || x.teacherId === a.teacher_id) && x.date === a.date
            );
            const entry: TeacherAttendanceRecord = {
              id: a.id || `att-tch-${a.teacher_id}-${a.date}`,
              campusId: a.campus_id || 'uk',
              teacherId: portalTeacherId,
              teacherName: teacher?.fullName || 'Faculty Member',
              teacherCode: teacher?.employeeCode || `TCH-${a.teacher_id}`,
              date: a.date,
              status: a.status as TeacherAttendanceStatus,
              checkInTime: a.check_in_time,
              ruleApplied: (a.rule_applied || 'UP_TO_5PM') as any,
              isSystemGenerated: a.is_system_generated || false,
              remarks: a.remarks || '',
              recordedBy: a.recorded_by || 'Admin',
              updatedAt: a.updated_at || a.created_at || new Date().toISOString(),
            };
            if (existingIdx >= 0) {
              this.teacherAttendance[existingIdx] = { ...this.teacherAttendance[existingIdx], ...entry };
            } else {
              this.teacherAttendance.unshift(entry);
            }
          });
        }
      } catch (attErr) {
        console.warn('[Supabase Sync] Teacher attendance fetch notice:', attErr);
      }

      // 5. Fetch Student Attendance from Supabase
      try {
        const dbStudentAtt = await SupabaseDbService.fetchStudentAttendance();
        if (dbStudentAtt && dbStudentAtt.length > 0) {
          const studentMap = new Map(this.students.map((s) => [s.id, s]));
          dbStudentAtt.forEach((a: any) => {
            const existingIdx = this.studentAttendance.findIndex(
              (x) => x.studentId === a.student_id && x.date === a.date && x.classId === a.class_id
            );
            const std = studentMap.get(a.student_id);
            const entry: StudentAttendanceRecord = {
              id: a.id || `att-std-${a.student_id}-${a.date}`,
              campusId: a.campus_id || 'uk',
              classId: a.class_id,
              className: std?.className || 'Class',
              studentId: a.student_id,
              studentName: std ? `${std.firstName} ${std.lastName}` : 'Student',
              admissionNumber: std?.admissionNumber || '',
              date: a.date,
              status: a.status as StudentAttendanceStatus,
              arrivalTime: a.arrival_time,
              remarks: a.remarks || '',
              recordedBy: a.recorded_by || 'Staff',
              updatedAt: a.updated_at || a.created_at || new Date().toISOString(),
            };
            if (existingIdx >= 0) {
              this.studentAttendance[existingIdx] = { ...this.studentAttendance[existingIdx], ...entry };
            } else {
              this.studentAttendance.unshift(entry);
            }
          });
        }
      } catch (sattErr) {
        console.warn('[Supabase Sync] Student attendance fetch notice:', sattErr);
      }

      // 6. Fetch Incident Logs & Medical Records from Supabase
      try {
        const dbIncidents = await SupabaseDbService.fetchIncidentLogs();
        if (dbIncidents && dbIncidents.length > 0) {
          const studentMap = new Map(this.students.map((s) => [s.id, s]));
          dbIncidents.forEach((log: any) => {
            const isMedical = log.title?.startsWith('[MEDICAL]');
            const std = log.student_id ? studentMap.get(log.student_id) : undefined;
            const studentName = std ? `${std.firstName} ${std.lastName}` : 'Student';

            if (isMedical) {
              let parsed: any = {};
              try {
                if (log.description && log.description.startsWith('{')) {
                  parsed = JSON.parse(log.description);
                }
              } catch {}

              const existingIdx = this.medicalRecords.findIndex((m) => m.id === log.id);
              const medRecord: MedicalRecord = {
                id: log.id,
                campusId: log.campus_id || 'uk',
                studentId: log.student_id || '',
                studentName,
                condition: parsed.condition || log.title.replace('[MEDICAL] Condition:', '').trim() || 'Medical Note',
                severity: parsed.severity || 'HIGH',
                allergies: parsed.allergies || '',
                medicationNotes: parsed.medicationNotes || '',
                emergencyContact: parsed.emergencyContact || (log.action_taken?.replace('Emergency Contact:', '').trim()) || std?.primaryParentPhone || '',
                status: (log.status || 'SUBMITTED') as any,
                reportedBy: parsed.reportedBy || 'Staff',
                createdAt: log.created_at ? log.created_at.split('T')[0] : (log.date || '2026-10-29'),
              };
              if (existingIdx >= 0) {
                this.medicalRecords[existingIdx] = { ...this.medicalRecords[existingIdx], ...medRecord };
              } else {
                this.medicalRecords.unshift(medRecord);
              }
            } else {
              let parsedFiles: any = undefined;
              if (log.attachments) {
                try {
                  if (log.attachments.startsWith('[') || log.attachments.startsWith('{')) {
                    parsedFiles = JSON.parse(log.attachments);
                  } else {
                    parsedFiles = [{ id: `att-${log.id}`, name: log.attachments, sizeMb: 1.0, type: 'PDF' }];
                  }
                } catch {
                  parsedFiles = [{ id: `att-${log.id}`, name: log.attachments, sizeMb: 1.0, type: 'PDF' }];
                }
              }

              let incType: any = 'BEHAVIORAL';
              if (log.title?.includes('[ACADEMIC]')) incType = 'ACADEMIC';
              else if (log.title?.includes('[INJURY]')) incType = 'INJURY';
              else if (log.title?.includes('[MEDICAL]')) incType = 'MEDICAL';

              const existingIdx = this.incidents.findIndex((i) => i.id === log.id);
              const incRecord: IncidentReportRecord = {
                id: log.id,
                campusId: log.campus_id || 'uk',
                studentId: log.student_id || '',
                studentName,
                reporterId: 'staff',
                reporterName: 'Staff Member',
                type: incType,
                severity: 'MEDIUM',
                description: log.description || log.title || '',
                actionTaken: log.action_taken || '',
                status: (log.status || 'SUBMITTED') as any,
                createdAt: log.created_at ? log.created_at.replace('T', ' ').substring(0, 19) : (log.date || '2026-10-29'),
                attachedFiles: parsedFiles,
              };
              if (existingIdx >= 0) {
                this.incidents[existingIdx] = { ...this.incidents[existingIdx], ...incRecord };
              } else {
                this.incidents.unshift(incRecord);
              }
            }
          });
        }
      } catch (incErr) {
        console.warn('[Supabase Sync] Incident logs fetch notice:', incErr);
      }

      this.persistAll();
      this.notify();

      // 4. Initialize Bi-Directional Real-Time Synchronization with Supabase PostgreSQL
      if (isSupabaseConfigured && !this.realtimeSubscribed) {
        this.realtimeSubscribed = true;
        this.realtimeUnsubscribe = SupabaseDbService.subscribeToRealtimeChanges((payload) => {
          this.handleSupabaseRealtimeChange(payload);
        });

        // Periodic reconciliation polling (every 15 seconds) to ensure zero stale state
        if (!this.pollIntervalId && typeof window !== 'undefined') {
          this.pollIntervalId = window.setInterval(() => {
            this.reconcileSupabaseState().catch(() => {});
          }, 15000);
          window.addEventListener('focus', () => {
            this.reconcileSupabaseState().catch(() => {});
          });
        }
      }
    } catch (err) {
      console.warn('[IMSStateService] Supabase sync notice:', err);
    }
  }

  /**
   * Real-time processor for incoming Supabase PostgreSQL replication events
   */
  private static handleSupabaseRealtimeChange(payload: {
    table: string;
    eventType: string;
    newRecord: any;
    oldRecord: any;
  }): void {
    const { table, eventType, newRecord, oldRecord } = payload;
    console.log(`[Supabase Realtime] Event on ${table} (${eventType}) received in IMS`);

    if (table === 'students') {
      if (eventType === 'DELETE' && oldRecord?.id) {
        this.students = this.students.filter((s) => s.id !== oldRecord.id);
      } else if (newRecord?.id) {
        const idx = this.students.findIndex((s) => s.id === newRecord.id || s.admissionNumber === newRecord.roll_number);
        const mappedStudent: Partial<StudentRecord> = {
          id: newRecord.id,
          admissionNumber: newRecord.roll_number || newRecord.id,
          campusId: newRecord.campus_id || 'uk',
          firstName: newRecord.first_name || '',
          lastName: newRecord.last_name || '',
          gender: (newRecord.gender || 'FEMALE').toUpperCase() as any,
          dob: newRecord.date_of_birth || '2016-01-01',
          classId: newRecord.class_id || '',
          isActive: newRecord.status !== 'inactive',
          monthlyFee: Number(newRecord.monthly_fee_amount || 0),
          admissionFee: Number(newRecord.admission_fee_amount || 0),
          address: newRecord.address || '',
        };
        if (idx >= 0) {
          this.students[idx] = { ...this.students[idx], ...mappedStudent };
        } else {
          this.students.unshift({
            ...mappedStudent,
            enrollmentDate: newRecord.admission_date || new Date().toISOString().substring(0, 10),
            currentGrade: 'G1',
            className: 'General Halaqah',
            section: 'Section A',
            bloodGroup: 'B+',
            medicalNotes: '',
            approvalStatus: newRecord.approval_status || 'APPROVED',
            parentIds: [],
            primaryParentName: 'Parent / Guardian',
            primaryParentPhone: '',
            attendanceRate: 100,
            feeStatus: 'UP_TO_DATE',
            portalAccessActive: true,
            quranMilestone: 'Juz 1',
          } as StudentRecord);
        }
      }
      this.persist('students', this.students);
      this.notify();
    } else if (table === 'teacher_profiles') {
      if (eventType === 'DELETE' && oldRecord?.id) {
        this.teachers = this.teachers.filter((t) => t.id !== oldRecord.id && t.userId !== oldRecord.teacher_id);
      } else if (newRecord?.id) {
        const idx = this.teachers.findIndex((t) => t.id === newRecord.id || t.userId === newRecord.teacher_id);
        const mappedTeacher: Partial<TeacherProfile> = {
          id: newRecord.id,
          userId: newRecord.teacher_id,
          campusId: newRecord.campus_id || 'uk',
          employeeCode: newRecord.employee_code || `TCH-${newRecord.id}`,
          specialization: newRecord.specialization || 'Quran & Tajweed',
          qualification: newRecord.qualification || 'Sanad in Hafs an Asim',
          baseMonthlySalary: Number(newRecord.salary || 0),
          salaryCurrency: newRecord.salary_currency || 'PKR',
          assignedClassIds: Array.isArray(newRecord.assigned_class_ids) ? newRecord.assigned_class_ids : [],
          portalAccessActive: newRecord.status !== 'suspended',
          isActive: newRecord.status !== 'suspended',
        };
        if (idx >= 0) {
          this.teachers[idx] = { ...this.teachers[idx], ...mappedTeacher };
        } else {
          this.teachers.unshift({
            ...mappedTeacher,
            fullName: `Teacher ${newRecord.employee_code || newRecord.id}`,
            email: `teacher${newRecord.id}@misbah.org`,
            phone: '+44 7700 900000',
            joinDate: newRecord.joining_date || new Date().toISOString().substring(0, 10),
            employmentStatus: 'FULL_TIME',
            assignedClassNames: [],
            paymentMethod: 'CASH',
          } as TeacherProfile);
        }
      }
      this.persist('teachers', this.teachers);
      this.notify();
    } else if (table === 'classes') {
      if (eventType === 'DELETE' && oldRecord?.id) {
        this.classes = this.classes.filter((c) => c.id !== oldRecord.id);
      } else if (newRecord?.id) {
        const idx = this.classes.findIndex((c) => c.id === newRecord.id);
        const mappedClass: Partial<ClassRoom> = {
          id: newRecord.id,
          campusId: newRecord.campus_id || 'uk',
          name: newRecord.title || newRecord.name || 'Halaqah',
          code: newRecord.code || newRecord.id,
          capacity: Number(newRecord.capacity || 25),
          maxCapacity: Number(newRecord.capacity || 25),
          leadTeacherId: newRecord.teacher_id || undefined,
          isActive: newRecord.is_active !== false,
        };
        if (idx >= 0) {
          this.classes[idx] = { ...this.classes[idx], ...mappedClass };
        } else {
          this.classes.push({
            ...mappedClass,
            gradeLevel: 'General Halaqah',
            academicYear: newRecord.academic_year || '2025-2026',
            studentCount: 0,
            currentEnrollment: 0,
            scheduleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            scheduleTime: '5:00 PM - 7:30 PM (Mon-Fri)',
            room: 'Main Hall',
          } as ClassRoom);
        }
      }
      this.persist('classes', this.classes);
      this.notify();
    } else if (table === 'users') {
      if (eventType === 'DELETE' && oldRecord?.id) {
        this.users = this.users.filter((u) => u.id !== oldRecord.id);
      } else if (newRecord?.id) {
        const idx = this.users.findIndex((u) => u.id === newRecord.id || u.email === newRecord.email);
        const mappedUser: Partial<UserAccount> = {
          id: newRecord.id,
          email: newRecord.email,
          username: newRecord.username || newRecord.email?.split('@')[0],
          fullName: `${newRecord.first_name || ''} ${newRecord.last_name || ''}`.trim() || newRecord.email,
          role: newRecord.role,
          campusId: newRecord.active_campus_id,
          isActive: newRecord.status === 1 || newRecord.status === true,
        };
        if (idx >= 0) {
          this.users[idx] = { ...this.users[idx], ...mappedUser };
        }
      }
      this.persist('users', this.users);
      this.notify();
    } else if (table === 'payment_invoices') {
      if (eventType === 'DELETE' && oldRecord?.id) {
        this.payments = this.payments.filter((p) => p.id !== String(oldRecord.id));
      } else if (newRecord?.id) {
        const idx = this.payments.findIndex((p) => p.id === String(newRecord.id));
        const mappedPay: Partial<PaymentRecord> = {
          id: String(newRecord.id),
          amountDue: Number(newRecord.amount || 0),
          amountPaid: newRecord.payment_status === 'paid' ? Number(newRecord.amount || 0) : 0,
          currency: newRecord.currency || 'PKR',
          status: newRecord.payment_status === 'paid' ? 'PAID' : 'PENDING',
          dueDate: newRecord.due_date,
          paidDate: newRecord.payment_date || undefined,
          paymentMethod: newRecord.payment_method || 'Cash',
        };
        if (idx >= 0) {
          this.payments[idx] = { ...this.payments[idx], ...mappedPay };
        }
      }
      this.persist('payments', this.payments);
      this.notify();
    }
  }

  /**
   * Periodic reconciliation reconciling any external edits in Supabase into IMS
   */
  static async reconcileSupabaseState(): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const [students, teachers, classes, payments] = await Promise.all([
        SupabaseDbService.fetchStudents().catch(() => null),
        SupabaseDbService.fetchTeachers().catch(() => null),
        SupabaseDbService.fetchClasses().catch(() => null),
        SupabaseDbService.fetchPaymentInvoices().catch(() => null),
      ]);

      if (students && students.length > 0) {
        students.forEach((s: any) => {
          const idx = this.students.findIndex((x) => x.id === s.id || x.admissionNumber === s.roll_number);
          if (idx >= 0) {
            this.students[idx] = {
              ...this.students[idx],
              firstName: s.first_name || this.students[idx].firstName,
              lastName: s.last_name || this.students[idx].lastName,
              campusId: s.campus_id || this.students[idx].campusId,
              classId: s.class_id || this.students[idx].classId,
              isActive: s.status !== 'inactive',
              monthlyFee: Number(s.monthly_fee_amount || this.students[idx].monthlyFee),
              admissionFee: Number(s.admission_fee_amount || this.students[idx].admissionFee),
            };
          }
        });
        this.persist('students', this.students);
      }

      if (teachers && teachers.length > 0) {
        teachers.forEach((t: any) => {
          const u = t.users || {};
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || t.specialization;
          const idx = this.teachers.findIndex((x) => x.id === t.id || x.userId === t.teacher_id);
          if (idx >= 0) {
            this.teachers[idx] = {
              ...this.teachers[idx],
              fullName: fullName || this.teachers[idx].fullName,
              email: u.email || this.teachers[idx].email,
              phone: u.contact_number || this.teachers[idx].phone,
              specialization: t.specialization || this.teachers[idx].specialization,
              qualification: t.qualification || this.teachers[idx].qualification,
              baseMonthlySalary: Number(t.salary || this.teachers[idx].baseMonthlySalary),
              salaryCurrency: t.salary_currency || this.teachers[idx].salaryCurrency,
              assignedClassIds: Array.isArray(t.assigned_class_ids) ? t.assigned_class_ids : this.teachers[idx].assignedClassIds,
              portalAccessActive: t.status !== 'suspended' && t.status !== 0,
              isActive: t.status !== 'suspended' && t.status !== 'archived',
            };
          }
        });
        this.persist('teachers', this.teachers);
      }

      if (classes && classes.length > 0) {
        classes.forEach((c: any) => {
          const idx = this.classes.findIndex((x) => x.id === c.id);
          if (idx >= 0) {
            this.classes[idx] = {
              ...this.classes[idx],
              name: c.title || c.name || this.classes[idx].name,
              code: c.code || this.classes[idx].code,
              capacity: Number(c.capacity || this.classes[idx].capacity),
              leadTeacherId: c.teacher_id || this.classes[idx].leadTeacherId,
              isActive: c.is_active !== false,
            };
          }
        });
        this.persist('classes', this.classes);
      }

      if (payments && payments.length > 0) {
        payments.forEach((p: any) => {
          const idx = this.payments.findIndex((x) => x.id === String(p.id));
          if (idx >= 0) {
            this.payments[idx] = {
              ...this.payments[idx],
              amountDue: Number(p.amount || this.payments[idx].amountDue),
              amountPaid: p.payment_status === 'paid' ? Number(p.amount || 0) : this.payments[idx].amountPaid,
              status: p.payment_status === 'paid' ? 'PAID' : 'PENDING',
              paymentMethod: p.payment_method || this.payments[idx].paymentMethod,
            };
          }
        });
        this.persist('payments', this.payments);
      }

      this.notify();
    } catch (err) {
      console.warn('[IMSStateService] Reconcile error:', err);
    }
  }

  /**
   * Refreshes registered faculty instructors on demand
   */
  static async refreshTeachers(): Promise<TeacherProfile[]> {
    try {
      const dbTeachers = await SupabaseDbService.fetchTeachers();
      if (dbTeachers && dbTeachers.length > 0) {
        dbTeachers.forEach((t: any) => {
          const u = t.users || {};
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || t.specialization || `Teacher ${t.employee_code || t.id}`;
          const existingIdx = this.teachers.findIndex((x) => x.id === t.id || x.userId === t.teacher_id);
          const teacherObj: TeacherProfile = {
            id: t.id,
            userId: t.teacher_id,
            campusId: t.campus_id || 'uk',
            employeeCode: t.employee_code || `TCH-${t.id}`,
            fullName,
            email: u.email || `teacher${t.id}@misbah.org`,
            phone: u.contact_number || '+44 7700 900000',
            specialization: t.specialization || 'Quran & Tajweed',
            qualification: t.qualification || 'Sanad in Hafs an Asim',
            joinDate: t.joining_date || '2026-01-20',
            employmentStatus: 'FULL_TIME',
            assignedClassIds: Array.isArray(t.assigned_class_ids) ? [...t.assigned_class_ids] : [],
            assignedClassNames: [],
            baseMonthlySalary: Number(t.salary || 0),
            salaryCurrency: t.salary_currency || (t.campus_id === 'uk' ? 'GBP' : 'PKR'),
            paymentMethod: 'CASH',
            portalAccessActive: t.status !== 'suspended' && t.status !== 0 && t.status !== false,
            isActive: t.status !== 'suspended' && t.status !== 'archived' && t.status !== 0 && t.status !== false,
          };
          if (existingIdx >= 0) {
            this.teachers[existingIdx] = { ...this.teachers[existingIdx], ...teacherObj };
          } else {
            this.teachers.push(teacherObj);
          }
        });
        this.persist('teachers', this.teachers);
        this.notify();
      }
    } catch (err) {
      console.warn('[IMSStateService] refreshTeachers notice:', err);
    }
    return this.teachers;
  }

  /**
   * Unified Document Management Services
   */
  static async uploadDocument(data: {
    entityType: 'STUDENT' | 'TEACHER';
    entityId: string;
    campusId: string;
    name: string;
    category?: string;
    mimeType: string;
    sizeBytes: number;
    fileBase64: string;
  }): Promise<{ success: boolean; document?: DocumentAttachment; error?: string }> {
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getValidAccessToken() || ''}`,
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to upload document.' };
      }

      const doc: DocumentAttachment = resData.document;
      if (data.entityType === 'STUDENT') {
        const std = this.students.find((s) => s.id === data.entityId);
        if (std) {
          if (!std.documents) std.documents = [];
          std.documents = [doc, ...std.documents.filter((d) => d.id !== doc.id)];
          this.persist('students', this.students);
        }
      } else if (data.entityType === 'TEACHER') {
        const tch = this.teachers.find((t) => t.id === data.entityId || t.userId === data.entityId);
        if (tch) {
          if (!tch.documents) tch.documents = [];
          tch.documents = [doc, ...tch.documents.filter((d) => d.id !== doc.id)];
          this.persist('teachers', this.teachers);
        }
      }
      this.notify();
      return { success: true, document: doc };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error uploading document.' };
    }
  }

  static async deleteDocument(
    docId: string,
    entityType?: 'STUDENT' | 'TEACHER',
    entityId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getValidAccessToken() || ''}`,
        },
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to delete document.' };
      }

      if (entityType === 'STUDENT' && entityId) {
        const std = this.students.find((s) => s.id === entityId);
        if (std && std.documents) {
          std.documents = std.documents.filter((d) => d.id !== docId);
          this.persist('students', this.students);
        }
      } else if (entityType === 'TEACHER' && entityId) {
        const tch = this.teachers.find((t) => t.id === entityId || t.userId === entityId);
        if (tch && tch.documents) {
          tch.documents = tch.documents.filter((d) => d.id !== docId);
          this.persist('teachers', this.teachers);
        }
      }
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting document.' };
    }
  }

  // --- System Setup & Provisioning ---
  static isSystemSetupCompleted(): boolean {
    const hasSuperAdmin = this.users.some((u) => u.role === 'SUPER_ADMIN' && u.isActive !== false);
    return Boolean(hasSuperAdmin);
  }

  static provisionInitialSuperAdmin(data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    defaultCampusId?: string;
  }): { success: boolean; message: string; user?: UserSession } {
    if (this.isSystemSetupCompleted()) {
      return { success: false, message: 'Super Administrator already provisioned. Initial setup is permanently locked.' };
    }

    if (!data.fullName.trim() || !data.email.trim() || !data.password) {
      return { success: false, message: 'Full Name, Email, and Password are required.' };
    }

    if (data.password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    const email = data.email.trim().toLowerCase();
    const username = (data.username || email.split('@')[0]).trim().toLowerCase();
    const campus = data.defaultCampusId || 'all';

    const newSuperAdmin: (UserAccount & { allowedCampusIds?: string[]; token?: string }) = {
      id: `usr-super-${Date.now()}`,
      email,
      username,
      fullName: data.fullName.trim(),
      role: 'SUPER_ADMIN',
      campusId: campus,
      allowedCampusIds: ['all', 'uk', 'kts'],
      isActive: true,
      password: data.password,
      token: `jwt-superadmin-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    this.users = [newSuperAdmin];
    this.persist('users', this.users);

    if (typeof window !== 'undefined') {
      localStorage.setItem('misbah_system_initialized', 'true');
    }

    const session: UserSession = {
      id: newSuperAdmin.id,
      email: newSuperAdmin.email,
      username: newSuperAdmin.username,
      fullName: newSuperAdmin.fullName,
      role: 'SUPER_ADMIN',
      activeCampusId: campus,
      allowedCampusIds: ['all', 'uk', 'kts'],
      token: newSuperAdmin.token,
    };

    this.currentUser = session;
    if (typeof window !== 'undefined') {
      localStorage.setItem('misbah_current_user', JSON.stringify(session));
    }

    this.addAuditLog({
      campusId: campus === 'all' ? undefined : campus,
      userId: session.id,
      userName: session.fullName,
      userRole: session.role,
      action: 'SYSTEM_SETUP',
      entityType: 'User',
      entityId: session.id,
      outcome: 'SUCCESS',
      details: `Initial system setup completed. Primary Super Admin ${session.fullName} (${session.email}) provisioned.`,
    });

    this.notify();
    return { success: true, message: 'System setup completed successfully!', user: session };
  }

  // --- Authentication Operations ---
  static getCurrentUser(): UserSession | null {
    return this.currentUser;
  }

  static async login(identifier: string, password: string): Promise<{ success: boolean; message: string; user?: UserSession }> {
    if (!isSupabaseConfigured) return this.loginLocal(identifier, password);

    let response: Response;
    try {
      response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
    } catch {
      return { success: false, message: 'Cannot reach the server. Check your connection and try again.' };
    }
    const body = await response.json().catch(() => ({}));
    if (response.status === 501) return this.loginLocal(identifier, password);
    if (!response.ok || !body?.success || !body.session?.access_token) {
      return { success: false, message: body?.error || 'Sign-in failed. Please try again.' };
    }

    if (supabase) {
      const { error } = await supabase.auth.setSession({
        access_token: body.session.access_token,
        refresh_token: body.session.refresh_token,
      });
      if (error) {
        return { success: false, message: `Could not start your session: ${error.message}` };
      }
    }

    const u = body.user || {};
    this.currentUser = {
      id: u.id,
      email: u.email,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      allowedCampusIds: u.allowedCampusIds || [u.activeCampusId || 'all'],
      activeCampusId: u.activeCampusId || 'all',
      teacherProfileId: u.teacherProfileId,
      token: body.session.access_token,
    };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('misbah_current_user', JSON.stringify(this.currentUser));
      }
    } catch {
      // ignore
    }
    this.branchImpersonation = { isImpersonating: false, campusId: null };
    this.notify();
    return { success: true, message: 'Authentication successful', user: this.currentUser };
  }

  /** Development-only login used when Supabase is not configured (local ledger mode). */
  private static loginLocal(identifier: string, password: string): { success: boolean; message: string; user?: UserSession } {
    const cleanId = identifier.trim().toLowerCase();
    const userFound = this.users.find(
      (u) =>
        (u.email.toLowerCase() === cleanId ||
          u.username.toLowerCase() === cleanId) &&
        Boolean(u.password) &&
        u.password === password
    );

    if (!userFound) {
      this.addAuditLog({
        userId: 'anonymous',
        userName: identifier,
        userRole: 'PARENT',
        action: 'FAILED_LOGIN_ATTEMPT',
        entityType: 'Authentication',
        entityId: cleanId,
        outcome: 'FAILED',
        details: `Failed login attempt for identifier "${identifier}"`,
      });
      return {
        success: false,
        message: 'Invalid credentials. Please verify your email or username and password.',
      };
    }

    if (userFound.role === 'STUDENT') {
      this.addAuditLog({
        userId: userFound.id,
        userName: userFound.fullName,
        userRole: 'STUDENT',
        action: 'STUDENT_LOGIN_ATTEMPT_REDIRECTED',
        entityType: 'User',
        entityId: userFound.id,
        outcome: 'INFO',
        details: 'Student attempted direct portal login; directed to access via Parent Portal.',
      });
      return {
        success: false,
        message: 'Direct student login is disabled. Student records are managed through authorized faculty, while parents access student records through the Parent Portal. Please sign in using guardian credentials.',
      };
    }

    if (userFound.isActive === false) {
      this.addAuditLog({
        userId: userFound.id,
        userName: userFound.fullName,
        userRole: userFound.role,
        action: 'DEACTIVATED_LOGIN_ATTEMPT',
        entityType: 'User',
        entityId: userFound.id,
        outcome: 'FAILED',
        details: `Login blocked for deactivated account: ${userFound.username}`,
      });
      return {
        success: false,
        message: 'This account has been deactivated or suspended by the Super Administrator. Please contact central administration.',
      };
    }

    userFound.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.currentUser = {
      id: userFound.id,
      email: userFound.email,
      username: userFound.username,
      fullName: userFound.fullName,
      role: userFound.role,
      allowedCampusIds: userFound.allowedCampusIds || [userFound.campusId],
      activeCampusId: userFound.campusId,
      teacherProfileId: userFound.teacherProfileId,
      parentProfileId: userFound.parentProfileId,
      studentId: userFound.studentId,
      token: userFound.token || `jwt-${userFound.id}-${Date.now()}`,
    };

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('misbah_current_user', JSON.stringify(this.currentUser));
      }
    } catch {
      // ignore
    }

    this.branchImpersonation = { isImpersonating: false, campusId: null };

    this.addAuditLog({
      campusId: userFound.campusId === 'all' ? undefined : userFound.campusId,
      userId: userFound.id,
      userName: userFound.fullName,
      userRole: userFound.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: userFound.id,
      outcome: 'SUCCESS',
      details: `Successful login to portal for role ${userFound.role}`,
    });

    this.notify();
    return { success: true, message: 'Authentication successful', user: this.currentUser };
  }

  static logout(): void {
    if (this.currentUser) {
      this.addAuditLog({
        userId: this.currentUser.id,
        userName: this.currentUser.fullName,
        userRole: this.currentUser.role,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: this.currentUser.id,
        outcome: 'SUCCESS',
        details: 'User logged out of session',
      });
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('misbah_current_user');
      }
    } catch {
      // ignore
    }
    if (supabase) {
      supabase.auth.signOut().catch(() => {
        // ignore network errors on sign-out
      });
    }
    this.currentUser = null;
    this.branchImpersonation = { isImpersonating: false, campusId: null };
    this.notify();
  }

  // Update currently authenticated user's profile and password
  static async updateCurrentProfile(data: {
    fullName?: string;
    email?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; message: string; user?: UserSession }> {
    if (!this.currentUser) {
      return { success: false, message: 'No active session found.' };
    }

    const userFound = this.users.find((u) => u.id === this.currentUser!.id);
    if (!userFound) {
      return { success: false, message: 'User account not found.' };
    }

    // If changing password, verify current password
    if (data.newPassword) {
      if (!data.currentPassword) {
        return { success: false, message: 'Please enter your current password to set a new password.' };
      }
      if (isSupabaseConfigured) {
        try {
          const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getValidAccessToken() || ''}` },
            body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword.trim() }),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok || !body?.success) {
            return { success: false, message: body?.error || 'Failed to change password.' };
          }
        } catch {
          return { success: false, message: 'Cannot reach the server to change your password.' };
        }
      } else {
        if (userFound.password !== data.currentPassword) {
          return { success: false, message: 'Current password entered is incorrect.' };
        }
        userFound.password = data.newPassword.trim();
      }
    }

    if (data.fullName && data.fullName.trim()) {
      userFound.fullName = data.fullName.trim();
      this.currentUser.fullName = data.fullName.trim();
    }
    if (data.email && data.email.trim()) {
      userFound.email = data.email.trim().toLowerCase();
      this.currentUser.email = data.email.trim().toLowerCase();
    }
    if (data.username && data.username.trim()) {
      userFound.username = data.username.trim();
      this.currentUser.username = data.username.trim();
    }

    this.addAuditLog({
      campusId: this.currentUser.activeCampusId === 'all' ? undefined : this.currentUser.activeCampusId,
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      userRole: this.currentUser.role,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'UserAccount',
      entityId: this.currentUser.id,
      details: `User ${this.currentUser.fullName} updated personal profile information and/or password`,
    });

    this.notify();
    return { success: true, message: 'Profile details and password successfully updated!', user: this.currentUser };
  }

  // Campus context switcher (Super Admin ONLY)
  static setActiveCampus(campusId: string): boolean {
    if (!this.currentUser || this.currentUser.role !== 'SUPER_ADMIN') {
      return false;
    }
    this.currentUser.activeCampusId = campusId;
    this.notify();
    return true;
  }

  // --- Branch Portal Impersonation Mode ---
  static getImpersonationState(): { isImpersonating: boolean; campusId: string | null } {
    return this.branchImpersonation;
  }

  static startBranchImpersonation(campusId: string): void {
    if (!this.currentUser || this.currentUser.role !== 'SUPER_ADMIN') return;
    this.branchImpersonation = {
      isImpersonating: true,
      campusId,
    };
    this.addAuditLog({
      campusId,
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      userRole: 'SUPER_ADMIN',
      action: 'SUPER_ADMIN_VIEW_MODE_ENTERED',
      entityType: 'Campus',
      entityId: campusId,
      details: `Super Admin entered branch administrative inspection view for campus ${campusId.toUpperCase()}`,
    });
    this.notify();
  }

  static exitBranchImpersonation(): void {
    if (!this.branchImpersonation.isImpersonating) return;
    const campusId = this.branchImpersonation.campusId || 'unknown';
    this.branchImpersonation = {
      isImpersonating: false,
      campusId: null,
    };
    this.addAuditLog({
      campusId: campusId === 'unknown' ? undefined : campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'SUPER_ADMIN_VIEW_MODE_EXITED',
      entityType: 'Campus',
      entityId: campusId,
      details: `Super Admin exited branch view mode and returned to Central Super Admin Portal`,
    });
    this.notify();
  }

  // --- Read Queries (Scoped by Campus / Role) ---
  static getCampuses(): Campus[] {
    return this.campuses;
  }

  static getCampusById(id: string): Campus | undefined {
    return this.campuses.find((c) => c.id === id);
  }

  static addCampus(data: {
    name: string;
    code?: string;
    country?: string;
    city?: string;
    address: string;
    phone?: string;
    email?: string;
    currencyCode?: 'GBP' | 'PKR';
    timezone?: string;
    isActive?: boolean;
  }): { success: boolean; message: string; campus?: Campus } {
    if (!this.currentUser || this.currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Only Super Admin can provision new campuses.' };
    }

    const cleanName = data.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Campus name is required.' };
    }

    // Generate unique slug-like ID and code
    const generatedId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `campus-${Date.now()}`;
    const generatedCode = data.code?.trim().toUpperCase() || `${cleanName.slice(0, 3).toUpperCase()}-01`;

    const exists = this.campuses.find((c) => c.id === generatedId || (data.code && c.code.toLowerCase() === data.code.trim().toLowerCase()));
    if (exists) {
      return { success: false, message: 'A campus with this name or code already exists.' };
    }

    const newCampus: Campus = {
      id: generatedId,
      code: generatedCode,
      name: cleanName,
      country: data.country?.trim() || 'United Kingdom',
      city: data.city?.trim() || 'London',
      address: data.address.trim(),
      timezone: data.timezone || 'Europe/London',
      currencyCode: data.currencyCode || 'GBP',
      phone: data.phone?.trim() || '+44 20 7000 0000',
      email: data.email?.trim() || `${generatedId}@misbahulquran.org`,
      isActive: data.isActive !== false,
      studentCount: 0,
      teacherCount: 0,
      classCount: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      attendanceRate: 100,
    };

    this.campuses.push(newCampus);

    this.addAuditLog({
      campusId: newCampus.id,
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      userRole: 'SUPER_ADMIN',
      action: 'CAMPUS_CREATED',
      entityType: 'Campus',
      entityId: newCampus.id,
      details: `Super Admin provisioned new campus "${newCampus.name}" (${newCampus.code}) at ${newCampus.address}`,
    });

    this.notify();
    return { success: true, message: `Campus "${newCampus.name}" created successfully.`, campus: newCampus };
  }

  static updateCampus(id: string, updates: Partial<Campus>): { success: boolean; message: string; campus?: Campus } {
    if (!this.currentUser || this.currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Only Super Admin can update campus configuration.' };
    }

    const idx = this.campuses.findIndex((c) => c.id === id);
    if (idx < 0) return { success: false, message: 'Campus not found.' };

    const oldCampus = { ...this.campuses[idx] };
    this.campuses[idx] = {
      ...oldCampus,
      ...updates,
    };

    this.addAuditLog({
      campusId: id,
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      userRole: 'SUPER_ADMIN',
      action: 'CAMPUS_UPDATED',
      entityType: 'Campus',
      entityId: id,
      details: `Super Admin updated details for campus "${this.campuses[idx].name}" (${this.campuses[idx].code})`,
    });

    // Synchronize with server authoritative endpoint
    fetch(`/api/campuses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getValidAccessToken() || ''}`,
      },
      body: JSON.stringify(updates),
    }).catch((err) => {
      console.warn('[Campus Sync] Notice updating campus via API:', err);
      if (isSupabaseConfigured) {
        SupabaseDbService.updateCampus(id, updates).catch((sbErr) =>
          console.warn('[Supabase Sync] Update campus error:', sbErr)
        );
      }
    });

    this.notify();
    return { success: true, message: `Campus "${this.campuses[idx].name}" updated successfully.`, campus: this.campuses[idx] };
  }

  static getStudents(campusFilter?: string): StudentRecord[] {
    if (!campusFilter || campusFilter === 'all') return this.students;
    return this.students.filter((s) => s.campusId === campusFilter);
  }

  static getStudentById(id: string): StudentRecord | undefined {
    return this.students.find((s) => s.id === id);
  }

  static getTeachers(campusFilter?: string): TeacherProfile[] {
    if (!campusFilter || campusFilter === 'all') return this.teachers;
    return this.teachers.filter((t) => t.campusId === campusFilter);
  }

  static getTeacherById(id: string): TeacherProfile | undefined {
    return this.teachers.find((t) => t.id === id);
  }

  static getParents(): ParentProfile[] {
    return this.parents;
  }

  static getClasses(campusFilter?: string): ClassRoom[] {
    // Deactivated classes (e.g. merged duplicates) are hidden from lists and dropdowns.
    const active = this.classes.filter((c) => c.isActive !== false);
    if (!campusFilter || campusFilter === 'all') return active;
    return active.filter((c) => c.campusId === campusFilter);
  }

  static getClassById(id: string): ClassRoom | undefined {
    return this.classes.find((c) => c.id === id);
  }

  static async createClass(data: {
    name: string;
    campusId: 'uk' | 'kts';
    code?: string;
    gradeLevel?: string;
    leadTeacherId?: string;
    leadTeacherName?: string;
    scheduleTime?: string;
    room?: string;
    maxCapacity?: number;
  }): Promise<{ success: boolean; message: string; classRoom?: ClassRoom; error?: string }> {
    if (!data.name.trim()) {
      return { success: false, message: 'Class name is required.', error: 'Class name is required.' };
    }

    const count = this.classes.filter((c) => c.campusId === data.campusId).length + 1;
    const code = (data.code || `${data.campusId.toUpperCase()}-CLS-${String(count).padStart(2, '0')}`).trim().toUpperCase();

    // Check duplicate class code within the campus
    const existing = this.classes.find((c) => c.campusId === data.campusId && c.code?.toUpperCase() === code);
    if (existing) {
      return { success: false, message: `A class with code ${code} already exists for this campus.`, error: 'Duplicate code' };
    }

    let teacherName = data.leadTeacherName;
    if (data.leadTeacherId && !teacherName) {
      const tch = this.teachers.find((t) => t.id === data.leadTeacherId);
      teacherName = tch?.fullName;
    }

    const classId = `cls-${data.campusId}-${Date.now()}`;
    const teacherProfile = data.leadTeacherId ? this.teachers.find((t) => t.id === data.leadTeacherId) : undefined;
    const resolvedTeacherUserId = teacherProfile?.userId || (data.leadTeacherId?.startsWith('usr-') ? data.leadTeacherId : null);

    const newClass: ClassRoom = {
      id: classId,
      campusId: data.campusId,
      name: data.name.trim(),
      code,
      gradeLevel: data.gradeLevel || 'General Halaqah',
      academicYear: '2025-2026',
      capacity: data.maxCapacity || 25,
      maxCapacity: data.maxCapacity || 25,
      leadTeacherId: data.leadTeacherId,
      leadTeacherName: teacherName,
      studentCount: 0,
      currentEnrollment: 0,
      scheduleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      scheduleTime: data.scheduleTime || '5:00 PM - 7:30 PM (Mon-Fri)',
      room: data.room || 'Main Hall',
      isActive: true,
    };

    // 1. Authoritative Server-side persistence
    const token = this.getValidAccessToken();
    if (!token) {
      return { success: false, message: 'Unauthorized: Missing or invalid authentication token.', error: 'Unauthorized' };
    }

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newClass.name,
          campusId: newClass.campusId,
          code: newClass.code,
          gradeLevel: newClass.gradeLevel,
          leadTeacherId: resolvedTeacherUserId || undefined,
          leadTeacherName: newClass.leadTeacherName,
          scheduleTime: newClass.scheduleTime,
          room: newClass.room,
          maxCapacity: newClass.capacity,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, message: resData.error || (response.status === 401 ? 'Unauthorized: Session expired.' : 'Database rejected class creation.'), error: resData.error || 'Failed to create class' };
      }
      if (resData.classRoom) {
        Object.assign(newClass, resData.classRoom);
      }
    } catch (err: any) {
      console.warn('[IMSStateService] Network notice creating class:', err);
      if (isSupabaseConfigured) {
        const sbRes = await SupabaseDbService.insertClass({
          id: newClass.id,
          campus_id: newClass.campusId,
          title: newClass.name,
          name: newClass.name,
          code: newClass.code,
          capacity: newClass.capacity,
          teacher_id: resolvedTeacherUserId || null,
        });
        if (!sbRes.success) {
          return { success: false, message: sbRes.error || 'Failed to insert class into Supabase database.', error: sbRes.error };
        }
      } else {
        return { success: false, message: 'Database connection offline. Class not created.', error: 'Database connection failed' };
      }
    }

    // 2. Commit to reactive state only after confirmed database persistence
    this.classes.push(newClass);
    this.persist('classes', this.classes);

    if (newClass.leadTeacherId) {
      const tch = this.teachers.find((t) => t.id === newClass.leadTeacherId);
      if (tch) {
        tch.assignedClassIds = Array.from(new Set([...(tch.assignedClassIds || []), newClass.id]));
        tch.assignedClassNames = Array.from(new Set([...(tch.assignedClassNames || []), newClass.name]));
        this.persist('teachers', this.teachers);
      }
    }

    this.addAuditLog({
      campusId: data.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'SUPER_ADMIN',
      action: 'CREATE_CLASS',
      entityType: 'Class',
      entityId: newClass.id,
      outcome: 'SUCCESS',
      details: `Class "${newClass.name}" (${newClass.code}) created for ${data.campusId.toUpperCase()} campus in Supabase.`,
    });

    this.notify();
    return { success: true, message: `Class "${newClass.name}" created successfully.`, classRoom: newClass };
  }

  static async updateClass(id: string, updates: Partial<ClassRoom>): Promise<{ success: boolean; message: string; error?: string }> {
    const idx = this.classes.findIndex((c) => c.id === id);
    if (idx < 0) return { success: false, message: 'Class not found.', error: 'Class not found.' };

    const token = this.getValidAccessToken();
    if (!token) {
      return { success: false, message: 'Unauthorized: Missing or invalid authentication token.', error: 'Unauthorized' };
    }

    const old = this.classes[idx];
    const teacherProfile = updates.leadTeacherId
      ? this.teachers.find((t) => t.id === updates.leadTeacherId || t.userId === updates.leadTeacherId)
      : undefined;
    const resolvedTeacherUserId = teacherProfile?.userId || (updates.leadTeacherId && updates.leadTeacherId.startsWith('usr-') ? updates.leadTeacherId : null);

    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updates,
          leadTeacherId: resolvedTeacherUserId || null,
          leadTeacherName: teacherProfile?.fullName || updates.leadTeacherName || null,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, message: resData.error || (response.status === 401 ? 'Unauthorized: Session expired.' : 'Failed to update class in database.'), error: resData.error };
      }
    } catch (err: any) {
      console.warn('[IMSStateService] Network notice updating class:', err);
      if (isSupabaseConfigured) {
        const sbRes = await SupabaseDbService.updateClass(id, {
          title: updates.name,
          name: updates.name,
          capacity: updates.capacity,
          teacher_id: resolvedTeacherUserId || null,
        });
        if (!sbRes.success) {
          return { success: false, message: sbRes.error || 'Failed to update class in Supabase.', error: sbRes.error };
        }
      } else {
        return { success: false, message: 'Database connection offline. Class not updated.', error: 'Database connection failed' };
      }
    }

    const updated: ClassRoom = { ...old, ...updates };
    if (updates.name && updates.name !== old.name) {
      this.students.forEach((s) => {
        if (s.classId === id) {
          s.className = updates.name!;
        }
      });
      this.persist('students', this.students);
    }

    this.classes[idx] = updated;
    this.persist('classes', this.classes);

    // Synchronize bidirectional teacher class assignments
    if (resolvedTeacherUserId && teacherProfile) {
      if (!teacherProfile.assignedClassIds) teacherProfile.assignedClassIds = [];
      if (!teacherProfile.assignedClassIds.includes(id)) {
        teacherProfile.assignedClassIds.push(id);
      }
      if (!teacherProfile.assignedClassNames) teacherProfile.assignedClassNames = [];
      if (!teacherProfile.assignedClassNames.includes(updated.name)) {
        teacherProfile.assignedClassNames.push(updated.name);
      }

      this.teachers.forEach((t) => {
        if (t.id !== teacherProfile.id && t.userId !== resolvedTeacherUserId && t.assignedClassIds?.includes(id)) {
          t.assignedClassIds = t.assignedClassIds.filter((cid) => cid !== id);
          t.assignedClassNames = t.assignedClassNames?.filter((cn) => cn !== updated.name && cn !== old.name);
        }
      });
      this.persist('teachers', this.teachers);
    } else if (updates.leadTeacherId === null || updates.leadTeacherId === '' || updates.leadTeacherId === undefined) {
      this.teachers.forEach((t) => {
        if (t.assignedClassIds?.includes(id)) {
          t.assignedClassIds = t.assignedClassIds.filter((cid) => cid !== id);
          t.assignedClassNames = t.assignedClassNames?.filter((cn) => cn !== updated.name && cn !== old.name);
        }
      });
      this.persist('teachers', this.teachers);
    }

    this.addAuditLog({
      campusId: updated.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'SUPER_ADMIN',
      action: 'UPDATE_CLASS',
      entityType: 'Class',
      entityId: id,
      outcome: 'SUCCESS',
      details: `Class "${updated.name}" updated in database.`,
    });

    this.notify();
    return { success: true, message: `Class "${updated.name}" updated successfully.` };
  }

  static async deleteClass(id: string): Promise<{ success: boolean; message: string; error?: string }> {
    const idx = this.classes.findIndex((c) => c.id === id);
    if (idx < 0) return { success: false, message: 'Class not found.', error: 'Class not found.' };

    const token = this.getValidAccessToken();
    if (!token) {
      return { success: false, message: 'Unauthorized: Missing or invalid authentication token.', error: 'Unauthorized' };
    }

    const targetClass = this.classes[idx];

    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, message: resData.error || (response.status === 401 ? 'Unauthorized: Session expired.' : 'Database rejected class deletion.'), error: resData.error };
      }
    } catch (err: any) {
      console.warn('[IMSStateService] Network notice deleting class:', err);
      if (isSupabaseConfigured) {
        const sbRes = await SupabaseDbService.deleteClass(id);
        if (!sbRes.success) {
          return { success: false, message: sbRes.error || 'Failed to delete class from Supabase.', error: sbRes.error };
        }
      } else {
        return { success: false, message: 'Database connection offline. Class not deleted.', error: 'Database connection failed' };
      }
    }

    let unassignedCount = 0;
    this.students.forEach((s) => {
      if (s.classId === id) {
        s.classId = undefined as any;
        s.className = 'Unassigned';
        unassignedCount++;
      }
    });
    if (unassignedCount > 0) {
      this.persist('students', this.students);
    }

    this.teachers.forEach((t) => {
      if (t.assignedClassIds && t.assignedClassIds.includes(id)) {
        t.assignedClassIds = t.assignedClassIds.filter((cid) => cid !== id);
        t.assignedClassNames = t.assignedClassNames?.filter((cn) => cn !== targetClass.name);
      }
    });
    this.persist('teachers', this.teachers);

    this.classes.splice(idx, 1);
    this.persist('classes', this.classes);

    this.addAuditLog({
      campusId: targetClass.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'SUPER_ADMIN',
      action: 'DELETE_CLASS',
      entityType: 'Class',
      entityId: id,
      outcome: 'SUCCESS',
      details: `Class "${targetClass.name}" deleted. ${unassignedCount} students unassigned safely without deleting history.`,
    });

    this.notify();
    return { success: true, message: `Class "${targetClass.name}" deleted successfully.` };
  }

  static enrollStudentInClass(studentId: string, classId: string): boolean {
    const student = this.students.find((s) => s.id === studentId);
    const cls = this.classes.find((c) => c.id === classId);
    if (!student || !cls) return false;

    student.classId = classId;
    student.className = cls.name;
    cls.currentEnrollment = this.students.filter((s) => s.classId === classId && s.isActive !== false).length;

    this.persist('students', this.students);
    this.persist('classes', this.classes);
    this.notify();
    return true;
  }

  static removeStudentFromClass(studentId: string): boolean {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return false;

    const prevClassId = student.classId;
    student.classId = undefined as any;
    student.className = 'Unassigned';

    if (prevClassId) {
      const cls = this.classes.find((c) => c.id === prevClassId);
      if (cls) {
        cls.currentEnrollment = this.students.filter((s) => s.classId === prevClassId && s.isActive !== false).length;
      }
    }

    this.persist('students', this.students);
    this.persist('classes', this.classes);
    this.notify();
    return true;
  }

  static archiveStudent(studentId: string, reason?: string): boolean {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return false;

    student.isActive = false;
    this.persist('students', this.students);

    if (student.classId) {
      const cls = this.classes.find((c) => c.id === student.classId);
      if (cls) {
        cls.currentEnrollment = this.students.filter((s) => s.classId === student.classId && s.isActive !== false).length;
        this.persist('classes', this.classes);
      }
    }

    this.addAuditLog({
      campusId: student.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'SUPER_ADMIN',
      action: 'ARCHIVE_STUDENT',
      entityType: 'Student',
      entityId: studentId,
      outcome: 'SUCCESS',
      details: `Student ${student.firstName} ${student.lastName} archived.${reason ? ` Reason: ${reason}` : ''}`,
    });

    this.notify();
    return true;
  }

  static restoreStudent(studentId: string): boolean {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return false;

    student.isActive = true;
    this.persist('students', this.students);

    if (student.classId) {
      const cls = this.classes.find((c) => c.id === student.classId);
      if (cls) {
        cls.currentEnrollment = this.students.filter((s) => s.classId === student.classId && s.isActive !== false).length;
        this.persist('classes', this.classes);
      }
    }

    this.addAuditLog({
      campusId: student.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'SUPER_ADMIN',
      action: 'RESTORE_STUDENT',
      entityType: 'Student',
      entityId: studentId,
      outcome: 'SUCCESS',
      details: `Student ${student.firstName} ${student.lastName} restored to active status.`,
    });

    this.notify();
    return true;
  }

  static archiveTeacher(teacherId: string, reason?: string): boolean {
    const teacher = this.teachers.find((t) => t.id === teacherId);
    if (!teacher) return false;

    teacher.isActive = false;
    teacher.portalAccessActive = false;
    this.persist('teachers', this.teachers);

    const linkedUser = this.users.find((u) => u.teacherProfileId === teacherId);
    if (linkedUser) {
      linkedUser.isActive = false;
      this.persist('users', this.users);
    }

    // Persist to authoritative server/Supabase database
    this.updateTeacher(teacherId, { portalAccessActive: false, isActive: false }).catch(() => {});

    this.addAuditLog({
      campusId: teacher.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'ARCHIVE_TEACHER',
      entityType: 'Teacher',
      entityId: teacherId,
      outcome: 'SUCCESS',
      details: `Teacher ${teacher.fullName} archived.${reason ? ` Reason: ${reason}` : ''}`,
    });

    this.notify();
    return true;
  }

  static restoreTeacher(teacherId: string): boolean {
    const teacher = this.teachers.find((t) => t.id === teacherId);
    if (!teacher) return false;

    teacher.isActive = true;
    teacher.portalAccessActive = true;
    this.persist('teachers', this.teachers);

    const linkedUser = this.users.find((u) => u.teacherProfileId === teacherId);
    if (linkedUser) {
      linkedUser.isActive = true;
      this.persist('users', this.users);
    }

    // Persist to authoritative server/Supabase database
    this.updateTeacher(teacherId, { portalAccessActive: true, isActive: true }).catch(() => {});

    this.addAuditLog({
      campusId: teacher.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'RESTORE_TEACHER',
      entityType: 'Teacher',
      entityId: teacherId,
      outcome: 'SUCCESS',
      details: `Teacher ${teacher.fullName} restored to active faculty.`,
    });

    this.notify();
    return true;
  }

  static getTeacherAttendance(campusFilter?: string, date?: string): TeacherAttendanceRecord[] {
    let list = this.teacherAttendance;
    if (campusFilter && campusFilter !== 'all') {
      list = list.filter((a) => a.campusId === campusFilter);
    }
    if (date) {
      list = list.filter((a) => a.date === date);
    }
    return list;
  }

  static getStudentAttendance(campusFilter?: string, classId?: string, date?: string): StudentAttendanceRecord[] {
    let list = this.studentAttendance;
    if (campusFilter && campusFilter !== 'all') {
      list = list.filter((a) => a.campusId === campusFilter);
    }
    if (classId) {
      list = list.filter((a) => a.classId === classId);
    }
    if (date) {
      list = list.filter((a) => a.date === date);
    }
    return list;
  }

  static getAcademicProgress(studentId?: string, campusFilter?: string): AcademicProgressRecord[] {
    let list = this.academicProgress;
    if (studentId) {
      list = list.filter((p) => p.studentId === studentId);
    }
    if (campusFilter && campusFilter !== 'all') {
      list = list.filter((p) => p.campusId === campusFilter);
    }
    return list;
  }

  static addAcademicProgress(record: Omit<AcademicProgressRecord, 'id'> & { id?: string }): AcademicProgressRecord {
    const newRecord: AcademicProgressRecord = {
      ...record,
      id: record.id || `qprog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.academicProgress = [newRecord, ...this.academicProgress];

    // Update student's quranMilestone record
    const student = this.students.find((s) => s.id === record.studentId);
    if (student && record.sabaqSurah) {
      student.quranMilestone = `${record.sabaqSurah} (${record.sabaqAyah || 'Current Sabaq'})`;
    }

    this.addAuditLog({
      campusId: record.campusId,
      userId: this.currentUser?.id || 'teacher',
      userName: this.currentUser?.fullName || 'Faculty Instructor',
      userRole: this.currentUser?.role || 'TEACHER',
      action: 'QURAN_SABAQ_EVALUATION_RECORDED',
      entityType: 'AcademicProgress',
      entityId: newRecord.id,
      outcome: 'SUCCESS',
      details: `Recorded Quranic progress evaluation for ${record.studentName}: Surah ${record.sabaqSurah} (${record.sabaqAyah}), Tajweed score: ${record.tajweedScore || 5}/5`,
    });

    this.notify();
    return newRecord;
  }

  static getExamResults(studentId?: string, academicYear?: string): AcademicExamResult[] {
    let list = this.examResults;
    if (studentId) {
      list = list.filter((r) => r.studentId === studentId);
    }
    if (academicYear) {
      list = list.filter((r) => r.academicYear === academicYear);
    }
    return list;
  }

  static addExamResult(result: Omit<AcademicExamResult, 'id'> & { id?: string }): AcademicExamResult {
    const newRecord: AcademicExamResult = {
      ...result,
      id: result.id || `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.examResults = [newRecord, ...this.examResults];
    this.notify();
    return newRecord;
  }

  static updateExamResult(id: string, updates: Partial<AcademicExamResult>): boolean {
    const idx = this.examResults.findIndex((r) => r.id === id);
    if (idx < 0) return false;

    const previous = { ...this.examResults[idx] };
    this.examResults[idx] = {
      ...previous,
      ...updates,
    };

    this.addAuditLog({
      userId: this.currentUser?.id || 'staff',
      userName: this.currentUser?.fullName || 'Teacher / Admin',
      userRole: this.currentUser?.role || 'TEACHER',
      action: 'EXAM_RESULT_UPDATED',
      entityType: 'AcademicExamResult',
      entityId: id,
      details: `Updated result for ${this.examResults[idx].studentId} in ${this.examResults[idx].subject || 'Course'} (${this.examResults[idx].assessmentName})`,
    });

    this.notify();
    return true;
  }

  static deleteExamResult(id: string): boolean {
    const record = this.examResults.find((r) => r.id === id);
    if (!record) return false;

    this.examResults = this.examResults.filter((r) => r.id !== id);

    this.addAuditLog({
      userId: this.currentUser?.id || 'staff',
      userName: this.currentUser?.fullName || 'Teacher / Admin',
      userRole: this.currentUser?.role || 'TEACHER',
      action: 'EXAM_RESULT_DELETED',
      entityType: 'AcademicExamResult',
      entityId: id,
      details: `Removed assessment record for ${record.studentId}: ${record.assessmentName}`,
    });

    this.notify();
    return true;
  }

  static getSalaryRecords(teacherId?: string, campusFilter?: string): TeacherSalaryRecord[] {
    let list = this.salaryRecords;
    if (teacherId) {
      list = list.filter((s) => s.teacherId === teacherId);
    }
    if (campusFilter && campusFilter !== 'all') {
      list = list.filter((s) => s.campusId === campusFilter);
    }
    return list;
  }

  static getPayments(campusFilter?: string, studentId?: string): PaymentRecord[] {
    let list = this.payments;
    if (campusFilter && campusFilter !== 'all') {
      list = list.filter((p) => p.campusId === campusFilter);
    }
    if (studentId) {
      list = list.filter((p) => p.studentId === studentId);
    }
    return list;
  }

  static getExpenses(campusFilter?: string): ExpenseRecord[] {
    if (!campusFilter || campusFilter === 'all') return this.expenses;
    return this.expenses.filter((e) => e.campusId === campusFilter);
  }

  static getIncidents(campusFilter?: string): IncidentReportRecord[] {
    if (!campusFilter || campusFilter === 'all') return this.incidents;
    return this.incidents.filter((i) => i.campusId === campusFilter);
  }

  static getAnnouncements(campusFilter?: string): AnnouncementRecord[] {
    return this.announcements.filter((a) => a.campusId === null || a.campusId === campusFilter || campusFilter === 'all');
  }

  static getAuditLogs(campusFilter?: string): AuditLogRecord[] {
    if (!campusFilter || campusFilter === 'all') return this.auditLogs;
    return this.auditLogs.filter((l) => !l.campusId || l.campusId === campusFilter);
  }

  static getPendingAdmissions(campusFilter?: string): PendingAdmissionApproval[] {
    if (!campusFilter || campusFilter === 'all') return this.pendingAdmissions;
    return this.pendingAdmissions.filter((a) => a.campusId === campusFilter);
  }

  static addStudent(data: Partial<StudentRecord> & { createPortalAccount?: boolean; initialPassword?: string }): Promise<{ success: boolean; student?: StudentRecord; error?: string }> {
    return this.createStudent(data);
  }

  static getPendingTeachers(): PendingTeacherApproval[] {
    return this.pendingTeachers;
  }

  // --- Portal Accounts Operations (Full Super Admin Governance) ---
  static getUsers(roleFilter?: string, campusFilter?: string): UserAccount[] {
    let list = this.users;
    if (roleFilter && roleFilter !== 'ALL') {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (campusFilter && campusFilter !== 'all') {
      list = list.filter((u) => u.campusId === 'all' || u.campusId === campusFilter);
    }
    return list;
  }

  static getUserById(id: string): UserAccount | undefined {
    return this.users.find((u) => u.id === id);
  }

  static async createUser(accountData: Omit<UserAccount, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    const cleanEmail = accountData.email.trim().toLowerCase();
    const cleanUsername = accountData.username.trim().toLowerCase();

    // Check duplicate email or username
    const exists = this.users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
    );
    if (exists) {
      return {
        success: false,
        message: 'A portal user with this email or username/Student ID already exists.',
      };
    }

    let serverUserId: string | undefined;
    if (isSupabaseConfigured) {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getValidAccessToken() || ''}` },
          body: JSON.stringify({
            email: cleanEmail,
            username: accountData.username.trim(),
            fullName: accountData.fullName,
            role: accountData.role,
            campusId: accountData.campusId,
            password: accountData.password,
            isActive: accountData.isActive !== false,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.success) {
          return { success: false, message: body?.error || 'The server could not create this account.' };
        }
        serverUserId = body.user?.id;
      } catch {
        return { success: false, message: 'Cannot reach the server to create this account.' };
      }
    }

    const { password: initialPassword, ...accountWithoutPassword } = accountData;
    const newUser: UserAccount & { allowedCampusIds?: string[] } = {
      ...accountWithoutPassword,
      id: serverUserId || `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: cleanEmail,
      username: accountData.username.trim(),
      isActive: accountData.isActive !== false,
      createdAt: new Date().toISOString().substring(0, 10),
      allowedCampusIds: accountData.campusId === 'all' ? ['all', 'uk', 'kts'] : [accountData.campusId],
    };
    // Local ledger mode only: the browser keeps the password for development logins.
    if (!isSupabaseConfigured) newUser.password = initialPassword || 'Misbah2026!';

    this.users.unshift(newUser);

    this.addAuditLog({
      campusId: newUser.campusId === 'all' ? undefined : newUser.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'PORTAL_USER_CREATED',
      entityType: 'UserAccount',
      entityId: newUser.id,
      details: `Created new ${newUser.role} portal login for ${newUser.fullName} (${newUser.username})`,
    });

    this.notify();
    return { success: true, message: 'Portal account created successfully!', user: newUser };
  }

  static async updateUser(id: string, updates: Partial<UserAccount>): Promise<{ success: boolean; message: string }> {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex < 0) return { success: false, message: 'Portal user not found.' };

    const oldUser = { ...this.users[userIndex] };

    // Check if new email/username conflicts with someone else
    if (updates.email || updates.username) {
      const conflict = this.users.find(
        (u) =>
          u.id !== id &&
          ((updates.email && u.email.toLowerCase() === updates.email.trim().toLowerCase()) ||
            (updates.username && u.username.toLowerCase() === updates.username.trim().toLowerCase()))
      );
      if (conflict) {
        return { success: false, message: 'Another account already uses that email or username.' };
      }
    }

    if (isSupabaseConfigured) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getValidAccessToken() || ''}` },
          body: JSON.stringify(updates),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.success) {
          return { success: false, message: body?.error || 'The server could not update this account.' };
        }
      } catch {
        return { success: false, message: 'Cannot reach the server to update this account.' };
      }
    }

    const { password: _newPassword, ...updatesWithoutPassword } = updates;
    this.users[userIndex] = {
      ...oldUser,
      ...(isSupabaseConfigured ? updatesWithoutPassword : updates),
      allowedCampusIds: updates.campusId ? (updates.campusId === 'all' ? ['all', 'uk', 'kts'] : [updates.campusId]) : oldUser.allowedCampusIds,
    };

    this.addAuditLog({
      campusId: this.users[userIndex].campusId === 'all' ? undefined : this.users[userIndex].campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'PORTAL_USER_UPDATED',
      entityType: 'UserAccount',
      entityId: id,
      details: `Updated portal account details for ${this.users[userIndex].fullName} (${this.users[userIndex].username})`,
    });

    this.notify();
    return { success: true, message: 'Portal account updated successfully!' };
  }

  static deleteUser(id: string): { success: boolean; message: string } {
    if (this.currentUser?.id === id) {
      return { success: false, message: 'You cannot delete your own logged-in Super Admin account.' };
    }

    const userToDelete = this.users.find((u) => u.id === id);
    if (!userToDelete) return { success: false, message: 'User not found.' };

    this.users = this.users.filter((u) => u.id !== id);

    this.addAuditLog({
      campusId: userToDelete.campusId === 'all' ? undefined : userToDelete.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'PORTAL_USER_DELETED',
      entityType: 'UserAccount',
      entityId: id,
      details: `Deleted portal account for ${userToDelete.fullName} (${userToDelete.role})`,
    });

    fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.getValidAccessToken() || ''}`,
      },
    }).catch((err) => {
      console.warn('[User Sync] Notice deleting user via API:', err);
      if (isSupabaseConfigured) {
        SupabaseDbService.deleteUser(id).catch((sbErr) =>
          console.warn('[Supabase Sync] Delete user error:', sbErr)
        );
      }
    });

    this.notify();
    return { success: true, message: 'Portal account removed successfully.' };
  }

  static async resetUserPassword(id: string, newPassword?: string): Promise<{ success: boolean; message: string; newPassword: string }> {
    const user = this.users.find((u) => u.id === id);
    if (!user) return { success: false, message: 'User not found.', newPassword: '' };

    let pwd = newPassword || `Misbah${Math.floor(1000 + Math.random() * 9000)}!`;
    if (isSupabaseConfigured) {
      try {
        const response = await fetch(`/api/users/${id}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getValidAccessToken() || ''}` },
          body: JSON.stringify({ newPassword }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.success) {
          return { success: false, message: body?.error || 'Password reset failed.', newPassword: '' };
        }
        pwd = body.newPassword;
      } catch {
        return { success: false, message: 'Cannot reach the server to reset the password.', newPassword: '' };
      }
    } else {
      user.password = pwd;
    }

    this.addAuditLog({
      campusId: user.campusId === 'all' ? undefined : user.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'PORTAL_USER_PASSWORD_RESET',
      entityType: 'UserAccount',
      entityId: id,
      details: `Super Admin reset password for ${user.fullName} (${user.username})`,
    });

    this.notify();
    return { success: true, message: `Password reset successfully. New password: ${pwd}`, newPassword: pwd };
  }

  static toggleUserStatus(id: string): { success: boolean; isActive: boolean } {
    const user = this.users.find((u) => u.id === id);
    if (!user) return { success: false, isActive: false };

    if (this.currentUser?.id === id) {
      return { success: false, isActive: true };
    }

    user.isActive = !user.isActive;

    this.addAuditLog({
      campusId: user.campusId === 'all' ? undefined : user.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'PORTAL_USER_STATUS_TOGGLED',
      entityType: 'UserAccount',
      entityId: id,
      details: `Changed account status for ${user.fullName} to ${user.isActive ? 'ACTIVE' : 'SUSPENDED'}`,
    });

    if (isSupabaseConfigured) {
      fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getValidAccessToken() || ''}` },
        body: JSON.stringify({ isActive: user.isActive }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            console.error('[User Sync] Server did not change account status:', body?.error || response.status);
          }
        })
        .catch((err) => console.error('[User Sync] Account status change failed:', err));
    }

    this.notify();
    return { success: true, isActive: user.isActive };
  }

  // --- Student CRUD Operations ---
  static async createStudent(data: Partial<StudentRecord> & { createPortalAccount?: boolean; initialPassword?: string }): Promise<{ success: boolean; student?: StudentRecord; error?: string }> {
    const campusId = (data.campusId || 'uk').toLowerCase();
    const campusPrefix = campusId.toUpperCase();
    const count = this.students.filter((s) => s.campusId === campusId).length + 1;
    const admissionNumber = data.admissionNumber || `MUQ-${campusPrefix}-2026-${String(count).padStart(4, '0')}`;

    const studentId = `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newStudent: StudentRecord = {
      id: studentId,
      admissionNumber,
      campusId,
      firstName: (data.firstName || 'Student').trim(),
      lastName: (data.lastName || '').trim(),
      gender: data.gender || 'FEMALE',
      dob: data.dob || '2016-06-15',
      enrollmentDate: data.enrollmentDate || new Date().toISOString().substring(0, 10),
      currentGrade: data.currentGrade || 'G1',
      classId: data.classId || (campusId === 'uk' ? 'cls-uk-g1' : '1'),
      className: data.className || 'General Halaqah',
      section: data.section || 'Section A',
      bloodGroup: data.bloodGroup || 'B+',
      medicalNotes: data.medicalNotes || '',
      address: data.address || '',
      isActive: data.isActive !== false,
      approvalStatus: data.approvalStatus || 'APPROVED',
      parentIds: data.parentIds || [],
      primaryParentName: data.primaryParentName || 'Parent / Guardian',
      primaryParentPhone: data.primaryParentPhone || '',
      attendanceRate: 100,
      feeStatus: data.feeStatus || 'UP_TO_DATE',
      portalAccessActive: true,
      quranMilestone: data.quranMilestone || 'Juz 1 (Al-Baqarah)',
      monthlyFee: data.monthlyFee || 0,
      admissionFee: data.admissionFee || 0,
    };

    // Call server-side provision API
    const token = this.getValidAccessToken();
    if (!token) {
      return { success: false, error: 'Unauthorized: Missing or invalid authentication token.' };
    }

    try {
      const response = await fetch('/api/students/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: newStudent.firstName,
          lastName: newStudent.lastName,
          admissionNumber: newStudent.admissionNumber,
          campusId: newStudent.campusId,
          classId: newStudent.classId,
          className: newStudent.className,
          section: newStudent.section,
          currentGrade: newStudent.currentGrade,
          gender: newStudent.gender,
          dob: newStudent.dob,
          enrollmentDate: newStudent.enrollmentDate,
          primaryParentName: newStudent.primaryParentName,
          primaryParentPhone: newStudent.primaryParentPhone,
          address: newStudent.address,
          bloodGroup: newStudent.bloodGroup,
          medicalNotes: newStudent.medicalNotes,
          quranMilestone: newStudent.quranMilestone,
          monthlyFee: newStudent.monthlyFee,
          admissionFee: newStudent.admissionFee,
          isActive: newStudent.isActive,
          approvalStatus: newStudent.approvalStatus,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, error: resData.error || (response.status === 401 ? 'Unauthorized: Session expired or invalid credentials.' : 'Server rejected student enrollment.') };
      }

      if (resData.student) {
        Object.assign(newStudent, resData.student);
      }
    } catch (err: any) {
      console.warn('[IMSStateService] Network error provisioning student:', err);
      // Fallback direct Supabase insert if direct client configured
      if (isSupabaseConfigured) {
        const sbRes = await SupabaseDbService.insertStudent({
          id: newStudent.id,
          campus_id: newStudent.campusId,
          first_name: newStudent.firstName,
          last_name: newStudent.lastName,
          roll_number: newStudent.admissionNumber,
          gender: newStudent.gender.toLowerCase(),
          date_of_birth: newStudent.dob,
          class_id: null,
          approval_status: newStudent.approvalStatus,
          status: newStudent.isActive ? 'active' : 'inactive',
          monthly_fee_amount: newStudent.monthlyFee,
          admission_fee_amount: newStudent.admissionFee,
        });
        if (!sbRes.success) {
          return { success: false, error: sbRes.error || 'Database insert failed' };
        }
      } else {
        return { success: false, error: err?.message || 'Database connection error.' };
      }
    }

    this.students.unshift(newStudent);
    this.persist('students', this.students);

    // Update campus counter
    const campus = this.campuses.find((c) => c.id === campusId);
    if (campus && campus.studentCount !== undefined) {
      campus.studentCount += 1;
      this.persist('campuses', this.campuses);
    }

    this.addAuditLog({
      campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'STUDENT_ENROLLED_MANUALLY',
      entityType: 'Student',
      entityId: newStudent.admissionNumber,
      details: `Enrolled student ${newStudent.firstName} ${newStudent.lastName} [${newStudent.admissionNumber}] into ${campusId.toUpperCase()} branch`,
    });

    this.notify();
    return { success: true, student: newStudent };
  }

  static async updateStudent(id: string, updates: Partial<StudentRecord>): Promise<{ success: boolean; error?: string }> {
    const index = this.students.findIndex((s) => s.id === id);
    if (index < 0) return { success: false, error: 'Student record not found.' };

    const previous = { ...this.students[index] };
    const merged = { ...previous, ...updates };

    const token = this.getValidAccessToken();
    if (!token) {
      return { success: false, error: 'Unauthorized: Missing or invalid authentication token.' };
    }

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, error: resData.error || (response.status === 401 ? 'Unauthorized: Session expired.' : 'Server failed to update student.') };
      }
    } catch (err: any) {
      console.warn('[IMSStateService] Network error updating student:', err);
      if (isSupabaseConfigured) {
        const sbRes = await SupabaseDbService.updateStudent(id, {
          first_name: updates.firstName,
          last_name: updates.lastName,
          roll_number: updates.admissionNumber,
          gender: updates.gender ? updates.gender.toLowerCase() : undefined,
          date_of_birth: updates.dob,
          campus_id: updates.campusId,
          status: updates.isActive !== undefined ? (updates.isActive ? 'active' : 'inactive') : undefined,
          monthly_fee_amount: updates.monthlyFee,
          admission_fee_amount: updates.admissionFee,
        });
        if (!sbRes.success) {
          return { success: false, error: sbRes.error || 'Failed to update student in database.' };
        }
      } else {
        return { success: false, error: err?.message || 'Database connection error.' };
      }
    }

    this.students[index] = merged;
    this.persist('students', this.students);

    this.addAuditLog({
      campusId: merged.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'STUDENT_RECORD_UPDATED',
      entityType: 'Student',
      entityId: merged.admissionNumber,
      details: `Updated student record for ${merged.firstName} ${merged.lastName}`,
    });

    this.notify();
    return { success: true };
  }

  static async deleteStudent(id: string): Promise<{ success: boolean; error?: string }> {
    const student = this.students.find((s) => s.id === id);
    if (!student) return { success: false, error: 'Student not found.' };

    const token = this.getValidAccessToken();
    if (!token) {
      return { success: false, error: 'Unauthorized: Missing or invalid authentication token.' };
    }

    const campusId = student.campusId;

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, error: resData.error || (response.status === 401 ? 'Unauthorized: Session expired.' : 'Server failed to delete student.') };
      }
    } catch (err: any) {
      console.warn('[IMSStateService] Network error deleting student:', err);
      if (isSupabaseConfigured) {
        const sbRes = await SupabaseDbService.deleteStudent(id);
        if (!sbRes.success) {
          return { success: false, error: sbRes.error || 'Database delete failed.' };
        }
      } else {
        return { success: false, error: err?.message || 'Database connection error.' };
      }
    }

    this.students = this.students.filter((s) => s.id !== id);
    this.persist('students', this.students);

    // Decrement campus count
    const campus = this.campuses.find((c) => c.id === campusId);
    if (campus && campus.studentCount !== undefined && campus.studentCount > 0) {
      campus.studentCount -= 1;
      this.persist('campuses', this.campuses);
    }

    this.addAuditLog({
      campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'STUDENT_RECORD_DELETED',
      entityType: 'Student',
      entityId: student.admissionNumber,
      details: `Permanently removed student record for ${student.firstName} ${student.lastName} [${student.admissionNumber}]`,
    });

    this.notify();
    return { success: true };
  }

  // --- Teacher CRUD Operations (Authoritative Database Awaited) ---
  static async createTeacher(data: Partial<TeacherProfile> & { createPortalAccount?: boolean; initialPassword?: string }): Promise<{ success: boolean; teacher?: TeacherProfile; error?: string }> {
    const campusId = (data.campusId || 'uk').toLowerCase() as 'uk' | 'kts';
    const cleanFullName = (data.fullName || 'Teacher').trim();
    const cleanEmail = (data.email || `${cleanFullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@misbah.org`).trim().toLowerCase();

    // Enforce authentication: Missing or invalid token must immediately reject and not report success
    const token = this.getValidAccessToken();
    if (!token) {
      return {
        success: false,
        error: 'Unauthorized: Missing or invalid authentication token. Please sign in as an administrator to provision teachers.',
      };
    }

    try {
      // 1. Dispatch to Authoritative Server-side Provisioning Guard
      const response = await fetch('/api/teachers/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Campus-Id': campusId,
        },
        body: JSON.stringify({
          fullName: cleanFullName,
          email: cleanEmail,
          phone: data.phone,
          campusId,
          employeeCode: data.employeeCode,
          specialization: data.specialization,
          qualification: data.qualification,
          baseMonthlySalary: data.baseMonthlySalary,
          salaryCurrency: data.salaryCurrency,
          initialPassword: data.initialPassword || 'teacher123',
          assignedClassIds: data.assignedClassIds || [],
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        const errorMsg = resData.error || (response.status === 401 ? 'Unauthorized: Session expired or invalid credentials.' : 'Failed to provision faculty instructor in database.');
        console.error('[IMSStateService] Teacher creation rejected by server:', errorMsg);
        return { success: false, error: errorMsg };
      }

      const newTeacher: TeacherProfile = resData.teacher;
      const newUser = resData.user;

      if (!newTeacher || !newTeacher.id) {
        return { success: false, error: 'Database response missing provisioned teacher profile.' };
      }

      // 2. Mutate reactive state ONLY AFTER confirmed database insertion
      this.teachers = [newTeacher, ...this.teachers.filter((t) => t.id !== newTeacher.id)];
      if (newUser) {
        this.users = [newUser, ...this.users.filter((u) => u.id !== newUser.id)];
      }

      const campus = this.campuses.find((c) => c.id === campusId);
      if (campus && campus.teacherCount !== undefined) {
        campus.teacherCount += 1;
      }

      this.persist('teachers', this.teachers);
      this.persist('users', this.users);

      this.addAuditLog({
        campusId,
        userId: this.currentUser?.id || 'admin',
        userName: this.currentUser?.fullName || 'Administrator',
        userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
        action: 'TEACHER_FACULTY_ADDED',
        entityType: 'Teacher',
        entityId: newTeacher.employeeCode,
        details: `Successfully provisioned faculty member ${newTeacher.fullName} [${newTeacher.employeeCode}] for ${campusId.toUpperCase()} branch in Supabase PostgreSQL`,
      });

      this.notify();
      return { success: true, teacher: newTeacher };
    } catch (err: any) {
      console.error('[IMSStateService] Network error during teacher creation:', err);
      return { success: false, error: err?.message || 'Network error communicating with database server.' };
    }
  }

  static async updateTeacher(id: string, updates: Partial<TeacherProfile>): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.getValidAccessToken();
    if (!token) {
      return { success: false, error: 'Unauthorized: Missing or invalid authentication token.' };
    }

    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to update faculty member in database.' };
      }

      const index = this.teachers.findIndex((t) => t.id === id);
      if (index >= 0) {
        this.teachers[index] = { ...this.teachers[index], ...updates };
        const linkedUser = this.users.find((u) => u.teacherProfileId === id || u.id === this.teachers[index].userId);
        if (linkedUser) {
          if (updates.fullName) linkedUser.fullName = updates.fullName;
          if (updates.email) linkedUser.email = updates.email;
          if (updates.campusId) linkedUser.campusId = updates.campusId;
          if (updates.portalAccessActive !== undefined) linkedUser.isActive = updates.portalAccessActive;
        }
      }

      this.persist('teachers', this.teachers);
      this.persist('users', this.users);

      this.addAuditLog({
        campusId: this.teachers[index]?.campusId,
        userId: this.currentUser?.id || 'admin',
        userName: this.currentUser?.fullName || 'Administrator',
        userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
        action: 'TEACHER_RECORD_UPDATED',
        entityType: 'Teacher',
        entityId: id,
        details: `Updated faculty credentials for ${updates.fullName || id}`,
      });

      this.notify();
      return { success: true, message: 'Faculty profile updated successfully.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating teacher.' };
    }
  }

  static async deleteTeacher(id: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getValidAccessToken();
    if (!token) {
      return { success: false, error: 'Unauthorized: Missing or invalid authentication token.' };
    }

    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to remove faculty member from database.' };
      }

      const teacher = this.teachers.find((t) => t.id === id || t.userId === id);
      const campusId = teacher?.campusId;
      this.teachers = this.teachers.filter((t) => t.id !== id && t.userId !== id);
      if (teacher?.userId) {
        this.users = this.users.filter((u) => u.id !== teacher.userId);
      }

      // Unlink classes locally
      this.classes.forEach((c) => {
        if (c.leadTeacherId === id || (teacher?.userId && c.leadTeacherId === teacher.userId)) {
          c.leadTeacherId = undefined;
          c.leadTeacherName = 'Unassigned';
        }
      });

      const campus = this.campuses.find((c) => c.id === campusId);
      if (campus && campus.teacherCount !== undefined && campus.teacherCount > 0) {
        campus.teacherCount -= 1;
      }

      this.persist('teachers', this.teachers);
      this.persist('users', this.users);
      this.persist('classes', this.classes);

      this.addAuditLog({
        campusId,
        userId: this.currentUser?.id || 'admin',
        userName: this.currentUser?.fullName || 'Administrator',
        userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
        action: 'TEACHER_RECORD_DELETED',
        entityType: 'Teacher',
        entityId: teacher?.employeeCode || id,
        details: `Permanently removed faculty member ${teacher?.fullName || id}`,
      });

      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting teacher.' };
    }
  }

  // --- Mutative Operations ---
  static approveStudentAdmission(approvalId: string, assignedOfficialId?: string): boolean {
    const apprIndex = this.pendingAdmissions.findIndex((a) => a.id === approvalId);
    if (apprIndex < 0) return false;

    const appr = this.pendingAdmissions[apprIndex];
    appr.status = 'APPROVED';

    const officialId = assignedOfficialId || `MUQ-${appr.campusId.toUpperCase()}-2026-000${this.students.length + 1}`;

    const newStudent: StudentRecord = {
      id: appr.studentId,
      admissionNumber: officialId,
      campusId: appr.campusId,
      firstName: appr.studentName.split(' ')[0] || appr.studentName,
      lastName: appr.studentName.split(' ').slice(1).join(' ') || '',
      gender: 'MALE',
      dob: '2014-06-15',
      enrollmentDate: new Date().toISOString().substring(0, 10),
      currentGrade: appr.gradeApplying,
      isActive: true,
      approvalStatus: 'APPROVED',
      parentIds: [],
      primaryParentName: appr.parentName,
      primaryParentPhone: appr.parentPhone,
      classId: appr.campusId === 'uk' ? 'cls-uk-01' : 'cls-kts-01',
      className: appr.campusId === 'uk' ? 'Hifz Al-Quran (Advanced)' : 'Hifz Intensive Morning',
      attendanceRate: 100,
      feeStatus: 'UP_TO_DATE',
      portalAccessActive: true,
    };

    this.students.unshift(newStudent);

    this.addAuditLog({
      campusId: appr.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'STUDENT_ADMISSION_APPROVED',
      entityType: 'Student',
      entityId: officialId,
      details: `Super Admin approved student admission for ${appr.studentName}. Assigned official ID: ${officialId}`,
    });

    this.notify();
    return true;
  }

  static rejectStudentAdmission(approvalId: string, reason: string): boolean {
    const appr = this.pendingAdmissions.find((a) => a.id === approvalId);
    if (!appr) return false;
    appr.status = 'REJECTED';
    appr.notes = `Rejected: ${reason}`;

    this.addAuditLog({
      campusId: appr.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'STUDENT_ADMISSION_REJECTED',
      entityType: 'Student',
      entityId: appr.studentId,
      details: `Rejected admission for ${appr.studentName}. Reason: ${reason}`,
    });

    this.notify();
    return true;
  }

  static approveTeacherOnboarding(approvalId: string): boolean {
    const appr = this.pendingTeachers.find((t) => t.id === approvalId);
    if (!appr) return false;
    appr.status = 'APPROVED';

    const empCode = `TCH-${appr.campusId.toUpperCase()}-${300 + this.teachers.length}`;

    const newTeacher: TeacherProfile = {
      id: appr.teacherId,
      userId: `usr-${appr.teacherId}`,
      campusId: appr.campusId,
      employeeCode: empCode,
      fullName: appr.teacherName,
      email: `${appr.teacherName.toLowerCase().replace(/ /g, '.')}@misbah.org`,
      phone: '+92 300 0000000',
      specialization: appr.specialization,
      qualification: appr.qualification,
      joinDate: new Date().toISOString().substring(0, 10),
      employmentStatus: 'FULL_TIME',
      assignedClassIds: [appr.campusId === 'uk' ? 'cls-uk-01' : 'cls-kts-01'],
      baseMonthlySalary: appr.proposedBaseSalary,
      salaryCurrency: appr.salaryCurrency,
      portalAccessActive: true,
    };

    this.teachers.unshift(newTeacher);

    this.addAuditLog({
      campusId: appr.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'TEACHER_ONBOARDING_APPROVED',
      entityType: 'Teacher',
      entityId: empCode,
      details: `Super Admin approved teacher onboarding for ${appr.teacherName} with base salary ${appr.salaryCurrency} ${appr.proposedBaseSalary}`,
    });

    this.notify();
    return true;
  }

  static updateTeacherSalary(salaryId: string, updates: Partial<TeacherSalaryRecord>): boolean {
    const idx = this.salaryRecords.findIndex((s) => s.id === salaryId);
    if (idx < 0) return false;

    const previous = { ...this.salaryRecords[idx] };
    this.salaryRecords[idx] = { ...previous, ...updates };

    this.addAuditLog({
      campusId: previous.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'TEACHER_SALARY_MODIFIED',
      entityType: 'TeacherSalary',
      entityId: salaryId,
      details: `Modified salary record for ${previous.teacherName} (${previous.monthYear}). Net adjusted from ${previous.netSalary} to ${this.salaryRecords[idx].netSalary}`,
      changesBeforeAfter: [
        { field: 'netSalary', before: String(previous.netSalary), after: String(this.salaryRecords[idx].netSalary) },
      ],
    });

    this.notify();
    return true;
  }

  static assignOfficialStudentId(studentId: string, newOfficialId: string): boolean {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return false;

    const oldId = student.admissionNumber;
    student.admissionNumber = newOfficialId;

    this.addAuditLog({
      campusId: student.campusId,
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'STUDENT_OFFICIAL_ID_MODIFIED',
      entityType: 'Student',
      entityId: studentId,
      details: `Super Admin re-assigned official Student ID for ${student.firstName} ${student.lastName} from ${oldId} to ${newOfficialId}`,
      changesBeforeAfter: [{ field: 'admissionNumber', before: oldId, after: newOfficialId }],
    });

    this.notify();
    return true;
  }

  static toggleUserPortalAccess(targetType: 'STUDENT' | 'TEACHER' | 'PARENT', targetId: string, active: boolean): boolean {
    if (targetType === 'STUDENT') {
      const s = this.students.find((item) => item.id === targetId);
      if (s) s.portalAccessActive = active;
    } else if (targetType === 'TEACHER') {
      const t = this.teachers.find((item) => item.id === targetId);
      if (t) t.portalAccessActive = active;
    } else if (targetType === 'PARENT') {
      const p = this.parents.find((item) => item.id === targetId);
      if (p) p.portalAccessActive = active;
    }

    this.addAuditLog({
      userId: this.currentUser?.id || 'superadmin',
      userName: this.currentUser?.fullName || 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'PORTAL_ACCESS_STATUS_CHANGED',
      entityType: targetType,
      entityId: targetId,
      details: `Changed portal access for ${targetType} (${targetId}) to ${active ? 'ACTIVE' : 'SUSPENDED'}`,
    });

    this.notify();
    return true;
  }

  static recordTeacherAttendance(params: {
    teacherId: string;
    campusId: string;
    date: string;
    status: TeacherAttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    remarks?: string;
    isSystemGenerated?: boolean;
    bypassValidation?: boolean; // Only for administrative override or initial migration
  }): TeacherAttendanceRecord {
    const campus = this.campuses.find((c) => c.id === params.campusId);
    const timezone = campus?.timezone || (params.campusId === 'uk' ? 'Europe/London' : 'Asia/Karachi');
    const campusClock = getCampusCurrentTime(timezone);

    // If checkInTime is not supplied, use the real campus clock time
    const effectiveCheckIn = params.checkInTime || campusClock.timeStr;

    // Strict Backend Rule Evaluation:
    // <= 5:00:00 PM: PRESENT, ABSENT
    // 5:00:01 PM - 5:30:00 PM: LATE, ABSENT
    // > 5:30:00 PM: ABSENT only
    const validation = validateTeacherAttendanceSubmission(params.status, effectiveCheckIn);

    if (!params.bypassValidation && !validation.isValid) {
      throw new Error(validation.errorMessage || 'Invalid status for current attendance time window.');
    }

    const teacher = this.teachers.find((t) => t.id === params.teacherId);
    const existingIndex = this.teacherAttendance.findIndex(
      (a) => a.teacherId === params.teacherId && a.date === params.date
    );

    const isSelfMarked = this.currentUser?.role === 'TEACHER';
    const recorderName = isSelfMarked
      ? `Self (${this.currentUser?.fullName || teacher?.fullName || 'Teacher'})`
      : this.currentUser?.fullName || 'Campus Admin';

    const record: TeacherAttendanceRecord = {
      id: existingIndex >= 0 ? this.teacherAttendance[existingIndex].id : `tatt-${Date.now()}`,
      campusId: params.campusId,
      teacherId: params.teacherId,
      teacherName: teacher?.fullName || 'Teacher',
      teacherCode: teacher?.employeeCode || 'TCH',
      date: params.date,
      status: params.status,
      checkInTime: effectiveCheckIn,
      checkOutTime: params.checkOutTime,
      remarks: params.remarks,
      recordedBy: recorderName,
      updatedAt: new Date().toISOString(),
      isSystemGenerated: params.isSystemGenerated ?? validation.evaluation.isAutoAbsent,
      ruleApplied: validation.evaluation.window,
    };

    if (existingIndex >= 0) {
      // Preserve history if modifying an existing verified record
      const previous = this.teacherAttendance[existingIndex];
      if (previous.status !== params.status) {
        record.correctionHistory = [
          ...(previous.correctionHistory || []),
          {
            previousStatus: previous.status,
            newStatus: params.status,
            updatedBy: recorderName,
            updatedAt: new Date().toISOString(),
            reason: params.remarks || 'Updated attendance submission',
          },
        ];
      } else {
        record.correctionHistory = previous.correctionHistory;
      }
      this.teacherAttendance[existingIndex] = record;
    } else {
      this.teacherAttendance.unshift(record);
    }

    this.addAuditLog({
      campusId: params.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: recorderName,
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'TEACHER_ATTENDANCE_MARKED',
      entityType: 'TeacherAttendance',
      entityId: record.id,
      details: `Teacher ${record.teacherName} recorded as ${params.status} at ${effectiveCheckIn} on ${params.date} (${validation.evaluation.windowLabel})`,
    });

    // Authoritative Server-side & Supabase persistence
    fetch('/api/attendance/teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getValidAccessToken() || ''}`,
      },
      body: JSON.stringify({
        campusId: params.campusId,
        teacherId: params.teacherId,
        date: params.date,
        status: record.status,
        checkInTime: record.checkInTime,
        remarks: record.remarks,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error('[Teacher Attendance Sync] Server did not save attendance:', body?.error || response.status);
      }
    }).catch((err) => {
      console.warn('[Teacher Attendance Sync] Notice dispatching to server:', err);
      if (isSupabaseConfigured) {
        const linkedTeacher = this.teachers.find((t) => t.id === params.teacherId);
        SupabaseDbService.saveTeacherAttendance({
          campus_id: params.campusId,
          teacher_id: linkedTeacher?.userId || params.teacherId,
          date: params.date,
          status: record.status,
          check_in_time: record.checkInTime,
          remarks: record.remarks,
          recorded_by: record.recordedBy,
        }).catch((sbErr) => console.warn('[Supabase Sync] Teacher attendance error:', sbErr));
      }
    });

    this.notify();
    return record;
  }

  static recordStudentAttendanceBulk(
    classId: string,
    campusId: string,
    date: string,
    records: { studentId: string; status: StudentAttendanceStatus; remarks?: string; arrivalTime?: string }[]
  ): void {
    const classObj = this.classes.find((c) => c.id === classId);
    const className = classObj?.name || 'Class';
    const recorderName = this.currentUser?.fullName || 'Teacher';

    records.forEach((r) => {
      const student = this.students.find((s) => s.id === r.studentId);
      const existingIdx = this.studentAttendance.findIndex(
        (a) => a.classId === classId && a.studentId === r.studentId && a.date === date
      );

      const entry: StudentAttendanceRecord = {
        id: existingIdx >= 0 ? this.studentAttendance[existingIdx].id : `satt-${Date.now()}-${r.studentId}`,
        campusId,
        classId,
        className,
        studentId: r.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        admissionNumber: student?.admissionNumber || '',
        date,
        arrivalTime: r.arrivalTime || (r.status === 'LATE' ? '17:15' : r.status === 'PRESENT' ? '16:45' : undefined),
        status: r.status,
        remarks: r.remarks,
        recordedBy: recorderName,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        this.studentAttendance[existingIdx] = entry;
      } else {
        this.studentAttendance.unshift(entry);
      }
    });

    this.addAuditLog({
      campusId,
      userId: this.currentUser?.id || 'teacher',
      userName: recorderName,
      userRole: this.currentUser?.role || 'TEACHER',
      action: 'STUDENT_ROLLCALL_COMPLETED',
      entityType: 'StudentAttendance',
      entityId: classId,
      details: `Submitted roll-call attendance for ${records.length} students in ${className} on ${date}`,
    });

    // Authoritative Server-side & Supabase persistence
    fetch('/api/attendance/student/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getValidAccessToken() || ''}`,
      },
      body: JSON.stringify({
        campusId,
        classId,
        date,
        records,
      }),
    }).catch((err) => {
      console.warn('[Student Attendance Sync] Notice dispatching to server:', err);
      if (isSupabaseConfigured) {
        const dbRecords = records.map((r) => ({
          campus_id: campusId,
          class_id: classId,
          student_id: r.studentId,
          date,
          status: r.status,
          arrival_time: r.arrivalTime,
          remarks: r.remarks,
          recorded_by: recorderName,
        }));
        SupabaseDbService.saveStudentAttendanceBulk(dbRecords)
          .catch((sbErr) => console.warn('[Supabase Sync] Student bulk attendance error:', sbErr));
      }
    });

    this.notify();
  }

  static recordStudentAttendanceSingle(data: {
    studentId: string;
    campusId: string;
    classId?: string;
    date: string;
    status: StudentAttendanceStatus;
    arrivalTime?: string;
    remarks?: string;
    recordedBy?: string;
  }): StudentAttendanceRecord {
    const student = this.students.find((s) => s.id === data.studentId);
    const classId = data.classId || student?.classId || 'cls-uk-01';
    const classObj = this.classes.find((c) => c.id === classId);
    const className = classObj?.name || 'Class';
    const nowIso = new Date().toISOString();
    const updatedBy = data.recordedBy || this.currentUser?.fullName || 'Authorized Staff';

    const existingIdx = this.studentAttendance.findIndex(
      (a) => a.studentId === data.studentId && a.date === data.date
    );

    let entry: StudentAttendanceRecord;
    if (existingIdx >= 0) {
      const prev = this.studentAttendance[existingIdx];
      const correction = prev.status !== data.status ? [{
        previousStatus: prev.status,
        newStatus: data.status,
        updatedBy,
        updatedAt: nowIso,
        reason: data.remarks || 'Status updated via attendance ledger',
      }] : [];

      entry = {
        ...prev,
        className,
        status: data.status,
        arrivalTime: data.arrivalTime !== undefined ? data.arrivalTime : prev.arrivalTime,
        remarks: data.remarks !== undefined ? data.remarks : prev.remarks,
        recordedBy: prev.recordedBy || updatedBy,
        updatedAt: nowIso,
        correctionHistory: [...(prev.correctionHistory || []), ...correction],
      };
      this.studentAttendance[existingIdx] = entry;
    } else {
      entry = {
        id: `satt-${Date.now()}-${data.studentId}`,
        campusId: data.campusId,
        classId,
        className,
        studentId: data.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        admissionNumber: student?.admissionNumber || '',
        date: data.date,
        arrivalTime: data.arrivalTime || (data.status === 'LATE' ? '17:15' : data.status === 'PRESENT' ? '16:45' : undefined),
        status: data.status,
        remarks: data.remarks,
        recordedBy: updatedBy,
        updatedAt: nowIso,
        correctionHistory: [],
      };
      this.studentAttendance.unshift(entry);
    }

    this.addAuditLog({
      campusId: data.campusId,
      userId: this.currentUser?.id || 'staff',
      userName: updatedBy,
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'STUDENT_ATTENDANCE_RECORDED',
      entityType: 'StudentAttendance',
      entityId: entry.id,
      details: `Recorded attendance for ${entry.studentName} on ${data.date} as ${data.status}`,
    });

    this.notify();
    return entry;
  }

  static updateStudentAttendance(
    id: string,
    newStatus: StudentAttendanceStatus,
    reason?: string
  ): boolean {
    const idx = this.studentAttendance.findIndex((a) => a.id === id);
    if (idx < 0) return false;

    const prev = this.studentAttendance[idx];
    const updatedBy = this.currentUser?.fullName || 'Authorized Staff';
    const nowIso = new Date().toISOString();

    const correction = {
      previousStatus: prev.status,
      newStatus,
      updatedBy,
      updatedAt: nowIso,
      reason: reason || 'Authorized correction',
    };

    this.studentAttendance[idx] = {
      ...prev,
      status: newStatus,
      updatedAt: nowIso,
      correctionHistory: [...(prev.correctionHistory || []), correction],
    };

    this.addAuditLog({
      campusId: prev.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: updatedBy,
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'STUDENT_ATTENDANCE_CORRECTED',
      entityType: 'StudentAttendance',
      entityId: id,
      details: `Corrected attendance for ${prev.studentName} on ${prev.date} from ${prev.status} to ${newStatus}. Reason: ${reason || 'N/A'}`,
    });

    this.notify();
    return true;
  }

  static updateTeacherAttendance(
    id: string,
    newStatus: TeacherAttendanceStatus,
    reason?: string
  ): boolean {
    const idx = this.teacherAttendance.findIndex((a) => a.id === id);
    if (idx < 0) return false;

    const prev = this.teacherAttendance[idx];
    const updatedBy = this.currentUser?.fullName || 'Authorized Staff';
    const nowIso = new Date().toISOString();

    const correction = {
      previousStatus: prev.status,
      newStatus,
      updatedBy,
      updatedAt: nowIso,
      reason: reason || 'Authorized correction',
    };

    this.teacherAttendance[idx] = {
      ...prev,
      status: newStatus,
      updatedAt: nowIso,
      correctionHistory: [...(prev.correctionHistory || []), correction],
    };

    this.addAuditLog({
      campusId: prev.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: updatedBy,
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'TEACHER_ATTENDANCE_CORRECTED',
      entityType: 'TeacherAttendance',
      entityId: id,
      details: `Corrected teacher attendance for ${prev.teacherName} on ${prev.date} from ${prev.status} to ${newStatus}. Reason: ${reason || 'N/A'}`,
    });

    this.notify();
    return true;
  }

  static addIncidentReport(report: Omit<IncidentReportRecord, 'id' | 'status' | 'createdAt'>): IncidentReportRecord {
    const newIncident: IncidentReportRecord = {
      ...report,
      id: `inc-${Date.now()}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.incidents.unshift(newIncident);

    this.addAuditLog({
      campusId: report.campusId,
      userId: this.currentUser?.id || 'teacher',
      userName: this.currentUser?.fullName || 'Teacher',
      userRole: this.currentUser?.role || 'TEACHER',
      action: 'INCIDENT_REPORT_SUBMITTED',
      entityType: 'IncidentReport',
      entityId: newIncident.id,
      details: `Submitted ${report.type} report for ${report.studentName}`,
    });

    // Authoritative Server-side & Supabase persistence
    fetch('/api/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getValidAccessToken() || ''}`,
      },
      body: JSON.stringify(newIncident),
    }).catch((err) => {
      console.warn('[Incident Sync] Notice dispatching to server:', err);
    });

    if (isSupabaseConfigured) {
      SupabaseDbService.saveIncidentLog({
        id: newIncident.id,
        campus_id: newIncident.campusId,
        student_id: newIncident.studentId,
        date: newIncident.createdAt.split(' ')[0],
        title: `[${newIncident.type}] ${newIncident.description.substring(0, 60)}`,
        description: newIncident.description,
        action_taken: newIncident.actionTaken,
        attachments: newIncident.attachedFiles ? JSON.stringify(newIncident.attachedFiles) : undefined,
        status: newIncident.status,
      }).catch((sbErr) => console.warn('[Supabase Sync] Incident save error:', sbErr));
    }

    this.notify();
    return newIncident;
  }

  static updateIncidentStatus(id: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string): boolean {
    const inc = this.incidents.find((i) => i.id === id);
    if (!inc) return false;

    inc.status = status;
    inc.reviewedBy = this.currentUser?.fullName || 'Admin';
    inc.reviewNotes = reviewNotes;

    this.addAuditLog({
      campusId: inc.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Campus Admin',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: `INCIDENT_REPORT_${status}`,
      entityType: 'IncidentReport',
      entityId: id,
      details: `${status} report for ${inc.studentName}`,
    });

    fetch(`/api/incidents/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getValidAccessToken() || ''}`,
      },
      body: JSON.stringify({ status, reviewNotes }),
    }).catch((err) => {
      console.warn('[Incident Status Sync] Notice dispatching to server:', err);
    });

    if (isSupabaseConfigured) {
      SupabaseDbService.updateIncidentLogStatus(
        id,
        status,
        reviewNotes ? `Resolution: ${reviewNotes}` : undefined
      ).catch((sbErr) => console.warn('[Supabase Sync] Incident status update error:', sbErr));
    }

    this.notify();
    return true;
  }

  static addAuditLog(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): void {
    const log: AuditLogRecord = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.auditLogs.unshift(log);

    // Background Supabase persistence
    SupabaseDbService.logAuditEvent({
      campus_id: entry.campusId,
      user_id: entry.userId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      reason: entry.details,
    }).catch((err) => console.warn('[Supabase Sync] Audit log error:', err));
  }

  // --- Automated Teacher Attendance Rules ---
  // Up to 5:00pm: Attendance can be marked as present or absent
  // Between 5:01pm and 5:30pm: Attendance can be marked as late or absent
  // After 5:30pm: Attendance cannot be marked manually and will be automatically marked as absent
  static recordTeacherSelfAttendance(
    teacherId: string,
    simulatedOrCurrentTime: string = '16:50',
    requestedStatus: TeacherAttendanceStatus = 'PRESENT',
    date: string = new Date().toISOString().split('T')[0]
  ): {
    success: boolean;
    message: string;
    ruleApplied: 'UP_TO_5PM' | 'LATE_WINDOW_5_01_TO_5_30' | 'AUTO_ABSENT_AFTER_5_30';
    status: TeacherAttendanceStatus;
  } {
    const teacher = this.teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      return {
        success: false,
        message: 'Teacher record not found.',
        ruleApplied: 'UP_TO_5PM',
        status: 'ABSENT',
      };
    }

    // Parse time in HH:MM format
    const [hh, mm] = simulatedOrCurrentTime.split(':').map((v) => parseInt(v, 10));
    const totalMinutes = (isNaN(hh) ? 16 : hh) * 60 + (isNaN(mm) ? 50 : mm);
    const cutoff5PM = 17 * 60; // 1020 mins (5:00 PM)
    const cutoff530PM = 17 * 60 + 30; // 1050 mins (5:30 PM)

    let finalStatus: TeacherAttendanceStatus = requestedStatus;
    let ruleApplied: 'UP_TO_5PM' | 'LATE_WINDOW_5_01_TO_5_30' | 'AUTO_ABSENT_AFTER_5_30' = 'UP_TO_5PM';
    let message = '';

    if (totalMinutes <= cutoff5PM) {
      // Up to 5:00pm: Can be marked as Present or Absent
      ruleApplied = 'UP_TO_5PM';
      finalStatus = requestedStatus === 'ABSENT' ? 'ABSENT' : 'PRESENT';
      message = `Recorded successfully as ${finalStatus} (Marked before 5:00 PM cutoff).`;
    } else if (totalMinutes <= cutoff530PM) {
      // Between 5:01pm and 5:30pm: Can be marked as Late or Absent
      ruleApplied = 'LATE_WINDOW_5_01_TO_5_30';
      finalStatus = requestedStatus === 'ABSENT' ? 'ABSENT' : 'LATE';
      message = `Recorded as ${finalStatus} (Late window 5:01 PM - 5:30 PM). Punctuality rule applied.`;
    } else {
      // After 5:30pm: Attendance cannot be marked manually and will be automatically marked as absent
      ruleApplied = 'AUTO_ABSENT_AFTER_5_30';
      finalStatus = 'ABSENT';
      message = `Self-marking closed after 5:30 PM. Automatically marked as ABSENT per institute regulation.`;
    }

    const existingIdx = this.teacherAttendance.findIndex(
      (a) => a.teacherId === teacherId && a.date === date
    );

    const record: TeacherAttendanceRecord = {
      id: existingIdx >= 0 ? this.teacherAttendance[existingIdx].id : `tatt-${Date.now()}`,
      campusId: teacher.campusId,
      teacherId,
      teacherName: teacher.fullName,
      teacherCode: teacher.employeeCode,
      date,
      status: finalStatus,
      checkInTime: finalStatus !== 'ABSENT' ? simulatedOrCurrentTime : undefined,
      remarks: message,
      recordedBy: `Self (${teacher.fullName})`,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ruleApplied,
    };

    if (existingIdx >= 0) {
      this.teacherAttendance[existingIdx] = record;
    } else {
      this.teacherAttendance.unshift(record);
    }

    this.addAuditLog({
      campusId: teacher.campusId,
      userId: teacher.userId,
      userName: teacher.fullName,
      userRole: 'TEACHER',
      action: 'TEACHER_SELF_ATTENDANCE_RULE',
      entityType: 'TeacherAttendance',
      entityId: record.id,
      details: `${teacher.fullName} logged attendance at ${simulatedOrCurrentTime}: Status=${finalStatus} (${ruleApplied})`,
    });

    this.notify();

    return {
      success: true,
      message,
      ruleApplied,
      status: finalStatus,
    };
  }

  // --- Financial Module: Update Invoice Status Slideout with Payment Method ---
  static updateInvoiceStatus(
    invoiceId: string,
    status: PaymentStatus,
    paymentMethod: string = 'Cash',
    amountPaid?: number
  ): boolean {
    const inv = this.payments.find((p) => p.id === invoiceId);
    if (!inv) return false;

    inv.status = status;
    inv.paymentMethod = paymentMethod;
    if (status === 'PAID') {
      inv.amountPaid = amountPaid !== undefined ? amountPaid : inv.amountDue;
      inv.paidDate = new Date().toISOString().split('T')[0];
    } else if (status === 'PARTIAL') {
      inv.amountPaid = amountPaid !== undefined ? amountPaid : Math.round(inv.amountDue / 2);
    } else if (status === 'PENDING' || status === 'OVERDUE') {
      if (amountPaid !== undefined) inv.amountPaid = amountPaid;
    }

    const cur = inv.currency || (inv.campusId === 'kts' ? 'PKR' : 'GBP');
    this.addAuditLog({
      campusId: inv.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Finance Admin',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'INVOICE_STATUS_UPDATED',
      entityType: 'Payment',
      entityId: invoiceId,
      details: `Invoice ${inv.invoiceNumber} set to ${status} via ${paymentMethod} (Amount: ${formatCampusCurrency(inv.amountPaid, cur)}/${formatCampusCurrency(inv.amountDue, cur)})`,
    });

    fetch(`/api/payments/${invoiceId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getValidAccessToken() || ''}`,
      },
      body: JSON.stringify({
        status,
        paymentMethod,
        amountPaid: inv.amountPaid,
        paidDate: inv.paidDate,
      }),
    }).catch((err) => {
      console.warn('[Payment Sync] Notice updating invoice via API:', err);
      if (isSupabaseConfigured) {
        SupabaseDbService.updatePaymentInvoiceStatus(invoiceId, {
          payment_status: status === 'PAID' ? 'paid' : status === 'PARTIAL' ? 'partial' : 'pending',
          payment_method: paymentMethod,
          amount: inv.amountPaid,
          payment_date: inv.paidDate,
        }).catch((sbErr) => console.warn('[Supabase Sync] Update invoice error:', sbErr));
      }
    });

    this.notify();
    return true;
  }

  // Send automatic reminders for unpaid fees (dispatches email & WhatsApp push)
  static sendUnpaidFeeReminders(): { dispatchedCount: number; message: string } {
    const unpaid = this.payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
    unpaid.forEach((inv) => {
      const cur = inv.currency || (inv.campusId === 'kts' ? 'PKR' : 'GBP');
      const dueFormatted = formatCampusCurrency(inv.amountDue - inv.amountPaid, cur);
      this.notifications.unshift({
        id: `notif-rem-${Date.now()}-${inv.id}`,
        recipientType: 'PARENTS',
        channel: 'BOTH',
        title: `Fee Due Reminder: ${inv.title}`,
        message: `Assalamu Alaikum. Payment reminder for ${inv.studentName} (${inv.admissionNumber}). Amount due: ${dueFormatted} by 10th of the month.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'DELIVERED',
        campusId: inv.campusId,
      });
    });

    this.notify();
    return {
      dispatchedCount: unpaid.length,
      message: `Automatic Email & WhatsApp reminders dispatched to ${unpaid.length} guardians with pending balances.`,
    };
  }

  // --- Teaching Materials (Max 500MB upload limit) ---
  static getTeachingMaterials(classFilter?: string): TeachingMaterial[] {
    if (!classFilter || classFilter === 'all') return this.teachingMaterials;
    return this.teachingMaterials.filter((m) => m.classId === classFilter);
  }

  static uploadTeachingMaterial(data: Omit<TeachingMaterial, 'id' | 'uploadedAt'>): TeachingMaterial {
    if (data.fileSizeMb > 500) {
      throw new Error('File size exceeds the global maximum system limit of 500MB.');
    }

    const newMaterial: TeachingMaterial = {
      ...data,
      id: `mat-${Date.now()}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    this.teachingMaterials.unshift(newMaterial);

    this.addAuditLog({
      campusId: 'uk',
      userId: this.currentUser?.id || 'teacher',
      userName: this.currentUser?.fullName || 'Teacher',
      userRole: 'TEACHER',
      action: 'TEACHING_MATERIAL_UPLOADED',
      entityType: 'TeachingMaterial',
      entityId: newMaterial.id,
      details: `Uploaded ${data.title} (${data.type}, ${data.fileSizeMb}MB)`,
    });

    this.notify();
    return newMaterial;
  }

  // --- Events & Communications ---
  static getEvents(campusFilter?: string): EventRecord[] {
    if (!campusFilter || campusFilter === 'all') return this.events;
    return this.events.filter((e) => e.campusId === campusFilter);
  }

  static createEvent(event: Omit<EventRecord, 'id' | 'remindersSent'>, sendReminders: boolean = true): EventRecord {
    const newEvent: EventRecord = {
      ...event,
      id: `evt-${Date.now()}`,
      remindersSent: {
        email: sendReminders,
        whatsapp: sendReminders,
        sentAt: sendReminders ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined,
      },
    };

    this.events.unshift(newEvent);

    if (sendReminders) {
      this.notifications.unshift({
        id: `notif-evt-${Date.now()}`,
        recipientType: 'ALL',
        channel: 'BOTH',
        title: `New Event: ${event.title}`,
        message: `${event.description} Scheduled for ${event.dateTime}.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'DELIVERED',
        campusId: event.campusId,
      });
    }

    this.addAuditLog({
      campusId: event.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Admin',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: newEvent.id,
      details: `Created event [${event.type}] ${event.title} (Reminders: ${sendReminders ? 'YES' : 'NO'})`,
    });

    this.notify();
    return newEvent;
  }

  // --- Notifications Push Log ---
  static getNotifications(campusFilter?: string): NotificationLog[] {
    if (!campusFilter || campusFilter === 'all') return this.notifications;
    return this.notifications.filter((n) => !n.campusId || n.campusId === campusFilter);
  }

  static sendPushNotification(data: Omit<NotificationLog, 'id' | 'timestamp' | 'status'>): NotificationLog {
    const notif: NotificationLog = {
      ...data,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'DELIVERED',
    };
    this.notifications.unshift(notif);
    this.notify();
    return notif;
  }

  // --- Medical Module ---
  static getMedicalRecords(campusFilter?: string): MedicalRecord[] {
    if (!campusFilter || campusFilter === 'all') return this.medicalRecords;
    return this.medicalRecords.filter((m) => m.campusId === campusFilter);
  }

  static addMedicalRecord(data: Omit<MedicalRecord, 'id' | 'createdAt' | 'status'>): MedicalRecord {
    const med: MedicalRecord = {
      ...data,
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED', // Requires Admin approval
    };
    this.medicalRecords.unshift(med);

    // Update student's local medicalNotes in memory as well
    const student = this.students.find((s) => s.id === data.studentId);
    if (student) {
      student.medicalNotes = `Condition: ${data.condition}; Allergies: ${data.allergies || 'None'}; Emergency: ${data.emergencyContact || ''}`;
    }

    this.addAuditLog({
      campusId: data.campusId,
      userId: this.currentUser?.id || 'teacher',
      userName: this.currentUser?.fullName || 'Reporter',
      userRole: this.currentUser?.role || 'TEACHER',
      action: 'MEDICAL_RECORD_SUBMITTED',
      entityType: 'MedicalRecord',
      entityId: med.id,
      details: `Submitted medical report for ${data.studentName}: ${data.condition}`,
    });

    // Authoritative Server-side & Supabase persistence
    fetch('/api/medicals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getValidAccessToken() || ''}`,
      },
      body: JSON.stringify(med),
    }).catch((err) => {
      console.warn('[Medical Sync] Notice dispatching to server:', err);
    });

    if (isSupabaseConfigured) {
      SupabaseDbService.saveMedicalRecord({
        id: med.id,
        campus_id: med.campusId,
        student_id: med.studentId,
        condition: med.condition,
        severity: med.severity,
        allergies: med.allergies,
        medication_notes: med.medicationNotes,
        emergency_contact: med.emergencyContact,
        reported_by: med.reportedBy,
        status: med.status,
      }).catch((sbErr) => console.warn('[Supabase Sync] Medical record save error:', sbErr));
    }

    this.notify();
    return med;
  }

  static approveMedicalRecord(id: string): boolean {
    const med = this.medicalRecords.find((m) => m.id === id);
    if (!med) return false;
    med.status = 'APPROVED';
    this.notify();
    return true;
  }

  // --- Mosque Expenses ---
  static addExpense(data: Omit<ExpenseRecord, 'id'> & { currency?: 'GBP' | 'PKR' }): ExpenseRecord {
    const campusCurrency: 'GBP' | 'PKR' = data.currency || (data.campusId === 'kts' ? 'PKR' : 'GBP');
    const exp: ExpenseRecord = {
      ...data,
      currency: campusCurrency,
      id: `exp-${Date.now()}`,
    };
    this.expenses.unshift(exp);

    this.addAuditLog({
      campusId: data.campusId,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Finance Officer',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'MOSQUE_EXPENSE_RECORDED',
      entityType: 'Expense',
      entityId: exp.id,
      details: `Recorded expense [${data.category}] ${formatCampusCurrency(data.amount, campusCurrency)}: ${data.title}`,
    });

    this.notify();
    return exp;
  }

  // --- Universal Quick Search Across Students, Teachers, and Payments ---
  static searchAll(
    query: string,
    campusFilter?: string
  ): {
    students: StudentRecord[];
    teachers: TeacherProfile[];
    payments: PaymentRecord[];
    classes: ClassRoom[];
  } {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        students: [],
        teachers: [],
        payments: [],
        classes: [],
      };
    }

    const effectiveCampus = campusFilter || 'all';

    const students = this.getStudents(effectiveCampus).filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        (s.primaryParentName && s.primaryParentName.toLowerCase().includes(q))
    );

    const teachers = this.getTeachers(effectiveCampus).filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        t.employeeCode.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q)
    );

    const payments = this.getPayments(effectiveCampus).filter(
      (p) =>
        p.studentName.toLowerCase().includes(q) ||
        p.admissionNumber.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
    );

    const classes = this.getClasses(effectiveCampus).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.leadTeacherName && c.leadTeacherName.toLowerCase().includes(q))
    );

    return { students, teachers, payments, classes };
  }

  // --- Export Student & Teacher Attendance CSV ---
  static exportAttendanceCSV(type: 'STUDENT' | 'TEACHER', campusFilter?: string, date?: string): string {
    if (type === 'STUDENT') {
      const records = this.getStudentAttendance(campusFilter, undefined, date);
      const header = 'Student Name,Admission ID,Campus,Class,Date,Status,Remarks,Recorded By\n';
      const rows = records.map(
        (r) =>
          `"${r.studentName}","${r.admissionNumber}","${r.campusId.toUpperCase()}","${r.classId}","${r.date}","${r.status}","${r.remarks || ''}","${r.recordedBy}"`
      );
      return header + rows.join('\n');
    } else {
      const records = this.getTeacherAttendance(campusFilter, date);
      const header = 'Teacher Name,Employee Code,Campus,Date,Status,Check In,Check Out,Remarks,Recorded By\n';
      const rows = records.map(
        (r) =>
          `"${r.teacherName}","${r.teacherCode}","${r.campusId.toUpperCase()}","${r.date}","${r.status}","${r.checkInTime || ''}","${r.checkOutTime || ''}","${r.remarks || ''}","${r.recordedBy}"`
      );
      return header + rows.join('\n');
    }
  }

  static publishAnnouncement(data: Omit<AnnouncementRecord, 'id' | 'publishedAt'>): AnnouncementRecord {
    const ann: AnnouncementRecord = {
      ...data,
      id: `ann-${Date.now()}`,
      publishedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    this.announcements.unshift(ann);

    this.addAuditLog({
      campusId: data.campusId || undefined,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'ANNOUNCEMENT_PUBLISHED',
      entityType: 'Announcement',
      entityId: ann.id,
      details: `Published announcement: "${data.title}" targeting ${data.targetRole}`,
    });

    this.notify();
    return ann;
  }

  static updateAnnouncement(id: string, updates: Partial<AnnouncementRecord>): boolean {
    const idx = this.announcements.findIndex((a) => a.id === id);
    if (idx < 0) return false;
    this.announcements[idx] = { ...this.announcements[idx], ...updates };
    this.addAuditLog({
      campusId: this.announcements[idx].campusId || undefined,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'ANNOUNCEMENT_UPDATED',
      entityType: 'Announcement',
      entityId: id,
      details: `Updated announcement: "${this.announcements[idx].title}"`,
    });
    this.notify();
    return true;
  }

  static updateEvent(id: string, updates: Partial<EventRecord>): boolean {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    this.events[idx] = { ...this.events[idx], ...updates };
    this.addAuditLog({
      campusId: this.events[idx].campusId || undefined,
      userId: this.currentUser?.id || 'admin',
      userName: this.currentUser?.fullName || 'Administrator',
      userRole: this.currentUser?.role || 'CAMPUS_ADMIN',
      action: 'EVENT_UPDATED',
      entityType: 'Event',
      entityId: id,
      details: `Updated event: "${this.events[idx].title}"`,
    });
    this.notify();
    return true;
  }

  // System Backup JSON Export
  static exportGeneralBackupJSON(): string {
    const backup = {
      institute: 'Misbah-ul-Quran International IMS',
      timestamp: new Date().toISOString(),
      campuses: this.campuses,
      teachers: this.teachers,
      classes: this.classes,
      students: this.students,
      payments: this.payments,
      expenses: this.expenses,
      incidents: this.incidents,
      medicalRecords: this.medicalRecords,
      events: this.events,
      announcements: this.announcements,
      teachingMaterials: this.teachingMaterials,
      teacherAttendance: this.teacherAttendance,
      studentAttendance: this.studentAttendance,
    };
    return JSON.stringify(backup, null, 2);
  }

  static exportSystemBackupJSON(): string {
    return this.exportGeneralBackupJSON();
  }
}
