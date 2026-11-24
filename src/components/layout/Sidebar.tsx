import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  Bell,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  UserCheck,
  Award,
  ShieldCheck,
  DollarSign,
  KeyRound,
  FileSpreadsheet,
  BarChart3,
  X,
  MoreHorizontal,
  HardDrive,
} from 'lucide-react';
import { UserRole, UserSession, Campus } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';

interface SidebarProps {
  user: UserSession;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout: () => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
  campuses?: Campus[];
  activeCampusId?: string;
  onCampusChange?: (campusId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onLogout,
  isOpenOnMobile = false,
  onCloseMobile,
  campuses = [],
  activeCampusId = 'all',
  onCampusChange,
}) => {
  const pendingAdmissions = IMSStateService.getPendingAdmissions().filter((a) => a.status === 'PENDING_APPROVAL');
  const pendingTeachers = IMSStateService.getPendingTeachers().filter((t) => t.status === 'PENDING_APPROVAL');
  const totalPending = pendingAdmissions.length + pendingTeachers.length;

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  // Super Admin Navigation - Clean & Standardized
  const superAdminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'announcements-events', label: 'Announcements & Events', icon: Bell },
    { id: 'incidents-medical', label: 'Incidents & Medical', icon: AlertTriangle },
    { id: 'storage', label: 'Storage Bucket', icon: HardDrive },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings, badge: totalPending },
  ];

  // Campus Admin Navigation - Clean & Scoped
  const campusAdminItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'announcements-events', label: 'Announcements & Events', icon: Bell },
    { id: 'incidents-medical', label: 'Incidents & Medical', icon: AlertTriangle },
    { id: 'storage', label: 'Storage Bucket', icon: HardDrive },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Simplified Teacher Navigation (Clear, non-overloaded daily workflows)
  const teacherItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'my-classes', label: 'My Classes', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  // Simplified Parent Navigation (Clear family overview for all literacy levels)
  const parentItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'my-children', label: 'My Children', icon: GraduationCap },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'fees', label: 'Fees', icon: CreditCard },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  const getRoleTitle = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'CAMPUS_ADMIN':
        return 'Campus Admin';
      case 'TEACHER':
        return 'Teacher';
      case 'PARENT':
        return 'Parent Portal';
      default:
        return 'Authorized Staff';
    }
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0D381E] text-white flex flex-col h-screen shrink-0 border-r border-[#072212] select-none transition-transform duration-200 ease-in-out ${
          isOpenOnMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#16532d]/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#E5C158] flex items-center justify-center text-[#0D381E] shadow-sm font-display font-bold text-lg shrink-0">
              MQ
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading font-semibold text-base tracking-wide text-[#F3D273] truncate leading-tight">
                Misbah-ul-Quran
              </h1>
              <p className="text-[10px] tracking-widest uppercase text-[#E6E2D8]/70 font-medium">
                International IMS
              </p>
            </div>
          </div>

          {/* Mobile/Tablet Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role Header */}
        <div className="px-4 py-2.5 border-b border-[#16532d]/25 bg-[#072212]/30 flex items-center justify-between">
          <div className="truncate">
            <span className="text-[11px] font-semibold text-[#E5C158] flex items-center space-x-1">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="truncate">{getRoleTitle()}</span>
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-white/10 text-white/80">
            {user.role}
          </span>
        </div>

        {/* Mobile & Tablet Branch Switcher for Super Admin */}
        {user.role === 'SUPER_ADMIN' && onCampusChange && campuses.length > 0 && (
          <div className="px-3 py-2 border-b border-[#16532d]/30 bg-[#072212]/50">
            <label className="block text-[10px] uppercase font-bold text-[#E5C158] tracking-wider mb-1 flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-[#E5C158]" />
              <span>Active Branch</span>
            </label>
            <select
              value={activeCampusId}
              onChange={(e) => onCampusChange(e.target.value)}
              className="w-full bg-[#16532d] text-[#F3D273] text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-[#E5C158]/40 focus:outline-none focus:ring-1 focus:ring-[#E5C158] cursor-pointer"
            >
              <option value="all">All Branches (Global)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currencyCode})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {user.role === 'SUPER_ADMIN' ? (
            superAdminNavItems.map((item) => {
              const Icon = item.icon;
              // Map related or alias tab states to keep active indicator smooth
              const isActive =
                activeTab === item.id ||
                (item.id === 'students' && activeTab === 'student-detail') ||
                (item.id === 'teachers' && activeTab === 'teacher-detail') ||
                (item.id === 'attendance' && ['student-attendance', 'teacher-attendance'].includes(activeTab)) ||
                (item.id === 'finance' && ['finance-overview', 'payments', 'invoices', 'teacher-salaries', 'financial-audit'].includes(activeTab)) ||
                (item.id === 'results' && ['results', 'results-progress', 'quran-progress', 'exam-results'].includes(activeTab)) ||
                (item.id === 'announcements-events' && ['announcements-events', 'communication', 'announcements', 'events'].includes(activeTab)) ||
                (item.id === 'incidents-medical' && ['incidents-medical', 'incidents', 'medical'].includes(activeTab)) ||
                (item.id === 'settings' && ['campuses', 'campus-drilldown', 'portal-accounts', 'approval-center', 'audit-logs'].includes(activeTab));

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#16532d] text-[#F3D273] font-bold shadow-xs border-l-4 border-[#E5C158]'
                      : 'text-white/80 hover:bg-[#124827]/60 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E5C158]' : 'text-white/60'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5C158] text-[#0D381E] tabular-nums shrink-0 ml-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })
          ) : user.role === 'CAMPUS_ADMIN' ? (
            campusAdminItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'students' && activeTab === 'student-detail') ||
                (item.id === 'teachers' && activeTab === 'teacher-detail') ||
                (item.id === 'attendance' && ['student-attendance', 'teacher-attendance'].includes(activeTab)) ||
                (item.id === 'finance' && ['payments', 'invoices'].includes(activeTab)) ||
                (item.id === 'results' && ['results', 'results-progress', 'quran-progress', 'exam-results'].includes(activeTab)) ||
                (item.id === 'announcements-events' && ['announcements-events', 'communication', 'announcements', 'events'].includes(activeTab)) ||
                (item.id === 'incidents-medical' && ['incidents-medical', 'incidents', 'medical'].includes(activeTab));
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#16532d] text-[#F3D273] font-bold border-l-4 border-[#E5C158] shadow-xs'
                      : 'text-white/80 hover:bg-[#124827]/60 hover:text-white font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E5C158]' : 'text-white/60'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })
          ) : user.role === 'TEACHER' ? (
            teacherItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'attendance' && ['attendance', 'student-attendance'].includes(activeTab)) ||
                (item.id === 'results' && ['results', 'student-progress', 'quran'].includes(activeTab)) ||
                (item.id === 'more' && ['more', 'teaching-materials', 'announcements-events', 'communication', 'incidents-medical', 'incidents', 'medical', 'my-attendance', 'profile'].includes(activeTab));
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#16532d] text-[#F3D273] font-bold border-l-4 border-[#E5C158] shadow-xs'
                      : 'text-white/80 hover:bg-[#124827]/60 hover:text-white font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E5C158]' : 'text-white/60'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })
          ) : (
            parentItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'my-children' && ['my-children', 'overview'].includes(activeTab)) ||
                (item.id === 'results' && ['results', 'progress', 'quranic-progress'].includes(activeTab)) ||
                (item.id === 'more' && ['more', 'documents', 'materials', 'teaching-materials', 'announcements-events', 'announcements', 'notifications', 'profile'].includes(activeTab));
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#16532d] text-[#F3D273] font-bold border-l-4 border-[#E5C158] shadow-xs'
                      : 'text-white/80 hover:bg-[#124827]/60 hover:text-white font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E5C158]' : 'text-white/60'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })
          )}
        </div>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-[#16532d]/40 bg-[#072212]/40">
        <div className="flex items-center space-x-2.5 mb-2.5">
          <div className="w-7 h-7 rounded-full bg-[#16532d] border border-[#E5C158]/50 flex items-center justify-center text-[11px] font-semibold text-[#E5C158]">
            {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{user.fullName}</p>
            <p className="text-[10px] text-white/50 truncate font-mono">{user.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded text-[11px] text-white/70 hover:text-red-300 hover:bg-red-950/40 border border-white/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3 h-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  </>
  );
};
