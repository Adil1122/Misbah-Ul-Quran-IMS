import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Compass,
  Calendar,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Building2,
  Share2,
} from 'lucide-react';
import {
  getDualBranchNamazTimes,
  BranchPrayerSummary,
  DualBranchNamaz,
} from '../../utils/prayerTimes.ts';

interface NamazScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCampusId: string;
  onCampusChange?: (campusId: string) => void;
}

export const NamazScheduleModal: React.FC<NamazScheduleModalProps> = ({
  isOpen,
  onClose,
  activeCampusId,
  onCampusChange,
}) => {
  const [dualNamaz, setDualNamaz] = useState<DualBranchNamaz>(() => getDualBranchNamazTimes());
  const [selectedTab, setSelectedTab] = useState<'UK' | 'PK' | 'DUAL'>(() => {
    if (activeCampusId === 'kts') return 'PK';
    if (activeCampusId === 'uk') return 'UK';
    return 'DUAL';
  });
  const [isCopied, setIsCopied] = useState(false);

  // Sync tab if active campus changes
  useEffect(() => {
    if (activeCampusId === 'kts') setSelectedTab('PK');
    else if (activeCampusId === 'uk') setSelectedTab('UK');
    else setSelectedTab('DUAL');
  }, [activeCampusId]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setDualNamaz(getDualBranchNamazTimes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setDualNamaz(getDualBranchNamazTimes());
  };

  const handleCopyTimetable = (summary: BranchPrayerSummary) => {
    const text = [
      `🕌 ${summary.branchLabel} - Namaz Schedule`,
      `Date: ${summary.currentDateStr} (${summary.hijriDate})`,
      `Local Time: ${summary.currentTimeStr}`,
      `Method: ${summary.calculationMethod}`,
      '------------------------------',
      ...summary.fullSchedule.map((s) => `${s.name.padEnd(8)} Adhan: ${s.adhan} | Iqamah: ${s.iqamah}`),
      '------------------------------',
      `Jummah: Khutbah ${summary.jummahSchedule.firstKhutbah} | Salah ${summary.jummahSchedule.firstSalah}`,
      'Misbah-ul-Quran Institute Management System',
    ].join('\n');

    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (!isOpen) return null;

  const renderSingleScheduleCard = (summary: BranchPrayerSummary) => {
    const isUK = summary.branchCode === 'UK';
    const flag = isUK ? '🇬🇧' : '🇵🇰';
    const badgeColor = isUK
      ? 'bg-sky-50 text-sky-800 border-sky-200'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';

    return (
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden flex flex-col h-full">
        {/* Branch Header */}
        <div className="bg-[#0D381E] text-white p-4 sm:p-5 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">{flag}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#E5C158]">
                  {summary.branchCode === 'UK' ? 'Branch UK-01' : 'Branch KTS-01'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                  {summary.timezone}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-lg sm:text-xl text-[#F3D273] mt-1">
                {summary.branchLabel}
              </h3>
              <p className="text-xs text-white/70 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#E5C158] shrink-0" />
                <span>{summary.locationName}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-white/60 block uppercase">Local Time</span>
              <span className="font-mono text-base sm:text-lg font-bold text-white">
                {summary.currentTimeStr}
              </span>
              <span className="text-[10px] text-[#E5C158] block mt-0.5">
                {summary.hijriDate}
              </span>
            </div>
          </div>

          {/* Next Prayer Highlight Banner */}
          <div className="mt-4 p-3 rounded-lg bg-black/30 border border-[#E5C158]/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E5C158] text-[#0D381E] flex items-center justify-center font-bold text-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#E5C158] uppercase tracking-wider block font-semibold">
                  Upcoming Congregational Prayer
                </span>
                <span className="font-heading font-bold text-base text-white">
                  {summary.nextPrayer} Namaz
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm sm:text-base font-bold text-[#F3D273]">
                {summary.nextPrayerTime}
              </span>
              <span className="text-[10px] text-white/70 block">
                {summary.countdownMinutes > 0
                  ? `in ~${summary.countdownMinutes} minutes`
                  : 'Starting soon'}
              </span>
            </div>
          </div>
        </div>

        {/* Timetable Table */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-[#0D381E] uppercase tracking-wider text-[11px]">
                5 Daily Prayers & Jama'ah Matrix
              </span>
              <span className="text-[#57655B] text-[11px]">
                Method: <span className="font-medium text-[#0D381E]">{summary.calculationMethod}</span>
              </span>
            </div>

            <div className="overflow-hidden border border-[#E6E2D8] rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] font-semibold text-[11px]">
                    <th className="py-2.5 px-3 text-left">Salah</th>
                    <th className="py-2.5 px-3 text-left">Adhan (Start)</th>
                    <th className="py-2.5 px-3 text-left">Iqamah (Jama'ah)</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {summary.fullSchedule.map((s) => (
                    <tr
                      key={s.name}
                      className={
                        s.isNext
                          ? 'bg-amber-50/70 font-semibold text-[#0D381E]'
                          : 'hover:bg-[#F9F8F4] transition-colors text-[#1A231E]'
                      }
                    >
                      <td className="py-2.5 px-3 flex items-center space-x-1.5">
                        {s.isNext && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>}
                        <span>{s.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{s.adhan}</td>
                      <td className="py-2.5 px-3 font-mono text-[#0D381E] font-medium">{s.iqamah}</td>
                      <td className="py-2.5 px-3 text-right">
                        {s.isNext ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D381E] text-[#E5C158]">
                            NEXT
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#57655B]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Friday / Jummah Timings */}
            <div className="mt-4 p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] text-xs">
              <div className="flex items-center space-x-1.5 text-[#0D381E] font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#E5C158]" />
                <span>Salat al-Jumu'ah (Friday Congregation)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#57655B] mt-1.5">
                <div>
                  <span className="block font-medium text-[#0D381E]">1st Jama'ah</span>
                  <span>Khutbah: {summary.jummahSchedule.firstKhutbah}</span>
                  <span className="block">Salah: {summary.jummahSchedule.firstSalah}</span>
                </div>
                {summary.jummahSchedule.secondKhutbah && (
                  <div>
                    <span className="block font-medium text-[#0D381E]">2nd Jama'ah (Overflow)</span>
                    <span>Khutbah: {summary.jummahSchedule.secondKhutbah}</span>
                    <span className="block">Salah: {summary.jummahSchedule.secondSalah}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-3 border-t border-[#E6E2D8] flex items-center justify-between text-xs">
            <span className="text-[10px] text-[#57655B] font-mono">
              GPS: {summary.coordinates}
            </span>
            <button
              onClick={() => handleCopyTimetable(summary)}
              className="px-2.5 py-1 rounded bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#0D381E] font-semibold text-[11px] border border-[#E6E2D8] flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span>{isCopied ? 'Copied!' : 'Copy Timings'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-[#F9F8F4] w-full max-w-5xl rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="bg-white border-b border-[#E6E2D8] px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D381E] border border-[#E5C158] flex items-center justify-center text-[#E5C158] shadow-xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-heading font-bold text-lg text-[#0D381E]">
                  Regional Namaz & Prayer Schedules
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D381E]/10 text-[#0D381E] border border-[#0D381E]/20">
                  Real-time Regional Matrix
                </span>
              </div>
              <p className="text-xs text-[#57655B]">
                Dynamic prayer times calibrated for UK Campus (London) and KTS Pakistan Campus (Haripur).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualRefresh}
              className="p-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#0D381E] border border-[#E6E2D8] transition-colors cursor-pointer"
              title="Refresh prayer timetable"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#57655B] hover:text-[#0D381E] border border-[#E6E2D8] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View / Tab Selector */}
        <div className="bg-white border-b border-[#E6E2D8] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#57655B]">Schedule View:</span>
            <div className="flex p-1 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-semibold">
              <button
                onClick={() => setSelectedTab('DUAL')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedTab === 'DUAL'
                    ? 'bg-[#0D381E] text-[#E5C158] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E]'
                }`}
              >
                🌍 Dual Comparison (Both)
              </button>
              <button
                onClick={() => setSelectedTab('UK')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedTab === 'UK'
                    ? 'bg-[#0D381E] text-[#E5C158] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E]'
                }`}
              >
                🇬🇧 UK Campus (London)
              </button>
              <button
                onClick={() => setSelectedTab('PK')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedTab === 'PK'
                    ? 'bg-[#0D381E] text-[#E5C158] shadow-xs'
                    : 'text-[#57655B] hover:text-[#0D381E]'
                }`}
              >
                🇵🇰 KTS Pakistan (Haripur)
              </button>
            </div>
          </div>

          {/* Quick Active Branch Filter Switcher */}
          {onCampusChange && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#57655B]">Active Branch Filter:</span>
              <select
                value={activeCampusId}
                onChange={(e) => onCampusChange(e.target.value)}
                className="bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#0D381E] cursor-pointer"
              >
                <option value="all">All Branches (Global)</option>
                <option value="uk">UK Campus (London)</option>
                <option value="kts">KTS Pakistan (Haripur)</option>
              </select>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {selectedTab === 'DUAL' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderSingleScheduleCard(dualNamaz.uk)}
              {renderSingleScheduleCard(dualNamaz.pk)}
            </div>
          ) : selectedTab === 'UK' ? (
            <div className="max-w-2xl mx-auto">
              {renderSingleScheduleCard(dualNamaz.uk)}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {renderSingleScheduleCard(dualNamaz.pk)}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-white border-t border-[#E6E2D8] px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#57655B] shrink-0">
          <div className="flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-[#0D381E]" />
            <span>
              Calculated using astronomical solar algorithms with official local mosque timetable offsets.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0D381E] text-white hover:bg-[#16532d] font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
