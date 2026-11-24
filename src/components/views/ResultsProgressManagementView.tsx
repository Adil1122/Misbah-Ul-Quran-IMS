import React, { useState } from 'react';
import { Award, BookOpen, Star } from 'lucide-react';
import { UserSession } from '../../types/ims.ts';
import { QuranicProgressMatrixView } from './super-admin/QuranicProgressMatrixView.tsx';
import { StudentResultsView } from './super-admin/StudentResultsView.tsx';

interface ResultsProgressManagementViewProps {
  user: UserSession;
  activeCampusId: string;
}

export const ResultsProgressManagementView: React.FC<ResultsProgressManagementViewProps> = () => {
  const [subTab, setSubTab] = useState<'quran' | 'exams'>('quran');

  return (
    <div className="space-y-4">
      {/* Top Segmented Switch */}
      <div className="bg-[#F4F3EE] p-1.5 rounded-xl border border-[#E6E2D8] flex flex-wrap sm:inline-flex items-center gap-1.5">
        <button
          onClick={() => setSubTab('quran')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'quran'
              ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
              : 'text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Quranic Progress Matrix</span>
        </button>

        <button
          onClick={() => setSubTab('exams')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'exams'
              ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
              : 'text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Exam Results & Transcripts</span>
        </button>
      </div>

      {/* Active View */}
      {subTab === 'quran' ? <QuranicProgressMatrixView /> : <StudentResultsView />}
    </div>
  );
};
