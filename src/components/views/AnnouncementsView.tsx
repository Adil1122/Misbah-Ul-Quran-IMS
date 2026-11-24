import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  Plus,
  Send,
  MessageSquare,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Trophy,
  Users,
  Archive,
  Eye,
  Search,
  Edit2,
} from 'lucide-react';
import { UserSession, EventRecord, EventType } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';

interface AnnouncementsViewProps {
  user: UserSession;
  activeCampusId: string;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  user,
  activeCampusId,
}) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'events' | 'notifications'>('announcements');
  const [feedback, setFeedback] = useState('');

  const effectiveCampus = user.role === 'SUPER_ADMIN' ? activeCampusId : user.activeCampusId;
  const announcements = IMSStateService.getAnnouncements(effectiveCampus);
  const events = IMSStateService.getEvents(effectiveCampus);
  const notifications = IMSStateService.getNotifications(effectiveCampus);
  const classes = IMSStateService.getClasses(effectiveCampus);

  // Search filters
  const [searchAnnouncements, setSearchAnnouncements] = useState('');
  const [searchEvents, setSearchEvents] = useState('');

  // Announcement Modal State (Create & Edit)
  const [isNewAnnOpen, setIsNewAnnOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [annPriority, setAnnPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [annTarget, setAnnTarget] = useState<'ALL' | 'TEACHERS' | 'PARENTS'>('ALL');
  const [annSendEmail, setAnnSendEmail] = useState(true);
  const [annSendWhatsApp, setAnnSendWhatsApp] = useState(true);

  // Event Modal State (Create & Edit)
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [evtType, setEvtType] = useState<EventType>('EXAM');
  const [evtClassId, setEvtClassId] = useState<string>(classes[0]?.id || 'cls-g1');
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDateTime, setEvtDateTime] = useState('2026-10-25 17:00');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtSendReminders, setEvtSendReminders] = useState(true);
  const [selectedAnnouncementForView, setSelectedAnnouncementForView] = useState<any | null>(null);
  const [selectedEventForView, setSelectedEventForView] = useState<EventRecord | null>(null);

  const canPublish = user.role === 'SUPER_ADMIN' || user.role === 'CAMPUS_ADMIN';

  const handleOpenEditAnnouncement = (ann: any) => {
    setEditingAnnouncementId(ann.id);
    setAnnTitle(ann.title);
    setAnnDesc(ann.content);
    setAnnPriority(ann.priority);
    setAnnTarget(ann.targetRole);
    setAnnSendEmail(false);
    setAnnSendWhatsApp(false);
    setIsNewAnnOpen(true);
  };

  const handleOpenEditEvent = (evt: EventRecord) => {
    setEditingEventId(evt.id);
    setEvtTitle(evt.title);
    setEvtDesc(evt.description);
    setEvtType(evt.type);
    setEvtClassId(evt.classId || classes[0]?.id || 'cls-g1');
    setEvtDateTime(evt.dateTime);
    setEvtSendReminders(false);
    setIsNewEventOpen(true);
  };

  const handleArchiveAnnouncement = (id: string, title: string) => {
    setFeedback(`Announcement "${title}" moved to archive.`);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleArchiveEvent = (id: string, title: string) => {
    setFeedback(`Event "${title}" archived.`);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annDesc.trim()) return;

    if (editingAnnouncementId) {
      IMSStateService.updateAnnouncement(editingAnnouncementId, {
        title: annTitle.trim(),
        content: annDesc.trim(),
        priority: annPriority,
        targetRole: annTarget,
      });
      setFeedback(`Announcement "${annTitle.trim()}" updated successfully.`);
    } else {
      IMSStateService.publishAnnouncement({
        title: annTitle.trim(),
        content: annDesc.trim(),
        priority: annPriority,
        targetRole: annTarget,
        campusId: effectiveCampus === 'all' ? null : effectiveCampus,
      });

      if (annSendEmail || annSendWhatsApp) {
        IMSStateService.sendPushNotification({
          recipientType: annTarget === 'ALL' ? 'ALL' : annTarget === 'TEACHERS' ? 'TEACHERS' : 'PARENTS',
          channel: annSendEmail && annSendWhatsApp ? 'BOTH' : annSendEmail ? 'EMAIL' : 'WHATSAPP',
          title: `Announcement: ${annTitle.trim()}`,
          message: annDesc.trim(),
          campusId: effectiveCampus === 'all' ? undefined : effectiveCampus,
        });
      }
      setFeedback(`Announcement published and dispatched to ${annTarget}.`);
    }

    setIsNewAnnOpen(false);
    setEditingAnnouncementId(null);
    setAnnTitle('');
    setAnnDesc('');
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim() || !evtDesc.trim()) return;

    const selClass = classes.find((c) => c.id === evtClassId);

    if (editingEventId) {
      IMSStateService.updateEvent(editingEventId, {
        type: evtType,
        title: evtTitle.trim(),
        classId: evtType === 'EXAM' ? evtClassId : undefined,
        className: evtType === 'EXAM' ? selClass?.name : undefined,
        dateTime: evtDateTime,
        description: evtDesc.trim(),
      });
      setFeedback(`Event "${evtTitle.trim()}" updated successfully.`);
    } else {
      IMSStateService.createEvent(
        {
          type: evtType,
          title: evtTitle.trim(),
          classId: evtType === 'EXAM' ? evtClassId : undefined,
          className: evtType === 'EXAM' ? selClass?.name : undefined,
          dateTime: evtDateTime,
          description: evtDesc.trim(),
          campusId: effectiveCampus === 'all' ? 'uk' : effectiveCampus,
        },
        evtSendReminders
      );
      setFeedback(`Event "${evtTitle.trim()}" created with instant reminders dispatched.`);
    }

    setIsNewEventOpen(false);
    setEditingEventId(null);
    setEvtTitle('');
    setEvtDesc('');
    setTimeout(() => setFeedback(''), 4000);
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    if (!searchAnnouncements.trim()) return true;
    const q = searchAnnouncements.toLowerCase();
    return (
      ann.title.toLowerCase().includes(q) ||
      ann.content.toLowerCase().includes(q) ||
      ann.targetRole.toLowerCase().includes(q) ||
      (ann.campusId && ann.campusId.toLowerCase().includes(q))
    );
  });

  const filteredEvents = events.filter((evt) => {
    if (!searchEvents.trim()) return true;
    const q = searchEvents.toLowerCase();
    return (
      evt.title.toLowerCase().includes(q) ||
      evt.description.toLowerCase().includes(q) ||
      evt.type.toLowerCase().includes(q) ||
      (evt.className && evt.className.toLowerCase().includes(q)) ||
      (evt.campusId && evt.campusId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header with Actions */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-xl text-[#0D381E] flex items-center space-x-2">
            <span>Announcements & Events</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
              Notice Board
            </span>
          </h3>
          <p className="text-xs text-[#57655B] mt-0.5">
            Institutional broadcasts, scheduled academic events, competitions, and community notices across campuses.
          </p>
        </div>

        {canPublish && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsNewAnnOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 text-[#E5C158]" />
              <span>Create Announcement</span>
            </button>

            <button
              onClick={() => setIsNewEventOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] border border-[#E6E2D8] text-[#0D381E] text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4 text-[#0D381E]" />
              <span>Schedule Event</span>
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E6E2D8] text-xs overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'announcements'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Announcements ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'events'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Events & Exams ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'notifications'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Push Logs ({notifications.length})</span>
        </button>
      </div>

      {/* TAB 1: ANNOUNCEMENTS TABLE */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden animate-in fade-in">
          {/* MOBILE VIEW: Announcement Cards */}
          <div className="block sm:hidden divide-y divide-[#E6E2D8] p-3 space-y-2.5">
            {announcements.length === 0 ? (
              <p className="p-4 text-center text-xs text-[#57655B]">No announcements published yet.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-3.5 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#0D381E]">{ann.title}</h4>
                      <div className="text-[11px] text-[#57655B]">
                        {ann.campusId ? `${ann.campusId.toUpperCase()} Campus` : 'All Campuses'} · {ann.publishedAt}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ann.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A231E] line-clamp-2">{ann.content}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E6E2D8]/60">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E]">
                      {ann.targetRole}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedAnnouncementForView(ann)}
                        className="px-2.5 py-1 rounded bg-[#0D381E] text-[#F3D273] font-semibold text-xs cursor-pointer flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      {canPublish && (
                        <button
                          onClick={() => handleArchiveAnnouncement(ann.id, ann.title)}
                          className="px-2.5 py-1 rounded bg-white border border-[#E6E2D8] text-[#57655B] font-semibold text-xs cursor-pointer flex items-center space-x-1"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP VIEW: Full Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Intended Audience or Campus</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-[#57655B]">
                      No announcements published yet.
                    </td>
                  </tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-[#F9F8F4] transition-colors">
                      <td className="p-3.5 font-semibold text-[#1A231E]">
                        {ann.title}
                        <p className="text-[10px] text-[#57655B] line-clamp-1 font-normal mt-0.5">
                          {ann.content}
                        </p>
                      </td>
                      <td className="p-3.5 font-mono text-[#57655B] whitespace-nowrap">{ann.publishedAt}</td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E]">
                            {ann.targetRole}
                          </span>
                          <span className="text-[11px] text-[#57655B] font-mono">
                            {ann.campusId ? `${ann.campusId.toUpperCase()} Campus` : 'All Campuses'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Published
                        </span>
                        {ann.priority === 'URGENT' && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                            Urgent
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedAnnouncementForView(ann)}
                            className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer flex items-center space-x-1 shadow-2xs"
                            title="View announcement details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {canPublish && (
                            <button
                              onClick={() => handleArchiveAnnouncement(ann.id, ann.title)}
                              className="px-2.5 py-1 rounded bg-white hover:bg-[#E6E2D8] border border-[#E6E2D8] text-[#57655B] font-semibold text-xs cursor-pointer flex items-center space-x-1"
                              title="Archive announcement"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>Archive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EVENTS TABLE */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden animate-in fade-in">
          {/* MOBILE VIEW: Event Cards */}
          <div className="block sm:hidden divide-y divide-[#E6E2D8] p-3 space-y-2.5">
            {events.length === 0 ? (
              <p className="p-4 text-center text-xs text-[#57655B]">No events or exams scheduled.</p>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="p-3.5 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#0D381E]">{evt.title}</h4>
                      <div className="text-[11px] font-mono text-[#0D381E] font-medium mt-0.5">
                        {evt.dateTime}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E]">
                      {evt.type.replace('_', ' ')}
                    </span>
                  </div>
                  {evt.className && (
                    <div className="text-xs text-[#57655B]">
                      Class: <span className="font-semibold text-[#1A231E]">{evt.className}</span>
                    </div>
                  )}
                  <p className="text-xs text-[#57655B] line-clamp-2">{evt.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E6E2D8]/60">
                    <span className="text-[11px] text-[#57655B]">
                      {evt.campusId ? `${evt.campusId.toUpperCase()} Campus` : 'Main Hall'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedEventForView(evt)}
                        className="px-2.5 py-1 rounded bg-[#0D381E] text-[#F3D273] font-semibold text-xs cursor-pointer flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      {canPublish && (
                        <button
                          onClick={() => handleArchiveEvent(evt.id, evt.title)}
                          className="px-2.5 py-1 rounded bg-white border border-[#E6E2D8] text-[#57655B] font-semibold text-xs cursor-pointer flex items-center space-x-1"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP VIEW: Full Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3.5">Event Name</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Campus</th>
                  <th className="p-3.5">Intended Audience</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-[#57655B]">
                      No events or exams scheduled.
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#F9F8F4] transition-colors">
                      <td className="p-3.5 font-semibold text-[#1A231E]">
                        {evt.title}
                        {evt.className && (
                          <span className="text-[10px] text-[#57655B] block font-medium mt-0.5">
                            Class: {evt.className} ({evt.type.replace('_', ' ')})
                          </span>
                        )}
                        <p className="text-[10px] text-[#57655B] line-clamp-1 font-normal mt-0.5">
                          {evt.description}
                        </p>
                      </td>
                      <td className="p-3.5 font-mono text-[#0D381E] font-medium whitespace-nowrap">
                        {evt.dateTime}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E] border border-[#E6E2D8]">
                          {evt.campusId ? `${evt.campusId.toUpperCase()} Campus` : 'All Campuses'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800">
                          {evt.type === 'EXAM' ? 'Students & Parents' : 'Open / Faculty'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedEventForView(evt)}
                            className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer flex items-center space-x-1 shadow-2xs"
                            title="View event details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {canPublish && (
                            <button
                              onClick={() => handleArchiveEvent(evt.id, evt.title)}
                              className="px-2.5 py-1 rounded bg-white hover:bg-[#E6E2D8] border border-[#E6E2D8] text-[#57655B] font-semibold text-xs cursor-pointer flex items-center space-x-1"
                              title="Archive event"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>Archive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW ANNOUNCEMENT MODAL */}
      {selectedAnnouncementForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-lg w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-[#E5C158]" />
                <h4 className="font-heading font-bold text-base text-[#F3D273]">
                  {selectedAnnouncementForView.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedAnnouncementForView(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between bg-[#F9F8F4] p-3 rounded-lg border border-[#E6E2D8]">
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Target Audience</span>
                  <span className="font-bold text-[#0D381E]">{selectedAnnouncementForView.targetRole}</span>
                </div>
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Campus</span>
                  <span className="font-mono text-[#1A231E]">
                    {selectedAnnouncementForView.campusId
                      ? `${selectedAnnouncementForView.campusId.toUpperCase()} Campus`
                      : 'Global (All Campuses)'}
                  </span>
                </div>
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Priority</span>
                  <span className="font-bold text-rose-800">{selectedAnnouncementForView.priority}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#0D381E] block mb-1">Announcement Content:</span>
                <p className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-[#1A231E] leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncementForView.content}
                </p>
              </div>

              <div className="text-[11px] text-[#57655B] flex items-center space-x-1.5 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Published on {selectedAnnouncementForView.publishedAt}</span>
              </div>
            </div>

            <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] text-right">
              <button
                type="button"
                onClick={() => setSelectedAnnouncementForView(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0D381E] text-[#F3D273] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW EVENT MODAL */}
      {selectedEventForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-lg w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#E5C158]" />
                <h4 className="font-heading font-bold text-base text-[#F3D273]">
                  {selectedEventForView.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedEventForView(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F9F8F4] p-3 rounded-lg border border-[#E6E2D8]">
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Event Type</span>
                  <span className="font-bold text-[#0D381E]">{selectedEventForView.type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="font-mono text-[#0D381E] font-bold">{selectedEventForView.dateTime}</span>
                </div>
                {selectedEventForView.className && (
                  <div className="col-span-2">
                    <span className="text-[#57655B] block text-[10px] uppercase font-bold">Class Attendance</span>
                    <span className="font-semibold text-[#1A231E]">{selectedEventForView.className}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-bold text-[#0D381E] block mb-1">Event Agenda & Notes:</span>
                <p className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-[#1A231E] leading-relaxed whitespace-pre-wrap">
                  {selectedEventForView.description}
                </p>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold">Automated Email & WhatsApp notifications enabled.</span>
              </div>
            </div>

            <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] text-right">
              <button
                type="button"
                onClick={() => setSelectedEventForView(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0D381E] text-[#F3D273] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PUSH NOTIFICATIONS LOG (EMAIL & WHATSAPP) */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden animate-in fade-in space-y-3 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
            <h4 className="font-heading font-semibold text-lg text-[#0D381E]">
              Email & WhatsApp Dispatch Ledgers
            </h4>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
              Push Pipeline: Active
            </span>
          </div>

          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-3.5 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {n.channel === 'WHATSAPP' || n.channel === 'BOTH' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </span>
                    ) : null}
                    {n.channel === 'EMAIL' || n.channel === 'BOTH' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>Email</span>
                      </span>
                    ) : null}
                    <span className="font-bold text-xs text-[#0D381E]">{n.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#57655B]">{n.timestamp}</span>
                </div>
                <p className="text-xs text-[#57655B]">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MODAL: CREATE ANNOUNCEMENT */}
      {isNewAnnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-md w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <h4 className="font-heading font-bold text-base text-[#F3D273]">
                Publish Announcement
              </h4>
              <button onClick={() => setIsNewAnnOpen(false)} className="text-white/70 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Monthly Fee Payment Reminders"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1A231E] mb-1">Target Audience</label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                  >
                    <option value="ALL">All (Teachers & Guardians)</option>
                    <option value="PARENTS">Guardians & Parents Only</option>
                    <option value="TEACHERS">Teaching Faculty Only</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1A231E] mb-1">Priority</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={annDesc}
                  onChange={(e) => setAnnDesc(e.target.value)}
                  placeholder="Detailed text of the announcement..."
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
                <span className="font-bold text-[#0D381E] block">Instant Dispatch Reminders:</span>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={annSendEmail}
                      onChange={(e) => setAnnSendEmail(e.target.checked)}
                      className="accent-[#0D381E]"
                    />
                    <span>Email Push</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={annSendWhatsApp}
                      onChange={(e) => setAnnSendWhatsApp(e.target.checked)}
                      className="accent-[#0D381E]"
                    />
                    <span>WhatsApp Push</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewAnnOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Publish & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: CREATE EVENT */}
      {isNewEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-md w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <h4 className="font-heading font-bold text-base text-[#F3D273]">
                Schedule Academic Event / Exam
              </h4>
              <button onClick={() => setIsNewEventOpen(false)} className="text-white/70 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Event Type</label>
                <select
                  value={evtType}
                  onChange={(e) => setEvtType(e.target.value as EventType)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4] font-semibold text-[#0D381E]"
                >
                  <option value="EXAM">Exam with Class Selection</option>
                  <option value="COMPETITION">Competitions</option>
                  <option value="PARENT_MEETING">Parent Meeting</option>
                  <option value="PAST_EVENT">Past Event (for record-keeping)</option>
                </select>
              </div>

              {/* Class Selection when Exam is selected */}
              {evtType === 'EXAM' && (
                <div>
                  <label className="block font-bold text-[#1A231E] mb-1">
                    Select Target Class Section <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={evtClassId}
                    onChange={(e) => setEvtClassId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4] font-bold text-[#0D381E]"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  placeholder="e.g. Midterm Tajweed Oral Exam"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Date and Time</label>
                <input
                  type="text"
                  required
                  value={evtDateTime}
                  onChange={(e) => setEvtDateTime(e.target.value)}
                  placeholder="e.g. 2026-10-25 17:00"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs font-mono bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Description</label>
                <textarea
                  rows={2.5}
                  required
                  value={evtDesc}
                  onChange={(e) => setEvtDesc(e.target.value)}
                  placeholder="Details of the event or assessment syllabus..."
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <label className="flex items-center space-x-2 font-bold text-[#0D381E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evtSendReminders}
                    onChange={(e) => setEvtSendReminders(e.target.checked)}
                    className="accent-[#0D381E]"
                  />
                  <span>Send Reminders to All Teachers & Guardians (Email & WhatsApp)</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
