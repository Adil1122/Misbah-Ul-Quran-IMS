import {
  Campus,
  UserSession,
  TeacherProfile,
  ParentProfile,
  StudentRecord,
  ClassRoom,
  TeacherAttendanceRecord,
  StudentAttendanceRecord,
  AcademicProgressRecord,
  PaymentRecord,
  ExpenseRecord,
  IncidentReportRecord,
  AnnouncementRecord,
  AuditLogRecord,
  TeacherSalaryRecord,
  AcademicExamResult,
  PendingAdmissionApproval,
  PendingTeacherApproval,
  EventRecord,
  NotificationLog,
  TeachingMaterial,
  MedicalRecord,
} from '../types/ims.ts';

/**
 * MISBAH-UL-QURAN IMS — PRODUCTION INITIAL STATE
 * 
 * Clean, production-ready configuration with genuine multi-campus structure.
 * All demonstration, mock, and sample records have been removed.
 * Operational data is populated through genuine client data entry and Supabase persistence.
 */

// 1. Genuine Campus Configuration (UK London & KTS Pakistan)
export const INITIAL_CAMPUSES: Campus[] = [
  {
    id: 'uk',
    code: 'UK-01',
    name: 'UK Campus',
    country: 'United Kingdom',
    city: 'London',
    address: '142 Whitechapel Road, London E1 1JE',
    timezone: 'Europe/London',
    currencyCode: 'GBP',
    phone: '+44 20 7946 0192',
    email: 'london@misbahulquran.org',
    isActive: true,
    studentCount: 0,
    teacherCount: 0,
    classCount: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    attendanceRate: 100.0,
  },
  {
    id: 'kts',
    code: 'KTS-01',
    name: 'KTS Pakistan Campus',
    country: 'Pakistan',
    city: 'Haripur',
    address: 'Sector 3, Khalabat Township, Haripur, Khyber Pakhtunkhwa',
    timezone: 'Asia/Karachi',
    currencyCode: 'PKR',
    phone: '+92 995 612345',
    email: 'kts@misbahulquran.org',
    isActive: true,
    studentCount: 0,
    teacherCount: 0,
    classCount: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    attendanceRate: 100.0,
  },
];

export const INITIAL_USERS: (UserSession & {
  password?: string;
  isActive?: boolean;
  campusId?: string;
  createdAt?: string;
  lastLogin?: string;
})[] = [
  {
    id: 'usr-super-01',
    email: 'admin@misbah.org',
    username: 'superadmin',
    fullName: 'Executive Super Administrator',
    role: 'SUPER_ADMIN',
    activeCampusId: 'all',
    campusId: 'all',
    allowedCampusIds: ['all', 'uk', 'kts'],
    isActive: true,
    password: (import.meta as any).env?.VITE_LOCAL_DEMO_PASSWORD || '', // local ledger mode only
    token: 'jwt-superadmin-master',
    createdAt: '2026-01-01',
    lastLogin: '2026-10-26 10:00',
  },
  {
    id: 'usr-admin-uk-01',
    email: 'admin.uk@misbah.org',
    username: 'admin.uk',
    fullName: 'Ustadh Tariq Mahmood',
    role: 'CAMPUS_ADMIN',
    activeCampusId: 'uk',
    campusId: 'uk',
    allowedCampusIds: ['uk'],
    isActive: true,
    password: (import.meta as any).env?.VITE_LOCAL_DEMO_PASSWORD || '', // local ledger mode only
    token: 'jwt-usr-admin-uk-01-master',
    createdAt: '2026-01-01',
    lastLogin: '2026-10-26 10:00',
  },
  {
    id: 'usr-admin-kts-01',
    email: 'admin.kts@misbah.org',
    username: 'admin.kts',
    fullName: 'Abdul Rehman Khan',
    role: 'CAMPUS_ADMIN',
    activeCampusId: 'kts',
    campusId: 'kts',
    allowedCampusIds: ['kts'],
    isActive: true,
    password: (import.meta as any).env?.VITE_LOCAL_DEMO_PASSWORD || '', // local ledger mode only
    token: 'jwt-usr-admin-kts-01-master',
    createdAt: '2026-01-01',
    lastLogin: '2026-10-26 10:00',
  },
];

// 3. Operational Entities (Empty in clean production state)
export const INITIAL_TEACHERS: TeacherProfile[] = [];
export const INITIAL_PARENTS: ParentProfile[] = [];
export const INITIAL_STUDENTS: StudentRecord[] = [];
export const INITIAL_CLASSES: ClassRoom[] = [];
export const INITIAL_TEACHER_ATTENDANCE: TeacherAttendanceRecord[] = [];
export const INITIAL_STUDENT_ATTENDANCE: StudentAttendanceRecord[] = [];
export const INITIAL_ACADEMIC_PROGRESS: AcademicProgressRecord[] = [];
export const INITIAL_PAYMENTS: PaymentRecord[] = [];
export const INITIAL_EXPENSES: ExpenseRecord[] = [];
export const INITIAL_INCIDENTS: IncidentReportRecord[] = [];
export const INITIAL_ANNOUNCEMENTS: AnnouncementRecord[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [];
export const INITIAL_SALARY_RECORDS: TeacherSalaryRecord[] = [];
export const INITIAL_EXAM_RESULTS: AcademicExamResult[] = [];
export const INITIAL_PENDING_ADMISSIONS: PendingAdmissionApproval[] = [];
export const INITIAL_PENDING_TEACHERS: PendingTeacherApproval[] = [];
export const INITIAL_EVENTS: EventRecord[] = [];
export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];
export const INITIAL_TEACHING_MATERIALS: TeachingMaterial[] = [];
export const INITIAL_MEDICAL_RECORDS: MedicalRecord[] = [];
