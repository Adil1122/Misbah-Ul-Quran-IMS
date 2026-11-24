import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CalendarCheck,
  Award,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Save,
  Clock,
  Calendar,
  Bell,
  Users,
  Search,
  Check,
  X,
  ChevronRight,
  ArrowLeft,
  Plus,
  Video,
  FileText,
  Shield,
  Download,
  AlertCircle,
  HelpCircle,
  MoreHorizontal,
  Phone,
  Eye,
  GraduationCap,
  History,
  Sparkles,
  RotateCcw,
  Building2,
  Mail,
  Edit2,
} from 'lucide-react';
import {
  UserSession,
  StudentAttendanceStatus,
  StudentAttendanceRecord,
  StudentRecord,
  AcademicExamResult,
  AcademicProgressRecord,
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
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
import { DocumentManagerComponent } from '../documents/DocumentManagerComponent.tsx';

interface TeacherPortalProps {
  user: UserSession;
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
}

type TeacherPrimaryTab =
  | 'dashboard'
  | 'my-classes'
  | 'student-attendance'
  | 'attendance-history'
  | 'my-attendance'
  | 'results'
  | 'more';

type TeacherMoreSubTab =
  | 'overview'
  | 'teaching-materials'
  | 'announcements-events'
  | 'incidents-medical'
  | 'profile';

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  user,
  activeTab: externalTab,
  onNavigateTab,
}) => {
  // 1. Locate teacher profile strictly matching user credentials
  const allTeachers = IMSStateService.getTeachers('all');
  const teacherProfile = useMemo(() => {
    return (
      allTeachers.find((t) => t.userId === user.id) ||
      allTeachers.find((t) => t.id === user.teacherProfileId) ||
      allTeachers.find((t) => t.email.toLowerCase() === user.email.toLowerCase()) ||
      null
    );
  }, [user.id, user.teacherProfileId, user.email, allTeachers]);

  const campus = IMSStateService.getCampusById(teacherProfile?.campusId || user.activeCampusId) || IMSStateService.getCampuses()[0];
  const timezone = campus?.timezone || (campus?.code === 'uk' ? 'Europe/London' : 'Asia/Karachi');

  // Authoritatively load classes assigned to this authenticated teacher:
  // 1. Class leadTeacherId matches user.id OR teacherProfile.id OR teacherProfile.userId
  // 2. OR class is listed in teacherProfile.assignedClassIds
  // Never fallback to demo arrays like ['cls-g2'] or allClasses.slice(0, 2)
  const assignedClasses = useMemo(() => {
    const allClasses = IMSStateService.getClasses('all');
    return allClasses.filter((c) => {
      if (
        c.leadTeacherId &&
        (c.leadTeacherId === user.id ||
          (teacherProfile && (c.leadTeacherId === teacherProfile.id || c.leadTeacherId === teacherProfile.userId)))
      ) {
        return true;
      }
      if (teacherProfile?.assignedClassIds && teacherProfile.assignedClassIds.includes(c.id)) {
        return true;
      }
      return false;
    });
  }, [user.id, teacherProfile]);

  const [selectedClassId, setSelectedClassId] = useState<string>(() => assignedClasses[0]?.id || '');

  useEffect(() => {
    if (assignedClasses.length > 0) {
      if (!assignedClasses.some((c) => c.id === selectedClassId)) {
        setSelectedClassId(assignedClasses[0].id);
      }
    } else {
      setSelectedClassId('');
    }
  }, [assignedClasses, selectedClassId]);

  const currentClass = useMemo(() => {
    return assignedClasses.find((c) => c.id === selectedClassId) || assignedClasses[0] || null;
  }, [assignedClasses, selectedClassId]);

  const currentClassId = currentClass?.id;

  // Enrolled students in current class
  const allStudents = useMemo(() => {
    return IMSStateService.getStudents('all');
  }, []);

  const classStudents = useMemo(() => {
    if (!currentClassId) return [];
    return allStudents.filter((s) => s.classId === currentClassId);
  }, [allStudents, currentClassId]);

  // Total students across all assigned classes
  const totalAssignedStudentsCount = useMemo(() => {
    const classIds = assignedClasses.map((c) => c.id);
    return allStudents.filter((s) => classIds.includes(s.classId)).length;
  }, [assignedClasses, allStudents]);

  // Tab mapping
  const mapExternalTab = (tab?: string): { primary: TeacherPrimaryTab; moreSub: TeacherMoreSubTab } => {
    if (!tab || tab === 'dashboard' || tab === 'home') {
      return { primary: 'dashboard', moreSub: 'overview' };
    }
    if (tab === 'my-classes') {
      return { primary: 'my-classes', moreSub: 'overview' };
    }
    if (tab === 'attendance' || tab === 'student-attendance') {
      return { primary: 'student-attendance', moreSub: 'overview' };
    }
    if (tab === 'attendance-history' || tab === 'history') {
      return { primary: 'attendance-history', moreSub: 'overview' };
    }
    if (tab === 'my-attendance') {
      return { primary: 'my-attendance', moreSub: 'overview' };
    }
    if (tab === 'results' || tab === 'student-progress' || tab === 'quran') {
      return { primary: 'results', moreSub: 'overview' };
    }
    if (tab === 'teaching-materials' || tab === 'materials') {
      return { primary: 'more', moreSub: 'teaching-materials' };
    }
    if (tab === 'announcements-events' || tab === 'announcements' || tab === 'communication') {
      return { primary: 'more', moreSub: 'announcements-events' };
    }
    if (tab === 'incidents-medical' || tab === 'incidents' || tab === 'medical') {
      return { primary: 'more', moreSub: 'incidents-medical' };
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
  const [activeTab, setActiveTab] = useState<TeacherPrimaryTab>(initial.primary);
  const [moreSubTab, setMoreSubTab] = useState<TeacherMoreSubTab>(initial.moreSub);

  useEffect(() => {
    if (externalTab) {
      const mapped = mapExternalTab(externalTab);
      setActiveTab(mapped.primary);
      setMoreSubTab(mapped.moreSub);
    }
  }, [externalTab]);

  const handleTabClick = (tabId: TeacherPrimaryTab, sub?: TeacherMoreSubTab) => {
    setActiveTab(tabId);
    if (tabId === 'more') {
      setMoreSubTab(sub || 'overview');
    }
    if (onNavigateTab) {
      if (tabId === 'student-attendance') onNavigateTab('attendance');
      else if (tabId === 'more' && sub && sub !== 'overview') onNavigateTab(sub);
      else onNavigateTab(tabId);
    }
  };

  // Feedback Toasts
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const triggerError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 4500);
  };

  // -------------------------------------------------------------
  // TEACHER SELF-ATTENDANCE CHECK-IN (Strict Time Rules Engine)
  // Authority granted to teachers as requested!
  // <= 5:00 PM: Present or Absent
  // 5:00:01 PM - 5:30:00 PM: Late or Absent
  // > 5:30:00 PM: Absent only (Present & Late disabled/locked)
  // -------------------------------------------------------------
  const todayStr = new Date().toISOString().split('T')[0];
  const [liveClock, setLiveClock] = useState(() => getCampusCurrentTime(timezone));
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [simulatedTime, setSimulatedTime] = useState<string>('16:45:00');

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

  // Today's attendance record for this teacher
  const allTeacherAttendance = IMSStateService.getTeacherAttendance(user.activeCampusId);
  const myTodayAttendance = useMemo(() => {
    return allTeacherAttendance.find(
      (a) => a.teacherId === teacherProfile?.id && a.date === todayStr
    );
  }, [allTeacherAttendance, teacherProfile?.id, todayStr, successToast]);

  const [selfCheckInStatus, setSelfCheckInStatus] = useState<TeacherAttendanceStatus>(
    currentRule.defaultStatus
  );
  const [selfCheckInRemarks, setSelfCheckInRemarks] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  useEffect(() => {
    if (!currentRule.allowedStatuses.includes(selfCheckInStatus)) {
      setSelfCheckInStatus(currentRule.defaultStatus);
    }
  }, [currentRule, selfCheckInStatus]);

  const handleSelfCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherProfile) return;

    try {
      IMSStateService.recordTeacherAttendance({
        teacherId: teacherProfile.id,
        campusId: user.activeCampusId,
        date: todayStr,
        status: selfCheckInStatus,
        checkInTime: effectiveTime,
        remarks: selfCheckInRemarks.trim() || undefined,
        isSystemGenerated: currentRule.isAutoAbsent,
      });

      triggerSuccess(
        `✓ Daily attendance confirmed: Marked ${selfCheckInStatus} at ${formatTime12h(effectiveTime)} (${currentRule.windowLabel})!`
      );
      setIsCheckInModalOpen(false);
      setSelfCheckInRemarks('');
    } catch (err: any) {
      triggerError(err.message || 'Status not permitted under current time rule.');
    }
  };

  // -------------------------------------------------------------
  // STUDENT ATTENDANCE WORKFLOW (Class roll call)
  // -------------------------------------------------------------
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [rollCall, setRollCall] = useState<{
    [studentId: string]: { status: StudentAttendanceStatus; remarks: string; arrivalTime?: string };
  }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isExistingRecordLoaded, setIsExistingRecordLoaded] = useState<boolean>(false);

  // Load attendance records for current class and selected date
  useEffect(() => {
    if (!currentClassId) return;

    const existingRecords = IMSStateService.getStudentAttendance(
      user.activeCampusId,
      currentClassId
    ).filter((a) => a.date === selectedDate);

    const initialRoll: {
      [studentId: string]: { status: StudentAttendanceStatus; remarks: string; arrivalTime?: string };
    } = {};
    let foundAny = false;

    classStudents.forEach((student) => {
      const saved = existingRecords.find((r) => r.studentId === student.id);
      if (saved) {
        initialRoll[student.id] = {
          status: saved.status,
          remarks: saved.remarks || '',
          arrivalTime: saved.arrivalTime || (saved.status === 'LATE' ? '17:15' : '16:45'),
        };
        foundAny = true;
      } else {
        initialRoll[student.id] = {
          status: 'PRESENT',
          remarks: '',
          arrivalTime: '16:45',
        };
      }
    });

    setRollCall(initialRoll);
    setIsExistingRecordLoaded(foundAny);
    setHasUnsavedChanges(false);
  }, [currentClassId, selectedDate, classStudents, user.activeCampusId]);

  const handleStatusChange = (studentId: string, status: StudentAttendanceStatus) => {
    setRollCall((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        arrivalTime: status === 'LATE' ? '17:15' : status === 'PRESENT' ? '16:45' : undefined,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    const updated: {
      [studentId: string]: { status: StudentAttendanceStatus; remarks: string; arrivalTime?: string };
    } = {};
    classStudents.forEach((s) => {
      updated[s.id] = {
        status: 'PRESENT',
        remarks: rollCall[s.id]?.remarks || '',
        arrivalTime: '16:45',
      };
    });
    setRollCall(updated);
    setHasUnsavedChanges(true);
    triggerSuccess(`✓ All ${classStudents.length} students marked Present. Tap "Save Attendance" to confirm.`);
  };

  const handleSaveAttendance = () => {
    if (!currentClass) {
      triggerError('Please select a class first.');
      return;
    }
    if (classStudents.length === 0) {
      triggerError('No enrolled students in this class.');
      return;
    }

    const payload = classStudents.map((s) => ({
      studentId: s.id,
      status: rollCall[s.id]?.status || 'PRESENT',
      arrivalTime: rollCall[s.id]?.arrivalTime,
      remarks: rollCall[s.id]?.remarks || undefined,
    }));

    try {
      IMSStateService.recordStudentAttendanceBulk(
        currentClass.id,
        user.activeCampusId,
        selectedDate,
        payload
      );
      setHasUnsavedChanges(false);
      setIsExistingRecordLoaded(true);
      triggerSuccess(
        `✓ Attendance saved successfully for ${payload.length} students in ${currentClass.name} on ${selectedDate}!`
      );
    } catch {
      triggerError('Failed to save attendance. Please try again.');
    }
  };

  // Roll call summary counts
  const summaryCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let unrecorded = 0;
    classStudents.forEach((s) => {
      const st = rollCall[s.id]?.status;
      if (!st) unrecorded++;
      else if (st === 'PRESENT') present++;
      else if (st === 'ABSENT') absent++;
      else if (st === 'LATE') late++;
    });
    return { present, absent, late, unrecorded, total: classStudents.length };
  }, [classStudents, rollCall]);

  // Completion status for all assigned classes on today
  const assignedClassesStatus = useMemo(() => {
    const allAtt = IMSStateService.getStudentAttendance(user.activeCampusId);
    return assignedClasses.map((cls) => {
      const clsStudents = allStudents.filter((s) => s.classId === cls.id);
      const todayRecords = allAtt.filter((a) => a.classId === cls.id && a.date === todayStr);
      const isComplete = clsStudents.length > 0 && todayRecords.length >= clsStudents.length;
      return {
        class: cls,
        studentCount: clsStudents.length,
        recordedCount: todayRecords.length,
        isComplete,
      };
    });
  }, [assignedClasses, allStudents, todayStr, successToast]);

  // -------------------------------------------------------------
  // DEDICATED STUDENT ATTENDANCE HISTORY SECTION (Requirement 2.C)
  // Scoped strictly to teacher's assigned classes
  // -------------------------------------------------------------
  const [historyClassFilter, setHistoryClassFilter] = useState<string>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyPageSize, setHistoryPageSize] = useState<PageSizeOption>(20);

  const teacherAssignedClassIds = useMemo(
    () => assignedClasses.map((c) => c.id),
    [assignedClasses]
  );

  const allAssignedAttendance = useMemo(() => {
    const raw = IMSStateService.getStudentAttendance(user.activeCampusId);
    return raw.filter((r) => teacherAssignedClassIds.includes(r.classId));
  }, [user.activeCampusId, teacherAssignedClassIds, successToast]);

  const filteredHistoryRecords = useMemo(() => {
    return allAssignedAttendance.filter((rec) => {
      if (historyClassFilter !== 'ALL' && rec.classId !== historyClassFilter) return false;
      if (historyStatusFilter !== 'ALL' && rec.status !== historyStatusFilter) return false;
      if (historyStartDate && rec.date < historyStartDate) return false;
      if (historyEndDate && rec.date > historyEndDate) return false;
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(q);
        const matchId = rec.admissionNumber.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [
    allAssignedAttendance,
    historyClassFilter,
    historyStatusFilter,
    historyStartDate,
    historyEndDate,
    historySearchQuery,
  ]);

  const paginatedHistoryRecords = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredHistoryRecords.slice(start, start + historyPageSize);
  }, [filteredHistoryRecords, historyPage, historyPageSize]);

  // Quick Edit Record Modal state for Teacher Attendance History
  const [editingStudentRecord, setEditingStudentRecord] = useState<StudentAttendanceRecord | null>(null);
  const [editingStatus, setEditingStatus] = useState<StudentAttendanceStatus>('PRESENT');
  const [editingArrival, setEditingArrival] = useState<string>('16:45');
  const [editingRemarks, setEditingRemarks] = useState<string>('');

  const handleOpenEditRecord = (record: StudentAttendanceRecord) => {
    setEditingStudentRecord(record);
    setEditingStatus(record.status);
    setEditingArrival(record.arrivalTime || '16:45');
    setEditingRemarks(record.remarks || '');
  };

  const handleSaveEditedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentRecord) return;

    try {
      IMSStateService.recordStudentAttendanceSingle({
        studentId: editingStudentRecord.studentId,
        campusId: editingStudentRecord.campusId,
        classId: editingStudentRecord.classId,
        date: editingStudentRecord.date,
        status: editingStatus,
        arrivalTime: editingStatus !== 'ABSENT' ? editingArrival : undefined,
        remarks: editingRemarks.trim() || undefined,
        recordedBy: teacherProfile?.fullName || user.fullName,
      });

      triggerSuccess(
        `✓ Attendance record for ${editingStudentRecord.studentName} on ${editingStudentRecord.date} updated to ${editingStatus}.`
      );
      setEditingStudentRecord(null);
    } catch {
      triggerError('Failed to update attendance record.');
    }
  };

  // -------------------------------------------------------------
  // RESULTS STATE & ACTIONS
  // -------------------------------------------------------------
  const [resultsMode, setResultsMode] = useState<'QURAN' | 'EXAMS'>('QURAN');
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examStudentId, setExamStudentId] = useState(classStudents[0]?.id || '');
  const [examSubject, setExamSubject] = useState('Quranic Recitation & Tajweed');
  const [examAssessmentName, setExamAssessmentName] = useState('Monthly Tajweed Assessment');
  const [examMarksObtained, setExamMarksObtained] = useState(88);
  const [examMaxMarks, setExamMaxMarks] = useState(100);
  const [examGrade, setExamGrade] = useState('A');
  const [examTeacherRemarks, setExamTeacherRemarks] = useState('Good pronunciation and makharij.');

  const classExamResults = useMemo(() => {
    if (!currentClassId) return [];
    return IMSStateService.getExamResults().filter((r) => r.classId === currentClassId);
  }, [currentClassId, successToast]);

  const handleSaveExamResult = (e: React.FormEvent) => {
    e.preventDefault();
    const student = classStudents.find((s) => s.id === examStudentId) || classStudents[0];
    if (!student || !currentClass) return;

    IMSStateService.addExamResult({
      studentId: student.id,
      academicYear: '2025-2026',
      classId: currentClass.id,
      className: currentClass.name,
      teacherName: teacherProfile?.fullName || user.fullName,
      subject: examSubject,
      assessmentName: examAssessmentName,
      marksObtained: Number(examMarksObtained),
      maxMarks: Number(examMaxMarks),
      grade: examGrade,
      examDate: selectedDate,
      remarks: examTeacherRemarks,
    });

    triggerSuccess(`✓ Result saved for ${student.firstName} ${student.lastName} (Grade ${examGrade}).`);
    setIsExamModalOpen(false);
  };

  // Daily Quran progress
  const [selectedStudentForLog, setSelectedStudentForLog] = useState(classStudents[0]?.id || '');
  const [sabaqSurah, setSabaqSurah] = useState('Surah Al-Kahf');
  const [sabaqAyah, setSabaqAyah] = useState('Ayah 1 to 15');
  const [sabqiJuz, setSabqiJuz] = useState('Juz 15');
  const [manzilJuz, setManzilJuz] = useState('Juz 1');
  const [tajweedScore, setTajweedScore] = useState(5);
  const [feedback, setFeedback] = useState('Clear recitation with proper Waqf.');

  useEffect(() => {
    if (
      classStudents.length > 0 &&
      (!selectedStudentForLog || !classStudents.some((s) => s.id === selectedStudentForLog))
    ) {
      setSelectedStudentForLog(classStudents[0].id);
    }
  }, [classStudents, selectedStudentForLog]);

  const handleSaveQuranProgress = (e: React.FormEvent) => {
    e.preventDefault();
    const student = classStudents.find((s) => s.id === selectedStudentForLog) || classStudents[0];
    if (!student || !currentClass) return;

    IMSStateService.addAcademicProgress({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      campusId: user.activeCampusId,
      classId: currentClass.id,
      teacherId: teacherProfile?.id || 'tch-01',
      teacherName: teacherProfile?.fullName || user.fullName,
      date: selectedDate,
      sabaqSurah,
      sabaqAyah,
      sabqiJuz,
      manzilJuz,
      tajweedScore,
      feedback,
    });

    triggerSuccess(`✓ Quran progress saved for ${student.firstName} ${student.lastName}.`);
  };

  // Recent academic progress entries for teacher's classes
  const recentAcademicUpdates = useMemo(() => {
    const raw = IMSStateService.getAcademicProgress(user.activeCampusId);
    return raw.filter((p) => teacherAssignedClassIds.includes(p.classId)).slice(0, 5);
  }, [user.activeCampusId, teacherAssignedClassIds, successToast]);

  // Announcements & Events
  const announcements = IMSStateService.getAnnouncements(user.activeCampusId);
  const myTeacherAttendanceHistory = useMemo(() => {
    return allTeacherAttendance.filter((a) => a.teacherId === teacherProfile?.id);
  }, [allTeacherAttendance, teacherProfile?.id, successToast]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-24 sm:pb-10">
      {/* 1. PROFESSIONAL TEACHER HERO BANNER */}
      <div className="bg-gradient-to-r from-[#042413] via-[#093C20] to-[#042413] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#0F5A2F]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            {/* Avatar / Profile Initials */}
            <div className="w-14 h-14 rounded-2xl bg-[#E5C158] text-[#0D381E] font-display font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
              {teacherProfile?.fullName
                ? teacherProfile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'TQ'}
            </div>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#E5C158] font-bold text-xs uppercase tracking-wider">
                  Faculty Member
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white">
                  {teacherProfile?.employeeCode || 'TCH-001'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5C158]/20 text-[#F3D273] border border-[#E5C158]/40">
                  {campus?.name} ({campus?.currencyCode})
                </span>
              </div>

              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                Assalamu Alaikum, {teacherProfile?.fullName || user.fullName}
              </h2>

              <p className="text-xs text-[#E6E2D8]/90">
                Specialization: <strong className="text-[#F3D273]">{teacherProfile?.specialization || 'Quranic Sciences'}</strong> · Qualification: {teacherProfile?.qualification || 'Sanad'}
              </p>
            </div>
          </div>

          {/* Quick Working Class Selector */}
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 self-start md:self-center shrink-0 space-y-1">
            <label htmlFor="working-class-select" className="text-[11px] text-[#F3D273] font-bold block uppercase tracking-wider">
              Working Class Context:
            </label>
            <select
              id="working-class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={assignedClasses.length === 0}
              className="bg-[#072212] text-[#F3D273] font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg border border-[#16532d] focus:outline-hidden cursor-pointer disabled:opacity-60"
            >
              {assignedClasses.length === 0 ? (
                <option value="">No Classes Assigned</option>
              ) : (
                assignedClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.scheduleTime})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Toast Feedback Alerts */}
      {successToast && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="p-4 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2.5 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* 2. PRIMARY TOP NAVIGATION TABS */}
      <nav aria-label="Teacher Portal Navigation" className="bg-white rounded-xl border border-[#E6E2D8] p-1.5 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
            { id: 'my-classes', label: 'My Classes', icon: Users },
            { id: 'student-attendance', label: 'Take Attendance', icon: CalendarCheck },
            { id: 'attendance-history', label: 'Attendance History', icon: History },
            { id: 'my-attendance', label: 'My Check-In', icon: UserCheck },
            { id: 'results', label: 'Quran & Results', icon: Award },
            { id: 'more', label: 'Resources', icon: MoreHorizontal },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id as TeacherPrimaryTab)}
                className={`min-h-[44px] flex-1 min-w-[120px] sm:min-w-0 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F3D273]' : 'text-[#57655B]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD (Comprehensive, Organised, Information-Rich)              */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5 animate-in fade-in">
          {/* TEACHER SELF-ATTENDANCE DAILY STATUS CARD (Authority Given to Teachers) */}
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0D381E] text-[#F3D273] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0D381E]">
                    Teacher Daily Check-In Authority
                  </h3>
                  <p className="text-xs text-[#57655B]">
                    Strict institute punctuality protocol · Campus Clock:{' '}
                    <strong className="text-[#0D381E] font-mono">{formatTime12h(effectiveTime)}</strong>
                  </p>
                </div>
              </div>

              {/* Status or Check-in trigger */}
              <div className="flex items-center space-x-2">
                {myTodayAttendance ? (
                  <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-emerald-900 font-semibold">
                      Checked in today at {myTodayAttendance.checkInTime ? formatTime12h(myTodayAttendance.checkInTime) : 'Session start'} as{' '}
                      <strong className="uppercase">{myTodayAttendance.status}</strong>
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCheckInModalOpen(true)}
                    className="px-4 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Record My Attendance for Today</span>
                  </button>
                )}
              </div>
            </div>

            {/* Time Rule Status Pill & Presets Banner */}
            <div className="bg-[#F9F8F4] p-3 rounded-xl border border-[#E6E2D8] flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#0D381E]">Active Window:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      currentRule.window === 'UP_TO_5PM'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentRule.window === 'LATE_WINDOW_5_01_TO_5_30'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {currentRule.windowLabel}
                  </span>
                </div>
                <p className="text-[11px] text-[#57655B]">{currentRule.ruleExplanation}</p>
              </div>

              {/* Quick test preset switcher */}
              <div className="flex items-center space-x-1.5 text-[11px]">
                <span className="text-[#57655B] font-bold">Test Rule:</span>
                <button
                  onClick={() => {
                    setIsSimulatedMode(true);
                    setSimulatedTime('16:50:00');
                  }}
                  className="px-2 py-1 bg-white border border-[#D8D2C5] rounded hover:bg-[#F4F3EE] cursor-pointer"
                  title="Simulate 4:50 PM (Present or Absent permitted)"
                >
                  4:50 PM
                </button>
                <button
                  onClick={() => {
                    setIsSimulatedMode(true);
                    setSimulatedTime('17:15:00');
                  }}
                  className="px-2 py-1 bg-white border border-[#D8D2C5] rounded hover:bg-[#F4F3EE] cursor-pointer"
                  title="Simulate 5:15 PM (Late or Absent permitted)"
                >
                  5:15 PM
                </button>
                <button
                  onClick={() => {
                    setIsSimulatedMode(true);
                    setSimulatedTime('17:35:00');
                  }}
                  className="px-2 py-1 bg-white border border-[#D8D2C5] rounded hover:bg-[#F4F3EE] cursor-pointer"
                  title="Simulate 5:35 PM (Absent only enforced)"
                >
                  5:35 PM
                </button>
                {isSimulatedMode && (
                  <button
                    onClick={() => setIsSimulatedMode(false)}
                    className="p-1 text-rose-700 hover:text-rose-900 cursor-pointer"
                    title="Reset to live time"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4 SUMMARY METRICS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Students */}
            <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs">
              <div className="text-[11px] font-bold text-[#57655B] uppercase tracking-wider flex items-center justify-between">
                <span>My Students</span>
                <GraduationCap className="w-4 h-4 text-[#0D381E]" />
              </div>
              <div className="text-2xl font-bold text-[#0D381E] font-mono mt-1 tabular-nums">
                {totalAssignedStudentsCount}
              </div>
              <p className="text-[11px] text-[#57655B] mt-0.5">Across {assignedClasses.length} assigned classes</p>
            </div>

            {/* Assigned Classes */}
            <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs">
              <div className="text-[11px] font-bold text-[#57655B] uppercase tracking-wider flex items-center justify-between">
                <span>Active Classes</span>
                <BookOpen className="w-4 h-4 text-[#0D381E]" />
              </div>
              <div className="text-2xl font-bold text-[#0D381E] font-mono mt-1 tabular-nums">
                {assignedClasses.length}
              </div>
              <p className="text-[11px] text-[#57655B] mt-0.5">Classrooms assigned to you</p>
            </div>

            {/* Today Attendance Progress */}
            <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs">
              <div className="text-[11px] font-bold text-[#57655B] uppercase tracking-wider flex items-center justify-between">
                <span>Today's Roll-Call</span>
                <CalendarCheck className="w-4 h-4 text-[#0D381E]" />
              </div>
              <div className="text-2xl font-bold text-[#0D381E] font-mono mt-1 tabular-nums">
                {assignedClassesStatus.filter((c) => c.isComplete).length} / {assignedClasses.length}
              </div>
              <p className="text-[11px] text-[#57655B] mt-0.5">Classes marked completed</p>
            </div>

            {/* Academic Sabaq Updates */}
            <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs">
              <div className="text-[11px] font-bold text-[#57655B] uppercase tracking-wider flex items-center justify-between">
                <span>Sabaq Logs</span>
                <Award className="w-4 h-4 text-[#0D381E]" />
              </div>
              <div className="text-2xl font-bold text-[#0D381E] font-mono mt-1 tabular-nums">
                {recentAcademicUpdates.length}
              </div>
              <p className="text-[11px] text-[#57655B] mt-0.5">Recent progress evaluations</p>
            </div>
          </div>

          {/* ASSIGNED CLASSES & ATTENDANCE COMPLETION STATUS */}
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#0D381E]">
                  Assigned Classes & Today's Attendance Status
                </h3>
                <p className="text-xs text-[#57655B]">
                  Live status of daily roll-call completion for your assigned cohorts ({todayStr})
                </p>
              </div>
              <button
                onClick={() => handleTabClick('attendance-history')}
                className="text-xs font-bold text-[#0D381E] hover:underline flex items-center space-x-1"
              >
                <span>View Full History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {assignedClasses.length === 0 ? (
              <div className="p-8 text-center bg-[#F9F8F4] rounded-xl border border-dashed border-[#D8D2C5] space-y-2">
                <BookOpen className="w-8 h-8 text-[#57655B] mx-auto opacity-40" />
                <p className="text-sm font-bold text-[#0D381E]">No Classes Assigned Yet</p>
                <p className="text-xs text-[#57655B]">
                  Cohorts assigned to your faculty profile by administrators will appear here with live attendance status.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {assignedClassesStatus.map((item) => (
                  <div
                    key={item.class.id}
                    className="p-4 rounded-xl border border-[#E6E2D8] bg-[#F9F8F4] flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-base text-[#0D381E]">
                          {item.class.name}
                        </h4>
                        <p className="text-xs text-[#57655B]">
                          Schedule: <strong className="text-[#0D381E]">{item.class.scheduleTime}</strong> · Days: {item.class.scheduleDays.join(', ')}
                        </p>
                        <p className="text-xs text-[#57655B] mt-0.5">
                          Enrolled Students: <strong className="text-[#0D381E] font-mono">{item.studentCount}</strong> pupils
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.isComplete
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.isComplete ? '✓ Roll-Call Done' : 'Pending Roll-Call'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E6E2D8]">
                      <span className="text-xs text-[#57655B]">
                        Recorded today: <strong className="text-[#0D381E] font-mono">{item.recordedCount}</strong> of {item.studentCount}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedClassId(item.class.id);
                          handleTabClick('student-attendance');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                      >
                        {item.isComplete ? 'Review Attendance' : 'Take Attendance'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TWO-COLUMN LOWER SECTION: RECENT ACADEMIC UPDATES & ANNOUNCEMENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent Quranic Progress Updates */}
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
                <h3 className="font-heading font-bold text-base text-[#0D381E] flex items-center space-x-2">
                  <Award className="w-4 h-4 text-[#E5C158]" />
                  <span>Recent Sabaq & Academic Updates</span>
                </h3>
                <button
                  onClick={() => handleTabClick('results')}
                  className="text-xs font-bold text-[#0D381E] hover:underline"
                >
                  Log Sabaq
                </button>
              </div>

              {recentAcademicUpdates.length === 0 ? (
                <p className="text-xs text-[#57655B] py-4 text-center">
                  No academic progress logs recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentAcademicUpdates.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#0D381E]">{rec.studentName}</strong>
                        <span className="text-[#57655B] font-mono text-[11px]">{rec.date}</span>
                      </div>
                      <p className="text-[#57655B]">
                        Sabaq: <strong>{rec.sabaqSurah || 'N/A'}</strong> ({rec.sabaqAyah || 'Full'}) · Tajweed: {rec.tajweedScore || 5}/5
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Announcements & Important Notifications */}
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
                <h3 className="font-heading font-bold text-base text-[#0D381E] flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-[#E5C158]" />
                  <span>Announcements & Notifications</span>
                </h3>
                <span className="text-xs text-[#57655B] font-medium">Faculty Feed</span>
              </div>

              {announcements.length === 0 ? (
                <p className="text-xs text-[#57655B] py-4 text-center">
                  No recent campus announcements.
                </p>
              ) : (
                <div className="space-y-2">
                  {announcements.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[#0D381E]">{item.title}</h4>
                        <span className="text-[10px] text-[#57655B] font-mono">{item.publishedAt}</span>
                      </div>
                      <p className="text-[#57655B] line-clamp-2">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY CLASSES VIEW (Full Roster, Schedule, Parent Contacts)           */}
      {/* ========================================================================= */}
      {activeTab === 'my-classes' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                Assigned Classes Directory
              </h3>
              <p className="text-xs text-[#57655B]">
                Review your assigned classrooms, pupil lists, and take roll-call.
              </p>
            </div>
            <span className="px-3 py-1 bg-[#0D381E]/10 text-[#0D381E] font-bold text-xs rounded-lg">
              {assignedClasses.length} Assigned Classes
            </span>
          </div>

          {assignedClasses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-[#57655B] mx-auto opacity-50" />
              <h4 className="font-heading font-bold text-lg text-[#0D381E]">No Classes Assigned</h4>
              <p className="text-xs text-[#57655B] max-w-md mx-auto">
                You are not currently designated as the lead teacher for any cohorts at {campus?.name || 'this campus'}. Contact your Campus Administrator or Super Admin to assign classrooms to your schedule.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedClasses.map((cls) => {
                const studentsInThisClass = allStudents.filter((s) => s.classId === cls.id);
                return (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-lg text-[#0D381E]">{cls.name}</h4>
                        <p className="text-xs text-[#57655B]">
                          Academic Year: <strong>{cls.academicYear}</strong> · Schedule: {cls.scheduleTime}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-[#0D381E] text-[#F3D273] font-bold text-xs font-mono">
                        {studentsInThisClass.length} Students
                      </span>
                    </div>

                    <div className="text-xs text-[#57655B] space-y-1 bg-[#F9F8F4] p-3 rounded-xl border border-[#E6E2D8]">
                      <div className="flex justify-between">
                        <span>Schedule Days:</span>
                        <strong className="text-[#0D381E]">{cls.scheduleDays.join(', ')}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span>{cls.capacity} seats</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#0D381E] block">Enrolled Pupils:</span>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {studentsInThisClass.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E6E2D8] text-xs"
                          >
                            <div>
                              <span className="font-semibold text-[#1A231E]">
                                {s.firstName} {s.lastName}
                              </span>
                              <span className="text-[10px] text-[#57655B] font-mono ml-2">
                                {s.admissionNumber}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#57655B]">{s.primaryParentPhone || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          handleTabClick('student-attendance');
                        }}
                        className="px-4 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Take Attendance</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TAKE STUDENT ATTENDANCE (Roll-Call Primary Teacher Function)        */}
      {/* ========================================================================= */}
      {activeTab === 'student-attendance' && (
        assignedClasses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6E2D8] p-10 text-center space-y-3">
            <CalendarCheck className="w-10 h-10 text-[#57655B] mx-auto opacity-50" />
            <h4 className="font-heading font-bold text-lg text-[#0D381E]">No Assigned Classes</h4>
            <p className="text-xs text-[#57655B] max-w-md mx-auto">
              You do not have any assigned cohorts to take attendance for. Once cohorts are allocated to your schedule by the administration, roll-call will be available here.
            </p>
          </div>
        ) : (
        <div className="space-y-4 animate-in fade-in">
          {/* Header & Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D8] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                  Class Attendance Roll-Call
                </h3>
                <p className="text-xs text-[#57655B]">
                  Class: <strong>{currentClass?.name}</strong> · Enrolled:{' '}
                  <strong>{classStudents.length} Students</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 bg-[#F4F3EE] hover:bg-[#E6E2D8] border border-[#D8D2C5] text-[#0D381E] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Mark All Present
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="px-4 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>

            {/* Date Selector & Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] text-xs">
              <div className="flex items-center space-x-2">
                <label htmlFor="attendance-date-input" className="font-bold text-[#0D381E]">Attendance Date:</label>
                <input
                  id="attendance-date-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#D8D2C5] rounded-lg font-mono font-bold text-[#0D381E] cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <span className="text-emerald-800 font-bold">Present: {summaryCounts.present}</span>
                <span className="text-amber-800 font-bold">Late: {summaryCounts.late}</span>
                <span className="text-rose-800 font-bold">Absent: {summaryCounts.absent}</span>
                {hasUnsavedChanges && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px] animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Student Roll Call Table */}
          <div className="bg-white rounded-2xl border border-[#E6E2D8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Student ID</th>
                    <th className="py-3 px-4 font-semibold text-center">Present</th>
                    <th className="py-3 px-4 font-semibold text-center">Late</th>
                    <th className="py-3 px-4 font-semibold text-center">Absent</th>
                    <th className="py-3 px-4 font-semibold">Arrival Time</th>
                    <th className="py-3 px-4 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#57655B]">
                        No students enrolled in this class yet.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((s) => {
                      const currentStatus = rollCall[s.id]?.status || 'PRESENT';
                      const currentRemarks = rollCall[s.id]?.remarks || '';
                      const currentArrival = rollCall[s.id]?.arrivalTime || '';

                      return (
                        <tr key={s.id} className="hover:bg-[#F9F8F4]">
                          <td className="py-3 px-4 font-bold text-[#1A231E]">
                            {s.firstName} {s.lastName}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#0D381E]">
                            {s.admissionNumber}
                          </td>

                          {/* Present radio */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'PRESENT')}
                              className={`w-8 h-8 rounded-lg font-bold text-xs inline-flex items-center justify-center cursor-pointer transition-all ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              P
                            </button>
                          </td>

                          {/* Late radio */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'LATE')}
                              className={`w-8 h-8 rounded-lg font-bold text-xs inline-flex items-center justify-center cursor-pointer transition-all ${
                                currentStatus === 'LATE'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                              }`}
                            >
                              L
                            </button>
                          </td>

                          {/* Absent radio */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'ABSENT')}
                              className={`w-8 h-8 rounded-lg font-bold text-xs inline-flex items-center justify-center cursor-pointer transition-all ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-700 text-white shadow-xs'
                                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                              }`}
                            >
                              A
                            </button>
                          </td>

                          {/* Arrival time */}
                          <td className="py-3 px-4 font-mono">
                            <input
                              type="time"
                              value={currentArrival}
                              onChange={(e) => {
                                setRollCall((prev) => ({
                                  ...prev,
                                  [s.id]: {
                                    ...prev[s.id],
                                    status: currentStatus,
                                    remarks: currentRemarks,
                                    arrivalTime: e.target.value,
                                  },
                                }));
                                setHasUnsavedChanges(true);
                              }}
                              className="px-2 py-1 bg-[#F9F8F4] border border-[#E6E2D8] rounded text-xs"
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Notes..."
                              value={currentRemarks}
                              onChange={(e) => {
                                setRollCall((prev) => ({
                                  ...prev,
                                  [s.id]: {
                                    ...prev[s.id],
                                    status: currentStatus,
                                    arrivalTime: currentArrival,
                                    remarks: e.target.value,
                                  },
                                }));
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full px-2 py-1 bg-[#F9F8F4] border border-[#E6E2D8] rounded text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] flex items-center justify-between">
              <span className="text-xs text-[#57655B]">
                Class: {currentClass?.name} · Total: {classStudents.length} pupils
              </span>

              <button
                onClick={handleSaveAttendance}
                className="px-5 py-2.5 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Class Attendance</span>
              </button>
            </div>
          </div>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DEDICATED ATTENDANCE HISTORY (Requirement 2.C)                      */}
      {/* ========================================================================= */}
      {activeTab === 'attendance-history' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                Student Attendance History
              </h3>
              <p className="text-xs text-[#57655B]">
                Historical records for your assigned classes ({assignedClasses.map((c) => c.name).join(', ')})
              </p>
            </div>
            <span className="px-3 py-1 bg-[#0D381E]/10 text-[#0D381E] font-bold text-xs rounded-lg">
              {filteredHistoryRecords.length} Historical Entries
            </span>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
              {/* Student Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57655B]" />
                <input
                  type="text"
                  placeholder="Search student name or admission ID..."
                  value={historySearchQuery}
                  onChange={(e) => {
                    setHistorySearchQuery(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-hidden focus:border-[#0D381E]"
                />
              </div>

              {/* Class Filter */}
              <div>
                <select
                  value={historyClassFilter}
                  onChange={(e) => {
                    setHistoryClassFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#0D381E]"
                >
                  <option value="ALL">All Assigned Classes</option>
                  {assignedClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => {
                    setHistoryStatusFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#0D381E]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center space-x-1.5">
                <input
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => {
                    setHistoryStartDate(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full px-2 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono"
                  title="From Date"
                />
                <span>-</span>
                <input
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => {
                    setHistoryEndDate(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full px-2 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono"
                  title="To Date"
                />
              </div>
            </div>

            {/* Top Pagination Bar with 20 | 50 | 100 | 500 selector */}
            <PaginationControl
              currentPage={historyPage}
              pageSize={historyPageSize}
              totalRecords={filteredHistoryRecords.length}
              onPageChange={setHistoryPage}
              onPageSizeChange={setHistoryPageSize}
              showTopBar={true}
              itemName="attendance records"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#E6E2D8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                    <th className="py-3 px-3 font-semibold">Student Name</th>
                    <th className="py-3 px-3 font-semibold">Student ID</th>
                    <th className="py-3 px-3 font-semibold">Class</th>
                    <th className="py-3 px-3 font-semibold">Attendance Date</th>
                    <th className="py-3 px-3 font-semibold">Arrival Time</th>
                    <th className="py-3 px-3 font-semibold">Attendance Status</th>
                    <th className="py-3 px-3 font-semibold">Recorded By</th>
                    <th className="py-3 px-3 font-semibold">Last Updated</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {paginatedHistoryRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#57655B]">
                        No historical attendance records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistoryRecords.map((r) => {
                      const cls =
                        r.className ||
                        assignedClasses.find((c) => c.id === r.classId)?.name ||
                        r.classId;

                      return (
                        <tr key={r.id} className="hover:bg-[#F9F8F4]">
                          <td className="py-3 px-3 font-bold text-[#1A231E]">
                            {r.studentName}
                            {r.remarks && (
                              <div className="text-[10px] text-[#57655B] font-normal italic">
                                {r.remarks}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[#0D381E]">
                            {r.admissionNumber}
                          </td>
                          <td className="py-3 px-3 text-[#57655B] font-medium">{cls}</td>
                          <td className="py-3 px-3 font-mono font-bold text-[#0D381E]">{r.date}</td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {r.arrivalTime ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {r.arrivalTime}
                              </span>
                            ) : (
                              <span className="text-[#57655B]/60 italic">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="py-3 px-3 text-[#57655B]">{r.recordedBy}</td>
                          <td className="py-3 px-3 text-[#57655B] font-mono text-[11px]">
                            {r.updatedAt ? r.updatedAt.replace('T', ' ').substring(0, 16) : r.date}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenEditRecord(r)}
                                className="px-2.5 py-1 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs flex items-center space-x-1 cursor-pointer shadow-2xs"
                                title="Edit this student's attendance record"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit Record</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedClassId(r.classId);
                                  setSelectedDate(r.date);
                                  handleTabClick('student-attendance');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#F4F3EE] hover:bg-[#E6E2D8] border border-[#D8D2C5] text-[#0D381E] font-semibold text-xs flex items-center space-x-1 cursor-pointer"
                                title="Open full class session in Take Attendance"
                              >
                                <CalendarCheck className="w-3 h-3 text-[#0D381E]" />
                                <span className="hidden sm:inline">Roll-Call</span>
                              </button>
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
              currentPage={historyPage}
              pageSize={historyPageSize}
              totalRecords={filteredHistoryRecords.length}
              onPageChange={setHistoryPage}
              onPageSizeChange={setHistoryPageSize}
              itemName="attendance records"
              className="border-t border-[#E6E2D8] rounded-none rounded-b-2xl"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MY ATTENDANCE & CHECK-IN HISTORY                                    */}
      {/* ========================================================================= */}
      {activeTab === 'my-attendance' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                My Attendance & Arrival History
              </h3>
              <p className="text-xs text-[#57655B]">
                Teacher ID: <strong>{teacherProfile?.employeeCode}</strong> · Check-in history under strict institute punctuality rules.
              </p>
            </div>

            <button
              onClick={() => setIsCheckInModalOpen(true)}
              className="px-4 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Record Today's Attendance</span>
            </button>
          </div>

          {/* History List */}
          <div className="bg-white rounded-2xl border border-[#E6E2D8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Arrival Time</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Rule Applied</th>
                    <th className="py-3 px-4 font-semibold">Recorded By</th>
                    <th className="py-3 px-4 font-semibold">Remarks & Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {myTeacherAttendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#57655B]">
                        No teacher attendance records logged for your profile yet.
                      </td>
                    </tr>
                  ) : (
                    myTeacherAttendanceHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#F9F8F4]">
                        <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{rec.date}</td>
                        <td className="py-3 px-4 font-mono">
                          {rec.checkInTime ? formatTime12h(rec.checkInTime) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={rec.status} />
                        </td>
                        <td className="py-3 px-4 text-[#57655B]">
                          {rec.ruleApplied || 'Standard'}
                        </td>
                        <td className="py-3 px-4 text-[#57655B]">{rec.recordedBy}</td>
                        <td className="py-3 px-4 text-[#57655B]">{rec.remarks || 'Regular duty'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RESULTS & QURAN PROGRESS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'results' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D8] shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-xl text-[#0D381E]">
                Student Progress & Exam Results
              </h3>
              <p className="text-xs text-[#57655B]">
                Log daily Sabaq/Hifz progress and formal term exam results.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-[#F4F3EE] p-1 rounded-xl border border-[#E6E2D8]">
              <button
                onClick={() => setResultsMode('QURAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  resultsMode === 'QURAN'
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B]'
                }`}
              >
                Daily Sabaq Log
              </button>
              <button
                onClick={() => setResultsMode('EXAMS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  resultsMode === 'EXAMS'
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B]'
                }`}
              >
                Term Exams
              </button>
            </div>
          </div>

          {resultsMode === 'QURAN' ? (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs">
              <form onSubmit={handleSaveQuranProgress} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0D381E] mb-1">Select Student:</label>
                    <select
                      value={selectedStudentForLog}
                      onChange={(e) => setSelectedStudentForLog(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg font-semibold"
                    >
                      {classStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.admissionNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0D381E] mb-1">Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-[#0D381E] mb-1">Sabaq (Surah/Lesson):</label>
                    <input
                      type="text"
                      value={sabaqSurah}
                      onChange={(e) => setSabaqSurah(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0D381E] mb-1">Ayah / Lesson Range:</label>
                    <input
                      type="text"
                      value={sabaqAyah}
                      onChange={(e) => setSabaqAyah(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0D381E] mb-1">Sabqi (Recent Revision):</label>
                    <input
                      type="text"
                      value={sabqiJuz}
                      onChange={(e) => setSabqiJuz(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0D381E] mb-1">Manzil (Major Revision):</label>
                    <input
                      type="text"
                      value={manzilJuz}
                      onChange={(e) => setManzilJuz(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Teacher Feedback & Makharij Observation:</label>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0D381E] text-[#F3D273] font-bold text-xs rounded-xl cursor-pointer hover:bg-[#16532d] shadow-xs"
                >
                  Save Daily Sabaq Progress
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-[#0D381E]">Exam & Assessment Results</h4>
                <button
                  onClick={() => setIsExamModalOpen(true)}
                  className="px-3 py-1.5 bg-[#0D381E] text-[#F3D273] font-bold text-xs rounded-lg cursor-pointer"
                >
                  + Add Exam Result
                </button>
              </div>

              <div className="border border-[#E6E2D8] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F3EE] font-semibold text-[#0D381E]">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Assessment</th>
                      <th className="p-3">Marks</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2D8]">
                    {classExamResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-[#57655B]">
                          No exam results logged for this class yet.
                        </td>
                      </tr>
                    ) : (
                      classExamResults.map((er) => {
                        const std = classStudents.find((s) => s.id === er.studentId);
                        return (
                          <tr key={er.id} className="hover:bg-[#F9F8F4]">
                            <td className="p-3 font-bold text-[#0D381E]">
                              {std ? `${std.firstName} ${std.lastName}` : er.studentId}
                            </td>
                            <td className="p-3 text-[#57655B]">{er.assessmentName}</td>
                            <td className="p-3 font-mono font-bold">
                              {er.marksObtained} / {er.maxMarks}
                            </td>
                            <td className="p-3 font-bold text-emerald-800">{er.grade}</td>
                            <td className="p-3 font-mono text-[#57655B]">{er.examDate}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: MORE OPTIONS & TEACHING RESOURCES                                   */}
      {/* ========================================================================= */}
      {activeTab === 'more' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D8] shadow-xs">
            <h3 className="font-heading font-bold text-xl text-[#0D381E]">
              Faculty Resources & Announcements
            </h3>
            <p className="text-xs text-[#57655B]">
              Teaching handouts, syllabi, and campus announcements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Announcements */}
            <div className="bg-white p-5 rounded-2xl border border-[#E6E2D8] shadow-xs space-y-3">
              <h4 className="font-bold text-[#0D381E] flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#E5C158]" />
                <span>Campus Announcements</span>
              </h4>
              <div className="space-y-2">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] text-xs">
                    <strong className="text-[#0D381E]">{a.title}</strong>
                    <p className="text-[#57655B] mt-1">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Profile Summary Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E6E2D8] shadow-xs space-y-3">
              <h4 className="font-bold text-[#0D381E] flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-[#E5C158]" />
                <span>My Faculty Profile</span>
              </h4>
              <div className="space-y-2 text-xs bg-[#F9F8F4] p-3 rounded-xl border border-[#E6E2D8]">
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Full Name:</span>
                  <strong className="text-[#0D381E]">{teacherProfile?.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Employee Code:</span>
                  <span className="font-mono">{teacherProfile?.employeeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Email:</span>
                  <span>{teacherProfile?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Campus:</span>
                  <strong>{campus?.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Assigned Classes:</span>
                  <span>{assignedClasses.map((c) => c.name).join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Official Documents, Ijazahs, & Employment Contracts */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E2D8] shadow-xs">
            <DocumentManagerComponent
              entityType="TEACHER"
              entityId={teacherProfile?.id || user.teacherProfileId || user.id}
              entityName={teacherProfile?.fullName || user.fullName || 'Faculty Member'}
              campusId={teacherProfile?.campusId || user.activeCampusId || 'uk'}
              userRole="TEACHER"
              initialDocuments={teacherProfile?.documents || []}
              canUpload={true}
              canDelete={false}
            />
          </div>
        </div>
      )}

      {/* MODAL: TEACHER SELF CHECK-IN ATTENDANCE (Strict Time Rules Enforced) */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Daily Teacher Check-In
                </h3>
              </div>
              <button
                onClick={() => setIsCheckInModalOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSelfCheckIn} className="p-5 space-y-4 text-xs">
              <div className="bg-[#F9F8F4] p-3 rounded-xl border border-[#E6E2D8] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Teacher:</span>
                  <strong className="text-[#0D381E]">{teacherProfile?.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Teacher ID:</span>
                  <span className="font-mono">{teacherProfile?.employeeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Date:</span>
                  <span className="font-mono font-bold text-[#0D381E]">{todayStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Arrival / Check-In Time:</span>
                  <strong className="font-mono text-[#0D381E]">{formatTime12h(effectiveTime)}</strong>
                </div>
              </div>

              {/* Rule Window Notice */}
              <div
                className={`p-3 rounded-xl border space-y-1 ${
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

              {/* Permitted Status Choices Only */}
              <div>
                <label className="block font-bold text-[#0D381E] mb-1.5">
                  Confirm Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={!currentRule.allowedStatuses.includes('PRESENT')}
                    onClick={() => setSelfCheckInStatus('PRESENT')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                      selfCheckInStatus === 'PRESENT'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : currentRule.allowedStatuses.includes('PRESENT')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Present
                    {!currentRule.allowedStatuses.includes('PRESENT') && ' (Locked)'}
                  </button>

                  <button
                    type="button"
                    disabled={!currentRule.allowedStatuses.includes('LATE')}
                    onClick={() => setSelfCheckInStatus('LATE')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                      selfCheckInStatus === 'LATE'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : currentRule.allowedStatuses.includes('LATE')
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Late
                    {!currentRule.allowedStatuses.includes('LATE') && ' (Locked)'}
                  </button>

                  <button
                    type="button"
                    disabled={!currentRule.allowedStatuses.includes('ABSENT')}
                    onClick={() => setSelfCheckInStatus('ABSENT')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                      selfCheckInStatus === 'ABSENT'
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
                  placeholder="e.g. Conducted daily lesson halaqah..."
                  value={selfCheckInRemarks}
                  onChange={(e) => setSelfCheckInRemarks(e.target.value)}
                  className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#D8D2C5] text-[#57655B] font-semibold text-xs cursor-pointer hover:bg-[#F4F3EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer hover:bg-[#16532d] shadow-xs"
                >
                  Confirm & Submit Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXAM RESULT */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between border-b border-[#E5C158]/30">
              <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                Log Student Assessment Result
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamResult} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#0D381E] mb-1">Student:</label>
                <select
                  value={examStudentId}
                  onChange={(e) => setExamStudentId(e.target.value)}
                  className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                >
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0D381E] mb-1">Assessment Name:</label>
                <input
                  type="text"
                  value={examAssessmentName}
                  onChange={(e) => setExamAssessmentName(e.target.value)}
                  className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Marks:</label>
                  <input
                    type="number"
                    value={examMarksObtained}
                    onChange={(e) => setExamMarksObtained(Number(e.target.value))}
                    className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Max Marks:</label>
                  <input
                    type="number"
                    value={examMaxMarks}
                    onChange={(e) => setExamMaxMarks(Number(e.target.value))}
                    className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Grade:</label>
                  <input
                    type="text"
                    value={examGrade}
                    onChange={(e) => setExamGrade(e.target.value)}
                    className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0D381E] mb-1">Teacher Remarks:</label>
                <input
                  type="text"
                  value={examTeacherRemarks}
                  onChange={(e) => setExamTeacherRemarks(e.target.value)}
                  className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-3 py-1.5 border border-[#D8D2C5] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0D381E] text-[#F3D273] font-bold rounded-lg text-xs"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT ATTENDANCE RECORD (Dedicated Edit Record Action) */}
      {editingStudentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Edit Attendance Record
                </h3>
              </div>
              <button
                onClick={() => setEditingStudentRecord(null)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRecord} className="p-5 space-y-4 text-xs">
              <div className="bg-[#F9F8F4] p-3 rounded-xl border border-[#E6E2D8] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Student Name:</span>
                  <strong className="text-[#0D381E]">{editingStudentRecord.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Student ID:</span>
                  <span className="font-mono">{editingStudentRecord.admissionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Attendance Date:</span>
                  <span className="font-mono font-bold text-[#0D381E]">{editingStudentRecord.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Previous Status:</span>
                  <StatusBadge status={editingStudentRecord.status} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0D381E] mb-1.5">
                  Update Attendance Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStatus('PRESENT')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                      editingStatus === 'PRESENT'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStatus('LATE')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                      editingStatus === 'LATE'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    Late
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStatus('ABSENT')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                      editingStatus === 'ABSENT'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>

              {editingStatus !== 'ABSENT' && (
                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">
                    Arrival Time:
                  </label>
                  <input
                    type="time"
                    value={editingArrival}
                    onChange={(e) => setEditingArrival(e.target.value)}
                    className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg font-mono font-bold text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-[#0D381E] mb-1">
                  Correction Note / Reason:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arrived with excuse / Adjusted following roll verification..."
                  value={editingRemarks}
                  onChange={(e) => setEditingRemarks(e.target.value)}
                  className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  onClick={() => setEditingStudentRecord(null)}
                  className="px-3.5 py-2 rounded-lg border border-[#D8D2C5] text-[#57655B] font-semibold text-xs cursor-pointer hover:bg-[#F4F3EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Edited Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
