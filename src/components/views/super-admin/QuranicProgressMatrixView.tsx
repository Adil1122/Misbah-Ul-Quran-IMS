import React, { useState } from 'react';
import { Award, BookOpen, Star, Search } from 'lucide-react';
import { IMSStateService } from '../../../services/imsStateService.ts';

export const QuranicProgressMatrixView: React.FC = () => {
  const [campusFilter, setCampusFilter] = useState<'all' | 'uk' | 'kts'>('all');
  const [search, setSearch] = useState('');

  const progressRecords = IMSStateService.getAcademicProgress(undefined, campusFilter);
  const students = IMSStateService.getStudents(campusFilter);

  const filtered = progressRecords.filter((p) =>
    p.studentName.toLowerCase().includes(search.toLowerCase()) ||
    (p.sabaqSurah && p.sabaqSurah.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-[#0D381E] text-[#E5C158] text-[11px] font-semibold tracking-wider uppercase">
            <Award className="w-3.5 h-3.5" />
            <span>Islamic Curriculum Governance</span>
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-2">
            Organization-Wide Quranic Memorization & Tajweed Matrix
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Cross-campus tracking of new lesson intake (Sabaq), near revision (Sabqi), and distant revision (Manzil).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value as any)}
            className="p-1.5 rounded border border-[#E6E2D8] text-xs font-semibold bg-[#F9F8F4] text-[#0D381E]"
          >
            <option value="all">All Campuses (Consolidated)</option>
            <option value="uk">UK Campus (London)</option>
            <option value="kts">KTS Pakistan (Haripur)</option>
          </select>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((log) => (
          <div key={log.id} className="bg-white rounded-lg border border-[#E6E2D8] p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-start pb-2 border-b border-[#E6E2D8]">
              <div>
                <h4 className="font-heading font-semibold text-lg text-[#0D381E]">
                  {log.studentName}
                </h4>
                <p className="text-xs text-[#57655B]">
                  Instructor: <strong className="text-[#1A231E]">{log.teacherName}</strong> · Campus: <strong className="text-[#0D381E]">{log.campusId.toUpperCase()}</strong> · Date: {log.date}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#E5C158] text-[#0D381E] font-bold text-xs">
                ★ {log.tajweedScore}/5 Tajweed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                <span className="text-[10px] text-[#57655B] uppercase block">New Sabaq</span>
                <span className="font-bold text-[#0D381E] block mt-0.5">{log.sabaqSurah}</span>
                <span className="text-[11px] text-[#57655B]">{log.sabaqAyah}</span>
              </div>
              <div className="p-2.5 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                <span className="text-[10px] text-[#57655B] uppercase block">Sabqi Revision</span>
                <span className="font-bold text-[#0D381E] block mt-0.5">{log.sabqiJuz || 'Ongoing'}</span>
                <span className="text-[11px] text-[#57655B]">Daily assessment</span>
              </div>
              <div className="p-2.5 rounded bg-[#F9F8F4] border border-[#E6E2D8]">
                <span className="text-[10px] text-[#57655B] uppercase block">Manzil Revision</span>
                <span className="font-bold text-[#0D381E] block mt-0.5">{log.manzilJuz || 'Cycle'}</span>
                <span className="text-[11px] text-[#57655B]">Retention check</span>
              </div>
            </div>

            {log.feedback && (
              <p className="text-xs text-[#1A231E] bg-white p-2.5 rounded border border-[#E6E2D8] italic">
                "{log.feedback}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
