import React, { useState } from 'react';
import {
  Users,
  ArrowLeft,
  CalendarCheck,
  CreditCard,
  BookOpen,
  FileText,
  History,
  CheckCircle2,
  Download,
  DollarSign,
  Clock,
} from 'lucide-react';
import { TeacherProfile } from '../../../types/ims.ts';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { StatusBadge } from '../../ui/StatusBadge.tsx';
import { formatCampusCurrency } from '../../../utils/currency.ts';
import { DocumentManagerComponent } from '../../documents/DocumentManagerComponent.tsx';

interface TeacherDetailedProfileViewProps {
  teacherId: string;
  onBack: () => void;
}

export const TeacherDetailedProfileView: React.FC<TeacherDetailedProfileViewProps> = ({
  teacherId,
  onBack,
}) => {
  const teacher = IMSStateService.getTeacherById(teacherId) || IMSStateService.getTeachers('all')[0];
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [feedback, setFeedback] = useState('');

  if (!teacher) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E6E2D8]">
        <p className="text-xs text-[#57655B]">Teacher record not found.</p>
        <button onClick={onBack} className="mt-2 text-xs font-semibold text-[#0D381E]">
          ← Back to Teachers
        </button>
      </div>
    );
  }

  const salaries = IMSStateService.getSalaryRecords(teacher.id);
  const attendance = IMSStateService.getTeacherAttendance(teacher.campusId).filter(
    (a) => a.teacherId === teacher.id
  );
  const classes = IMSStateService.getClasses(teacher.campusId).filter((c) =>
    teacher.assignedClassIds.includes(c.id)
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'salary', label: 'Salary', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs text-[#57655B] hover:text-[#0D381E] font-medium cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>← Back to Faculty List</span>
      </button>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 1. TEACHER PROFILE HEADER (Requirement 13) */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E6E2D8]">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-16 h-16 rounded-xl bg-[#0D381E] text-[#E5C158] font-heading text-2xl font-bold flex items-center justify-center shrink-0 shadow-xs">
              {teacher.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h2 className="font-heading font-bold text-2xl text-[#0D381E]">
                  {teacher.fullName}
                </h2>
                <StatusBadge status="ACTIVE" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#57655B] mt-1">
                <div>
                  Employee Code: <strong className="font-mono text-[#0D381E]">{teacher.employeeCode}</strong>
                </div>
                <span>·</span>
                <div>
                  Campus: <strong className="text-[#0D381E]">{teacher.campusId.toUpperCase()} Campus</strong>
                </div>
                <span>·</span>
                <div>
                  Specialization: <strong className="text-[#0D381E]">{teacher.specialization}</strong>
                </div>
                <span>·</span>
                <div>
                  Tenure: <strong className="font-mono text-[#0D381E]">{teacher.joinDate}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto text-xs">
            <div className="p-3 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] text-right">
              <span className="text-[10px] text-[#57655B] uppercase block">Assigned Halaqahs</span>
              <span className="text-xl font-bold text-[#0D381E] font-mono">
                {classes.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] text-right">
              <span className="text-[10px] text-[#57655B] uppercase block">Base Compensation</span>
              <span className="text-xl font-bold text-emerald-800 font-mono">
                {formatCampusCurrency(teacher.baseMonthlySalary, teacher.salaryCurrency || (teacher.campusId === 'kts' ? 'PKR' : 'GBP'))}
              </span>
            </div>
          </div>
        </div>

        {/* 2. TABS STRIP (Requirement 13: Overview | Classes | Attendance | Salary | Documents | History) */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-4 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TAB CONTENTS */}

      {/* TAB: OVERVIEW (Personal, Employment, Financial) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
            <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
              Personal Information
            </h3>
            <div className="divide-y divide-[#E6E2D8] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Full Name:</span>
                <span className="font-semibold text-[#1A231E]">{teacher.fullName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Contact Phone:</span>
                <span className="font-mono text-[#1A231E]">{teacher.phone}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Official Email:</span>
                <span className="font-mono text-[#0D381E]">{teacher.email}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Academic Sanad / Degree:</span>
                <span className="text-[#1A231E]">{teacher.qualification}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Specialization:</span>
                <span className="font-semibold text-[#0D381E]">{teacher.specialization}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
            <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
              Employment & Financial Details
            </h3>
            <div className="divide-y divide-[#E6E2D8] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Joining Date:</span>
                <span className="font-mono text-[#1A231E]">{teacher.joinDate}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Assigned Branch:</span>
                <span className="font-semibold text-[#0D381E]">{teacher.campusId.toUpperCase()} Campus</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Employment Status:</span>
                <span className="font-semibold text-emerald-800">{teacher.employmentStatus}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Disbursement Frequency:</span>
                <span className="font-semibold text-[#1A231E]">Paid every Friday (Cash)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57655B]">Base Monthly Compensation:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {formatCampusCurrency(teacher.baseMonthlySalary, teacher.salaryCurrency || (teacher.campusId === 'kts' ? 'PKR' : 'GBP'))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CLASSES */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E6E2D8]">
            <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
              Assigned Classes & Halaqahs
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                  <th className="p-3.5">Class / Section</th>
                  <th className="p-3.5">Campus</th>
                  <th className="p-3.5">Schedule Time</th>
                  <th className="p-3.5">Days</th>
                  <th className="p-3.5 text-center">Student Capacity</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-[#F9F8F4]">
                    <td className="p-3.5 font-bold text-[#0D381E]">{cls.name}</td>
                    <td className="p-3.5">{cls.campusId.toUpperCase()}</td>
                    <td className="p-3.5 font-mono">{cls.scheduleTime}</td>
                    <td className="p-3.5">{cls.scheduleDays.join(', ')}</td>
                    <td className="p-3.5 text-center font-mono">{cls.capacity} Seats</td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status="ACTIVE" />
                    </td>
                  </tr>
                ))}
                {classes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[#57655B]">
                      No classes currently assigned to this faculty member.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E6E2D8] flex items-center justify-between">
            <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
              Faculty Punctuality & Check-In History
            </h3>
            <span className="text-xs text-[#57655B]">
              Rules: Up to 5:00 PM (Present), 5:01-5:30 PM (Late), After 5:30 PM (Auto-Absent)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-center">Check-In Time</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Remarks / Auto Rule</th>
                  <th className="p-3.5">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F9F8F4]">
                    <td className="p-3.5 font-mono text-[#1A231E]">{rec.date}</td>
                    <td className="p-3.5 text-center font-mono">{rec.checkInTime || '—'}</td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="p-3.5 text-[#57655B]">{rec.remarks || 'Standard roll call'}</td>
                    <td className="p-3.5 font-semibold text-[#0D381E]">{rec.recordedBy}</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-[#57655B]">
                      No historical check-in records found for this teacher.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SALARY (Requirement 29: Paid every Friday, Method: Cash) */}
      {activeTab === 'salary' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E6E2D8] flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
                Friday Compensation & Salary Ledger
              </h3>
              <p className="text-xs text-[#57655B] mt-0.5">
                Weekly disbursements issued every Friday in Cash per institute guidelines.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#57655B] uppercase block">Base Salary</span>
              <span className="font-mono font-bold text-base text-[#0D381E]">
                {formatCampusCurrency(teacher.baseMonthlySalary, teacher.salaryCurrency || (teacher.campusId === 'kts' ? 'PKR' : 'GBP'))}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                  <th className="p-3.5">Payroll Period</th>
                  <th className="p-3.5">Payment Date</th>
                  <th className="p-3.5 text-right">Base Amount</th>
                  <th className="p-3.5 text-right">Net Paid</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {salaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-[#F9F8F4]">
                    <td className="p-3.5 font-semibold text-[#1A231E]">{sal.monthYear}</td>
                    <td className="p-3.5 font-mono text-[#57655B]">{sal.paidDate || 'Every Friday'}</td>
                    <td className="p-3.5 text-right font-mono">
                      {formatCampusCurrency(sal.basicSalary || sal.baseSalary, sal.currency)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-800">
                      {formatCampusCurrency(sal.netSalary, sal.currency)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#F4F3EE] font-medium text-[#0D381E]">
                        Cash (Friday)
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status={sal.paymentStatus || sal.status || 'PAID'} />
                    </td>
                  </tr>
                ))}
                {salaries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[#57655B]">
                      No historical payroll records logged for this teacher.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs p-5 space-y-3">
          <DocumentManagerComponent
            entityType="TEACHER"
            entityId={teacher.id}
            entityName={teacher.fullName}
            campusId={teacher.campusId}
            initialDocuments={teacher.documents || []}
            canUpload={true}
            canDelete={true}
          />
        </div>
      )}

      {/* TAB: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E6E2D8]">
            <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
              Tenure History & Audit Trail
            </h3>
          </div>

          <div className="p-5 text-xs text-[#57655B] space-y-3">
            <div className="flex items-start space-x-3">
              <Clock className="w-4 h-4 text-[#0D381E] shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[11px] text-[#57655B]">{teacher.joinDate}</span>
                <p className="font-semibold text-[#1A231E] mt-0.5">Faculty Tenure Commenced</p>
                <p className="text-[11px]">Officially appointed as {teacher.specialization} instructor for {teacher.campusId.toUpperCase()} Campus with code {teacher.employeeCode}.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
