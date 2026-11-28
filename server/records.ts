/**
 * Supabase-backed storage for the app collections that are edited record-by-record
 * in the browser (expenses, exam results, Quran progress, announcements, events,
 * notifications, teaching materials, salary records, medical records).
 *
 * Each collection is described once: its table, how an app record maps to a row
 * and back, who may write it, and which campus it belongs to. The generic
 * POST/DELETE /api/records/:collection routes and the state loader both use these
 * definitions, so reads and writes can never drift apart.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type Role = 'SUPER_ADMIN' | 'CAMPUS_ADMIN' | 'TEACHER' | 'PARENT';

export interface RecordUser {
  id: string;
  role: Role;
  allowedCampusIds: string[];
  activeCampusId: string;
  fullName?: string;
}

/** Name/ID lookups shared by all mappers (loaded once per request). */
export interface Lookups {
  userName: Map<string, string>;
  userIdByProfileId: Map<string, string>;
  profileIdByUserId: Map<string, string>;
  student: Map<string, { name: string; campusId: string; classId: string | null }>;
  className: Map<string, { name: string; campusId: string }>;
}

export async function loadLookups(sb: SupabaseClient): Promise<Lookups> {
  const [users, profiles, students, classes] = await Promise.all([
    sb.from('users').select('id, first_name, last_name, email'),
    sb.from('teacher_profiles').select('id, teacher_id'),
    sb.from('students').select('id, first_name, last_name, campus_id, class_id'),
    sb.from('classes').select('id, name, campus_id'),
  ]);
  for (const r of [users, profiles, students, classes]) {
    if (r.error) throw new Error(`Lookup load failed: ${r.error.message}`);
  }
  const fullName = (u: any) => `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || u.id;
  return {
    userName: new Map((users.data || []).map((u: any) => [u.id, fullName(u)])),
    userIdByProfileId: new Map((profiles.data || []).map((p: any) => [p.id, p.teacher_id])),
    profileIdByUserId: new Map((profiles.data || []).map((p: any) => [p.teacher_id, p.id])),
    student: new Map((students.data || []).map((s: any) => [s.id, { name: fullName(s), campusId: s.campus_id, classId: s.class_id }])),
    className: new Map((classes.data || []).map((c: any) => [c.id, { name: c.name, campusId: c.campus_id }])),
  };
}

const ADMINS: Role[] = ['SUPER_ADMIN', 'CAMPUS_ADMIN'];
const STAFF: Role[] = ['SUPER_ADMIN', 'CAMPUS_ADMIN', 'TEACHER'];

const nz = (v: any) => (v === undefined || v === '' ? null : v);
const num = (v: any, d = 0) => (v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const dateOnly = (v: any) => (v ? String(v).substring(0, 10) : null);
const stamp = (v: any) => (v ? String(v).replace('T', ' ').substring(0, 19) : '');
/** Teacher ids in the app are teacher_profiles ids; the database references users. */
const teacherUserId = (lk: Lookups, id: any) => (id ? lk.userIdByProfileId.get(String(id)) || String(id) : null);
const teacherProfileId = (lk: Lookups, id: any) => (id ? lk.profileIdByUserId.get(String(id)) || String(id) : '');

export interface CollectionDef {
  table: string;
  writeRoles: Role[];
  deleteRoles: Role[];
  /** Campus the record belongs to (null = global, allowed only for SUPER_ADMIN). */
  campusOf: (rec: any, lk: Lookups) => string | null;
  toRow: (rec: any, lk: Lookups, user: RecordUser) => Record<string, any>;
  fromRow: (row: any, lk: Lookups) => any;
  orderBy?: { column: string; ascending: boolean };
}

export const COLLECTIONS: Record<string, CollectionDef> = {
  expenses: {
    table: 'expense_logs',
    writeRoles: ADMINS,
    deleteRoles: ADMINS,
    campusOf: (r) => r.campusId,
    toRow: (r, _lk, user) => ({
      id: r.id, campus_id: r.campusId, category: String(r.category || 'FACILITIES').toUpperCase(), title: r.title,
      amount: num(r.amount), currency: String(r.currency || (r.campusId === 'kts' ? 'PKR' : 'GBP')).toUpperCase(),
      date: dateOnly(r.date) || new Date().toISOString().substring(0, 10), approved_by: nz(r.approvedBy),
      receipt_number: nz(r.receiptNumber), created_by: user.id,
    }),
    fromRow: (row) => ({
      id: row.id, campusId: row.campus_id, category: row.category, title: row.title, amount: Number(row.amount),
      currency: row.currency, date: row.date, approvedBy: row.approved_by || '', receiptNumber: row.receipt_number || undefined,
    }),
    orderBy: { column: 'date', ascending: false },
  },

  examResults: {
    table: 'exam_results',
    writeRoles: STAFF,
    deleteRoles: STAFF,
    campusOf: (r, lk) => r.campusId || lk.student.get(r.studentId)?.campusId || lk.className.get(r.classId)?.campusId || null,
    toRow: (r, lk) => ({
      id: r.id, campus_id: r.campusId || lk.student.get(r.studentId)?.campusId || lk.className.get(r.classId)?.campusId,
      student_id: r.studentId, academic_year: r.academicYear || '2025-2026', class_id: nz(r.classId),
      subject: r.subject || 'Quran', assessment_name: r.assessmentName || r.examTitle || 'Assessment',
      exam_title: nz(r.examTitle), marks_obtained: num(r.marksObtained), max_marks: num(r.maxMarks ?? r.totalMarks, 100),
      grade: nz(r.grade), teacher_name: nz(r.teacherName), exam_date: dateOnly(r.examDate || r.date) || new Date().toISOString().substring(0, 10),
      remarks: nz(r.remarks), audit_notes: nz(r.auditNotes),
    }),
    fromRow: (row, lk) => ({
      id: row.id, studentId: row.student_id, academicYear: row.academic_year, classId: row.class_id || '',
      className: lk.className.get(row.class_id)?.name || '', subject: row.subject, assessmentName: row.assessment_name,
      examTitle: row.exam_title || undefined, date: row.exam_date, marksObtained: Number(row.marks_obtained),
      maxMarks: Number(row.max_marks), totalMarks: Number(row.max_marks), grade: row.grade || '', teacherName: row.teacher_name || '',
      examDate: row.exam_date, remarks: row.remarks || undefined, auditNotes: row.audit_notes || undefined, campusId: row.campus_id,
    }),
    orderBy: { column: 'exam_date', ascending: false },
  },

  academicProgress: {
    table: 'academic_progress',
    writeRoles: STAFF,
    deleteRoles: ADMINS,
    campusOf: (r, lk) => r.campusId || lk.student.get(r.studentId)?.campusId || null,
    toRow: (r, lk, user) => ({
      id: r.id, campus_id: r.campusId || lk.student.get(r.studentId)?.campusId, student_id: r.studentId,
      // The teacher who recorded the progress (defaults to the signed-in user).
      class_id: nz(r.classId), teacher_id: teacherUserId(lk, r.teacherId) || user.id, date: dateOnly(r.date) || new Date().toISOString().substring(0, 10),
      sabaq_surah: nz(r.sabaqSurah), sabaq_ayah: nz(r.sabaqAyah), sabqi_juz: nz(r.sabqiJuz), manzil_juz: nz(r.manzilJuz),
      tajweed_score: r.tajweedScore ? Math.min(5, Math.max(1, Math.round(Number(r.tajweedScore)))) : null,
      subject: nz(r.subject), score: r.score ?? null, max_score: r.maxScore ?? null, feedback: nz(r.feedback),
    }),
    fromRow: (row, lk) => ({
      id: row.id, studentId: row.student_id, studentName: lk.student.get(row.student_id)?.name || 'Student',
      campusId: row.campus_id, classId: row.class_id || '', teacherId: teacherProfileId(lk, row.teacher_id),
      teacherName: lk.userName.get(row.teacher_id) || '', date: row.date, sabaqSurah: row.sabaq_surah || undefined,
      sabaqAyah: row.sabaq_ayah || undefined, sabqiJuz: row.sabqi_juz || undefined, manzilJuz: row.manzil_juz || undefined,
      tajweedScore: row.tajweed_score ?? undefined, subject: row.subject || undefined,
      score: row.score === null ? undefined : Number(row.score), maxScore: row.max_score === null ? undefined : Number(row.max_score),
      feedback: row.feedback || undefined,
    }),
    orderBy: { column: 'date', ascending: false },
  },

  announcements: {
    table: 'announcements',
    writeRoles: ADMINS,
    deleteRoles: ADMINS,
    campusOf: (r) => (r.campusId && r.campusId !== 'all' ? r.campusId : null),
    toRow: (r, _lk, user) => ({
      id: r.id, campus_id: r.campusId && r.campusId !== 'all' ? r.campusId : null, title: r.title, content: r.content,
      priority: String(r.priority || 'NORMAL').toUpperCase(), target_role: String(r.targetRole || 'ALL').toUpperCase(),
      published_at: r.publishedAt ? new Date(String(r.publishedAt).replace(' ', 'T') + (String(r.publishedAt).includes('Z') ? '' : 'Z')).toISOString() : new Date().toISOString(),
      created_by: user.id,
    }),
    fromRow: (row) => ({
      id: row.id, campusId: row.campus_id, title: row.title, content: row.content, priority: row.priority,
      targetRole: row.target_role, publishedAt: stamp(row.published_at),
    }),
    orderBy: { column: 'published_at', ascending: false },
  },

  events: {
    table: 'event_announcements',
    writeRoles: ADMINS,
    deleteRoles: ADMINS,
    campusOf: (r) => r.campusId,
    toRow: (r) => ({
      id: r.id, campus_id: r.campusId, type: String(r.type || 'EXAM').toUpperCase(), title: r.title, class_id: nz(r.classId),
      date_time: r.dateTime ? new Date(String(r.dateTime).replace(' ', 'T')).toISOString() : new Date().toISOString(),
      description: nz(r.description), reminders_sent: r.remindersSent || { email: false, whatsapp: false },
    }),
    fromRow: (row, lk) => ({
      id: row.id, type: row.type, title: row.title, classId: row.class_id || undefined,
      className: row.class_id ? lk.className.get(row.class_id)?.name : undefined,
      dateTime: stamp(row.date_time), description: row.description || '', remindersSent: row.reminders_sent || { email: false, whatsapp: false },
      campusId: row.campus_id,
    }),
    orderBy: { column: 'date_time', ascending: false },
  },

  notifications: {
    table: 'notification_logs',
    writeRoles: STAFF,
    deleteRoles: ADMINS,
    campusOf: (r) => (r.campusId && r.campusId !== 'all' ? r.campusId : null),
    toRow: (r, _lk, user) => ({
      id: r.id, campus_id: r.campusId && r.campusId !== 'all' ? r.campusId : null,
      recipient_type: String(r.recipientType || 'ALL').toUpperCase(), channel: String(r.channel || 'BOTH').toUpperCase(),
      title: r.title, message: r.message, status: String(r.status || 'SENT').toUpperCase(), sent_by: user.id,
    }),
    fromRow: (row) => ({
      id: row.id, recipientType: row.recipient_type, channel: row.channel, title: row.title, message: row.message,
      timestamp: stamp(row.created_at), status: row.status, campusId: row.campus_id || undefined,
    }),
    orderBy: { column: 'created_at', ascending: false },
  },

  teachingMaterials: {
    table: 'teaching_materials',
    writeRoles: STAFF,
    deleteRoles: STAFF,
    campusOf: (r, lk) => r.campusId || lk.className.get(r.classId)?.campusId || null,
    toRow: (r, lk, user) => ({
      id: r.id, campus_id: r.campusId || lk.className.get(r.classId)?.campusId || user.activeCampusId,
      class_id: nz(r.classId), teacher_id: teacherUserId(lk, r.teacherId) || user.id, title: r.title,
      type: String(r.type || 'PDF').toUpperCase(), file_name: r.fileName || r.title, file_size_mb: num(r.fileSizeMb),
      description: nz(r.description), uploaded_at: r.uploadedAt ? new Date(String(r.uploadedAt).replace(' ', 'T')).toISOString() : new Date().toISOString(),
    }),
    fromRow: (row, lk) => ({
      id: row.id, title: row.title, type: row.type, classId: row.class_id || undefined,
      className: row.class_id ? lk.className.get(row.class_id)?.name : undefined, teacherId: teacherProfileId(lk, row.teacher_id),
      teacherName: lk.userName.get(row.teacher_id) || '', fileSizeMb: Number(row.file_size_mb), fileName: row.file_name,
      description: row.description || '', uploadedAt: stamp(row.uploaded_at), campusId: row.campus_id,
    }),
    orderBy: { column: 'uploaded_at', ascending: false },
  },

  salaryRecords: {
    table: 'teacher_salary_records',
    writeRoles: ADMINS,
    deleteRoles: ADMINS,
    campusOf: (r) => r.campusId,
    toRow: (r, lk) => ({
      id: r.id, teacher_id: teacherUserId(lk, r.teacherId), campus_id: r.campusId, month_year: r.monthYear,
      pay_period: nz(r.payPeriod), basic_salary: num(r.basicSalary ?? r.baseSalary), allowances: num(r.allowances),
      deductions: num(r.deductions), net_salary: num(r.netSalary), currency: String(r.currency || (r.campusId === 'kts' ? 'PKR' : 'GBP')).toUpperCase(),
      payment_status: String(r.paymentStatus || r.status || 'PENDING').toUpperCase() === 'PAID' ? 'PAID' : 'PENDING',
      payment_date: dateOnly(r.paymentDate || r.paidDate), payment_method: r.paymentMethod || 'CASH', audit_id: nz(r.auditId),
    }),
    fromRow: (row, lk) => ({
      id: row.id, teacherId: teacherProfileId(lk, row.teacher_id), teacherName: lk.userName.get(row.teacher_id) || '',
      campusId: row.campus_id, monthYear: row.month_year, payPeriod: row.pay_period || undefined,
      basicSalary: Number(row.basic_salary), baseSalary: Number(row.basic_salary), allowances: Number(row.allowances),
      deductions: Number(row.deductions), netSalary: Number(row.net_salary), currency: row.currency,
      paymentStatus: row.payment_status, status: row.payment_status, paymentDate: row.payment_date || undefined,
      paidDate: row.payment_date || undefined, paymentMethod: row.payment_method, auditId: row.audit_id || '',
    }),
    orderBy: { column: 'month_year', ascending: false },
  },

  medicalRecords: {
    table: 'medical_records',
    writeRoles: STAFF,
    deleteRoles: ADMINS,
    campusOf: (r, lk) => r.campusId || lk.student.get(r.studentId)?.campusId || null,
    toRow: (r, lk, user) => ({
      id: r.id, campus_id: r.campusId || lk.student.get(r.studentId)?.campusId, student_id: r.studentId,
      condition: r.condition, severity: String(r.severity || 'HIGH').toUpperCase(), allergies: nz(r.allergies),
      medication_notes: nz(r.medicationNotes), emergency_contact: nz(r.emergencyContact),
      status: String(r.status || 'SUBMITTED').toUpperCase(),
      // reported_by references users; keep the original reporter on updates.
      reported_by: r.reportedById || user.id,
    }),
    fromRow: (row, lk) => ({
      id: row.id, campusId: row.campus_id, studentId: row.student_id, studentName: lk.student.get(row.student_id)?.name || 'Student',
      condition: row.condition, severity: row.severity, allergies: row.allergies || '', medicationNotes: row.medication_notes || '',
      emergencyContact: row.emergency_contact || '', status: row.status, reportedBy: lk.userName.get(row.reported_by) || 'Staff',
      reportedById: row.reported_by || undefined, createdAt: (row.created_at || '').substring(0, 10),
    }),
    orderBy: { column: 'created_at', ascending: false },
  },
};

/** Loads and maps every collection for the state endpoint. */
export async function loadAllCollections(sb: SupabaseClient, lk: Lookups): Promise<Record<string, any[]>> {
  const entries = await Promise.all(
    Object.entries(COLLECTIONS).map(async ([name, def]) => {
      let q = sb.from(def.table).select('*');
      if (def.orderBy) q = q.order(def.orderBy.column, { ascending: def.orderBy.ascending });
      const { data, error } = await q;
      if (error) throw new Error(`${def.table}: ${error.message}`);
      return [name, (data || []).map((row) => def.fromRow(row, lk))] as const;
    })
  );
  return Object.fromEntries(entries);
}

/** Whether the user may act on a record of this campus (null = global). */
export function campusAllowed(user: RecordUser, campusId: string | null): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (!campusId) return false;
  return user.allowedCampusIds.includes(campusId) || user.allowedCampusIds.includes('all');
}

export class RecordError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Upserts one record after role and campus checks (including the stored row's campus). */
export async function saveRecord(sb: SupabaseClient, user: RecordUser, collection: string, record: any): Promise<any> {
  const def = COLLECTIONS[collection];
  if (!def) throw new RecordError(404, `Unknown collection "${collection}".`);
  if (!def.writeRoles.includes(user.role)) throw new RecordError(403, 'Forbidden: your role cannot change this data.');
  if (!record || typeof record !== 'object' || !record.id) throw new RecordError(400, 'A record with an id is required.');

  const lk = await loadLookups(sb);
  const campusId = def.campusOf(record, lk);
  if (!campusAllowed(user, campusId)) throw new RecordError(403, 'Forbidden: this record belongs to a campus you cannot access.');

  const { data: existing, error: findErr } = await sb.from(def.table).select('campus_id').eq('id', record.id).maybeSingle();
  if (findErr) throw new RecordError(500, findErr.message);
  if (existing && !campusAllowed(user, existing.campus_id)) {
    throw new RecordError(403, 'Forbidden: this record belongs to a campus you cannot access.');
  }

  const row = def.toRow(record, lk, user);
  const { data, error } = await sb.from(def.table).upsert([row]).select().single();
  if (error) throw new RecordError(error.code === '23514' || error.code === '23503' || error.code === '23502' ? 400 : 500, error.message);
  return def.fromRow(data, lk);
}

/** Deletes one record after role and campus checks. */
export async function deleteRecord(sb: SupabaseClient, user: RecordUser, collection: string, id: string): Promise<void> {
  const def = COLLECTIONS[collection];
  if (!def) throw new RecordError(404, `Unknown collection "${collection}".`);
  if (!def.deleteRoles.includes(user.role)) throw new RecordError(403, 'Forbidden: your role cannot delete this data.');
  const { data: existing, error: findErr } = await sb.from(def.table).select('campus_id').eq('id', id).maybeSingle();
  if (findErr) throw new RecordError(500, findErr.message);
  if (!existing) throw new RecordError(404, 'Record not found.');
  if (!campusAllowed(user, existing.campus_id)) throw new RecordError(403, 'Forbidden: this record belongs to a campus you cannot access.');
  const { error } = await sb.from(def.table).delete().eq('id', id);
  if (error) throw new RecordError(error.code === '23503' ? 409 : 500, error.message);
}
