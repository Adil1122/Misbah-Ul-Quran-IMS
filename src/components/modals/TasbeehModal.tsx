import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
  CheckCircle2,
  Heart,
  ChevronRight,
  Info,
} from 'lucide-react';
import { DHIKR_PRESETS, DhikrItem } from '../../data/islamicData.ts';

interface TasbeehModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const TasbeehModal: React.FC<TasbeehModalProps> = ({
  isOpen,
  onClose,
  userName = 'Seeker of Knowledge',
}) => {
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrItem>(DHIKR_PRESETS[0]);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(33);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [totalToday, setTotalToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('misbah_tasbeeh_total_today');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isPressing, setIsPressing] = useState<boolean>(false);

  // Audio Context synthesizer for clicks and chimes
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio fallback silent
    }
  };

  const playChimeSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Play a harmonious 3-note chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
      });
    } catch (e) {
      // Audio fallback silent
    }
  };

  // Keyboard shortcut listener (Spacebar or Enter to increment)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleIncrement();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentCount, targetCount]);

  // Persist total daily dhikr
  useEffect(() => {
    try {
      localStorage.setItem('misbah_tasbeeh_total_today', totalToday.toString());
    } catch {}
  }, [totalToday]);

  if (!isOpen) return null;

  const handleIncrement = () => {
    playClickSound();
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 120);

    const next = currentCount + 1;
    setTotalToday((prev) => prev + 1);

    if (targetCount > 0 && next >= targetCount) {
      // Completed target cycle
      setCurrentCount(0);
      setCompletedCycles((prev) => prev + 1);
      setShowCelebration(true);
      playChimeSound();
      setTimeout(() => setShowCelebration(false), 2600);
    } else {
      setCurrentCount(next);
    }
  };

  const handleReset = () => {
    setCurrentCount(0);
  };

  const handleSelectDhikr = (dhikr: DhikrItem) => {
    setSelectedDhikr(dhikr);
    setTargetCount(dhikr.recommendedCount);
    setCurrentCount(0);
  };

  const progressPercent = targetCount > 0 ? Math.min(100, Math.round((currentCount / targetCount) * 100)) : 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-[#FAF8F5] w-full max-w-lg rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden my-auto flex flex-col relative text-[#1A231E]">
        {/* Top Header */}
        <div className="bg-[#0D381E] text-white px-5 py-4 flex items-center justify-between border-b border-[#E5C158]/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E5C158] text-[#0D381E] flex items-center justify-center font-bold text-sm shadow-xs">
              📿
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F3D273] leading-tight">
                Digital Tasbeeh & Dhikr Counter
              </h2>
              <p className="text-[10px] text-white/70">
                Misbah-ul-Quran Spiritual Companion · {userName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                soundEnabled ? 'text-[#E5C158] bg-white/10' : 'text-white/40 hover:text-white'
              }`}
              title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Milestone Celebration Banner */}
        {showCelebration && (
          <div className="bg-[#E5C158] text-[#0D381E] px-4 py-2.5 flex items-center justify-center space-x-2 text-xs font-bold animate-in slide-in-from-top duration-200 shadow-inner z-20">
            <Sparkles className="w-4 h-4 text-[#0D381E]" />
            <span>Alhamdulillah! Completed full cycle ({targetCount} counts). May Allah accept!</span>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-5">
          {/* Preset Dhikr Selector Carousel */}
          <div>
            <label className="block text-[11px] font-bold text-[#0D381E] uppercase tracking-wider mb-2">
              Select Sacred Adhkar & Remembrance
            </label>
            <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {DHIKR_PRESETS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleSelectDhikr(d)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                    selectedDhikr.id === d.id
                      ? 'bg-[#0D381E] text-[#F3D273] border-[#0D381E] shadow-sm ring-2 ring-[#E5C158]/50'
                      : 'bg-white text-[#57655B] border-[#E6E2D8] hover:border-[#0D381E]/40'
                  }`}
                >
                  <span className="block text-xs truncate">{d.transliteration}</span>
                  <span className="block text-[10px] opacity-75 font-mono">{d.recommendedCount}×</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Dhikr Display Card */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] text-center shadow-xs space-y-2 relative overflow-hidden">
            <div className="text-xl sm:text-2xl font-arabic font-bold text-[#0D381E] tracking-wide leading-relaxed py-1">
              {selectedDhikr.arabic}
            </div>
            <div className="text-sm font-semibold text-[#1A231E]">
              {selectedDhikr.transliteration}
            </div>
            <p className="text-xs text-[#57655B] italic">
              "{selectedDhikr.translation}"
            </p>
            <div className="pt-2 border-t border-[#E6E2D8]/60 text-[11px] text-[#0D381E] flex items-center justify-center space-x-1 font-medium bg-[#FAF8F5] -mx-4 -mb-4 p-2.5">
              <Info className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
              <span className="truncate">{selectedDhikr.virtue}</span>
            </div>
          </div>

          {/* Main Tactile Interactive Clicker & Progress Ring */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative flex items-center justify-center">
              {/* SVG Circular Progress Ring */}
              <svg className="w-56 h-56 transform -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="98"
                  stroke="#E6E2D8"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="112"
                  cy="112"
                  r="98"
                  stroke="#0D381E"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 98}
                  strokeDashoffset={2 * Math.PI * 98 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-150 ease-out"
                />
              </svg>

              {/* Large Tactile Click Button */}
              <button
                onClick={handleIncrement}
                className={`absolute w-44 h-44 rounded-full bg-gradient-to-b from-[#0D381E] to-[#072212] text-white flex flex-col items-center justify-center shadow-xl border-4 border-[#E5C158] cursor-pointer transition-transform duration-100 select-none group focus:outline-none focus:ring-4 focus:ring-[#E5C158]/30 ${
                  isPressing ? 'scale-95 shadow-md' : 'hover:scale-102 shadow-2xl'
                }`}
                aria-label="Click or press space to increment Dhikr count"
              >
                <span className="text-[11px] uppercase tracking-widest text-[#E5C158] font-bold block mb-1">
                  TAP / SPACE
                </span>
                <span className="text-5xl font-mono font-extrabold text-white tracking-tight tabular-nums block">
                  {currentCount}
                </span>
                <span className="text-xs text-white/70 font-mono mt-1">
                  Target: {targetCount > 0 ? targetCount : 'Free'}
                </span>
              </button>
            </div>
          </div>

          {/* Target Preset Selector & Controls */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E6E2D8] text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-[#57655B] uppercase">Target:</span>
              {[33, 99, 100, 300, 0].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTargetCount(t);
                    setCurrentCount(0);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    targetCount === t
                      ? 'bg-[#0D381E] text-[#F3D273]'
                      : 'bg-[#F9F8F4] text-[#57655B] hover:text-[#0D381E]'
                  }`}
                >
                  {t === 0 ? 'Free' : t}
                </button>
              ))}
            </div>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-rose-700 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
              title="Reset current counter to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Session Statistics Bar */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-[#E6E2D8]">
              <span className="text-[10px] text-[#57655B] uppercase block font-semibold">Cycles Completed</span>
              <span className="font-mono text-base font-bold text-[#0D381E] tabular-nums">
                {completedCycles}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#E6E2D8]">
              <span className="text-[10px] text-[#57655B] uppercase block font-semibold">Today's Total</span>
              <span className="font-mono text-base font-bold text-[#0D381E] tabular-nums">
                {totalToday}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#E6E2D8]">
              <span className="text-[10px] text-[#57655B] uppercase block font-semibold">Current Goal</span>
              <span className="font-mono text-base font-bold text-[#E5C158] tabular-nums">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F5] border-t border-[#E6E2D8] px-5 py-3 flex items-center justify-between text-xs text-[#57655B]">
          <span className="italic text-[11px]">
            Tip: Press the Spacebar on your keyboard for smooth counting.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0D381E] text-white hover:bg-[#16532d] font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
