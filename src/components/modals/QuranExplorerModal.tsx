import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Filter,
  Play,
  Pause,
  Sparkles,
  Volume2,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  COMPLETE_114_SURAHS,
  QURAN_30_JUZ,
  TAJWEED_ASSESSMENT_CRITERIA,
  QuranSurah,
  QuranJuzInfo,
} from '../../data/islamicData.ts';

interface QuranExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSurahForSabaq?: (surahNumber: number) => void;
}

export const QuranExplorerModal: React.FC<QuranExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectSurahForSabaq,
}) => {
  const [activeTab, setActiveTab] = useState<'surahs' | 'juz' | 'tajweed'>('surahs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MAKKI' | 'MADANI'>('ALL');
  const [selectedSurah, setSelectedSurah] = useState<QuranSurah>(COMPLETE_114_SURAHS[0]);
  const [selectedJuz, setSelectedJuz] = useState<QuranJuzInfo>(QURAN_30_JUZ[29]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recitationSpeed, setRecitationSpeed] = useState<'tartil' | 'tadweer' | 'hadr'>('tartil');
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  const filteredSurahs = COMPLETE_114_SURAHS.filter((s) => {
    const matchesFilter =
      selectedFilter === 'ALL' || s.revelationType === selectedFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.number.toString() === q ||
      s.nameTransliterated.toLowerCase().includes(q) ||
      s.nameEnglish.toLowerCase().includes(q) ||
      s.nameArabic.includes(q);
    return matchesFilter && matchesSearch;
  });

  const handlePlayRecitation = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      setToastMessage(`🔊 Simulated Tartil Recitation started: ${selectedSurah.nameTransliterated} (${recitationSpeed.toUpperCase()})`);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleAssignSabaq = (surah: QuranSurah) => {
    if (onSelectSurahForSabaq) {
      onSelectSurahForSabaq(surah.number);
    }
    setToastMessage(`✓ Surah ${surah.nameTransliterated} (Surah #${surah.number}) assigned for today's Sabaq evaluation.`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-[#FAF8F5] w-full max-w-5xl rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#1A231E]">
        {/* Header */}
        <div className="bg-[#0D381E] text-white px-5 py-4 flex items-center justify-between border-b border-[#E5C158]/30 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#E5C158] text-[#0D381E] flex items-center justify-center font-bold text-base shadow-xs">
              📖
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F3D273] leading-tight">
                Holy Quran Interactive Curriculum & Surah Explorer
              </h2>
              <p className="text-[10px] text-white/70">
                114 Surahs · 30 Juz · Tajweed Ahkam & Prophetic Articulations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center space-x-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-[#E6E2D8] px-5 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('surahs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'surahs'
                  ? 'bg-[#0D381E] text-[#F3D273]'
                  : 'bg-[#F9F8F4] text-[#57655B] hover:text-[#0D381E]'
              }`}
            >
              114 Surahs Directory ({COMPLETE_114_SURAHS.length})
            </button>
            <button
              onClick={() => setActiveTab('juz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'juz'
                  ? 'bg-[#0D381E] text-[#F3D273]'
                  : 'bg-[#F9F8F4] text-[#57655B] hover:text-[#0D381E]'
              }`}
            >
              30 Juz Guide
            </button>
            <button
              onClick={() => setActiveTab('tajweed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'tajweed'
                  ? 'bg-[#0D381E] text-[#F3D273]'
                  : 'bg-[#F9F8F4] text-[#57655B] hover:text-[#0D381E]'
              }`}
            >
              Tajweed Ahkam Standards
            </button>
          </div>

          {activeTab === 'surahs' && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#57655B]" />
                <input
                  type="text"
                  placeholder="Search Surah by name or #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs text-[#1A231E] focus:outline-none focus:border-[#0D381E] w-44 sm:w-56"
                />
              </div>

              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="text-xs font-semibold bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer text-[#0D381E]"
              >
                <option value="ALL">All Types</option>
                <option value="MAKKI">Makki (86)</option>
                <option value="MADANI">Madani (28)</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Viewport */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'surahs' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Surah List Column */}
              <div className="lg:col-span-2 space-y-2 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSurahs.map((surah) => {
                    const isSelected = selectedSurah.number === surah.number;
                    return (
                      <div
                        key={surah.number}
                        onClick={() => setSelectedSurah(surah)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#0D381E] text-white border-[#0D381E] shadow-sm ring-2 ring-[#E5C158]/40'
                            : 'bg-white text-[#1A231E] border-[#E6E2D8] hover:border-[#0D381E]/40 hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                              isSelected
                                ? 'bg-[#E5C158] text-[#0D381E]'
                                : 'bg-[#FAF8F5] text-[#0D381E] border border-[#E6E2D8]'
                            }`}
                          >
                            {surah.number}
                          </div>

                          <div className="min-w-0">
                            <span className="font-bold text-xs block truncate leading-tight">
                              {surah.nameTransliterated}
                            </span>
                            <span
                              className={`text-[10px] block truncate ${
                                isSelected ? 'text-white/70' : 'text-[#57655B]'
                              }`}
                            >
                              {surah.nameEnglish} · {surah.totalAyahs} Ayahs
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-arabic text-base font-bold block ${
                              isSelected ? 'text-[#F3D273]' : 'text-[#0D381E]'
                            }`}
                          >
                            {surah.nameArabic}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-mono px-1 py-0.5 rounded ${
                              isSelected
                                ? 'bg-white/10 text-white/90'
                                : surah.revelationType === 'MAKKI'
                                ? 'bg-amber-50 text-amber-900'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {surah.revelationType}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Surah Detail & Tartil Audio Controller */}
              <div className="bg-white p-5 rounded-2xl border border-[#E6E2D8] shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
                    <span className="text-[10px] font-bold text-[#57655B] uppercase tracking-wider">
                      Surah #{selectedSurah.number} of 114
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        selectedSurah.revelationType === 'MAKKI'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {selectedSurah.revelationType === 'MAKKI' ? 'Makkiyah (Mecca)' : 'Madaniyah (Madinah)'}
                    </span>
                  </div>

                  {/* Calligraphy Title */}
                  <div className="text-center py-2 bg-[#FAF8F5] rounded-xl border border-[#E6E2D8]/60">
                    <span className="font-arabic text-3xl font-bold text-[#0D381E] block mb-1">
                      سُورَةُ {selectedSurah.nameArabic}
                    </span>
                    <h3 className="font-heading font-bold text-lg text-[#1A231E]">
                      {selectedSurah.nameTransliterated}
                    </h3>
                    <p className="text-xs text-[#57655B] italic">
                      "{selectedSurah.nameEnglish}"
                    </p>
                  </div>

                  {/* Metadatas */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E2D8]">
                      <span className="text-[10px] text-[#57655B] uppercase block">Total Verses</span>
                      <span className="font-mono text-sm font-bold text-[#0D381E]">
                        {selectedSurah.totalAyahs} Ayahs
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E2D8]">
                      <span className="text-[10px] text-[#57655B] uppercase block">Juz Location</span>
                      <span className="font-mono text-sm font-bold text-[#0D381E]">
                        Juz {selectedSurah.juzNumber}
                      </span>
                    </div>
                  </div>

                  {/* Simulated Tartil Reciter */}
                  <div className="p-3.5 rounded-xl bg-[#0D381E] text-white space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="w-4 h-4 text-[#E5C158]" />
                        <span className="text-xs font-bold text-[#F3D273]">
                          Tartil Metronome & Recital
                        </span>
                      </div>
                      <span className="text-[10px] text-white/70 font-mono">
                        {isPlayingAudio ? '● Streaming' : 'Ready'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={handlePlayRecitation}
                        className="px-3 py-1.5 rounded-lg bg-[#E5C158] hover:bg-[#d8b346] text-[#0D381E] font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                      >
                        {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPlayingAudio ? 'Pause' : 'Play Tartil'}</span>
                      </button>

                      <div className="flex items-center space-x-1 text-[10px] font-mono">
                        {(['tartil', 'tadweer', 'hadr'] as const).map((spd) => (
                          <button
                            key={spd}
                            onClick={() => setRecitationSpeed(spd)}
                            className={`px-1.5 py-1 rounded transition-colors cursor-pointer uppercase ${
                              recitationSpeed === spd
                                ? 'bg-white text-[#0D381E] font-bold'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            {spd}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Action */}
                <button
                  onClick={() => handleAssignSabaq(selectedSurah)}
                  className="w-full py-2.5 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Assign for Sabaq / Evaluation</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'juz' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {QURAN_30_JUZ.map((j) => (
                  <div
                    key={j.juzNumber}
                    onClick={() => setSelectedJuz(j)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      selectedJuz.juzNumber === j.juzNumber
                        ? 'bg-[#0D381E] text-white border-[#0D381E] shadow-sm'
                        : 'bg-white text-[#1A231E] border-[#E6E2D8] hover:border-[#0D381E]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10">
                        Juz #{j.juzNumber}
                      </span>
                      <span className="font-arabic text-lg font-bold text-[#E5C158]">
                        {j.arabicName}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm leading-tight">
                        {j.transliteratedName}
                      </h4>
                      <p className={`text-xs mt-0.5 ${selectedJuz.juzNumber === j.juzNumber ? 'text-white/80' : 'text-[#57655B]'}`}>
                        {j.startSurah} ({j.startAyah}) → {j.endSurah} ({j.endAyah})
                      </p>
                    </div>

                    <div className={`text-[11px] pt-1.5 border-t ${selectedJuz.juzNumber === j.juzNumber ? 'border-white/20 text-white/90' : 'border-[#E6E2D8] text-[#57655B]'}`}>
                      {j.themeSummary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tajweed' && (
            <div className="space-y-4">
              <div className="bg-[#0D381E] text-white p-4 rounded-xl border border-[#E5C158]/30">
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Misbah-ul-Quran Tajweed & Makharij Curriculum Standards
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  Evaluated across all halaqahs in accordance with the rules of Hafs 'an 'Asim via the Shatibiyyah pathway.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TAJWEED_ASSESSMENT_CRITERIA.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="bg-white p-4 rounded-xl border border-[#E6E2D8] space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[#0D381E]">
                        {criterion.name}
                      </h4>
                      <span className="font-arabic font-bold text-base text-[#E5C158]">
                        {criterion.arabic}
                      </span>
                    </div>
                    <p className="text-xs text-[#57655B] leading-relaxed">
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F5] border-t border-[#E6E2D8] px-5 py-3 flex items-center justify-between text-xs text-[#57655B] shrink-0">
          <span>Misbah-ul-Quran International · Authentic Hafs 'an 'Asim Syllabus</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0D381E] text-white hover:bg-[#16532d] font-bold cursor-pointer transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
