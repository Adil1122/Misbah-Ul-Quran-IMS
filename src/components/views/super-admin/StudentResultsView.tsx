import React, { useState, useMemo } from 'react';
import {
  Award,
  BookOpen,
  Search,
  Filter,
  Eye,
  Printer,
  X,
  CheckCircle2,
  Calendar,
  FileText,
  ChevronRight,
  List,
  Table as TableIcon,
  Sparkles,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { AcademicExamResult, StudentRecord } from '../../../types/ims.ts';

interface StudentResultsViewProps {
  campusFilter?: string;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ campusFilter }) => {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [activeModalResult, setActiveModalResult] = useState<AcademicExamResult | null>(null);

  const rawResults = IMSStateService.getExamResults(undefined, selectedYear);
  const students = IMSStateService.getStudents();
  const classes = IMSStateService.getClasses(campusFilter);

  // Student lookup map
  const studentMap = useMemo(() => {
    const map = new Map<string, StudentRecord>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Enriched and filtered results
  const filteredResults = useMemo(() => {
    return rawResults.filter((r) => {
      const student = studentMap.get(r.studentId);
      if (campusFilter && campusFilter !== 'all' && student && student.campusId !== campusFilter) {
        return false;
      }
      if (classFilter !== 'ALL' && r.classId !== classFilter && r.className !== classFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const stdName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
        const adm = student?.admissionNumber.toLowerCase() || '';
        const subj = r.subject.toLowerCase();
        const title = r.assessmentName.toLowerCase();
        const examiner = r.teacherName.toLowerCase();
        if (!stdName.includes(q) && !adm.includes(q) && !subj.includes(q) && !title.includes(q) && !examiner.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rawResults, studentMap, campusFilter, classFilter, search]);

  // Key Result Statistics
  const stats = useMemo(() => {
    const total = filteredResults.length;
    if (total === 0) return { total: 0, highAchievers: 0, avgPercentage: 0, totalClasses: 0 };
    const highAchievers = filteredResults.filter((r) => r.grade === 'A+' || r.grade === 'A').length;
    const avgPercentage = Math.round(
      filteredResults.reduce((sum, r) => sum + (r.marksObtained / (r.maxMarks || 100)) * 100, 0) / total
    );
    return {
      total,
      highAchievers,
      avgPercentage,
      totalClasses: new Set(filteredResults.map((r) => r.className)).size,
    };
  }, [filteredResults]);

  const activeStudent = activeModalResult ? studentMap.get(activeModalResult.studentId) : null;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-[#0D381E] text-[#E5C158] text-[11px] font-semibold tracking-wider uppercase">
            <Award className="w-3.5 h-3.5" />
            <span>Academic Assessment Register</span>
          </div>
          <h2 className="font-heading font-semibold text-xl sm:text-2xl text-[#0D381E] mt-1.5">
            Student Examination & Academic Results
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Verified academic performance logs, exam marks, and transcripts presented in a professional listed format.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#57655B] font-medium">Session:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs font-semibold text-[#0D381E] focus:outline-none"
          >
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
          </select>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs">
          <span className="text-[#57655B] font-medium block">Total Results Listed</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#0D381E] mt-0.5">
            {stats.total}
          </div>
          <span className="text-[10px] text-[#57655B]">Evaluated students</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs">
          <span className="text-[#57655B] font-medium block">Grade A / A+ Honors</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 mt-0.5">
            {stats.highAchievers}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">High achievers</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs">
          <span className="text-[#57655B] font-medium block">Average Marks Score</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#0D381E] mt-0.5">
            {stats.avgPercentage}%
          </div>
          <span className="text-[10px] text-[#57655B]">Cohort mean</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs">
          <span className="text-[#57655B] font-medium block">Participating Classes</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#0D381E] mt-0.5">
            {stats.totalClasses}
          </div>
          <span className="text-[10px] text-[#57655B]">Active halaqahs</span>
        </div>
      </div>

      {/* Filter and Search Bar with View Mode Toggle */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#57655B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, subject, assessment, or examiner..."
            className="w-full pl-9 pr-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-none focus:border-[#0D381E]"
          />
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-[#57655B]" />
            <span className="text-[#57655B] font-medium">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs text-[#1A231E] focus:outline-none"
            >
              <option value="ALL">All Classes / Halaqahs</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Listed Form vs Compact Table */}
          <div className="flex items-center bg-[#F4F3EE] p-1 rounded-lg border border-[#E6E2D8]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                viewMode === 'list'
                  ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                  : 'text-[#57655B] hover:text-[#0D381E]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Listed Form</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                viewMode === 'table'
                  ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                  : 'text-[#57655B] hover:text-[#0D381E]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. PROFESSIONAL LISTED FORM (Default Mode) */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredResults.length > 0 ? (
            filteredResults.map((r, idx) => {
              const student = studentMap.get(r.studentId);
              const percentage = Math.round((r.marksObtained / r.maxMarks) * 100);
              const initials = student
                ? `${student.firstName[0] || ''}${student.lastName[0] || ''}`.toUpperCase()
                : 'ST';

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-[#E6E2D8] hover:border-[#0D381E] p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Student Identity */}
                    <div className="flex items-start space-x-3.5 min-w-[260px]">
                      <div className="w-10 h-10 rounded-full bg-[#0D381E] text-[#E5C158] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E5C158]/30">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-heading font-bold text-sm text-[#0D381E]">
                            {student ? `${student.firstName} ${student.lastName}` : r.studentId}
                          </h4>
                          <span className="font-mono text-[10px] text-[#57655B] bg-[#F9F8F4] px-1.5 py-0.5 rounded border border-[#E6E2D8]">
                            ID: {student?.admissionNumber || r.studentId}
                          </span>
                        </div>
                        <div className="text-xs text-[#57655B] mt-0.5 flex items-center space-x-2">
                          <span className="font-medium text-[#1A231E]">{r.className}</span>
                          <span>·</span>
                          <span className="font-mono text-[11px]">{r.examDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Center: Subject, Assessment & Examiner */}
                    <div className="flex-1 lg:px-4 lg:border-x lg:border-[#E6E2D8]/80 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#1A231E]">{r.subject}</span>
                        <span className="text-[#57655B]">·</span>
                        <span className="text-xs text-[#57655B]">{r.assessmentName}</span>
                      </div>
                      <div className="text-[11px] text-[#57655B]">
                        Examiner: <strong className="text-[#1A231E]">{r.teacherName}</strong>
                      </div>
                      {r.remarks && (
                        <p className="text-[11px] text-[#1A231E]/80 italic bg-[#F9F8F4] px-2.5 py-1 rounded border border-[#E6E2D8]/60 mt-1">
                          "{r.remarks}"
                        </p>
                      )}
                    </div>

                    {/* Right: Marks, Grade & Action */}
                    <div className="flex items-center justify-between lg:justify-end space-x-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E6E2D8]/60">
                      {/* Score & Progress */}
                      <div className="text-right">
                        <div className="flex items-baseline space-x-1 justify-end">
                          <span className="font-mono font-bold text-base text-[#0D381E]">
                            {r.marksObtained}
                          </span>
                          <span className="text-xs text-[#57655B] font-mono">/ {r.maxMarks}</span>
                          <span className="text-xs text-emerald-800 font-bold ml-1 font-mono">
                            ({percentage}%)
                          </span>
                        </div>
                        {/* Progress meter */}
                        <div className="w-28 h-1.5 bg-[#E6E2D8] rounded-full overflow-hidden mt-1 ml-auto">
                          <div
                            className={`h-full rounded-full ${
                              percentage >= 80 ? 'bg-emerald-600' : percentage >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Grade Badge */}
                      <div className="text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg font-bold text-xs ${
                            r.grade === 'A+' || r.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : r.grade === 'B'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          Grade {r.grade}
                        </span>
                      </div>

                      {/* Action */}
                      <button
                        type="button"
                        onClick={() => setActiveModalResult(r)}
                        className="px-3 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs flex items-center space-x-1 cursor-pointer shadow-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Result</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-[#E6E2D8] text-xs text-[#57655B]">
              No academic assessment records matched the selected query.
            </div>
          )}
        </div>
      )}

      {/* 2. COMPACT TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Student ID & Name</th>
                  <th className="py-3 px-4 font-semibold">Class / Halaqah</th>
                  <th className="py-3 px-4 font-semibold">Subject & Assessment</th>
                  <th className="py-3 px-4 font-semibold">Marks / Score</th>
                  <th className="py-3 px-4 font-semibold">Grade</th>
                  <th className="py-3 px-4 font-semibold">Examiner</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {filteredResults.length > 0 ? (
                  filteredResults.map((r) => {
                    const student = studentMap.get(r.studentId);
                    const percentage = Math.round((r.marksObtained / r.maxMarks) * 100);
                    return (
                      <tr key={r.id} className="hover:bg-[#F9F8F4] transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#57655B] whitespace-nowrap">
                          {r.examDate}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-[#0D381E] text-xs">
                            {student ? `${student.firstName} ${student.lastName}` : r.studentId}
                          </div>
                          <div className="text-[10px] font-mono text-[#57655B]">
                            ID: {student?.admissionNumber || r.studentId}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#57655B] whitespace-nowrap font-medium">
                          {r.className}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#1A231E]">{r.subject}</div>
                          <div className="text-[10px] text-[#57655B]">{r.assessmentName}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[#0D381E]">
                            {r.marksObtained} / {r.maxMarks}
                          </div>
                          <div className="text-[10px] font-mono text-[#57655B]">{percentage}%</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              r.grade === 'A+' || r.grade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.grade === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#57655B] whitespace-nowrap">
                          {r.teacherName}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setActiveModalResult(r)}
                            className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-semibold flex items-center space-x-1 cursor-pointer ml-auto shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Result</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#57655B]">
                      No academic assessment records matched the selected query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: Official Academic Transcript Sheet */}
      {activeModalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            {/* Header */}
            <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-[#E5C158] flex items-center justify-center text-[#0D381E] font-bold font-display text-lg">
                  MQ
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                    Official Academic Result Sheet
                  </h3>
                  <p className="text-xs text-[#E6E2D8]/80">
                    Misbah-ul-Quran International · Academic Session {activeModalResult.academicYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalResult(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Transcript Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-[#F9F8F4] p-3.5 rounded-xl border border-[#E6E2D8] grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#57655B] block">Student Name</span>
                  <span className="font-bold text-sm text-[#0D381E]">
                    {activeStudent ? `${activeStudent.firstName} ${activeStudent.lastName}` : activeModalResult.studentId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#57655B] block">Admission Number</span>
                  <span className="font-mono font-bold text-xs text-[#1A231E]">
                    {activeStudent?.admissionNumber || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#57655B] block">Class / Halaqah</span>
                  <span className="font-medium text-xs text-[#1A231E]">{activeModalResult.className}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#57655B] block">Examination Date</span>
                  <span className="font-mono text-xs text-[#1A231E]">{activeModalResult.examDate}</span>
                </div>
              </div>

              {/* Assessment Breakdown */}
              <div className="border border-[#E6E2D8] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
                  <div>
                    <span className="text-xs font-bold text-[#0D381E] block">{activeModalResult.subject}</span>
                    <span className="text-[11px] text-[#57655B]">{activeModalResult.assessmentName}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800">
                      Grade: {activeModalResult.grade}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-[#F9F8F4] p-2 rounded-lg">
                    <span className="text-[10px] text-[#57655B] block">Marks Obtained</span>
                    <span className="font-bold font-mono text-sm text-[#0D381E]">{activeModalResult.marksObtained}</span>
                  </div>
                  <div className="bg-[#F9F8F4] p-2 rounded-lg">
                    <span className="text-[10px] text-[#57655B] block">Maximum Marks</span>
                    <span className="font-bold font-mono text-sm text-[#57655B]">{activeModalResult.maxMarks}</span>
                  </div>
                  <div className="bg-[#F9F8F4] p-2 rounded-lg">
                    <span className="text-[10px] text-[#57655B] block">Score Percentage</span>
                    <span className="font-bold font-mono text-sm text-emerald-700">
                      {Math.round((activeModalResult.marksObtained / activeModalResult.maxMarks) * 100)}%
                    </span>
                  </div>
                </div>

                {activeModalResult.remarks && (
                  <div className="pt-2 text-xs text-[#57655B] border-t border-[#E6E2D8]/60">
                    <strong className="text-[#0D381E]">Examiner Remarks:</strong> {activeModalResult.remarks}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#57655B] pt-2">
                <div>Examiner: <strong className="text-[#1A231E]">{activeModalResult.teacherName}</strong></div>
                <div className="flex items-center space-x-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Academic Standing Verified</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#0D381E] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Transcript</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalResult(null)}
                  className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


