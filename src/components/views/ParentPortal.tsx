import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck,
  Award,
  CreditCard,
  Bell,
  BookOpen,
  CheckCircle2,
  Lock,
  FileText,
  Video,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Mail,
  ShieldAlert,
  Search,
  Calendar,
  MoreHorizontal,
  ChevronRight,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { UserSession } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { formatCampusCurrency, getCampusRegionalConfig } from '../../utils/currency.ts';
import { DocumentManagerComponent } from '../documents/DocumentManagerComponent.tsx';

interface ParentPortalProps {
  user: UserSession;
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
}

type ParentPrimaryTab =
  | 'dashboard'
  | 'my-children'
  | 'attendance'
  | 'fees'
  | 'results'
  | 'more';

type ParentMoreSubTab =
  | 'overview'
  | 'documents'
  | 'teaching-materials'
  | 'announcements-events'
  | 'notifications'
  | 'profile';

export const ParentPortal: React.FC<ParentPortalProps> = ({
  user,
  activeTab: externalTab,
  onNavigateTab,
}) => {
  // Map external tab string to internal navigation
  const mapExternalTab = (tab?: string): { primary: ParentPrimaryTab; moreSub: ParentMoreSubTab } => {
    if (!tab || tab === 'dashboard' || tab === 'home') {
      return { primary: 'dashboard', moreSub: 'overview' };
    }
    if (tab === 'my-children' || tab === 'overview') {
      return { primary: 'my-children', moreSub: 'overview' };
    }
    if (tab === 'attendance') {
      return { primary: 'attendance', moreSub: 'overview' };
    }
    if (tab === 'fees') {
      return { primary: 'fees', moreSub: 'overview' };
    }
    if (tab === 'results' || tab === 'progress' || tab === 'quranic-progress') {
      return { primary: 'results', moreSub: 'overview' };
    }
    if (tab === 'documents' || tab === 'materials') {
      return { primary: 'more', moreSub: 'documents' };
    }
    if (tab === 'teaching-materials') {
      return { primary: 'more', moreSub: 'teaching-materials' };
    }
    if (tab === 'announcements-events' || tab === 'announcements' || tab === 'communication') {
      return { primary: 'more', moreSub: 'announcements-events' };
    }
    if (tab === 'notifications') {
      return { primary: 'more', moreSub: 'notifications' };
    }
    if (tab === 'profile') {
      return { primary: 'more', moreSub: 'profile' };
    }
    if (tab === 'more') {
      return { primary: 'more', moreSub: 'overview' };
    }
    return { primary: 'dashboard', moreSub: 'overview' };
  };

  const initial = mapExternalTab(externalTab);
  const [activeTab, setActiveTab] = useState<ParentPrimaryTab>(initial.primary);
  const [moreSubTab, setMoreSubTab] = useState<ParentMoreSubTab>(initial.moreSub);

  useEffect(() => {
    if (externalTab) {
      const mapped = mapExternalTab(externalTab);
      setActiveTab(mapped.primary);
      setMoreSubTab(mapped.moreSub);
    }
  }, [externalTab]);

  const handleTabClick = (tabId: ParentPrimaryTab, sub?: ParentMoreSubTab) => {
    setActiveTab(tabId);
    if (tabId === 'more') {
      setMoreSubTab(sub || 'overview');
    }
    if (onNavigateTab) {
      onNavigateTab(sub && sub !== 'overview' ? sub : tabId);
    }
  };

  const [feedback, setFeedback] = useState('');
  const [resultsCategory, setResultsCategory] = useState<'exams' | 'quran'>('exams');
  const [announcementsFilter, setAnnouncementsFilter] = useState<'announcements' | 'events'>('announcements');
  const [selectedAnnouncementModal, setSelectedAnnouncementModal] = useState<any | null>(null);

  // Parent guardian profile data
  const allParents = IMSStateService.getParents();
  const parentProfile =
    allParents.find((p) => p.userId === user.id) ||
    allParents.find((p) => p.email.toLowerCase() === user.email.toLowerCase()) || {
      id: `prt-${user.id}`,
      userId: user.id,
      fullName: user.fullName || 'Parent Guardian',
      email: user.email,
      phone: '',
      cnicOrId: '',
      occupation: 'Guardian',
      address: '',
      linkedStudentIds: [] as string[],
      portalAccessActive: true,
    };

  // Scoped strictly to verified linked children only (never leak or fallback to allStudents[0])
  const allStudents = IMSStateService.getStudents('all');
  const myChildren = allStudents.filter((s) => {
    if (parentProfile?.linkedStudentIds && parentProfile.linkedStudentIds.includes(s.id)) return true;
    if (parentProfile?.id && s.parentIds && s.parentIds.includes(parentProfile.id)) return true;
    if (s.parentIds && s.parentIds.includes(user.id)) return true;
    if (s.primaryParentEmail && user.email && s.primaryParentEmail.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  });

  const [selectedChildId, setSelectedChildId] = useState(myChildren[0]?.id || '');

  useEffect(() => {
    if (myChildren.length > 0) {
      if (!myChildren.some((c) => c.id === selectedChildId)) {
        setSelectedChildId(myChildren[0].id);
      }
    } else {
      setSelectedChildId('');
    }
  }, [myChildren, selectedChildId]);

  const activeChild = myChildren.find((c) => c.id === selectedChildId) || myChildren[0] || null;

  // Specific data for the active child
  const childAttendance = activeChild
    ? IMSStateService.getStudentAttendance(activeChild.campusId).filter((a) => a.studentId === activeChild.id)
    : [];

  const childQuranLogs = activeChild ? IMSStateService.getAcademicProgress(activeChild.id) : [];
  const childExamResults = activeChild ? IMSStateService.getExamResults().filter((r) => r.studentId === activeChild.id) : [];
  const childPayments = activeChild ? IMSStateService.getPayments(activeChild.campusId, activeChild.id) : [];
  const childIncidents = activeChild ? IMSStateService.getIncidents(activeChild.campusId).filter((i) => i.studentId === activeChild.id) : [];

  const announcements = IMSStateService.getAnnouncements(user.activeCampusId);
  const events = IMSStateService.getEvents(user.activeCampusId);
  const notifications = IMSStateService.getNotifications(user.activeCampusId).filter(
    (n) => n.recipientType === 'PARENTS' || n.recipientType === 'ALL'
  );
  const teachingMaterials = IMSStateService.getTeachingMaterials();

  // Regional campus fee & currency configuration
  const activeChildConfig = activeChild ? getCampusRegionalConfig(activeChild.campusId) : getCampusRegionalConfig('uk');
  const activeChildFee = activeChild?.monthlyFee || activeChildConfig.standardMonthlyFee;
  const activeSiblingFee = activeChildConfig.siblingMonthlyFee;
  const activeChildCurrency = activeChildConfig.currency;

  // Monthly attendance calculations
  const totalDaysRecorded = childAttendance.length;
  const daysPresent = childAttendance.filter((a) => a.status === 'PRESENT').length;
  const daysAbsent = childAttendance.filter((a) => a.status === 'ABSENT').length;
  const daysLate = childAttendance.filter((a) => a.status === 'LATE').length;
  const attendanceRate = totalDaysRecorded > 0 ? Math.round((daysPresent / totalDaysRecorded) * 100) : (activeChild?.attendanceRate || 95);

  // Latest pending payment check
  const hasPendingFees = activeChild?.feeStatus === 'OVERDUE' || activeChild?.feeStatus === 'PENDING' || childPayments.some((p) => p.status === 'PENDING' || p.status === 'OVERDUE');

  // Friendly date formatter
  const formatReadableDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20 sm:pb-8">
      {/* 1. FRIENDLY WELCOME HEADER */}
      <div className="bg-gradient-to-r from-[#042413] via-[#093C20] to-[#042413] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#0F5A2F]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[#E5C158] font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center space-x-1.5">
              <span>Bismillah</span>
              <span>·</span>
              <span>Misbah-ul-Quran Family Portal</span>
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mt-1">
              Assalamu Alaikum, {parentProfile.fullName}
            </h2>
            <p className="text-xs sm:text-sm text-[#E6E2D8]/90 mt-1 max-w-2xl">
              Welcome to your simple family portal. Check your child's daily attendance, school fees, and exam results without any technical hassle.
            </p>
          </div>

          {/* Child Selector (If parent has more than one child) */}
          {myChildren.length > 1 && (
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/20 self-start md:self-center shrink-0">
              <span className="text-[11px] text-[#F3D273] font-bold block mb-1.5 uppercase tracking-wider">
                Select Your Child:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {myChildren.map((child) => {
                  const isSelected = activeChild?.id === child.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setSelectedChildId(child.id)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E5C158] text-[#0D381E] shadow-sm ring-2 ring-white'
                          : 'bg-black/20 text-white hover:bg-black/40'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#0D381E] text-[#E5C158] font-bold text-xs flex items-center justify-center">
                        {child.firstName[0]}
                      </div>
                      <span>{child.firstName} {child.lastName}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2. PRIMARY TOP NAVIGATION TABS (Large 44-48px touch targets, easy words) */}
      <nav aria-label="Parent Portal Navigation" className="bg-white rounded-xl border border-[#E6E2D8] p-1.5 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { id: 'my-children', label: 'My Children', icon: GraduationCap },
            { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
            { id: 'fees', label: 'Fees', icon: CreditCard, alert: hasPendingFees },
            { id: 'results', label: 'Results', icon: Award },
            { id: 'more', label: 'More Options', icon: MoreHorizontal },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id as ParentPrimaryTab)}
                className={`min-h-[46px] flex-1 min-w-[100px] sm:min-w-0 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F3D273]' : 'text-[#57655B]'}`} />
                <span className="truncate">{item.label}</span>
                {item.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* TAB A: HOME SCREEN (The core 4 questions & latest updates)                  */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        !activeChild ? (
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-10 text-center space-y-3">
            <GraduationCap className="w-12 h-12 text-[#57655B] mx-auto opacity-50" />
            <h3 className="font-heading font-bold text-xl text-[#0D381E]">
              No Linked Children Profiles
            </h3>
            <p className="text-xs sm:text-sm text-[#57655B] max-w-md mx-auto">
              There are currently no student records linked to your guardian account ({user.email}). Please provide your student's admission number to campus administration to link your family profile.
            </p>
          </div>
        ) : (
        <div className="space-y-6 animate-in fade-in">
          {/* Active Child Overview Card */}
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E2D8]">
              <div className="flex items-center space-x-3.5 sm:space-x-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0D381E] text-[#E5C158] font-heading font-bold text-2xl flex items-center justify-center shadow-xs shrink-0">
                  {activeChild.firstName[0]}{activeChild.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
                      Currently Viewing
                    </span>
                    {activeChild.hasSiblingDiscount && (
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-[#E5C158]/30 text-[#0D381E]">
                        Sibling Discount Active
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-[#0D381E] mt-0.5">
                    {activeChild.firstName} {activeChild.lastName}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#57655B] mt-0.5">
                    Class: <strong className="text-[#0D381E]">{activeChild.className || 'Assigned Class'}</strong> · Campus: <strong className="text-[#0D381E]">{activeChildConfig.name}</strong> · ID: <span className="font-mono font-bold text-[#0D381E]">{activeChild.admissionNumber}</span>
                  </p>
                </div>
              </div>

              {/* Status Notice */}
              <div className="self-start sm:self-center">
                {hasPendingFees ? (
                  <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Monthly fee of <strong>{formatCampusCurrency(activeChildFee, activeChildCurrency)}</strong> is due on the 10th.</span>
                  </div>
                ) : (
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All tuition fees are up to date.</span>
                  </div>
                )}
              </div>
            </div>

            {/* THE 4 PROMINENT ACTION BUTTONS (Min 52px height, touch-friendly, answer parent's core questions) */}
            <div>
              <span className="text-xs font-bold text-[#57655B] uppercase tracking-wider block mb-2.5">
                Common Daily Actions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Attendance Button */}
                <button
                  type="button"
                  onClick={() => handleTabClick('attendance')}
                  className="min-h-[58px] p-4 rounded-xl bg-[#F9F8F4] hover:bg-[#F2EFE8] border border-[#E6E2D8] hover:border-[#0D381E] transition-all cursor-pointer text-left flex items-start space-x-3.5 group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-[#0D381E] flex items-center justify-between">
                      <span>Attendance</span>
                      <ChevronRight className="w-4 h-4 text-[#57655B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-[#57655B] mt-0.5">Was my child present?</p>
                    <span className="inline-block mt-1 text-[11px] font-bold text-emerald-800">
                      {attendanceRate}% Present ({daysPresent} days)
                    </span>
                  </div>
                </button>

                {/* 2. Fees Button */}
                <button
                  type="button"
                  onClick={() => handleTabClick('fees')}
                  className="min-h-[58px] p-4 rounded-xl bg-[#F9F8F4] hover:bg-[#F2EFE8] border border-[#E6E2D8] hover:border-[#0D381E] transition-all cursor-pointer text-left flex items-start space-x-3.5 group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-[#0D381E] flex items-center justify-between">
                      <span>Fees</span>
                      <ChevronRight className="w-4 h-4 text-[#57655B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-[#57655B] mt-0.5">Are any fees due?</p>
                    <span className={`inline-block mt-1 text-[11px] font-bold ${hasPendingFees ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {hasPendingFees ? 'Payment Due (10th)' : 'All Fees Paid'}
                    </span>
                  </div>
                </button>

                {/* 3. Results Button */}
                <button
                  type="button"
                  onClick={() => handleTabClick('results')}
                  className="min-h-[58px] p-4 rounded-xl bg-[#F9F8F4] hover:bg-[#F2EFE8] border border-[#E6E2D8] hover:border-[#0D381E] transition-all cursor-pointer text-left flex items-start space-x-3.5 group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-[#0D381E] flex items-center justify-between">
                      <span>Results</span>
                      <ChevronRight className="w-4 h-4 text-[#57655B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-[#57655B] mt-0.5">How is my child doing?</p>
                    <span className="inline-block mt-1 text-[11px] font-bold text-[#0D381E] truncate max-w-full">
                      {activeChild.quranMilestone || 'View latest scores'}
                    </span>
                  </div>
                </button>

                {/* 4. Messages & Updates Button */}
                <button
                  type="button"
                  onClick={() => handleTabClick('more', 'announcements-events')}
                  className="min-h-[58px] p-4 rounded-xl bg-[#F9F8F4] hover:bg-[#F2EFE8] border border-[#E6E2D8] hover:border-[#0D381E] transition-all cursor-pointer text-left flex items-start space-x-3.5 group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-[#0D381E] flex items-center justify-between">
                      <span>Messages</span>
                      <ChevronRight className="w-4 h-4 text-[#57655B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-[#57655B] mt-0.5">Notices & reminders</p>
                    <span className="inline-block mt-1 text-[11px] font-bold text-sky-800">
                      {announcements.length} school updates
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION: LATEST UPDATES (Only important announcements & events) */}
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-[#0D381E]" />
                <h4 className="font-heading font-bold text-lg text-[#0D381E]">
                  Latest Updates from Institute
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleTabClick('more', 'announcements-events')}
                className="text-xs font-bold text-[#0D381E] hover:underline cursor-pointer flex items-center space-x-1"
              >
                <span>See All Updates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#E6E2D8]">
              {announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnnouncementModal(ann)}
                  className="py-3.5 first:pt-0 last:pb-0 hover:bg-[#F9F8F4] -mx-2 px-2 rounded-lg cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0D381E] hover:underline">
                      {ann.title}
                    </span>
                    <span className="text-[11px] text-[#57655B] font-mono">
                      {formatReadableDate(ann.publishedAt.split(' ')[0])}
                    </span>
                  </div>
                  <p className="text-xs text-[#57655B] line-clamp-2">
                    {ann.content}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-xs text-[#57655B] italic py-4">No recent announcements from the institute.</p>
              )}
            </div>
          </div>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB B: MY CHILDREN (Clean list of enrolled children)                      */}
      {/* ========================================================================= */}
      {activeTab === 'my-children' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs">
            <h3 className="font-heading font-bold text-xl text-[#0D381E]">
              My Enrolled Children ({myChildren.length})
            </h3>
            <p className="text-xs text-[#57655B] mt-0.5">
              Select any child below to view their attendance, fee statements, and exam results.
            </p>

            {myChildren.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#57655B] space-y-2">
                <GraduationCap className="w-10 h-10 mx-auto text-[#57655B] opacity-40" />
                <p className="font-bold text-sm text-[#0D381E]">No Children Linked Yet</p>
                <p>Contact your campus administration with your child's student admission number to link their profile.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {myChildren.map((child) => {
                const isSelected = activeChild?.id === child.id;
                const cConfig = getCampusRegionalConfig(child.campusId);
                const cFee = child.monthlyFee || cConfig.standardMonthlyFee;
                return (
                  <div
                    key={child.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                      isSelected
                        ? 'border-[#0D381E] bg-[#F9F8F4] shadow-sm ring-2 ring-[#0D381E]'
                        : 'border-[#E6E2D8] bg-white hover:bg-[#F9F8F4]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#0D381E] text-[#E5C158] font-heading font-bold text-xl flex items-center justify-center shrink-0">
                          {child.firstName[0]}{child.lastName[0]}
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-base text-[#0D381E]">
                            {child.firstName} {child.lastName}
                          </h4>
                          <span className="text-xs text-[#57655B] block">
                            Class: {child.className} · ID: {child.admissionNumber}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 shrink-0">
                        {child.attendanceRate}% Present
                      </span>
                    </div>

                    <div className="text-xs text-[#57655B] space-y-1 bg-white p-3 rounded-xl border border-[#E6E2D8]">
                      <div>Campus: <strong className="text-[#0D381E]">{cConfig.name}</strong></div>
                      <div>Monthly Tuition: <strong className="text-[#0D381E]">{formatCampusCurrency(cFee, cConfig.currency)}</strong> (Due 10th monthly)</div>
                      <div>Quran Milestone: <strong className="text-[#0D381E]">{child.quranMilestone || 'Juz 1'}</strong></div>
                      {child.hasSiblingDiscount && (
                        <div className="text-amber-800 font-semibold">✓ Sibling Discount applied</div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChildId(child.id);
                          setFeedback(`Switched viewing focus to ${child.firstName} ${child.lastName}.`);
                        }}
                        className={`min-h-[44px] flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                            : 'bg-white border border-[#E6E2D8] text-[#0D381E] hover:bg-[#F2EFE8]'
                        }`}
                      >
                        {isSelected ? '✓ Currently Selected' : `Select ${child.firstName}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChildId(child.id);
                          handleTabClick('attendance');
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold cursor-pointer"
                      >
                        Attendance
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChildId(child.id);
                          handleTabClick('fees');
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 text-xs font-bold cursor-pointer"
                      >
                        Fees
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB C: ATTENDANCE (Simple monthly summary & clean daily list)             */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        !activeChild ? (
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-10 text-center space-y-3">
            <CalendarCheck className="w-10 h-10 text-[#57655B] mx-auto opacity-50" />
            <h4 className="font-heading font-bold text-lg text-[#0D381E]">No Child Selected</h4>
            <p className="text-xs text-[#57655B] max-w-md mx-auto">
              Please link an enrolled child to view their daily Madrasa attendance and punctuality records.
            </p>
          </div>
        ) : (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
              <div>
                <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                  Attendance Records for {activeChild.firstName}
                </h3>
                <p className="text-xs text-[#57655B] mt-0.5">
                  Class: <strong>{activeChild.className}</strong> · See every day your child attended Madrasa.
                </p>
              </div>

              {/* Child Switcher Pill */}
              {myChildren.length > 1 && (
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-[#57655B] font-medium">Child:</span>
                  <div className="flex gap-1 bg-[#F9F8F4] p-1 rounded-lg border border-[#E6E2D8]">
                    {myChildren.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedChildId(c.id)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${
                          activeChild.id === c.id
                            ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                            : 'text-[#57655B] hover:text-[#0D381E]'
                        }`}
                      >
                        {c.firstName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Simple Monthly Summary Cards (No complicated graphs) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-800 font-bold block uppercase">Overall Attendance</span>
                <span className="text-2xl font-bold font-heading text-emerald-900 mt-0.5 block">{attendanceRate}%</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] text-center">
                <span className="text-[11px] text-[#57655B] font-bold block uppercase">Days Present</span>
                <span className="text-2xl font-bold font-heading text-emerald-800 mt-0.5 block">{daysPresent}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] text-center">
                <span className="text-[11px] text-[#57655B] font-bold block uppercase">Days Absent</span>
                <span className="text-2xl font-bold font-heading text-rose-800 mt-0.5 block">{daysAbsent}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] text-center">
                <span className="text-[11px] text-[#57655B] font-bold block uppercase">Total Sessions</span>
                <span className="text-2xl font-bold font-heading text-[#0D381E] mt-0.5 block">{totalDaysRecorded}</span>
              </div>
            </div>

            {/* Clean Daily List (Plain language, readable dates, no horizontal scrolling) */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-[#57655B] uppercase tracking-wider block">
                Daily Attendance History:
              </span>

              {childAttendance.length > 0 ? (
                <div className="divide-y divide-[#E6E2D8] border border-[#E6E2D8] rounded-xl overflow-hidden bg-white">
                  {childAttendance.map((rec) => {
                    const isPresent = rec.status === 'PRESENT';
                    const isAbsent = rec.status === 'ABSENT';
                    const isLate = rec.status === 'LATE';

                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F9F8F4] transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isPresent ? 'bg-emerald-100 text-emerald-800' :
                            isAbsent ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPresent ? <Check className="w-5 h-5" /> : isAbsent ? <X className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#0D381E] block">
                              {formatReadableDate(rec.date)}
                            </span>
                            <span className="text-xs text-[#57655B]">
                              {rec.remarks || 'Regular classroom session'} · Logged by {rec.recordedBy}
                            </span>
                          </div>
                        </div>

                        {/* Large readable status badge */}
                        <div className="self-end sm:self-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                            isPresent ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            isAbsent ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                            'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            <span>{isPresent ? 'Present' : isAbsent ? 'Absent' : 'Late'}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] text-xs text-[#57655B]">
                  No attendance records logged for this student yet.
                </div>
              )}
            </div>
          </div>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB D: FEES (Amount due, payment status, due date, plain instructions)     */}
      {/* ========================================================================= */}
      {activeTab === 'fees' && (
        !activeChild ? (
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-10 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-[#57655B] mx-auto opacity-50" />
            <h4 className="font-heading font-bold text-lg text-[#0D381E]">No Child Selected</h4>
            <p className="text-xs text-[#57655B] max-w-md mx-auto">
              Please link an enrolled child to view fee statements and payment history.
            </p>
          </div>
        ) : (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
              <div>
                <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                  Tuition Fees & Payments for {activeChild.firstName}
                </h3>
                <p className="text-xs text-[#57655B] mt-0.5">
                  Monthly fee is due on the <strong>10th of each month</strong>.
                </p>
              </div>

              {myChildren.length > 1 && (
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-[#57655B] font-medium">Child:</span>
                  <div className="flex gap-1 bg-[#F9F8F4] p-1 rounded-lg border border-[#E6E2D8]">
                    {myChildren.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedChildId(c.id)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${
                          activeChild.id === c.id
                            ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                            : 'text-[#57655B] hover:text-[#0D381E]'
                        }`}
                      >
                        {c.firstName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Fee Overview Banner */}
            <div className="p-5 rounded-2xl bg-[#F9F8F4] border border-[#E6E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#57655B] font-bold uppercase tracking-wider block">
                  Monthly Tuition Fee:
                </span>
                <span className="font-heading font-bold text-3xl text-[#0D381E] font-mono mt-1 block">
                  {formatCampusCurrency(activeChildFee, activeChildCurrency)}
                </span>
                <span className="text-xs text-[#57655B] mt-1 block">
                  {activeChild.hasSiblingDiscount
                    ? `Sibling Concession Applied (${formatCampusCurrency(activeSiblingFee, activeChildCurrency)}/month)`
                    : 'Standard monthly fee schedule'}
                </span>
              </div>

              <div className="space-y-1.5 text-left sm:text-right">
                <span className="text-xs text-[#57655B] font-medium block">Current Payment Status:</span>
                <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold ${
                  hasPendingFees
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {hasPendingFees ? '⚠️ Payment Due by 10th' : '✓ All Fees Paid'}
                </span>
              </div>
            </div>

            {/* How to Pay Section (Easy instructions for non-technical parents) */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-[#0D381E] space-y-2">
              <h5 className="font-bold text-sm text-[#0D381E] flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>How to Pay Tuition Fees:</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                  <strong className="block text-[#0D381E]">1. Cash at Campus Office</strong>
                  <span className="text-[#57655B] text-[11px]">Pay directly at the Madrasa reception every week. A printed receipt will be issued immediately.</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                  <strong className="block text-[#0D381E]">2. Bank Transfer</strong>
                  <span className="text-[#57655B] text-[11px]">Transfer to the institute account with reference: <strong>{activeChild.admissionNumber}</strong>.</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                  <strong className="block text-[#0D381E]">3. Card / Online</strong>
                  <span className="text-[#57655B] text-[11px]">Contact reception for SumUp card terminal payment link.</span>
                </div>
              </div>
            </div>

            {/* Payment History List (Clean and stacked on mobile, no cryptographic hashes) */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-[#57655B] uppercase tracking-wider block">
                Payment History & Receipts:
              </span>

              {childPayments.length > 0 ? (
                <div className="divide-y divide-[#E6E2D8] border border-[#E6E2D8] rounded-xl overflow-hidden bg-white">
                  {childPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F9F8F4] transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-[#0D381E]">{p.title}</span>
                          <span className="font-mono text-xs text-[#57655B]">({p.invoiceNumber})</span>
                        </div>
                        <span className="text-xs text-[#57655B] mt-0.5 block">
                          Due Date: {p.dueDate} · Payment Method: {p.paymentMethod || 'Awaiting Payment'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="font-bold font-mono text-sm text-[#0D381E] block">
                            {formatCampusCurrency(p.amountPaid, p.currency || activeChildCurrency)}
                          </span>
                          <span className="text-[10px] text-[#57655B]">Amount Paid</span>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] text-xs text-[#57655B]">
                  No fee receipts recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB E: RESULTS (Published exams & Quran progress, plain language grades)    */}
      {/* ========================================================================= */}
      {activeTab === 'results' && (
        !activeChild ? (
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-10 text-center space-y-3">
            <Award className="w-10 h-10 text-[#57655B] mx-auto opacity-50" />
            <h4 className="font-heading font-bold text-lg text-[#0D381E]">No Child Selected</h4>
            <p className="text-xs text-[#57655B] max-w-md mx-auto">
              Please link an enrolled child to view their exam assessments and daily Quran progress.
            </p>
          </div>
        ) : (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
              <div>
                <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                  Academic Results & Quran Progress for {activeChild.firstName}
                </h3>
                <p className="text-xs text-[#57655B] mt-0.5">
                  Official verified grades, test marks, and teacher comments.
                </p>
              </div>

              {myChildren.length > 1 && (
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-[#57655B] font-medium">Child:</span>
                  <div className="flex gap-1 bg-[#F9F8F4] p-1 rounded-lg border border-[#E6E2D8]">
                    {myChildren.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedChildId(c.id)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${
                          activeChild.id === c.id
                            ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                            : 'text-[#57655B] hover:text-[#0D381E]'
                        }`}
                      >
                        {c.firstName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Simple Sub-Tab Selector */}
            <div className="flex items-center space-x-1.5 bg-[#F4F3EE] p-1 rounded-xl border border-[#E6E2D8] w-fit">
              <button
                type="button"
                onClick={() => setResultsCategory('exams')}
                className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  resultsCategory === 'exams'
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E]'
                }`}
              >
                School Exams & Tests ({childExamResults.length})
              </button>
              <button
                type="button"
                onClick={() => setResultsCategory('quran')}
                className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  resultsCategory === 'quran'
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E]'
                }`}
              >
                Quran Reading Progress ({childQuranLogs.length})
              </button>
            </div>

            {/* 1. School Exams */}
            {resultsCategory === 'exams' && (
              <div className="space-y-3">
                {childExamResults.length > 0 ? (
                  <div className="divide-y divide-[#E6E2D8] border border-[#E6E2D8] rounded-xl overflow-hidden bg-white">
                    {childExamResults.map((ex) => (
                      <div key={ex.id} className="p-4 space-y-2 hover:bg-[#F9F8F4] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="font-bold text-base text-[#0D381E]">{ex.subject}</span>
                            <span className="text-xs text-[#57655B] block">{ex.assessmentName} · Taken on {formatReadableDate(ex.examDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2 self-start sm:self-auto">
                            <span className="font-mono font-bold text-lg text-emerald-800">
                              {ex.marksObtained} / {ex.maxMarks}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0D381E] text-[#F3D273]">
                              Grade {ex.grade}
                            </span>
                          </div>
                        </div>

                        {ex.remarks && (
                          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-[#0D381E]">
                            <strong>Teacher Comment:</strong> "{ex.remarks}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] text-xs text-[#57655B]">
                    No published exam results for this term yet.
                  </div>
                )}

                {/* Grade explanation guide in easy words */}
                <div className="p-3.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl text-xs text-[#57655B] flex flex-wrap items-center gap-3">
                  <span className="font-bold text-[#0D381E]">Grading Guide:</span>
                  <span><strong>A*</strong> (90%+ Excellent)</span>
                  <span><strong>A</strong> (80%+ Very Good)</span>
                  <span><strong>B</strong> (70%+ Good)</span>
                  <span><strong>C</strong> (60%+ Pass)</span>
                </div>
              </div>
            )}

            {/* 2. Quran Reading Progress */}
            {resultsCategory === 'quran' && (
              <div className="space-y-3">
                {childQuranLogs.length > 0 ? (
                  <div className="space-y-3">
                    {childQuranLogs.map((log) => (
                      <div key={log.id} className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-sm text-[#0D381E]">
                            Sabaq: {log.sabaqSurah} ({log.sabaqAyah})
                          </span>
                          <span className="text-xs font-mono text-[#57655B]">
                            Logged {formatReadableDate(log.date)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-[#57655B]">
                          <div className="bg-white p-2 rounded border border-[#E6E2D8]">
                            Sabqi (Recent Revision): <strong>{log.sabqiJuz || 'Ongoing'}</strong>
                          </div>
                          <div className="bg-white p-2 rounded border border-[#E6E2D8]">
                            Manzil (Recall): <strong>{log.manzilJuz || 'Daily Juz'}</strong>
                          </div>
                        </div>
                        {log.feedback && (
                          <p className="text-xs text-emerald-900 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                            <strong>Qari Feedback:</strong> "{log.feedback}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] text-xs text-[#57655B]">
                    No Quran recitation entries logged yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB F: MORE (Secondary features: Documents, Announcements, Notifications, Profile) */}
      {/* ========================================================================= */}
      {activeTab === 'more' && (
        <div className="space-y-4 animate-in fade-in">
          {moreSubTab !== 'overview' && (
            <button
              type="button"
              onClick={() => setMoreSubTab('overview')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#E6E2D8] hover:bg-[#F2EFE8] text-xs font-bold text-[#0D381E] flex items-center space-x-2 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to More Options</span>
            </button>
          )}

          {/* More Overview Menu Grid */}
          {moreSubTab === 'overview' && (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                  More Family Services
                </h3>
                <p className="text-xs text-[#57655B] mt-0.5">
                  Access documents, announcements, study materials, and guardian contact details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'announcements-events',
                    title: 'Announcements & Events',
                    desc: 'Institute notices, holiday calendars, and meetings',
                    icon: Bell,
                  },
                  {
                    id: 'documents',
                    title: 'Documents & Certificates',
                    desc: 'Download admission forms and verified certificates',
                    icon: FileText,
                  },
                  {
                    id: 'teaching-materials',
                    title: 'Teaching Materials',
                    desc: 'Quran recitation audio guides and study handouts',
                    icon: Video,
                  },
                  {
                    id: 'notifications',
                    title: 'Notifications Log',
                    desc: 'Past WhatsApp and Email messages dispatched to you',
                    icon: MessageSquare,
                  },
                  {
                    id: 'profile',
                    title: 'Guardian Profile & Settings',
                    desc: 'Your contact telephone, address, and emergency details',
                    icon: User,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMoreSubTab(item.id as ParentMoreSubTab)}
                      className="min-h-[64px] p-4 rounded-xl bg-[#F9F8F4] hover:bg-[#F2EFE8] border border-[#E6E2D8] hover:border-[#0D381E] transition-all cursor-pointer text-left flex items-start space-x-3.5 group shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#0D381E] text-[#E5C158] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-[#0D381E] flex items-center justify-between">
                          <span>{item.title}</span>
                          <ChevronRight className="w-4 h-4 text-[#57655B] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <p className="text-xs text-[#57655B] mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-View: Announcements & Events */}
          {moreSubTab === 'announcements-events' && (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
                <div>
                  <h4 className="font-heading font-bold text-lg text-[#0D381E]">
                    Announcements & Upcoming Events
                  </h4>
                  <p className="text-xs text-[#57655B]">Important dates, examination schedules, and holidays.</p>
                </div>

                <div className="flex items-center space-x-1.5 bg-[#F4F3EE] p-1 rounded-xl border border-[#E6E2D8]">
                  <button
                    type="button"
                    onClick={() => setAnnouncementsFilter('announcements')}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      announcementsFilter === 'announcements'
                        ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                        : 'text-[#57655B] hover:text-[#0D381E]'
                    }`}
                  >
                    Announcements ({announcements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementsFilter('events')}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      announcementsFilter === 'events'
                        ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                        : 'text-[#57655B] hover:text-[#0D381E]'
                    }`}
                  >
                    Events ({events.length})
                  </button>
                </div>
              </div>

              {announcementsFilter === 'announcements' ? (
                <div className="divide-y divide-[#E6E2D8]">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="py-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#0D381E]">{ann.title}</span>
                        <span className="text-[11px] font-mono text-[#57655B]">{formatReadableDate(ann.publishedAt.split(' ')[0])}</span>
                      </div>
                      <p className="text-xs text-[#57655B] leading-relaxed">{ann.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-[#E6E2D8]">
                  {events.map((evt) => (
                    <div key={evt.id} className="py-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#0D381E]">{evt.title}</span>
                        <span className="text-[11px] font-mono text-[#0D381E] font-bold">{evt.dateTime}</span>
                      </div>
                      <p className="text-xs text-[#57655B]">{evt.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-View: Documents */}
          {moreSubTab === 'documents' && activeChild && (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
              <DocumentManagerComponent
                entityType="STUDENT"
                entityId={activeChild.id}
                entityName={`${activeChild.firstName} ${activeChild.lastName}`.trim()}
                campusId={activeChild.campusId}
                userRole="PARENT"
                initialDocuments={activeChild.documents || []}
                canUpload={true}
                canDelete={false}
              />
            </div>
          )}

          {/* Sub-View: Teaching Materials */}
          {moreSubTab === 'teaching-materials' && (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h4 className="font-heading font-bold text-lg text-[#0D381E]">
                  Quran Recitation Guides & Study Materials
                </h4>
                <p className="text-xs text-[#57655B]">Audio guides and syllabus worksheets provided by instructors.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {teachingMaterials.map((mat) => (
                  <div key={mat.id} className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {mat.type} Guide
                      </span>
                      <h5 className="font-heading font-bold text-sm text-[#0D381E] mt-1.5">{mat.title}</h5>
                      <p className="text-xs text-[#57655B] mt-0.5">{mat.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFeedback(`Opening learning resource: ${mat.fileName}`);
                        setTimeout(() => setFeedback(''), 4000);
                      }}
                      className="min-h-[40px] mt-2 px-3 py-1.5 rounded-lg bg-[#0D381E] text-white hover:bg-[#16532d] text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#E5C158]" />
                      <span>Access Material</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-View: Notifications */}
          {moreSubTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h4 className="font-heading font-bold text-lg text-[#0D381E]">
                  School Notifications Log
                </h4>
                <p className="text-xs text-[#57655B]">Recent messages dispatched to parents via WhatsApp or Email.</p>
              </div>

              <div className="divide-y divide-[#E6E2D8]">
                {notifications.map((n) => (
                  <div key={n.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#0D381E]">{n.title}</span>
                      <span className="text-[11px] font-mono text-[#57655B]">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#57655B]">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-View: Guardian Profile */}
          {moreSubTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h4 className="font-heading font-bold text-lg text-[#0D381E]">
                  Guardian Profile Information
                </h4>
                <p className="text-xs text-[#57655B]">Contact telephone and residential address on file.</p>
              </div>

              <div className="space-y-3 text-xs max-w-lg">
                <div className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8]">
                  <span className="text-[#57655B] block font-semibold">Full Guardian Name:</span>
                  <span className="font-bold text-sm text-[#0D381E]">{parentProfile.fullName}</span>
                </div>
                <div className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8]">
                  <span className="text-[#57655B] block font-semibold">Telephone / WhatsApp:</span>
                  <span className="font-bold text-sm font-mono text-[#0D381E]">{parentProfile.phone}</span>
                </div>
                <div className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8]">
                  <span className="text-[#57655B] block font-semibold">Email Address:</span>
                  <span className="font-bold text-sm font-mono text-[#0D381E]">{parentProfile.email}</span>
                </div>
                <div className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8]">
                  <span className="text-[#57655B] block font-semibold">Address:</span>
                  <span className="font-bold text-sm text-[#0D381E]">{parentProfile.address}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-[#0D381E] block">Need to update phone number or address?</strong>
                  <span className="text-[#57655B]">Tap below to submit an update request to campus reception.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFeedback('Request submitted: Campus office will verify and update your contact record.');
                    setTimeout(() => setFeedback(''), 4500);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs shrink-0"
                >
                  Request Changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* POPUP MODAL FOR ANNOUNCEMENT PREVIEW */}
      {selectedAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E6E2D8]">
            <div className="flex items-start justify-between pb-3 border-b border-[#E6E2D8]">
              <div>
                <h4 className="font-heading font-bold text-lg text-[#0D381E]">
                  {selectedAnnouncementModal.title}
                </h4>
                <span className="text-xs font-mono text-[#57655B]">
                  Published on {formatReadableDate(selectedAnnouncementModal.publishedAt.split(' ')[0])}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncementModal(null)}
                className="w-8 h-8 rounded-full bg-[#F4F3EE] hover:bg-[#E6E2D8] flex items-center justify-center text-[#0D381E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#1A231E] leading-relaxed whitespace-pre-line">
              {selectedAnnouncementModal.content}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnnouncementModal(null)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0D381E] text-white font-bold text-xs cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE STICKY BOTTOM NAVIGATION BAR (Thumb friendly, min 48px touch targets) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E6E2D8] px-2 py-1.5 flex items-center justify-around sm:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'my-children', label: 'Children', icon: GraduationCap },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { id: 'fees', label: 'Fees', icon: CreditCard, alert: hasPendingFees },
          { id: 'results', label: 'Results', icon: Award },
          { id: 'more', label: 'More', icon: MoreHorizontal },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id as ParentPrimaryTab)}
              className={`min-h-[48px] flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer relative ${
                isActive ? 'text-[#0D381E] font-bold' : 'text-[#57655B]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#0D381E]' : 'text-[#57655B]'}`} />
              <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
              {item.alert && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1/4" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
