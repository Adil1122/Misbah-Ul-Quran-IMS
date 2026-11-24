import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  RotateCcw,
  CheckCheck,
  Heart,
  Share2,
  Award,
} from 'lucide-react';
import { DAILY_SUNNAH_CHECKLIST, SunnahHabitItem } from '../../data/islamicData.ts';

interface SunnahHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const SunnahHabitsModal: React.FC<SunnahHabitsModalProps> = ({
  isOpen,
  onClose,
  userName = 'Student / Seeker',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [checkedHabits, setCheckedHabits] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('misbah_sunnah_habits_today');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default initial checked items for high engagement demo
    return {
      'sunnah-1': true,
      'sunnah-2': true,
      'sunnah-3': true,
      'sunnah-4': true,
    };
  });
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('misbah_sunnah_habits_today', JSON.stringify(checkedHabits));
    } catch {
      // ignore
    }
  }, [checkedHabits]);

  if (!isOpen) return null;

  const toggleHabit = (id: string) => {
    setCheckedHabits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const markAllComplete = () => {
    const all: Record<string, boolean> = {};
    DAILY_SUNNAH_CHECKLIST.forEach((h) => {
      all[h.id] = true;
    });
    setCheckedHabits(all);
  };

  const resetAll = () => {
    setCheckedHabits({});
  };

  // Calculations
  const totalPossiblePoints = DAILY_SUNNAH_CHECKLIST.reduce((acc, h) => acc + h.rewardPoints, 0);
  const earnedPoints = DAILY_SUNNAH_CHECKLIST.filter((h) => checkedHabits[h.id]).reduce(
    (acc, h) => acc + h.rewardPoints,
    0
  );
  const completionPercentage = Math.round((earnedPoints / totalPossiblePoints) * 100);

  const filteredHabits = DAILY_SUNNAH_CHECKLIST.filter(
    (h) => selectedCategory === 'ALL' || h.category === selectedCategory
  );

  const getSpiritualRank = () => {
    if (completionPercentage >= 90) return { title: 'Mukhlas (Exemplary Character)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (completionPercentage >= 65) return { title: 'Salih (Devoted Practitioner)', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    if (completionPercentage >= 35) return { title: 'Mujtahid (Steadfast Seeker)', color: 'text-sky-800 bg-sky-50 border-sky-200' };
    return { title: 'Mubtadi (Noble Beginner)', color: 'text-[#57655B] bg-[#F9F8F4] border-[#E6E2D8]' };
  };

  const rank = getSpiritualRank();

  const handleShareCard = () => {
    const text = `🌟 Misbah-ul-Quran Daily Sunnah & Adab Tracker\nCompleted: ${completionPercentage}% (${earnedPoints}/${totalPossiblePoints} Barakah Points)\nStatus: ${rank.title}\n"The most beloved deeds to Allah are those done consistently, even if small." (Bukhari)`;
    navigator.clipboard?.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0D381E] text-white p-5 sm:p-6 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#E5C158] text-[#0D381E]">
                  Prophetic Character & Akhlaq
                </span>
                <span className="text-xs text-[#E5C158] font-arabic">سُنَنُ النَّبِيِّ ﷺ</span>
              </div>
              <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F3D273]">
                Daily Sunnah & Adab Tracker
              </h3>
              <p className="text-xs text-white/80">
                Logged for: <strong className="text-white">{userName}</strong> · 17 Shawwal 1447 AH
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barakah Score Progress Card */}
          <div className="mt-5 p-4 rounded-xl bg-black/30 border border-[#E5C158]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E5C158]">
                  Today's Barakah Score:
                </span>
                <span className="font-mono font-extrabold text-lg text-white">
                  {earnedPoints} / {totalPossiblePoints} pts
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rank.color}`}>
                  {rank.title}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full sm:w-80 h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-[#E5C158] to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={markAllComplete}
                className="px-3 py-1.5 rounded-lg bg-[#E5C158] hover:bg-[#d8b346] text-[#0D381E] text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All</span>
              </button>
              <button
                onClick={resetAll}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                title="Reset daily items"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-[#F9F8F4] px-5 py-3 border-b border-[#E6E2D8] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs py-0.5">
            {[
              { id: 'ALL', label: 'All Habits' },
              { id: 'SALAH', label: '🕌 Salah' },
              { id: 'ADHKAR', label: '📿 Adhkar' },
              { id: 'QURAN', label: '📖 Quran' },
              { id: 'AKHLAQ', label: '🤝 Akhlaq' },
              { id: 'FASTING', label: '🌙 Fasting' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E] hover:bg-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleShareCard}
            className="text-xs text-[#0D381E] hover:underline font-semibold flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedNotice ? 'Score Copied!' : 'Share Progress'}</span>
          </button>
        </div>

        {/* Habits Checklist */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filteredHabits.map((habit) => {
            const isChecked = !!checkedHabits[habit.id];

            return (
              <div
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3.5 select-none ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                    : 'bg-[#F9F8F4] border-[#E6E2D8] hover:border-[#0D381E]/40 hover:bg-white'
                }`}
              >
                {/* Touch Checkbox */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                    isChecked
                      ? 'bg-[#0D381E] border-[#0D381E] text-[#E5C158]'
                      : 'bg-white border-[#C9C4B7] text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h4
                      className={`text-sm font-bold ${
                        isChecked ? 'text-emerald-950 line-through opacity-85' : 'text-[#0D381E]'
                      }`}
                    >
                      {habit.title}
                    </h4>
                    <span className="text-xs font-arabic text-[#57655B] font-medium">
                      {habit.arabicTitle}
                    </span>
                  </div>

                  <p className="text-xs text-[#57655B] mt-1 leading-relaxed">
                    {habit.description}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      isChecked
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-[#E5C158]/20 text-[#0D381E] border border-[#E5C158]/40'
                    }`}
                  >
                    +{habit.rewardPoints} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] flex items-center justify-between text-xs text-[#57655B]">
          <div className="flex items-center space-x-1.5 italic text-[11px]">
            <Heart className="w-3.5 h-3.5 text-rose-600" />
            <span>"Revive a Sunnah, gain the reward of those who follow it."</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold hover:bg-[#16532d] transition-colors cursor-pointer"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
