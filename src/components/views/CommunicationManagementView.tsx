import React, { useState } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { UserSession, Campus } from '../../types/ims.ts';
import { AnnouncementsView } from './AnnouncementsView.tsx';
import { IncidentsView } from './IncidentsView.tsx';

interface CommunicationManagementViewProps {
  user: UserSession;
  campuses: Campus[];
  activeCampusId: string;
  initialSubTab?: 'announcements' | 'incidents';
}

export const CommunicationManagementView: React.FC<CommunicationManagementViewProps> = ({
  user,
  campuses,
  activeCampusId,
  initialSubTab = 'announcements',
}) => {
  const [subTab, setSubTab] = useState<'announcements' | 'incidents'>(initialSubTab);

  return (
    <div className="space-y-4">
      {/* Top Segmented Switch */}
      <div className="bg-[#F4F3EE] p-1.5 rounded-xl border border-[#E6E2D8] flex flex-wrap sm:inline-flex items-center gap-1.5">
        <button
          onClick={() => setSubTab('announcements')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'announcements'
              ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
              : 'text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Announcements & Events</span>
        </button>

        <button
          onClick={() => setSubTab('incidents')}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'incidents'
              ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
              : 'text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Incidents & Medical Reports</span>
        </button>
      </div>

      {/* Active View */}
      {subTab === 'announcements' ? (
        <AnnouncementsView user={user} activeCampusId={activeCampusId} />
      ) : (
        <IncidentsView user={user} campuses={campuses} activeCampusId={activeCampusId} />
      )}
    </div>
  );
};
