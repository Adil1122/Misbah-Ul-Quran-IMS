import React, { useState, useEffect } from 'react';
import { IMSStateService } from './services/imsStateService.ts';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { LoginView } from './components/views/LoginView.tsx';
import { InitialSetupView } from './components/views/InitialSetupView.tsx';
import { SuperAdminDashboardView } from './components/views/super-admin/SuperAdminDashboardView.tsx';
import { CampusDrillDownView } from './components/views/super-admin/CampusDrillDownView.tsx';
import { StudentDetailedProfileView } from './components/views/super-admin/StudentDetailedProfileView.tsx';
import { TeacherDetailedProfileView } from './components/views/super-admin/TeacherDetailedProfileView.tsx';
import { ApprovalCenterView } from './components/views/super-admin/ApprovalCenterView.tsx';
import { FinancialAuditCenterView } from './components/views/super-admin/FinancialAuditCenterView.tsx';
import { QuranicProgressMatrixView } from './components/views/super-admin/QuranicProgressMatrixView.tsx';
import { AuditCenterView } from './components/views/super-admin/AuditCenterView.tsx';
import { StudentIdAndAccountsView } from './components/views/super-admin/StudentIdAndAccountsView.tsx';
import { PortalAccountsView } from './components/views/super-admin/PortalAccountsView.tsx';
import { StudentResultsView } from './components/views/super-admin/StudentResultsView.tsx';
import { CampusAdminDashboard } from './components/views/CampusAdminDashboard.tsx';
import { TeacherPortal } from './components/views/TeacherPortal.tsx';
import { StudentPortal } from './components/views/StudentPortal.tsx';
import { ParentPortal } from './components/views/ParentPortal.tsx';
import { StudentDirectoryView } from './components/views/StudentDirectoryView.tsx';
import { TeacherDirectoryView } from './components/views/TeacherDirectoryView.tsx';
import { ClassesView } from './components/views/ClassesView.tsx';
import { CampusesView } from './components/views/CampusesView.tsx';
import { PaymentsView } from './components/views/PaymentsView.tsx';
import { IncidentsView } from './components/views/IncidentsView.tsx';
import { AnnouncementsView } from './components/views/AnnouncementsView.tsx';
import { AttendanceManagementView } from './components/views/AttendanceManagementView.tsx';
import { ResultsProgressManagementView } from './components/views/ResultsProgressManagementView.tsx';
import { CommunicationManagementView } from './components/views/CommunicationManagementView.tsx';
import { StudentAttendanceAdminView } from './components/views/StudentAttendanceAdminView.tsx';
import { TeacherAttendanceAdminView } from './components/views/TeacherAttendanceAdminView.tsx';
import { QuranProgressView } from './components/views/QuranProgressView.tsx';
import { SystemSettingsView } from './components/views/SystemSettingsView.tsx';
import { ReportsAndAnalyticsView } from './components/views/ReportsAndAnalyticsView.tsx';
import { StorageBucketView } from './components/views/StorageBucketView.tsx';
import { SecurityVerificationModal } from './components/modals/SecurityVerificationModal.tsx';
import { EditProfileModal } from './components/modals/EditProfileModal.tsx';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal.tsx';
import { NamazScheduleModal } from './components/modals/NamazScheduleModal.tsx';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(IMSStateService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeCampusId, setActiveCampusId] = useState<string>('all');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Drill-down selection states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std-uk-01');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('tch-uk-01');
  const [drillDownCampusId, setDrillDownCampusId] = useState<string>('uk');

  // Branch Impersonation state
  const [impersonation, setImpersonation] = useState(IMSStateService.getImpersonationState());

  // Prayer timetable modal state
  const [isNamazModalOpen, setIsNamazModalOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K or Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Subscribe to reactive IMS state changes
  useEffect(() => {
    // Initial data hydration from Supabase PostgreSQL
    IMSStateService.initSupabaseSync().catch((err) =>
      console.warn('Supabase initialization sync warning:', err)
    );

    const unsubscribe = IMSStateService.subscribe(() => {
      const current = IMSStateService.getCurrentUser();
      setUser(current ? { ...current } : null);
      setImpersonation(IMSStateService.getImpersonationState());
      if (current) {
        setActiveCampusId(current.activeCampusId);
      }
    });
    return unsubscribe;
  }, []);

  // When user logs in, reset activeTab to 'dashboard'
  const handleLoginSuccess = () => {
    const current = IMSStateService.getCurrentUser();
    setUser(current ? { ...current } : null);
    if (current) {
      setActiveCampusId(current.activeCampusId);
      setActiveTab('dashboard');
      // Trigger authoritative hydration with the newly authenticated session
      IMSStateService.initSupabaseSync().catch((err) =>
        console.warn('Supabase post-login sync warning:', err)
      );
    }
  };

  const handleLogout = () => {
    IMSStateService.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleCampusChange = (campusId: string) => {
    IMSStateService.setActiveCampus(campusId);
    setActiveCampusId(campusId);
  };

  const handleSelectStudentProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('student-detail');
  };

  const handleSelectTeacherProfile = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setActiveTab('teacher-detail');
  };

  const handleOpenCampusDrillDown = (campusId: string) => {
    setDrillDownCampusId(campusId);
    setActiveTab('campus-drilldown');
  };

  const handleStartBranchViewMode = (campusId: string) => {
    IMSStateService.startBranchImpersonation(campusId);
  };

  const handleExitBranchViewMode = () => {
    IMSStateService.exitBranchImpersonation();
    setActiveTab('dashboard');
  };

  // If system has not completed initial Super Admin setup, show one-time setup wizard
  if (!IMSStateService.isSystemSetupCompleted()) {
    return (
      <InitialSetupView
        onSetupSuccess={() => {
          const current = IMSStateService.getCurrentUser();
          setUser(current ? { ...current } : null);
          if (current) {
            setActiveCampusId(current.activeCampusId);
            setActiveTab('dashboard');
          }
        }}
      />
    );
  }

  // If not logged in, render authentic Login Page
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const campuses = IMSStateService.getCampuses();
  const currentCampus = campuses.find((c) => c.id === (user.role === 'SUPER_ADMIN' ? activeCampusId : user.activeCampusId)) || campuses[0];
  const impersonatedCampus = campuses.find((c) => c.id === impersonation.campusId) || campuses[0];

  // Route & View resolution strictly isolated by role
  const renderContent = () => {
    // A. BRANCH IMPERSONATION VIEW MODE (SUPER ADMIN INSPECTING AS CAMPUS ADMIN)
    if (impersonation.isImpersonating && user.role === 'SUPER_ADMIN') {
      return (
        <CampusAdminDashboard
          user={{
            ...user,
            role: 'CAMPUS_ADMIN',
            activeCampusId: impersonation.campusId || 'uk',
          }}
          campus={impersonatedCampus}
          onNavigateTab={(tab) => {
            if (tab === 'students') setActiveTab('students');
            else if (tab === 'teachers') setActiveTab('teachers');
            else if (tab === 'incidents') setActiveTab('incidents');
          }}
        />
      );
    }

    // B. TEACHER PORTAL
    if (user.role === 'TEACHER') {
      return (
        <TeacherPortal
          user={user}
          activeTab={activeTab}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      );
    }

    // C. PARENT & FAMILY PORTAL (Student records accessed via Parents & Guardians)
    if (user.role === 'PARENT' || user.role === 'STUDENT') {
      return (
        <ParentPortal
          user={user}
          activeTab={activeTab}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      );
    }

    // D. CAMPUS ADMIN VIEW
    if (user.role === 'CAMPUS_ADMIN') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <CampusAdminDashboard
              user={user}
              campus={currentCampus}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          );
        case 'students':
          return (
            <StudentDirectoryView
              user={user}
              campuses={campuses}
              activeCampusId={activeCampusId}
              onSelectStudent={handleSelectStudentProfile}
            />
          );
        case 'student-detail':
          return (
            <StudentDetailedProfileView
              studentId={selectedStudentId}
              onBack={() => setActiveTab('students')}
            />
          );
        case 'teachers':
          return (
            <TeacherDirectoryView
              user={user}
              campuses={campuses}
              activeCampusId={activeCampusId}
              onSelectTeacher={handleSelectTeacherProfile}
            />
          );
        case 'teacher-detail':
          return (
            <TeacherDetailedProfileView
              teacherId={selectedTeacherId}
              onBack={() => setActiveTab('teachers')}
            />
          );
        case 'classes':
          return <ClassesView user={user} activeCampusId={activeCampusId} />;
        case 'attendance':
        case 'student-attendance':
          return <AttendanceManagementView user={user} activeCampusId={activeCampusId} initialSubTab="student" />;
        case 'teacher-attendance':
          return <AttendanceManagementView user={user} activeCampusId={activeCampusId} initialSubTab="teacher" />;
        case 'finance':
        case 'payments':
        case 'invoices':
          return <PaymentsView user={user} campuses={campuses} activeCampusId={activeCampusId} />;
        case 'results':
        case 'results-progress':
        case 'quran-progress':
        case 'exam-results':
          return <ResultsProgressManagementView user={user} activeCampusId={activeCampusId} />;
        case 'announcements-events':
        case 'communication':
        case 'announcements':
          return <AnnouncementsView user={user} activeCampusId={activeCampusId} />;
        case 'incidents-medical':
        case 'incidents':
        case 'medical':
          return <IncidentsView user={user} campuses={campuses} activeCampusId={activeCampusId} />;
        case 'reports':
          return <ReportsAndAnalyticsView user={user} activeCampusId={activeCampusId} />;
        case 'storage':
        case 'storage-bucket':
        case 'documents':
          return <StorageBucketView user={user} activeCampusId={activeCampusId} />;
        case 'audit-logs':
          return <AuditCenterView />;
        case 'settings':
          return <SystemSettingsView user={user} />;
        default:
          return <CampusAdminDashboard user={user} campus={currentCampus} onNavigateTab={(tab) => setActiveTab(tab)} />;
      }
    }

    // E. SUPER ADMIN CENTRAL REVIEWS & DRILL-DOWNS
    switch (activeTab) {
      case 'dashboard':
        return (
          <SuperAdminDashboardView
            campuses={campuses}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectCampusDrillDown={handleOpenCampusDrillDown}
            onOpenBranchPortal={handleStartBranchViewMode}
            onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)}
            user={user}
            activeCampusId={activeCampusId}
          />
        );

      case 'students':
        return (
          <StudentDirectoryView
            user={user}
            campuses={campuses}
            activeCampusId={activeCampusId}
            onSelectStudent={handleSelectStudentProfile}
          />
        );

      case 'student-detail':
        return (
          <StudentDetailedProfileView
            studentId={selectedStudentId}
            onBack={() => setActiveTab('students')}
          />
        );

      case 'teachers':
        return (
          <TeacherDirectoryView
            user={user}
            campuses={campuses}
            activeCampusId={activeCampusId}
            onSelectTeacher={handleSelectTeacherProfile}
          />
        );

      case 'teacher-detail':
      case 'teacher-salaries':
        return (
          <TeacherDetailedProfileView
            teacherId={selectedTeacherId}
            onBack={() => setActiveTab('teachers')}
          />
        );

      case 'classes':
        return <ClassesView user={user} activeCampusId={activeCampusId} />;

      case 'attendance':
      case 'attendance-oversight':
      case 'student-attendance':
        return <AttendanceManagementView user={user} activeCampusId={activeCampusId} initialSubTab="student" />;

      case 'teacher-attendance':
        return <AttendanceManagementView user={user} activeCampusId={activeCampusId} initialSubTab="teacher" />;

      case 'finance':
      case 'finance-overview':
      case 'payments':
      case 'invoices':
        return (
          <PaymentsView
            user={user}
            campuses={campuses}
            activeCampusId={activeCampusId}
          />
        );

      case 'financial-audit':
      case 'reports-financial':
        return <FinancialAuditCenterView activeCampusId={activeCampusId} />;

      case 'results':
      case 'results-progress':
        return <ResultsProgressManagementView user={user} activeCampusId={activeCampusId} />;

      case 'quran-progress':
        return <QuranicProgressMatrixView />;

      case 'exam-results':
        return <StudentResultsView />;

      case 'announcements-events':
      case 'communication':
        return <AnnouncementsView user={user} activeCampusId={activeCampusId} />;

      case 'announcements':
        return <AnnouncementsView user={user} activeCampusId={activeCampusId} />;

      case 'incidents-medical':
      case 'incidents':
      case 'medical':
        return <IncidentsView user={user} campuses={campuses} activeCampusId={activeCampusId} />;

      case 'reports':
        return <ReportsAndAnalyticsView user={user} activeCampusId={activeCampusId} />;

      case 'campuses':
        return <CampusesView campuses={campuses} user={user} onSelectCampus={handleOpenCampusDrillDown} />;

      case 'campus-drilldown':
      case 'reports-campus':
        return (
          <CampusDrillDownView
            campusId={drillDownCampusId}
            onBack={() => setActiveTab('dashboard')}
            onOpenBranchPortal={handleStartBranchViewMode}
            onSelectStudent={handleSelectStudentProfile}
            onSelectTeacher={handleSelectTeacherProfile}
          />
        );

      case 'approval-center':
        return <ApprovalCenterView />;

      case 'portal-accounts':
      case 'student-ids':
        return <PortalAccountsView campuses={campuses} />;

      case 'storage':
      case 'storage-bucket':
      case 'documents':
        return <StorageBucketView user={user} activeCampusId={activeCampusId} />;

      case 'audit-logs':
        return <AuditCenterView />;

      case 'settings':
        return <SystemSettingsView user={user} />;

      case 'parents':
        return (
          <div className="bg-white p-6 rounded-lg border border-[#E6E2D8] shadow-xs space-y-4">
            <h3 className="font-heading font-semibold text-xl text-[#0D381E]">
              Parents & Guardians Registry
            </h3>
            <p className="text-xs text-[#57655B]">
              Registered family portal accounts linked to enrolled students.
            </p>
            <div className="divide-y divide-[#E6E2D8] text-xs">
              {IMSStateService.getParents().map((p) => (
                <div key={p.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#0D381E] text-sm">{p.fullName}</span>
                    <div className="text-[11px] text-[#57655B]">
                      Phone: <span className="font-mono">{p.phone}</span> · Email: <span className="font-mono">{p.email}</span> · CNIC/ID: <span className="font-mono">{p.cnicOrId}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                    Linked to {p.linkedStudentIds.length} Student(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <SuperAdminDashboardView
            campuses={campuses}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectCampusDrillDown={handleOpenCampusDrillDown}
            onOpenBranchPortal={handleStartBranchViewMode}
            onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)}
            user={user}
            activeCampusId={activeCampusId}
          />
        );
    }
  };

  const getPageTitle = () => {
    if (impersonation.isImpersonating) {
      return `Branch View Mode: ${impersonatedCampus.name}`;
    }
    switch (activeTab) {
      case 'dashboard':
        return user.role === 'SUPER_ADMIN' ? 'Central Administration' : 'Campus Dashboard';
      case 'campuses':
        return 'Campus Directory';
      case 'campus-drilldown':
        return 'Branch Operational Performance';
      case 'students':
        return 'Student Master Records';
      case 'student-detail':
        return 'Complete Student Historical Profile';
      case 'teachers':
        return 'Teaching Faculty Registry';
      case 'teacher-detail':
      case 'teacher-salaries':
        return 'Faculty Profile & Payroll';
      case 'parents':
        return 'Parents & Guardians Registry';
      case 'exam-results':
      case 'results':
      case 'results-progress':
      case 'quran-progress':
        return 'Results & Academic Progress';
      case 'announcements-events':
      case 'communication':
      case 'announcements':
      case 'events':
        return 'Announcements & Events';
      case 'incidents-medical':
      case 'incidents':
      case 'medical':
        return 'Incidents & Medical Records';
      case 'classes':
        return 'Classes & Halaqahs';
      case 'reports':
        return 'Institutional Reports, Analytics & Data Utilities';
      case 'finance':
      case 'finance-overview':
      case 'invoices':
        return 'Finance, Fees & Mosque Accounts';
      case 'financial-audit':
      case 'reports-financial':
        return 'Financial Audit & Treasury Reconciliations';
      case 'approval-center':
        return 'Admissions & Onboarding Approval Center';
      case 'student-ids':
      case 'portal-accounts':
        return 'Portal Accounts & User Access Governance';
      case 'audit-logs':
        return 'Immutable Security & Audit Ledger';
      case 'settings':
        return 'System Infrastructure Settings';
      default:
        return 'Misbah-ul-Quran International';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9F8F4] text-[#1A231E]">
      {/* 1. Left Sidebar Navigation (Accordion for Super Admin) */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        campuses={campuses}
        activeCampusId={activeCampusId}
        onCampusChange={handleCampusChange}
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectTab={(tabId) => {
          if (impersonation.isImpersonating) {
            IMSStateService.exitBranchImpersonation();
          }
          setActiveTab(tabId);
          setIsMobileSidebarOpen(false);
        }}
        onLogout={handleLogout}
      />

      {/* 2. Main Viewport Canvas */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* SUPER ADMIN VIEW MODE (IMPERSONATION WARNING BANNER) */}
        {impersonation.isImpersonating && (
          <div className="bg-[#E5C158] text-[#0D381E] px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold shadow-xs z-20 border-b border-[#0D381E]/20 shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-[#0D381E] shrink-0" />
              <span className="truncate">
                SUPER ADMIN VIEW MODE — Inspecting: <strong>{impersonatedCampus.name}</strong> as Campus Administrator
              </span>
            </div>
            <button
              onClick={handleExitBranchViewMode}
              className="px-3 py-1.5 rounded-lg bg-[#0D381E] text-white hover:bg-[#16532d] transition-colors cursor-pointer text-xs font-bold shrink-0 self-start sm:self-auto min-h-[36px]"
            >
              Back to Super Admin Portal
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header
          user={user}
          campuses={campuses}
          activeCampusId={activeCampusId}
          onCampusChange={handleCampusChange}
          title={getPageTitle()}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onOpenNamazModal={() => setIsNamazModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-8 bg-cream-pattern">
          <div className="max-w-7xl mx-auto w-full min-w-0">{renderContent()}</div>
        </main>
      </div>

      {/* Global Quick Search Modal (Students, Teachers, Payments) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectStudent={(studentId) => {
          setSelectedStudentId(studentId);
          setActiveTab('student-detail');
        }}
        onSelectTeacher={(teacherId) => {
          setSelectedTeacherId(teacherId);
          setActiveTab('teacher-detail');
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
        activeCampusId={activeCampusId}
      />

      {/* Security Verification & Guard Pipeline Modal */}
      <SecurityVerificationModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Edit Profile & Password Modal (Requested feature for Super Admin) */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onProfileUpdated={(msg) => {
          const updated = IMSStateService.getCurrentUser();
          if (updated) setUser({ ...updated });
        }}
      />

      {/* Prayer Timetable Modal (Retained unobtrusively via header) */}
      <NamazScheduleModal
        isOpen={isNamazModalOpen}
        onClose={() => setIsNamazModalOpen(false)}
        activeCampusId={activeCampusId}
        onCampusChange={handleCampusChange}
      />
    </div>
  );
}
