import React from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { Campus } from '../../../types/ims.ts';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { formatCampusCurrency } from '../../../utils/currency.ts';

interface CampusDrillDownViewProps {
  campusId: string;
  onBack: () => void;
  onOpenBranchPortal: (campusId: string) => void;
  onSelectStudent: (studentId: string) => void;
  onSelectTeacher: (teacherId: string) => void;
}

export const CampusDrillDownView: React.FC<CampusDrillDownViewProps> = ({
  campusId,
  onBack,
  onOpenBranchPortal,
  onSelectStudent,
  onSelectTeacher,
}) => {
  const campus = IMSStateService.getCampuses().find((c) => c.id === campusId) || IMSStateService.getCampuses()[0];
  const students = IMSStateService.getStudents(campus.id);
  const teachers = IMSStateService.getTeachers(campus.id);
  const classes = IMSStateService.getClasses(campus.id);
  const payments = IMSStateService.getPayments(campus.id);
  const expenses = IMSStateService.getExpenses(campus.id);
  const auditLogs = IMSStateService.getAuditLogs(campus.id).slice(0, 6);

  const totalCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netSavings = totalCollected - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header with Back and Impersonate Action */}
      <div className="bg-white rounded-lg p-6 border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs text-[#57655B] hover:text-[#0D381E] font-medium mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Executive Dashboard</span>
          </button>
          <div className="flex items-center space-x-2">
            <h2 className="font-heading font-semibold text-2xl text-[#0D381E]">
              {campus.name} Detailed Operational Overview
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E5C158] text-[#0D381E]">
              {campus.code}
            </span>
          </div>
          <p className="text-xs text-[#57655B] mt-0.5">
            {campus.address} · Timezone: <span className="font-mono text-[#0D381E]">{campus.timezone}</span> · Operating Currency: <span className="font-bold text-[#0D381E]">{campus.currencyCode}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenBranchPortal(campus.id)}
            className="px-4 py-2 bg-[#0D381E] hover:bg-[#16532d] text-white rounded-md text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Open Branch Admin Portal (View Mode)</span>
          </button>
        </div>
      </div>

      {/* Campus Specific KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#E6E2D8]">
          <span className="text-xs text-[#57655B]">Enrolled Students</span>
          <div className="text-2xl font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
            {students.length}
          </div>
          <span className="text-[11px] text-[#57655B]">Across {classes.length} Halaqahs</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E6E2D8]">
          <span className="text-xs text-[#57655B]">Faculty Members</span>
          <div className="text-2xl font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
            {teachers.length}
          </div>
          <span className="text-[11px] text-emerald-700">100% Certified</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E6E2D8]">
          <span className="text-xs text-[#57655B]">Fees Invoiced ({campus.currencyCode})</span>
          <div className="text-2xl font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
            {formatCampusCurrency(totalCollected, campus.currencyCode)}
          </div>
          <span className="text-[11px] text-[#57655B]">Active billing cycle</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E6E2D8]">
          <span className="text-xs text-[#57655B]">Branch Net Reserves</span>
          <div className="text-2xl font-bold text-emerald-800 tabular-nums mt-1 font-mono">
            {netSavings >= 0 ? '+' : ''}{formatCampusCurrency(netSavings, campus.currencyCode)}
          </div>
          <span className="text-[11px] text-emerald-700">Surplus after overhead</span>
        </div>
      </div>

      {/* Student and Faculty Quick Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Attendance & Directory */}
        <div className="bg-white rounded-lg border border-[#E6E2D8] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
            <h4 className="font-heading font-semibold text-base text-[#0D381E]">
              Students Enrolled in {campus.name}
            </h4>
            <span className="text-xs text-[#57655B]">{students.length} Total</span>
          </div>

          <div className="divide-y divide-[#E6E2D8] text-xs">
            {students.map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <button
                    onClick={() => onSelectStudent(s.id)}
                    className="font-semibold text-[#0D381E] hover:underline text-left cursor-pointer"
                  >
                    {s.firstName} {s.lastName}
                  </button>
                  <div className="text-[10px] text-[#57655B] font-mono">
                    {s.admissionNumber} · {s.currentGrade}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-700 font-semibold">{s.attendanceRate}% Attendance</span>
                  <div className="text-[10px] text-[#57655B]">{s.feeStatus || 'Up to date'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty Directory */}
        <div className="bg-white rounded-lg border border-[#E6E2D8] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
            <h4 className="font-heading font-semibold text-base text-[#0D381E]">
              Faculty Assigned to {campus.name}
            </h4>
            <span className="text-xs text-[#57655B]">{teachers.length} Active</span>
          </div>

          <div className="divide-y divide-[#E6E2D8] text-xs">
            {teachers.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <button
                    onClick={() => onSelectTeacher(t.id)}
                    className="font-semibold text-[#0D381E] hover:underline text-left cursor-pointer"
                  >
                    {t.fullName}
                  </button>
                  <div className="text-[10px] text-[#57655B] font-mono">
                    {t.employeeCode} · {t.specialization}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-[#1A231E]">
                    {formatCampusCurrency(t.baseMonthlySalary, t.salaryCurrency || campus.currencyCode)} /mo
                  </span>
                  <div className="text-[10px] text-emerald-700 font-medium">Full-Time</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Branch Activity */}
      <div className="bg-white rounded-lg border border-[#E6E2D8] p-5 shadow-xs">
        <h4 className="font-heading font-semibold text-base text-[#0D381E] mb-3">
          Recent Activity & Operations in {campus.name}
        </h4>
        <div className="divide-y divide-[#E6E2D8] text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#0D381E]">{log.userName}:</span>
                <span className="text-[#1A231E] ml-1.5">{log.details || log.action}</span>
              </div>
              <span className="text-[10px] font-mono text-[#57655B]">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
