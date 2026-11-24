import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Search,
  ArrowLeft,
  GraduationCap,
  Users,
  CalendarCheck,
  Award,
  CreditCard,
  BookOpen,
  Building2,
  CheckCircle2,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { UserSession } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { formatCampusCurrency } from '../../utils/currency.ts';

interface ReportsAndAnalyticsViewProps {
  user: UserSession;
  activeCampusId: string;
}

type ReportType =
  | 'students'
  | 'student-attendance'
  | 'teacher-attendance'
  | 'results'
  | 'payments'
  | 'teachers'
  | 'classes'
  | 'campus-summary';

export const ReportsAndAnalyticsView: React.FC<ReportsAndAnalyticsViewProps> = ({
  user,
  activeCampusId,
}) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const effectiveCampus = isSuperAdmin ? activeCampusId : user.activeCampusId;

  // Selected report state
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  // Filters inside opened report
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState(effectiveCampus);
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Real data sources
  const campuses = IMSStateService.getCampuses();
  const students = IMSStateService.getStudents(campusFilter === 'all' ? undefined : campusFilter);
  const teachers = IMSStateService.getTeachers(campusFilter === 'all' ? undefined : campusFilter);
  const classes = IMSStateService.getClasses(campusFilter === 'all' ? undefined : campusFilter);
  const payments = IMSStateService.getPayments(campusFilter === 'all' ? undefined : campusFilter);
  const studentAttendance = IMSStateService.getStudentAttendance(campusFilter === 'all' ? undefined : campusFilter);
  const teacherAttendance = IMSStateService.getTeacherAttendance(campusFilter === 'all' ? undefined : campusFilter);
  const examResults = IMSStateService.getExamResults();

  // List of Available Reports
  const reportListItems: {
    id: ReportType;
    name: string;
    description: string;
    icon: any;
    count: number;
    authorizedRoles: string[];
  }[] = [
    {
      id: 'students',
      name: 'Student Records',
      description: 'Enrolled students, official admission IDs, gender, assigned grades, and parent contacts.',
      icon: GraduationCap,
      count: students.length,
      authorizedRoles: ['SUPER_ADMIN', 'CAMPUS_ADMIN', 'TEACHER'],
    },
    {
      id: 'student-attendance',
      name: 'Student Attendance',
      description: 'Official roll-call records, dates, attendance statuses (Present, Absent, Late), and recorded by timestamps.',
      icon: CalendarCheck,
      count: studentAttendance.length,
      authorizedRoles: ['SUPER_ADMIN', 'CAMPUS_ADMIN', 'TEACHER'],
    },
    {
      id: 'teacher-attendance',
      name: 'Teacher Attendance',
      description: 'Daily faculty sign-ins, punctuality check-in/out logs, leaves, and recorded audit details.',
      icon: CalendarCheck,
      count: teacherAttendance.length,
      authorizedRoles: ['SUPER_ADMIN', 'CAMPUS_ADMIN'],
    },
    {
      id: 'results',
      name: 'Results',
      description: 'Academic exam scores, grades, marks obtained, assessments, and Quranic learning outcomes.',
      icon: Award,
      count: examResults.length,
      authorizedRoles: ['SUPER_ADMIN', 'CAMPUS_ADMIN', 'TEACHER'],
    },
    {
      id: 'payments',
      name: 'Fees & Payments',
      description: 'Tuition fees, admission payments, invoices, amounts due and paid, and payment statuses.',
      icon: CreditCard,
      count: payments.length,
      authorizedRoles: ['SUPER_ADMIN', 'CAMPUS_ADMIN'],
    },
    {
      id: 'teachers',
      name: 'Teacher Records',
      description: 'Faculty directory, employee codes, specializations, qualifications, and assigned classes.',
      icon: Users,
      count: teachers.length,
      authorizedRoles: ['SUPER_ADMIN', 'CAMPUS_ADMIN'],
    },
    {
      id: 'classes',
      name: 'Classes',
      description: 'Active classrooms and halaqahs, assigned lead teachers, schedules, and capacity occupancy.',
      icon: BookOpen,
      count: classes.length,
      authorizedRoles: ['SUPER_ADMIN', 'CAMPUS_ADMIN', 'TEACHER'],
    },
    {
      id: 'campus-summary',
      name: 'Campus Summary',
      description: 'Operational overview across campus branches, student & teacher totals, and attendance rates.',
      icon: Building2,
      count: campuses.length,
      authorizedRoles: ['SUPER_ADMIN', 'CAMPUS_ADMIN'],
    },
  ];

  // Filter list by role permissions
  const authorizedReportList = reportListItems.filter((r) =>
    r.authorizedRoles.includes(user.role)
  );

  // Export current table to CSV
  const handleExportCurrentReport = () => {
    let header = '';
    let rows: string[] = [];
    const dateStr = new Date().toISOString().split('T')[0];

    switch (selectedReport) {
      case 'students':
        header = 'Admission ID,First Name,Last Name,Campus,Class,Gender,Parent Name,Parent Phone\n';
        rows = students.map(
          (s) =>
            `"${s.admissionNumber}","${s.firstName}","${s.lastName}","${s.campusId.toUpperCase()}","${s.className || ''}","${s.gender}","${s.primaryParentName || ''}","${s.primaryParentPhone || ''}"`
        );
        break;
      case 'student-attendance':
        header = 'Date,Student ID,Student Name,Campus,Class,Status,Recorded By\n';
        rows = studentAttendance.map(
          (a) =>
            `"${a.date}","${a.admissionNumber}","${a.studentName}","${a.campusId.toUpperCase()}","${a.classId}","${a.status}","${a.recordedBy}"`
        );
        break;
      case 'teacher-attendance':
        header = 'Date,Teacher Name,Code,Campus,Status,Check In,Recorded By\n';
        rows = teacherAttendance.map(
          (a) =>
            `"${a.date}","${a.teacherName}","${a.teacherCode}","${a.campusId.toUpperCase()}","${a.status}","${a.checkInTime || ''}","${a.recordedBy}"`
        );
        break;
      case 'results':
        header = 'Student Name,Class,Assessment,Date,Marks Obtained,Max Marks,Grade,Teacher\n';
        rows = examResults.map(
          (r) =>
            `"${r.studentId}","${r.className}","${r.assessmentName}","${r.examDate}","${r.marksObtained}","${r.maxMarks}","${r.grade}","${r.teacherName}"`
        );
        break;
      case 'payments':
        header = 'Invoice Number,Student Name,Campus,Title,Currency,Amount Due,Amount Paid,Status,Due Date\n';
        rows = payments.map(
          (p) =>
            `"${p.invoiceNumber}","${p.studentName}","${p.campusId.toUpperCase()}","${p.title}","${p.currency || (p.campusId === 'kts' ? 'PKR' : 'GBP')}","${p.amountDue}","${p.amountPaid}","${p.status}","${p.dueDate}"`
        );
        break;
      case 'teachers':
        header = 'Employee Code,Full Name,Campus,Specialization,Qualification,Status\n';
        rows = teachers.map(
          (t) =>
            `"${t.employeeCode}","${t.fullName}","${t.campusId.toUpperCase()}","${t.specialization}","${t.qualification}","${t.employmentStatus}"`
        );
        break;
      case 'classes':
        header = 'Class Name,Campus,Lead Teacher,Capacity,Enrolled,Schedule\n';
        rows = classes.map(
          (c) =>
            `"${c.name}","${c.campusId.toUpperCase()}","${c.leadTeacherName || ''}","${c.capacity}","${c.studentCount}","${c.scheduleDays.join(' ')}"`
        );
        break;
      case 'campus-summary':
        header = 'Campus Name,Code,City,Country,Students,Teachers,Classes,Status\n';
        rows = campuses.map(
          (c) =>
            `"${c.name}","${c.code}","${c.city}","${c.country}","${c.studentCount || 0}","${c.teacherCount || 0}","${c.classCount || 0}","${c.isActive ? 'Active' : 'Inactive'}"`
        );
        break;
    }

    const csvContent = header + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Misbah_Report_${selectedReport}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ Report exported to CSV.');
  };

  // VIEW 1: Clean List of Reports
  if (!selectedReport) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-xl text-[#0D381E]">
              Institutional Reports & Registers
            </h2>
            <p className="text-xs text-[#57655B] mt-0.5">
              Select a report type below to view verified records in a clean, searchable list.
            </p>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Clean Single List of Reports */}
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs divide-y divide-[#E6E2D8] overflow-hidden">
          {authorizedReportList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F9F8F4] transition-colors"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0D381E]/10 flex items-center justify-center text-[#0D381E] shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-heading font-bold text-base text-[#0D381E]">
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F4F3EE] text-[#57655B] font-semibold border border-[#E6E2D8]">
                        {item.count} Records
                      </span>
                    </div>
                    <p className="text-xs text-[#57655B] mt-0.5 max-w-2xl leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setSelectedReport(item.id);
                      setSearchQuery('');
                      setClassFilter('ALL');
                      setStatusFilter('ALL');
                    }}
                    className="px-4 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <span>View Report</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // VIEW 2: Opened Real Data Report in Searchable Table
  const currentReportMeta = reportListItems.find((r) => r.id === selectedReport);

  return (
    <div className="space-y-4">
      {/* Top Navigation & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedReport(null)}
            className="p-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#0D381E] border border-[#E6E2D8] transition-colors cursor-pointer"
            title="Back to Reports List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-heading font-bold text-xl text-[#0D381E]">
                {currentReportMeta?.name}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0D381E]/10 text-[#0D381E]">
                Report View
              </span>
            </div>
            <p className="text-xs text-[#57655B] mt-0.5">
              {currentReportMeta?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCurrentReport}
            className="px-3.5 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-[#F9F8F4] hover:bg-[#E6E2D8] border border-[#E6E2D8] text-[#0D381E] text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Relevant Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57655B]" />
          <input
            type="text"
            placeholder="Search report records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-none focus:border-[#0D381E]"
          />
        </div>

        {/* Campus Filter (Super Admin) */}
        {isSuperAdmin && (
          <div>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-medium focus:outline-none focus:border-[#0D381E]"
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

        {/* Class Filter if applicable */}
        {(selectedReport === 'students' || selectedReport === 'student-attendance' || selectedReport === 'results') && (
          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-medium focus:outline-none focus:border-[#0D381E]"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Filter if attendance or payments */}
        {(selectedReport === 'student-attendance' || selectedReport === 'teacher-attendance' || selectedReport === 'payments') && (
          <div className="flex items-center space-x-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From"
              className="w-full px-2 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Real Data Table */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {/* A. STUDENTS REPORT */}
          {selectedReport === 'students' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Admission ID</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Campus</th>
                  <th className="py-3 px-4 font-semibold">Class / Grade</th>
                  <th className="py-3 px-4 font-semibold">Gender</th>
                  <th className="py-3 px-4 font-semibold">Parent / Guardian</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {students
                  .filter((s) => {
                    if (classFilter !== 'ALL' && s.classId !== classFilter) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchName = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
                      const matchId = s.admissionNumber.toLowerCase().includes(q);
                      if (!matchName && !matchId) return false;
                    }
                    return true;
                  })
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-[#F9F8F4]">
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{s.admissionNumber}</td>
                      <td className="py-3 px-4 font-semibold text-[#1A231E]">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="py-3 px-4 uppercase text-[#57655B]">{s.campusId}</td>
                      <td className="py-3 px-4 text-[#57655B]">{s.className || s.currentGrade}</td>
                      <td className="py-3 px-4 text-[#57655B]">{s.gender}</td>
                      <td className="py-3 px-4 text-[#57655B]">{s.primaryParentName || '—'}</td>
                      <td className="py-3 px-4 font-mono text-[#57655B]">{s.primaryParentPhone || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* B. STUDENT ATTENDANCE REPORT */}
          {selectedReport === 'student-attendance' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Student ID & Name</th>
                  <th className="py-3 px-4 font-semibold">Campus</th>
                  <th className="py-3 px-4 font-semibold">Class</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {studentAttendance
                  .filter((a) => {
                    if (classFilter !== 'ALL' && a.classId !== classFilter) return false;
                    if (startDate && a.date < startDate) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchName = a.studentName.toLowerCase().includes(q);
                      const matchId = a.admissionNumber.toLowerCase().includes(q);
                      if (!matchName && !matchId) return false;
                    }
                    return true;
                  })
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-[#F9F8F4]">
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{a.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1A231E]">{a.studentName}</div>
                        <div className="text-[11px] text-[#57655B] font-mono">{a.admissionNumber}</div>
                      </td>
                      <td className="py-3 px-4 uppercase text-[#57655B]">{a.campusId}</td>
                      <td className="py-3 px-4 text-[#57655B]">{a.classId}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3 px-4 text-[#57655B]">{a.recordedBy}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* C. TEACHER ATTENDANCE REPORT */}
          {selectedReport === 'teacher-attendance' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Teacher Name</th>
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Campus</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Timings</th>
                  <th className="py-3 px-4 font-semibold">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {teacherAttendance
                  .filter((a) => {
                    if (startDate && a.date < startDate) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchName = a.teacherName.toLowerCase().includes(q);
                      const matchCode = a.teacherCode?.toLowerCase().includes(q);
                      if (!matchName && !matchCode) return false;
                    }
                    return true;
                  })
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-[#F9F8F4]">
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{a.date}</td>
                      <td className="py-3 px-4 font-semibold text-[#1A231E]">{a.teacherName}</td>
                      <td className="py-3 px-4 font-mono text-[#57655B]">{a.teacherCode}</td>
                      <td className="py-3 px-4 uppercase text-[#57655B]">{a.campusId}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3 px-4 text-[#57655B] font-mono">
                        {a.checkInTime ? `${a.checkInTime} - ${a.checkOutTime || 'Present'}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-[#57655B]">{a.recordedBy}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* D. RESULTS REPORT */}
          {selectedReport === 'results' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Student ID</th>
                  <th className="py-3 px-4 font-semibold">Assessment Title</th>
                  <th className="py-3 px-4 font-semibold">Class / Subject</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Score / Result</th>
                  <th className="py-3 px-4 font-semibold">Grade</th>
                  <th className="py-3 px-4 font-semibold">Instructor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {examResults
                  .filter((r) => {
                    if (classFilter !== 'ALL' && r.classId !== classFilter) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchName = r.assessmentName.toLowerCase().includes(q);
                      const matchSubject = (r.subject || '').toLowerCase().includes(q);
                      const matchStd = r.studentId.toLowerCase().includes(q);
                      if (!matchName && !matchSubject && !matchStd) return false;
                    }
                    return true;
                  })
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-[#F9F8F4]">
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{r.studentId}</td>
                      <td className="py-3 px-4 font-semibold text-[#1A231E]">{r.assessmentName}</td>
                      <td className="py-3 px-4 text-[#57655B]">{r.className} ({r.subject})</td>
                      <td className="py-3 px-4 font-mono text-[#57655B]">{r.examDate}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">
                        {r.marksObtained} / {r.maxMarks} ({Math.round((r.marksObtained / r.maxMarks) * 100)}%)
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#57655B]">{r.teacherName}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* E. FEES & PAYMENTS REPORT */}
          {selectedReport === 'payments' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Fee Title</th>
                  <th className="py-3 px-4 font-semibold">Amount Due</th>
                  <th className="py-3 px-4 font-semibold">Amount Paid</th>
                  <th className="py-3 px-4 font-semibold">Payment Status</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {payments
                  .filter((p) => {
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchInv = p.invoiceNumber.toLowerCase().includes(q);
                      const matchStd = p.studentName.toLowerCase().includes(q);
                      if (!matchInv && !matchStd) return false;
                    }
                    return true;
                  })
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-[#F9F8F4]">
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{p.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold text-[#1A231E]">
                        <div>{p.studentName}</div>
                        <div className="text-[11px] text-[#57655B] font-mono">{p.admissionNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-[#57655B]">{p.title}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">
                        {formatCampusCurrency(p.amountDue, p.currency || (p.campusId === 'kts' ? 'PKR' : 'GBP'))}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {formatCampusCurrency(p.amountPaid, p.currency || (p.campusId === 'kts' ? 'PKR' : 'GBP'))}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#57655B]">{p.dueDate}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* F. TEACHER RECORDS REPORT */}
          {selectedReport === 'teachers' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Employee Code</th>
                  <th className="py-3 px-4 font-semibold">Faculty Name</th>
                  <th className="py-3 px-4 font-semibold">Campus</th>
                  <th className="py-3 px-4 font-semibold">Specialization</th>
                  <th className="py-3 px-4 font-semibold">Qualification</th>
                  <th className="py-3 px-4 font-semibold">Employment Status</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {teachers
                  .filter((t) => {
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchName = t.fullName.toLowerCase().includes(q);
                      const matchCode = t.employeeCode.toLowerCase().includes(q);
                      if (!matchName && !matchCode) return false;
                    }
                    return true;
                  })
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-[#F9F8F4]">
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{t.employeeCode}</td>
                      <td className="py-3 px-4 font-semibold text-[#1A231E]">{t.fullName}</td>
                      <td className="py-3 px-4 uppercase text-[#57655B]">{t.campusId}</td>
                      <td className="py-3 px-4 text-[#57655B]">{t.specialization}</td>
                      <td className="py-3 px-4 text-[#57655B]">{t.qualification}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E] border border-[#E6E2D8]">
                          {t.employmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#57655B] font-mono">{t.phone}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* G. CLASSES REPORT */}
          {selectedReport === 'classes' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Class Name</th>
                  <th className="py-3 px-4 font-semibold">Campus</th>
                  <th className="py-3 px-4 font-semibold">Lead Teacher</th>
                  <th className="py-3 px-4 font-semibold">Capacity</th>
                  <th className="py-3 px-4 font-semibold">Enrolled</th>
                  <th className="py-3 px-4 font-semibold">Schedule Time & Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {classes
                  .filter((c) => {
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchName = c.name.toLowerCase().includes(q);
                      const matchTch = (c.leadTeacherName || '').toLowerCase().includes(q);
                      if (!matchName && !matchTch) return false;
                    }
                    return true;
                  })
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-[#F9F8F4]">
                      <td className="py-3 px-4 font-bold text-[#0D381E]">{c.name}</td>
                      <td className="py-3 px-4 uppercase text-[#57655B]">{c.campusId}</td>
                      <td className="py-3 px-4 font-medium text-[#1A231E]">{c.leadTeacherName || 'Assigned'}</td>
                      <td className="py-3 px-4 font-mono text-[#57655B]">{c.capacity} pupils</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{c.studentCount}</td>
                      <td className="py-3 px-4 text-[#57655B]">
                        {c.scheduleTime} ({c.scheduleDays.join(', ')})
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* H. CAMPUS SUMMARY REPORT */}
          {selectedReport === 'campus-summary' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Campus Name</th>
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Currency</th>
                  <th className="py-3 px-4 font-semibold">Enrolled Students</th>
                  <th className="py-3 px-4 font-semibold">Teaching Faculty</th>
                  <th className="py-3 px-4 font-semibold">Active Classes</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {campuses
                  .filter((c) => {
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchName = c.name.toLowerCase().includes(q);
                      const matchCode = c.code.toLowerCase().includes(q);
                      if (!matchName && !matchCode) return false;
                    }
                    return true;
                  })
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-[#F9F8F4]">
                      <td className="py-3 px-4 font-bold text-[#0D381E]">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-[#57655B]">{c.code}</td>
                      <td className="py-3 px-4 text-[#57655B]">{c.city}, {c.country}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{c.currencyCode}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0D381E]">{c.studentCount || 0}</td>
                      <td className="py-3 px-4 font-mono text-[#57655B]">{c.teacherCount || 0}</td>
                      <td className="py-3 px-4 font-mono text-[#57655B]">{c.classCount || 0}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
