import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Compass,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckCircle2,
  Heart,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '../../types/ims.ts';
import { DAILY_ISLAMIC_REFLECTIONS } from '../../data/islamicData.ts';
import { getDualBranchNamazTimes } from '../../utils/prayerTimes.ts';

interface IslamicHeroBannerProps {
  user: UserSession;
  activeCampusId?: string;
  activeCampusName?: string;
  onOpenNamazModal?: () => void;
  onOpenSunnahModal?: () => void;
}

export const IslamicHeroBanner: React.FC<IslamicHeroBannerProps> = ({
  user,
  activeCampusId = 'all',
  activeCampusName,
  onOpenNamazModal,
  onOpenSunnahModal,
}) => {
  // Live Dual Namaz Times
  const [dualNamaz, setDualNamaz] = useState(() => getDualBranchNamazTimes());
  const [currentReflectionIndex, setCurrentReflectionIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Live time ticker
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = activeCampusId === 'kts' ? 'Asia/Karachi' : 'Europe/London';
      setCurrentTimeStr(
        now.toLocaleTimeString('en-GB', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDualNamaz(getDualBranchNamazTimes());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeCampusId]);

  const reflection = DAILY_ISLAMIC_REFLECTIONS[currentReflectionIndex] || DAILY_ISLAMIC_REFLECTIONS[0];

  const handleNextReflection = () => {
    setCurrentReflectionIndex((prev) => (prev + 1) % DAILY_ISLAMIC_REFLECTIONS.length);
    setIsPlayingAudio(false);
  };

  const handlePrevReflection = () => {
    setCurrentReflectionIndex((prev) =>
      prev === 0 ? DAILY_ISLAMIC_REFLECTIONS.length - 1 : prev - 1
    );
    setIsPlayingAudio(false);
  };

  const handleCopyReflection = () => {
    const text = `📖 Misbah-ul-Quran Daily Reflection:\n"${reflection.arabicText}"\n${reflection.englishTranslation}\n— ${reflection.sourceReference} (${reflection.narratorOrSurah})`;
    navigator.clipboard?.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const getPortalLabel = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return 'Central Super Admin Portal';
      case 'CAMPUS_ADMIN':
        return 'Branch Administration Portal';
      case 'TEACHER':
        return 'Faculty & Halaqah Lead Portal';
      case 'STUDENT':
        return 'Student Learning Portal';
      case 'PARENT':
        return 'Parent & Guardian Portal';
      default:
        return 'Institute Portal';
    }
  };

  const getCampusDisplay = () => {
    if (activeCampusName) return activeCampusName;
    if (activeCampusId === 'uk') return 'UK Campus (London)';
    if (activeCampusId === 'kts') return 'KTS Pakistan Campus (Haripur)';
    return 'UK & KTS Pakistan Campuses';
  };

  const getQiblaBearing = () => {
    if (activeCampusId === 'uk') return { bearing: '118° ESE', label: 'London Qibla' };
    if (activeCampusId === 'kts') return { bearing: '259° WSW', label: 'Haripur Qibla' };
    return { bearing: 'Ka\'bah Al-Mukarramah', label: 'Global Qibla' };
  };

  const currentSummary = activeCampusId === 'kts' ? dualNamaz.pk : dualNamaz.uk;
  const qibla = getQiblaBearing();

  return (
    <div className="relative rounded-2xl bg-[#092b17] bg-gradient-to-r from-[#072212] via-[#0D381E] to-[#0a2f1a] text-white p-4 sm:p-6 md:p-7 shadow-lg border border-[#16532d] border-t-2 border-t-[#E5C158] overflow-hidden mb-6">
      {/* Decorative background Islamic geometry watermark */}
      <div className="absolute right-0 top-0 bottom-0 w-96 opacity-5 pointer-events-none flex items-center justify-center font-display text-[260px] text-[#E5C158] select-none">
        ۞
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
        {/* Left Side: Brand, Bismillah, Title, Subtitle, Date */}
        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0">
          {/* Circular Misbah-ul-Quran Crest Seal */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white p-1 border-2 border-[#E5C158] shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#0D381E] border border-[#072212] flex flex-col items-center justify-center text-center p-0.5 sm:p-1 relative overflow-hidden">
              <span className="text-[6px] sm:text-[7px] text-[#E5C158] uppercase font-bold tracking-tighter leading-none block">
                Misbah
              </span>
              <div className="text-xs sm:text-sm font-bold text-white font-heading my-0.5">
                📖
              </div>
              <span className="text-[5px] sm:text-[6px] text-white/80 uppercase font-mono tracking-tighter leading-none block">
                Al-Quran
              </span>
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            {/* Bismillah Calligraphy */}
            <div className="text-xs sm:text-base text-[#E5C158] font-arabic font-semibold tracking-wider">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            {/* Arabic Name + Badge */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm text-[#F3D273] font-arabic font-medium truncate">
                جامعة مصباح القرآن الدولية
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#072212]/80 text-[#E5C158] border border-[#E5C158]/30">
                UK & KTS Pakistan
              </span>
            </div>

            {/* Main Title */}
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl text-white tracking-wide leading-tight truncate">
              MISBAH-UL-QURAN
            </h1>

            {/* Portal Subtitle */}
            <div className="text-[11px] sm:text-sm font-semibold text-[#E5C158] flex items-center space-x-1.5 truncate">
              <span className="truncate">{getPortalLabel()}</span>
              <span className="text-white/50">·</span>
              <span className="text-emerald-300 truncate">{getCampusDisplay()}</span>
            </div>

            {/* Date + Live Ticker */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-[10px] sm:text-[11px] text-[#E6E2D8]/80 pt-0.5 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
              <span className="font-semibold text-white">17 Shawwal 1447 AH</span>
              <span>·</span>
              <span>Tuesday, 6 October 2026</span>
              {currentTimeStr && (
                <>
                  <span>·</span>
                  <span className="font-mono text-[#F3D273] font-bold">
                    {currentTimeStr}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Namaz Clock Widget + Interactive Daily Hadith Carousel */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 sm:gap-4 shrink-0">
          {/* Next Jam'at Salah Interactive Card */}
          <div
            onClick={onOpenNamazModal}
            className="bg-[#072212]/90 border border-[#16532d] hover:border-[#E5C158] transition-all p-3 rounded-xl shadow-inner flex items-center justify-between space-x-3 w-full sm:w-auto min-w-0 sm:min-w-64 cursor-pointer group"
            title="Click to open interactive regional Namaz timetable"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#E5C158]/15 border border-[#E5C158]/30 flex items-center justify-center text-[#E5C158] shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5C158]" />
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#E6E2D8]/70 block font-bold">
                  NEXT SALAH ({activeCampusId === 'kts' ? 'HARIPUR' : 'LONDON'})
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-white tracking-wide block">
                  {currentSummary.nextPrayer}: {currentSummary.nextPrayerTime}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9px] text-[#E5C158] font-bold block uppercase">
                {currentSummary.countdownMinutes > 0 ? `~${currentSummary.countdownMinutes}m` : 'Now'}
              </span>
              <span className="text-[9px] text-white/50 block">View Times →</span>
            </div>
          </div>

          {/* Interactive Prophetic Hadith / Ayat Flipper */}
          <div className="bg-black/35 border border-[#16532d] hover:border-[#E5C158]/40 transition-colors p-3 rounded-xl w-full sm:w-auto max-w-md space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#E5C158] border-b border-white/10 pb-1">
              <div className="flex items-center space-x-1 font-bold">
                <Sparkles className="w-3 h-3 text-[#E5C158]" />
                <span>Daily Prophetic Gem ({currentReflectionIndex + 1}/{DAILY_ISLAMIC_REFLECTIONS.length})</span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrevReflection}
                  className="p-0.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
                  title="Previous reflection"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextReflection}
                  className="p-0.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
                  title="Next reflection"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopyReflection}
                  className="p-0.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer ml-1"
                  title="Copy Hadith quote"
                >
                  {copiedQuote ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-arabic text-[#E5C158] font-medium leading-relaxed">
              "{reflection.arabicText}"
            </p>
            <p className="text-[10px] sm:text-[11px] text-[#E6E2D8]/90 italic leading-snug">
              "{reflection.englishTranslation}"
            </p>
            <div className="flex items-center justify-between text-[9px] text-white/60 pt-0.5">
              <span>{reflection.sourceReference} · {reflection.narratorOrSurah}</span>
              {onOpenSunnahModal && (
                <button
                  onClick={onOpenSunnahModal}
                  className="text-[#E5C158] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Heart className="w-2.5 h-2.5 text-rose-400" />
                  <span>Track Sunnah</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
