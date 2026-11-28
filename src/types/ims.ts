// Misbah-ul-Quran International — Core Domain Types & DTO Contracts

export type UserRole = 'SUPER_ADMIN' | 'CAMPUS_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type Gender = 'MALE' | 'FEMALE';

export type StudentAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type TeacherAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTION_REQUIRED';

export type EventType = 'EXAM' | 'COMPETITION' | 'PARENT_MEETING' | 'PAST_EVENT';

export interface DocumentAttachment {
  id: string;
  name: string;
  sizeMb: number;
  type: string;
  uploadedAt: string;
  url?: string;
  category?: string;
  mimeType?: string;
  sizeBytes?: number;
  storagePath?: string;
  storageBucket?: string;
  uploadedBy?: string;
  uploaderRole?: string;
  campusId?: string;
  entityType?: string;
  entityId?: string;
  /** false for records imported from the old system whose file was never moved to Storage. */
  fileAvailable?: boolean;
}

export interface TeachingMaterial {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'AUDIO' | 'SYLLABUS';
  classId?: string;
  className?: string;
  teacherId: string;
  teacherName: string;
  fileSizeMb: number; // Max 500MB supported
  fileName: string;
  description: string;
  uploadedAt: string;
}

export interface EventRecord {
  id: string;
  type: EventType;
  title: string;
  classId?: string; // Optional for class-specific exams
  className?: string;
  dateTime: string;
  description: string;
  remindersSent: {
    email: boolean;
    whatsapp: boolean;
    sentAt?: string;
  };
  campusId: string;
}

export interface NotificationLog {
  id: string;
  recipientType: 'PARENTS' | 'TEACHERS' | 'ALL';
  channel: 'EMAIL' | 'WHATSAPP' | 'BOTH';
  title: string;
  message: string;
  timestamp: string;
  status: 'DELIVERED' | 'SENT';
  campusId?: string;
}

export interface Campus {
  id: string;
  code: string; // 'UK-01', 'KTS-01'
  name: string; // 'UK Campus', 'KTS Pakistan Campus'
  country: string;
  city: string;
  address: string;
  timezone: string; // 'Europe/London', 'Asia/Karachi'
  currencyCode: 'GBP' | 'PKR';
  phone: string;
  email: string;
  isActive: boolean;
  studentCount?: number;
  teacherCount?: number;
  classCount?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  monthlySavings?: number;
  attendanceRate?: number;
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  campusId: string; // 'uk', 'kts', or 'all'
  isActive: boolean;
  password?: string;
  studentId?: string;
  teacherProfileId?: string;
  parentProfileId?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserSession {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  allowedCampusIds: string[]; // For Super Admin: ['all', 'uk', 'kts']; For others: ['uk'] or ['kts']
  activeCampusId: string; // Currently active campus context
  teacherProfileId?: string;
  parentProfileId?: string;
  studentId?: string;
  token?: string;
}

export interface TeacherTransferHistory {
  fromCampusId: string;
  fromCampusName: string;
  toCampusId: string;
  toCampusName: string;
  transferDate: string;
  reason: string;
}

export interface TeacherSalaryRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  campusId: string;
  monthYear: string; // e.g. "October 2026"
  payPeriod?: string; // e.g. "Week Ending Friday 09 Oct 2026"
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  currency: 'GBP' | 'PKR';
  paymentStatus: 'PAID' | 'PENDING';
  paymentDate?: string; // Paid on Friday
  paidDate?: string;
  baseSalary?: number;
  status?: string;
  paymentMethod: 'CASH' | string;
  auditId: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  campusId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  joinDate: string;
  employmentStatus: 'FULL_TIME' | 'PART_TIME' | 'VISITING';
  assignedClassIds: string[];
  assignedSubjects?: string[];
  transferHistory?: TeacherTransferHistory[];
  baseMonthlySalary?: number;
  weeklySalary?: number;
  salaryCurrency?: 'GBP' | 'PKR';
  paymentMethod?: 'CASH' | string;
  lastPaymentDate?: string;
  portalAccessActive?: boolean;
  isActive?: boolean;
  assignedClassNames?: string[];
  teachingMaterials?: TeachingMaterial[];
  documents?: DocumentAttachment[];
}

export interface ParentProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  cnicOrId: string;
  occupation: string;
  address: string;
  linkedStudentIds: string[];
  portalAccessActive?: boolean;
}

export interface StudentAcademicHistory {
  academicYear: string; // e.g. "2023-2024", "2024-2025", "2025-2026"
  className: string;
  campusId: string;
  leadTeacherName: string;
  attendanceRate: number;
  termExamAverage: number;
  quranProgressSummary: string;
  conductRemarks: string;
}

export interface AcademicExamResult {
  id: string;
  studentId: string;
  academicYear: string;
  classId: string;
  className: string;
  subject: string;
  assessmentName: string; // "Term 1 Final Exam", "Midterm Assessment"
  examTitle?: string;
  date?: string;
  marksObtained: number;
  maxMarks: number;
  totalMarks?: number;
  grade: string; // "A+", "A", "B", "C"
  teacherName: string;
  examDate: string;
  remarks?: string;
  auditNotes?: string;
}

export interface StudentRecord {
  id: string;
  admissionNumber: string; // Official Permanent ID e.g. 'MUQ-UK-2026-0001'
  campusId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  dateOfBirth?: string;
  enrollmentDate: string;
  currentGrade: string; // e.g. 'Hifz Level 2', 'Nazra Grade 3'
  bloodGroup?: string;
  medicalNotes?: string;
  address?: string;
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  entryMode?: 'ONLINE' | 'OFFLINE';
  hasSiblingDiscount?: boolean; // £25 fee exception for 10 students
  monthlyFee?: number; // £30 standard, £25 sibling discount
  admissionFee?: number; // £15 standard
  parentIds: string[];
  primaryParentName?: string;
  primaryParentPhone?: string;
  primaryParentEmail?: string;
  classId: string;
  className?: string;
  section?: string;
  attendanceRate?: number; // e.g. 96 (%)
  quranMilestone?: string;
  feeStatus?: 'UP_TO_DATE' | 'PARTIAL' | 'OVERDUE' | 'PENDING';
  portalAccessActive?: boolean;
  history?: StudentAcademicHistory[];
  documents?: DocumentAttachment[]; // IDs, Birth certificates, up to 500MB
}

export interface ClassRoom {
  id: string;
  campusId: string;
  name: string;
  code?: string;
  section?: string;
  gradeLevel?: string;
  academicYear: string;
  capacity: number;
  maxCapacity?: number;
  leadTeacherId?: string;
  leadTeacherName?: string;
  studentCount: number;
  currentEnrollment?: number;
  scheduleDays: string[];
  scheduleTime: string;
  room?: string;
  isActive?: boolean;
}

export interface TeacherAttendanceRecord {
  id: string;
  campusId: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  date: string; // YYYY-MM-DD
  status: TeacherAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  recordedBy: string;
  updatedAt: string;
  isSystemGenerated?: boolean;
  ruleApplied?: 'UP_TO_5PM' | 'LATE_WINDOW_5_01_TO_5_30' | 'AUTO_ABSENT_AFTER_5_30';
  correctionHistory?: {
    previousStatus: TeacherAttendanceStatus;
    newStatus: TeacherAttendanceStatus;
    updatedBy: string;
    updatedAt: string;
    reason?: string;
  }[];
}

export interface StudentAttendanceRecord {
  id: string;
  campusId: string;
  classId: string;
  className?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  date: string; // YYYY-MM-DD
  arrivalTime?: string;
  status: StudentAttendanceStatus;
  remarks?: string;
  recordedBy: string;
  updatedAt?: string;
  correctionHistory?: {
    previousStatus: StudentAttendanceStatus;
    newStatus: StudentAttendanceStatus;
    updatedBy: string;
    updatedAt: string;
    reason?: string;
  }[];
}

export interface AcademicProgressRecord {
  id: string;
  studentId: string;
  studentName: string;
  campusId: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  date: string;
  sabaqSurah?: string;
  sabaqAyah?: string;
  sabqiJuz?: string;
  manzilJuz?: string;
  tajweedScore?: number; // 1 to 5
  subject?: string;
  score?: number;
  maxScore?: number;
  feedback?: string;
}

export interface PaymentRecord {
  id: string;
  campusId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  invoiceNumber: string;
  title: string;
  amountDue: number; // £30 standard, £25 sibling discount, £15 admission
  amountPaid: number;
  currency: 'GBP' | 'PKR';
  status: PaymentStatus;
  dueDate: string; // Due 10th of each month
  paidDate?: string;
  paymentMethod?: 'Cash' | 'Online' | 'Direct Debit' | 'Bank Transfer (SumUp)' | string;
  hasSiblingDiscount?: boolean;
}

export interface ExpenseRecord {
  id: string;
  campusId: string;
  category: 'UTILITIES' | 'MAINTENANCE' | 'EVENTS' | 'SALARIES' | 'EDUCATIONAL_MATERIALS' | 'FACILITIES';
  title: string;
  amount: number;
  currency: 'GBP' | 'PKR';
  date: string;
  approvedBy: string;
  receiptNumber?: string;
}

export interface IncidentReportRecord {
  id: string;
  campusId: string;
  studentId: string;
  studentName: string;
  reporterId: string;
  reporterName: string;
  reportedByName?: string;
  type: 'BEHAVIORAL' | 'ACADEMIC' | 'MEDICAL' | 'INJURY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  actionTaken?: string;
  status: ReportStatus; // SUBMITTED requires Admin approval
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  attachedFiles?: DocumentAttachment[]; // e.g. Disciplinary letters, up to 500MB
}

export interface MedicalRecord {
  id: string;
  campusId: string;
  studentId: string;
  studentName: string;
  condition: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  allergies?: string;
  medicationNotes?: string;
  emergencyContact?: string;
  status: ReportStatus;
  reportedBy: string;
  createdAt: string;
}

export interface AnnouncementRecord {
  id: string;
  campusId: string | null; // null for Global
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT';
  targetRole: 'ALL' | 'TEACHERS' | 'PARENTS' | 'CAMPUS_ADMINS';
  publishedAt: string;
}

export interface AuditLogRecord {
  id: string;
  campusId?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress?: string;
  details?: string;
  outcome?: 'SUCCESS' | 'FAILED' | 'INFO';
  changesBeforeAfter?: {
    field: string;
    before: string;
    after: string;
  }[];
}

// Approval Queues for Central Super Admin Governance
export interface PendingAdmissionApproval {
  id: string;
  studentId: string;
  studentName: string;
  temporaryReference: string;
  campusId: string;
  campusName: string;
  gradeApplying: string;
  level?: string;
  dateOfBirth?: string;
  submissionDate: string;
  submittedAt?: string;
  submissionSource?: string;
  submittedByAdminName: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  status: ApprovalStatus;
  notes?: string;
}

export interface PendingTeacherApproval {
  id: string;
  teacherId: string;
  teacherName: string;
  campusId: string;
  campusName: string;
  specialization: string;
  qualification: string;
  proposedBaseSalary: number;
  salaryCurrency: 'GBP' | 'PKR';
  submissionDate: string;
  submittedByAdminName: string;
  status: ApprovalStatus;
  notes?: string;
}
