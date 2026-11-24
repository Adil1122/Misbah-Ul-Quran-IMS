import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  CreditCard,
  Award,
  AlertTriangle,
  FileText,
  Users,
  History,
  CheckCircle2,
  BookOpen,
  Download,
  Clock,
  Check,
  X,
  Heart,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { StudentRecord, PendingAdmissionApproval, DocumentAttachment } from '../../../types/ims.ts';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { StatusBadge } from '../../ui/StatusBadge.tsx';
import { formatCampusCurrency, getCampusRegionalConfig } from '../../../utils/currency.ts';
import { DocumentManagerComponent } from '../../documents/DocumentManagerComponent.tsx';

interface StudentDetailedProfileViewProps {
  studentId: string;
  onBack: () => void;
}

export const StudentDetailedProfileView: React.FC<StudentDetailedProfileViewProps> = ({
  studentId,
  onBack,
}) => {
  // Check if it's an enrolled student or a pending admission application
  const existingStudent = IMSStateService.getStudentById(studentId);
  const pendingAdmission = IMSStateService.getPendingAdmissions().find(
    (a) => a.id === studentId || a.studentId === studentId
  );

  // If neither, fallback to first student or null
  const student: StudentRecord | null =
    existingStudent ||
    (pendingAdmission
      ? {
          id: pendingAdmission.studentId,
          admissionNumber: pendingAdmission.temporaryReference || 'PENDING',
          campusId: pendingAdmission.campusId,
          firstName: pendingAdmission.studentName.split(' ')[0] || pendingAdmission.studentName,
          lastName: pendingAdmission.studentName.split(' ').slice(1).join(' ') || '',
          gender: 'MALE',
          dob: pendingAdmission.dateOfBirth || '2015-01-01',
          enrollmentDate: pendingAdmission.submissionDate,
          currentGrade: pendingAdmission.gradeApplying,
          isActive: false,
          approvalStatus: 'PENDING_APPROVAL',
          parentIds: [],
          primaryParentName: pendingAdmission.parentName,
          primaryParentPhone: pendingAdmission.parentPhone,
          classId: 'pending',
          className: pendingAdmission.gradeApplying,
          attendanceRate: undefined,
          feeStatus: 'PENDING',
        }
      : IMSStateService.getStudents('all')[0] || null);

  const isPendingApplication = Boolean(
    pendingAdmission && (pendingAdmission.status === 'PENDING_APPROVAL' || pendingAdmission.status === 'ACTION_REQUIRED')
  );

  const [activeTab, setActiveTab] = useState<string>(
    isPendingApplication ? 'admissions' : 'overview'
  );
  const [attendanceDateFilter, setAttendanceDateFilter] = useState<'ALL' | '30_DAYS' | '90_DAYS'>('ALL');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [assignedIdInput, setAssignedIdInput] = useState('');

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E6E2D8]">
        <p className="text-xs text-[#57655B]">Student record not found.</p>
        <button onClick={onBack} className="mt-2 text-xs font-semibold text-[#0D381E] cursor-pointer">
          ← Back to Students
        </button>
      </div>
    );
  }

  // Related data
  const rawAttendance = IMSStateService.getStudentAttendance(student.campusId).filter(
    (a) => a.studentId === student.id
  );
  const examResults = IMSStateService.getExamResults(student.id);
  const quranLogs = IMSStateService.getAcademicProgress(student.id);
  const invoices = IMSStateService.getPayments(student.campusId, student.id);
  const incidents = IMSStateService.getIncidents(student.campusId).filter(
    (i) => i.studentId === student.id
  );
  const medicalRecords = IMSStateService.getMedicalRecords(student.campusId).filter(
    (m) => m.studentId === student.id
  );
  const auditEntries = IMSStateService.getAuditLogs(student.campusId).filter(
    (l) => l.entityId === student.id || l.entityId === student.admissionNumber
  );

  // Regional campus fee & currency configuration
  const campusConfig = getCampusRegionalConfig(student.campusId);
  const studentCurrency = campusConfig.currency;
  const standardFeeRate = student.monthlyFee || campusConfig.standardMonthlyFee;
  const siblingFeeRate = campusConfig.siblingMonthlyFee;
  const admissionFeeRate = student.admissionFee || campusConfig.admissionFee;
  const totalFeesPaid = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalOutstandingBalance = invoices.reduce((acc, i) => acc + Math.max(0, i.amountDue - i.amountPaid), 0);

  // Attendance date filtering
  const filteredAttendance = rawAttendance.filter((rec) => {
    if (attendanceDateFilter === 'ALL') return true;
    const recDate = new Date(rec.date).getTime();
    const now = new Date('2026-10-09').getTime();
    const daysDiff = (now - recDate) / (1000 * 3600 * 24);
    if (attendanceDateFilter === '30_DAYS') return daysDiff <= 30;
    if (attendanceDateFilter === '90_DAYS') return daysDiff <= 90;
    return true;
  });

  // Calculate attendance status breakdown
  const presentCount = rawAttendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = rawAttendance.filter((a) => a.status === 'ABSENT').length;
  const lateCount = rawAttendance.filter((a) => a.status === 'LATE').length;
  const excusedCount = rawAttendance.filter((a) => a.status === 'EXCUSED').length;

  // The 9 Exact Sections Requested
  const sections = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'attendance', label: 'Attendance History', icon: CalendarCheck },
    { id: 'fees', label: 'Fees & Payments', icon: CreditCard },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'admissions', label: 'Admissions & Enrollment', icon: UserCheck },
    { id: 'incidents-medical', label: 'Incidents & Medical', icon: AlertTriangle },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'parent', label: 'Parent / Guardian', icon: Users },
    { id: 'activity-history', label: 'Activity History', icon: History },
  ];

  const handleApproveAdmission = () => {
    if (!pendingAdmission) return;
    const customId = assignedIdInput.trim() || undefined;
    const ok = IMSStateService.approveStudentAdmission(pendingAdmission.id, customId);
    if (ok) {
      setFeedbackNote(`✓ Admission approved successfully! Student is now enrolled.`);
      setTimeout(() => setFeedbackNote(''), 5000);
    }
  };

  const handleRejectAdmission = () => {
    if (!pendingAdmission) return;
    const ok = IMSStateService.rejectStudentAdmission(pendingAdmission.id, 'Application requirements not met.');
    if (ok) {
      setFeedbackNote(`Admission application rejected.`);
      setTimeout(() => setFeedbackNote(''), 5000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs text-[#57655B] hover:text-[#0D381E] font-medium cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>← Back to Student Directory</span>
      </button>

      {/* Success / Alert Toast */}
      {feedbackNote && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedbackNote}</span>
        </div>
      )}

      {/* 1. CLEAN STUDENT PROFILE HEADER */}
      {/* Student's name, photo/avatar, student ID, campus, class, current status */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E6E2D8]">
          <div className="flex items-start sm:items-center space-x-4">
            {/* Avatar / Photo placeholder */}
            <div className="w-14 h-14 rounded-xl bg-[#0D381E] text-[#F3D273] font-heading text-xl font-bold flex items-center justify-center shrink-0 shadow-2xs">
              {student.firstName[0]}
              {student.lastName ? student.lastName[0] : ''}
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="font-heading font-bold text-2xl text-[#0D381E]">
                  {student.firstName} {student.lastName}
                </h2>
                {isPendingApplication ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>Pending Admission</span>
                  </span>
                ) : (
                  <StatusBadge status={student.isActive ? 'ACTIVE' : 'INACTIVE'} />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#57655B] mt-1">
                <span>
                  ID:{' '}
                  <strong className="font-mono text-[#0D381E]">
                    {student.admissionNumber}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Campus:{' '}
                  <strong className="text-[#0D381E]">
                    {student.campusId === 'uk' ? 'UK Campus (London)' : 'KTS Campus (Haripur)'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Class:{' '}
                  <strong className="text-[#0D381E]">
                    {student.className || student.currentGrade}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Enrolled:{' '}
                  <strong className="font-mono text-[#1A231E]">
                    {student.enrollmentDate}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center space-x-2 self-start sm:self-auto text-xs">
            <div className="p-2.5 px-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] text-right">
              <span className="text-[10px] text-[#57655B] uppercase block">Attendance Rate</span>
              <span className="text-base font-bold text-emerald-800 font-mono">
                {student.attendanceRate !== undefined ? `${student.attendanceRate}%` : '—'}
              </span>
            </div>
            <div className="p-2.5 px-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] text-right">
              <span className="text-[10px] text-[#57655B] uppercase block">Fee Status</span>
              <span className="text-xs font-bold text-[#0D381E] block">
                {student.feeStatus || 'UP TO DATE'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. SECTION TABS (Clean and simple navigation inside profile only) */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-3 scrollbar-none">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PROFILE SECTIONS CONTENT */}

      {/* SECTION 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
            <h3 className="font-heading font-semibold text-base text-[#0D381E]">
              Personal & Academic Details
            </h3>
            <div className="divide-y divide-[#E6E2D8] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Full Legal Name:</span>
                <span className="font-semibold text-[#1A231E]">
                  {student.firstName} {student.lastName}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Student ID:</span>
                <span className="font-mono font-bold text-[#0D381E]">
                  {student.admissionNumber}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Date of Birth:</span>
                <span className="font-mono text-[#1A231E]">
                  {student.dateOfBirth || student.dob}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Gender:</span>
                <span className="font-semibold text-[#1A231E]">
                  {student.gender === 'MALE' ? 'Male (Talib)' : 'Female (Taliba)'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Campus:</span>
                <span className="font-semibold text-[#0D381E]">
                  {student.campusId === 'uk' ? 'UK Campus (London)' : 'KTS Campus (Haripur)'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Class / Level:</span>
                <span className="font-semibold text-[#0D381E]">
                  {student.className || student.currentGrade}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Admission Date:</span>
                <span className="font-mono text-[#1A231E]">
                  {student.enrollmentDate}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Current Status:</span>
                <span className="font-semibold text-emerald-800">
                  {student.isActive ? 'Active Enrolled Student' : 'Inactive / Archived'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
            <h3 className="font-heading font-semibold text-base text-[#0D381E]">
              Parent & Guardian Contact
            </h3>
            <div className="divide-y divide-[#E6E2D8] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Primary Guardian:</span>
                <span className="font-semibold text-[#1A231E]">
                  {student.primaryParentName || 'Parent On Record'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Contact Telephone:</span>
                <span className="font-mono text-[#0D381E] font-bold">
                  {student.primaryParentPhone || 'N/A'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Guardian Email:</span>
                <span className="font-mono text-[#1A231E]">
                  {student.primaryParentEmail || 'parent@misbah.org'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Residential Address:</span>
                <span className="text-[#1A231E] max-w-xs text-right">
                  {student.address || 'London, United Kingdom'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Quran Progress Milestone:</span>
                <span className="font-semibold text-emerald-800">
                  {student.quranMilestone || 'Juz Amma / Level 1'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Fee Exemption / Sibling Discount:</span>
                <span className="font-semibold text-[#0D381E]">
                  {student.hasSiblingDiscount
                    ? `Yes (${formatCampusCurrency(siblingFeeRate, studentCurrency)}/month concession)`
                    : `Standard (${formatCampusCurrency(standardFeeRate, studentCurrency)}/month)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ATTENDANCE HISTORY */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
            <div>
              <h3 className="font-heading font-semibold text-base text-[#0D381E]">
                Student Attendance History
              </h3>
              <p className="text-xs text-[#57655B] mt-0.5">
                Detailed roll-call logs with Present, Absent, Late, and Excused status breakdown.
              </p>
            </div>

            {/* Date filter dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#57655B]">Filter:</span>
              <select
                value={attendanceDateFilter}
                onChange={(e) => setAttendanceDateFilter(e.target.value as any)}
                className="p-1.5 text-xs rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-[#1A231E] font-medium"
              >
                <option value="ALL">All Records</option>
                <option value="30_DAYS">Last 30 Days</option>
                <option value="90_DAYS">Last 90 Days</option>
              </select>
            </div>
          </div>

          {/* Attendance KPI Summary */}
          {rawAttendance.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8]">
                <span className="text-[10px] text-[#57655B] uppercase block">Overall Rate</span>
                <span className="text-lg font-bold font-mono text-emerald-800">
                  {student.attendanceRate ?? 95}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase block">Present</span>
                <span className="text-lg font-bold font-mono text-emerald-900">
                  {presentCount}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-800 uppercase block">Late</span>
                <span className="text-lg font-bold font-mono text-amber-900">
                  {lateCount}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-800 uppercase block">Absent</span>
                <span className="text-lg font-bold font-mono text-rose-900">
                  {absentCount}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-800 uppercase block">Excused</span>
                <span className="text-lg font-bold font-mono text-blue-900">
                  {excusedCount}
                </span>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <div className="overflow-x-auto border border-[#E6E2D8] rounded-lg">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                  <th className="p-3">Date</th>
                  <th className="p-3">Campus</th>
                  <th className="p-3">Class</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Remarks / Reason</th>
                  <th className="p-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {filteredAttendance.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F9F8F4]">
                    <td className="p-3 font-mono font-medium text-[#1A231E]">{r.date}</td>
                    <td className="p-3">{r.campusId.toUpperCase()}</td>
                    <td className="p-3 font-medium text-[#0D381E]">{student.className || r.classId}</td>
                    <td className="p-3 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3 text-[#57655B]">{r.remarks || '—'}</td>
                    <td className="p-3 font-semibold text-[#0D381E]">{r.recordedBy}</td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[#57655B]">
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: FEES & PAYMENTS */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
            <div>
              <h3 className="font-heading font-semibold text-base text-[#0D381E]">
                Fees & Payment History
              </h3>
              <p className="text-xs text-[#57655B] mt-0.5">
                Fee structure, outstanding balance, receipts, and invoice records.
              </p>
            </div>
            <div className="text-xs text-[#57655B]">
              Standard Tuition: <strong className="text-[#0D381E]">{formatCampusCurrency(standardFeeRate, studentCurrency)} / month</strong> · Sibling: <strong className="text-[#0D381E]">{formatCampusCurrency(siblingFeeRate, studentCurrency)} / month</strong>
            </div>
          </div>

          {/* Fee KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8]">
              <span className="text-[10px] text-[#57655B] uppercase block">Fee Structure</span>
              <span className="text-base font-bold text-[#0D381E]">
                {student.hasSiblingDiscount
                  ? `${formatCampusCurrency(siblingFeeRate, studentCurrency)} / month (Sibling Discount)`
                  : `${formatCampusCurrency(standardFeeRate, studentCurrency)} / month (Standard)`}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 uppercase block">Total Fees Paid</span>
              <span className="text-base font-bold font-mono text-emerald-900">
                {formatCampusCurrency(totalFeesPaid, studentCurrency)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 uppercase block">Outstanding Balance</span>
              <span className="text-base font-bold font-mono text-amber-900">
                {formatCampusCurrency(totalOutstandingBalance, studentCurrency)}
              </span>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto border border-[#E6E2D8] rounded-lg">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Fee Title</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Amount Due</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F9F8F4]">
                    <td className="p-3 font-mono font-bold text-[#0D381E]">{inv.invoiceNumber}</td>
                    <td className="p-3 font-semibold text-[#1A231E]">{inv.title}</td>
                    <td className="p-3 font-mono text-[#57655B]">{inv.dueDate}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#1A231E]">
                      {formatCampusCurrency(inv.amountDue, inv.currency || studentCurrency)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-800">
                      {formatCampusCurrency(inv.amountPaid, inv.currency || studentCurrency)}
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="p-3 text-[#57655B]">{inv.paymentMethod || 'Cash'}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-[#57655B]">
                      No fee records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: RESULTS (EXAMS & QURANIC OUTCOMES) */}
      {(activeTab === 'results' || activeTab === 'results-progress') && (
        <div className="space-y-4">
          {/* A. Academic Examination Results */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs p-5 space-y-3">
            <h3 className="font-heading font-semibold text-base text-[#0D381E]">
              Academic Examination & Evaluation Results
            </h3>
            <div className="overflow-x-auto border border-[#E6E2D8] rounded-lg">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                    <th className="p-3">Assessment Name</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Exam Date</th>
                    <th className="p-3 text-right">Score</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Teacher / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {examResults.map((ex) => (
                    <tr key={ex.id} className="hover:bg-[#F9F8F4]">
                      <td className="p-3 font-semibold text-[#1A231E]">{ex.assessmentName || ex.examTitle}</td>
                      <td className="p-3 text-[#0D381E]">{ex.subject}</td>
                      <td className="p-3 font-mono text-[#57655B]">{ex.examDate || ex.date}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#0D381E]">
                        {ex.marksObtained} / {ex.maxMarks || ex.totalMarks}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 text-emerald-800">
                          {ex.grade}
                        </span>
                      </td>
                      <td className="p-3 text-[#57655B]">
                        <span className="font-semibold text-[#1A231E] block">{ex.teacherName}</span>
                        <span>{ex.remarks}</span>
                      </td>
                    </tr>
                  ))}
                  {examResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-[#57655B]">
                        No academic exam results yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* B. Quranic Memorization & Sabaq Progress */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
              <h3 className="font-heading font-semibold text-base text-[#0D381E]">
                Quranic Memorization & Sabaq Progress
              </h3>
              <span className="text-xs text-emerald-800 font-semibold">
                Milestone: {student.quranMilestone || 'Noorani Qaida & Tajweed'}
              </span>
            </div>
            <div className="overflow-x-auto border border-[#E6E2D8] rounded-lg">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                    <th className="p-3">Date</th>
                    <th className="p-3">Daily Sabaq (Lesson)</th>
                    <th className="p-3">Ayah Range</th>
                    <th className="p-3">Sabqi (Revision)</th>
                    <th className="p-3">Manzil</th>
                    <th className="p-3 text-center">Tajweed</th>
                    <th className="p-3">Teacher Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {quranLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F9F8F4]">
                      <td className="p-3 font-mono text-[#57655B]">{log.date}</td>
                      <td className="p-3 font-semibold text-[#0D381E]">{log.sabaqSurah}</td>
                      <td className="p-3 font-mono">{log.sabaqAyah}</td>
                      <td className="p-3">{log.sabqiJuz || 'Juz 1'}</td>
                      <td className="p-3">{log.manzilJuz || 'Juz 2'}</td>
                      <td className="p-3 text-center font-bold text-[#E5C158]">
                        ★ {log.tajweedScore}/5
                      </td>
                      <td className="p-3 text-[#57655B] italic">"{log.feedback}"</td>
                    </tr>
                  ))}
                  {quranLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-[#57655B]">
                        No Quran memorization progress records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: ADMISSIONS & ENROLLMENT */}
      {activeTab === 'admissions' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
            <div>
              <h3 className="font-heading font-semibold text-base text-[#0D381E]">
                Admissions Application & Enrollment Details
              </h3>
              <p className="text-xs text-[#57655B] mt-0.5">
                Official intake application, admission review, and enrollment history.
              </p>
            </div>
            {isPendingApplication && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Awaiting Administrative Decision
              </span>
            )}
          </div>

          {/* Pending Application Review Box */}
          {isPendingApplication && pendingAdmission && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
                    Admission Review Required
                  </span>
                  <h4 className="font-bold text-sm text-[#0D381E] mt-0.5">
                    Application for {pendingAdmission.studentName}
                  </h4>
                  <p className="text-xs text-[#57655B] mt-1">
                    Submitted on <span className="font-mono">{pendingAdmission.submissionDate}</span> by{' '}
                    <strong>{pendingAdmission.submittedByAdminName}</strong>.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-200 text-amber-900">
                  {pendingAdmission.temporaryReference}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#57655B] block">Grade Applying:</span>
                  <strong className="text-[#0D381E]">{pendingAdmission.gradeApplying}</strong>
                </div>
                <div>
                  <span className="text-[#57655B] block">Campus Branch:</span>
                  <strong className="text-[#0D381E]">{pendingAdmission.campusName}</strong>
                </div>
                <div>
                  <span className="text-[#57655B] block">Parent Name & Phone:</span>
                  <strong className="text-[#0D381E]">
                    {pendingAdmission.parentName} ({pendingAdmission.parentPhone})
                  </strong>
                </div>
                <div>
                  <span className="text-[#57655B] block">Staff Assessment Notes:</span>
                  <span className="text-[#1A231E]">{pendingAdmission.notes || 'None'}</span>
                </div>
              </div>

              {/* Action Buttons for Authorized Staff */}
              <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs">
                  <label className="text-[#57655B] whitespace-nowrap font-medium">Assign Official ID:</label>
                  <input
                    type="text"
                    value={assignedIdInput}
                    onChange={(e) => setAssignedIdInput(e.target.value)}
                    placeholder="Auto-generate if blank"
                    className="p-1.5 text-xs rounded border border-[#E6E2D8] bg-white font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRejectAdmission}
                    className="px-3.5 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs cursor-pointer flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Application</span>
                  </button>
                  <button
                    onClick={handleApproveAdmission}
                    className="px-4 py-1.5 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer flex items-center space-x-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Enrol Student</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Standard Admission & Enrollment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2.5">
              <span className="font-bold text-xs text-[#0D381E] block">
                Enrollment Timeline & Details
              </span>
              <div className="space-y-2 text-[#57655B]">
                <div className="flex justify-between">
                  <span>Official Admission Date:</span>
                  <strong className="font-mono text-[#0D381E]">{student.enrollmentDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Admission Number:</span>
                  <strong className="font-mono text-[#0D381E]">{student.admissionNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Enrolled Campus:</span>
                  <strong className="text-[#0D381E]">
                    {student.campusId === 'uk' ? 'UK Campus' : 'KTS Pakistan'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Halaqah:</span>
                  <strong className="text-[#0D381E]">{student.className || student.currentGrade}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Enrollment Status:</span>
                  <span className="text-emerald-800 font-bold">
                    {student.isActive ? 'Officially Enrolled & Verified' : 'Pending Admission'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2.5">
              <span className="font-bold text-xs text-[#0D381E] block">
                Intake Protocol & Agreements
              </span>
              <div className="space-y-2 text-[#57655B]">
                <div className="flex justify-between">
                  <span>Entry Mode:</span>
                  <span className="text-[#1A231E]">Direct Institute Registration</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Admission Fee:</span>
                  <span className="font-mono text-[#1A231E]">
                    {formatCampusCurrency(admissionFeeRate, studentCurrency)} (Paid upon intake)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Code of Conduct Signed:</span>
                  <strong className="text-emerald-800">Yes (On file)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Parent Portal Credentials:</span>
                  <span className="text-[#1A231E]">Dispatched via SMS / Email</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: INCIDENTS & MEDICAL */}
      {activeTab === 'incidents-medical' && (
        <div className="space-y-4">
          {/* A. Incidents */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs p-5 space-y-3">
            <h3 className="font-heading font-semibold text-base text-[#0D381E]">
              Incident & Conduct Records
            </h3>
            <div className="overflow-x-auto border border-[#E6E2D8] rounded-lg">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Reported By</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Action Taken</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-[#F9F8F4]">
                      <td className="p-3 font-mono text-[#57655B]">{inc.createdAt.split(' ')[0]}</td>
                      <td className="p-3 font-bold text-[#0D381E]">{inc.type}</td>
                      <td className="p-3">{inc.reportedByName || 'Staff Member'}</td>
                      <td className="p-3 text-[#1A231E]">{inc.description}</td>
                      <td className="p-3 text-[#57655B]">{inc.actionTaken || 'Parent notified'}</td>
                      <td className="p-3 text-center">
                        <StatusBadge status={inc.status} />
                      </td>
                    </tr>
                  ))}
                  {incidents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-[#57655B]">
                        No incident records on file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* B. Medical Records */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
            <h3 className="font-heading font-semibold text-base text-[#0D381E]">
              Authorized Health & Medical Information
            </h3>
            <div className="divide-y divide-[#E6E2D8] text-xs max-w-xl">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Blood Group:</span>
                <span className="font-bold text-[#0D381E]">{student.bloodGroup || 'B+ Positive'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Known Allergies:</span>
                <span className="font-semibold text-rose-800">
                  {medicalRecords[0]?.allergies || 'None declared'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Medical Notes / Chronic Conditions:</span>
                <span className="text-[#1A231E]">
                  {student.medicalNotes || medicalRecords[0]?.condition || 'No chronic conditions'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Emergency Protocol / Contact:</span>
                <span className="font-semibold text-[#1A231E]">
                  {student.primaryParentName} ({student.primaryParentPhone})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs p-5 space-y-3">
          <DocumentManagerComponent
            entityType="STUDENT"
            entityId={student.id}
            entityName={`${student.firstName} ${student.lastName}`.trim()}
            campusId={student.campusId}
            initialDocuments={student.documents || []}
            canUpload={true}
            canDelete={true}
          />
        </div>
      )}

      {/* SECTION 8: PARENT / GUARDIAN */}
      {activeTab === 'parent' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-4">
          <h3 className="font-heading font-semibold text-base text-[#0D381E]">
            Linked Parent & Guardian Details
          </h3>
          <div className="divide-y divide-[#E6E2D8] text-xs max-w-xl">
            <div className="py-2.5 flex justify-between">
              <span className="text-[#57655B]">Guardian Full Name:</span>
              <span className="font-semibold text-[#1A231E]">
                {student.primaryParentName || 'Parent On Record'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#57655B]">Relationship:</span>
              <span className="text-[#1A231E]">Father / Legal Guardian</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#57655B]">Primary Telephone:</span>
              <span className="font-mono text-[#0D381E] font-bold">
                {student.primaryParentPhone || 'N/A'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#57655B]">Email Address:</span>
              <span className="font-mono text-[#1A231E]">
                {student.primaryParentEmail || 'parent@misbah.org'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#57655B]">Residential Address:</span>
              <span className="text-[#1A231E]">
                {student.address || 'London, United Kingdom'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#57655B]">Parent Portal Access:</span>
              <span className="font-semibold text-emerald-800">
                Active (Linked via Guardian Phone)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: ACTIVITY HISTORY */}
      {activeTab === 'activity-history' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
            <h3 className="font-heading font-semibold text-base text-[#0D381E]">
              Chronological Student Activity History
            </h3>
            <span className="text-xs text-[#57655B]">
              Total Entries: {auditEntries.length}
            </span>
          </div>

          <div className="overflow-x-auto border border-[#E6E2D8] rounded-lg">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Authorized User</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {auditEntries.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9F8F4]">
                    <td className="p-3 font-mono text-[#57655B] text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#0D381E]">
                      {log.action}
                    </td>
                    <td className="p-3 font-semibold text-[#1A231E]">
                      {log.userName}
                    </td>
                    <td className="p-3 text-[#57655B]">
                      {log.details}
                    </td>
                  </tr>
                ))}
                {auditEntries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-xs text-[#57655B]">
                      Initial admission registered on {student.enrollmentDate}. No subsequent modifications logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
