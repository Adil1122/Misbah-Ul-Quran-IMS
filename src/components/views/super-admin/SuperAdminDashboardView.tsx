import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  DollarSign,
  AlertTriangle,
  Search,
  CheckCircle2,
  CalendarCheck,
  Award,
  Bell,
  BarChart3,
  Settings,
  History,
  Check,
  X,
  ArrowRight,
  UserCheck,
  UserPlus,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { Campus, UserSession } from '../../../types/ims.ts';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { StatusBadge } from '../../ui/StatusBadge.tsx';
import { formatCampusCurrency } from '../../../utils/currency.ts';
import { PortalAccountModal } from '../../modals/PortalAccountModal.tsx';

interface SuperAdminDashboardViewProps {
  campuses: Campus[];
  onNavigateTab: (tabId: string) => void;
  onSelectCampusDrillDown: (campusId: string) => void;
  onOpenBranchPortal: (campusId: string) => void;
  onOpenEditProfileModal: () => void;
  user: UserSession;
  activeCampusId: string;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({
  campuses,
  onNavigateTab,
  user,
  activeCampusId,
}) => {
  const [globalSearch, setGlobalSearch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [reviewModalItem, setReviewModalItem] = useState<{
    id: string;
    type: 'STUDENT_ADMISSION' | 'TEACHER_APPROVAL' | 'OVERDUE_FEE';
    title: string;
    person: string;
    campus: string;
    details: string;
  } | null>(null);

  // Branch Admin Account Creation Modal State (for UK and Pakistan)
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
  const [selectedAdminCampus, setSelectedAdminCampus] = useState<'uk' | 'kts'>('uk');

  const ukAdmins = IMSStateService.getUsers('CAMPUS_ADMIN', 'uk');
  const ktsAdmins = IMSStateService.getUsers('CAMPUS_ADMIN', 'kts');

  const effectiveCampus = activeCampusId;
  const students = IMSStateService.getStudents(effectiveCampus);
  const teachers = IMSStateService.getTeachers(effectiveCampus);
  const classes = IMSStateService.getClasses(effectiveCampus);
  const payments = IMSStateService.getPayments(effectiveCampus);
  const pendingAdmissions = IMSStateService.getPendingAdmissions(
    effectiveCampus === 'all' ? undefined : effectiveCampus
  ).filter((a) => a.status === 'PENDING_APPROVAL' || a.status === 'ACTION_REQUIRED');
  const pendingTeachers = IMSStateService.getPendingTeachers().filter(
    (t) =>
      (effectiveCampus === 'all' || t.campusId === effectiveCampus) &&
      (t.status === 'PENDING_APPROVAL' || t.status === 'ACTION_REQUIRED')
  );
  const overduePayments = payments.filter((p) => p.status === 'OVERDUE');

  // Campus-specific and currency-separated financial metrics
  const ukPayments = payments.filter((p) => p.campusId === 'uk' || p.currency === 'GBP');
  const ktsPayments = payments.filter((p) => p.campusId === 'kts' || p.currency === 'PKR');

  const ukCollected = ukPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  const ukOutstanding = ukPayments.reduce(
    (acc, p) => acc + Math.max(0, (p.amountDue || 0) - (p.amountPaid || 0)),
    0
  );

  const ktsCollected = ktsPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  const ktsOutstanding = ktsPayments.reduce(
    (acc, p) => acc + Math.max(0, (p.amountDue || 0) - (p.amountPaid || 0)),
    0
  );

  // Total pending count
  const totalPendingCount =
    pendingAdmissions.length + pendingTeachers.length + overduePayments.length;

  // Global search filtering across students, teachers, classes, parents, finance
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return null;

    const matchedStudents = students
      .filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedTeachers = teachers
      .filter(
        (t) =>
          t.fullName.toLowerCase().includes(q) ||
          t.employeeCode.toLowerCase().includes(q) ||
          t.specialization.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedClasses = classes
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedParents = students
      .filter(
        (s) =>
          (s.primaryParentName && s.primaryParentName.toLowerCase().includes(q)) ||
          (s.primaryParentPhone && s.primaryParentPhone.toLowerCase().includes(q))
      )
      .slice(0, 3);

    const matchedInvoices = payments
      .filter(
        (p) =>
          p.invoiceNumber.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const hasResults =
      matchedStudents.length > 0 ||
      matchedTeachers.length > 0 ||
      matchedClasses.length > 0 ||
      matchedParents.length > 0 ||
      matchedInvoices.length > 0;

    return {
      hasResults,
      students: matchedStudents,
      teachers: matchedTeachers,
      classes: matchedClasses,
      parents: matchedParents,
      invoices: matchedInvoices,
    };
  }, [globalSearch, students, teachers, classes, payments]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  };

  const handleApproveAdmission = (id: string, name: string) => {
    const ok = IMSStateService.approveStudentAdmission(id);
    if (ok) {
      showToast(`✓ Admission approved for ${name}. Student record activated.`);
      setReviewModalItem(null);
    }
  };

  const handleRejectAdmission = (id: string, name: string) => {
    const ok = IMSStateService.rejectStudentAdmission(id, 'Requirements not met at this time.');
    if (ok) {
      showToast(`Admission for ${name} rejected.`);
      setReviewModalItem(null);
    }
  };

  const handleApproveTeacher = (id: string, name: string) => {
    const ok = IMSStateService.approveTeacherOnboarding(id);
    if (ok) {
      showToast(`✓ Teacher ${name} approved and assigned to faculty.`);
      setReviewModalItem(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 1. DEEP EMERALD GREEN INSTITUTE BANNER & PROMINENT GLOBAL SEARCH */}
      <div className="bg-gradient-to-r from-[#042413] via-[#093C20] to-[#042413] text-white rounded-xl border border-[#0F5A2F] p-4 sm:p-5 shadow-md space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-800/60">
          <div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5C158] inline-block shadow-xs shrink-0"></span>
              <span>Misbah-ul-Quran Institute Management</span>
            </h2>
            <p className="text-xs text-emerald-100/85 mt-0.5">
              Super Admin Executive Overview · Campus:{' '}
              <strong className="text-[#F3D273] font-semibold">
                {effectiveCampus === 'uk'
                  ? 'London Campus'
                  : effectiveCampus === 'kts'
                  ? 'Haripur KTS Campus'
                  : 'All Campuses (Consolidated)'}
              </strong>
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => onNavigateTab('storage')}
              className="px-3 py-1 rounded-lg font-semibold bg-[#E5C158] hover:bg-[#F3D273] text-[#0D381E] flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
              title="Open Supabase Document Storage Bucket"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Storage Bucket</span>
            </button>
            <span className="px-3 py-1 rounded-lg font-semibold bg-[#031C0E]/70 border border-[#14532D] text-[#F3D273]">
              Super Admin: {user.fullName}
            </span>
          </div>
        </div>

        {/* PROMINENT GLOBAL SEARCH (Students, Teachers, Classes, Parents, Finance) */}
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-900 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Global Search: Find any student, teacher, class, parent, or invoice..."
            className="w-full pl-10 pr-12 py-2.5 text-xs rounded-lg border border-emerald-700/60 bg-white text-[#1A231E] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F3D273] focus:border-[#F3D273] shadow-inner transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
            >
              Clear
            </button>
          )}

          {/* Instant Dropdown Search Results */}
          {searchResults && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-[#E6E2D8] shadow-lg p-3 z-30 max-h-80 overflow-y-auto space-y-3 text-[#1A231E]">
              {!searchResults.hasResults ? (
                <div className="p-4 text-center text-xs text-[#57655B]">
                  No matching students, teachers, classes, parents, or invoices found.
                </div>
              ) : (
                <>
                  {searchResults.students.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#57655B] px-1">Students</span>
                      <div className="divide-y divide-[#E6E2D8]/60 mt-1">
                        {searchResults.students.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setGlobalSearch('');
                              onNavigateTab('students');
                            }}
                            className="p-2 hover:bg-[#F9F8F4] rounded-lg cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-[#0D381E]">{s.firstName} {s.lastName}</strong>
                              <span className="text-[#57655B] text-[11px] ml-2">ID: {s.admissionNumber}</span>
                            </div>
                            <span className="text-[10px] text-[#57655B]">{s.className}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.teachers.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#57655B] px-1">Teachers</span>
                      <div className="divide-y divide-[#E6E2D8]/60 mt-1">
                        {searchResults.teachers.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setGlobalSearch('');
                              onNavigateTab('teachers');
                            }}
                            className="p-2 hover:bg-[#F9F8F4] rounded-lg cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-[#0D381E]">{t.fullName}</strong>
                              <span className="text-[#57655B] text-[11px] ml-2">{t.employeeCode}</span>
                            </div>
                            <span className="text-[10px] text-[#57655B]">{t.specialization}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.classes.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#57655B] px-1">Classes</span>
                      <div className="divide-y divide-[#E6E2D8]/60 mt-1">
                        {searchResults.classes.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setGlobalSearch('');
                              onNavigateTab('classes');
                            }}
                            className="p-2 hover:bg-[#F9F8F4] rounded-lg cursor-pointer flex items-center justify-between text-xs"
                          >
                            <strong className="text-[#0D381E]">{c.name}</strong>
                            <span className="text-[10px] text-[#57655B]">{c.scheduleTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.invoices.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#57655B] px-1">Invoices</span>
                      <div className="divide-y divide-[#E6E2D8]/60 mt-1">
                        {searchResults.invoices.map((inv) => (
                          <div
                            key={inv.id}
                            onClick={() => {
                              setGlobalSearch('');
                              onNavigateTab('finance');
                            }}
                            className="p-2 hover:bg-[#F9F8F4] rounded-lg cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-[#0D381E]">{inv.invoiceNumber}</strong>
                              <span className="text-[#57655B] text-[11px] ml-2">{inv.studentName}</span>
                            </div>
                            <StatusBadge status={inv.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. COMPACT EXECUTIVE SUMMARIES (Only the 5 required summaries) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Students */}
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

        {/* Total Teachers */}
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
          <span className="text-[11px] text-[#57655B]">Faculty members</span>
        </button>

        {/* Active Classes */}
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
          <span className="text-[11px] text-[#57655B]">Active Halaqahs</span>
        </button>

        {/* Fee Collection & Outstanding Fees */}
        <button
          onClick={() => onNavigateTab('finance')}
          className="p-3.5 rounded-xl bg-white border border-[#E6E2D8] text-left hover:border-[#0D381E] hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#57655B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fee Collection</span>
            <DollarSign className="w-4 h-4 text-[#0D381E] group-hover:scale-105 transition-transform" />
          </div>
          {effectiveCampus === 'uk' ? (
            <>
              <div className="text-base font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
                {formatCampusCurrency(ukCollected, 'GBP')}
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Outstanding: {formatCampusCurrency(ukOutstanding, 'GBP')}
              </span>
            </>
          ) : effectiveCampus === 'kts' ? (
            <>
              <div className="text-base font-bold text-[#0D381E] tabular-nums mt-1 font-mono">
                {formatCampusCurrency(ktsCollected, 'PKR')}
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Outstanding: {formatCampusCurrency(ktsOutstanding, 'PKR')}
              </span>
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-[#0D381E] tabular-nums mt-1 font-mono space-y-0.5">
                <div>UK: {formatCampusCurrency(ukCollected, 'GBP')}</div>
                <div>KTS: {formatCampusCurrency(ktsCollected, 'PKR')}</div>
              </div>
              <span className="text-[10px] text-amber-800 font-medium block mt-1">
                Outstanding: UK {formatCampusCurrency(ukOutstanding, 'GBP')} · KTS {formatCampusCurrency(ktsOutstanding, 'PKR')}
              </span>
            </>
          )}
        </button>

        {/* Pending Approvals or Actions */}
        <div
          className={`p-3.5 rounded-xl border text-left col-span-2 sm:col-span-1 ${
            totalPendingCount > 0
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Pending Actions
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                totalPendingCount > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            />
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1 font-mono">
            {totalPendingCount}
          </div>
          <span className="text-[11px]">
            {totalPendingCount > 0 ? 'Requires attention below' : 'Up to date'}
          </span>
        </div>
      </div>

      {/* 2.5. CAMPUS BRANCH ADMINISTRATORS GOVERNANCE (UK & PAKISTAN) */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D381E] flex items-center justify-center text-[#E5C158] shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0D381E] flex items-center gap-2">
                <span>Branch Administrators Governance</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  UK & Pakistan
                </span>
              </h3>
              <p className="text-xs text-[#57655B]">
                Create and govern designated campus administrator accounts with isolated campus access.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('portal-accounts')}
            className="text-xs font-semibold text-[#0D381E] hover:underline flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <span>View All Portal Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* UK Campus Admin Card */}
          <div className="p-4 rounded-xl border border-[#E6E2D8] bg-[#F9F8F4] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🇬🇧</span>
                  <span className="font-bold text-sm text-[#0D381E]">UK Campus (London)</span>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  GBP (£) · GMT
                </span>
              </div>
              <div className="mt-2.5 text-xs">
                {ukAdmins.length > 0 ? (
                  <div className="space-y-1.5">
                    {ukAdmins.map((adm) => (
                      <div key={adm.id} className="p-2.5 bg-white rounded-lg border border-[#E6E2D8] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#0D381E]">{adm.fullName}</div>
                          <div className="text-[11px] text-[#57655B]">Login: <code className="font-bold text-[#0D381E]">{adm.username}</code> · {adm.email}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          Active Admin
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                    No administrator account has been created for the UK Campus yet.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedAdminCampus('uk');
                setIsCreateAdminModalOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{ukAdmins.length > 0 ? '+ Create Additional UK Admin' : 'Create UK Admin Account'}</span>
            </button>
          </div>

          {/* Pakistan Campus Admin Card */}
          <div className="p-4 rounded-xl border border-[#E6E2D8] bg-[#F9F8F4] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🇵🇰</span>
                  <span className="font-bold text-sm text-[#0D381E]">KTS Pakistan Campus (Haripur)</span>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  PKR (Rs) · PKT
                </span>
              </div>
              <div className="mt-2.5 text-xs">
                {ktsAdmins.length > 0 ? (
                  <div className="space-y-1.5">
                    {ktsAdmins.map((adm) => (
                      <div key={adm.id} className="p-2.5 bg-white rounded-lg border border-[#E6E2D8] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#0D381E]">{adm.fullName}</div>
                          <div className="text-[11px] text-[#57655B]">Login: <code className="font-bold text-[#0D381E]">{adm.username}</code> · {adm.email}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          Active Admin
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                    No administrator account has been created for the KTS Pakistan Campus yet.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedAdminCampus('kts');
                setIsCreateAdminModalOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{ktsAdmins.length > 0 ? '+ Create Additional Pakistan Admin' : 'Create Pakistan Admin Account'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PENDING ACTIONS LIST (Show ONLY when actions actually need attention) */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E6E2D8] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-heading font-bold text-base text-[#0D381E]">
              Pending Actions
            </h3>
            {totalPendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {totalPendingCount}
              </span>
            )}
          </div>
          {totalPendingCount > 0 && (
            <span className="text-xs text-[#57655B]">
              Admissions, teacher proposals, and overdue fees
            </span>
          )}
        </div>

        {totalPendingCount === 0 ? (
          <div className="p-6 text-center text-xs text-[#57655B] space-y-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
            <p className="font-semibold text-[#0D381E]">All pending actions are up to date.</p>
            <p className="text-[11px]">No admissions, teacher onboardings, or actions requiring central intervention.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E2D8]">
            {/* A. Pending Student Admissions */}
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
                    Campus: {adm.campusName} · Grade: {adm.gradeApplying} · Parent: {adm.parentName} ({adm.parentPhone})
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() =>
                      setReviewModalItem({
                        id: adm.id,
                        type: 'STUDENT_ADMISSION',
                        title: 'Review Student Admission',
                        person: adm.studentName,
                        campus: adm.campusId,
                        details: `Application for ${adm.gradeApplying}. Parent: ${adm.parentName} (${adm.parentPhone}). Notes: ${adm.notes || 'None'}`,
                      })
                    }
                    className="px-3 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer"
                  >
                    Review Application
                  </button>
                </div>
              </div>
            ))}

            {/* B. Pending Teachers */}
            {pendingTeachers.map((tch) => (
              <div
                key={tch.id}
                className="p-3.5 hover:bg-[#F9F8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                      Teacher Onboarding
                    </span>
                    <strong className="text-[#0D381E]">{tch.teacherName}</strong>
                  </div>
                  <div className="text-[11px] text-[#57655B] mt-0.5">
                    Campus: {tch.campusName} · Specialization: {tch.specialization} · Proposed Salary: {formatCampusCurrency(tch.proposedBaseSalary, tch.salaryCurrency)}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() =>
                      setReviewModalItem({
                        id: tch.id,
                        type: 'TEACHER_APPROVAL',
                        title: 'Review Teacher Onboarding',
                        person: tch.teacherName,
                        campus: tch.campusId,
                        details: `Specialization: ${tch.specialization}. Qualification: ${tch.qualification}. Proposed Salary: ${formatCampusCurrency(tch.proposedBaseSalary, tch.salaryCurrency)}`,
                      })
                    }
                    className="px-3 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer"
                  >
                    Review Proposal
                  </button>
                </div>
              </div>
            ))}

            {/* C. Overdue Invoices */}
            {overduePayments.slice(0, 3).map((ov) => (
              <div
                key={ov.id}
                className="p-3.5 hover:bg-[#F9F8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900">
                      Overdue Fee
                    </span>
                    <strong className="text-[#0D381E]">{ov.studentName}</strong>
                    <span className="text-[#57655B]">({ov.invoiceNumber})</span>
                  </div>
                  <div className="text-[11px] text-[#57655B] mt-0.5">
                    Due date: {ov.dueDate} · Amount Due: {formatCampusCurrency(ov.amountDue - ov.amountPaid, ov.currency || (ov.campusId === 'kts' ? 'PKR' : 'GBP'))}
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

      {/* REVIEW ACTION MODAL */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-[#E6E2D8] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <h4 className="font-heading font-bold text-lg text-[#0D381E]">
                {reviewModalItem.title}
              </h4>
              <button
                onClick={() => setReviewModalItem(null)}
                className="p-1 rounded text-[#57655B] hover:text-[#0D381E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] space-y-1">
                <div>
                  <span className="text-[#57655B]">Candidate / Student:</span>{' '}
                  <strong className="text-[#0D381E]">{reviewModalItem.person}</strong>
                </div>
                <div>
                  <span className="text-[#57655B]">Campus Branch:</span>{' '}
                  <strong className="text-[#0D381E]">{reviewModalItem.campus.toUpperCase()}</strong>
                </div>
                <div>
                  <span className="text-[#57655B]">Details:</span>{' '}
                  <span className="text-[#1A231E]">{reviewModalItem.details}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E6E2D8] flex items-center justify-end space-x-2">
              <button
                onClick={() => setReviewModalItem(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] hover:bg-[#F9F8F4] cursor-pointer"
              >
                Close
              </button>

              {reviewModalItem.type === 'STUDENT_ADMISSION' && (
                <>
                  <button
                    onClick={() => handleRejectAdmission(reviewModalItem.id, reviewModalItem.person)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApproveAdmission(reviewModalItem.id, reviewModalItem.person)}
                    className="px-4 py-1.5 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold cursor-pointer flex items-center space-x-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Enrol</span>
                  </button>
                </>
              )}

              {reviewModalItem.type === 'TEACHER_APPROVAL' && (
                <button
                  onClick={() => handleApproveTeacher(reviewModalItem.id, reviewModalItem.person)}
                  className="px-4 py-1.5 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold cursor-pointer flex items-center space-x-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Faculty Onboarding</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Campus Admin Account Modal for Super Admin */}
      <PortalAccountModal
        isOpen={isCreateAdminModalOpen}
        onClose={() => setIsCreateAdminModalOpen(false)}
        onSaved={(account, _msg) => {
          showToast(`✓ Admin account created for ${account.fullName} (${account.username}) at ${account.campusId === 'uk' ? 'UK Campus' : 'KTS Pakistan Campus'}`);
        }}
        campuses={campuses}
        defaultRole="CAMPUS_ADMIN"
        defaultCampusId={selectedAdminCampus}
      />
    </div>
  );
};
