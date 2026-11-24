import React from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { Campus, AuditLogRecord } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { formatCampusCurrency } from '../../utils/currency.ts';

interface SuperAdminDashboardProps {
  campuses: Campus[];
  onSelectCampus: (campusId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  campuses,
  onSelectCampus,
  onNavigateTab,
}) => {
  const ukStudents = IMSStateService.getStudents('uk');
  const ktsStudents = IMSStateService.getStudents('kts');
  const ukTeachers = IMSStateService.getTeachers('uk');
  const ktsTeachers = IMSStateService.getTeachers('kts');
  const ukClasses = IMSStateService.getClasses('uk');
  const ktsClasses = IMSStateService.getClasses('kts');

  const ukPayments = IMSStateService.getPayments('uk');
  const ktsPayments = IMSStateService.getPayments('kts');
  const ukInvoiced = ukPayments.reduce((acc, p) => acc + p.amountDue, 0);
  const ktsInvoiced = ktsPayments.reduce((acc, p) => acc + p.amountDue, 0);

  const incidents = IMSStateService.getIncidents('all');
  const pendingIncidents = incidents.filter((i) => i.status === 'SUBMITTED');
  const auditLogs = IMSStateService.getAuditLogs('all').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-lg p-6 border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#E5C158] bg-[#0D381E] px-2.5 py-0.5 rounded">
            Global Control Center
          </span>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-2">
            Multi-Campus Institutional Overview
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5 max-w-xl">
            Unified governance across UK Campus (London) and KTS Pakistan Campus (Haripur). Strict campus boundaries enforced across database tiers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateTab('campuses')}
            className="px-3.5 py-2 bg-[#0D381E] text-white rounded text-xs font-semibold hover:bg-[#16532d] flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Campus</span>
          </button>
        </div>
      </div>

      {/* 2. Critical Exceptions & Pending Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border-l-4 border-l-amber-500 border border-[#E6E2D8] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#57655B]">Pending Incident Approvals</span>
            <div className="text-xl font-bold text-[#0D381E] tabular-nums mt-0.5">
              {pendingIncidents.length} Pending
            </div>
            <span className="text-[11px] text-amber-700">Requires campus admin review</span>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>

        <div className="bg-white rounded-lg p-4 border-l-4 border-l-emerald-600 border border-[#E6E2D8] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#57655B]">Global Enrolled Students</span>
            <div className="text-xl font-bold text-[#0D381E] tabular-nums mt-0.5">
              {ukStudents.length + ktsStudents.length} Active Records
            </div>
            <span className="text-[11px] text-emerald-700">Across 2 International Branches</span>
          </div>
          <GraduationCap className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="bg-white rounded-lg p-4 border-l-4 border-l-[#0D381E] border border-[#E6E2D8] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#57655B]">Faculty & Halaqah Leads</span>
            <div className="text-xl font-bold text-[#0D381E] tabular-nums mt-0.5">
              {ukTeachers.length + ktsTeachers.length} Certified Instructors
            </div>
            <span className="text-[11px] text-[#57655B]">Daily roll-call authorized</span>
          </div>
          <Users className="w-6 h-6 text-[#0D381E]" />
        </div>
      </div>

      {/* 3. DUAL CAMPUS COMPARISON SECTION (UK vs KTS PAKISTAN) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
            Operating Campuses Comparison Matrix
          </h3>
          <span className="text-xs text-[#57655B]">
            Isolated currency, timezone, and student attendance & records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UK CAMPUS CARD */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
            <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C158]">
                  Branch Code: UK-01
                </span>
                <h4 className="font-heading font-semibold text-xl text-[#F3D273]">
                  UK Campus (London)
                </h4>
                <p className="text-xs text-white/70">Europe/London · 142 Whitechapel Rd</p>
              </div>
              <div className="text-right">
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 font-mono text-[#E5C158] font-bold">
                  CURRENCY: GBP (£)
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                  <span className="text-[10px] text-[#57655B] uppercase block">Students</span>
                  <span className="text-lg font-bold text-[#0D381E] tabular-nums">
                    {ukStudents.length}
                  </span>
                </div>
                <div className="p-3 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                  <span className="text-[10px] text-[#57655B] uppercase block">Teachers</span>
                  <span className="text-lg font-bold text-[#0D381E] tabular-nums">
                    {ukTeachers.length}
                  </span>
                </div>
                <div className="p-3 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                  <span className="text-[10px] text-[#57655B] uppercase block">Classes</span>
                  <span className="text-lg font-bold text-[#0D381E] tabular-nums">
                    {ukClasses.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E6E2D8] text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-[#57655B]">Today's Student Attendance:</span>
                  <span className="font-semibold text-[#0D381E] tabular-nums">94.2%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#57655B]">Teacher Attendance Rate:</span>
                  <span className="font-semibold text-[#0D381E] tabular-nums">100% Present</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#57655B]">October Fees Invoiced:</span>
                  <span className="font-semibold text-[#0D381E] tabular-nums font-mono">
                    {formatCampusCurrency(ukInvoiced, 'GBP', { showCode: true })}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#57655B]">Lead Campus Administrator:</span>
                  <span className="font-semibold text-[#0D381E]">Ustadh Tariq Mahmood</span>
                </div>
              </div>

              <button
                onClick={() => onSelectCampus('uk')}
                className="w-full mt-2 py-2 px-3 rounded text-xs font-semibold bg-[#F9F8F4] hover:bg-[#0D381E] text-[#0D381E] hover:text-white border border-[#E6E2D8] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Filter Dashboard to UK Campus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* KTS PAKISTAN CAMPUS CARD */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
            <div className="bg-[#072212] text-white p-5 flex items-center justify-between border-b border-[#16532d]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C158]">
                  Branch Code: KTS-01
                </span>
                <h4 className="font-heading font-semibold text-xl text-[#F3D273]">
                  KTS Pakistan Campus (Haripur)
                </h4>
                <p className="text-xs text-white/70">Asia/Karachi · Sector 3, Khalabat</p>
              </div>
              <div className="text-right">
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 font-mono text-[#E5C158] font-bold">
                  CURRENCY: PKR (Rs)
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                  <span className="text-[10px] text-[#57655B] uppercase block">Students</span>
                  <span className="text-lg font-bold text-[#0D381E] tabular-nums">
                    {ktsStudents.length}
                  </span>
                </div>
                <div className="p-3 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                  <span className="text-[10px] text-[#57655B] uppercase block">Teachers</span>
                  <span className="text-lg font-bold text-[#0D381E] tabular-nums">
                    {ktsTeachers.length}
                  </span>
                </div>
                <div className="p-3 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                  <span className="text-[10px] text-[#57655B] uppercase block">Classes</span>
                  <span className="text-lg font-bold text-[#0D381E] tabular-nums">
                    {ktsClasses.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E6E2D8] text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-[#57655B]">Today's Student Attendance:</span>
                  <span className="font-semibold text-[#0D381E] tabular-nums">91.8%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#57655B]">Teacher Attendance Rate:</span>
                  <span className="font-semibold text-[#0D381E] tabular-nums">95% (1 on leave)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#57655B]">October Fees Invoiced:</span>
                  <span className="font-semibold text-[#0D381E] tabular-nums font-mono">
                    {formatCampusCurrency(ktsInvoiced, 'PKR', { showCode: true })}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#57655B]">Lead Campus Administrator:</span>
                  <span className="font-semibold text-[#0D381E]">Qari Abdul Rehman Khan</span>
                </div>
              </div>

              <button
                onClick={() => onSelectCampus('kts')}
                className="w-full mt-2 py-2 px-3 rounded text-xs font-semibold bg-[#F9F8F4] hover:bg-[#0D381E] text-[#0D381E] hover:text-white border border-[#E6E2D8] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Filter Dashboard to KTS Pakistan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Security Audit Log Feed */}
      <div className="bg-white rounded-lg p-5 border border-[#E6E2D8] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#0D381E]" />
            <h4 className="font-heading font-semibold text-base text-[#0D381E]">
              Recent Institutional Audit Actions
            </h4>
          </div>
          <span className="text-[11px] text-[#57655B]">Immutable Security Log</span>
        </div>

        <div className="divide-y divide-[#E6E2D8] text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#0D381E]">{log.userName}</span>
                <span className="text-[#57655B] ml-1.5">({log.userRole}):</span>
                <span className="text-[#1A231E] ml-1">{log.details || log.action}</span>
              </div>
              <span className="text-[11px] font-mono text-[#57655B] shrink-0 ml-3">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
