import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Eye,
  CheckCircle2,
  BookOpen,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Campus, UserSession, TeacherProfile } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { TeacherModal } from '../modals/TeacherModal.tsx';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal.tsx';
import { formatCampusCurrency } from '../../utils/currency.ts';

interface TeacherDirectoryViewProps {
  user: UserSession;
  campuses: Campus[];
  activeCampusId: string;
  onSelectTeacher?: (teacherId: string) => void;
}

export const TeacherDirectoryView: React.FC<TeacherDirectoryViewProps> = ({
  user,
  campuses,
  activeCampusId,
  onSelectTeacher,
}) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = IMSStateService.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState('');

  // Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<TeacherProfile | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherProfile | null>(null);

  const effectiveCampus = user.role === 'SUPER_ADMIN' ? activeCampusId : user.activeCampusId;
  const teachers = IMSStateService.getTeachers(effectiveCampus);
  const classes = IMSStateService.getClasses(effectiveCampus);

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCampus =
      selectedCampusFilter === 'ALL' || t.campusId === selectedCampusFilter;

    const matchesClass =
      selectedClassId === 'ALL' ||
      (t.assignedClassIds && t.assignedClassIds.includes(selectedClassId));

    const isArchived = t.isActive === false;
    const matchesStatus =
      selectedStatusFilter === 'ALL' ||
      (selectedStatusFilter === 'ACTIVE' && !isArchived) ||
      (selectedStatusFilter === 'ARCHIVED' && isArchived);

    return matchesSearch && matchesCampus && matchesClass && matchesStatus;
  });

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  };

  const handleToggleArchive = (teacher: TeacherProfile) => {
    if (teacher.isActive === false) {
      const ok = IMSStateService.restoreTeacher(teacher.id);
      if (ok) showToast(`✓ Teacher ${teacher.fullName} restored to active status.`);
    } else {
      const ok = IMSStateService.archiveTeacher(teacher.id);
      if (ok) showToast(`✓ Teacher ${teacher.fullName} archived.`);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    const tch = teacherToDelete;
    const res = await IMSStateService.deleteTeacher(tch.id);
    if (res.success) {
      showToast(`✓ Faculty member ${tch.fullName} (${tch.employeeCode}) has been permanently deleted.`);
      setTeacherToDelete(null);
    } else {
      showToast(`✕ Failed to delete teacher: ${res.error || 'Database error'}`);
    }
  };

  const calculateTeacherAttendance = (teacherId: string): string => {
    const logs = IMSStateService.getTeacherAttendance().filter((a) => a.teacherId === teacherId);
    if (logs.length === 0) return '—';
    const presents = logs.filter((l) => l.status === 'PRESENT' || l.status === 'LATE').length;
    return `${Math.round((presents / logs.length) * 100)}%`;
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#0D381E] text-[#E5C158]">
              {effectiveCampus === 'all' ? 'All Campuses' : `${effectiveCampus.toUpperCase()} Branch`}
            </span>
            <span className="text-xs text-[#57655B]">
              Total Faculty: <strong>{teachers.length}</strong>
            </span>
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-1">
            Faculty & Teacher Management
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Instructors, Halaqah Qaris, class assignments, tenure, attendance, and compensation records.
          </p>
        </div>

        <button
          onClick={() => {
            setTeacherToEdit(null);
            setIsTeacherModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 border border-[#E5C158]/40 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#E5C158]" />
          <span>Add Teacher</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-lg border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 2. TOOLBAR: Search, Campus, Class, Status */}
      <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teacher by name or code..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] w-56 bg-[#F9F8F4]"
            />
            <Search className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
          </div>

          {/* Campus Filter (if Super Admin) */}
          {user.role === 'SUPER_ADMIN' && (
            <select
              value={selectedCampusFilter}
              onChange={(e) => setSelectedCampusFilter(e.target.value)}
              className="p-1.5 rounded-lg border border-[#E6E2D8] text-xs bg-white text-[#0D381E] font-medium"
            >
              <option value="ALL">All Campuses</option>
              <option value="uk">UK Campus</option>
              <option value="kts">KTS Pakistan</option>
            </select>
          )}

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-1.5 rounded-lg border border-[#E6E2D8] text-xs bg-white text-[#0D381E] font-medium"
          >
            <option value="ALL">All Classes & Halaqahs</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-[#E6E2D8] text-xs bg-white text-[#0D381E] font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ARCHIVED">Archived Only</option>
          </select>
        </div>

        <div className="text-xs text-[#57655B]">
          Showing <strong className="text-[#0D381E]">{filteredTeachers.length}</strong> of{' '}
          {teachers.length} faculty members
        </div>
      </div>

      {/* 3. TEACHER LIST TABLE */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-3.5">Teacher</th>
                <th className="p-3.5">Campus</th>
                <th className="p-3.5">Classes</th>
                <th className="p-3.5">Joining Date</th>
                <th className="p-3.5 text-center">Attendance</th>
                <th className="p-3.5 text-right">Salary</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {filteredTeachers.map((t) => {
                const assignedClasses = classes.filter(
                  (c) => t.assignedClassIds && t.assignedClassIds.includes(c.id)
                );
                const isArchived = t.isActive === false;
                const attendance = calculateTeacherAttendance(t.id);

                return (
                  <tr key={t.id} className="hover:bg-[#F9F8F4] transition-colors">
                    {/* Teacher */}
                    <td className="p-3.5 font-semibold text-[#1A231E]">
                      {onSelectTeacher ? (
                        <button
                          onClick={() => onSelectTeacher(t.id)}
                          className="text-[#0D381E] hover:underline font-bold text-left cursor-pointer"
                        >
                          {t.fullName}
                        </button>
                      ) : (
                        <span>{t.fullName}</span>
                      )}
                      <div className="text-[10px] font-mono text-[#57655B]">
                        {t.employeeCode} · {t.specialization}
                      </div>
                    </td>

                    {/* Campus */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E]">
                        {t.campusId.toUpperCase()}
                      </span>
                    </td>

                    {/* Classes */}
                    <td className="p-3.5 font-medium text-[#1A231E]">
                      {assignedClasses.length > 0 ? (
                        <div className="space-y-0.5">
                          {assignedClasses.map((c) => (
                            <span
                              key={c.id}
                              className="inline-block mr-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 text-[10px] font-bold border border-emerald-200"
                            >
                              {c.name.split('—')[0]?.trim() || c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#57655B] italic">Unassigned</span>
                      )}
                    </td>

                    {/* Joining Date */}
                    <td className="p-3.5 font-mono text-[#57655B]">
                      {t.joinDate || '—'}
                    </td>

                    {/* Attendance */}
                    <td className="p-3.5 text-center font-mono font-semibold text-emerald-800">
                      {attendance}
                    </td>

                    {/* Salary */}
                    <td className="p-3.5 text-right font-mono font-bold text-[#0D381E]">
                      {t.salaryCurrency === 'GBP'
                        ? `£${t.baseMonthlySalary || 0}`
                        : `PKR ${(t.baseMonthlySalary || 0).toLocaleString()}`}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <StatusBadge status={isArchived ? 'ARCHIVED' : 'ACTIVE'} />
                    </td>

                    {/* Actions: View, Edit, Archive/Restore */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {onSelectTeacher && (
                          <button
                            onClick={() => onSelectTeacher(t.id)}
                            className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer flex items-center space-x-1 shadow-2xs"
                            title="View Complete Teacher Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setTeacherToEdit(t);
                            setIsTeacherModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-white hover:bg-[#F9F8F4] text-[#0D381E] border border-[#E6E2D8] text-xs font-semibold cursor-pointer"
                          title="Edit Teacher"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(t)}
                          className={`px-2 py-1 rounded border text-xs font-semibold cursor-pointer ${
                            isArchived
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title={isArchived ? 'Restore Faculty Member' : 'Archive Faculty Member'}
                        >
                          {isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setTeacherToDelete(t)}
                          className="px-2 py-1 rounded bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                          title="Delete Faculty Member Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#0D381E]/10 flex items-center justify-center text-[#0D381E]">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-[#0D381E]">No Faculty Members Found</h4>
                    <p className="text-xs text-[#57655B] max-w-sm mx-auto">
                      There are currently no teacher records matching your filters. Add a teacher or Qari profile to begin managing instructors.
                    </p>
                    <button
                      onClick={() => {
                        setTeacherToEdit(null);
                        setIsTeacherModalOpen(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0D381E] text-[#F3D273] rounded-lg text-xs font-bold hover:bg-[#16532d] cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#E5C158]" />
                      <span>Add First Faculty Member</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      {isTeacherModalOpen && (
        <TeacherModal
          isOpen={isTeacherModalOpen}
          onClose={() => {
            setIsTeacherModalOpen(false);
            setTeacherToEdit(null);
          }}
          teacherToEdit={teacherToEdit}
          campuses={campuses}
          activeCampusId={effectiveCampus}
          onSaved={(tch) => {
            showToast(`✓ Faculty profile saved: ${tch.fullName} [${tch.employeeCode}].`);
            setIsTeacherModalOpen(false);
            setTeacherToEdit(null);
          }}
        />
      )}

      {/* Permanently Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!teacherToDelete}
        title="Permanently Delete Faculty Member"
        itemName={teacherToDelete ? `${teacherToDelete.fullName} (${teacherToDelete.employeeCode})` : ''}
        itemType="Teacher"
        warningNote="This will permanently delete this teacher record from the Supabase database and unassign them from any scheduled cohorts. This action cannot be undone."
        onConfirm={handleDeleteTeacher}
        onClose={() => setTeacherToDelete(null)}
      />
    </div>
  );
};
