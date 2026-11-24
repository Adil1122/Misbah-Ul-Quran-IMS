import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  CalendarCheck,
  Bell,
  Sparkles,
  User,
  GraduationCap,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { UserSession } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';

interface StudentPortalProps {
  user: UserSession;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'quran' | 'attendance' | 'results' | 'announcements'>('overview');

  // Locate the student record by studentId or username / admission number
  const allStudents = IMSStateService.getStudents('all');
  const student =
    allStudents.find((s) => s.id === user.studentId) ||
    allStudents.find((s) => s.admissionNumber.toLowerCase() === user.username.toLowerCase()) ||
    allStudents.find((s) => s.admissionNumber.toLowerCase() === user.email.toLowerCase()) ||
    allStudents[0];

  const campus = IMSStateService.getCampuses().find((c) => c.id === student?.campusId);
  const academicProgress = student ? IMSStateService.getAcademicProgress(student.id) : [];
  const examResults = student ? IMSStateService.getExamResults(student.id) : [];
  const announcements = IMSStateService.getAnnouncements(student?.campusId);
  const attendanceRecords = student ? IMSStateService.getStudentAttendance(student.campusId, student.classId) : [];
  const myAttendance = attendanceRecords.filter((a) => a.studentId === student?.id || a.admissionNumber === student?.admissionNumber);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Welcoming Hero Banner */}
      <div className="bg-[#0D381E] text-white rounded-xl p-6 sm:p-8 shadow-md border border-[#E5C158]/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E5C158] text-[#0D381E] text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Learning Portal</span>
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#F3D273]">
              As-salamu alaykum, {student ? `${student.firstName} ${student.lastName}` : user.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-[#E6E2D8]/80 max-w-xl">
              Welcome to your Misbah-ul-Quran academic portal. Track your daily Hifz Sabaq, review attendance records, and check examination progress.
            </p>
          </div>

          <div className="bg-[#072212]/80 border border-[#16532d] p-4 rounded-lg text-xs space-y-1.5 shrink-0 min-w-56">
            <div className="text-[10px] text-[#E5C158] uppercase font-bold tracking-wider">Official Student ID</div>
            <div className="font-mono font-bold text-base text-white">{student?.admissionNumber || user.username}</div>
            <div className="text-[#E6E2D8]/70 pt-1 border-t border-[#16532d]">
              Campus: <span className="font-semibold text-white">{campus?.name || 'Main Campus'}</span>
            </div>
            <div className="text-[#E6E2D8]/70">
              Level: <span className="font-semibold text-white">{student?.currentGrade || 'Hifz'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-lg border border-[#E6E2D8] shadow-xs">
          <div className="flex items-center justify-between text-[#57655B] text-xs font-medium">
            <span>Current Milestone</span>
            <BookOpen className="w-4 h-4 text-[#0D381E]" />
          </div>
          <div className="text-base sm:text-lg font-bold text-[#0D381E] mt-1 truncate">
            {student?.quranMilestone || 'Juz 1'}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Active Quran Sabaq</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E6E2D8] shadow-xs">
          <div className="flex items-center justify-between text-[#57655B] text-xs font-medium">
            <span>Attendance Rate</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {student?.attendanceRate || 100}%
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Attendance Record</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E6E2D8] shadow-xs">
          <div className="flex items-center justify-between text-[#57655B] text-xs font-medium">
            <span>Enrolled Halaqah</span>
            <GraduationCap className="w-4 h-4 text-[#0D381E]" />
          </div>
          <div className="text-sm font-bold text-[#0D381E] mt-1 truncate">
            {student?.className || 'Hifz Morning'}
          </div>
          <span className="text-[10px] text-[#57655B]">Study Circle</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E6E2D8] shadow-xs">
          <div className="flex items-center justify-between text-[#57655B] text-xs font-medium">
            <span>Exam Transcripts</span>
            <Award className="w-4 h-4 text-[#E5C158]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0D381E] mt-1">
            {examResults.length} Tests
          </div>
          <span className="text-[10px] text-[#57655B]">Term Evaluations</span>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="bg-white p-2 rounded-lg border border-[#E6E2D8] shadow-xs flex items-center space-x-2 text-xs font-semibold overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#0D381E] text-[#F3D273]'
              : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
          }`}
        >
          Overview & Schedule
        </button>
        <button
          onClick={() => setActiveTab('quran')}
          className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'quran'
              ? 'bg-[#0D381E] text-[#F3D273]'
              : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
          }`}
        >
          Quran Sabaq & Tajweed ({academicProgress.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'attendance'
              ? 'bg-[#0D381E] text-[#F3D273]'
              : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
          }`}
        >
          Attendance History
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'results'
              ? 'bg-[#0D381E] text-[#F3D273]'
              : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
          }`}
        >
          Exam Results ({examResults.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'announcements'
              ? 'bg-[#0D381E] text-[#F3D273]'
              : 'text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4]'
          }`}
        >
          Institute Notices ({announcements.length})
        </button>
      </div>

      {/* 4. Active Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Sabaq Card */}
          <div className="bg-white rounded-lg p-5 border border-[#E6E2D8] shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#E6E2D8]">
              <BookOpen className="w-4 h-4 text-[#0D381E]" />
              <h3 className="font-heading font-semibold text-base text-[#0D381E]">
                Latest Quran Lesson (Sabaq)
              </h3>
            </div>
            {academicProgress.length > 0 ? (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#F9F8F4] rounded-lg border border-[#E6E2D8] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0D381E] text-sm">
                      {academicProgress[0].sabaqSurah}
                    </span>
                    <span className="font-mono text-emerald-800 font-bold">
                      Tajweed Score: {academicProgress[0].tajweedScore ? `${academicProgress[0].tajweedScore}/5 ★` : 'Excellent'}
                    </span>
                  </div>
                  <div className="text-[#57655B]">
                    Ayah: <span className="font-mono">{academicProgress[0].sabaqAyah}</span> · Sabaqi: {academicProgress[0].sabqiJuz || 'Juz 1'} · Manzil: {academicProgress[0].manzilJuz || 'Juz 30'}
                  </div>
                  <div className="text-[11px] text-[#1A231E] italic pt-1 border-t border-[#E6E2D8]">
                    Teacher Notes: "{academicProgress[0].feedback || 'Good recitation and tajweed.'}"
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#57655B] italic">
                Current milestone: {student?.quranMilestone || 'Juz 1'}. Daily lesson log will appear here after instructor submission.
              </p>
            )}
          </div>

          {/* Student Class Information Card */}
          <div className="bg-white rounded-lg p-5 border border-[#E6E2D8] shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#E6E2D8]">
              <GraduationCap className="w-4 h-4 text-[#0D381E]" />
              <h3 className="font-heading font-semibold text-base text-[#0D381E]">
                Class & Enrollment Details
              </h3>
            </div>
            <div className="text-xs space-y-2 text-[#57655B]">
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/60">
                <span className="font-medium text-[#1A231E]">Class / Halaqah:</span>
                <span className="font-bold text-[#0D381E]">{student?.className || 'Hifz Intensive'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/60">
                <span className="font-medium text-[#1A231E]">Enrolled Branch:</span>
                <span className="font-bold text-[#0D381E]">{campus?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/60">
                <span className="font-medium text-[#1A231E]">Guardian:</span>
                <span>{student?.primaryParentName || 'Registered Parent'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-[#1A231E]">Enrollment Date:</span>
                <span className="font-mono">{student?.enrollmentDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quran' && (
        <div className="bg-white rounded-lg border border-[#E6E2D8] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
                Quran Memorization, Sabaqi & Manzil Log
              </h3>
              <p className="text-xs text-[#57655B]">
                Instructor evaluations and daily Tajweed feedback
              </p>
            </div>
          </div>

          {academicProgress.length > 0 ? (
            <div className="divide-y divide-[#E6E2D8] text-xs">
              {academicProgress.map((p) => (
                <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-[#0D381E]">{p.sabaqSurah}</span>
                    <div className="text-[#57655B] mt-0.5">
                      Ayah: <span className="font-mono">{p.sabaqAyah}</span> · Sabaqi: {p.sabqiJuz || 'Juz 1'} · Manzil: {p.manzilJuz || 'Juz 30'}
                    </div>
                    {p.feedback && (
                      <p className="text-[11px] text-[#1A231E] italic mt-1">"{p.feedback}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      Tajweed: {p.tajweedScore ? `${p.tajweedScore}/5 ★` : 'Excellent'}
                    </span>
                    <div className="text-[10px] font-mono text-[#57655B] mt-1">{p.date}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#57655B] p-4 text-center">
              No daily progress logs submitted yet for this student.
            </p>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-lg border border-[#E6E2D8] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
                Class Attendance
              </h3>
              <p className="text-xs text-[#57655B]">
                Current term overall attendance: <strong>{student?.attendanceRate || 100}%</strong>
              </p>
            </div>
          </div>

          {myAttendance.length > 0 ? (
            <div className="divide-y divide-[#E6E2D8] text-xs">
              {myAttendance.map((rec) => (
                <div key={rec.id} className="py-2.5 flex justify-between items-center">
                  <span className="font-mono text-[#0D381E] font-semibold">{rec.date}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      rec.status === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-800'
                        : rec.status === 'LATE'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-rose-50 text-rose-800'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#57655B] p-4 text-center">
              Student attendance is verified and up to date with 100% attendance.
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="bg-white rounded-lg border border-[#E6E2D8] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
                Academic Examination Results
              </h3>
              <p className="text-xs text-[#57655B]">
                Official evaluation transcripts and memorization exams
              </p>
            </div>
          </div>

          {examResults.length > 0 ? (
            <div className="divide-y divide-[#E6E2D8] text-xs">
              {examResults.map((r) => (
                <div key={r.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#0D381E] text-sm">{r.assessmentName}</span>
                    <div className="text-[11px] text-[#57655B]">
                      Subject: {r.subject} · Academic Year: {r.academicYear} · Examiner: {r.teacherName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-[#0D381E]">
                      {r.marksObtained} / {r.maxMarks}
                    </span>
                    <div className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-xs inline-block ml-2">
                      Grade: {r.grade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#57655B] p-4 text-center">
              No examination records published for this academic term yet.
            </p>
          )}
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="bg-white rounded-lg border border-[#E6E2D8] shadow-xs p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E6E2D8]">
            <Bell className="w-5 h-5 text-[#0D381E]" />
            <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
              Institute Notices & Announcements
            </h3>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="p-4 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0D381E]">{a.title}</span>
                  <span className="font-mono text-[10px] text-[#57655B]">{a.publishedAt}</span>
                </div>
                <p className="text-[#57655B] leading-relaxed">{a.content}</p>
                <div className="text-[10px] text-[#0D381E] font-medium pt-1 flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{a.priority} Priority</span>
                  <span>Target: {a.targetRole}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
