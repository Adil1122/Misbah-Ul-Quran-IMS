import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  MapPin,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award,
} from 'lucide-react';
import {
  ISLAMIC_CALENDAR_EVENTS,
  IslamicCalendarEvent,
} from '../../data/islamicData.ts';

interface IslamicCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCampusId?: string;
}

export const IslamicCalendarModal: React.FC<IslamicCalendarModalProps> = ({
  isOpen,
  onClose,
  activeCampusId = 'all',
}) => {
  const [events, setEvents] = useState<IslamicCalendarEvent[]>(ISLAMIC_CALENDAR_EVENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>(activeCampusId);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventHijri, setNewEventHijri] = useState('15 Shawwal 1447 AH');
  const [newEventGregorian, setNewEventGregorian] = useState('May 2026');
  const [newEventCampus, setNewEventCampus] = useState<'all' | 'uk' | 'kts'>('all');
  const [newEventCategory, setNewEventCategory] = useState<IslamicCalendarEvent['category']>('MADRASA_ACADEMIC');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  const filteredEvents = events.filter((e) => {
    const matchesCategory =
      selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesBranch =
      selectedBranch === 'all' || e.campusScope === 'all' || e.campusScope === selectedBranch;
    return matchesCategory && matchesBranch;
  });

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const created: IslamicCalendarEvent = {
      id: `cal-custom-${Date.now()}`,
      title: newEventTitle.trim(),
      arabicTitle: 'مُنَاسَبَةٌ جَدِيدَةٌ',
      hijriDate: newEventHijri,
      gregorianDate: newEventGregorian,
      category: newEventCategory,
      campusScope: newEventCampus,
      description: newEventDesc || 'Madrasa community gathering and milestone.',
    };

    setEvents((prev) => [created, ...prev]);
    setIsAddingEvent(false);
    setNewEventTitle('');
    setNewEventDesc('');
    setToastMessage(`✓ Event "${created.title}" successfully added to Madrasa Calendar.`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const getCategoryBadge = (cat: IslamicCalendarEvent['category']) => {
    switch (cat) {
      case 'SUNNAH_FAST':
        return { label: 'Sunnah Fasting', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'SACRED_HOLIDAY':
        return { label: 'Sacred Islamic Day', color: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'MADRASA_ACADEMIC':
        return { label: 'Madrasa Milestone', color: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'EXAMINATION':
        return { label: 'Examinations', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      default:
        return { label: 'Event', color: 'bg-stone-50 text-stone-800 border-stone-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-[#FAF8F5] w-full max-w-3xl rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#1A231E]">
        {/* Top Header */}
        <div className="bg-[#0D381E] text-white px-5 py-4 flex items-center justify-between border-b border-[#E5C158]/30 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#E5C158] text-[#0D381E] flex items-center justify-center font-bold text-base shadow-xs">
              🌙
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F3D273] leading-tight">
                Islamic Hijri & Madrasa Academic Calendar
              </h2>
              <p className="text-[10px] text-white/70">
                Current Hijri Year: 1447 AH · Shawwal / Dhu al-Qi'dah / Dhu al-Hijjah
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
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="bg-white border-b border-[#E6E2D8] px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            {[
              { id: 'ALL', label: 'All Dates' },
              { id: 'SUNNAH_FAST', label: 'Sunnah Fasts' },
              { id: 'SACRED_HOLIDAY', label: 'Sacred Holidays' },
              { id: 'MADRASA_ACADEMIC', label: 'Madrasa Schedule' },
              { id: 'EXAMINATION', label: 'Exams' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === tab.id
                    ? 'bg-[#0D381E] text-[#F3D273]'
                    : 'bg-[#F9F8F4] text-[#57655B] hover:text-[#0D381E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action & Branch filter */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs font-semibold bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer text-[#0D381E]"
            >
              <option value="all">All Campuses</option>
              <option value="uk">UK Campus</option>
              <option value="kts">KTS Pakistan</option>
            </select>

            <button
              onClick={() => setIsAddingEvent(!isAddingEvent)}
              className="px-3 py-1.5 rounded-lg bg-[#E5C158] hover:bg-[#d8b346] text-[#0D381E] text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add Event Form Accordion */}
          {isAddingEvent && (
            <form
              onSubmit={handleAddEventSubmit}
              className="bg-white p-4 rounded-xl border border-[#E5C158] shadow-md space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-2">
                <span className="font-bold text-xs text-[#0D381E] uppercase">
                  Schedule New Madrasa / Islamic Event
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  className="text-[#57655B] hover:text-[#1A231E] text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#57655B] mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Annual Quran Recitation Competition"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg focus:outline-none focus:border-[#0D381E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#57655B] mb-1">
                    Category *
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as any)}
                    className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg focus:outline-none focus:border-[#0D381E]"
                  >
                    <option value="MADRASA_ACADEMIC">Madrasa Milestone</option>
                    <option value="EXAMINATION">Examinations</option>
                    <option value="SUNNAH_FAST">Sunnah Fasting</option>
                    <option value="SACRED_HOLIDAY">Sacred Holiday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#57655B] mb-1">
                    Hijri Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEventHijri}
                    onChange={(e) => setNewEventHijri(e.target.value)}
                    className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg focus:outline-none focus:border-[#0D381E]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#57655B] mb-1">
                    Campus Scope *
                  </label>
                  <select
                    value={newEventCampus}
                    onChange={(e) => setNewEventCampus(e.target.value as any)}
                    className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg focus:outline-none focus:border-[#0D381E]"
                  >
                    <option value="all">All Campuses</option>
                    <option value="uk">UK Campus</option>
                    <option value="kts">KTS Pakistan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#57655B] mb-1">
                  Event Description & Guidance
                </label>
                <textarea
                  rows={2}
                  placeholder="Details for faculty, students, and parents..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full p-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-none focus:border-[#0D381E]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D381E] text-[#F3D273] font-bold text-xs rounded-lg hover:bg-[#16532d] cursor-pointer transition-colors"
                >
                  Save to Calendar
                </button>
              </div>
            </form>
          )}

          {/* Current Month Banner */}
          <div className="bg-[#0D381E] text-white p-4 rounded-xl border border-[#E5C158]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-[#E5C158]">
                <span>🌙 Shawwal 1447 AH</span>
                <span>·</span>
                <span className="text-white/80">Month of Forgiveness & Steadfastness</span>
              </div>
              <h3 className="font-heading font-bold text-lg text-white mt-0.5">
                Current Term Academic & Spiritual Matrix
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-white/60 block uppercase">Upcoming Milestone</span>
              <span className="text-xs font-bold text-[#F3D273]">
                Shawwal 6 Fasts & Annual Hifz Sanad Convocation
              </span>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const badge = getCategoryBadge(evt.category);
              return (
                <div
                  key={evt.id}
                  className="bg-white p-4 rounded-xl border border-[#E6E2D8] hover:border-[#0D381E]/40 transition-all shadow-2xs space-y-2 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-[#57655B] font-semibold">
                        {evt.campusScope === 'all'
                          ? 'Global (UK & PK)'
                          : evt.campusScope === 'uk'
                          ? 'UK Campus'
                          : 'KTS Pakistan'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-[#0D381E]">
                      <Calendar className="w-3.5 h-3.5 text-[#E5C158]" />
                      <span>{evt.hijriDate}</span>
                      <span className="text-[#57655B]">({evt.gregorianDate})</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-base text-[#0D381E] group-hover:text-emerald-800 transition-colors">
                      {evt.title}
                    </h4>
                    {evt.arabicTitle && (
                      <p className="text-xs font-arabic text-[#E5C158] font-semibold">
                        {evt.arabicTitle}
                      </p>
                    )}
                    <p className="text-xs text-[#57655B] mt-1 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F5] border-t border-[#E6E2D8] px-5 py-3 flex items-center justify-between text-xs text-[#57655B] shrink-0">
          <span>Synced with Umm al-Qura & Central Mosque London Timetable</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0D381E] text-white hover:bg-[#16532d] font-bold cursor-pointer transition-colors"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
