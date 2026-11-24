import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Bell,
  BarChart3,
  Settings,
  ArrowRight,
  Clock,
  Award,
  UserCheck,
  HardDrive,
} from 'lucide-react';
import { Campus, UserSession } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { formatCampusCurrency } from '../../utils/currency.ts';

interface CampusAdminDashboardProps {
  user: UserSession;
  campus: Campus;
  onNavigateTab: (tabId: string) => void;
}

export const CampusAdminDashboard: React.FC<CampusAdminDashboardProps> = ({
  user,
  campus,
  onNavigateTab,
}) => {
  const [feedback, setFeedback] = useState('');

  // Scoped data for this campus only
  const teachers = IMSStateService.getTeachers(campus.id);
  const students = IMSStateService.getStudents(campus.id);
  const classes = IMSStateService.getClasses(campus.id);
  const payments = IMSStateService.getPayments(campus.id);
  const pendingAdmissions = IMSStateService.getPendingAdmissions(campus.id).filter(
    (a) => a.status === 'PENDING_APPROVAL' || a.status === 'ACTION_REQUIRED'
  );
  const incidents = IMSStateService.getIncidents(campus.id).filter(
    (i) => i.status === 'SUBMITTED'
  );
  const overduePayments = payments.filter((p) => p.status === 'OVERDUE');

  const totalCollected = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  const totalOutstanding = payments.reduce(
    (acc, p) => acc + Math.max(0, (p.amountDue || 0) - (p.amountPaid || 0)),
    0
  );

  const totalPendingWork = pendingAdmissions.length + incidents.length + overduePayments.length;

  // Daily student & teacher attendance metrics for this campus
  const todayStr = new Date().toISOString().split('T')[0];
  const allCampusStudentAtt = IMSStateService.getStudentAttendance(campus.id);
  const todayStudentAtt = allCampusStudentAtt.filter((a) => a.date === todayStr);

  const todayPresent = todayStudentAtt.filter((a) => a.status === 'PRESENT').length;
  const todayLate = todayStudentAtt.filter((a) => a.status === 'LATE').length;
  const todayAbsent = todayStudentAtt.filter((a) => a.status === 'ABSENT').length;
  const todayRecordedStudentIds = new Set(todayStudentAtt.map((a) => a.studentId));
  const todayPendingCount = Math.max(0, students.length - todayRecordedStudentIds.size);

  // Class completion rate calculation
  const completedClasses = classes.filter((cls) => {
    const clsStudents = students.filter((s) => s.classId === cls.id);
    const clsRecords = todayStudentAtt.filter((a) => a.classId === cls.id);
    return clsStudents.length > 0 && clsRecords.length >= clsStudents.length;
  });
  const completionRate =
    classes.length > 0 ? Math.round((completedClasses.length / classes.length) * 100) : 0;

  // Teacher today attendance
  const todayTeacherAtt = IMSStateService.getTeacherAttendance(campus.id).filter(
    (a) => a.date === todayStr
  );
  const teachersPresent = todayTeacherAtt.filter((a) => a.status === 'PRESENT').length;
  const teachersLate = todayTeacherAtt.filter((a) => a.status === 'LATE').length;
  const teachersAbsent = todayTeacherAtt.filter((a) => a.status === 'ABSENT').length;

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 1. SIMPLE BRANCH HEADER */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#0D381E]">
              {campus.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0D381E]/10 text-[#0D381E]">
              Branch Admin
            </span>
          </div>
          <p className="text-xs text-[#57655B] mt-0.5">
            {campus.address} · Currency: <strong className="text-[#0D381E]">{campus.currencyCode}</strong> · Administrator: {user.fullName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onNavigateTab('attendance')}
            className="px-3.5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Student Attendance</span>
          </button>
          <button
            onClick={() => onNavigateTab('teacher-attendance')}
            className="px-3.5 py-2 rounded-lg bg-[#F4F3EE] hover:bg-[#E6E2D8] text-[#0D381E] border border-[#D8D2C5] font-bold text-xs cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teacher Attendance</span>
          </button>
          <button
            onClick={() => onNavigateTab('storage')}
            className="px-3.5 py-2 rounded-lg bg-[#E5C158] hover:bg-[#F3D273] text-[#0D381E] font-bold text-xs cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage Bucket</span>
          </button>
        </div>
      </div>

      {/* 2. DAILY ATTENDANCE SUMMARY CARD (Requirement 3: Daily summary dashboard card) */}
      <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0D381E] text-[#F3D273] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-lg text-[#0D381E]">
                  Today's Student Attendance & Roll-Call
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0D381E]/10 text-[#0D381E]">
                  {todayStr}
                </span>
              </div>
              <p className="text-xs text-[#57655B]">
                Class roll-call submission completion rate: <strong className="text-[#0D381E]">{completionRate}%</strong> ({completedClasses.length} of {classes.length} classes completed)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-3 py-1.5 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold cursor-pointer flex items-center space-x-1 shadow-xs"
            >
              <span>Manage Student Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Attendance Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
          <div className="p-3 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8]">
            <span className="text-[11px] text-[#57655B] font-bold block uppercase tracking-wider">Campus Pupils</span>
            <strong className="text-xl font-bold font-mono text-[#0D381E] mt-0.5 block">{students.length}</strong>
            <span className="text-[10px] text-[#57655B]">Enrolled total</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <span className="text-[11px] font-bold block uppercase tracking-wider text-emerald-800">Present</span>
            <strong className="text-xl font-bold font-mono text-emerald-700 mt-0.5 block">{todayPresent}</strong>
            <span className="text-[10px] text-emerald-700/80">
              {students.length > 0 ? `${Math.round((todayPresent / students.length) * 100)}% attendance` : '0%'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <span className="text-[11px] font-bold block uppercase tracking-wider text-amber-800">Late</span>
            <strong className="text-xl font-bold font-mono text-amber-700 mt-0.5 block">{todayLate}</strong>
            <span className="text-[10px] text-amber-700/80">Tardy arrivals</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
            <span className="text-[11px] font-bold block uppercase tracking-wider text-rose-800">Absent</span>
            <strong className="text-xl font-bold font-mono text-rose-700 mt-0.5 block">{todayAbsent}</strong>
            <span className="text-[10px] text-rose-700/80">Reported absences</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold block uppercase tracking-wider text-blue-800">Pending</span>
            <strong className="text-xl font-bold font-mono text-blue-700 mt-0.5 block">{todayPendingCount}</strong>
            <span className="text-[10px] text-blue-700/80">Awaiting roll call</span>
          </div>
        </div>

        {/* Teacher Punctuality Quick Strip */}
        <div className="p-3 bg-[#F4F3EE] rounded-xl border border-[#E6E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#0D381E]" />
            <span>
              <strong>Branch Faculty Check-In:</strong> {teachersPresent} Present · {teachersLate} Late · {teachersAbsent} Absent ({todayTeacherAtt.length} of {teachers.length} faculty recorded)
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('teacher-attendance')}
            className="text-xs font-bold text-[#0D381E] hover:underline flex items-center space-x-1"
          >
            <span>Teacher Attendance Window</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3. COMPACT SUMMARY CARDS (Assigned campus only) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Students */}
        <button
          onClick={() => onNavigateTab('students')}
          className="p-3.5 rounded-xl bg-white border border-[#E6E2D8] text-left hover:border-[#0D381E] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#57655B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Students</span>
            <GraduationCap className="w-4 h-4 text-[#0D381E] group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
            {students.length}
          </div>
          <span className="text-[11px] text-[#57655B]">Enrolled pupils</span>
        </button>

        {/* Teachers */}
        <button
          onClick={() => onNavigateTab('teachers')}
          className="p-3.5 rounded-xl bg-white border border-[#E6E2D8] text-left hover:border-[#0D381E] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#57655B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Teachers</span>
            <Users className="w-4 h-4 text-[#0D381E] group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
            {teachers.length}
          </div>
          <span className="text-[11px] text-[#57655B]">Branch faculty</span>
        </button>

        {/* Classes */}
        <button
          onClick={() => onNavigateTab('classes')}
          className="p-3.5 rounded-xl bg-white border border-[#E6E2D8] text-left hover:border-[#0D381E] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#57655B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Classes</span>
            <BookOpen className="w-4 h-4 text-[#0D381E] group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
            {classes.length}
          </div>
          <span className="text-[11px] text-[#57655B]">Classrooms</span>
        </button>

        {/* Fee Collection */}
        <button
          onClick={() => onNavigateTab('finance')}
          className="p-3.5 rounded-xl bg-white border border-[#E6E2D8] text-left hover:border-[#0D381E] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#57655B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fee Collection</span>
            <DollarSign className="w-4 h-4 text-[#0D381E] group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-base font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
            {formatCampusCurrency(totalCollected, campus.currencyCode)}
          </div>
          <span className="text-[11px] text-amber-800 font-medium">
            Outstanding: {formatCampusCurrency(totalOutstanding, campus.currencyCode)}
          </span>
        </button>

        {/* Pending Work */}
        <div
          className={`p-3.5 rounded-xl border text-left col-span-2 sm:col-span-1 ${
            totalPendingWork > 0
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Work</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                totalPendingWork > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            />
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1 font-mono">
            {totalPendingWork}
          </div>
          <span className="text-[11px]">
            {totalPendingWork > 0 ? 'Actions below' : 'All clear'}
          </span>
        </div>
      </div>

      {/* 3. PENDING WORK (Branch specific actions) */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E6E2D8] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-heading font-bold text-base text-[#0D381E]">
              Branch Pending Actions
            </h3>
            {totalPendingWork > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {totalPendingWork}
              </span>
            )}
          </div>
          <span className="text-xs text-[#57655B]">
            Admissions, incidents, and overdue student fees
          </span>
        </div>

        {totalPendingWork === 0 ? (
          <div className="p-6 text-center text-xs text-[#57655B] space-y-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
            <p className="font-semibold text-[#0D381E]">All campus operations are current.</p>
            <p className="text-[11px]">No pending branch admissions or incident reviews require attention.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E2D8]">
            {/* Pending Admissions */}
            {pendingAdmissions.map((adm) => (
              <div
                key={adm.id}
                className="p-3.5 hover:bg-[#F9F8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      Admission Application
                    </span>
                    <strong className="text-[#0D381E]">{adm.studentName}</strong>
                    <span className="text-[#57655B]">({adm.temporaryReference})</span>
                  </div>
                  <div className="text-[11px] text-[#57655B] mt-0.5">
                    Grade: {adm.gradeApplying} · Parent: {adm.parentName} ({adm.parentPhone})
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => onNavigateTab('students')}
                    className="px-3 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer"
                  >
                    Review in Students
                  </button>
                </div>
              </div>
            ))}

            {/* Submitted Incidents */}
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 hover:bg-[#F9F8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900">
                      {inc.type} Incident
                    </span>
                    <strong className="text-[#0D381E]">{inc.studentName}</strong>
                  </div>
                  <div className="text-[11px] text-[#57655B] mt-0.5">
                    Reported by: {inc.reportedByName} · {inc.description}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => onNavigateTab('incidents-medical')}
                    className="px-3 py-1 rounded border border-[#E6E2D8] bg-white hover:bg-[#F9F8F4] text-[#0D381E] font-semibold text-xs cursor-pointer"
                  >
                    Review Incident
                  </button>
                </div>
              </div>
            ))}

            {/* Overdue fees */}
            {overduePayments.slice(0, 3).map((ov) => (
              <div
                key={ov.id}
                className="p-3.5 hover:bg-[#F9F8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      Overdue Fee
                    </span>
                    <strong className="text-[#0D381E]">{ov.studentName}</strong>
                    <span className="text-[#57655B]">({ov.invoiceNumber})</span>
                  </div>
                  <div className="text-[11px] text-[#57655B] mt-0.5">
                    Due date: {ov.dueDate} · Amount: {formatCampusCurrency(ov.amountDue - ov.amountPaid, ov.currency || campus.currencyCode)}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => onNavigateTab('finance')}
                    className="px-3 py-1 rounded border border-[#E6E2D8] bg-white hover:bg-[#F9F8F4] text-[#0D381E] font-semibold text-xs cursor-pointer"
                  >
                    View Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. MANAGEMENT SECTIONS */}
      <div className="space-y-2.5">
        <h3 className="font-heading font-bold text-base text-[#0D381E]">
          Campus Management
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {[
            { id: 'students', label: 'Students', desc: `${students.length} pupils`, icon: GraduationCap },
            { id: 'teachers', label: 'Teachers', desc: `${teachers.length} faculty`, icon: Users },
            { id: 'classes', label: 'Classes', desc: `${classes.length} halaqahs`, icon: BookOpen },
            { id: 'attendance', label: 'Student Attendance', desc: 'Pupil roll-call ledger', icon: CalendarCheck },
            { id: 'teacher-attendance', label: 'Teacher Attendance', desc: 'Faculty time window', icon: UserCheck },
            { id: 'finance', label: 'Finance', desc: 'Fees & invoices', icon: DollarSign },
            { id: 'results', label: 'Results', desc: 'Exams & Quranic outcomes', icon: Award },
            { id: 'announcements-events', label: 'Announcements & Events', desc: 'Notices & events', icon: Bell },
            { id: 'incidents-medical', label: 'Incidents & Medical', desc: 'Reports & records', icon: AlertTriangle },
            { id: 'reports', label: 'Reports', desc: 'Branch registers', icon: BarChart3 },
            { id: 'settings', label: 'Settings', desc: 'Branch settings', icon: Settings },
          ].map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => onNavigateTab(sec.id)}
                className="p-3 rounded-xl bg-white border border-[#E6E2D8] hover:border-[#0D381E] hover:shadow-xs text-left transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[#57655B] mb-1.5">
                  <Icon className="w-4 h-4 text-[#0D381E] group-hover:scale-105 transition-transform" />
                  <ArrowRight className="w-3.5 h-3.5 text-[#57655B] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <strong className="text-xs text-[#1A231E] block group-hover:text-[#0D381E]">
                    {sec.label}
                  </strong>
                  <span className="text-[10px] text-[#57655B]">{sec.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
