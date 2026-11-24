import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Star,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Calendar,
  Sparkles,
  FileCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { UserSession, StudentRecord } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import {
  QURAN_30_JUZ,
  POPULAR_SURAH_LIST,
  TAJWEED_ASSESSMENT_CRITERIA,
  QuranJuzInfo,
} from '../../data/islamicData.ts';
import { HifzSanadCertificateModal } from '../modals/HifzSanadCertificateModal.tsx';

interface QuranProgressViewProps {
  user: UserSession;
  activeCampusId: string;
}

export const QuranProgressView: React.FC<QuranProgressViewProps> = ({
  user,
  activeCampusId,
}) => {
  const effectiveCampus = user.role === 'SUPER_ADMIN' ? activeCampusId : user.activeCampusId;
  const progressLogs = IMSStateService.getAcademicProgress(undefined, effectiveCampus);
  const students = IMSStateService.getStudents(effectiveCampus);
  const teachers = IMSStateService.getTeachers(effectiveCampus);

  // Active view tab inside Quran suite
  const [activeTab, setActiveTab] = useState<'matrix' | 'evaluator' | 'students' | 'logs'>('matrix');

  // Selected Juz for inspection modal/drawer
  const [selectedJuz, setSelectedJuz] = useState<QuranJuzInfo | null>(QURAN_30_JUZ[29]); // Default to Juz Amma

  // Interactive Sabaq Evaluation Form State
  const [targetStudentId, setTargetStudentId] = useState<string>(students[0]?.id || '');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(67); // Al-Mulk
  const [ayahStart, setAyahStart] = useState<number>(1);
  const [ayahEnd, setAyahEnd] = useState<number>(10);
  const [sabqiInput, setSabqiInput] = useState<string>('Juz 29 (Al-Mulk & Al-Qalam)');
  const [manzilInput, setManzilInput] = useState<string>('Juz 30 (Amma Full Review)');
  const [feedbackInput, setFeedbackInput] = useState<string>('Excellent Makharij on Ghunnah and clear Qalqalah. Ready for next 5 Ayahs tomorrow.');

  // Tajweed 5-rule ratings (1 to 5)
  const [tajweedScores, setTajweedScores] = useState({
    makharij: 5,
    ghunnah: 4,
    qalqalah: 5,
    madd: 4,
    waqf: 5,
  });

  // Audio Tartil Metronome Simulator
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [metronomeSpeed, setMetronomeSpeed] = useState<'tartil' | 'tadweer' | 'hadr'>('tartil');

  // Certificate Modal State
  const [certStudent, setCertStudent] = useState<StudentRecord | null>(null);

  // Feedback banner
  const [toastMessage, setToastMessage] = useState<string>('');

  // Search & Filter in Logs
  const [logSearch, setLogSearch] = useState<string>('');

  const calculateOverallTajweed = () => {
    const total =
      tajweedScores.makharij +
      tajweedScores.ghunnah +
      tajweedScores.qalqalah +
      tajweedScores.madd +
      tajweedScores.waqf;
    return Math.round((total / 25) * 5 * 10) / 10;
  };

  const handleScoreChange = (ruleKey: keyof typeof tajweedScores, score: number) => {
    setTajweedScores((prev) => ({
      ...prev,
      [ruleKey]: score,
    }));
  };

  const selectedSurah = POPULAR_SURAH_LIST.find((s) => s.number === selectedSurahNumber) || POPULAR_SURAH_LIST[8];
  const selectedStudentObj = students.find((s) => s.id === targetStudentId) || students[0];

  const handleRecordEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentObj) return;

    const teacherName = user.role === 'TEACHER' ? user.fullName : teachers[0]?.fullName || 'Lead Qari';
    const teacherId = user.teacherProfileId || teachers[0]?.id || 'teacher-1';
    const overallScore = Math.round(calculateOverallTajweed());

    IMSStateService.addAcademicProgress({
      studentId: selectedStudentObj.id,
      studentName: `${selectedStudentObj.firstName} ${selectedStudentObj.lastName}`,
      campusId: selectedStudentObj.campusId,
      classId: selectedStudentObj.classId || 'class-1',
      teacherId,
      teacherName,
      date: new Date().toISOString().split('T')[0],
      sabaqSurah: `${selectedSurah.nameArabic} (${selectedSurah.nameTransliterated})`,
      sabaqAyah: `Ayah ${ayahStart}–${ayahEnd}`,
      sabqiJuz: sabqiInput.trim(),
      manzilJuz: manzilInput.trim(),
      tajweedScore: overallScore,
      feedback: feedbackInput.trim(),
    });

    setToastMessage(`✓ Sabaq evaluation recorded for ${selectedStudentObj.firstName} ${selectedStudentObj.lastName}!`);
    setTimeout(() => setToastMessage(''), 4000);
    setActiveTab('logs');
  };

  const filteredLogs = progressLogs.filter(
    (log) =>
      log.studentName.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.sabaqSurah && log.sabaqSurah.toLowerCase().includes(logSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Suite Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0D381E] text-[#E5C158]">
              Islamic Curriculum Core
            </span>
            <span className="text-xs text-[#0D381E] font-arabic">كِتَابُ اللَّهِ وَسُنَّةُ رَسُولِهِ</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-[#0D381E] mt-1.5">
            Quranic Memorization (Hifz) & Tajweed Studio
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Daily Sabaq intake, Sabqi near revision, Manzil retention matrix, and 5-tier Tajweed evaluation across UK & Pakistan campuses.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('evaluator')}
            className="px-3.5 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E5C158]" />
            <span>Record Daily Sabaq</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E6E2D8] text-xs overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'matrix'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>30-Juz Visual Hifz Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluator')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'evaluator'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E5C158]" />
          <span>Sabaq & Tajweed Evaluation Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'students'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Student Hifz Milestones & Sanad</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'logs'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Evaluation History ({progressLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: 30-JUZ VISUAL HIFZ MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Instructions and Legend */}
          <div className="bg-[#F9F8F4] p-4 rounded-xl border border-[#E6E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-[#0D381E]">The Complete 30-Juz Holy Quran Grid</span>
              <p className="text-[#57655B] text-[11px] mt-0.5">
                Click any Juz to inspect starting/ending Ayahs, core thematic revelations, and active student halaqahs.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-medium shrink-0">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Active Sabaq</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Sabqi Revision</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Manzil Retention</span>
              </span>
            </div>
          </div>

          {/* 30 Juz Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {QURAN_30_JUZ.map((juz) => {
              const isSelected = selectedJuz?.juzNumber === juz.juzNumber;
              // Sample active status for visual fidelity
              const isActive = juz.juzNumber >= 28 || juz.juzNumber === 1 || juz.juzNumber === 2;

              return (
                <div
                  key={juz.juzNumber}
                  onClick={() => setSelectedJuz(juz)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-[#0D381E] text-white border-[#0D381E] shadow-md ring-2 ring-[#E5C158]'
                      : 'bg-white border-[#E6E2D8] hover:border-[#0D381E]/40 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`font-mono font-bold text-xs ${
                        isSelected ? 'text-[#E5C158]' : 'text-[#57655B]'
                      }`}
                    >
                      Juz {juz.juzNumber}
                    </span>
                    <span
                      className={`text-xs font-arabic font-bold ${
                        isSelected ? 'text-[#F3D273]' : 'text-[#0D381E]'
                      }`}
                    >
                      {juz.arabicName}
                    </span>
                  </div>

                  <div className="my-2">
                    <h4
                      className={`font-heading font-semibold text-sm truncate ${
                        isSelected ? 'text-white' : 'text-[#1A231E]'
                      }`}
                    >
                      {juz.transliteratedName}
                    </h4>
                    <span
                      className={`text-[10px] block truncate ${
                        isSelected ? 'text-white/70' : 'text-[#57655B]'
                      }`}
                    >
                      {juz.startSurah} {juz.startAyah}
                    </span>
                  </div>

                  <div
                    className={`pt-2 border-t flex items-center justify-between text-[10px] ${
                      isSelected ? 'border-white/20 text-white/80' : 'border-[#E6E2D8] text-[#57655B]'
                    }`}
                  >
                    <span>{juz.totalAyahs} Ayahs</span>
                    {isActive ? (
                      <span
                        className={`font-semibold ${
                          isSelected ? 'text-[#E5C158]' : 'text-emerald-700'
                        }`}
                      >
                        ● Active
                      </span>
                    ) : (
                      <span>Queued</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Juz Detail Card */}
          {selectedJuz && (
            <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs animate-in fade-in space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#E5C158] bg-[#0D381E] px-2 py-0.5 rounded">
                      JUZ {selectedJuz.juzNumber}
                    </span>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-[#0D381E]">
                      {selectedJuz.transliteratedName} ({selectedJuz.arabicName})
                    </h3>
                  </div>
                  <p className="text-xs text-[#57655B] mt-1">
                    Begins with: <strong className="text-[#0D381E]">{selectedJuz.startSurah} Ayah {selectedJuz.startAyah}</strong> · Ends with: <strong className="text-[#0D381E]">{selectedJuz.endSurah} Ayah {selectedJuz.endAyah}</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSabqiInput(`Juz ${selectedJuz.juzNumber} (${selectedJuz.transliteratedName})`);
                    setActiveTab('evaluator');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#E5C158] hover:bg-[#d8b346] text-[#0D381E] font-bold text-xs cursor-pointer transition-colors shrink-0 shadow-2xs"
                >
                  Set as Target Revision Juz
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2">
                  <span className="font-bold text-[#0D381E] block text-[11px] uppercase tracking-wider">
                    Core Themes & Revelation Focus
                  </span>
                  <p className="text-[#1A231E] leading-relaxed">
                    {selectedJuz.themeSummary}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2">
                  <span className="font-bold text-[#0D381E] block text-[11px] uppercase tracking-wider">
                    Halaqah Students Working in Juz {selectedJuz.juzNumber}
                  </span>
                  <div className="space-y-1">
                    {students.slice(0, 3).map((st) => (
                      <div key={st.id} className="flex items-center justify-between py-1 border-b border-[#E6E2D8]/50 last:border-0">
                        <span className="font-semibold text-[#0D381E]">{st.firstName} {st.lastName}</span>
                        <span className="font-mono text-[#57655B]">{st.admissionNumber} · {st.currentGrade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE SABAQ & TAJWEED EVALUATION STUDIO */}
      {activeTab === 'evaluator' && (
        <form onSubmit={handleRecordEvaluation} className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Evaluation Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student and Surah Selectors */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E2D8] shadow-xs space-y-4">
                <h3 className="font-heading font-bold text-base text-[#0D381E] flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-[#0D381E]" />
                  <span>Student & Lesson Assignment</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#1A231E] mb-1">Select Student</label>
                    <select
                      value={targetStudentId}
                      onChange={(e) => setTargetStudentId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-[#0D381E] font-semibold"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.admissionNumber} · {s.currentGrade})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1A231E] mb-1">Holy Quran Surah</label>
                    <select
                      value={selectedSurahNumber}
                      onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-[#0D381E] font-semibold"
                    >
                      {POPULAR_SURAH_LIST.map((surah) => (
                        <option key={surah.number} value={surah.number}>
                          {surah.number}. {surah.nameArabic} — {surah.nameTransliterated} ({surah.totalAyahs} Ayahs)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  <div>
                    <label className="block font-bold text-[#1A231E] mb-1">Start Ayah</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedSurah.totalAyahs}
                      value={ayahStart}
                      onChange={(e) => setAyahStart(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1A231E] mb-1">End Ayah</label>
                    <input
                      type="number"
                      min={ayahStart}
                      max={selectedSurah.totalAyahs}
                      value={ayahEnd}
                      onChange={(e) => setAyahEnd(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 5-Criteria Tajweed Rubric */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E2D8] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#0D381E]">
                      Interactive 5-Rule Tajweed Evaluation Rubric
                    </h3>
                    <p className="text-[11px] text-[#57655B]">
                      Rate accuracy from 1 (Needs practice) to 5 (Mumtaz / Flawless)
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#57655B] uppercase block">Cumulative Grade</span>
                    <span className="font-mono font-extrabold text-lg text-emerald-800">
                      ★ {calculateOverallTajweed()} / 5.0
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {TAJWEED_ASSESSMENT_CRITERIA.map((criterion) => {
                    const ruleKey = criterion.id as keyof typeof tajweedScores;
                    const currentRating = tajweedScores[ruleKey];

                    return (
                      <div
                        key={criterion.id}
                        className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-[#0D381E]">{criterion.name}</span>
                            <span className="text-xs font-arabic text-[#57655B]">{criterion.arabic}</span>
                          </div>
                          <p className="text-[11px] text-[#57655B]">{criterion.description}</p>
                        </div>

                        {/* Interactive Clickable Star Rating */}
                        <div className="flex items-center space-x-1 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-[#E6E2D8]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleScoreChange(ruleKey, star)}
                              className="p-1 text-[#57655B] hover:text-[#E5C158] transition-colors cursor-pointer"
                              title={`Rate ${star} / 5`}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  star <= currentRating
                                    ? 'text-[#E5C158] fill-[#E5C158]'
                                    : 'text-[#C9C4B7]'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-mono font-bold text-[#0D381E] ml-1">
                            {currentRating}/5
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sabqi & Manzil + Remarks */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E2D8] shadow-xs space-y-4">
                <h3 className="font-heading font-bold text-base text-[#0D381E]">
                  Revision (Sabqi & Manzil) and Qari Notes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#1A231E] mb-1">
                      Sabqi (Recent Lessons Revision)
                    </label>
                    <input
                      type="text"
                      value={sabqiInput}
                      onChange={(e) => setSabqiInput(e.target.value)}
                      placeholder="e.g. Juz 29 (Al-Mulk to Al-Haqqah)"
                      className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1A231E] mb-1">
                      Manzil (Distant Retention Cycle)
                    </label>
                    <input
                      type="text"
                      value={manzilInput}
                      onChange={(e) => setManzilInput(e.target.value)}
                      placeholder="e.g. Juz 30 (Amma Full Review)"
                      className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-[#1A231E] mb-1">
                    Evaluation Assessment & Guidance
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-md transition-colors"
                  >
                    Save & Submit Sabaq Record
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Audio Tartil Metronome Pacer & Student Snapshot */}
            <div className="space-y-6">
              {/* Audio Tartil Recitation Pacer Simulator */}
              <div className="bg-white p-5 rounded-xl border border-[#E6E2D8] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E6E2D8]">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-[#0D381E]" />
                    <h4 className="font-heading font-bold text-sm text-[#0D381E]">
                      Tartil Recitation Pacer
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-[#E5C158] bg-[#0D381E] px-2 py-0.5 rounded">
                    Audio Guide
                  </span>
                </div>

                <p className="text-xs text-[#57655B] leading-relaxed">
                  Interactive tempo reference for students practicing smooth rhythmic cadence during Halaqah memorization.
                </p>

                {/* Tempo Selectors */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F9F8F4] rounded-lg border border-[#E6E2D8] text-xs">
                  {[
                    { id: 'tartil', label: 'Tartil (Slow · 60 BPM)' },
                    { id: 'tadweer', label: 'Tadweer (Medium · 80 BPM)' },
                    { id: 'hadr', label: 'Hadr (Fast · 100 BPM)' },
                  ].map((spd) => (
                    <button
                      key={spd.id}
                      type="button"
                      onClick={() => setMetronomeSpeed(spd.id as any)}
                      className={`py-1.5 px-1 rounded text-center font-semibold cursor-pointer text-[10px] transition-colors ${
                        metronomeSpeed === spd.id
                          ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                          : 'text-[#57655B] hover:text-[#0D381E]'
                      }`}
                    >
                      {spd.label.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Audio Waveform Simulator */}
                <div className="h-16 bg-[#072212] rounded-xl flex items-center justify-center space-x-1 p-3 overflow-hidden border border-[#16532d]">
                  {[12, 28, 42, 20, 35, 50, 24, 38, 48, 18, 30, 44, 26, 36, 16].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        isAudioPlaying ? 'bg-[#E5C158] animate-pulse' : 'bg-white/30'
                      }`}
                      style={{
                        height: isAudioPlaying ? `${h}px` : '12px',
                        animationDelay: `${i * 100}ms`,
                      }}
                    ></div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                  className="w-full py-2.5 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
                >
                  {isAudioPlaying ? (
                    <>
                      <Pause className="w-4 h-4 text-[#E5C158]" />
                      <span>Pause Recitation Metronome</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-[#E5C158]" />
                      <span>Play Rhythmic Tartil Pacer</span>
                    </>
                  )}
                </button>
              </div>

              {/* Student Quick Profile Card */}
              {selectedStudentObj && (
                <div className="bg-white p-5 rounded-xl border border-[#E6E2D8] shadow-xs space-y-3 text-xs">
                  <div className="flex items-center space-x-3 pb-3 border-b border-[#E6E2D8]">
                    <div className="w-10 h-10 rounded-full bg-[#0D381E] text-[#E5C158] flex items-center justify-center font-bold text-sm">
                      {selectedStudentObj.firstName[0]}
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#0D381E]">
                        {selectedStudentObj.firstName} {selectedStudentObj.lastName}
                      </h4>
                      <span className="text-[11px] font-mono text-[#57655B]">
                        {selectedStudentObj.admissionNumber} · {selectedStudentObj.campusId.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[#57655B]">
                    <div className="flex justify-between py-1 border-b border-[#E6E2D8]/50">
                      <span>Current Milestone:</span>
                      <strong className="text-[#0D381E]">{selectedStudentObj.quranMilestone || 'Juz Amma'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E6E2D8]/50">
                      <span>Attendance Rate:</span>
                      <strong className="text-emerald-800 font-mono">{selectedStudentObj.attendanceRate}%</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Parent / Contact:</span>
                      <span>{selectedStudentObj.primaryParentPhone || 'On File'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCertStudent(selectedStudentObj)}
                    className="w-full mt-2 py-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#0D381E] font-bold border border-[#E6E2D8] flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Award className="w-4 h-4 text-[#0D381E]" />
                    <span>Preview Sanad Certificate</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: STUDENT HIFZ MILESTONES & SANAD CERTIFICATION */}
      {activeTab === 'students' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-[#F9F8F4] p-4 rounded-xl border border-[#E6E2D8] text-xs text-[#57655B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-[#0D381E]">Hafiz Students & Graduation Certificates</span>
              <p className="text-[11px] mt-0.5">
                Check student learning progress across all 30 Juz and create official stamped graduation certificates.
              </p>
            </div>
            <span className="font-mono font-bold text-xs text-[#0D381E] bg-white px-3 py-1.5 rounded border border-[#E6E2D8]">
              {students.length} Enrolled Seekers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((st) => {
              // Simulated milestone progress
              const completedJuzCount = st.firstName.includes('Zaid') ? 30 : st.firstName.includes('Yusuf') ? 18 : st.firstName.includes('Maryam') ? 12 : 5;
              const percent = Math.round((completedJuzCount / 30) * 100);

              return (
                <div key={st.id} className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-base text-[#0D381E]">
                        {st.firstName} {st.lastName}
                      </h4>
                      <span className="text-xs font-mono text-[#57655B]">
                        {st.admissionNumber} · {st.campusId.toUpperCase()}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5C158] text-[#0D381E]">
                      {completedJuzCount === 30 ? 'Hafiz Graduate' : `${completedJuzCount}/30 Juz`}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[#57655B] mb-1">
                      <span>Hifz Progress</span>
                      <strong className="font-mono text-[#0D381E]">{percent}%</strong>
                    </div>
                    <div className="w-full h-2 bg-[#F9F8F4] rounded-full overflow-hidden border border-[#E6E2D8]">
                      <div
                        className="h-full bg-gradient-to-r from-[#0D381E] to-emerald-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-[#57655B] space-y-1 pt-1 border-t border-[#E6E2D8]">
                    <div>Current Sabaq: <strong className="text-[#0D381E]">{st.quranMilestone || 'Surah Al-Mulk'}</strong></div>
                    <div>Halaqah Grade: <span className="font-semibold text-[#1A231E]">{st.currentGrade}</span></div>
                  </div>

                  <button
                    onClick={() => setCertStudent(st)}
                    className="w-full py-2 px-3 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Award className="w-4 h-4 text-[#E5C158]" />
                    <span>Confer Sanad Certificate</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: EVALUATION HISTORY LOG */}
      {activeTab === 'logs' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search by student or Surah..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
              />
              <Search className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
            </div>

            <span className="text-xs text-[#57655B]">
              Showing <strong className="text-[#0D381E]">{filteredLogs.length}</strong> records
            </span>
          </div>

          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-3 hover:border-[#0D381E]/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6E2D8]">
                  <div>
                    <h4 className="font-heading font-semibold text-lg text-[#0D381E]">
                      {log.studentName}
                    </h4>
                    <p className="text-xs text-[#57655B]">
                      Instructor: <span className="font-semibold text-[#1A231E]">{log.teacherName}</span> · Campus: <span className="font-mono font-bold text-[#0D381E]">{log.campusId.toUpperCase()}</span> · Date: <span className="font-mono">{log.date}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#0D381E] bg-[#E5C158] px-2.5 py-1 rounded">
                      Tajweed: ★ {log.tajweedScore}/5
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8]">
                    <span className="text-[10px] text-[#57655B] uppercase block font-semibold">New Sabaq Lesson</span>
                    <span className="font-bold text-[#0D381E] text-sm block mt-0.5">
                      {log.sabaqSurah}
                    </span>
                    <span className="text-[#57655B]">{log.sabaqAyah}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8]">
                    <span className="text-[10px] text-[#57655B] uppercase block font-semibold">Sabqi (Recent Revision)</span>
                    <span className="font-bold text-[#0D381E] text-sm block mt-0.5">
                      {log.sabqiJuz || 'Ongoing'}
                    </span>
                    <span className="text-[#57655B]">Halaqah review completed</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8]">
                    <span className="text-[10px] text-[#57655B] uppercase block font-semibold">Manzil (Retention Cycle)</span>
                    <span className="font-bold text-[#0D381E] text-sm block mt-0.5">
                      {log.manzilJuz || 'Review Cycle'}
                    </span>
                    <span className="text-[#57655B]">Long-term retention check</span>
                  </div>
                </div>

                {log.feedback && (
                  <p className="text-xs text-[#1A231E] bg-[#F4F3EE] p-3 rounded-lg border border-[#E6E2D8] italic">
                    <span className="font-semibold text-[#0D381E] not-italic mr-1">Teacher Assessment:</span>
                    "{log.feedback}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sanad Certificate Modal */}
      {certStudent && (
        <HifzSanadCertificateModal
          isOpen={!!certStudent}
          onClose={() => setCertStudent(null)}
          student={certStudent}
        />
      )}
    </div>
  );
};
