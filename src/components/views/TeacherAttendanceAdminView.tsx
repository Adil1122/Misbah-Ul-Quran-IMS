import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Download,
  CheckCircle2,
  X,
  Eye,
  Plus,
  Edit2,
  History,
  ShieldCheck,
  Clock,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  UserSession,
  TeacherAttendanceStatus,
  TeacherAttendanceRecord,
} from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { PaginationControl, PageSizeOption } from '../ui/PaginationControl.tsx';
import {
  evaluateTeacherAttendanceTimeRule,
  getCampusCurrentTime,
  formatTime12h,
  TEACHER_ATTENDANCE_TEST_PRESETS,
} from '../../utils/teacherAttendanceRules.ts';

interface TeacherAttendanceAdminViewProps {
  user: UserSession;
  activeCampusId: string;
  initialDate?: string;
  initialSearchQuery?: string;
  initialStatusFilter?: string;
  initialPageSize?: PageSizeOption;
}

export const TeacherAttendanceAdminView: React.FC<TeacherAttendanceAdminViewProps> = ({
  user,
  activeCampusId,
  initialDate,
  initialSearchQuery = '',
  initialStatusFilter = 'ALL',
  initialPageSize = 20,
}) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isCampusAdmin = user.role === 'CAMPUS_ADMIN';
  const isTeacher = user.role === 'TEACHER';

  const effectiveCampus = isSuperAdmin ? activeCampusId : user.activeCampusId;
  const campuses = IMSStateService.getCampuses();

  // Filters state
  const [campusFilter, setCampusFilter] = useState<string>(effectiveCampus);
  const [searchPerson, setSearchPerson] = useState<string>(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [startDate, setStartDate] = useState<string>(initialDate || '');
  const [endDate, setEndDate] = useState<string>(initialDate || '');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(initialPageSize);

  // Sync props when updated from parent shared dashboard
  useEffect(() => {
    if (activeCampusId) setCampusFilter(isSuperAdmin ? activeCampusId : user.activeCampusId);
  }, [activeCampusId, isSuperAdmin, user.activeCampusId]);

  useEffect(() => {
    if (initialDate) {
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) setSearchPerson(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialStatusFilter !== undefined) setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialPageSize) setPageSize(initialPageSize);
  }, [initialPageSize]);

  const campusObj = useMemo(() => {
    const targetId = campusFilter === 'all' ? effectiveCampus : campusFilter;
    return campuses.find((c) => c.id === targetId) || campuses[0];
  }, [campuses, campusFilter, effectiveCampus]);

  const timezone = useMemo(() => {
    return campusObj?.timezone || (effectiveCampus === 'uk' ? 'Europe/London' : 'Asia/Karachi');
  }, [campusObj, effectiveCampus]);

  const teachers = useMemo(() => {
    return IMSStateService.getTeachers(campusFilter === 'all' ? undefined : campusFilter);
  }, [campusFilter]);

  // Live campus clock
  const [liveClock, setLiveClock] = useState(() => getCampusCurrentTime(timezone));

  // Simulation / Testing clock mode (to easily test 5:00:00 PM, 5:00:01 PM, 5:30:00 PM, 5:30:01 PM)
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [simulatedTime, setSimulatedTime] = useState<string>('16:45:00');

  // Effective time for attendance rule determination
  const effectiveTime = isSimulatedMode ? simulatedTime : liveClock.timeStr;
  const currentRule = useMemo(
    () => evaluateTeacherAttendanceTimeRule(effectiveTime),
    [effectiveTime]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(getCampusCurrentTime(timezone));
    }, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  // Selected record for Full History Modal
  const [selectedTeacherRecord, setSelectedTeacherRecord] = useState<TeacherAttendanceRecord | null>(null);

  // Mark/Record Attendance Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordTeacherId, setRecordTeacherId] = useState<string>(teachers[0]?.id || '');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordStatus, setRecordStatus] = useState<TeacherAttendanceStatus>(currentRule.defaultStatus);
  const [recordCheckIn, setRecordCheckIn] = useState<string>(effectiveTime.substring(0, 5));
  const [recordCheckOut, setRecordCheckOut] = useState<string>('19:30');
  const [recordRemarks, setRecordRemarks] = useState<string>('');

  // When opening modal or when effective time changes, align default status to permitted choices
  useEffect(() => {
    if (!currentRule.allowedStatuses.includes(recordStatus)) {
      setRecordStatus(currentRule.defaultStatus);
    }
  }, [currentRule, recordStatus]);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<TeacherAttendanceRecord | null>(null);
  const [newCorrectedStatus, setNewCorrectedStatus] = useState<TeacherAttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  const [feedback, setFeedback] = useState<string>('');

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  };

  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  // Get teacher attendance records
  const allTeacherAttendance = IMSStateService.getTeacherAttendance(
    campusFilter === 'all' ? undefined : campusFilter
  );

  // Filter attendance records
  const filteredRecords = useMemo(() => {
    return allTeacherAttendance.filter((rec) => {
      if (isTeacher && user.teacherProfileId && rec.teacherId !== user.teacherProfileId) {
        return false;
      }
      if (campusFilter !== 'all' && rec.campusId !== campusFilter) return false;
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
      if (startDate && rec.date < startDate) return false;
      if (endDate && rec.date > endDate) return false;
      if (searchPerson.trim()) {
        const q = searchPerson.toLowerCase();
        const matchName = rec.teacherName.toLowerCase().includes(q);
        const matchCode = rec.teacherCode?.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [
    allTeacherAttendance,
    campusFilter,
    statusFilter,
    startDate,
    endDate,
    searchPerson,
    isTeacher,
    user.teacherProfileId,
  ]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Chronological history for the selected teacher (newest first)
  const teacherFullHistory = useMemo(() => {
    if (!selectedTeacherRecord) return [];
    return allTeacherAttendance
      .filter((a) => a.teacherId === selectedTeacherRecord.teacherId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedTeacherRecord, allTeacherAttendance]);

  // Administrative authority
  const canManage = isSuperAdmin || isCampusAdmin || isTeacher;

  const handleOpenRecordModal = (teacherId?: string) => {
    if (teacherId) setRecordTeacherId(teacherId);
    setRecordCheckIn(effectiveTime.substring(0, 5));
    setRecordStatus(currentRule.defaultStatus);
    setIsRecordModalOpen(true);
  };

  const handleSaveNewAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTeacherId) return;

    const teacher = teachers.find((t) => t.id === recordTeacherId);
    if (!teacher) return;

    try {
      IMSStateService.recordTeacherAttendance({
        teacherId: teacher.id,
        campusId: teacher.campusId,
        date: recordDate,
        status: recordStatus,
        checkInTime: effectiveTime,
        checkOutTime: recordCheckOut,
        remarks: recordRemarks.trim() || undefined,
        isSystemGenerated: currentRule.isAutoAbsent,
      });

      showToast(
        `✓ Attendance for ${teacher.fullName} saved as ${recordStatus} (${currentRule.windowLabel}).`
      );
      setIsRecordModalOpen(false);
      setRecordRemarks('');
    } catch (err: any) {
      showToast(err.message || 'Unable to save teacher attendance. Status rejected by rules engine.');
    }
  };

  const handleOpenCorrection = (record: TeacherAttendanceRecord) => {
    setCorrectionTarget(record);
    setNewCorrectedStatus(record.status);
    setCorrectionReason('');
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget) return;

    try {
      IMSStateService.updateTeacherAttendance(
        correctionTarget.id,
        newCorrectedStatus,
        correctionReason.trim() || 'Verified correction by authorized campus administrator'
      );
      showToast(
        `✓ Teacher attendance status updated to ${newCorrectedStatus} with audit trail.`
      );
      setCorrectionTarget(null);
      setCorrectionReason('');
    } catch {
      showToast('Unable to save correction.');
    }
  };

  const handleExportCSV = () => {
    const header =
      'Date,Teacher Code,Teacher Name,Campus,Arrival / Check In,Status,Rule Window,Recorded By,Last Updated\n';
    const rows = filteredRecords.map((r) => {
      return `"${r.date}","${r.teacherCode}","${r.teacherName}","${r.campusId.toUpperCase()}","${r.checkInTime || 'N/A'}","${r.status}","${r.ruleApplied || 'STANDARD'}","${r.recordedBy}","${r.updatedAt || r.date}"`;
    });
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Teacher_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ Teacher attendance exported to CSV successfully.');
  };

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Header & Strict Rules Summary Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#0D381E]">
              Teacher Attendance & Check-In
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0D381E]/10 text-[#0D381E]">
              Strict Time-Window Protocol
            </span>
          </div>
          <p className="text-xs text-[#57655B] mt-0.5">
            Campus Timezone: <strong>{timezone}</strong> · Punctuality thresholds automatically govern permitted status choices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              onClick={() => handleOpenRecordModal()}
              className="px-3.5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Teacher Attendance</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] border border-[#E6E2D8] text-[#0D381E] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* TIME-RULE ENGINE BAR & TEST TIME SIMULATOR */}
      <div className="bg-[#0D381E] text-white p-4 rounded-xl border border-[#072212] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Live Clock / Active Rule Indicator */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#E5C158] text-[#0D381E] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F3D273]">
                  {isSimulatedMode ? 'Simulated Testing Clock' : 'Current Campus Time'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
                  {formatTime12h(effectiveTime)}
                </span>
              </div>
              <p className="text-xs text-[#E6E2D8] mt-0.5">
                Active Rule Window: <strong className="text-[#F3D273]">{currentRule.windowLabel}</strong>
              </p>
            </div>
          </div>

          {/* Permitted Status Badges for current time */}
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-xl text-xs">
            <span className="text-[11px] text-[#E6E2D8] font-medium">Permitted Statuses:</span>
            {currentRule.allowedStatuses.map((st) => (
              <span
                key={st}
                className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              >
                ✓ {st}
              </span>
            ))}
            {currentRule.disallowedStatuses.map((st) => (
              <span
                key={st}
                className="px-2 py-0.5 rounded font-bold text-[11px] bg-rose-500/20 text-rose-300 line-through opacity-70"
                title={`${st} is prohibited during this time window`}
              >
                ✕ {st}
              </span>
            ))}
          </div>
        </div>

        {/* Interactive Simulation Controls for Testers and Evaluators */}
        <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[#E6E2D8]/80 font-bold">Rule Test Presets:</span>
            {TEACHER_ATTENDANCE_TEST_PRESETS.map((preset) => (
              <button
                key={preset.timeStr}
                onClick={() => {
                  setIsSimulatedMode(true);
                  setSimulatedTime(preset.timeStr);
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold cursor-pointer transition-all ${
                  isSimulatedMode && simulatedTime === preset.timeStr
                    ? 'bg-[#E5C158] text-[#0D381E] shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={`Test with arrival time ${preset.timeStr} (${preset.expected})`}
              >
                {preset.label.split(' ')[0]} ({preset.expected})
              </button>
            ))}

            {isSimulatedMode && (
              <button
                onClick={() => setIsSimulatedMode(false)}
                className="px-2 py-1 rounded text-[11px] font-bold bg-rose-500/30 hover:bg-rose-500/50 text-white cursor-pointer flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Live Time</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-[#E6E2D8]/70 italic">
            {currentRule.ruleExplanation}
          </div>
        </div>
      </div>

      {/* FILTER BAR & RECORDS PER PAGE */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57655B]" />
            <input
              type="text"
              placeholder="Search teacher name or employee ID..."
              value={searchPerson}
              onChange={(e) => handleFilterChange(setSearchPerson, e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-hidden focus:border-[#0D381E]"
            />
          </div>

          {/* Campus Filter (Super Admin) */}
          {isSuperAdmin && (
            <div>
              <select
                value={campusFilter}
                onChange={(e) => handleFilterChange(setCampusFilter, e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-medium focus:outline-hidden focus:border-[#0D381E]"
              >
                <option value="all">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-medium focus:outline-hidden focus:border-[#0D381E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-1.5 lg:col-span-2">
            <label className="text-[11px] text-[#57655B] font-medium whitespace-nowrap">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
              className="w-full px-2 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono focus:outline-hidden focus:border-[#0D381E]"
              title="Filter Start Date"
            />
            <label className="text-[11px] text-[#57655B] font-medium whitespace-nowrap">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
              className="w-full px-2 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono focus:outline-hidden focus:border-[#0D381E]"
              title="Filter End Date"
            />
          </div>
        </div>

        {/* Top Pagination Bar with 20 | 50 | 100 | 500 selector */}
        <PaginationControl
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={filteredRecords.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          showTopBar={true}
          itemName="teacher attendance records"
        />
      </div>

      {/* TEACHER ATTENDANCE TABLE */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                <th className="py-3 px-3 font-semibold">Teacher Name</th>
                <th className="py-3 px-3 font-semibold">Teacher ID</th>
                <th className="py-3 px-3 font-semibold">Assigned Campus</th>
                <th className="py-3 px-3 font-semibold">Attendance Date</th>
                <th className="py-3 px-3 font-semibold">Arrival / Marking Time</th>
                <th className="py-3 px-3 font-semibold">Attendance Status</th>
                <th className="py-3 px-3 font-semibold">Recorded By</th>
                <th className="py-3 px-3 font-semibold">Last Updated</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#57655B]">
                    No teacher attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const campusItem = campuses.find((c) => c.id === r.campusId);

                  return (
                    <tr key={r.id} className="hover:bg-[#F9F8F4] transition-colors">
                      {/* Teacher Name */}
                      <td className="py-3 px-3 font-bold text-[#1A231E]">
                        {r.teacherName}
                        {r.remarks && (
                          <div className="text-[10px] text-[#57655B] font-normal italic truncate max-w-xs">
                            {r.remarks}
                          </div>
                        )}
                      </td>

                      {/* Teacher ID */}
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#0D381E] whitespace-nowrap">
                        {r.teacherCode}
                      </td>

                      {/* Assigned Campus */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E] border border-[#E6E2D8]">
                          {campusItem?.name || r.campusId.toUpperCase()}
                        </span>
                      </td>

                      {/* Attendance Date */}
                      <td className="py-3 px-3 font-mono font-bold text-[#0D381E] whitespace-nowrap">
                        {r.date}
                      </td>

                      {/* Arrival / Marking Time */}
                      <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                        {r.checkInTime ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {formatTime12h(r.checkInTime)}
                          </span>
                        ) : (
                          <span className="text-[#57655B]/60 italic">—</span>
                        )}
                      </td>

                      {/* Attendance Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <StatusBadge status={r.status} />
                          {r.isSystemGenerated && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                              System Auto
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recorded By */}
                      <td className="py-3 px-3 text-[#57655B] whitespace-nowrap">
                        {r.recordedBy}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-3 text-[#57655B] font-mono text-[11px] whitespace-nowrap">
                        {r.updatedAt ? r.updatedAt.replace('T', ' ').substring(0, 16) : r.date}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedTeacherRecord(r)}
                            className="px-2.5 py-1 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-semibold flex items-center space-x-1 cursor-pointer shadow-2xs"
                            title="View chronological attendance record for teacher"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>History</span>
                          </button>

                          {(isSuperAdmin || isCampusAdmin) && (
                            <button
                              onClick={() => handleOpenCorrection(r)}
                              className="px-2 py-1 rounded-lg bg-[#F4F3EE] hover:bg-[#E6E2D8] border border-[#D8D2C5] text-[#0D381E] text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                              title="Authorized administrative correction with audit trail"
                            >
                              <Edit2 className="w-3 h-3 text-emerald-800" />
                              <span className="hidden sm:inline">Correct</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Control */}
        <PaginationControl
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={filteredRecords.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="teacher attendance records"
          className="border-t border-[#E6E2D8] rounded-none rounded-b-xl"
        />
      </div>

      {/* RECORD TEACHER ATTENDANCE MODAL (Enforces strict time-window choices) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Record Teacher Attendance
                </h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAttendance} className="p-5 space-y-3.5 text-xs">
              {/* Teacher selector */}
              <div>
                <label className="block font-bold text-[#0D381E] mb-1">Select Teacher:</label>
                <select
                  value={recordTeacherId}
                  onChange={(e) => setRecordTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#0D381E]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Date:</label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-[#0D381E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Arrival Time:</label>
                  <div className="px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono font-bold text-[#0D381E]">
                    {formatTime12h(effectiveTime)}
                  </div>
                </div>
              </div>

              {/* Time Rule Status Notice */}
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  currentRule.window === 'UP_TO_5PM'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : currentRule.window === 'LATE_WINDOW_5_01_TO_5_30'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="font-bold flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Rule: {currentRule.windowLabel}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{currentRule.ruleExplanation}</p>
              </div>

              {/* Strict Permitted Status Buttons */}
              <div>
                <label className="block font-bold text-[#0D381E] mb-1.5">
                  Attendance Status (Only permitted options enabled):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* PRESENT button */}
                  <button
                    type="button"
                    disabled={!currentRule.allowedStatuses.includes('PRESENT')}
                    onClick={() => setRecordStatus('PRESENT')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                      recordStatus === 'PRESENT'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : currentRule.allowedStatuses.includes('PRESENT')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Present
                    {!currentRule.allowedStatuses.includes('PRESENT') && ' (Locked)'}
                  </button>

                  {/* LATE button */}
                  <button
                    type="button"
                    disabled={!currentRule.allowedStatuses.includes('LATE')}
                    onClick={() => setRecordStatus('LATE')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                      recordStatus === 'LATE'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : currentRule.allowedStatuses.includes('LATE')
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Late
                    {!currentRule.allowedStatuses.includes('LATE') && ' (Locked)'}
                  </button>

                  {/* ABSENT button */}
                  <button
                    type="button"
                    disabled={!currentRule.allowedStatuses.includes('ABSENT')}
                    onClick={() => setRecordStatus('ABSENT')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                      recordStatus === 'ABSENT'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 cursor-pointer'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0D381E] mb-1">Remarks (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Conducted evening Hifz halaqah..."
                  value={recordRemarks}
                  onChange={(e) => setRecordRemarks(e.target.value)}
                  className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-hidden focus:border-[#0D381E]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#D8D2C5] text-[#57655B] font-semibold text-xs cursor-pointer hover:bg-[#F4F3EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer hover:bg-[#16532d] shadow-xs"
                >
                  Submit Teacher Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Chronological Teacher History */}
      {selectedTeacherRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-[#E6E2D8] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold text-[#0D381E] bg-[#E5C158] px-2 py-0.5 rounded">
                    Teacher Attendance History
                  </span>
                  <span className="text-xs text-[#E6E2D8] font-mono">
                    {selectedTeacherRecord.teacherCode}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl text-[#F3D273]">
                  {selectedTeacherRecord.teacherName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeacherRecord(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="border border-[#E6E2D8] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F3EE] text-[#0D381E] font-semibold border-b border-[#E6E2D8]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Check-In Time</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Rule Applied</th>
                      <th className="py-2.5 px-3">Recorded By</th>
                      <th className="py-2.5 px-3">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2D8]">
                    {teacherFullHistory.map((th) => (
                      <tr key={th.id} className="hover:bg-[#F9F8F4]">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0D381E]">{th.date}</td>
                        <td className="py-2.5 px-3 font-mono">{th.checkInTime ? formatTime12h(th.checkInTime) : '—'}</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={th.status} />
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[#57655B]">
                          {th.ruleApplied || 'Standard'}
                        </td>
                        <td className="py-2.5 px-3 text-[#57655B]">{th.recordedBy}</td>
                        <td className="py-2.5 px-3 text-[#57655B]">
                          {th.remarks || 'Regular duty'}
                          {th.correctionHistory && th.correctionHistory.length > 0 && (
                            <div className="mt-1 text-[10px] text-amber-800 font-semibold bg-amber-50 p-1 rounded">
                              Revised by {th.correctionHistory[th.correctionHistory.length - 1].updatedBy}: {th.correctionHistory[th.correctionHistory.length - 1].reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedTeacherRecord(null)}
                className="px-4 py-2 bg-[#0D381E] text-[#F3D273] font-bold text-xs rounded-lg cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Authorized Administrative Correction */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Authorized Teacher Attendance Correction
                </h3>
              </div>
              <button
                onClick={() => setCorrectionTarget(null)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-5 space-y-4 text-xs">
              <div className="bg-[#F9F8F4] p-3 rounded-xl border border-[#E6E2D8] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Teacher:</span>
                  <strong className="text-[#0D381E]">{correctionTarget.teacherName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Date:</span>
                  <span className="font-mono font-bold">{correctionTarget.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Current Status:</span>
                  <StatusBadge status={correctionTarget.status} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0D381E] mb-1.5">
                  Select Corrected Status:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['PRESENT', 'LATE', 'ABSENT', 'LEAVE'] as TeacherAttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewCorrectedStatus(st)}
                      className={`py-2 rounded-lg font-bold text-xs border cursor-pointer transition-all ${
                        newCorrectedStatus === st
                          ? 'bg-[#0D381E] text-[#F3D273] border-[#0D381E] shadow-xs'
                          : 'bg-[#F9F8F4] text-[#57655B] border-[#D8D2C5] hover:bg-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0D381E] mb-1">
                  Reason for Correction (Recorded in Audit Trail):
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g., Authorized duty exchange verified / Principal excused late arrival..."
                  className="w-full p-2.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-hidden focus:border-[#0D381E]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="px-3.5 py-2 rounded-lg border border-[#D8D2C5] text-[#57655B] font-semibold text-xs cursor-pointer hover:bg-[#F4F3EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer hover:bg-[#16532d] shadow-xs"
                >
                  Save Correction & Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
