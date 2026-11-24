import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  ChevronDown,
  Bell,
  LogOut,
  Search,
  Menu,
  Clock,
  Heart,
  Sparkles,
} from 'lucide-react';
import { Campus, UserSession } from '../../types/ims.ts';
import { getDualBranchNamazTimes } from '../../utils/prayerTimes.ts';

interface HeaderProps {
  user: UserSession;
  campuses: Campus[];
  activeCampusId: string;
  onCampusChange: (campusId: string) => void;
  title?: string;
  subtitle?: string;
  onOpenSecurityModal: () => void;
  onOpenEditProfileModal?: () => void;
  onLogout: () => void;
  onOpenSearchModal?: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenNamazModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  campuses,
  activeCampusId,
  onCampusChange,
  onOpenSecurityModal,
  onLogout,
  onOpenSearchModal,
  onToggleMobileSidebar,
  onOpenNamazModal,
}) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const [dualNamaz, setDualNamaz] = useState(() => getDualBranchNamazTimes());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Update namaz times every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDualNamaz(getDualBranchNamazTimes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleDisplayName = () => {
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
        return 'Portal User';
    }
  };

  const getCampusDisplayName = () => {
    if (activeCampusId === 'uk') return 'Viewing: UK Campus (GBP £ · Europe/London)';
    if (activeCampusId === 'kts') return 'Viewing: KTS Pakistan Campus (PKR Rs. · Asia/Karachi)';
    if (user.activeCampusId === 'uk') return 'Viewing: UK Campus (GBP £ · Europe/London)';
    if (user.activeCampusId === 'kts') return 'Viewing: KTS Pakistan Campus (PKR Rs. · Asia/Karachi)';
    return 'Viewing: All Campuses (Consolidated Multi-Currency)';
  };

  return (
    <header className="h-16 sm:h-18 bg-white border-b border-[#E6E2D8] px-2.5 sm:px-6 md:px-8 flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] z-30 min-w-0">
      {/* 1. Left: Mobile/Tablet Toggle + Official Crest + Title + Role / Campus Subtitle */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {/* Mobile/Tablet Sidebar Hamburger Toggle */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#0D381E] border border-[#E6E2D8] cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Toggle Navigation Menu"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Crest */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0D381E] border-2 border-[#E5C158] flex items-center justify-center text-[#E5C158] font-heading font-bold text-xs sm:text-sm shadow-xs shrink-0 select-none">
          MQ
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <h1 className="font-heading font-extrabold text-xs sm:text-base md:text-lg text-[#0D381E] tracking-wide leading-tight truncate">
              MISBAH-UL-QURAN
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0D381E]/10 text-[#0D381E] border border-[#0D381E]/20 shrink-0">
              IMS
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] sm:text-xs truncate">
            <span className="font-semibold text-emerald-800 text-[10px] sm:text-xs truncate">{getRoleDisplayName()}</span>
            <span className="text-[#57655B] hidden sm:inline">·</span>
            <span className="text-[#57655B] truncate text-[10px] sm:text-xs hidden sm:inline">
              {getCampusDisplayName()}
            </span>
          </div>
        </div>

        {/* Inline Branch Switcher for Super Admin */}
        {isSuperAdmin && (
          <div className="hidden xl:flex items-center ml-3 pl-3 border-l border-[#E6E2D8]">
            <div className="flex items-center space-x-1.5 bg-[#F9F8F4] hover:bg-[#F0EFEA] border border-[#E6E2D8] rounded-lg px-2.5 py-1 text-xs transition-colors">
              <Building2 className="w-3.5 h-3.5 text-[#0D381E]" />
              <select
                value={activeCampusId}
                onChange={(e) => onCampusChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#0D381E] focus:outline-none cursor-pointer pr-1"
                title="Filter views by Campus"
              >
                <option value="all">All Branches (Global)</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.currencyCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Right: Discreet Prayer Time Indicator + Quick Search + Notification Bell + User Profile */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0" ref={profileMenuRef}>
        {/* Subtle, unobtrusive prayer time badge */}
        {onOpenNamazModal && (
          <button
            onClick={onOpenNamazModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#0D381E] border border-[#E6E2D8] transition-all cursor-pointer text-xs font-medium shadow-2xs min-h-[38px]"
            title="View prayer timetable"
          >
            <Clock className="w-3.5 h-3.5 text-[#0D381E] shrink-0" />
            <span className="hidden sm:inline font-mono">
              {activeCampusId === 'kts'
                ? `Haripur: ${dualNamaz.pk.nextPrayer} ${dualNamaz.pk.nextPrayerTime}`
                : `London: ${dualNamaz.uk.nextPrayer} ${dualNamaz.uk.nextPrayerTime}`}
            </span>
            <span className="sm:hidden font-mono text-[11px]">
              {activeCampusId === 'kts' ? dualNamaz.pk.nextPrayer : dualNamaz.uk.nextPrayer}
            </span>
          </button>
        )}

        {/* Global Search Button */}
        {onOpenSearchModal && (
          <button
            onClick={onOpenSearchModal}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#F9F8F4] hover:bg-[#0D381E] text-[#0D381E] hover:text-[#F3D273] border border-[#E6E2D8] hover:border-[#0D381E] transition-all cursor-pointer text-xs font-semibold shadow-2xs group min-h-[38px]"
            title="Search Students, Teachers, Payments (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#0D381E] group-hover:text-[#E5C158] transition-colors shrink-0" />
            <span className="hidden xl:inline">Search</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#E6E2D8] bg-[#F9F8F4] hover:bg-[#E6E2D8] flex items-center justify-center text-[#0D381E] transition-colors cursor-pointer relative"
            title="Institute Notifications & System Status"
          >
            <Bell className="w-4 h-4 text-[#57655B]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600"></span>
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-[#E6E2D8] p-3 text-xs z-50 animate-in fade-in">
              <div className="font-bold text-[#0D381E] border-b border-[#E6E2D8] pb-1.5 mb-2 flex justify-between items-center">
                <span>Madrasa Notices</span>
                <span className="text-[10px] text-emerald-700">All Branches Synced</span>
              </div>
              <div className="space-y-2 text-[#57655B]">
                <div className="p-2 bg-[#F9F8F4] rounded-lg border border-[#E6E2D8]">
                  <span className="font-semibold text-[#0D381E] block">Daily Attendance Synced</span>
                  <span className="text-[10px]">Roll calls recorded for UK & Pakistan branches.</span>
                </div>
                <div className="p-2 bg-[#F9F8F4] rounded-lg border border-[#E6E2D8]">
                  <span className="font-semibold text-[#0D381E] block">Quran Sabaq Matrix Up-to-date</span>
                  <span className="text-[10px]">Hifz records logged by Qaris today.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Professional User Profile Button */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-1.5 sm:space-x-2 p-1 sm:pl-3 sm:pr-2.5 sm:py-1.5 rounded-full border border-[#E6E2D8] bg-white hover:border-[#0D381E]/40 hover:bg-[#FDFCF9] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-xs transition-all duration-150 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#0D381E]/15 min-h-[38px]"
            title={`Account: ${user.fullName}`}
            aria-label={`User profile menu for ${user.fullName}`}
          >
            {/* User Name (hidden on small phone screens to prevent header overflow) */}
            <span className="hidden sm:inline text-xs font-semibold text-[#1A231E] group-hover:text-[#0D381E] tracking-tight truncate max-w-[120px] md:max-w-none">
              {user.fullName}
            </span>

            {/* Professional Avatar with Initials */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0D381E] border border-[#E5C158]/50 flex items-center justify-center text-[#E5C158] font-bold text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform select-none">
              {user.fullName
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-[#57655B] group-hover:text-[#0D381E] transition-colors shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-[#E6E2D8] py-2 z-50 animate-in fade-in text-xs">
              <div className="px-4 py-2.5 border-b border-[#E6E2D8] bg-[#F9F8F4]/70">
                <p className="font-bold text-[#0D381E] text-sm">{user.fullName}</p>
                <p className="text-[11px] text-[#57655B] font-mono truncate">{user.email}</p>
                <p className="text-[10px] text-[#57655B] font-mono mt-0.5">ID: {user.username}</p>
              </div>

              {/* Next Namaz Times Widget inside menu */}
              <div className="px-4 py-2.5 bg-[#F9F8F4]/80 border-b border-[#E6E2D8]">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#0D381E] uppercase tracking-wider mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0D381E]" />
                  <span>Next Namaz Times</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded-lg border border-[#E6E2D8] shadow-2xs">
                    <div className="text-[10px] font-bold text-sky-800 flex items-center justify-between">
                      <span>🇬🇧 UK</span>
                      <span className="text-[9px] font-mono text-[#57655B]">{dualNamaz.uk.currentTimeStr}</span>
                    </div>
                    <div className="font-bold text-[#0D381E] text-xs mt-0.5">{dualNamaz.uk.nextPrayer}</div>
                    <div className="text-[11px] text-[#57655B] font-mono">{dualNamaz.uk.nextPrayerTime}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#E6E2D8] shadow-2xs">
                    <div className="text-[10px] font-bold text-emerald-800 flex items-center justify-between">
                      <span>🇵🇰 PK</span>
                      <span className="text-[9px] font-mono text-[#57655B]">{dualNamaz.pk.currentTimeStr}</span>
                    </div>
                    <div className="font-bold text-[#0D381E] text-xs mt-0.5">{dualNamaz.pk.nextPrayer}</div>
                    <div className="text-[11px] text-[#57655B] font-mono">{dualNamaz.pk.nextPrayerTime}</div>
                  </div>
                </div>
              </div>

              {/* Security Isolation Status */}
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenSecurityModal();
                }}
                className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-[#57655B] hover:bg-[#F9F8F4] hover:text-[#0D381E] transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Security Guards & System Status</span>
              </button>

              <div className="border-t border-[#E6E2D8] my-1"></div>

              {/* Sign Out */}
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center space-x-2.5 px-4 py-2 text-left text-rose-700 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

