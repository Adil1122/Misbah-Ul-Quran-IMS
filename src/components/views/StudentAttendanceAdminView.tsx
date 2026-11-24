import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  History,
  ShieldCheck,
  Edit2,
  Calendar,
  LayoutGrid,
  ListFilter,
  UserCheck,
  Users,
  Check,
  ClipboardCheck,
  Printer,
  RefreshCw,
} from 'lucide-react';
import {
  UserSession,
  StudentAttendanceStatus,
  StudentAttendanceRecord,
} from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { PaginationControl, PageSizeOption } from '../ui/PaginationControl.tsx';

interface StudentAttendanceAdminViewProps {
  user: UserSession;
  activeCampusId: string;
  initialDate?: string;
  initialClassId?: string;
  initialSearchQuery?: string;
  initialStatusFilter?: string;
  initialPageSize?: PageSizeOption;
}

export const StudentAttendanceAdminView: React.FC<StudentAttendanceAdminViewProps> = ({
  user,
  activeCampusId,
  initialDate,
  initialClassId,
  initialSearchQuery = '',
  initialStatusFilter = 'ALL',
  initialPageSize = 20,
}) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isCampusAdmin = user.role === 'CAMPUS_ADMIN';
  const isTeacher = user.role === 'TEACHER';

  // Campus context - Campus Admin is strictly locked to their own campus
  const effectiveCampus = isSuperAdmin ? activeCampusId : user.activeCampusId;
  const campuses = IMSStateService.getCampuses();
  const classes = IMSStateService.getClasses(effectiveCampus);
  const students = IMSStateService.getStudents(effectiveCampus);
  const teachers = IMSStateService.getTeachers(effectiveCampus);

  // Active View Mode: 'roll-call' (Class attendance) vs 'ledger' (Full detailed table) vs 'daily-overview'
  const [viewMode, setViewMode] = useState<'roll-call' | 'ledger' | 'daily-overview'>('roll-call');

  // Today's date
  const todayStr = new Date().toISOString().split('T')[0];

  // Daily Overview selected date
  const [overviewDate, setOverviewDate] = useState<string>(initialDate || todayStr);

  // Class Roll Call Mode State
  const [rollCallClassId, setRollCallClassId] = useState<string>(
    initialClassId && initialClassId !== 'ALL' ? initialClassId : (classes[0]?.id || '')
  );
  const [rollCallDate, setRollCallDate] = useState<string>(initialDate || todayStr);
  const [rollCallMap, setRollCallMap] = useState<Record<string, {
    status: StudentAttendanceStatus;
    arrivalTime?: string;
    remarks?: string;
  }>>({});
  const [isSavingRollCall, setIsSavingRollCall] = useState(false);

  // Filters state
  const [campusFilter, setCampusFilter] = useState<string>(effectiveCampus);
  const [classFilter, setClassFilter] = useState<string>(initialClassId || 'ALL');
  const [searchPerson, setSearchPerson] = useState<string>(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [teacherFilter, setTeacherFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>(initialDate || '');
  const [endDate, setEndDate] = useState<string>(initialDate || '');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(initialPageSize);

  // Synchronize state when parent shared dashboard filters change
  useEffect(() => {
    if (activeCampusId) setCampusFilter(isSuperAdmin ? activeCampusId : user.activeCampusId);
  }, [activeCampusId, isSuperAdmin, user.activeCampusId]);

  useEffect(() => {
    if (initialDate) {
      setRollCallDate(initialDate);
      setOverviewDate(initialDate);
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialClassId && initialClassId !== 'ALL') {
      setRollCallClassId(initialClassId);
      setClassFilter(initialClassId);
    }
  }, [initialClassId]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) setSearchPerson(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialStatusFilter !== undefined) setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialPageSize) setPageSize(initialPageSize);
  }, [initialPageSize]);

  // Selected student for Full History Modal
  const [selectedStudentRecord, setSelectedStudentRecord] = useState<StudentAttendanceRecord | null>(null);

  // Selected record for Quick Correction Modal
  const [correctionTarget, setCorrectionTarget] = useState<StudentAttendanceRecord | null>(null);
  const [newCorrectedStatus, setNewCorrectedStatus] = useState<StudentAttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Record Attendance Modal
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markStudentId, setMarkStudentId] = useState<string>(students[0]?.id || '');
  const [markDate, setMarkDate] = useState<string>(todayStr);
  const [markStatus, setMarkStatus] = useState<StudentAttendanceStatus>('PRESENT');
  const [markArrivalTime, setMarkArrivalTime] = useState<string>('16:30');
  const [markRemarks, setMarkRemarks] = useState<string>('');

  const [feedback, setFeedback] = useState<string>('');

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  };

  // Reset pagination to page 1 whenever any filter changes
  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  // Get all attendance records for campus (or all campuses for Super Admin)
  const allAttendance = IMSStateService.getStudentAttendance(
    campusFilter === 'all' ? undefined : campusFilter
  );

  // Filter attendance records
  const filteredRecords = useMemo(() => {
    return allAttendance.filter((rec) => {
      if (campusFilter !== 'all' && rec.campusId !== campusFilter) return false;
      if (classFilter !== 'ALL' && rec.classId !== classFilter) return false;
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
      if (startDate && rec.date < startDate) return false;
      if (endDate && rec.date > endDate) return false;
      if (teacherFilter !== 'ALL' && !rec.recordedBy.toLowerCase().includes(teacherFilter.toLowerCase())) {
        return false;
      }
      if (searchPerson.trim()) {
        const q = searchPerson.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(q);
        const matchId = rec.admissionNumber.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [allAttendance, campusFilter, classFilter, statusFilter, startDate, endDate, teacherFilter, searchPerson]);

  // Paginated slice
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Daily Overview calculations for overviewDate
  const dailyMetrics = useMemo(() => {
    const campusStudents = students.filter(
      (s) => campusFilter === 'all' || s.campusId === campusFilter
    );
    const dayAttendance = allAttendance.filter(
      (r) => (campusFilter === 'all' || r.campusId === campusFilter) && r.date === overviewDate
    );

    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    dayAttendance.forEach((r) => {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'LATE') late++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'EXCUSED') excused++;
    });

    const recordedStudentIds = new Set(dayAttendance.map((r) => r.studentId));
    const notSubmittedCount = Math.max(0, campusStudents.length - recordedStudentIds.size);

    return {
      totalEnrolled: campusStudents.length,
      present,
      late,
      absent,
      excused,
      notSubmittedCount,
      totalRecorded: dayAttendance.length,
      attendanceRate:
        campusStudents.length > 0
          ? Math.round(((present + late) / campusStudents.length) * 100)
          : 0,
    };
  }, [students, allAttendance, campusFilter, overviewDate]);

  // Full chronological history for selected student (newest first, from admission date onward)
  const studentFullHistory = useMemo(() => {
    if (!selectedStudentRecord) return [];
    return allAttendance
      .filter((a) => a.studentId === selectedStudentRecord.studentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedStudentRecord, allAttendance]);

  // Can user mark or edit student attendance? Campus Admin & Super Admin authorized
  const canManage = isSuperAdmin || isCampusAdmin || isTeacher;

  // Handler for marking new single student attendance
  const handleSaveNewAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markStudentId) return;

    const student = students.find((s) => s.id === markStudentId);
    if (!student) return;

    try {
      IMSStateService.recordStudentAttendanceSingle({
        studentId: student.id,
        campusId: student.campusId,
        classId: student.classId,
        date: markDate,
        status: markStatus,
        arrivalTime: markStatus !== 'ABSENT' ? markArrivalTime : undefined,
        remarks: markRemarks.trim(),
      });
      showToast('✓ Attendance recorded successfully in student ledger.');
      setIsMarkModalOpen(false);
      setMarkRemarks('');
    } catch {
      showToast('Unable to record attendance. Please try again.');
    }
  };

  // Open correction modal for a record
  const handleOpenCorrection = (record: StudentAttendanceRecord) => {
    setCorrectionTarget(record);
    setNewCorrectedStatus(record.status);
    setCorrectionReason('');
  };

  // Handler for saving authorized correction
  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget) return;

    try {
      IMSStateService.updateStudentAttendance(
        correctionTarget.id,
        newCorrectedStatus,
        correctionReason.trim() || 'Verified correction by campus administration'
      );
      showToast(
        `✓ Attendance for ${correctionTarget.studentName} updated from ${correctionTarget.status} to ${newCorrectedStatus}. Audit trail recorded.`
      );
      setCorrectionTarget(null);
      setCorrectionReason('');
    } catch {
      showToast('Unable to save attendance correction.');
    }
  };

  // Export filtered attendance list to CSV
  const handleExportCSV = () => {
    const header =
      'Date,Student ID,Student Name,Campus,Class,Arrival Time,Status,Recorded By,Last Updated\n';
    const rows = filteredRecords.map((r) => {
      const cls = classes.find((c) => c.id === r.classId)?.name || r.classId;
      return `"${r.date}","${r.admissionNumber}","${r.studentName}","${r.campusId.toUpperCase()}","${cls}","${r.arrivalTime || 'N/A'}","${r.status}","${r.recordedBy}","${r.updatedAt || r.date}"`;
    });
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Student_Attendance_${campusFilter}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ Student attendance list exported to CSV successfully.');
  };

  // Selected class object for roll-call
  const selectedClassObj = useMemo(() => {
    return classes.find((c) => c.id === rollCallClassId);
  }, [classes, rollCallClassId]);

  // Students in selected roll-call class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === rollCallClassId);
  }, [students, rollCallClassId]);

  // Sync roll-call state when class or date changes
  useEffect(() => {
    if (!rollCallClassId || !rollCallDate) return;
    const existing = allAttendance.filter(
      (a) => a.classId === rollCallClassId && a.date === rollCallDate
    );
    const map: Record<string, { status: StudentAttendanceStatus; arrivalTime?: string; remarks?: string; recordedBy?: string }> = {};
    classStudents.forEach((st) => {
      const rec = existing.find((e) => e.studentId === st.id);
      if (rec) {
        map[st.id] = {
          status: rec.status,
          arrivalTime: rec.arrivalTime || (rec.status !== 'ABSENT' ? '16:30' : ''),
          remarks: rec.remarks || '',
          recordedBy: rec.recordedBy,
        };
      } else {
        map[st.id] = {
          status: 'PRESENT',
          arrivalTime: '16:30',
          remarks: '',
        };
      }
    });
    setRollCallMap(map);
  }, [rollCallClassId, rollCallDate, classStudents, allAttendance]);

  const rollCallSummary = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;
    classStudents.forEach((st) => {
      const stt = rollCallMap[st.id]?.status || 'PRESENT';
      if (stt === 'PRESENT') present++;
      else if (stt === 'LATE') late++;
      else if (stt === 'ABSENT') absent++;
      else if (stt === 'EXCUSED') excused++;
    });
    return { present, late, absent, excused };
  }, [classStudents, rollCallMap]);

  const handleMarkAll = (status: StudentAttendanceStatus) => {
    setRollCallMap((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        next[st.id] = {
          ...next[st.id],
          status,
          arrivalTime: status !== 'ABSENT' ? (next[st.id]?.arrivalTime || '16:30') : undefined,
        };
      });
      return next;
    });
  };

  const handleStudentStatusChange = (studentId: string, status: StudentAttendanceStatus) => {
    setRollCallMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        arrivalTime: status !== 'ABSENT' ? (prev[studentId]?.arrivalTime || '16:30') : undefined,
      },
    }));
  };

  const handleStudentTimeChange = (studentId: string, arrivalTime: string) => {
    setRollCallMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        arrivalTime,
      },
    }));
  };

  const handleStudentRemarksChange = (studentId: string, remarks: string) => {
    setRollCallMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleSaveRollCall = async () => {
    if (!rollCallClassId || classStudents.length === 0) return;
    setIsSavingRollCall(true);
    try {
      const payload = classStudents.map((st) => ({
        studentId: st.id,
        status: rollCallMap[st.id]?.status || 'PRESENT',
        arrivalTime: rollCallMap[st.id]?.arrivalTime,
        remarks: rollCallMap[st.id]?.remarks,
      }));
      IMSStateService.recordStudentAttendanceBulk(
        rollCallClassId,
        campusFilter === 'all' ? (classStudents[0]?.campusId || 'cmp-uk-01') : campusFilter,
        rollCallDate,
        payload
      );
      showToast(`✓ Attendance for ${classStudents.length} students in ${selectedClassObj?.name || 'Class'} saved successfully.`);
    } catch (err: any) {
      showToast('Error saving attendance: ' + (err?.message || 'Please try again.'));
    } finally {
      setIsSavingRollCall(false);
    }
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

      {/* Header & Main Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#0D381E]">
              Student Attendance Records
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0D381E]/10 text-[#0D381E]">
              {filteredRecords.length} Total Records
            </span>
          </div>
          <p className="text-xs text-[#57655B] mt-0.5">
            Complete institutional roll ledger, daily summaries, arrival times, and verified administrative audit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Overview vs Detailed Ledger */}
          <div className="bg-[#F4F3EE] p-1 rounded-lg border border-[#E6E2D8] flex items-center">
            <button
              onClick={() => setViewMode('daily-overview')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                viewMode === 'daily-overview'
                  ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                  : 'text-[#57655B] hover:text-[#0D381E]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Daily Overview</span>
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                viewMode === 'ledger'
                  ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                  : 'text-[#57655B] hover:text-[#0D381E]'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Records Ledger</span>
            </button>
          </div>

          {canManage && (
            <button
              onClick={() => setIsMarkModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mark Student</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] border border-[#E6E2D8] text-[#0D381E] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
            title="Download CSV export of currently filtered attendance list"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* DAILY OVERVIEW MODE */}
      {viewMode === 'daily-overview' && (
        <div className="space-y-4">
          {/* Date Selector & Daily High-Level Stats */}
          <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#0D381E]" />
              <label htmlFor="overview-date" className="text-xs font-bold text-[#0D381E]">
                Select Date for Daily Overview:
              </label>
              <input
                id="overview-date"
                type="date"
                value={overviewDate}
                onChange={(e) => setOverviewDate(e.target.value)}
                className="px-3 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono font-bold text-[#0D381E] cursor-pointer focus:outline-hidden focus:border-[#0D381E]"
              />
            </div>

            <div className="text-xs text-[#57655B]">
              Campus:{' '}
              <strong className="text-[#0D381E]">
                {campuses.find((c) => c.id === campusFilter)?.name || 'All Campuses'}
              </strong>
            </div>
          </div>

          {/* 5 Compact Summary Cards for Selected Date */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Enrolled */}
            <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs">
              <div className="text-[11px] font-bold text-[#57655B] uppercase tracking-wider flex items-center justify-between">
                <span>Enrolled Pupils</span>
                <Users className="w-4 h-4 text-[#0D381E]" />
              </div>
              <div className="text-2xl font-bold text-[#0D381E] font-mono mt-1 tabular-nums">
                {dailyMetrics.totalEnrolled}
              </div>
              <p className="text-[11px] text-[#57655B] mt-0.5">Active pupils on roster</p>
            </div>

            {/* Present */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                <span>Present</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono mt-1 tabular-nums">
                {dailyMetrics.present}
              </div>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">
                {dailyMetrics.totalEnrolled > 0
                  ? `${Math.round((dailyMetrics.present / dailyMetrics.totalEnrolled) * 100)}% attendance`
                  : '0%'}
              </p>
            </div>

            {/* Late */}
            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                <span>Late Arrival</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-700 font-mono mt-1 tabular-nums">
                {dailyMetrics.late}
              </div>
              <p className="text-[11px] text-amber-700/80 mt-0.5">Tardy arrivals recorded</p>
            </div>

            {/* Absent */}
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                <span>Absent</span>
                <X className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-700 font-mono mt-1 tabular-nums">
                {dailyMetrics.absent}
              </div>
              <p className="text-[11px] text-rose-700/80 mt-0.5">Reported absences</p>
            </div>

            {/* Attendance Not Yet Submitted */}
            <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
              <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center justify-between">
                <span>Not Yet Submitted</span>
                <AlertCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-700 font-mono mt-1 tabular-nums">
                {dailyMetrics.notSubmittedCount}
              </div>
              <p className="text-[11px] text-blue-700/80 mt-0.5">Pending roll call</p>
            </div>
          </div>

          {/* Per-Class Submission Status Breakdown Card */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-4 shadow-xs">
            <h3 className="font-heading font-bold text-base text-[#0D381E] mb-3">
              Class Attendance Status Breakdown ({overviewDate})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((cls) => {
                const classStudents = students.filter((s) => s.classId === cls.id);
                const classRecords = allAttendance.filter(
                  (r) => r.classId === cls.id && r.date === overviewDate
                );
                const isComplete =
                  classStudents.length > 0 && classRecords.length >= classStudents.length;

                const pres = classRecords.filter((r) => r.status === 'PRESENT').length;
                const lt = classRecords.filter((r) => r.status === 'LATE').length;
                const abs = classRecords.filter((r) => r.status === 'ABSENT').length;

                return (
                  <div
                    key={cls.id}
                    className="p-3.5 rounded-xl border border-[#E6E2D8] bg-[#F9F8F4] space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-[#0D381E] text-xs">{cls.name}</h4>
                        <p className="text-[11px] text-[#57655B]">
                          Teacher: {cls.leadTeacherName || 'Assigned Staff'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isComplete
                            ? 'bg-emerald-100 text-emerald-800'
                            : classRecords.length > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isComplete
                          ? 'Submitted'
                          : classRecords.length > 0
                          ? 'Partial'
                          : 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-medium pt-1 border-t border-[#E6E2D8]">
                      <div className="p-1 rounded bg-white">
                        <span className="block text-[#57655B]">Enrolled</span>
                        <strong className="text-[#0D381E] font-mono text-xs">
                          {classStudents.length}
                        </strong>
                      </div>
                      <div className="p-1 rounded bg-emerald-50 text-emerald-800">
                        <span className="block">Pres</span>
                        <strong className="font-mono text-xs">{pres}</strong>
                      </div>
                      <div className="p-1 rounded bg-amber-50 text-amber-800">
                        <span className="block">Late</span>
                        <strong className="font-mono text-xs">{lt}</strong>
                      </div>
                      <div className="p-1 rounded bg-rose-50 text-rose-800">
                        <span className="block">Abs</span>
                        <strong className="font-mono text-xs">{abs}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR FOR RECORDS LEDGER */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Person Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57655B]" />
            <input
              type="text"
              placeholder="Search student name or admission ID..."
              value={searchPerson}
              onChange={(e) => handleFilterChange(setSearchPerson, e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-hidden focus:border-[#0D381E]"
            />
          </div>

          {/* Campus Filter (if Super Admin) */}
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

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => handleFilterChange(setClassFilter, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-medium focus:outline-hidden focus:border-[#0D381E]"
            >
              <option value="ALL">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

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
              <option value="EXCUSED">Excused</option>
            </select>
          </div>

          {/* Teacher Recorder Filter */}
          <div>
            <select
              value={teacherFilter}
              onChange={(e) => handleFilterChange(setTeacherFilter, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-medium focus:outline-hidden focus:border-[#0D381E]"
            >
              <option value="ALL">All Recorded By</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.fullName}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
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

        {/* Top Pagination Bar with Records Per Page: 20 | 50 | 100 | 500 */}
        <PaginationControl
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={filteredRecords.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          showTopBar={true}
          itemName="attendance records"
        />
      </div>

      {/* DETAILED ATTENDANCE LEDGER TABLE */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                <th className="py-3 px-3 font-semibold">1. Student Name</th>
                <th className="py-3 px-3 font-semibold">2. Student ID</th>
                <th className="py-3 px-3 font-semibold">3. Class</th>
                <th className="py-3 px-3 font-semibold">4. Attendance Date</th>
                <th className="py-3 px-3 font-semibold">5. Arrival Time</th>
                <th className="py-3 px-3 font-semibold">6. Attendance Status</th>
                <th className="py-3 px-3 font-semibold">7. Recorded By</th>
                <th className="py-3 px-3 font-semibold">8. Last Updated</th>
                <th className="py-3 px-3 font-semibold text-right">9. Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#57655B]">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-semibold text-sm text-[#0D381E]">
                        No student attendance records match the selected filters.
                      </p>
                      <p className="text-xs text-[#57655B]">
                        Try broadening your date range, clearing search terms, or switching classes.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const studentClass =
                    r.className || classes.find((c) => c.id === r.classId)?.name || r.classId;

                  return (
                    <tr key={r.id} className="hover:bg-[#F9F8F4] transition-colors">
                      {/* 1. Student Name */}
                      <td className="py-3 px-3 font-bold text-[#1A231E]">
                        {r.studentName}
                        {r.remarks && (
                          <div className="text-[10px] text-[#57655B] font-normal italic truncate max-w-xs">
                            {r.remarks}
                          </div>
                        )}
                      </td>

                      {/* 2. Student ID */}
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#0D381E] whitespace-nowrap">
                        {r.admissionNumber}
                      </td>

                      {/* 3. Class */}
                      <td className="py-3 px-3 text-[#57655B] font-medium whitespace-nowrap">
                        {studentClass}
                      </td>

                      {/* 4. Attendance Date */}
                      <td className="py-3 px-3 font-mono font-bold text-[#0D381E] whitespace-nowrap">
                        {r.date}
                      </td>

                      {/* 5. Arrival Time */}
                      <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                        {r.arrivalTime ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {r.arrivalTime}
                          </span>
                        ) : (
                          <span className="text-[#57655B]/60 italic">—</span>
                        )}
                      </td>

                      {/* 6. Attendance Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* 7. Recorded By */}
                      <td className="py-3 px-3 text-[#57655B] whitespace-nowrap">
                        {r.recordedBy || 'Authorized Teacher'}
                      </td>

                      {/* 8. Last Updated */}
                      <td className="py-3 px-3 text-[#57655B] font-mono text-[11px] whitespace-nowrap">
                        {r.updatedAt ? r.updatedAt.replace('T', ' ').substring(0, 16) : r.date}
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Full Student History */}
                          <button
                            onClick={() => setSelectedStudentRecord(r)}
                            className="px-2.5 py-1 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-semibold flex items-center space-x-1 cursor-pointer shadow-2xs"
                            title="View student historical attendance from admission date"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>History</span>
                          </button>

                          {/* Authorized Correction */}
                          {canManage && (
                            <button
                              onClick={() => handleOpenCorrection(r)}
                              className="px-2 py-1 rounded-lg bg-[#F4F3EE] hover:bg-[#E6E2D8] border border-[#D8D2C5] text-[#0D381E] text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                              title="Edit / Correct attendance status with administrative reason"
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
          itemName="attendance records"
          className="border-t border-[#E6E2D8] rounded-none rounded-b-xl"
        />
      </div>

      {/* MODAL 1: Individual Student Full Historical Attendance Modal (From admission date onward) */}
      {selectedStudentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-[#E6E2D8] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold text-[#0D381E] bg-[#E5C158] px-2 py-0.5 rounded">
                    Student Historical Ledger
                  </span>
                  <span className="text-xs text-[#E6E2D8] font-mono">
                    {selectedStudentRecord.admissionNumber}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl text-[#F3D273]">
                  {selectedStudentRecord.studentName}
                </h3>
                <p className="text-xs text-[#E6E2D8]/80">
                  Campus: <strong>{selectedStudentRecord.campusId.toUpperCase()}</strong> · Complete attendance history from admission onward
                </p>
              </div>

              <button
                onClick={() => setSelectedStudentRecord(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0D381E]">
                  Total Recorded Sessions: {studentFullHistory.length}
                </span>
                <span className="text-[#57655B]">
                  Presents: {studentFullHistory.filter((a) => a.status === 'PRESENT').length} | Lates:{' '}
                  {studentFullHistory.filter((a) => a.status === 'LATE').length} | Absents:{' '}
                  {studentFullHistory.filter((a) => a.status === 'ABSENT').length}
                </span>
              </div>

              <div className="border border-[#E6E2D8] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F3EE] text-[#0D381E] font-semibold border-b border-[#E6E2D8]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Arrival Time</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Recorded By</th>
                      <th className="py-2.5 px-3">Remarks & Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2D8]">
                    {studentFullHistory.map((hist) => (
                      <tr key={hist.id} className="hover:bg-[#F9F8F4]">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0D381E]">{hist.date}</td>
                        <td className="py-2.5 px-3 text-[#57655B]">
                          {hist.className || classes.find((c) => c.id === hist.classId)?.name || hist.classId}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{hist.arrivalTime || '—'}</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={hist.status} />
                        </td>
                        <td className="py-2.5 px-3 text-[#57655B]">{hist.recordedBy}</td>
                        <td className="py-2.5 px-3 text-[#57655B]">
                          {hist.remarks || 'Regular session'}
                          {hist.correctionHistory && hist.correctionHistory.length > 0 && (
                            <div className="mt-1 text-[10px] text-amber-800 font-semibold bg-amber-50 p-1 rounded">
                              Revised by {hist.correctionHistory[hist.correctionHistory.length - 1].updatedBy}: {hist.correctionHistory[hist.correctionHistory.length - 1].reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedStudentRecord(null)}
                className="px-4 py-2 bg-[#0D381E] text-[#F3D273] font-bold text-xs rounded-lg cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Authorized Attendance Correction Modal with Audit Trail Reason */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Authorized Attendance Correction
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
                  <span className="text-[#57655B]">Student:</span>
                  <strong className="text-[#0D381E]">{correctionTarget.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">ID:</span>
                  <span className="font-mono">{correctionTarget.admissionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Session Date:</span>
                  <span className="font-mono font-bold">{correctionTarget.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Current Recorded Status:</span>
                  <StatusBadge status={correctionTarget.status} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0D381E] mb-1.5">
                  Select Corrected Status:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as StudentAttendanceStatus[]).map((st) => (
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
                  Mandatory Reason for Correction (Logged to Audit Trail):
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g., Parent presented doctor note / Verified late arrival instead of absent..."
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

      {/* MODAL 3: Mark Single Student Attendance */}
      {isMarkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Mark Student Attendance
                </h3>
              </div>
              <button
                onClick={() => setIsMarkModalOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAttendance} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#0D381E] mb-1">Select Student:</label>
                <select
                  value={markStudentId}
                  onChange={(e) => setMarkStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#0D381E]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber}) — {s.className || 'Class'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Date:</label>
                  <input
                    type="date"
                    value={markDate}
                    onChange={(e) => setMarkDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-[#0D381E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Arrival Time:</label>
                  <input
                    type="time"
                    value={markArrivalTime}
                    onChange={(e) => setMarkArrivalTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-[#0D381E]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0D381E] mb-1">Attendance Status:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as StudentAttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMarkStatus(st)}
                      className={`py-2 rounded-lg font-bold text-xs border cursor-pointer transition-all ${
                        markStatus === st
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
                <label className="block font-bold text-[#0D381E] mb-1">Remarks (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Participated actively, completed Sabaq revision..."
                  value={markRemarks}
                  onChange={(e) => setMarkRemarks(e.target.value)}
                  className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-hidden focus:border-[#0D381E]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  onClick={() => setIsMarkModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#D8D2C5] text-[#57655B] font-semibold text-xs cursor-pointer hover:bg-[#F4F3EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer hover:bg-[#16532d] shadow-xs"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
