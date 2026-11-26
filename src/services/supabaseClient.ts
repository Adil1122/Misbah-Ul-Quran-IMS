// Misbah-ul-Quran IMS — Authoritative Supabase PostgreSQL Client Service
// Provides direct PostgreSQL access, multi-campus isolation, RLS compliance, and strict failure handling.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables configured in Vite/Client
const rawSupabaseUrl: string = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

/**
 * Validates that Supabase credentials are authentic, well-formed, and not placeholders.
 * Rejects template placeholders such as [YOUR-PROJECT-ID], <project-id>, example.com,
 * ellipses (...), or non-JWT tokens.
 */
export function validateSupabaseConfiguration(url?: string, key?: string): boolean {
  if (!url || !key) return false;
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (
    cleanUrl.includes('[') ||
    cleanUrl.includes(']') ||
    cleanUrl.includes('<') ||
    cleanUrl.includes('>') ||
    cleanKey.includes('[') ||
    cleanKey.includes(']') ||
    cleanKey.includes('<') ||
    cleanKey.includes('>') ||
    cleanKey.includes('...') ||
    cleanKey.length < 80 ||
    /your-project/i.test(cleanUrl) ||
    /placeholder/i.test(cleanUrl) ||
    /example\.com/i.test(cleanUrl) ||
    /your-anon/i.test(cleanKey)
  ) {
    return false;
  }

  // Key must be a valid 3-part JWT
  const parts = cleanKey.split('.');
  if (parts.length !== 3) return false;
  const base64Regex = /^[A-Za-z0-9_-]+$/;
  if (!parts.every((p) => p.length > 0 && base64Regex.test(p))) return false;

  try {
    const parsed = new URL(cleanUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = validateSupabaseConfiguration(rawSupabaseUrl, rawSupabaseAnonKey);

/**
 * Initialize Supabase client safely with catch fallback.
 */
function initSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(rawSupabaseUrl.trim(), rawSupabaseAnonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('[SupabaseClient] Initialization warning:', err);
    return null;
  }
}

export const supabase: SupabaseClient | null = initSupabaseClient();

export interface DbResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  notConfigured?: boolean;
}

/**
 * Authoritative Supabase Database Service
 * Enforces that no save is reported successful unless the database operation actually succeeds.
 */
export class SupabaseDbService {
  /**
   * Health check for Supabase connection
   */
  static async checkConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    if (!supabase) {
      return { connected: false, error: 'Supabase credentials not configured in environment variables.' };
    }
    const start = performance.now();
    try {
      const { error } = await supabase.from('campuses').select('id, code').limit(1);
      const latencyMs = Math.round(performance.now() - start);
      if (error) {
        return { connected: false, error: error.message };
      }
      return { connected: true, latencyMs };
    } catch (err: any) {
      return { connected: false, error: err?.message || 'Network error' };
    }
  }

  // ============================================================================
  // 1. CAMPUSES
  // ============================================================================
  static async fetchCampuses(): Promise<any[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('campuses').select('*').order('code');
    if (error) {
      console.error('[Supabase] Failed to fetch campuses:', error);
      throw error;
    }
    return data;
  }

  static async updateCampus(id: string, updates: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase
        .from('campuses')
        .update({
          name: updates.name,
          address: updates.address,
          city: updates.city,
          country: updates.country,
          phone: updates.phone,
          email: updates.email,
          timezone: updates.timezone,
          currency_code: updates.currencyCode,
          is_active: updates.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database connection error' };
    }
  }

  // ============================================================================
  // 2. STUDENTS (Authoritative CRUD)
  // ============================================================================
  static async fetchStudents(campusId?: string): Promise<any[] | null> {
    if (!supabase) return null;
    // Archived (soft-deleted) students are excluded from the app.
    let query = supabase.from('students').select('*').neq('status', 'archived').order('first_name');
    if (campusId && campusId !== 'all') {
      query = query.eq('campus_id', campusId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[Supabase] Failed to fetch students:', error);
      throw error;
    }
    return data;
  }

  static async insertStudent(student: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase.from('students').insert([student]).select().single();
      if (error) {
        console.error('[Supabase] Insert student error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error inserting student' };
    }
  }

  static async updateStudent(id: string, updates: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Update student error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating student' };
    }
  }

  static async deleteStudent(id: string): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        console.error('[Supabase] Delete student error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting student' };
    }
  }

  // ============================================================================
  // 3. TEACHERS (Authoritative CRUD with Users Foreign Key Join)
  // ============================================================================
  static async fetchTeachers(campusId?: string): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      let query = supabase.from('teacher_profiles').select('*').order('created_at', { ascending: false });
      if (campusId && campusId !== 'all') {
        query = query.eq('campus_id', campusId);
      }
      const { data: profiles, error: pErr } = await query;
      if (pErr) {
        console.error('[Supabase] Failed to fetch teacher_profiles:', pErr);
        throw pErr;
      }
      if (!profiles || profiles.length === 0) return [];

      const teacherUserIds = profiles.map((p: any) => p.teacher_id).filter(Boolean);
      let userMap: Record<string, any> = {};
      if (teacherUserIds.length > 0) {
        const { data: usersData, error: uErr } = await supabase.from('users').select('*').in('id', teacherUserIds);
        if (!uErr && usersData) {
          usersData.forEach((u: any) => {
            userMap[u.id] = u;
          });
        }
      }

      return profiles.map((p: any) => ({
        ...p,
        users: userMap[p.teacher_id] || null,
      }));
    } catch (err) {
      console.error('[Supabase] Error in fetchTeachers:', err);
      throw err;
    }
  }

  static async insertTeacher(teacher: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      if (!teacher.teacher_id) {
        return {
          success: false,
          error: 'Missing required foreign key teacher_id referencing users(id). Teacher user account must exist first.',
        };
      }
      const { data, error } = await supabase.from('teacher_profiles').insert([teacher]).select().single();
      if (error) {
        console.error('[Supabase] Insert teacher error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error inserting teacher' };
    }
  }

  static async updateTeacher(id: string, updates: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating teacher' };
    }
  }

  static async deleteTeacher(id: string, userId?: string): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { error } = await supabase.from('teacher_profiles').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      if (userId) {
        try {
          await supabase.from('users').delete().eq('id', userId);
        } catch {
          // ignore cleanup error
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting teacher' };
    }
  }

  // ============================================================================
  // 4. CLASSES (Authoritative CRUD)
  // ============================================================================
  static async fetchClasses(campusId?: string): Promise<any[] | null> {
    if (!supabase) return null;
    let query = supabase.from('classes').select('*');
    if (campusId && campusId !== 'all') {
      query = query.eq('campus_id', campusId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[Supabase] Failed to fetch classes:', error);
      throw error;
    }
    return data;
  }

  static async insertClass(cls: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase.from('classes').insert([cls]).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error inserting class' };
    }
  }

  static async updateClass(id: string, updates: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating class' };
    }
  }

  static async deleteClass(id: string): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting class' };
    }
  }

  // ============================================================================
  // 5. ATTENDANCE (Teacher & Student with Server Triggers)
  // ============================================================================
  static async fetchTeacherAttendance(campusId?: string, date?: string): Promise<any[] | null> {
    if (!supabase) return null;
    let query = supabase.from('teacher_attendances').select('*');
    if (campusId && campusId !== 'all') {
      query = query.eq('campus_id', campusId);
    }
    if (date) {
      query = query.eq('date', date);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async saveTeacherAttendance(record: {
    campus_id: string;
    teacher_id: string;
    date: string;
    status: string;
    check_in_time?: string;
    remarks?: string;
    recorded_by: string;
  }): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase
        .from('teacher_attendances')
        .upsert(record, { onConflict: 'teacher_id,date' })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error saving teacher attendance' };
    }
  }

  static async fetchStudentAttendance(campusId?: string, classId?: string, date?: string): Promise<any[] | null> {
    if (!supabase) return null;
    let query = supabase.from('student_attendances').select('*');
    if (campusId && campusId !== 'all') {
      query = query.eq('campus_id', campusId);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (date) {
      query = query.eq('date', date);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async saveStudentAttendanceBulk(records: any[]): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase
        .from('student_attendances')
        .upsert(records, { onConflict: 'student_id,class_id,date' });

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error saving student attendance bulk' };
    }
  }

  // ============================================================================
  // 6. PAYMENTS & INVOICES
  // ============================================================================
  static async fetchPaymentInvoices(campusId?: string): Promise<any[] | null> {
    if (!supabase) return null;
    let query = supabase.from('payment_invoices').select('*').order('created_at', { ascending: false });
    if (campusId && campusId !== 'all') {
      query = query.eq('campus_id', campusId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async insertPaymentInvoice(invoice: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase.from('payment_invoices').insert([invoice]).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error inserting invoice' };
    }
  }

  static async updatePaymentInvoiceStatus(
    id: string,
    updates: { payment_status: string; payment_method?: string; amount?: number; payment_date?: string }
  ): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase
        .from('payment_invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating invoice' };
    }
  }

  // ============================================================================
  // 7. USER AUTHENTICATION & PORTAL ACCOUNTS
  // ============================================================================
  static async fetchUsers(): Promise<any[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
  }

  static async insertUser(user: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase.from('users').insert([user]).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error inserting user' };
    }
  }

  static async updateUser(id: string, updates: any): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating user' };
    }
  }

  static async deleteUser(id: string): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting user' };
    }
  }

  // ============================================================================
  // 8. AUDIT LOGS (Immutable Ledger)
  // ============================================================================
  static async logAuditEvent(event: {
    campus_id?: string;
    user_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    old_values?: any;
    new_values?: any;
    reason?: string;
    details?: any;
  }): Promise<DbResult> {
    try {
      // 1. Authoritative Backend Proxy (Bypasses client anon RLS restriction safely on server)
      let userToken = '';
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('misbah_current_user');
          if (stored) {
            const u = JSON.parse(stored);
            if (u?.token) userToken = u.token;
          }
        }
      } catch {}

      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          campusId: event.campus_id,
          userId: event.user_id,
          action: event.action || 'GENERAL_AUDIT',
          entityType: event.entity_type,
          entityId: event.entity_id,
          details: {
            reason: event.reason,
            details: event.details,
            old_values: event.old_values,
            new_values: event.new_values,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (res.ok) {
        return { success: true };
      }
    } catch {
      // Non-blocking fallback
    }

    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const payload: any = {
        action: event.action || 'GENERAL_AUDIT',
        entity_type: event.entity_type || 'SYSTEM',
        entity_id: event.entity_id || '0',
        reason: event.reason || (typeof event.details === 'string' ? event.details : 'System activity'),
        details: {
          entity_type: event.entity_type,
          entity_id: event.entity_id,
          reason: event.reason,
          old_values: event.old_values,
          new_values: event.new_values,
          ...(typeof event.details === 'object' ? event.details : { message: event.details }),
        },
      };

      if (event.campus_id && (event.campus_id === 'uk' || event.campus_id === 'kts')) {
        payload.campus_id = event.campus_id;
      }

      if (event.user_id && typeof event.user_id === 'string' && event.user_id.startsWith('usr-')) {
        payload.user_id = event.user_id;
      }

      const { data, error } = await supabase.from('audit_logs').insert([payload]);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error logging audit' };
    }
  }

  static async fetchIncidentLogs(campusId?: string): Promise<any[] | null> {
    if (!supabase) return null;
    let query = supabase.from('incident_logs').select('*').order('created_at', { ascending: false });
    if (campusId && campusId !== 'all') {
      query = query.eq('campus_id', campusId);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase] fetchIncidentLogs error:', error.message);
      return [];
    }
    return data;
  }

  static async saveIncidentLog(record: {
    id: string;
    campus_id: string;
    student_id?: string;
    date?: string;
    title: string;
    description: string;
    action_taken?: string;
    attachments?: string;
    status?: string;
  }): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const payload: any = {
        id: record.id,
        campus_id: record.campus_id || 'uk',
        student_id: record.student_id || null,
        date: record.date || new Date().toISOString().split('T')[0],
        title: record.title,
        description: record.description,
        action_taken: record.action_taken || null,
        attachments: record.attachments || null,
        status: record.status || 'SUBMITTED',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('incident_logs')
        .upsert([payload], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] saveIncidentLog error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error saving incident log' };
    }
  }

  static async updateIncidentLogStatus(
    id: string,
    status: string,
    action_taken?: string
  ): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (action_taken) {
        updates.action_taken = action_taken;
      }

      const { data, error } = await supabase
        .from('incident_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] updateIncidentLogStatus error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error updating incident log' };
    }
  }

  static async saveMedicalRecord(record: {
    id: string;
    campus_id: string;
    student_id?: string;
    condition: string;
    severity?: string;
    allergies?: string;
    medication_notes?: string;
    emergency_contact?: string;
    reported_by?: string;
    status?: string;
  }): Promise<DbResult> {
    if (!supabase) return { success: false, notConfigured: true, error: 'Supabase not configured' };
    try {
      // 1. If medical_records table exists, attempt direct upsert
      try {
        const { data: medData, error: medErr } = await supabase
          .from('medical_records')
          .upsert([{
            id: record.id,
            campus_id: record.campus_id,
            student_id: record.student_id,
            condition: record.condition,
            severity: record.severity || 'HIGH',
            allergies: record.allergies,
            medication_notes: record.medication_notes,
            emergency_contact: record.emergency_contact,
            reported_by: record.reported_by,
            status: record.status || 'SUBMITTED',
            updated_at: new Date().toISOString(),
          }], { onConflict: 'id' })
          .select()
          .single();

        if (!medErr) {
          return { success: true, data: medData };
        }
      } catch {
        // Fall through to incident_logs storage
      }

      // 2. Authoritative storage in incident_logs with [MEDICAL] title prefix
      const title = `[MEDICAL] Condition: ${record.condition}`;
      const descObj = {
        condition: record.condition,
        severity: record.severity || 'HIGH',
        allergies: record.allergies || '',
        medicationNotes: record.medication_notes || '',
        emergencyContact: record.emergency_contact || '',
        reportedBy: record.reported_by || 'Staff',
      };

      const { data, error } = await supabase
        .from('incident_logs')
        .upsert([{
          id: record.id,
          campus_id: record.campus_id || 'uk',
          student_id: record.student_id || null,
          date: new Date().toISOString().split('T')[0],
          title,
          description: JSON.stringify(descObj),
          action_taken: record.emergency_contact ? `Emergency Contact: ${record.emergency_contact}` : 'Medical Alert Recorded',
          status: record.status || 'SUBMITTED',
          updated_at: new Date().toISOString(),
        }], { onConflict: 'id' })
        .select()
        .single();

      // 3. Update student's medical_notes in students table if student_id is provided
      if (record.student_id) {
        try {
          const notes = `Condition: ${record.condition}; Allergies: ${record.allergies || 'None'}; Emergency: ${record.emergency_contact || 'None'}`;
          await supabase.from('students').update({
            medical_notes: notes,
            updated_at: new Date().toISOString(),
          }).eq('id', record.student_id);
        } catch {
          // non-blocking
        }
      }

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error saving medical record' };
    }
  }

  static async fetchNews(): Promise<any[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('news').select('*').eq('is_active', true);
    if (error) throw error;
    return data;
  }

  static async fetchSliderImages(): Promise<any[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('slider_images').select('*').eq('is_active', true);
    if (error) throw error;
    return data;
  }

  // ============================================================================
  // 9. REAL-TIME SYNCHRONIZATION (Listen to PostgreSQL table mutations)
  // ============================================================================
  static subscribeToRealtimeChanges(
    onRecordChange: (payload: { table: string; eventType: string; newRecord: any; oldRecord: any }) => void
  ): () => void {
    if (!supabase) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel('ims_realtime_db_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
          onRecordChange({ table: 'students', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_profiles' }, (payload) => {
          onRecordChange({ table: 'teacher_profiles', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          onRecordChange({ table: 'users', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, (payload) => {
          onRecordChange({ table: 'classes', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'campuses' }, (payload) => {
          onRecordChange({ table: 'campuses', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_invoices' }, (payload) => {
          onRecordChange({ table: 'payment_invoices', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_attendances' }, (payload) => {
          onRecordChange({ table: 'teacher_attendances', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_attendances' }, (payload) => {
          onRecordChange({ table: 'student_attendances', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Supabase Realtime] Connected to PostgreSQL real-time replication.');
          }
        });

      return () => {
        try {
          supabase?.removeChannel(channel);
        } catch {}
      };
    } catch (err) {
      console.warn('[Supabase Realtime] Subscription error:', err);
      return () => {};
    }
  }
}
