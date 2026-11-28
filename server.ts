import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as authSvc from './server/authService.ts';
import * as records from './server/records.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local configuration without replacing values supplied by the deployment environment.
const envPath = path.resolve(__dirname, '.env');
const envLocalPath = path.resolve(__dirname, '.env.local');
const envFiles: string[] = [];
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envLocalPath)) {
  envFiles.push(envLocalPath);
}
if (fs.existsSync(envPath)) {
  envFiles.push(envPath);
}
if (envFiles.length > 0) {
  const envResult = dotenv.config({ path: envFiles, override: false });
  if (envResult.error) {
    console.warn('[Server Config] Failed to load local environment files:', envResult.error.message);
  }
}

/**
 * Validates that a string is a well-formed JWT token with 3 dot-separated base64url parts.
 * Rejects template placeholders, ellipses (...), and truncated values.
 */
function isValidJwtToken(token?: string): boolean {
  if (!token) return false;
  const trimmed = token.trim();
  if (
    trimmed.length < 80 ||
    trimmed.includes('...') ||
    trimmed.includes('[') ||
    trimmed.includes(']') ||
    trimmed.includes('<') ||
    trimmed.includes('>') ||
    /placeholder|your-anon|service-role|example/i.test(trimmed)
  ) {
    return false;
  }
  const parts = trimmed.split('.');
  if (parts.length !== 3) return false;
  const base64Regex = /^[A-Za-z0-9_-]+$/;
  return parts.every((p) => p.length > 0 && base64Regex.test(p));
}

/**
 * Validates that a string is a valid Supabase project URL.
 * Rejects template placeholders and invalid domains.
 */
function getValidSupabaseUrl(...candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    if (!c) continue;
    const trimmed = c.trim();
    if (
      trimmed.length > 15 &&
      !trimmed.includes('[') &&
      !trimmed.includes(']') &&
      !trimmed.includes('<') &&
      !trimmed.includes('>') &&
      !/your-project|placeholder|example\.com/i.test(trimmed)
    ) {
      try {
        const u = new URL(trimmed);
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          return trimmed;
        }
      } catch {}
    }
  }
  return '';
}

/**
 * Validates that the server-side key is an authentic SUPABASE_SERVICE_ROLE_KEY.
 * Never falls back to anon keys for authoritative server-side user provisioning and RLS bypass.
 */
function getValidSupabaseServiceKey(...candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    if (!c) continue;
    const trimmed = c.trim();
    // Legacy JWT service_role key (eyJ...) or new-format Supabase secret key (sb_secret_...).
    if (isValidJwtToken(trimmed) || /^sb_secret_[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
      return trimmed;
    }
  }
  return '';
}

/**
 * Safely extracts host from a URL string without exposing any credentials, secrets, or tokens.
 */
function getSafeHost(urlStr?: string): string {
  if (!urlStr) return 'none (local ledger mode)';
  try {
    const parsed = new URL(urlStr);
    return parsed.host;
  } catch {
    return 'invalid_url';
  }
}

// Server-side SUPABASE_URL takes precedence over VITE_SUPABASE_URL.
const serverSupabaseUrl = getValidSupabaseUrl(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL);
// Privileged server operations require SUPABASE_SERVICE_ROLE_KEY.
const serverSupabaseKey = getValidSupabaseServiceKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

let serverSupabase: SupabaseClient | null = null;
let supabaseInitialization: Promise<void> = Promise.resolve();
if (serverSupabaseUrl && serverSupabaseKey) {
  try {
    const candidateSupabase = createClient(serverSupabaseUrl, serverSupabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    console.info(`[Server Supabase] Configuration format validated for host ${getSafeHost(serverSupabaseUrl)}; checking connectivity.`);
    supabaseInitialization = (async () => {
      try {
        const { error } = await candidateSupabase.from('campuses').select('id').limit(1);
        if (error) {
          console.error(`[Server Supabase] Connectivity check failed (${error.code || 'unknown error'}); using local database ledger mode.`);
        } else {
          serverSupabase = candidateSupabase;
          console.info(`[Server Supabase] Connection verified at host ${getSafeHost(serverSupabaseUrl)}.`);
        }
      } catch {
        console.error('[Server Supabase] Connectivity check failed; using local database ledger mode.');
      }
    })();
  } catch {
    console.error('[Server Supabase] Client initialization failed; using local database ledger mode.');
  }
} else {
  const configurationProblems: string[] = [];
  if (!serverSupabaseUrl) {
    const urlProvided = Boolean(process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim());
    configurationProblems.push(urlProvided ? 'SUPABASE_URL or VITE_SUPABASE_URL is invalid' : 'SUPABASE_URL or VITE_SUPABASE_URL is missing');
  }
  if (!serverSupabaseKey) {
    configurationProblems.push(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
      ? 'SUPABASE_SERVICE_ROLE_KEY has an invalid format'
      : 'SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  console.error(`[Server Supabase] ${configurationProblems.join('; ')}; using local database ledger mode.`);
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use((_req: Request, _res: Response, next: NextFunction) => {
  supabaseInitialization.then(() => next()).catch(next);
});

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));

// Supabase is the only data store. Without it, every data route is unavailable.
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (serverSupabase || req.path === '/health') return next();
  res.status(503).json({
    error: 'Database unavailable: Supabase is not configured or not reachable. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    code: 'DATABASE_UNAVAILABLE',
  });
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS & Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Campus-Id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// ==============================================================================
// 1. NESTJS-STYLE GUARD SIMULATOR (JWT, ROLES, CAMPUS SCOPE)
// ==============================================================================
interface RequestUser {
  id: string;
  email: string;
  fullName?: string;
  role: 'SUPER_ADMIN' | 'CAMPUS_ADMIN' | 'TEACHER' | 'PARENT';
  activeCampusId: string;
  allowedCampusIds: string[];
  authUserId?: string;
  teacherProfileId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

// Authentication & Scoping Middleware — Strict Token Validation against Authoritative Records
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized: Missing Authorization header. Bearer token is required.',
      code: 'AUTH_TOKEN_REQUIRED',
    });
    return;
  }

  // Parse Bearer Token
  const token = authHeader.replace(/^Bearer\s*/i, '').trim();
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized: Empty authentication token provided.',
      code: 'AUTH_TOKEN_EMPTY',
    });
    return;
  }

  try {
    // Supabase mode: the token must be a valid Supabase Auth access token (signature verified by Supabase).
    if (serverSupabase) {
      const appUser = await authSvc.verifyAccessToken(serverSupabase, token);
      if (!appUser) {
        res.status(401).json({
          error: 'Unauthorized: Invalid or expired session. Please sign in again.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }
      if (!appUser.isActive) {
        res.status(403).json({
          error: 'Forbidden: Account has been deactivated or suspended by administration.',
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }
      req.user = {
        id: appUser.id,
        email: appUser.email,
        fullName: appUser.fullName,
        role: appUser.role as RequestUser['role'],
        activeCampusId: appUser.campusId,
        allowedCampusIds: appUser.allowedCampusIds,
        authUserId: appUser.authUserId,
        teacherProfileId: appUser.teacherProfileId,
      };
      next();
      return;
    }

    // Local ledger mode (Supabase NOT configured) — development only.
    const db = getDatabaseState();
    const localUsers: any[] = db?.users || [];

    // Extract potential user ID from token safely (e.g. jwt-usr-admin-kts-01-1793171829 -> usr-admin-kts-01)
    const extractedId = token.startsWith('jwt-')
      ? token.replace(/^jwt-/, '').replace(/-\d+$/, '')
      : token;

    // 1. Look up token or user ID in local database ledger
    let matchedUser = localUsers.find(
      (u) =>
        u.token === token ||
        u.id === extractedId ||
        (token.startsWith('jwt-') && token.includes(u.id)) ||
        u.email?.toLowerCase() === extractedId.toLowerCase() ||
        u.username?.toLowerCase() === extractedId.toLowerCase()
    );

    if (!matchedUser) {
      res.status(401).json({
        error: 'Unauthorized: Invalid, unrecognized, or expired credentials.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    if (matchedUser.isActive === false) {
      res.status(403).json({
        error: 'Forbidden: Account has been deactivated or suspended by administration.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    req.user = {
      id: matchedUser.id,
      email: matchedUser.email,
      fullName: matchedUser.fullName || `${matchedUser.firstName || ''} ${matchedUser.lastName || ''}`.trim() || matchedUser.email,
      role: matchedUser.role,
      activeCampusId: matchedUser.campusId || matchedUser.activeCampusId || 'all',
      allowedCampusIds: matchedUser.allowedCampusIds || [matchedUser.campusId || 'all'],
    };

    next();
  } catch (err: any) {
    console.error('[Server Auth Guard] Exception evaluating credentials:', err);
    res.status(500).json({ error: 'Internal authentication service error.' });
  }
};

// ==============================================================================
// 2. BACKEND REST API MODULES
// ==============================================================================

// Health Check Endpoint with Safe Supabase Host Verification
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      provider: serverSupabase ? 'Supabase PostgreSQL' : 'Local JSON Ledger Cache',
      supabaseConnected: Boolean(serverSupabase),
      supabaseProjectHost: getSafeHost(serverSupabaseUrl),
      serviceRoleKeyConfigured: Boolean(serverSupabaseKey),
      tablesPreserved: 24,
      campuses: ['uk', 'kts'],
    },
    version: '2.5.0-production',
  });
});

// Diagnostic Endpoint (Safe - never exposes secrets)
app.get(['/api/database/diagnostics', '/api/diagnostics'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    configuredSupabaseHost: getSafeHost(serverSupabaseUrl),
    supabaseActive: Boolean(serverSupabase),
    serviceRoleConfigured: Boolean(serverSupabaseKey),
    operatingMode: serverSupabase ? 'supabase' : 'unavailable',
    campuses: ['uk', 'kts'],
  });
});

// ==============================================================================
// 2.1 PERSISTENT DATABASE ENGINE (Local JSON Ledger + Supabase Cloud Bridge)
// ==============================================================================
// Collections whose source of truth is Supabase (all of them). Used by the state loader.
const SUPABASE_BACKED_KEYS = [
  'campuses', 'users', 'teachers', 'classes', 'students', 'payments',
  'teacherAttendance', 'studentAttendance', 'incidents', 'medicalRecords', 'auditLogs',
];

// The local JSON ledger (data/ims_database.json) has been retired: Supabase is the only
// data store. These inert shims keep older call sites harmless while they are cleaned up;
// they never read or write the disk.
function getDatabaseState(): any {
  return {};
}

function saveDatabaseState(_state: any): boolean {
  return true;
}

// Campus Isolation Security Guard (NestJS-style authorization guard)
const enforceCampusAccess = (req: Request, res: Response, targetCampusId: string): boolean => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    return false;
  }
  // Super Admin can access all campuses
  if (req.user.role === 'SUPER_ADMIN') {
    return true;
  }
  // Target campus must be in user's allowed campuses
  if (targetCampusId && targetCampusId !== 'all' && !req.user.allowedCampusIds.includes(targetCampusId)) {
    res.status(403).json({
      error: `Forbidden: Multi-campus isolation violation. Your account is restricted to [${req.user.allowedCampusIds.join(', ')}] and cannot access campus "${targetCampusId}".`,
      code: 'CAMPUS_ISOLATION_VIOLATION',
    });
    return false;
  }
  return true;
};

/** Only Super Admin and Campus Admin may perform this action. */
const requireAdmin = (req: Request, res: Response): boolean => {
  if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'CAMPUS_ADMIN') return true;
  res.status(403).json({ error: 'Forbidden: only administrators can perform this action.' });
  return false;
};

/**
 * Enforces campus isolation for an existing record. With Supabase the record's campus is
 * read from the database (never from the local cache); a missing record is a 404.
 */
async function enforceRecordCampus(
  req: Request, res: Response, table: string, id: string, cachedCampusId?: string
): Promise<boolean> {
  if (serverSupabase) {
    const { data, error } = await serverSupabase.from(table).select('campus_id').eq('id', id).maybeSingle();
    if (error) {
      res.status(500).json({ error: `Could not verify record: ${error.message}` });
      return false;
    }
    if (!data) {
      res.status(404).json({ error: 'Record not found.' });
      return false;
    }
    return enforceCampusAccess(req, res, data.campus_id);
  }
  return cachedCampusId ? enforceCampusAccess(req, res, cachedCampusId) : true;
}

// Full Database State Retrieval with Role-Based Campus Scoping & Authoritative Supabase Integration
app.get(['/api/database/state', '/api/state', '/state'], authenticateUser, async (req: Request, res: Response) => {
  let db = getDatabaseState() || {};

  // If Supabase PostgreSQL is operational on the server, fetch authoritative live data
  if (serverSupabase) {
    try {
      const [
        campusesRes,
        usersRes,
        teachersRes,
        classesRes,
        studentsRes,
        paymentsRes,
        teacherAttRes,
        studentAttRes,
        auditLogsRes,
        incidentLogsRes,
      ] = await Promise.all([
        serverSupabase.from('campuses').select('*').order('code'),
        serverSupabase.from('users').select('*'),
        serverSupabase.from('teacher_profiles').select('*').order('created_at', { ascending: false }),
        serverSupabase.from('classes').select('*'),
        serverSupabase.from('students').select('*').order('first_name'),
        serverSupabase.from('payment_invoices').select('*').order('created_at', { ascending: false }),
        serverSupabase.from('teacher_attendances').select('*').limit(300),
        serverSupabase.from('student_attendances').select('*').limit(500),
        serverSupabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
        serverSupabase.from('incident_logs').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      const failed = [campusesRes, usersRes, teachersRes, classesRes, studentsRes, paymentsRes, teacherAttRes, studentAttRes, auditLogsRes, incidentLogsRes]
        .filter((r: any) => r.error);
      if (failed.length > 0) {
        console.error('[Server Supabase] State load failed:', failed.map((r: any) => r.error.message).join('; '));
        res.status(502).json({ error: 'Could not load data from the database. Please try again.' });
        return;
      }
      // Start Supabase-backed collections empty so stale local copies can never leak through.
      for (const key of SUPABASE_BACKED_KEYS) db[key] = [];
      db.incidents = [];
      db.medicalRecords = [];

      const liveUsers = usersRes.data || [];
      const userMap = new Map<string, any>(liveUsers.map((u: any) => [u.id, u]));

      // 1. Live Campuses from Supabase
      if (campusesRes.data) {
        db.campuses = campusesRes.data.map((c: any) => ({
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

      // 2. Live Users from Supabase
      if (liveUsers.length > 0) {
        db.users = liveUsers.map((u: any) => ({
          id: u.id,
          email: u.email,
          username: u.username || u.email?.split('@')[0] || u.id,
          fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          role: u.role,
          campusId: u.active_campus_id,
          allowedCampusIds: Array.isArray(u.allowed_campus_ids) ? u.allowed_campus_ids : ['all', 'uk', 'kts'],
          isActive: u.status === 1 || u.status === true,
          contactNumber: u.contact_number,
          createdAt: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2026-01-10',
        }));
      }

      // 3. Live Teachers (linking teacher_profiles.teacher_id -> users.id)
      if (teachersRes.data) {
        db.teachers = teachersRes.data.map((t: any) => {
          const linkedUser = userMap.get(t.teacher_id) || {};
          const fullName = `${linkedUser.first_name || ''} ${linkedUser.last_name || ''}`.trim() || t.specialization || `Teacher ${t.employee_code || t.id}`;
          return {
            id: t.id,
            userId: t.teacher_id,
            campusId: t.campus_id || 'uk',
            employeeCode: t.employee_code || `TCH-${t.id}`,
            fullName,
            email: linkedUser.email || `teacher${t.id}@misbah.org`,
            phone: linkedUser.contact_number || '+44 7700 900000',
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
        });
      }

      // 4. Live Classes from Supabase
      if (classesRes.data) {
        db.classes = classesRes.data.map((c: any) => {
          const teacherUser = c.teacher_id ? userMap.get(c.teacher_id) : null;
          const leadTeacherName = teacherUser ? `${teacherUser.first_name || ''} ${teacherUser.last_name || ''}`.trim() : 'Unassigned';
          return {
            id: c.id,
            campusId: c.campus_id || 'uk',
            name: c.title || c.name || 'General Halaqah',
            code: c.code || `${c.campus_id?.toUpperCase()}-CLS-${c.id}`,
            gradeLevel: c.grade_level || 'General Halaqah',
            academicYear: c.academic_year || '2025-2026',
            capacity: Number(c.capacity || 25),
            maxCapacity: Number(c.capacity || 25),
            leadTeacherId: c.teacher_id || undefined,
            leadTeacherName,
            studentCount: 0,
            currentEnrollment: 0,
            scheduleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            scheduleTime: c.schedule_time || '5:00 PM - 7:30 PM (Mon-Fri)',
            room: c.room || 'Main Hall',
            isActive: c.is_active !== false,
          };
        });
      }

      // 5. Live Students from Supabase
      if (studentsRes.data) {
        const classMap = new Map((db.classes || []).map((cl: any) => [cl.id, cl]));
        db.students = studentsRes.data.filter((s: any) => s.status !== 'archived').map((s: any) => {
          const matchedClass: any = s.class_id ? classMap.get(s.class_id) : undefined;
          let parsedParentContact: { name?: string; phone?: string } | null = null;
          try {
            if (s.primary_contact_details) {
              parsedParentContact = typeof s.primary_contact_details === 'string'
                ? JSON.parse(s.primary_contact_details)
                : s.primary_contact_details;
            }
          } catch {}

          return {
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
            portalAccessActive: s.portal_access_active !== false,
            parentIds: s.parent_id ? [s.parent_id] : [],
          };
        });
      }

      // 6. Live Payments from Supabase
      if (paymentsRes.data) {
        db.payments = paymentsRes.data.map((p: any) => ({
          id: String(p.id),
          studentId: p.reference_id,
          studentName: `Student ${p.reference_id}`,
          admissionNumber: `REG-${p.reference_id}`,
          invoiceNumber: p.invoice_number || `INV-${p.id}`,
          title: p.description || 'Monthly Tuition Fee',
          amountDue: Number(p.amount || 0),
          amountPaid: p.payment_status === 'paid' ? Number(p.amount || 0) : 0,
          currency: p.currency || 'PKR',
          status: p.payment_status === 'paid' ? 'PAID' : (p.payment_status === 'partial' ? 'PARTIAL' : 'PENDING'),
          dueDate: p.due_date,
          paidDate: p.payment_date || undefined,
          paymentMethod: p.payment_method || 'Cash',
          campusId: p.campus_id || 'kts',
        }));
      }

      // 7. Live Attendance from Supabase
      if (teacherAttRes.data) {
        // Supabase stores the user id; the portal keys attendance by teacher_profiles id.
        const profileIdByUserId = new Map<string, string>(
          (teachersRes.data || []).map((p: any) => [p.teacher_id, p.id])
        );
        db.teacherAttendance = teacherAttRes.data.map((a: any) => ({
          id: a.id || `att-tch-${a.teacher_id}-${a.date}`,
          campusId: a.campus_id,
          teacherId: profileIdByUserId.get(a.teacher_id) || a.teacher_id,
          date: a.date,
          status: a.status,
          checkInTime: a.check_in_time,
          ruleApplied: a.rule_applied || 'UP_TO_5PM',
          isSystemGenerated: a.is_system_generated || false,
          remarks: a.remarks || '',
          recordedBy: a.recorded_by || 'Admin',
        }));
      }

      if (studentAttRes.data) {
        db.studentAttendance = studentAttRes.data.map((a: any) => ({
          id: a.id || `att-std-${a.student_id}-${a.date}`,
          campusId: a.campus_id,
          classId: a.class_id,
          studentId: a.student_id,
          studentName: 'Student',
          date: a.date,
          status: a.status,
          remarks: a.remarks || '',
          recordedBy: a.recorded_by || 'Teacher',
        }));
      }

      // 8. Live Incidents & Medical Records from Supabase incident_logs
      if (incidentLogsRes.data) {
        const studentMap = new Map((db.students || []).map((s: any) => [s.id, `${s.firstName} ${s.lastName}`.trim()]));
        const incidents: any[] = [];
        const medicals: any[] = [];

        incidentLogsRes.data.forEach((log: any) => {
          const studentName = (log.student_id ? studentMap.get(log.student_id) : null) || 'Student';
          const isMedical = log.title?.startsWith('[MEDICAL]');

          if (isMedical) {
            let parsedDetails: any = {};
            try {
              if (log.description && log.description.startsWith('{')) {
                parsedDetails = JSON.parse(log.description);
              }
            } catch {}

            medicals.push({
              id: log.id,
              campusId: log.campus_id || 'uk',
              studentId: log.student_id || '',
              studentName,
              condition: parsedDetails.condition || log.title.replace('[MEDICAL] Condition:', '').trim() || 'Medical Note',
              severity: parsedDetails.severity || 'HIGH',
              allergies: parsedDetails.allergies || '',
              medicationNotes: parsedDetails.medicationNotes || '',
              emergencyContact: parsedDetails.emergencyContact || (log.action_taken?.replace('Emergency Contact:', '').trim()) || '',
              status: log.status || 'SUBMITTED',
              reportedBy: parsedDetails.reportedBy || 'Staff',
              createdAt: log.created_at ? log.created_at.split('T')[0] : (log.date || '2026-10-29'),
            });
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

            incidents.push({
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
              status: log.status || 'SUBMITTED',
              createdAt: log.created_at ? log.created_at.replace('T', ' ').substring(0, 19) : (log.date || '2026-10-29'),
              attachedFiles: parsedFiles,
            });
          }
        });

        if (incidents.length > 0) {
          db.incidents = incidents;
        }
        if (medicals.length > 0) {
          db.medicalRecords = medicals;
        }
      }

      db.auditLogs = (auditLogsRes.data || []).map((log: any) => {
        const actor = log.user_id ? userMap.get(log.user_id) : null;
        const d = log.details && typeof log.details === 'object' ? log.details : {};
        return {
          id: log.id,
          campusId: log.campus_id || undefined,
          userId: log.user_id || 'system',
          userName: actor ? `${actor.first_name || ''} ${actor.last_name || ''}`.trim() || actor.email : (d.deleted_by || d.archived_by || 'System'),
          userRole: actor?.role || 'SUPER_ADMIN',
          action: log.action,
          entityType: d.entity_type || 'System',
          entityId: String(d.entity_id || d.target_user_id || ''),
          timestamp: (log.created_at || '').replace('T', ' ').substring(0, 19),
          ipAddress: log.ip_address || undefined,
          details: d.reason || d.message || JSON.stringify(d),
        };
      });

      // Remaining collections (expenses, exams, progress, announcements, events,
      // notifications, teaching materials, salaries, medical records).
      const legacyMedicals = db.medicalRecords || [];
      const lookups = await records.loadLookups(serverSupabase);
      const collections = await records.loadAllCollections(serverSupabase, lookups);
      Object.assign(db, collections);
      // Medical notes recorded before migration 05 were stored as [MEDICAL] incidents.
      db.medicalRecords = [...collections.medicalRecords, ...legacyMedicals];

      // Parents: profile + linked user account + children (students.parent_id).
      const { data: parentRows, error: parentErr } = await serverSupabase.from('parent_profiles').select('*');
      if (parentErr) throw parentErr;
      db.parents = (parentRows || []).map((p: any) => {
        const u: any = userMap.get(p.user_id) || {};
        return {
          id: p.id,
          userId: p.user_id,
          campusId: p.campus_id,
          fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || p.user_id,
          email: u.email || '',
          phone: p.phone || u.contact_number || '',
          cnicOrId: p.cnic_or_id || '',
          occupation: p.occupation || '',
          address: p.address || '',
          linkedStudentIds: (studentsRes.data || []).filter((st: any) => st.parent_id === p.user_id).map((st: any) => st.id),
          portalAccessActive: u.status === 1,
        };
      });

      // Pending admissions are students awaiting approval (there is no separate table).
      const campusNames = new Map((db.campuses || []).map((c: any) => [c.id, c.name]));
      db.pendingAdmissions = (db.students || [])
        .filter((st: any) => String(st.approvalStatus).toUpperCase() === 'PENDING_APPROVAL')
        .map((st: any) => ({
          id: st.id,
          studentId: st.id,
          studentName: `${st.firstName} ${st.lastName}`.trim(),
          temporaryReference: st.admissionNumber,
          campusId: st.campusId,
          campusName: campusNames.get(st.campusId) || st.campusId,
          gradeApplying: st.currentGrade || '',
          dateOfBirth: st.dob,
          submissionDate: st.enrollmentDate,
          submittedByAdminName: 'Campus Administration',
          parentName: st.primaryParentName,
          parentPhone: st.primaryParentPhone,
          status: 'PENDING_APPROVAL',
        }));
      db.pendingTeachers = [];
    } catch (err: any) {
      console.error('[Server Supabase] Error fetching live state from Supabase:', err?.message || err);
      res.status(502).json({ error: 'Could not load data from the database. Please try again.' });
      return;
    }
  }

  const user = req.user;
  // If Super Admin, return full global ledger
  if (!user || user.role === 'SUPER_ADMIN') {
    res.json({
      success: true,
      data: db,
      authoritativeSource: serverSupabase ? 'supabase' : 'local_cache',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Parents: only their own children's records.
  if (user.role === 'PARENT') {
    const children = (db.students || []).filter((s: any) => Array.isArray(s.parentIds) && s.parentIds.includes(user.id));
    const childIds = new Set(children.map((s: any) => s.id));
    const childClassIds = new Set(children.map((s: any) => s.classId));
    res.json({
      success: true,
      data: {
        campuses: db.campuses || [],
        students: children,
        classes: (db.classes || []).filter((c: any) => childClassIds.has(c.id)),
        payments: (db.payments || []).filter((p: any) => childIds.has(p.studentId)),
        studentAttendance: (db.studentAttendance || []).filter((a: any) => childIds.has(a.studentId)),
        examResults: (db.examResults || []).filter((e: any) => childIds.has(e.studentId)),
        academicProgress: (db.academicProgress || []).filter((p: any) => childIds.has(p.studentId)),
        announcements: (db.announcements || []).filter((a: any) => !a.campusId || (user.allowedCampusIds || []).includes(a.campusId)),
        events: (db.events || []).filter((e: any) => (user.allowedCampusIds || []).includes(e.campusId)),
        parents: (db.parents || []).filter((p: any) => p.userId === user.id),
        teachers: [], users: [], auditLogs: [], incidents: [], teacherAttendance: [],
        expenses: [], salaryRecords: [], notifications: [], teachingMaterials: [], medicalRecords: [],
        pendingAdmissions: [], pendingTeachers: [],
      },
      scopedCampus: user.allowedCampusIds,
      authoritativeSource: serverSupabase ? 'supabase' : 'local_cache',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // If Campus Admin or Teacher, filter strictly to allowed campus(es)
  const allowed = user.allowedCampusIds || [user.activeCampusId];
  const isCampusAdmin = user.role === 'CAMPUS_ADMIN';
  const filterByCampus = (items?: any[]) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => !item.campusId || item.campusId === 'all' || allowed.includes(item.campusId));
  };

  const scopedDb = {
    campuses: db.campuses ? db.campuses.filter((c: any) => allowed.includes(c.id)) : [],
    students: filterByCampus(db.students),
    teachers: filterByCampus(db.teachers),
    parents: filterByCampus(db.parents),
    classes: filterByCampus(db.classes),
    payments: isCampusAdmin ? filterByCampus(db.payments) : [],
    expenses: isCampusAdmin ? filterByCampus(db.expenses) : [],
    teacherAttendance: isCampusAdmin
      ? filterByCampus(db.teacherAttendance)
      : (db.teacherAttendance || []).filter((a: any) => a.teacherId === (user as any).teacherProfileId || a.teacherId === user.id),
    studentAttendance: filterByCampus(db.studentAttendance),
    academicProgress: filterByCampus(db.academicProgress),
    incidents: filterByCampus(db.incidents),
    announcements: filterByCampus(db.announcements),
    auditLogs: isCampusAdmin ? filterByCampus(db.auditLogs).filter((l: any) => l.campusId) : [],
    salaryRecords: isCampusAdmin
      ? filterByCampus(db.salaryRecords)
      : (db.salaryRecords || []).filter((r: any) => r.teacherId === user.teacherProfileId),
    events: filterByCampus(db.events),
    notifications: filterByCampus(db.notifications),
    teachingMaterials: filterByCampus(db.teachingMaterials),
    medicalRecords: filterByCampus(db.medicalRecords),
    examResults: filterByCampus(db.examResults),
    pendingAdmissions: filterByCampus(db.pendingAdmissions),
    pendingTeachers: filterByCampus(db.pendingTeachers),
    users: db.users ? db.users.filter((u: any) => u.campusId === 'all' || allowed.includes(u.campusId)) : [],
  };

  res.json({
    success: true,
    data: scopedDb,
    scopedCampus: allowed,
    authoritativeSource: serverSupabase ? 'supabase' : 'local_cache',
    timestamp: new Date().toISOString(),
  });
});

// Bulk browser-state sync has been retired: every change is saved record-by-record.
app.post(['/api/database/sync', '/api/sync', '/sync'], authenticateUser, (_req: Request, res: Response) => {
  res.status(410).json({ error: 'Bulk sync has been removed. Data is saved directly to Supabase per record.' });
});

// Generic record API for the collections defined in server/records.ts
app.post('/api/records/:collection', authenticateUser, async (req: Request, res: Response) => {
  try {
    const saved = await records.saveRecord(serverSupabase!, req.user as any, req.params.collection, req.body?.record);
    res.json({ success: true, record: saved });
  } catch (err: any) {
    const status = err instanceof records.RecordError ? err.status : 500;
    if (status >= 500) console.error(`[Records] save ${req.params.collection} failed:`, err?.message || err);
    res.status(status).json({ error: err?.message || 'Save failed.' });
  }
});

app.delete('/api/records/:collection/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    await records.deleteRecord(serverSupabase!, req.user as any, req.params.collection, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    const status = err instanceof records.RecordError ? err.status : 500;
    if (status >= 500) console.error(`[Records] delete ${req.params.collection} failed:`, err?.message || err);
    res.status(status).json({ error: err?.message || 'Delete failed.' });
  }
});

// Database Migration & Data Verification Status
app.get('/api/database/migration-status', (req: Request, res: Response) => {
  res.json({
    status: 'production_ready',
    campuses: ['uk', 'kts'],
    currencies: {
      uk: 'GBP',
      kts: 'PKR',
    },
    cleanState: true,
    demoDataRemoved: true,
    dataStore: 'supabase',
    attendanceRules: {
      timeBoundary5pm: 'PRESENT or ABSENT',
      timeBoundary530pm: 'LATE or ABSENT',
      after530pm: 'ABSENT only (System Generated cutoff)',
    },
  });
});

// Setup status endpoint for initial installation
app.get('/api/auth/setup-status', (req: Request, res: Response) => {
  res.json({
    setupCompleted: true,
    campusesConfigured: 2,
    ready: true,
  });
});

/** Finds a teacher profile by its id, linked user id, or employee code (literal matches only). */
async function findTeacherProfile(identifier: string, columns: string): Promise<any | null> {
  if (!serverSupabase || !identifier) return null;
  for (const column of ['id', 'teacher_id', 'employee_code']) {
    const { data } = await serverSupabase.from('teacher_profiles').select(columns).eq(column, identifier).limit(1).maybeSingle();
    if (data) return data;
  }
  return null;
}

// Auth Login Route — verifies credentials with Supabase Auth and returns a Supabase session.
const serverAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

async function writeAuthAudit(action: string, campusId: string | null, userId: string | null, details: Record<string, any>) {
  if (!serverSupabase) return;
  try {
    await serverSupabase.from('audit_logs').insert([{
      campus_id: campusId && campusId !== 'all' ? campusId : null,
      user_id: userId,
      action,
      details,
    }]);
  } catch {
    // audit logging must never block authentication
  }
}

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body || {};
  if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password) {
    res.status(400).json({ error: 'Username/Email and password are required.' });
    return;
  }
  if (!serverSupabase) {
    res.status(501).json({ error: 'Server authentication requires Supabase.', code: 'LOCAL_MODE' });
    return;
  }
  if (!serverAnonKey) {
    res.status(500).json({ error: 'Server is missing the Supabase anon key needed to verify passwords.' });
    return;
  }

  const cleanId = identifier.trim().toLowerCase();
  const limiterKeys = [`id:${cleanId}`, `ip:${req.ip || 'unknown'}`];
  if (authSvc.isRateLimited(limiterKeys)) {
    res.status(429).json({ error: 'Too many failed sign-in attempts. Please wait 15 minutes and try again.' });
    return;
  }

  const genericError = 'Invalid credentials. Please verify your email or username and password.';
  try {
    const row = await authSvc.findUserRowByIdentifier(serverSupabase, cleanId);
    if (!row || !row.auth_user_id || !row.email) {
      authSvc.recordFailedAttempt(limiterKeys);
      await writeAuthAudit('FAILED_LOGIN_ATTEMPT', null, null, { identifier: cleanId, reason: 'unknown account' });
      res.status(401).json({ error: genericError });
      return;
    }
    if (String(row.role).toUpperCase() === 'STUDENT') {
      res.status(403).json({
        error: 'Direct student login is disabled. Parents access student records through the Parent Portal. Please sign in using guardian credentials.',
      });
      return;
    }

    const verifier = authSvc.createPasswordVerifier(serverSupabaseUrl, serverAnonKey);
    const { data, error } = await verifier.auth.signInWithPassword({ email: row.email, password });
    if (error || !data?.session || !data.user) {
      authSvc.recordFailedAttempt(limiterKeys);
      await writeAuthAudit('FAILED_LOGIN_ATTEMPT', row.active_campus_id, row.id, { identifier: cleanId, reason: 'bad password' });
      const banned = /banned/i.test(error?.message || '');
      res.status(banned ? 403 : 401).json({
        error: banned
          ? 'This account has been deactivated or suspended by the Super Administrator. Please contact central administration.'
          : genericError,
      });
      return;
    }

    const appUser = await authSvc.loadAppUserByAuthId(serverSupabase, data.user.id);
    if (!appUser || !appUser.isActive) {
      res.status(403).json({
        error: 'This account has been deactivated or suspended by the Super Administrator. Please contact central administration.',
      });
      return;
    }

    authSvc.clearAttempts(limiterKeys);
    await serverSupabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', appUser.id);
    await writeAuthAudit('USER_LOGIN', appUser.campusId, appUser.id, { role: appUser.role });

    res.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: {
        id: appUser.id,
        email: appUser.email,
        username: appUser.username,
        fullName: appUser.fullName,
        role: appUser.role,
        activeCampusId: appUser.campusId,
        allowedCampusIds: appUser.allowedCampusIds,
        teacherProfileId: appUser.teacherProfileId,
        parentProfileId: appUser.parentProfileId,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err?.message || err);
    res.status(500).json({ error: 'Authentication service error. Please try again.' });
  }
});

// Change own password (requires the current password).
app.post('/api/auth/change-password', authenticateUser, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!serverSupabase || !req.user?.authUserId) {
    res.status(501).json({ error: 'Password changes require Supabase authentication.' });
    return;
  }
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'Current password and a new password of at least 8 characters are required.' });
    return;
  }
  const verifier = authSvc.createPasswordVerifier(serverSupabaseUrl, serverAnonKey);
  const { error: verifyErr } = await verifier.auth.signInWithPassword({ email: req.user.email, password: currentPassword });
  if (verifyErr) {
    res.status(400).json({ error: 'Current password entered is incorrect.' });
    return;
  }
  try {
    await authSvc.updateAuthAccount(serverSupabase, req.user.authUserId, { password: newPassword });
    await writeAuthAudit('USER_PASSWORD_CHANGED', req.user.activeCampusId, req.user.id, {});
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update password.' });
  }
});

// Campuses Endpoint
app.get('/api/campuses', (req: Request, res: Response) => {
  res.json([
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
      attendanceRate: 100,
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
      attendanceRate: 100,
    },
  ]);
});

// ==============================================================================
// 2.2 SECURE TEACHER ACCOUNT PROVISIONING & PROFILE GOVERNANCE
// ==============================================================================
app.post('/api/teachers/provision', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'CAMPUS_ADMIN')) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin or Campus Admin can provision teachers.' });
      return;
    }

    const {
      fullName,
      email,
      phone,
      campusId,
      employeeCode: customCode,
      specialization,
      qualification,
      baseMonthlySalary,
      salaryCurrency,
      initialPassword,
      assignedClassIds,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      res.status(400).json({ error: 'Faculty Full Name is required.' });
      return;
    }

    const targetCampus = (campusId || 'uk').trim().toLowerCase();
    if (targetCampus !== 'uk' && targetCampus !== 'kts') {
      res.status(400).json({ error: 'Invalid campus ID. Must be "uk" or "kts".' });
      return;
    }

    // Enforce campus isolation: Campus Admin cannot provision teachers for another campus
    if (!enforceCampusAccess(req, res, targetCampus)) {
      return;
    }

    const cleanFullName = fullName.trim();
    const parts = cleanFullName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';
    const cleanEmail = (email && email.trim())
      ? email.trim().toLowerCase()
      : `${cleanFullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@misbah.org`;

    // Generate unique employee code if not provided
    const prefix = targetCampus.toUpperCase();
    const employeeCode = customCode && customCode.trim()
      ? customCode.trim().toUpperCase()
      : `TCH-${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const teacherId = `tch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const password = initialPassword || 'teacher123';
    const currency = salaryCurrency || (targetCampus === 'uk' ? 'GBP' : 'PKR');
    const salary = Number(baseMonthlySalary) || (targetCampus === 'uk' ? 2400 : 85000);

    let insertedUser: any = null;
    let insertedProfile: any = null;

    // If Supabase is configured on server, perform authoritative database operations
    if (serverSupabase) {
      // 1. Check if user already exists (literal, case-insensitive match; no filter interpolation)
      if (await authSvc.identifierTaken(serverSupabase, cleanEmail, employeeCode.toLowerCase())) {
        res.status(400).json({
          error: `A user account with email "${cleanEmail}" or employee code "${employeeCode}" already exists.`,
        });
        return;
      }

      // 1b. Create the Supabase Auth account that holds the teacher's credentials.
      let teacherAuthUserId: string;
      try {
        teacherAuthUserId = await authSvc.createAuthAccount(serverSupabase, {
          email: cleanEmail, password, appUserId: userId, role: 'TEACHER',
        });
      } catch (authErr: any) {
        res.status(400).json({ error: authErr.message });
        return;
      }

      // 2. Insert into users table
      const userRes = await serverSupabase
        .from('users')
        .insert([{
          id: userId,
          auth_user_id: teacherAuthUserId,
          email: cleanEmail,
          username: employeeCode.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          role: 'TEACHER',
          active_campus_id: targetCampus,
          allowed_campus_ids: [targetCampus], // Strict campus isolation!
          contact_number: phone?.trim() || null,
          status: 1,
        }])
        .select()
        .single();

      insertedUser = userRes.data;
      const userError = userRes.error;

      if (userError || !insertedUser) {
        console.error('[Server Supabase] Failed to create user for teacher:', userError);
        await authSvc.deleteAuthAccount(serverSupabase, teacherAuthUserId);
        res.status(500).json({ error: `Database user creation failed: ${userError?.message || 'Unknown database error'}` });
        return;
      }

      // 3. Insert into teacher_profiles table with required foreign key teacher_id = insertedUser.id
      const profileRes = await serverSupabase
        .from('teacher_profiles')
        .insert([{
          id: teacherId,
          teacher_id: insertedUser.id,
          campus_id: targetCampus,
          employee_code: employeeCode,
          specialization: specialization?.trim() || 'Quran & Tajweed',
          qualification: qualification?.trim() || 'Sanad in Hafs an Asim',
          joining_date: new Date().toISOString().substring(0, 10),
          salary: salary,
          salary_currency: currency,
          salary_day: 'Friday',
          status: 'active',
          assigned_class_ids: Array.isArray(assignedClassIds) ? assignedClassIds : [],
        }])
        .select()
        .single();

      insertedProfile = profileRes.data;
      const profileError = profileRes.error;

      if (profileError) {
        console.error('[Server Supabase] Failed to create teacher profile:', profileError);
        // Rollback user creation to maintain database integrity
        await serverSupabase.from('users').delete().eq('id', insertedUser.id);
        await authSvc.deleteAuthAccount(serverSupabase, teacherAuthUserId);
        res.status(500).json({ error: `Database teacher profile creation failed: ${profileError.message}` });
        return;
      }

      // 3b. Campus isolation: teacher may access only their campus.
      try {
        await authSvc.setCampusAccess(serverSupabase, insertedUser.id, [targetCampus]);
      } catch (accessErr: any) {
        console.error('[Server Supabase] Failed to set teacher campus access:', accessErr.message);
      }

      // 4. Update assigned classes in Supabase if specified
      if (Array.isArray(assignedClassIds) && assignedClassIds.length > 0) {
        try {
          await serverSupabase.from('classes').update({ teacher_id: insertedUser.id }).in('id', assignedClassIds);
        } catch (clsErr) {
          console.warn('[Server Supabase] Error linking classes to new teacher:', clsErr);
        }
      }

      // 5. Verify persistence in Supabase: ensure both records exist and are correctly linked
      const { data: verifiedUser, error: verifyUserError } = await serverSupabase
        .from('users')
        .select('id, email, username, role')
        .eq('id', insertedUser.id)
        .single();

      const { data: verifiedProfile, error: verifyProfileError } = await serverSupabase
        .from('teacher_profiles')
        .select('id, teacher_id, employee_code, campus_id')
        .eq('id', insertedProfile.id)
        .single();

      if (verifyUserError || !verifiedUser || verifyProfileError || !verifiedProfile || verifiedProfile.teacher_id !== verifiedUser.id) {
        console.error('[Server Supabase] Persistence verification failed after teacher provisioning');
        res.status(500).json({ error: 'Database persistence verification failed. Teacher record could not be confirmed in Supabase.' });
        return;
      }

      // 6. Record audit log in Supabase
      try {
        await serverSupabase.from('audit_logs').insert([{
          campus_id: targetCampus,
          user_id: user.id.startsWith('usr-') ? user.id : null,
          action: 'TEACHER_PROVISIONED',
          details: {
            entity_type: 'Teacher',
            entity_id: employeeCode,
            teacher_name: cleanFullName,
            reason: `Teacher ${cleanFullName} (${employeeCode}) provisioned for ${targetCampus.toUpperCase()} campus by ${user.email}`,
          },
        }]);
      } catch {
        // non-blocking audit logging
      }
    }

    // 7. Update local JSON ledger cache
    const db = getDatabaseState() || {};

    // When operating in local mode, enforce duplicate check to avoid duplicates on retries
    if (!serverSupabase) {
      const existingLocalUser = (db.users || []).find(
        (u: any) =>
          u.email?.toLowerCase() === cleanEmail.toLowerCase() ||
          u.username?.toLowerCase() === employeeCode.toLowerCase()
      );
      const existingLocalTeacher = (db.teachers || []).find(
        (t: any) => t.employeeCode?.toUpperCase() === employeeCode.toUpperCase()
      );
      if (existingLocalUser || existingLocalTeacher) {
        res.status(400).json({
          error: `A user account with email "${cleanEmail}" or employee code "${employeeCode}" already exists.`,
        });
        return;
      }
    }

    const effectiveTeacherId = (serverSupabase && insertedProfile?.id) ? insertedProfile.id : teacherId;
    const effectiveUserId = (serverSupabase && insertedUser?.id) ? insertedUser.id : userId;

    const newTeacherRecord = {
      id: effectiveTeacherId,
      userId: effectiveUserId,
      campusId: targetCampus,
      employeeCode,
      fullName: cleanFullName,
      email: cleanEmail,
      phone: phone?.trim() || '+44 7700 900000',
      specialization: specialization?.trim() || 'Quran & Tajweed',
      qualification: qualification?.trim() || 'Sanad in Hafs an Asim',
      joinDate: new Date().toISOString().substring(0, 10),
      employmentStatus: 'FULL_TIME',
      assignedClassIds: Array.isArray(assignedClassIds) ? assignedClassIds : [],
      baseMonthlySalary: salary,
      salaryCurrency: currency,
      portalAccessActive: true,
      isActive: true,
    };

    const newUserRecord = {
      id: effectiveUserId,
      email: cleanEmail,
      username: employeeCode.toLowerCase(),
      fullName: cleanFullName,
      role: 'TEACHER',
      campusId: targetCampus,
      allowedCampusIds: [targetCampus],
      isActive: true,
      // Local ledger mode only keeps a password (development); Supabase Auth holds it otherwise.
      ...(serverSupabase ? {} : { password, token: `jwt-${effectiveUserId}-${Date.now()}` }),
      teacherProfileId: effectiveTeacherId,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    const updatedTeachers = [newTeacherRecord, ...(db.teachers || []).filter((t: any) => t.id !== effectiveTeacherId)];
    const updatedUsers = [newUserRecord, ...(db.users || []).filter((u: any) => u.id !== effectiveUserId)];

    saveDatabaseState({
      ...db,
      teachers: updatedTeachers,
      users: updatedUsers,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Teacher ${cleanFullName} (${employeeCode}) provisioned successfully in Supabase.`,
      teacher: newTeacherRecord,
      user: newUserRecord,
    });
  } catch (err: any) {
    console.error('[Server] Exception in /api/teachers/provision:', err);
    res.status(500).json({ error: err?.message || 'Server error provisioning teacher.' });
  }
});

// Update Teacher Profile (Server Authoritative with Strict Persistence Verification)
app.put('/api/teachers/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const configuredHost = getSafeHost(serverSupabaseUrl);
    const db = getDatabaseState() || {};

    // Validate campus parameter if provided
    if (updates.campusId !== undefined) {
      const normCampus = String(updates.campusId).trim().toLowerCase();
      if (normCampus !== 'uk' && normCampus !== 'kts') {
        res.status(400).json({
          success: false,
          error: `Invalid campusId "${updates.campusId}". Allowed campuses are "uk" or "kts".`,
          code: 'INVALID_CAMPUS_ID',
        });
        return;
      }
      if (!enforceCampusAccess(req, res, normCampus)) {
        return;
      }
    }

    // Check mapping consistency between campusId and employeeCode
    if (updates.employeeCode && updates.campusId) {
      const codeUpper = String(updates.employeeCode).trim().toUpperCase();
      const codeCampus = codeUpper.includes('KTS') ? 'kts' : codeUpper.includes('UK') ? 'uk' : null;
      const targetCampus = String(updates.campusId).trim().toLowerCase();
      if (codeCampus && codeCampus !== targetCampus) {
        console.log(`[Teacher Update Mapping Notice] Teacher employeeCode "${codeUpper}" prefix differs from assigned campusId "${targetCampus}". Preserving explicit employeeCode and updating campus assignment without altering class associations.`);
      }
    }

    // --------------------------------------------------------------------------
    // A. SUPABASE POSTGRESQL AUTHORITATIVE EXECUTION FLOW
    // --------------------------------------------------------------------------
    if (serverSupabase) {
      // 1. Locate existing teacher profile in Supabase by ID, linked user ID, employee code, or payload fallbacks
      let currentProfile: any = null;

      // 1a. Search by URL parameter id
      const profileById = await findTeacherProfile(
        id,
        'id, teacher_id, campus_id, employee_code, specialization, qualification, salary, salary_currency, status, assigned_class_ids'
      );
      const findErr1 = null;

      if (profileById) {
        currentProfile = profileById;
      }

      // 1b. Fallback: Search by payload employeeCode
      if (!currentProfile && updates.employeeCode) {
        const cleanEmpCode = String(updates.employeeCode).trim().toUpperCase();
        const { data: profileByCode } = await serverSupabase
          .from('teacher_profiles')
          .select('id, teacher_id, campus_id, employee_code, specialization, qualification, salary, salary_currency, status, assigned_class_ids')
          .eq('employee_code', cleanEmpCode)
          .limit(1)
          .maybeSingle();
        if (profileByCode) {
          currentProfile = profileByCode;
        }
      }

      // 1c. Fallback: Search by linked user email
      if (!currentProfile && updates.email) {
        const cleanEmail = String(updates.email).trim().toLowerCase();
        const { data: userByEmail } = await serverSupabase
          .from('users')
          .select('id, email')
          .eq('email', cleanEmail)
          .limit(1)
          .maybeSingle();
        if (userByEmail) {
          const { data: profileByUserId } = await serverSupabase
            .from('teacher_profiles')
            .select('id, teacher_id, campus_id, employee_code, specialization, qualification, salary, salary_currency, status, assigned_class_ids')
            .eq('teacher_id', userByEmail.id)
            .limit(1)
            .maybeSingle();
          if (profileByUserId) {
            currentProfile = profileByUserId;
          }
        }
      }

      // CRITICAL: If no record matched in Supabase, zero rows can be affected. Reject immediately.
      if (!currentProfile) {
        console.warn(`[Teacher Update Safe Diagnostics] matchedProfileId=null, linkedUserId=null, tableUpdated=none, affectedRows=0, supabaseErrorCode="PGRST116", configuredHost="${configuredHost}"`);
        res.status(404).json({
          success: false,
          error: `Zero rows affected: No teacher profile found in Supabase matching identifier "${id}"${updates.employeeCode ? `, employeeCode "${updates.employeeCode}"` : ''}${updates.email ? `, or email "${updates.email}"` : ''}.`,
          code: 'TEACHER_NOT_FOUND',
          diagnostic: {
            matchedTeacherProfileId: null,
            linkedUserId: null,
            tableUpdated: null,
            affectedRowCount: 0,
            supabaseErrorCode: 'PGRST116',
            configuredSupabaseHost: configuredHost,
            databaseMode: 'supabase_authoritative',
          },
        });
        return;
      }

      // Enforce campus isolation on the found profile
      if (!enforceCampusAccess(req, res, currentProfile.campus_id)) {
        return;
      }

      // 2. Build and execute update on teacher_profiles
      const sbProfileUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.specialization !== undefined) sbProfileUpdates.specialization = String(updates.specialization).trim();
      if (updates.qualification !== undefined) sbProfileUpdates.qualification = String(updates.qualification).trim();
      if (updates.baseMonthlySalary !== undefined) sbProfileUpdates.salary = Number(updates.baseMonthlySalary);
      if (updates.salaryCurrency !== undefined) sbProfileUpdates.salary_currency = String(updates.salaryCurrency).trim();
      if (updates.portalAccessActive !== undefined) sbProfileUpdates.status = updates.portalAccessActive ? 'active' : 'suspended';
      if (updates.campusId !== undefined) {
        sbProfileUpdates.campus_id = String(updates.campusId).trim().toLowerCase();
      }
      if (updates.employeeCode !== undefined && String(updates.employeeCode).trim()) {
        sbProfileUpdates.employee_code = String(updates.employeeCode).trim().toUpperCase();
      }
      // Preserve existing assigned classes unless explicitly provided as an array
      if (Array.isArray(updates.assignedClassIds)) {
        sbProfileUpdates.assigned_class_ids = updates.assignedClassIds;
      }

      const { data: updatedProfileData, error: profileUpdateErr, count: profileCount } = await serverSupabase
        .from('teacher_profiles')
        .update(sbProfileUpdates, { count: 'exact' })
        .eq('id', currentProfile.id)
        .select();

      if (profileUpdateErr) {
        console.error(`[Teacher Update Safe Diagnostics] matchedProfileId="${currentProfile.id}", linkedUserId="${currentProfile.teacher_id}", tableUpdated="teacher_profiles", affectedRows=0, supabaseErrorCode="${profileUpdateErr.code}", configuredHost="${configuredHost}"`);
        res.status(500).json({
          success: false,
          error: `Database error updating teacher_profiles in Supabase: ${profileUpdateErr.message}`,
          code: profileUpdateErr.code || 'DB_UPDATE_ERROR',
          diagnostic: {
            matchedTeacherProfileId: currentProfile.id,
            linkedUserId: currentProfile.teacher_id,
            tableUpdated: 'teacher_profiles',
            affectedRowCount: 0,
            supabaseErrorCode: profileUpdateErr.code || null,
            configuredSupabaseHost: configuredHost,
          },
        });
        return;
      }

      const profileAffectedRows = updatedProfileData ? updatedProfileData.length : (profileCount ?? 0);
      if (profileAffectedRows === 0) {
        console.error(`[Teacher Update Safe Diagnostics] matchedProfileId="${currentProfile.id}", linkedUserId="${currentProfile.teacher_id}", tableUpdated="teacher_profiles", affectedRows=0, supabaseErrorCode=null, configuredHost="${configuredHost}"`);
        res.status(404).json({
          success: false,
          error: 'Zero rows affected: Teacher profile could not be updated in Supabase.',
          code: 'ZERO_ROWS_AFFECTED',
          diagnostic: {
            matchedTeacherProfileId: currentProfile.id,
            linkedUserId: currentProfile.teacher_id,
            tableUpdated: 'teacher_profiles',
            affectedRowCount: 0,
            supabaseErrorCode: null,
            configuredSupabaseHost: configuredHost,
          },
        });
        return;
      }

      // 3. Build and execute update on linked users record
      let userAffectedRows = 0;
      const linkedUserId = currentProfile.teacher_id;
      if (linkedUserId) {
        const sbUserUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.fullName) {
          const parts = String(updates.fullName).trim().split(' ');
          sbUserUpdates.first_name = parts[0] || '';
          sbUserUpdates.last_name = parts.slice(1).join(' ') || '';
        }
        if (updates.email) {
          sbUserUpdates.email = String(updates.email).trim().toLowerCase();
        }
        if (updates.phone) {
          sbUserUpdates.contact_number = String(updates.phone).trim();
        }
        if (updates.portalAccessActive !== undefined) {
          sbUserUpdates.status = updates.portalAccessActive ? 1 : 0;
        }
        if (updates.campusId !== undefined) {
          const targetCampus = String(updates.campusId).trim().toLowerCase();
          sbUserUpdates.active_campus_id = targetCampus;
          sbUserUpdates.allowed_campus_ids = [targetCampus];
        }
        if (updates.employeeCode !== undefined && String(updates.employeeCode).trim()) {
          sbUserUpdates.username = String(updates.employeeCode).trim().toLowerCase();
        }

        const { data: updatedUserData, error: userUpdateErr, count: userCount } = await serverSupabase
          .from('users')
          .update(sbUserUpdates, { count: 'exact' })
          .eq('id', linkedUserId)
          .select();

        if (userUpdateErr) {
          console.error(`[Teacher Update Safe Diagnostics] matchedProfileId="${currentProfile.id}", linkedUserId="${linkedUserId}", tableUpdated="users", affectedRows=0, supabaseErrorCode="${userUpdateErr.code}", configuredHost="${configuredHost}"`);
          res.status(500).json({
            success: false,
            error: `Database error updating linked user record in Supabase: ${userUpdateErr.message}`,
            code: userUpdateErr.code || 'DB_UPDATE_ERROR',
            diagnostic: {
              matchedTeacherProfileId: currentProfile.id,
              linkedUserId,
              tableUpdated: 'users',
              affectedRowCount: 0,
              supabaseErrorCode: userUpdateErr.code || null,
              configuredSupabaseHost: configuredHost,
            },
          });
          return;
        }

        userAffectedRows = updatedUserData ? updatedUserData.length : (userCount ?? 0);
        if (userAffectedRows === 0) {
          console.error(`[Teacher Update Safe Diagnostics] matchedProfileId="${currentProfile.id}", linkedUserId="${linkedUserId}", tableUpdated="users", affectedRows=0, supabaseErrorCode=null, configuredHost="${configuredHost}"`);
          res.status(404).json({
            success: false,
            error: 'Zero rows affected: Linked user record could not be updated in Supabase.',
            code: 'ZERO_ROWS_AFFECTED',
            diagnostic: {
              matchedTeacherProfileId: currentProfile.id,
              linkedUserId,
              tableUpdated: 'users',
              affectedRowCount: 0,
              supabaseErrorCode: null,
              configuredSupabaseHost: configuredHost,
            },
          });
          return;
        }
      }

      // 4. Update classes assignment if explicitly provided
      if (Array.isArray(updates.assignedClassIds) && linkedUserId) {
        try {
          await serverSupabase.from('classes').update({ teacher_id: linkedUserId }).in('id', updates.assignedClassIds);
        } catch (clsErr) {
          console.warn('[Server Supabase] Error linking classes to teacher:', clsErr);
        }
      }

      // 5. Directly verify persisted records in Supabase after update
      const { data: verifiedProfile, error: vProfileErr } = await serverSupabase
        .from('teacher_profiles')
        .select('id, teacher_id, campus_id, employee_code, specialization, qualification, salary, salary_currency, status, assigned_class_ids, updated_at')
        .eq('id', currentProfile.id)
        .single();

      const { data: verifiedUser, error: vUserErr } = await serverSupabase
        .from('users')
        .select('id, email, username, first_name, last_name, role, active_campus_id, allowed_campus_ids, status, contact_number, updated_at')
        .eq('id', linkedUserId)
        .single();

      if (vProfileErr || !verifiedProfile || vUserErr || !verifiedUser || verifiedProfile.teacher_id !== verifiedUser.id) {
        console.error('[Server Supabase] Persistence verification failed after update:', { vProfileErr, vUserErr });
        res.status(500).json({
          success: false,
          error: 'Persistence verification failed: Teacher profile or user account could not be verified in Supabase after update.',
          code: 'PERSISTENCE_VERIFICATION_FAILED',
          diagnostic: {
            matchedTeacherProfileId: currentProfile.id,
            linkedUserId,
            tableUpdated: 'teacher_profiles, users',
            affectedRowCount: profileAffectedRows + userAffectedRows,
            supabaseErrorCode: vProfileErr?.code || vUserErr?.code || null,
            configuredSupabaseHost: configuredHost,
          },
        });
        return;
      }

      // 6. Log safe diagnostics (Never exposing credentials)
      console.log(`[Teacher Update Safe Diagnostics] matchedTeacherProfileId="${currentProfile.id}", linkedUsersId="${linkedUserId}", tablesUpdated="teacher_profiles, users", profileRows=${profileAffectedRows}, userRows=${userAffectedRows}, supabaseErrorCode=none, configuredHost="${configuredHost}"`);

      // 7. Update local JSON cache with verified Supabase state
      const localTeachers = (db.teachers || []).filter((t: any) => t.id !== verifiedProfile.id && t.userId !== verifiedUser.id);
      const localUsers = (db.users || []).filter((u: any) => u.id !== verifiedUser.id);

      const cacheTeacher = {
        id: verifiedProfile.id,
        userId: verifiedProfile.teacher_id,
        campusId: verifiedProfile.campus_id,
        employeeCode: verifiedProfile.employee_code,
        fullName: `${verifiedUser.first_name || ''} ${verifiedUser.last_name || ''}`.trim() || verifiedProfile.specialization,
        email: verifiedUser.email,
        phone: verifiedUser.contact_number || '+44 7700 900000',
        specialization: verifiedProfile.specialization,
        qualification: verifiedProfile.qualification,
        baseMonthlySalary: Number(verifiedProfile.salary),
        salaryCurrency: verifiedProfile.salary_currency,
        portalAccessActive: verifiedProfile.status === 'active',
        isActive: verifiedProfile.status === 'active',
        assignedClassIds: verifiedProfile.assigned_class_ids || [],
      };

      const cacheUser = {
        id: verifiedUser.id,
        email: verifiedUser.email,
        username: verifiedUser.username,
        fullName: `${verifiedUser.first_name || ''} ${verifiedUser.last_name || ''}`.trim(),
        role: verifiedUser.role,
        campusId: verifiedUser.active_campus_id,
        allowedCampusIds: verifiedUser.allowed_campus_ids,
        isActive: verifiedUser.status === 1,
        teacherProfileId: verifiedProfile.id,
      };

      saveDatabaseState({
        ...db,
        teachers: [cacheTeacher, ...localTeachers],
        users: [cacheUser, ...localUsers],
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Teacher profile updated successfully.',
        diagnostic: {
          matchedTeacherProfileId: verifiedProfile.id,
          linkedUserId: verifiedUser.id,
          tableUpdated: 'teacher_profiles, users',
          affectedRowCount: {
            teacher_profiles: profileAffectedRows,
            users: userAffectedRows,
            total: profileAffectedRows + userAffectedRows,
          },
          supabaseErrorCode: null,
          configuredSupabaseHost: configuredHost,
          databaseMode: 'supabase_authoritative',
          verified: {
            teacherProfile: {
              id: verifiedProfile.id,
              teacherId: verifiedProfile.teacher_id,
              employeeCode: verifiedProfile.employee_code,
              campusId: verifiedProfile.campus_id,
              salary: verifiedProfile.salary,
              salaryCurrency: verifiedProfile.salary_currency,
              status: verifiedProfile.status,
            },
            user: {
              id: verifiedUser.id,
              email: verifiedUser.email,
              username: verifiedUser.username,
              fullName: `${verifiedUser.first_name} ${verifiedUser.last_name}`.trim(),
              campusId: verifiedUser.active_campus_id,
              allowedCampusIds: verifiedUser.allowed_campus_ids,
              status: verifiedUser.status,
            },
          },
        },
      });
      return;
    }

    // --------------------------------------------------------------------------
    // B. LOCAL AUTHORITATIVE DATABASE LEDGER FLOW (When Supabase is not active)
    // --------------------------------------------------------------------------
    const existing = (db.teachers || []).find(
      (t: any) =>
        t.id === id ||
        t.userId === id ||
        t.employeeCode === id ||
        (updates.employeeCode && t.employeeCode?.toUpperCase() === String(updates.employeeCode).trim().toUpperCase()) ||
        (updates.email && t.email?.toLowerCase() === String(updates.email).trim().toLowerCase())
    );

    // Zero affected rows cannot produce a success response
    if (!existing) {
      console.warn(`[Teacher Update Safe Diagnostics] matchedProfileId=null, linkedUserId=null, tableUpdated=none, affectedRows=0, error="Record not found in local ledger", configuredHost="${configuredHost}"`);
      res.status(404).json({
        success: false,
        error: `Zero rows affected: No teacher record found in database ledger matching identifier "${id}".`,
        code: 'ZERO_ROWS_AFFECTED',
        diagnostic: {
          matchedTeacherProfileId: null,
          linkedUserId: null,
          tableUpdated: null,
          affectedRowCount: 0,
          supabaseErrorCode: null,
          configuredSupabaseHost: configuredHost,
          databaseMode: 'local_database_ledger',
        },
      });
      return;
    }

    if (!enforceCampusAccess(req, res, existing.campusId)) {
      return;
    }

    // Apply updates to local teacher record
    if (updates.fullName !== undefined) existing.fullName = String(updates.fullName).trim();
    if (updates.employeeCode !== undefined && String(updates.employeeCode).trim()) {
      existing.employeeCode = String(updates.employeeCode).trim().toUpperCase();
    }
    if (updates.campusId !== undefined) {
      existing.campusId = String(updates.campusId).trim().toLowerCase();
    }
    if (updates.email !== undefined) existing.email = String(updates.email).trim().toLowerCase();
    if (updates.phone !== undefined) existing.phone = String(updates.phone).trim();
    if (updates.specialization !== undefined) existing.specialization = String(updates.specialization).trim();
    if (updates.qualification !== undefined) existing.qualification = String(updates.qualification).trim();
    if (updates.baseMonthlySalary !== undefined) existing.baseMonthlySalary = Number(updates.baseMonthlySalary);
    if (updates.salaryCurrency !== undefined) existing.salaryCurrency = String(updates.salaryCurrency).trim();
    if (updates.portalAccessActive !== undefined) {
      existing.portalAccessActive = Boolean(updates.portalAccessActive);
      existing.isActive = Boolean(updates.portalAccessActive);
    }
    if (updates.employmentStatus !== undefined) existing.employmentStatus = updates.employmentStatus;
    if (Array.isArray(updates.assignedClassIds)) existing.assignedClassIds = updates.assignedClassIds;

    // Update linked user
    let userAffected = 0;
    const linkedUser = (db.users || []).find((u: any) => u.id === existing.userId || u.teacherProfileId === existing.id);
    if (linkedUser) {
      if (updates.fullName) {
        linkedUser.fullName = String(updates.fullName).trim();
        const parts = String(updates.fullName).trim().split(' ');
        linkedUser.firstName = parts[0] || '';
        linkedUser.lastName = parts.slice(1).join(' ') || '';
      }
      if (updates.email) linkedUser.email = String(updates.email).trim().toLowerCase();
      if (updates.phone) linkedUser.contactNumber = String(updates.phone).trim();
      if (updates.campusId) {
        const normCampus = String(updates.campusId).trim().toLowerCase();
        linkedUser.campusId = normCampus;
        linkedUser.allowedCampusIds = [normCampus];
      }
      if (updates.employeeCode) linkedUser.username = String(updates.employeeCode).trim().toLowerCase();
      if (updates.portalAccessActive !== undefined) linkedUser.isActive = Boolean(updates.portalAccessActive);
      userAffected = 1;
    }

    saveDatabaseState({ ...db, updatedAt: new Date().toISOString() });

    // Directly re-verify persisted state from disk
    const reReadDb = getDatabaseState() || {};
    const verifiedTeacher = (reReadDb.teachers || []).find((t: any) => t.id === existing.id);
    const verifiedUser = (reReadDb.users || []).find((u: any) => u.id === existing.userId);

    if (!verifiedTeacher) {
      res.status(500).json({
        success: false,
        error: 'Persistence verification failed: Updated teacher record could not be confirmed in database.',
        code: 'PERSISTENCE_VERIFICATION_FAILED',
      });
      return;
    }

    console.log(`[Teacher Update Safe Diagnostics] matchedTeacherProfileId="${existing.id}", linkedUsersId="${existing.userId}", tablesUpdated="teachers, users", profileRows=1, userRows=${userAffected}, supabaseErrorCode=none, configuredHost="${configuredHost}"`);

    res.json({
      success: true,
      message: 'Teacher profile updated successfully.',
      diagnostic: {
        matchedTeacherProfileId: existing.id,
        linkedUserId: existing.userId,
        tableUpdated: 'teachers, users',
        affectedRowCount: {
          teachers: 1,
          users: userAffected,
          total: 1 + userAffected,
        },
        supabaseErrorCode: null,
        configuredSupabaseHost: configuredHost,
        databaseMode: 'local_database_ledger',
        verified: {
          teacherProfile: {
            ...verifiedTeacher,
            salary: verifiedTeacher.baseMonthlySalary,
          },
          user: verifiedUser,
        },
      },
    });
  } catch (err: any) {
    console.error('[Server] Exception in PUT /api/teachers/:id:', err);
    res.status(500).json({ error: err?.message || 'Failed to update teacher.' });
  }
});

// Delete Teacher Profile (Server Authoritative with Strict Persistence Verification)
app.delete('/api/teachers/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const configuredHost = getSafeHost(serverSupabaseUrl);
    const db = getDatabaseState() || {};

    let profile: any = null;
    let deletedProfileCount = 0;
    let deletedUserCount = 0;

    if (serverSupabase) {
      // Find profile by id, teacher_id, or employee_code
      const foundProfile = await findTeacherProfile(id, 'id, teacher_id, campus_id, employee_code');

      profile = foundProfile;

      if (!profile) {
        console.warn(`[Teacher Delete Safe Diagnostics] matchedProfileId=null, tableUpdated=none, affectedRows=0, configuredHost="${configuredHost}"`);
        res.status(404).json({
          success: false,
          error: `Zero rows affected: No teacher record found in Supabase matching identifier "${id}".`,
          code: 'ZERO_ROWS_AFFECTED',
          diagnostic: {
            matchedTeacherProfileId: null,
            linkedUserId: null,
            tableUpdated: null,
            affectedRowCount: 0,
            configuredSupabaseHost: configuredHost,
          },
        });
        return;
      }

      if (!enforceCampusAccess(req, res, profile.campus_id)) {
        return;
      }

      // 1. Unlink any classes assigned to this teacher in Supabase
      if (profile.teacher_id) {
        try {
          await serverSupabase
            .from('classes')
            .update({ teacher_id: null })
            .in('teacher_id', [profile.teacher_id, profile.id]);
        } catch (clsErr) {
          console.warn('[Server Supabase] Error unlinking classes for teacher:', clsErr);
        }
      }

      // 2. Delete teacher profile from teacher_profiles table
      const { data: delProfData, error: delProfileErr, count: delProfCount } = await serverSupabase
        .from('teacher_profiles')
        .delete({ count: 'exact' })
        .eq('id', profile.id)
        .select();

      if (delProfileErr) {
        console.error('[Server Supabase] Error deleting teacher profile:', delProfileErr);
        res.status(500).json({
          success: false,
          error: `Failed to delete teacher profile in Supabase: ${delProfileErr.message}`,
          code: delProfileErr.code || 'DB_DELETE_ERROR',
        });
        return;
      }

      deletedProfileCount = delProfData ? delProfData.length : (delProfCount ?? 1);

      // 3. Delete linked user account from users table
      if (profile.teacher_id) {
        const { data: linkedUser } = await serverSupabase
          .from('users').select('auth_user_id').eq('id', profile.teacher_id).maybeSingle();
        const { data: delUserData, error: delUserErr, count: delUserCount } = await serverSupabase
          .from('users')
          .delete({ count: 'exact' })
          .eq('id', profile.teacher_id)
          .select();

        if (delUserErr && delUserErr.code === '23503') {
          // Attendance history references this teacher: keep it, but disable the account.
          await serverSupabase.from('users').update({ status: 0 }).eq('id', profile.teacher_id);
          if (linkedUser?.auth_user_id) {
            await authSvc.updateAuthAccount(serverSupabase, linkedUser.auth_user_id, { isActive: false });
          }
          console.info(`[Server Supabase] Teacher user ${profile.teacher_id} has history; account deactivated instead of deleted.`);
        } else if (delUserErr) {
          console.error('[Server Supabase] Error deleting user account for teacher:', delUserErr);
          res.status(500).json({ success: false, error: `Teacher profile removed, but the login account could not be removed: ${delUserErr.message}` });
          return;
        } else {
          deletedUserCount = delUserData ? delUserData.length : (delUserCount ?? 1);
          await authSvc.deleteAuthAccount(serverSupabase, linkedUser?.auth_user_id);
        }
      }

      // 4. Record audit log
      try {
        await serverSupabase.from('audit_logs').insert([{
          campus_id: profile.campus_id,
          user_id: req.user?.id?.startsWith('usr-') ? req.user.id : null,
          action: 'TEACHER_RECORD_DELETED',
          details: {
            entity_type: 'Teacher',
            entity_id: profile.id,
            employee_code: profile.employee_code,
            deleted_by: req.user?.email || 'admin',
            timestamp: new Date().toISOString(),
          },
        }]);
      } catch {
        // non-blocking
      }

      // 5. Verify deletion directly in Supabase
      const { data: reCheckProfile } = await serverSupabase
        .from('teacher_profiles')
        .select('id')
        .eq('id', profile.id)
        .maybeSingle();

      if (reCheckProfile) {
        res.status(500).json({
          success: false,
          error: 'Verification failed: Teacher profile still exists in Supabase after deletion command.',
          code: 'DELETION_VERIFICATION_FAILED',
        });
        return;
      }

      console.log(`[Teacher Delete Safe Diagnostics] matchedTeacherProfileId="${profile.id}", linkedUsersId="${profile.teacher_id}", tablesUpdated="teacher_profiles, users", profileRows=${deletedProfileCount}, userRows=${deletedUserCount}, configuredHost="${configuredHost}"`);
    } else {
      // Local ledger deletion
      const existing = (db.teachers || []).find((t: any) => t.id === id || t.userId === id || t.employeeCode === id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Zero rows affected: No teacher record found in database ledger matching identifier "${id}".`,
          code: 'ZERO_ROWS_AFFECTED',
          diagnostic: {
            matchedTeacherProfileId: null,
            linkedUserId: null,
            tableUpdated: null,
            affectedRowCount: 0,
            configuredSupabaseHost: configuredHost,
          },
        });
        return;
      }

      if (!enforceCampusAccess(req, res, existing.campusId)) {
        return;
      }
    }

    // Update local JSON ledger
    const existingInLocal = (db.teachers || []).find((t: any) => t.id === id || t.userId === id || t.employeeCode === id);
    const targetUserId = existingInLocal?.userId || (profile && profile.teacher_id) || (id.startsWith('usr-') ? id : undefined);
    const targetProfileId = profile?.id || existingInLocal?.id || id;

    if (db.teachers) {
      db.teachers = db.teachers.filter(
        (t: any) =>
          t.id !== id &&
          t.id !== targetProfileId &&
          t.userId !== id &&
          (!targetUserId || t.userId !== targetUserId) &&
          t.employeeCode !== id
      );
    }
    if (db.users && targetUserId) {
      db.users = db.users.filter(
        (u: any) =>
          u.id !== targetUserId &&
          u.teacherProfileId !== id &&
          u.teacherProfileId !== targetProfileId
      );
    }
    if (db.classes) {
      db.classes.forEach((c: any) => {
        if (c.teacherId === id || c.leadTeacherId === id || (targetUserId && (c.teacherId === targetUserId || c.leadTeacherId === targetUserId))) {
          c.teacherId = undefined;
          c.leadTeacherId = undefined;
          c.leadTeacherName = 'Unassigned';
        }
      });
    }
    saveDatabaseState(db);

    res.json({
      success: true,
      message: 'Teacher permanently removed from database and assigned classes unlinked.',
      diagnostic: {
        matchedTeacherProfileId: targetProfileId,
        linkedUserId: targetUserId,
        tablesUpdated: 'teacher_profiles, users, classes',
        affectedRowCount: {
          teacher_profiles: deletedProfileCount || 1,
          users: deletedUserCount || 1,
        },
        configuredSupabaseHost: configuredHost,
      },
    });
  } catch (err: any) {
    console.error('[Server] Exception in DELETE /api/teachers/:id:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete teacher.' });
  }
});



// ==============================================================================
// 2.2 STUDENT PROVISIONING & CRUD (Server Authoritative)
// ==============================================================================
app.post('/api/students/provision', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CAMPUS_ADMIN') {
      res.status(403).json({ error: 'Permission denied. Only Super Admin or Campus Admin can enroll students.' });
      return;
    }

    const {
      firstName,
      lastName,
      admissionNumber,
      campusId,
      classId,
      className,
      section,
      currentGrade,
      gender,
      dob,
      enrollmentDate,
      primaryParentName,
      primaryParentPhone,
      address,
      bloodGroup,
      medicalNotes,
      quranMilestone,
      monthlyFee,
      admissionFee,
      isActive,
      approvalStatus,
    } = req.body;

    if (!firstName || !firstName.trim()) {
      res.status(400).json({ error: 'Student First Name is required.' });
      return;
    }

    const targetCampus = (campusId || 'uk').toLowerCase();
    if (!enforceCampusAccess(req, res, targetCampus)) {
      return;
    }

    const studentId = `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const prefix = targetCampus.toUpperCase();
    const generatedRoll = admissionNumber?.trim() || `MUQ-${prefix}-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    let validClassId = classId || null;
    if (serverSupabase && validClassId) {
      const { data: clsCheck } = await serverSupabase
        .from('classes')
        .select('id')
        .eq('id', validClassId)
        .limit(1);
      if (!clsCheck || clsCheck.length === 0) {
        validClassId = null;
      }
    }

    const studentPayload = {
      id: studentId,
      campus_id: targetCampus,
      first_name: firstName.trim(),
      last_name: (lastName || '').trim(),
      roll_number: generatedRoll,
      gender: (gender || 'FEMALE').toLowerCase(),
      date_of_birth: dob || '2016-06-15',
      class_id: validClassId,
      approval_status: approvalStatus || 'APPROVED',
      status: isActive !== false ? 'active' : 'inactive',
      address: address?.trim() || null,
      monthly_fee_amount: Number(monthlyFee || 0),
      admission_fee_amount: Number(admissionFee || 0),
      admission_date: enrollmentDate || new Date().toISOString().substring(0, 10),
      primary_contact_details: primaryParentPhone ? { name: primaryParentName, phone: primaryParentPhone } : null,
      blood_group: bloodGroup || null,
      medical_notes: medicalNotes?.trim() || null,
      quran_milestone: quranMilestone || null,
    };

    if (serverSupabase) {
      const { error: insertError } = await serverSupabase.from('students').insert([studentPayload]);
      if (insertError) {
        console.error('[Server Supabase] Student insert error:', insertError);
        res.status(500).json({ error: `Supabase student insertion failed: ${insertError.message}` });
        return;
      }

      try {
        await serverSupabase.from('audit_logs').insert([{
          campus_id: targetCampus,
          user_id: user.id.startsWith('usr-') ? user.id : null,
          action: 'STUDENT_ENROLLED',
          details: {
            entity_type: 'Student',
            entity_id: generatedRoll,
            student_name: `${firstName} ${lastName || ''}`.trim(),
            reason: `Student ${firstName} ${lastName || ''} enrolled in ${targetCampus.toUpperCase()} by ${user.email}`,
          },
        }]);
      } catch {
        // non-blocking
      }
    }

    const newRecord = {
      id: studentId,
      admissionNumber: generatedRoll,
      campusId: targetCampus,
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      gender: gender || 'FEMALE',
      dob: dob || '2016-06-15',
      enrollmentDate: enrollmentDate || new Date().toISOString().substring(0, 10),
      currentGrade: currentGrade || 'G1',
      classId: validClassId || classId,
      className: className || 'General',
      section: section || 'Section A',
      primaryParentName: primaryParentName || 'Parent / Guardian',
      primaryParentPhone: primaryParentPhone || '',
      address: address || '',
      bloodGroup: bloodGroup || 'B+',
      medicalNotes: medicalNotes || '',
      quranMilestone: quranMilestone || 'Juz 1',
      monthlyFee: Number(monthlyFee || 0),
      admissionFee: Number(admissionFee || 0),
      isActive: isActive !== false,
      approvalStatus: approvalStatus || 'APPROVED',
      attendanceRate: 100,
      feeStatus: 'UP_TO_DATE',
      portalAccessActive: true,
    };

    const db = getDatabaseState() || {};
    const updatedStudents = [newRecord, ...(db.students || []).filter((s: any) => s.id !== studentId)];
    saveDatabaseState({
      ...db,
      students: updatedStudents,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Student ${firstName} ${lastName || ''} [${generatedRoll}] enrolled successfully in Supabase.`,
      student: newRecord,
    });
  } catch (err: any) {
    console.error('[Server] Exception in /api/students/provision:', err);
    res.status(500).json({ error: err?.message || 'Server error provisioning student.' });
  }
});

app.put('/api/students/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = getDatabaseState() || {};
    const existing = (db.students || []).find((s: any) => s.id === id);

    if (!requireAdmin(req, res)) {
      return;
    }
    if (!(await enforceRecordCampus(req, res, 'students', id, existing?.campusId))) {
      return;
    }

    if (serverSupabase) {
      let validClassId = updates.classId;
      if (validClassId !== undefined) {
        if (validClassId) {
          const { data: clsCheck } = await serverSupabase
            .from('classes')
            .select('id')
            .eq('id', validClassId)
            .limit(1);
          if (!clsCheck || clsCheck.length === 0) {
            validClassId = null;
          }
        }
      }

      const sbUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.firstName !== undefined) sbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) sbUpdates.last_name = updates.lastName;
      if (updates.admissionNumber !== undefined) sbUpdates.roll_number = updates.admissionNumber;
      if (updates.gender !== undefined) sbUpdates.gender = (updates.gender || 'female').toLowerCase();
      if (updates.dob !== undefined) sbUpdates.date_of_birth = updates.dob;
      if (validClassId !== undefined) sbUpdates.class_id = validClassId;
      if (updates.address !== undefined) sbUpdates.address = updates.address;
      if (updates.monthlyFee !== undefined) sbUpdates.monthly_fee_amount = Number(updates.monthlyFee);
      if (updates.admissionFee !== undefined) sbUpdates.admission_fee_amount = Number(updates.admissionFee);
      if (updates.isActive !== undefined) sbUpdates.status = updates.isActive ? 'active' : 'inactive';
      if (updates.enrollmentDate !== undefined) sbUpdates.admission_date = updates.enrollmentDate || null;
      if (updates.approvalStatus !== undefined) sbUpdates.approval_status = updates.approvalStatus;
      if (updates.bloodGroup !== undefined) sbUpdates.blood_group = updates.bloodGroup || null;
      if (updates.medicalNotes !== undefined) sbUpdates.medical_notes = updates.medicalNotes || null;
      if (updates.quranMilestone !== undefined) sbUpdates.quran_milestone = updates.quranMilestone || null;
      if (updates.portalAccessActive !== undefined) sbUpdates.portal_access_active = updates.portalAccessActive !== false;
      if (updates.primaryParentName !== undefined || updates.primaryParentPhone !== undefined) {
        // Merge with the stored contact so a partial edit (only name or only phone) keeps the other value.
        let currentContact: { name?: string; phone?: string } = {};
        const { data: contactRow } = await serverSupabase
          .from('students')
          .select('primary_contact_details')
          .eq('id', id)
          .maybeSingle();
        const raw = contactRow?.primary_contact_details;
        try {
          currentContact = (typeof raw === 'string' ? JSON.parse(raw) : raw) || {};
        } catch {
          currentContact = {};
        }
        sbUpdates.primary_contact_details = {
          name: updates.primaryParentName !== undefined ? updates.primaryParentName : currentContact.name,
          phone: updates.primaryParentPhone !== undefined ? updates.primaryParentPhone : currentContact.phone,
        };
      }

      const { error: updateError } = await serverSupabase
        .from('students')
        .update(sbUpdates)
        .eq('id', id);

      if (updateError) {
        console.error('[Server Supabase] Student update error:', updateError);
        res.status(500).json({ error: `Supabase student update failed: ${updateError.message}` });
        return;
      }
    }

    if (existing) {
      Object.assign(existing, updates);
      saveDatabaseState(db);
    }

    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update student.' });
  }
});

app.delete('/api/students/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabaseState() || {};
    const existing = (db.students || []).find((s: any) => s.id === id);

    if (!requireAdmin(req, res)) {
      return;
    }
    if (!(await enforceRecordCampus(req, res, 'students', id, existing?.campusId))) {
      return;
    }

    if (serverSupabase) {
      const { data: row } = await serverSupabase
        .from('students').select('id, campus_id, first_name, last_name, roll_number').eq('id', id).maybeSingle();
      if (!row) {
        res.status(404).json({ error: 'Student not found.' });
        return;
      }
      if (!enforceCampusAccess(req, res, row.campus_id)) {
        return;
      }
      // Soft delete: the student disappears from the app but attendance, invoices
      // and medical history stay intact.
      const nowIso = new Date().toISOString();
      const { error: archiveError } = await serverSupabase
        .from('students')
        .update({ status: 'archived', archived_at: nowIso })
        .eq('id', id);
      if (archiveError) {
        console.error('[Server Supabase] Student archive error:', archiveError);
        res.status(500).json({ error: `Supabase student archive failed: ${archiveError.message}` });
        return;
      }
      await serverSupabase.from('audit_logs').insert([{
        campus_id: row.campus_id,
        user_id: req.user?.id || null,
        action: 'STUDENT_ARCHIVED',
        details: {
          entity_type: 'Student',
          entity_id: row.id,
          roll_number: row.roll_number,
          student_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          archived_by: req.user?.email || 'admin',
        },
      }]);
    }

    if (db.students) {
      db.students = db.students.filter((s: any) => s.id !== id);
      saveDatabaseState(db);
    }

    res.json({ success: true, message: 'Student removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete student.' });
  }
});

// ==============================================================================
// 2.3 CLASS MANAGEMENT & CRUD (Server Authoritative)
// ==============================================================================
app.post('/api/classes', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CAMPUS_ADMIN') {
      res.status(403).json({ error: 'Permission denied to create classes.' });
      return;
    }

    const { name, campusId, code, gradeLevel, leadTeacherId, leadTeacherName, scheduleTime, room, maxCapacity } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Class name is required.' });
      return;
    }

    const targetCampus = (campusId || 'uk').toLowerCase();
    if (!enforceCampusAccess(req, res, targetCampus)) {
      return;
    }

    const classId = `cls-${targetCampus}-${Date.now()}`;
    const generatedCode = code?.trim().toUpperCase() || `${targetCampus.toUpperCase()}-CLS-${String(Math.floor(10 + Math.random() * 90))}`;

    let validTeacherUserId: string | null = null;
    if (serverSupabase && leadTeacherId) {
      // Check if leadTeacherId is already a user ID
      const { data: userMatch } = await serverSupabase.from('users').select('id').eq('id', leadTeacherId).limit(1);
      if (userMatch && userMatch.length > 0) {
        validTeacherUserId = leadTeacherId;
      } else {
        // Check if leadTeacherId is a teacher_profiles ID
        const { data: profMatch } = await serverSupabase.from('teacher_profiles').select('teacher_id').eq('id', leadTeacherId).limit(1);
        if (profMatch && profMatch.length > 0 && profMatch[0].teacher_id) {
          validTeacherUserId = profMatch[0].teacher_id;
        }
      }
    }

    if (serverSupabase) {
      const { error: classErr } = await serverSupabase.from('classes').insert([{
        id: classId,
        campus_id: targetCampus,
        title: name.trim(),
        name: name.trim(),
        code: generatedCode,
        capacity: Number(maxCapacity) || 25,
        academic_year: '2025-2026',
        teacher_id: validTeacherUserId,
        grade_level: gradeLevel || null,
        room: room || null,
        schedule_time: scheduleTime || null,
        is_active: true,
      }]);

      if (classErr) {
        console.error('[Server Supabase] Class insert error:', classErr);
        res.status(500).json({ error: `Supabase class insert failed: ${classErr.message}` });
        return;
      }
    }

    const newClassRoom = {
      id: classId,
      campusId: targetCampus,
      name: name.trim(),
      code: generatedCode,
      gradeLevel: gradeLevel || 'General Halaqah',
      academicYear: '2025-2026',
      capacity: Number(maxCapacity) || 25,
      maxCapacity: Number(maxCapacity) || 25,
      leadTeacherId: leadTeacherId || undefined,
      leadTeacherName: leadTeacherName || undefined,
      studentCount: 0,
      currentEnrollment: 0,
      scheduleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      scheduleTime: scheduleTime || '5:00 PM - 7:30 PM (Mon-Fri)',
      room: room || 'Main Hall',
      isActive: true,
    };

    const db = getDatabaseState() || {};
    db.classes = [newClassRoom, ...(db.classes || []).filter((c: any) => c.id !== classId)];
    saveDatabaseState(db);

    res.json({
      success: true,
      message: `Class "${name}" created successfully in Supabase.`,
      classRoom: newClassRoom,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create class.' });
  }
});

app.put('/api/classes/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = getDatabaseState() || {};
    const existing = (db.classes || []).find((c: any) => c.id === id);

    if (!requireAdmin(req, res)) {
      return;
    }
    if (!(await enforceRecordCampus(req, res, 'classes', id, existing?.campusId))) {
      return;
    }

    if (serverSupabase) {
      let validTeacherUserId: string | null | undefined = undefined;
      if (updates.leadTeacherId !== undefined) {
        if (!updates.leadTeacherId) {
          validTeacherUserId = null;
        } else {
          const { data: userMatch } = await serverSupabase.from('users').select('id').eq('id', updates.leadTeacherId).limit(1);
          if (userMatch && userMatch.length > 0) {
            validTeacherUserId = updates.leadTeacherId;
          } else {
            const { data: profMatch } = await serverSupabase.from('teacher_profiles').select('teacher_id').eq('id', updates.leadTeacherId).limit(1);
            if (profMatch && profMatch.length > 0 && profMatch[0].teacher_id) {
              validTeacherUserId = profMatch[0].teacher_id;
            } else {
              validTeacherUserId = null;
            }
          }
        }
      }

      const sbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) {
        sbUpdates.title = updates.name;
        sbUpdates.name = updates.name;
      }
      if (updates.capacity !== undefined || updates.maxCapacity !== undefined) {
        sbUpdates.capacity = Number(updates.maxCapacity || updates.capacity);
      }
      if (validTeacherUserId !== undefined) {
        sbUpdates.teacher_id = validTeacherUserId;
      }
      if (updates.code !== undefined) sbUpdates.code = updates.code ? String(updates.code).trim().toUpperCase() : null;
      if (updates.gradeLevel !== undefined) sbUpdates.grade_level = updates.gradeLevel || null;
      if (updates.room !== undefined) sbUpdates.room = updates.room || null;
      if (updates.scheduleTime !== undefined) sbUpdates.schedule_time = updates.scheduleTime || null;
      if (updates.isActive !== undefined) sbUpdates.is_active = updates.isActive !== false;

      const { error: updErr } = await serverSupabase.from('classes').update(sbUpdates).eq('id', id);
      if (updErr) {
        console.error('[Server Supabase] Class update error:', updErr);
        res.status(500).json({ error: `Supabase class update failed: ${updErr.message}` });
        return;
      }
    }

    if (existing) {
      Object.assign(existing, updates);
      saveDatabaseState(db);
    }

    res.json({ success: true, message: 'Class updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update class.' });
  }
});

app.delete('/api/classes/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabaseState() || {};
    const existing = (db.classes || []).find((c: any) => c.id === id);

    if (!requireAdmin(req, res)) {
      return;
    }
    if (!(await enforceRecordCampus(req, res, 'classes', id, existing?.campusId))) {
      return;
    }

    if (serverSupabase) {
      const { error: delErr } = await serverSupabase.from('classes').delete().eq('id', id);
      if (delErr) {
        console.error('[Server Supabase] Class delete error:', delErr);
        res.status(500).json({ error: `Supabase class delete failed: ${delErr.message}` });
        return;
      }
    }

    if (db.classes) {
      db.classes = db.classes.filter((c: any) => c.id !== id);
      saveDatabaseState(db);
    }

    res.json({ success: true, message: 'Class removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete class.' });
  }
});

// ==============================================================================
// 3. STRICT TEACHER ATTENDANCE SERVER-SIDE RULES ENGINE
// ==============================================================================
// ==============================================================================
// 3. STRICT TEACHER ATTENDANCE SERVER-SIDE RULES ENGINE
// ==============================================================================
app.post('/api/attendance/teacher', authenticateUser, async (req: Request, res: Response) => {
  const { campusId, teacherId, date, status, checkInTime, remarks } = req.body;
  if (!campusId || !teacherId || !date) {
    res.status(400).json({ error: 'campusId, teacherId, and date are required.' });
    return;
  }

  if (!enforceCampusAccess(req, res, campusId)) {
    return;
  }

  // Determine campus timezone
  const tz = campusId === 'uk' ? 'Europe/London' : 'Asia/Karachi';

  // Compute server time in campus local timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const timeString = checkInTime || formatter.format(now);
  const [h, m, s] = timeString.split(':').map((v: string) => parseInt(v, 10) || 0);
  const totalSeconds = h * 3600 + m * 60 + s;

  let finalStatus = status;
  let ruleApplied = 'UP_TO_5PM';
  let isSystemGenerated = false;

  // 17:00:00 = 61200 seconds, 17:30:00 = 63000 seconds
  if (totalSeconds <= 61200) {
    // Before or at 5:00 PM: Allow PRESENT or ABSENT
    ruleApplied = 'UP_TO_5PM';
    if (finalStatus !== 'PRESENT' && finalStatus !== 'ABSENT' && finalStatus !== 'LEAVE') {
      finalStatus = 'PRESENT';
    }
  } else if (totalSeconds > 61200 && totalSeconds <= 63000) {
    // After 5:00 PM and before or at 5:30 PM: Allow LATE or ABSENT
    ruleApplied = 'LATE_WINDOW_5_01_TO_5_30';
    if (finalStatus === 'PRESENT') {
      finalStatus = 'LATE'; // Server strictly converts PRESENT to LATE
    } else if (finalStatus !== 'LATE' && finalStatus !== 'ABSENT' && finalStatus !== 'LEAVE') {
      finalStatus = 'LATE';
    }
  } else {
    // After 5:30 PM: ABSENT only! Prohibit Present and Late.
    finalStatus = 'ABSENT';
    isSystemGenerated = true;
    ruleApplied = 'AUTO_ABSENT_AFTER_5_30';
  }

  const attendanceRecord = {
    id: `att-tch-${Date.now()}`,
    campusId,
    teacherId,
    date,
    status: finalStatus,
    checkInTime: timeString,
    ruleApplied,
    isSystemGenerated,
    remarks: remarks || (isSystemGenerated ? 'Auto-recorded Absent after 5:30 PM cutoff' : ''),
    recordedBy: req.user?.fullName || req.user?.email || 'Admin',
    updatedAt: new Date().toISOString(),
  };

  if (serverSupabase) {
    try {
      // teacher_attendances.teacher_id references users(id), but the portal sends the
      // teacher_profiles id (tch-...). Resolve it to the linked user id (usr-...).
      let attendanceUserId = teacherId;
      const { data: profileRow } = await serverSupabase
        .from('teacher_profiles')
        .select('teacher_id')
        .eq('id', teacherId)
        .maybeSingle();
      if (profileRow?.teacher_id) {
        attendanceUserId = profileRow.teacher_id;
      }

      const { error: attErr } = await serverSupabase.from('teacher_attendances').upsert([{
        campus_id: campusId,
        teacher_id: attendanceUserId,
        date,
        status: finalStatus,
        check_in_time: new Date().toISOString(),
        rule_applied: ruleApplied,
        is_system_generated: isSystemGenerated,
        remarks: remarks || null,
        recorded_by: req.user?.fullName || 'Admin',
        updated_at: new Date().toISOString(),
      }], { onConflict: 'teacher_id,date' });
      if (attErr) {
        console.error('[Server Supabase] Teacher attendance upsert error:', attErr);
        res.status(502).json({ error: `Teacher attendance was not saved to the database: ${attErr.message}` });
        return;
      }
    } catch (err: any) {
      console.error('[Server Supabase] Teacher attendance error:', err);
      res.status(502).json({ error: `Teacher attendance was not saved to the database: ${err?.message || 'network error'}` });
      return;
    }
  }

  const db = getDatabaseState() || {};
  const currentTchAttendance = db.teacherAttendance || [];
  const existingIdx = currentTchAttendance.findIndex((a: any) => a.teacherId === teacherId && a.date === date);
  if (existingIdx >= 0) {
    currentTchAttendance[existingIdx] = { ...currentTchAttendance[existingIdx], ...attendanceRecord };
  } else {
    currentTchAttendance.push(attendanceRecord);
  }
  db.teacherAttendance = currentTchAttendance;
  saveDatabaseState(db);

  res.json({
    success: true,
    record: attendanceRecord,
  });
});

// Student Attendance Bulk Save
app.post('/api/attendance/student/bulk', authenticateUser, async (req: Request, res: Response) => {
  const { campusId, classId, date, records } = req.body;
  if (!campusId || !classId || !date || !Array.isArray(records)) {
    res.status(400).json({ error: 'campusId, classId, date, and records array required.' });
    return;
  }

  if (!enforceCampusAccess(req, res, campusId)) {
    return;
  }

  if (serverSupabase) {
    const sbRecords = records.map((rec: any) => ({
      campus_id: campusId,
      class_id: classId,
      student_id: rec.studentId,
      date: date,
      status: rec.status,
      remarks: rec.remarks || null,
      recorded_by: req.user?.fullName || 'Teacher',
      updated_at: new Date().toISOString(),
    }));
    try {
      const { error: attErr } = await serverSupabase
        .from('student_attendances')
        .upsert(sbRecords, { onConflict: 'student_id,class_id,date' });
      if (attErr) {
        console.error('[Server Supabase] Student attendance upsert error:', attErr);
        res.status(502).json({ error: `Student attendance was not saved to the database: ${attErr.message}` });
        return;
      }
    } catch (err: any) {
      console.error('[Server Supabase] Student attendance error:', err);
      res.status(502).json({ error: `Student attendance was not saved to the database: ${err?.message || 'network error'}` });
      return;
    }
  }

  const db = getDatabaseState() || {};
  const currentAttendance = db.studentAttendance || [];

  records.forEach((rec: any) => {
    const existingIdx = currentAttendance.findIndex((a: any) => a.studentId === rec.studentId && a.date === date);
    const newEntry = {
      id: rec.id || `att-std-${rec.studentId}-${date}`,
      campusId,
      classId,
      studentId: rec.studentId,
      studentName: rec.studentName || 'Student',
      date,
      status: rec.status,
      remarks: rec.remarks || '',
      recordedBy: req.user?.fullName || 'Teacher',
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      currentAttendance[existingIdx] = { ...currentAttendance[existingIdx], ...newEntry };
    } else {
      currentAttendance.push(newEntry);
    }
  });

  db.studentAttendance = currentAttendance;
  saveDatabaseState(db);

  res.json({
    success: true,
    savedCount: records.length,
    campusId,
    classId,
    date,
    timestamp: new Date().toISOString(),
  });
});

// ==============================================================================
// 3.0 CAMPUS SETTINGS CRUD (Server Authoritative)
// ==============================================================================
app.put('/api/campuses/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admin can update campus configuration.' });
      return;
    }
    const { id } = req.params;
    const updates = req.body;

    if (serverSupabase) {
      const sbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) sbUpdates.name = updates.name;
      if (updates.phone !== undefined) sbUpdates.phone = updates.phone;
      if (updates.email !== undefined) sbUpdates.email = updates.email;
      if (updates.address !== undefined) sbUpdates.address = updates.address;
      if (updates.city !== undefined) sbUpdates.city = updates.city;
      if (updates.country !== undefined) sbUpdates.country = updates.country;
      if (updates.timezone !== undefined) sbUpdates.timezone = updates.timezone;
      if (updates.currencyCode !== undefined) sbUpdates.currency_code = updates.currencyCode;
      if (updates.isActive !== undefined) sbUpdates.is_active = updates.isActive;
      if (updates.bankDetails !== undefined) sbUpdates.bank_details = updates.bankDetails;

      const { error: campErr } = await serverSupabase.from('campuses').update(sbUpdates).eq('id', id);
      if (campErr) {
        res.status(500).json({ error: `Supabase campus update failed: ${campErr.message}` });
        return;
      }
    }

    const db = getDatabaseState() || {};
    const existing = (db.campuses || []).find((c: any) => c.id === id);
    if (existing) {
      Object.assign(existing, updates);
      saveDatabaseState(db);
    }

    res.json({ success: true, message: 'Campus configuration updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update campus.' });
  }
});

// ==============================================================================
// 3.01 USER ACCOUNT & PORTAL CRUD (Server Authoritative)
// ==============================================================================
app.post('/api/users', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admin can create portal accounts.' });
      return;
    }
    const { email, username, fullName, role, campusId, password, isActive, contactNumber } = req.body || {};
    if (!email || !username) {
      res.status(400).json({ error: 'Email and username are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase();
    const cleanRole = String(role || 'TEACHER').toUpperCase();
    const parts = String(fullName || '').trim().split(' ');
    const firstName = parts[0] || cleanUsername;
    const lastName = parts.slice(1).join(' ') || '';
    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (serverSupabase) {
      if (await authSvc.identifierTaken(serverSupabase, cleanEmail, cleanUsername)) {
        res.status(400).json({ error: 'A user account with this email or username already exists.' });
        return;
      }
      if (typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ error: 'An initial password of at least 8 characters is required.' });
        return;
      }

      let authUserId: string;
      try {
        authUserId = await authSvc.createAuthAccount(serverSupabase, {
          email: cleanEmail, password, appUserId: userId, role: cleanRole, isActive: isActive !== false,
        });
      } catch (authErr: any) {
        res.status(400).json({ error: authErr.message });
        return;
      }

      const { error: userErr } = await serverSupabase.from('users').insert([{
        id: userId,
        auth_user_id: authUserId,
        email: cleanEmail,
        username: cleanUsername,
        first_name: firstName,
        last_name: lastName,
        role: cleanRole,
        active_campus_id: campusId === 'all' ? null : campusId,
        allowed_campus_ids: authSvc.campusIdsFor(campusId),
        contact_number: contactNumber || null,
        status: isActive !== false ? 1 : 0,
      }]);
      if (userErr) {
        await authSvc.deleteAuthAccount(serverSupabase, authUserId);
        res.status(500).json({ error: `Supabase user creation failed: ${userErr.message}` });
        return;
      }

      try {
        await authSvc.setCampusAccess(serverSupabase, userId, authSvc.campusIdsFor(campusId));
        if (cleanRole === 'PARENT') {
          const { error: parentErr } = await serverSupabase.from('parent_profiles').insert([{
            id: `par-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            user_id: userId,
            campus_id: campusId && campusId !== 'all' ? campusId : 'uk',
            phone: contactNumber || null,
          }]);
          if (parentErr) throw new Error(`Parent profile creation failed: ${parentErr.message}`);
        }
      } catch (accessErr: any) {
        await serverSupabase.from('user_campus_access').delete().eq('user_id', userId);
        await serverSupabase.from('users').delete().eq('id', userId);
        await authSvc.deleteAuthAccount(serverSupabase, authUserId);
        res.status(500).json({ error: accessErr.message });
        return;
      }
    }

    const newUser: any = {
      id: userId,
      email: cleanEmail,
      username: cleanUsername,
      fullName: fullName?.trim() || cleanUsername,
      role: cleanRole,
      campusId: campusId || 'all',
      allowedCampusIds: authSvc.campusIdsFor(campusId),
      isActive: isActive !== false,
      contactNumber,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    // Local ledger mode only: keep the password for development logins.
    if (!serverSupabase) newUser.password = password || 'Misbah2026!';

    const db = getDatabaseState() || {};
    db.users = [newUser, ...(db.users || []).filter((u: any) => u.id !== userId)];
    saveDatabaseState(db);

    res.json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create user.' });
  }
});

app.put('/api/users/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admin can update portal accounts.' });
      return;
    }
    const { id } = req.params;
    const updates = req.body || {};

    if (serverSupabase) {
      const { data: row, error: findErr } = await serverSupabase
        .from('users').select('id, auth_user_id, email, role').eq('id', id).maybeSingle();
      if (findErr || !row) {
        res.status(404).json({ error: 'Portal account not found.' });
        return;
      }

      const newEmail = updates.email !== undefined ? String(updates.email).trim().toLowerCase() : undefined;
      const newUsername = updates.username !== undefined ? String(updates.username).trim().toLowerCase() : undefined;
      if ((newEmail || newUsername) && await authSvc.identifierTaken(serverSupabase, newEmail || '', newUsername || '', id)) {
        res.status(400).json({ error: 'Another account already uses that email or username.' });
        return;
      }

      // Credentials and active status live in Supabase Auth.
      try {
        if (row.auth_user_id) {
          await authSvc.updateAuthAccount(serverSupabase, row.auth_user_id, {
            email: newEmail && newEmail !== row.email ? newEmail : undefined,
            password: typeof updates.password === 'string' && updates.password ? updates.password : undefined,
            isActive: updates.isActive,
            role: updates.role ? String(updates.role).toUpperCase() : undefined,
          });
        } else if (typeof updates.password === 'string' && updates.password) {
          const authUserId = await authSvc.createAuthAccount(serverSupabase, {
            email: newEmail || row.email, password: updates.password, appUserId: id,
            role: String(updates.role || row.role).toUpperCase(), isActive: updates.isActive,
          });
          await serverSupabase.from('users').update({ auth_user_id: authUserId }).eq('id', id);
        }
      } catch (authErr: any) {
        res.status(400).json({ error: authErr.message });
        return;
      }

      const sbUpdates: any = { updated_at: new Date().toISOString() };
      if (newEmail !== undefined) sbUpdates.email = newEmail;
      if (newUsername !== undefined) sbUpdates.username = newUsername;
      if (updates.role !== undefined) sbUpdates.role = String(updates.role).toUpperCase();
      if (updates.campusId !== undefined) {
        sbUpdates.active_campus_id = updates.campusId === 'all' ? null : updates.campusId;
        sbUpdates.allowed_campus_ids = authSvc.campusIdsFor(updates.campusId);
      }
      if (updates.fullName !== undefined) {
        const parts = String(updates.fullName).trim().split(' ');
        sbUpdates.first_name = parts[0] || '';
        sbUpdates.last_name = parts.slice(1).join(' ') || '';
      }
      if (updates.isActive !== undefined) sbUpdates.status = updates.isActive ? 1 : 0;
      if (updates.contactNumber !== undefined) sbUpdates.contact_number = updates.contactNumber;

      const { error: updErr } = await serverSupabase.from('users').update(sbUpdates).eq('id', id);
      if (updErr) {
        res.status(500).json({ error: `Supabase user update failed: ${updErr.message}` });
        return;
      }
      if (updates.campusId !== undefined) {
        await authSvc.setCampusAccess(serverSupabase, id, authSvc.campusIdsFor(updates.campusId));
      }
    }

    const db = getDatabaseState() || {};
    const existing = (db.users || []).find((u: any) => u.id === id);
    if (existing) {
      const { password: _pw, ...safeUpdates } = updates;
      Object.assign(existing, serverSupabase ? safeUpdates : updates);
      saveDatabaseState(db);
    }

    res.json({ success: true, message: 'User updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update user.' });
  }
});

// Super Admin password reset for another account.
app.post('/api/users/:id/reset-password', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admin can reset passwords.' });
      return;
    }
    if (!serverSupabase) {
      res.status(501).json({ error: 'Password resets require Supabase authentication.' });
      return;
    }
    const { id } = req.params;
    const { data: row } = await serverSupabase.from('users').select('id, auth_user_id, active_campus_id').eq('id', id).maybeSingle();
    if (!row?.auth_user_id) {
      res.status(404).json({ error: 'This account has no sign-in credentials to reset.' });
      return;
    }
    const supplied = typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';
    const newPassword = supplied || `Misbah-${Math.random().toString(36).slice(2, 8)}${Math.floor(10 + Math.random() * 90)}!`;
    await authSvc.updateAuthAccount(serverSupabase, row.auth_user_id, { password: newPassword });
    await writeAuthAudit('PORTAL_USER_PASSWORD_RESET', row.active_campus_id, req.user.id, { target_user_id: id });
    res.json({ success: true, newPassword });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to reset password.' });
  }
});

app.delete('/api/users/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admin can delete portal accounts.' });
      return;
    }
    const { id } = req.params;
    if (req.user.id === id) {
      res.status(400).json({ error: 'Cannot delete current logged-in Super Admin.' });
      return;
    }

    if (serverSupabase) {
      const { data: row } = await serverSupabase.from('users').select('auth_user_id').eq('id', id).maybeSingle();
      const { error: delErr } = await serverSupabase.from('users').delete().eq('id', id);
      if (delErr) {
        res.status(500).json({ error: `Supabase user delete failed: ${delErr.message}` });
        return;
      }
      await authSvc.deleteAuthAccount(serverSupabase, row?.auth_user_id);
    }

    const db = getDatabaseState() || {};
    db.users = (db.users || []).filter((u: any) => u.id !== id);
    saveDatabaseState(db);

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete user.' });
  }
});

// ==============================================================================
// 3.02 PAYMENT INVOICES CRUD (Server Authoritative)
// ==============================================================================
app.post('/api/payments', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { studentId, campusId, title, amountDue, dueDate, currency, paymentMethod } = req.body;
    const targetCampus = (campusId || 'kts').toLowerCase();
    if (!enforceCampusAccess(req, res, targetCampus)) return;

    const invoiceId = `inv-${Date.now()}`;
    const invoiceNum = `INV-${targetCampus.toUpperCase()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    if (serverSupabase) {
      const { error: insErr } = await serverSupabase.from('payment_invoices').insert([{
        id: invoiceId,
        campus_id: targetCampus,
        reference_id: studentId || null,
        student_id: studentId || null,
        type: 'fee_invoice',
        amount: Number(amountDue || 0),
        currency: currency || (targetCampus === 'uk' ? 'GBP' : 'PKR'),
        due_date: dueDate || new Date().toISOString().substring(0, 10),
        payment_status: 'unpaid',
        payment_method: (paymentMethod || 'cash').toLowerCase(),
      }]);
      if (insErr) {
        res.status(500).json({ error: `Supabase invoice creation failed: ${insErr.message}` });
        return;
      }
    }

    const newPayment = {
      id: invoiceId,
      campusId: targetCampus,
      studentId,
      studentName: 'Student',
      admissionNumber: `REG-${studentId}`,
      invoiceNumber: invoiceNum,
      title: title || 'Monthly Tuition Fee',
      amountDue: Number(amountDue || 0),
      amountPaid: 0,
      currency: currency || (targetCampus === 'uk' ? 'GBP' : 'PKR'),
      status: 'PENDING',
      dueDate: dueDate || new Date().toISOString().substring(0, 10),
      paymentMethod: paymentMethod || 'Cash',
    };

    const db = getDatabaseState() || {};
    db.payments = [newPayment, ...(db.payments || [])];
    saveDatabaseState(db);

    res.json({ success: true, payment: newPayment });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create payment invoice.' });
  }
});

app.put('/api/payments/:id/status', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, amountPaid, paidDate } = req.body;
    const db = getDatabaseState() || {};
    const existing = (db.payments || []).find((p: any) => p.id === id);

    if (!requireAdmin(req, res)) {
      return;
    }
    if (!(await enforceRecordCampus(req, res, 'payment_invoices', id, existing?.campusId))) {
      return;
    }

    if (serverSupabase) {
      const sbStatus = status === 'PAID' ? 'paid' : status === 'PARTIAL' ? 'partial' : 'unpaid';
      const sbUpdates: any = {
        payment_status: sbStatus,
        updated_at: new Date().toISOString(),
      };
      if (paymentMethod !== undefined) sbUpdates.payment_method = paymentMethod.toLowerCase();
      if (amountPaid !== undefined) sbUpdates.amount = Number(amountPaid);
      if (paidDate !== undefined) sbUpdates.payment_date = paidDate;
      else if (status === 'PAID') sbUpdates.payment_date = new Date().toISOString().substring(0, 10);

      const { error: updErr } = await serverSupabase
        .from('payment_invoices')
        .update(sbUpdates)
        .eq('id', id);

      if (updErr) {
        console.error('[Server Supabase] Payment invoice update error:', updErr);
        res.status(500).json({ error: `Supabase invoice update failed: ${updErr.message}` });
        return;
      }
    }

    if (existing) {
      existing.status = status;
      if (paymentMethod) existing.paymentMethod = paymentMethod;
      if (amountPaid !== undefined) existing.amountPaid = Number(amountPaid);
      if (paidDate) existing.paidDate = paidDate;
      else if (status === 'PAID') existing.paidDate = new Date().toISOString().substring(0, 10);
      saveDatabaseState(db);
    }

    res.json({ success: true, message: 'Invoice status updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update invoice.' });
  }
});

// ==============================================================================
// 3. AUDIT LOGS & COMPLIANCE ENDPOINTS (Guarded & RLS Secure)
// ==============================================================================
app.post('/api/audit-logs', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { campus_id, campusId, action, details, entityType, entityId } = req.body || {};
    // audit_logs columns: id, campus_id, user_id, action, details (jsonb), ip_address, created_at.
    // Entity and reason live inside details.
    const requested = String(campus_id || campusId || user.activeCampusId || '').trim();
    const allowed = user.role === 'SUPER_ADMIN' || user.allowedCampusIds.includes('all') || user.allowedCampusIds.includes(requested);
    const targetCampus = allowed ? requested : user.activeCampusId;
    const payloadDetails: Record<string, unknown> = typeof details === 'object' && details !== null ? { ...details } : { message: details || 'System event' };
    if (entityType) payloadDetails.entity_type = String(entityType).slice(0, 100);
    if (entityId) payloadDetails.entity_id = String(entityId).slice(0, 200);
    payloadDetails.performed_by = user.fullName || user.email;

    if (!serverSupabase) return res.status(503).json({ error: 'Database not configured.' });
    const { error } = await serverSupabase.from('audit_logs').insert([{
      campus_id: !targetCampus || targetCampus === 'all' ? null : targetCampus,
      user_id: user.id,
      action: String(action || 'GENERAL_ACTION').slice(0, 100),
      details: payloadDetails,
      ip_address: String(req.ip || '').slice(0, 50) || null,
    }]);
    if (error) {
      console.warn('[Server Supabase] Audit log insert failed:', error.message);
      return res.status(500).json({ error: `Audit entry not saved: ${error.message}` });
    }
    res.json({ success: true, message: 'Audit entry recorded securely.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to record audit log entry.' });
  }
});

// ==============================================================================
// 3.01 INCIDENTS & MEDICAL MANAGEMENT (Authoritative Supabase Persistence)
// ==============================================================================
app.get('/api/incidents', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { campusId } = req.query;
    if (campusId && campusId !== 'all' && !enforceCampusAccess(req, res, String(campusId))) return;
    let query = serverSupabase!.from('incident_logs').select('*').order('created_at', { ascending: false });
    if (campusId && campusId !== 'all') query = query.eq('campus_id', String(campusId));
    else if (user.role !== 'SUPER_ADMIN') query = query.in('campus_id', user.allowedCampusIds);
    const { data, error } = await query;
    if (error) throw error;
    const lk = await records.loadLookups(serverSupabase!);
    let incidents = (data || [])
      .filter((log: any) => !String(log.title || '').startsWith('[MEDICAL]'))
      .map((log: any) => {
        let attachedFiles: any;
        try { attachedFiles = log.attachments ? JSON.parse(log.attachments) : undefined; } catch { attachedFiles = undefined; }
        const title = String(log.title || '');
        const type = title.includes('[ACADEMIC]') ? 'ACADEMIC' : title.includes('[INJURY]') ? 'INJURY' : 'BEHAVIORAL';
        return {
          id: log.id, campusId: log.campus_id, studentId: log.student_id || '',
          studentName: lk.student.get(log.student_id)?.name || 'Student', reporterId: 'staff', reporterName: 'Staff Member',
          type, severity: 'MEDIUM', description: log.description || title, actionTaken: log.action_taken || '',
          status: log.status || 'SUBMITTED', createdAt: String(log.created_at || '').replace('T', ' ').substring(0, 19), attachedFiles,
        };
      });
    if (user.role === 'PARENT') {
      const { data: kids } = await serverSupabase!.from('students').select('id').eq('parent_id', user.id);
      const ids = new Set((kids || []).map((k: any) => k.id));
      incidents = incidents.filter((i: any) => ids.has(i.studentId));
    }
    res.json({ success: true, data: incidents });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load incidents.' });
  }
});

app.post('/api/incidents', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { campusId, studentId, studentName, type, severity, description, actionTaken, attachedFiles } = req.body;
    if (!campusId || !studentId || !description) {
      res.status(400).json({ error: 'campusId, studentId, and description are required.' });
      return;
    }
    if (!enforceCampusAccess(req, res, campusId)) return;

    const incidentId = `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();
    const incidentEntry = {
      id: incidentId,
      campusId,
      studentId,
      studentName: studentName || 'Student',
      reporterId: user.id,
      reporterName: user.fullName || user.email || 'Staff',
      type: type || 'BEHAVIORAL',
      severity: severity || 'MEDIUM',
      description,
      actionTaken: actionTaken || 'Parent notified; record filed.',
      status: 'SUBMITTED',
      createdAt: nowIso.replace('T', ' ').substring(0, 19),
      attachedFiles: Array.isArray(attachedFiles) ? attachedFiles : undefined,
    };

    const db = getDatabaseState() || {};
    if (!db.incidents) db.incidents = [];
    db.incidents.unshift(incidentEntry);
    saveDatabaseState(db);

    // Supabase incident_logs persistence
    if (serverSupabase) {
      try {
        const { error: sbWriteErr } = await serverSupabase.from('incident_logs').upsert([{
          id: incidentId,
          campus_id: campusId,
          student_id: studentId,
          date: nowIso.split('T')[0],
          title: `[${type || 'BEHAVIORAL'}] ${description.substring(0, 60)}`,
          description,
          action_taken: actionTaken || null,
          attachments: attachedFiles ? JSON.stringify(attachedFiles) : null,
          status: 'SUBMITTED',
          created_at: nowIso,
          updated_at: nowIso,
        }]);
        if (sbWriteErr) throw sbWriteErr;
      } catch (sbErr: any) {
        console.error('[Server Supabase] incident_logs insert error:', sbErr);
        res.status(502).json({ error: `Incident was not saved to the database: ${sbErr?.message || 'network error'}` });
        return;
      }
    }

    res.json({ success: true, incident: incidentEntry });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to record incident.' });
  }
});

app.put('/api/incidents/:id/status', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['APPROVED', 'REJECTED', 'SUBMITTED', 'ACTIVE'].includes(String(status).toUpperCase())) {
      res.status(400).json({ error: 'Valid status required (APPROVED, REJECTED).' });
      return;
    }

    const db = getDatabaseState() || {};
    const existing = (db.incidents || []).find((i: any) => i.id === id);
    if (existing) {
      existing.status = status;
      existing.reviewedBy = user.fullName || user.email || 'Admin';
      existing.reviewNotes = reviewNotes || existing.reviewNotes;
      saveDatabaseState(db);
    }

    if (serverSupabase) {
      try {
        await serverSupabase.from('incident_logs').update({
          status,
          action_taken: reviewNotes ? `Resolution: ${reviewNotes} (by ${user.fullName})` : undefined,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (sbErr) {
        console.warn('[Server Supabase] incident_logs status update error:', sbErr);
      }
    }

    res.json({ success: true, message: `Incident ${id} marked as ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update incident status.' });
  }
});

app.get('/api/medicals', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'PARENT') {
      res.status(403).json({ error: 'Forbidden: medical records are visible to staff only.' });
      return;
    }
    const { campusId } = req.query;
    if (campusId && campusId !== 'all' && !enforceCampusAccess(req, res, String(campusId))) return;
    let query = serverSupabase!.from('medical_records').select('*').order('created_at', { ascending: false });
    if (campusId && campusId !== 'all') query = query.eq('campus_id', String(campusId));
    else if (user.role !== 'SUPER_ADMIN') query = query.in('campus_id', user.allowedCampusIds);
    const { data, error } = await query;
    if (error) throw error;
    const lk = await records.loadLookups(serverSupabase!);
    res.json({ success: true, data: (data || []).map((row: any) => records.COLLECTIONS.medicalRecords.fromRow(row, lk)) });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load medical records.' });
  }
});

app.post('/api/medicals', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { campusId, studentId, studentName, condition, severity, allergies, medicationNotes, emergencyContact } = req.body;
    if (!campusId || !studentId || !condition) {
      res.status(400).json({ error: 'campusId, studentId, and condition are required.' });
      return;
    }
    if (!enforceCampusAccess(req, res, campusId)) return;

    const medId = `med-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();
    const medicalEntry = {
      id: medId,
      campusId,
      studentId,
      studentName: studentName || 'Student',
      condition,
      severity: severity || 'HIGH',
      allergies: allergies || '',
      medicationNotes: medicationNotes || '',
      emergencyContact: emergencyContact || '',
      status: 'SUBMITTED',
      reportedBy: user.fullName || user.email || 'Staff',
      createdAt: nowIso.split('T')[0],
    };

    const db = getDatabaseState() || {};
    if (!db.medicalRecords) db.medicalRecords = [];
    db.medicalRecords.unshift(medicalEntry);

    // Update student's medicalNotes in db.students as well
    const student = (db.students || []).find((s: any) => s.id === studentId);
    if (student) {
      student.medicalNotes = `Condition: ${condition}; Allergies: ${allergies || 'None'}; Emergency: ${emergencyContact || ''}`;
    }
    saveDatabaseState(db);

    // Supabase persistence: medical_records + the student's summary notes.
    try {
      const saved = await records.saveRecord(serverSupabase!, user as any, 'medicalRecords', medicalEntry);
      Object.assign(medicalEntry, saved);
      const { error: notesErr } = await serverSupabase!.from('students').update({
        medical_notes: `Condition: ${condition}; Allergies: ${allergies || 'None'}; Emergency: ${emergencyContact || ''}`,
      }).eq('id', studentId);
      if (notesErr) throw notesErr;
    } catch (sbErr: any) {
      console.error('[Server Supabase] medical record save error:', sbErr?.message || sbErr);
      const status = sbErr instanceof records.RecordError ? sbErr.status : 502;
      res.status(status).json({ error: `Medical record was not saved to the database: ${sbErr?.message || 'network error'}` });
      return;
    }

    res.json({ success: true, medicalRecord: medicalEntry });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to record medical condition.' });
  }
});

// ==============================================================================
// 3.1 DOCUMENT STORAGE & MANAGEMENT (Private, Secure & Multi-Format)
// ==============================================================================
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const DOCUMENTS_BUCKET = 'misbah-documents';

/** Maps a documents row to the shape the app uses. */
function mapDocumentRow(d: any) {
  const ext = d.name?.includes('.') ? d.name.split('.').pop()!.toLowerCase() : '';
  const mime = d.mime_type || '';
  let fileType = 'PDF';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) fileType = 'IMAGE';
  else if (mime.includes('word') || ['doc', 'docx'].includes(ext)) fileType = 'DOC';
  return {
    id: d.id,
    entityType: String(d.type || 'student').toUpperCase(),
    entityId: d.reference_id,
    campusId: d.campus_id,
    name: d.name,
    category: d.category || 'OTHER',
    sizeBytes: d.size_bytes ?? undefined,
    sizeMb: d.size_bytes ? Number((d.size_bytes / (1024 * 1024)).toFixed(2)) : 0,
    type: fileType,
    mimeType: mime || undefined,
    storageBucket: d.storage_bucket || null,
    fileAvailable: Boolean(d.storage_bucket && d.file_name),
    uploadedAt: d.created_at,
    uploadedById: d.uploaded_by || undefined,
    url: `/api/documents/${d.id}/download`,
  };
}

/**
 * Whether the signed-in user may see a document. Admins: their campuses. Teachers: their own
 * documents and documents of students in classes they lead. Parents: their children's documents.
 */
async function canAccessDocument(user: RequestUser, doc: any): Promise<boolean> {
  if (user.role === 'SUPER_ADMIN') return true;
  if (!user.allowedCampusIds.includes(doc.campus_id)) return false;
  if (user.role === 'CAMPUS_ADMIN') return true;
  const entityType = String(doc.type || '').toLowerCase();
  if (user.role === 'TEACHER') {
    if (entityType === 'teacher') return doc.reference_id === user.id || doc.reference_id === user.teacherProfileId;
    if (entityType === 'student') {
      const { data } = await serverSupabase!
        .from('students').select('class_id, classes!inner(teacher_id)').eq('id', doc.reference_id).maybeSingle();
      return Boolean(data && (data as any).classes?.teacher_id === user.id);
    }
    return true; // incident attachments etc. within their campus
  }
  if (user.role === 'PARENT') {
    if (entityType !== 'student') return false;
    const { data } = await serverSupabase!.from('students').select('parent_id').eq('id', doc.reference_id).maybeSingle();
    return data?.parent_id === user.id;
  }
  return false;
}

async function loadDocumentRow(id: string) {
  const { data, error } = await serverSupabase!.from('documents').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

app.get('/api/documents', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { entityType, entityId, campusId } = req.query;
    if (campusId && campusId !== 'all' && !enforceCampusAccess(req, res, String(campusId))) return;

    let query = serverSupabase!.from('documents').select('*').order('created_at', { ascending: false });
    if (entityType) query = query.eq('type', String(entityType).toLowerCase());
    if (entityId) query = query.eq('reference_id', String(entityId));
    if (campusId && campusId !== 'all') query = query.eq('campus_id', String(campusId));
    else if (user.role !== 'SUPER_ADMIN') query = query.in('campus_id', user.allowedCampusIds);
    const { data, error } = await query;
    if (error) throw error;

    const visible: any[] = [];
    for (const row of data || []) {
      if (await canAccessDocument(user, row)) visible.push(mapDocumentRow(row));
    }
    res.json({ success: true, documents: visible });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch documents.' });
  }
});

app.post('/api/documents/upload', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { entityType, entityId, campusId, name, category, mimeType, fileBase64 } = req.body || {};

    if (!entityType || !entityId) {
      res.status(400).json({ error: 'entityType (STUDENT or TEACHER) and entityId are required.' });
      return;
    }
    if (!name || !fileBase64) {
      res.status(400).json({ error: 'Document name and file data payload are required.' });
      return;
    }
    const cleanMimeType = String(mimeType || 'application/pdf').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(cleanMimeType)) {
      res.status(400).json({ error: `File format "${cleanMimeType}" is not supported. Allowed formats: PDF, DOC, DOCX, PNG, JPG/JPEG, WEBP.` });
      return;
    }
    const fileBuffer = Buffer.from(String(fileBase64), 'base64');
    if (fileBuffer.length === 0) {
      res.status(400).json({ error: 'The uploaded file is empty.' });
      return;
    }
    if (fileBuffer.length > MAX_DOCUMENT_SIZE_BYTES) {
      res.status(400).json({ error: `File size exceeds the 25MB limit. Received: ${(fileBuffer.length / (1024 * 1024)).toFixed(1)}MB.` });
      return;
    }

    const targetCampus = String(campusId || user.activeCampusId || 'uk').toLowerCase();
    if (!enforceCampusAccess(req, res, targetCampus)) return;

    const cleanEntityType = String(entityType).toLowerCase();
    // Authorization: same rules as viewing, applied to the document being created.
    const allowed = await canAccessDocument(user, { campus_id: targetCampus, type: cleanEntityType, reference_id: entityId });
    if (!allowed) {
      res.status(403).json({ error: 'Forbidden: you cannot upload documents for this record.' });
      return;
    }

    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const safeName = String(name).trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${targetCampus}/${cleanEntityType}s/${entityId}/${docId}-${safeName}`;

    const { error: uploadErr } = await serverSupabase!.storage
      .from(DOCUMENTS_BUCKET)
      .upload(storagePath, fileBuffer, { contentType: cleanMimeType, upsert: false });
    if (uploadErr) {
      console.error('[Documents] Storage upload failed:', uploadErr.message);
      res.status(502).json({ error: `The file could not be stored: ${uploadErr.message}` });
      return;
    }

    const { data: row, error: insertErr } = await serverSupabase!.from('documents').insert([{
      id: docId,
      campus_id: targetCampus,
      type: cleanEntityType,
      reference_id: String(entityId),
      name: String(name).trim(),
      file_name: storagePath,
      category: category || 'OTHER',
      mime_type: cleanMimeType,
      size_bytes: fileBuffer.length,
      storage_bucket: DOCUMENTS_BUCKET,
      uploaded_by: user.id,
    }]).select().single();
    if (insertErr) {
      // Keep storage and metadata consistent.
      await serverSupabase!.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
      console.error('[Documents] Metadata insert failed:', insertErr.message);
      res.status(502).json({ error: `Document record was not saved to the database: ${insertErr.message}` });
      return;
    }

    await serverSupabase!.from('audit_logs').insert([{
      campus_id: targetCampus,
      user_id: user.id,
      action: 'DOCUMENT_UPLOADED',
      details: {
        entity_type: cleanEntityType,
        entity_id: entityId,
        document_id: docId,
        document_name: row.name,
        size_bytes: fileBuffer.length,
        uploaded_by: user.email,
      },
    }]);

    const document = { ...mapDocumentRow(row), uploadedBy: user.fullName || user.email };
    res.json({ success: true, message: `Document "${row.name}" uploaded.`, document });
  } catch (err: any) {
    console.error('[Documents] Upload error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to upload document.' });
  }
});

/** Streams a stored file (download or inline view). */
async function sendDocumentFile(req: Request, res: Response, disposition: 'attachment' | 'inline') {
  try {
    const doc = await loadDocumentRow(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }
    if (!(await canAccessDocument(req.user!, doc))) {
      res.status(403).json({ error: 'Forbidden: you cannot access this document.' });
      return;
    }
    if (!doc.storage_bucket || !doc.file_name) {
      res.status(404).json({ error: 'This document was recorded before file storage existed; the file is not available.' });
      return;
    }
    const { data: blob, error } = await serverSupabase!.storage.from(doc.storage_bucket).download(doc.file_name);
    if (error || !blob) {
      res.status(404).json({ error: `File not found in storage: ${error?.message || 'missing object'}` });
      return;
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(doc.name)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to read document.' });
  }
}

app.get('/api/documents/:id/download', authenticateUser, (req: Request, res: Response) => sendDocumentFile(req, res, 'attachment'));
app.get('/api/documents/:id/view', authenticateUser, (req: Request, res: Response) => sendDocumentFile(req, res, 'inline'));

app.delete('/api/documents/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const doc = await loadDocumentRow(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }
    if (!(await canAccessDocument(user, doc))) {
      res.status(403).json({ error: 'Forbidden: you cannot access this document.' });
      return;
    }
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CAMPUS_ADMIN' && doc.uploaded_by !== user.id) {
      res.status(403).json({ error: 'Forbidden: only administrators or the uploader can delete this document.' });
      return;
    }
    const { error: delErr } = await serverSupabase!.from('documents').delete().eq('id', doc.id);
    if (delErr) {
      res.status(500).json({ error: `Document could not be deleted: ${delErr.message}` });
      return;
    }
    if (doc.storage_bucket && doc.file_name) {
      const { error: rmErr } = await serverSupabase!.storage.from(doc.storage_bucket).remove([doc.file_name]);
      if (rmErr) console.error('[Documents] Storage removal failed (metadata already deleted):', rmErr.message);
    }
    await serverSupabase!.from('audit_logs').insert([{
      campus_id: doc.campus_id,
      user_id: user.id,
      action: 'DOCUMENT_DELETED',
      details: { entity_type: doc.type, entity_id: doc.reference_id, document_id: doc.id, document_name: doc.name },
    }]);
    res.json({ success: true, message: `Document "${doc.name}" deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete document.' });
  }
});

// ==============================================================================
// 4. FRONTEND INTEGRATION: VITE MIDDLEWARE (DEV) / STATIC SERVE (PROD)
// ==============================================================================
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // Handle unknown API routes gracefully
    app.all('/api/*', (req: Request, res: Response) => {
      res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
    });

    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Misbah IMS] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Misbah IMS] Mode: ${isProduction ? 'Production' : 'Development'}`);
  });
}

// Only start standalone HTTP server when executed directly (not when imported in tests or Vercel)
const isMainModule = Boolean(
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
   process.argv[1].endsWith('server.ts'))
);

if (!process.env.VERCEL && !process.env.TEST_MODE && isMainModule) {
  startServer().catch((err) => {
    console.error('[Misbah IMS] Server failed to start:', err);
    process.exit(1);
  });
}

export default app;

