import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarCheck,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Building2,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserSession, Campus, StudentAttendanceRecord, TeacherAttendanceRecord } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StudentAttendanceAdminView } from './StudentAttendanceAdminView.tsx';
import { TeacherAttendanceAdminView } from './TeacherAttendanceAdminView.tsx';
import { PageSizeOption } from '../ui/PaginationControl.tsx';

interface AttendanceManagementViewProps {
  user: UserSession;
  activeCampusId: string;
  initialSubTab?: 'student' | 'teacher';
}

export const AttendanceManagementView: React.FC<AttendanceManagementViewProps> = ({
  user,
  activeCampusId,
  initialSubTab = 'student',
}) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isCampusAdmin = user.role === 'CAMPUS_ADMIN';
  const isTeacher = user.role === 'TEACHER';

  // Effective campus based on role permissions
  const effectiveCampus = isSuperAdmin ? activeCampusId : user.activeCampusId;
  const campuses = IMSStateService.getCampuses();

  // Active Tab state: 'student' or 'teacher'
  const [subTab, setSubTab] = useState<'student' | 'teacher'>(initialSubTab);

  // Today's date string (ISO YYYY-MM-DD)
  const todayIso = new Date().toISOString().split('T')[0];

  // Common Filters State
  const [selectedCampus, setSelectedCampus] = useState<string>(effectiveCampus);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [pageSize, setPageSize] = useState<PageSizeOption>(20);

  // Sync initialSubTab if passed from URL or parent
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Keep campus aligned when activeCampusId changes from header / switcher
  useEffect(() => {
    if (isSuperAdmin) {
      setSelectedCampus(activeCampusId);
    } else {
      setSelectedCampus(user.activeCampusId);
    }
  }, [activeCampusId, user.activeCampusId, isSuperAdmin]);

  // Reactive state from IMSStateService for real-time calculation
  const [stateVersion, setStateVersion] = useState(0);
  useEffect(() => {
    const unsub = IMSStateService.subscribe(() => {
      setStateVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  // Filtered classes available for current campus selection
  const availableClasses = useMemo(() => {
    return IMSStateService.getClasses(selectedCampus === 'all' ? undefined : selectedCampus);
  }, [selectedCampus, stateVersion]);

  // Live database-backed attendance records
  const allStudentAttendance = useMemo(() => {
    return IMSStateService.getStudentAttendance(selectedCampus === 'all' ? undefined : selectedCampus);
  }, [selectedCampus, stateVersion]);

  const allTeacherAttendance = useMemo(() => {
    return IMSStateService.getTeacherAttendance(selectedCampus === 'all' ? undefined : selectedCampus);
  }, [selectedCampus, stateVersion]);

  const allStudents = useMemo(() => {
    return IMSStateService.getStudents(selectedCampus === 'all' ? undefined : selectedCampus);
  }, [selectedCampus, stateVersion]);

  const allTeachers = useMemo(() => {
    return IMSStateService.getTeachers(selectedCampus === 'all' ? undefined : selectedCampus);
  }, [selectedCampus, stateVersion]);

  // Calculate Shared Attendance Dashboard Metrics strictly from persisted records
  const dashboardMetrics = useMemo(() => {
    // 1. Student records matching the selected date and campus
    const dayStudentRecords = allStudentAttendance.filter(
      (r) => (selectedCampus === 'all' || r.campusId === selectedCampus) && r.date === selectedDate
    );
    let studentsPresent = 0;
    let studentsAbsent = 0;
    let studentsLate = 0;

    dayStudentRecords.forEach((r) => {
      if (r.status === 'PRESENT') studentsPresent++;
      else if (r.status === 'ABSENT') studentsAbsent++;
      else if (r.status === 'LATE') studentsLate++;
    });

    // 2. Teacher records matching the selected date and campus
    const dayTeacherRecords = allTeacherAttendance.filter(
      (r) => (selectedCampus === 'all' || r.campusId === selectedCampus) && r.date === selectedDate
    );
    let teachersPresent = 0;
    let teachersAbsent = 0;
    let teachersLate = 0;

    dayTeacherRecords.forEach((r) => {
      if (r.status === 'PRESENT') teachersPresent++;
      else if (r.status === 'ABSENT') teachersAbsent++;
      else if (r.status === 'LATE') teachersLate++;
    });

    const totalLate = studentsLate + teachersLate;

    return {
      studentsPresent,
      studentsAbsent,
      studentsLate,
      teachersPresent,
      teachersAbsent,
      teachersLate,
      totalLate,
      totalStudentsEnrolled: allStudents.length,
      totalTeachersCount: allTeachers.length,
      studentRecordedCount: dayStudentRecords.length,
      teacherRecordedCount: dayTeacherRecords.length,
    };
  }, [allStudentAttendance, allTeacherAttendance, allStudents, allTeachers, selectedCampus, selectedDate]);

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* 1. Header & Institutional Overview */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E2D8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0D381E] text-[#F3D273] flex items-center justify-center font-bold shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#0D381E]">
                Unified Attendance Management
              </h2>
              <p className="text-xs text-[#57655B] mt-0.5">
                Centralized student roll-calls, faculty check-ins, automated time cutoffs, and audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="bg-[#F4F3EE] p-1.5 rounded-xl border border-[#E6E2D8] flex items-center gap-1.5 self-start lg:self-center">
          <button
            onClick={() => setSubTab('student')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'student'
                ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                : 'text-[#57655B] hover:text-[#0D381E]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Attendance</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {allStudents.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('teacher')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'teacher'
                ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                : 'text-[#57655B] hover:text-[#0D381E]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teacher Attendance</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {allTeachers.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Shared Attendance Dashboard (5 Database-Backed Summary Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Students Present Today */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
            <span>Students Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 tabular-nums">
              {dashboardMetrics.studentsPresent}
            </span>
            <span className="text-xs text-[#57655B] font-mono ml-1.5">
              / {dashboardMetrics.totalStudentsEnrolled}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 truncate">
            {dashboardMetrics.totalStudentsEnrolled > 0
              ? `${Math.round((dashboardMetrics.studentsPresent / dashboardMetrics.totalStudentsEnrolled) * 100)}% attendance rate`
              : 'On record'}
          </p>
        </div>

        {/* Card 2: Students Absent Today */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800 text-[11px] font-bold uppercase tracking-wider">
            <span>Students Absent</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-700 tabular-nums">
              {dashboardMetrics.studentsAbsent}
            </span>
          </div>
          <p className="text-[11px] text-rose-700/80 truncate">
            Marked absent on {selectedDate}
          </p>
        </div>

        {/* Card 3: Teachers Present Today */}
        <div className="bg-white p-4 rounded-xl border border-teal-200 bg-teal-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-800 text-[11px] font-bold uppercase tracking-wider">
            <span>Teachers Present</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-teal-700 tabular-nums">
              {dashboardMetrics.teachersPresent}
            </span>
            <span className="text-xs text-[#57655B] font-mono ml-1.5">
              / {dashboardMetrics.totalTeachersCount}
            </span>
          </div>
          <p className="text-[11px] text-teal-700/80 truncate">
            Faculty on duty
          </p>
        </div>

        {/* Card 4: Teachers Absent Today */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase tracking-wider">
            <span>Teachers Absent</span>
            <XCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 tabular-nums">
              {dashboardMetrics.teachersAbsent}
            </span>
          </div>
          <p className="text-[11px] text-amber-700/80 truncate">
            Absent or past 5:30 cutoff
          </p>
        </div>

        {/* Card 5: Late Arrivals Today (Students + Teachers) */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] bg-[#F9F8F4] shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#0D381E] text-[11px] font-bold uppercase tracking-wider">
            <span>Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#0D381E] tabular-nums">
              {dashboardMetrics.totalLate}
            </span>
          </div>
          <p className="text-[11px] text-[#57655B] truncate">
            {dashboardMetrics.studentsLate} student(s) · {dashboardMetrics.teachersLate} teacher(s)
          </p>
        </div>
      </div>

      {/* 3. Common Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0D381E]">
            <Filter className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Attendance Filter Dashboard</span>
          </div>
          <div className="text-[11px] text-[#57655B]">
            Showing records for date: <strong className="font-mono text-[#0D381E]">{selectedDate}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* 1. Campus Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#57655B] mb-1">
              Campus / Branch
            </label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              disabled={!isSuperAdmin}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs font-semibold focus:border-[#0D381E] focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSuperAdmin && <option value="all">All Campuses (Combined)</option>}
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Date Picker */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#57655B] mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs font-mono font-bold text-[#0D381E] focus:border-[#0D381E] focus:outline-none cursor-pointer"
            />
          </div>

          {/* 3. Class Filter (Student Attendance Tab Only) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#57655B] mb-1">
              Class Halaqah {subTab !== 'student' && '(Students Only)'}
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={subTab !== 'student'}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs font-semibold focus:border-[#0D381E] focus:outline-none disabled:opacity-50"
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Search Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#57655B] mb-1">
              Search Name or ID
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57655B]" />
              <input
                type="text"
                placeholder={subTab === 'student' ? 'Student name or ID...' : 'Teacher name or code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs focus:border-[#0D381E] focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#57655B] mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs font-semibold focus:border-[#0D381E] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late Arrival</option>
              <option value="ABSENT">Absent</option>
              {subTab === 'student' && <option value="EXCUSED">Excused</option>}
            </select>
          </div>

          {/* 6. Records Per Page (20, 50, 100, 500) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#57655B] mb-1">
              Records Per Page
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as PageSizeOption)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs font-semibold focus:border-[#0D381E] focus:outline-none"
            >
              <option value={20}>20 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
              <option value={500}>500 records</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Active Tab Content (Student Attendance or Teacher Attendance) */}
      <div className="transition-all">
        {subTab === 'student' ? (
          <StudentAttendanceAdminView
            user={user}
            activeCampusId={selectedCampus}
            initialDate={selectedDate}
            initialClassId={selectedClassId}
            initialSearchQuery={searchQuery}
            initialStatusFilter={statusFilter}
            initialPageSize={pageSize}
          />
        ) : (
          <TeacherAttendanceAdminView
            user={user}
            activeCampusId={selectedCampus}
            initialDate={selectedDate}
            initialSearchQuery={searchQuery}
            initialStatusFilter={statusFilter}
            initialPageSize={pageSize}
          />
        )}
      </div>
    </div>
  );
};
