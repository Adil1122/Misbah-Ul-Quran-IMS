import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Users,
  Clock,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  X,
  GraduationCap,
  Edit3,
  Trash2,
  UserPlus,
  UserMinus,
  AlertTriangle,
} from 'lucide-react';
import { Campus, UserSession, StudentRecord, ClassRoom, TeacherProfile } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';

interface ClassesViewProps {
  user: UserSession;
  activeCampusId: string;
}

export const ClassesView: React.FC<ClassesViewProps> = ({ user, activeCampusId }) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    IMSStateService.refreshTeachers().catch(() => {});
    const unsubscribe = IMSStateService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  const effectiveCampus = user.role === 'SUPER_ADMIN' ? activeCampusId : user.activeCampusId;
  const classes = IMSStateService.getClasses(effectiveCampus);
  const allStudents = IMSStateService.getStudents(effectiveCampus);
  // Retrieve all registered faculty members across campuses for authoritative assignment
  const allTeachers = IMSStateService.getTeachers('all');

  const [search, setSearch] = useState('');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState('ALL');
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<string | null>(null);

  // Create Modal
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassType, setNewClassType] = useState('Junior Girls');
  const [newClassCampus, setNewClassCampus] = useState<'uk' | 'kts'>(
    effectiveCampus === 'uk' ? 'uk' : 'kts'
  );
  const [newClassTeacherId, setNewClassTeacherId] = useState('');
  const [newClassSchedule, setNewClassSchedule] = useState('5:00 PM - 7:30 PM (Mon-Fri)');
  const [newClassRoom, setNewClassRoom] = useState('Room A');
  const [newClassCapacity, setNewClassCapacity] = useState(25);

  // Edit Modal
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [editName, setEditName] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editScheduleTime, setEditScheduleTime] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editCapacity, setEditCapacity] = useState(25);

  // Delete Confirmation
  const [classToDelete, setClassToDelete] = useState<ClassRoom | null>(null);

  // Student Enrollment inside Roster
  const [studentToEnrollId, setStudentToEnrollId] = useState('');

  const [feedback, setFeedback] = useState('');

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  };

  // Eligible faculty for Create Class Modal based on target campus (fall back to all teachers if no match)
  const eligibleTeachersForCreate = useMemo<TeacherProfile[]>(() => {
    const targetCampus = newClassCampus?.toLowerCase();
    const campusMatched = allTeachers.filter(
      (t: TeacherProfile) =>
        t.campusId?.toLowerCase() === targetCampus ||
        t.campusId === 'all' ||
        !t.campusId
    );
    return campusMatched.length > 0 ? campusMatched : allTeachers;
  }, [allTeachers, newClassCampus]);

  // Eligible faculty for Edit Class Modal based on class campus + current assigned teacher
  const eligibleTeachersForEdit = useMemo<TeacherProfile[]>(() => {
    if (!editingClass) return allTeachers;
    const clsCampus = editingClass.campusId?.toLowerCase();
    const campusMatched = allTeachers.filter(
      (t: TeacherProfile) =>
        t.campusId?.toLowerCase() === clsCampus ||
        t.campusId === 'all' ||
        !t.campusId ||
        t.userId === editingClass.leadTeacherId ||
        t.id === editingClass.leadTeacherId
    );
    return campusMatched.length > 0 ? campusMatched : allTeachers;
  }, [allTeachers, editingClass]);

  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.leadTeacherName && c.leadTeacherName.toLowerCase().includes(search.toLowerCase())) ||
      (c.code && c.code.toLowerCase().includes(search.toLowerCase()));
    const matchesCampus =
      selectedCampusFilter === 'ALL' || c.campusId === selectedCampusFilter;
    return matchesSearch && matchesCampus;
  });

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const selectedTeacher = allTeachers.find(
      (t) => t.userId === newClassTeacherId || t.id === newClassTeacherId
    );

    const res = await IMSStateService.createClass({
      name: newClassName.trim(),
      campusId: newClassCampus,
      gradeLevel: newClassType,
      leadTeacherId: selectedTeacher ? (selectedTeacher.userId || selectedTeacher.id) : (newClassTeacherId || undefined),
      leadTeacherName: selectedTeacher?.fullName,
      scheduleTime: newClassSchedule,
      room: newClassRoom,
      maxCapacity: Number(newClassCapacity) || 25,
    });

    if (res.success) {
      showToast(`✓ Class "${newClassName}" created successfully for ${newClassCampus.toUpperCase()} Campus.`);
      setIsCreateClassOpen(false);
      setNewClassName('');
      setNewClassTeacherId('');
    } else {
      showToast(`✕ Error: ${res.message}`);
    }
  };

  const openEditModal = (cls: ClassRoom) => {
    IMSStateService.refreshTeachers().catch(() => {});
    setEditingClass(cls);
    setEditName(cls.name);
    setEditGradeLevel(cls.gradeLevel || cls.section || '');
    // Resolve matching teacher by either users.id or teacher_profiles.id
    const assignedTch = allTeachers.find(
      (t) => t.userId === cls.leadTeacherId || t.id === cls.leadTeacherId
    );
    setEditTeacherId(assignedTch ? (assignedTch.userId || assignedTch.id) : (cls.leadTeacherId || ''));
    setEditScheduleTime(cls.scheduleTime || '5:00 PM - 7:30 PM (Mon-Fri)');
    setEditRoom(cls.room || '');
    setEditCapacity(cls.maxCapacity || cls.capacity || 25);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const selectedTeacher = allTeachers.find(
      (t) => t.userId === editTeacherId || t.id === editTeacherId
    );

    const res = await IMSStateService.updateClass(editingClass.id, {
      name: editName.trim(),
      gradeLevel: editGradeLevel,
      leadTeacherId: selectedTeacher ? (selectedTeacher.userId || selectedTeacher.id) : (editTeacherId || undefined),
      leadTeacherName: selectedTeacher?.fullName || undefined,
      scheduleTime: editScheduleTime,
      room: editRoom,
      maxCapacity: Number(editCapacity) || 25,
      capacity: Number(editCapacity) || 25,
    });

    if (res.success) {
      showToast(`✓ Class "${editName}" updated successfully.`);
      setEditingClass(null);
    } else {
      showToast(`✕ Error: ${res.message}`);
    }
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    const res = await IMSStateService.deleteClass(classToDelete.id);
    if (res.success) {
      showToast(`✓ Class "${classToDelete.name}" deleted. Any enrolled students were safely set to unassigned.`);
      if (selectedClassForRoster === classToDelete.id) {
        setSelectedClassForRoster(null);
      }
      setClassToDelete(null);
    } else {
      showToast(`✕ Error: ${res.message}`);
    }
  };

  const handleEnrollStudent = () => {
    if (!selectedClassForRoster || !studentToEnrollId) return;
    const ok = IMSStateService.enrollStudentInClass(studentToEnrollId, selectedClassForRoster);
    if (ok) {
      showToast('✓ Student successfully enrolled in class.');
      setStudentToEnrollId('');
    } else {
      showToast('✕ Error: Failed to enroll student into class.');
    }
  };

  const handleRemoveStudent = (studentId: string, studentName: string) => {
    const ok = IMSStateService.removeStudentFromClass(studentId);
    if (ok) {
      showToast(`✓ Student ${studentName} removed from class.`);
    } else {
      showToast('✕ Error: Failed to remove student from class.');
    }
  };

  const activeRosterClass = classes.find((c) => c.id === selectedClassForRoster);
  const rosterStudents = allStudents.filter((s) => s.classId === selectedClassForRoster);

  // Eligible students for enrollment into active roster (same campus, not yet in this class)
  const availableStudentsForEnrollment = activeRosterClass
    ? allStudents.filter(
        (s) => s.campusId === activeRosterClass.campusId && s.classId !== activeRosterClass.id
      )
    : [];

  const calculateClassAttendance = (classId: string): string => {
    const studentsInClass = allStudents.filter((s) => s.classId === classId);
    const withAttendance = studentsInClass.filter((s) => typeof s.attendanceRate === 'number');
    if (withAttendance.length === 0) return '—';
    const sum = withAttendance.reduce((acc, s) => acc + (s.attendanceRate || 0), 0);
    return `${Math.round(sum / withAttendance.length)}%`;
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
              Active Halaqahs: <strong>{classes.length}</strong>
            </span>
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-1">
            Classes & Halaqahs Management
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Configure classes, faculty assignments, student rosters, schedules, and capacity.
          </p>
        </div>

        <button
          onClick={() => {
            setNewClassCampus(effectiveCampus === 'uk' ? 'uk' : 'kts');
            setIsCreateClassOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 border border-[#E5C158]/40 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#E5C158]" />
          <span>Create Class</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-lg border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 2. TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search class or teacher..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] w-56 bg-[#F9F8F4]"
            />
            <Search className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
          </div>

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
        </div>

        <div className="text-xs text-[#57655B]">
          Showing <strong className="text-[#0D381E]">{filteredClasses.length}</strong> classes
        </div>
      </div>

      {/* 3. CLASS MANAGEMENT TABLE */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        {/* MOBILE VIEW: Class Cards */}
        <div className="block sm:hidden divide-y divide-[#E6E2D8] p-3 space-y-3">
          {filteredClasses.map((cls) => {
            const count = allStudents.filter((s) => s.classId === cls.id).length;
            const attendanceRate = calculateClassAttendance(cls.id);
            const shortCode = cls.code || cls.name.split('—')[0]?.trim() || cls.name;
            const classType = cls.gradeLevel || (cls.name.includes('—') ? cls.name.split('—')[1]?.trim() : 'Islamic Studies');

            return (
              <div key={cls.id} className="p-3.5 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-base text-[#0D381E]">{cls.name}</h4>
                    <span className="text-xs text-[#57655B]">{classType} · Code: {shortCode}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D381E] text-[#E5C158]">
                    {cls.campusId.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-[#57655B] flex items-center justify-between">
                  <span>Teacher: <strong className="text-[#0D381E]">{cls.leadTeacherName || '—'}</strong></span>
                  <span>Students: <strong className="font-mono text-[#0D381E]">{count} / {cls.maxCapacity || cls.capacity || 25}</strong></span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#E6E2D8]/60 text-xs">
                  <span className="text-emerald-800 font-semibold">Attendance: {attendanceRate}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 rounded bg-white text-[#0D381E] border border-[#E6E2D8] hover:bg-[#F9F8F4]"
                      title="Edit Class"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setClassToDelete(cls)}
                      className="p-1.5 rounded bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
                      title="Delete Class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedClassForRoster(cls.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Roster ({count})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredClasses.length === 0 && (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#0D381E]/10 flex items-center justify-center text-[#0D381E]">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-sm text-[#0D381E]">No Classes Configured Yet</h4>
              <p className="text-xs text-[#57655B] max-w-sm mx-auto">
                No classes match your current search or filter. Create your first class or Halaqah to begin organizing students and instructors.
              </p>
              <button
                onClick={() => setIsCreateClassOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0D381E] text-[#F3D273] rounded-lg text-xs font-bold hover:bg-[#16532d] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#E5C158]" />
                <span>Create First Class</span>
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-3.5">Class & Code</th>
                <th className="p-3.5">Type / Category</th>
                <th className="p-3.5">Campus</th>
                <th className="p-3.5">Teacher</th>
                <th className="p-3.5 text-center">Students / Cap</th>
                <th className="p-3.5 text-center">Avg Attendance</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {filteredClasses.map((cls) => {
                const count = allStudents.filter((s) => s.classId === cls.id).length;
                const attendanceRate = calculateClassAttendance(cls.id);
                const shortCode = cls.code || cls.name.split('—')[0]?.trim() || cls.name;
                const classType = cls.gradeLevel || (cls.name.includes('—') ? cls.name.split('—')[1]?.trim() : 'Islamic Studies');

                return (
                  <tr key={cls.id} className="hover:bg-[#F9F8F4] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#0D381E] font-heading text-sm">
                        {cls.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#57655B]">
                        Code: {shortCode} {cls.room ? `· Room: ${cls.room}` : ''}
                      </div>
                    </td>

                    <td className="p-3.5 font-medium text-[#1A231E]">
                      {classType}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E]">
                        {cls.campusId.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3.5 font-semibold text-[#0D381E]">
                      {cls.leadTeacherName || <span className="text-[#57655B] italic font-normal">Unassigned</span>}
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-[#1A231E]">
                      {count} <span className="text-[#57655B] font-normal">/ {cls.maxCapacity || cls.capacity || 25}</span>
                    </td>

                    <td className="p-3.5 text-center font-mono font-semibold text-emerald-800">
                      {attendanceRate}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedClassForRoster(cls.id)}
                          className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="View Enrolled Students"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Roster ({count})</span>
                        </button>
                        <button
                          onClick={() => openEditModal(cls)}
                          className="px-2 py-1 rounded bg-white hover:bg-[#F9F8F4] text-[#0D381E] border border-[#E6E2D8] text-xs font-semibold cursor-pointer"
                          title="Edit Class"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setClassToDelete(cls)}
                          className="px-2 py-1 rounded bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer"
                          title="Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#0D381E]/10 flex items-center justify-center text-[#0D381E]">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-[#0D381E]">No Classes Configured</h4>
                    <p className="text-xs text-[#57655B] max-w-sm mx-auto">
                      There are currently no classes recorded. Add a class to begin scheduling lectures, assigning teachers, and enrolling students.
                    </p>
                    <button
                      onClick={() => setIsCreateClassOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0D381E] text-[#F3D273] rounded-lg text-xs font-bold hover:bg-[#16532d] cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#E5C158]" />
                      <span>Create First Class</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CLASS ROSTER MODAL */}
      {selectedClassForRoster && activeRosterClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full border border-[#E6E2D8] shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#57655B]">
                  Class Roster & Student Enrollment
                </span>
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-[#0D381E]">
                  {activeRosterClass.name}
                </h3>
                <p className="text-xs text-[#57655B] mt-0.5">
                  Instructor: <strong>{activeRosterClass.leadTeacherName || 'Unassigned'}</strong> · Campus: <strong>{activeRosterClass.campusId.toUpperCase()}</strong> · Schedule: <span className="font-mono">{activeRosterClass.scheduleTime || 'Regular Session'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedClassForRoster(null)}
                className="p-1 rounded text-[#57655B] hover:text-[#0D381E] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Student Enrollment Action */}
            <div className="bg-[#F9F8F4] p-3.5 rounded-xl border border-[#E6E2D8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-semibold text-[#0D381E] block">Enroll Student into this Class</span>
                <span className="text-[#57655B] text-[11px]">Select an available student from {activeRosterClass.campusId.toUpperCase()} branch.</span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={studentToEnrollId}
                  onChange={(e) => setStudentToEnrollId(e.target.value)}
                  className="p-2 text-xs border border-[#E6E2D8] rounded-lg bg-white text-[#0D381E] min-w-[200px]"
                >
                  <option value="">-- Choose Student to Enroll --</option>
                  {availableStudentsForEnrollment.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber}) {s.className ? `[Current: ${s.className}]` : '[Unassigned]'}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!studentToEnrollId}
                  onClick={handleEnrollStudent}
                  className="px-3.5 py-2 bg-[#0D381E] disabled:bg-gray-300 disabled:cursor-not-allowed text-[#F3D273] font-bold text-xs rounded-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#E5C158]" />
                  <span>Enroll</span>
                </button>
              </div>
            </div>

            {/* MOBILE VIEW: Roster Cards */}
            <div className="block sm:hidden divide-y divide-[#E6E2D8]">
              {rosterStudents.map((std) => (
                <div key={std.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0D381E]">{std.firstName} {std.lastName}</span>
                    <StatusBadge status={std.feeStatus || 'UP_TO_DATE'} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#57655B]">
                    <span className="font-mono">ID: {std.admissionNumber}</span>
                    <span className="text-emerald-700 font-semibold">{typeof std.attendanceRate === 'number' ? `${std.attendanceRate}% Attendance` : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#57655B] pt-1">
                    <span>Guardian: {std.primaryParentPhone || 'N/A'}</span>
                    <button
                      onClick={() => handleRemoveStudent(std.id, `${std.firstName} ${std.lastName}`)}
                      className="text-rose-700 hover:text-rose-900 font-semibold flex items-center space-x-1"
                    >
                      <UserMinus className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border border-[#E6E2D8]">
              <table className="w-full text-left text-xs min-w-[560px]">
                <thead>
                  <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] font-semibold">
                    <th className="p-3">Admission ID</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Parent Phone</th>
                    <th className="p-3 text-center">Attendance</th>
                    <th className="p-3 text-center">Fee Status</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {rosterStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-[#F9F8F4]">
                      <td className="p-3 font-mono font-bold text-[#0D381E]">
                        {std.admissionNumber}
                      </td>
                      <td className="p-3 font-semibold text-[#1A231E]">
                        {std.firstName} {std.lastName}
                        <div className="text-[10px] text-[#57655B] font-normal">
                          {std.currentGrade}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[#57655B]">
                        {std.primaryParentPhone || 'N/A'}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-emerald-800">
                        {typeof std.attendanceRate === 'number' ? `${std.attendanceRate}%` : '—'}
                      </td>
                      <td className="p-3 text-center">
                        <StatusBadge status={std.feeStatus || 'UP_TO_DATE'} />
                      </td>
                      <td className="p-3 text-center">
                        <StatusBadge status={std.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRemoveStudent(std.id, `${std.firstName} ${std.lastName}`)}
                          className="px-2 py-1 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded border border-rose-200 cursor-pointer inline-flex items-center space-x-1"
                          title="Remove student from this class"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {rosterStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-xs text-[#57655B]">
                        No students currently enrolled in this class. Use the dropdown above to enroll students.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-between">
              <span className="text-xs text-[#57655B]">
                Total Enrolled: <strong>{rosterStudents.length} Students</strong> (Capacity: {activeRosterClass.maxCapacity || activeRosterClass.capacity || 25})
              </span>
              <button
                onClick={() => setSelectedClassForRoster(null)}
                className="px-4 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE CLASS MODAL */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateClass}
            className="bg-white rounded-xl max-w-md w-full border border-[#E6E2D8] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <h4 className="font-heading font-bold text-xl text-[#0D381E]">
                Create New Class / Section
              </h4>
              <button
                type="button"
                onClick={() => setIsCreateClassOpen(false)}
                className="p-1 rounded text-[#57655B] hover:text-[#0D381E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Class Title *
                </label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Hifz Level 1 or B1 — Senior Boys"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Category / Group
                </label>
                <input
                  type="text"
                  value={newClassType}
                  onChange={(e) => setNewClassType(e.target.value)}
                  placeholder="e.g. Senior Boys or Hifz"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">
                    Campus *
                  </label>
                  <select
                    value={newClassCampus}
                    onChange={(e) => setNewClassCampus(e.target.value as 'uk' | 'kts')}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-white font-medium text-[#0D381E]"
                  >
                    <option value="kts">KTS Pakistan (Haripur)</option>
                    <option value="uk">UK Campus (London)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newClassCapacity}
                    onChange={(e) => setNewClassCapacity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Lead Teacher / Qari
                </label>
                <select
                  value={newClassTeacherId}
                  onChange={(e) => setNewClassTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-white font-medium text-[#0D381E]"
                >
                  <option value="">-- Unassigned --</option>
                  {eligibleTeachersForCreate.map((t: TeacherProfile) => (
                    <option key={t.id} value={t.userId || t.id}>
                      {t.fullName} ({t.employeeCode}) {t.campusId ? `[${t.campusId.toUpperCase()}]` : ''}
                    </option>
                  ))}
                </select>
                {eligibleTeachersForCreate.length === 0 && (
                  <p className="text-[11px] text-[#57655B] mt-1 italic">
                    No faculty currently registered for {newClassCampus.toUpperCase()} campus.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">
                    Schedule
                  </label>
                  <input
                    type="text"
                    value={newClassSchedule}
                    onChange={(e) => setNewClassSchedule(e.target.value)}
                    placeholder="e.g. 5:00 PM - 7:30 PM"
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">
                    Room / Hall
                  </label>
                  <input
                    type="text"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    placeholder="e.g. Hall A"
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreateClassOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] hover:bg-[#F9F8F4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
              >
                Save Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. EDIT CLASS MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateClass}
            className="bg-white rounded-xl max-w-md w-full border border-[#E6E2D8] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <h4 className="font-heading font-bold text-xl text-[#0D381E]">
                Edit Class Details
              </h4>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1 rounded text-[#57655B] hover:text-[#0D381E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Class Title *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Category / Group
                </label>
                <input
                  type="text"
                  value={editGradeLevel}
                  onChange={(e) => setEditGradeLevel(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Lead Teacher / Qari
                </label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-white font-medium text-[#0D381E]"
                >
                  <option value="">-- Unassigned --</option>
                  {eligibleTeachersForEdit.map((t: TeacherProfile) => (
                    <option key={t.id} value={t.userId || t.id}>
                      {t.fullName} ({t.employeeCode}) {t.campusId ? `[${t.campusId.toUpperCase()}]` : ''}
                    </option>
                  ))}
                </select>
                {eligibleTeachersForEdit.length === 0 && (
                  <p className="text-[11px] text-[#57655B] mt-1 italic">
                    No faculty currently registered for {editingClass.campusId.toUpperCase()} branch.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">
                    Schedule
                  </label>
                  <input
                    type="text"
                    value={editScheduleTime}
                    onChange={(e) => setEditScheduleTime(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">
                    Room / Hall
                  </label>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Max Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] hover:bg-[#F9F8F4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
              >
                Update Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-[#E6E2D8] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-700">
              <div className="p-2 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-700" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-[#0D381E]">Delete Class</h4>
                <p className="text-xs text-[#57655B]">Safe unlinking safeguard</p>
              </div>
            </div>

            <p className="text-xs text-[#57655B]">
              Are you sure you want to delete class <strong className="text-[#0D381E]">{classToDelete.name}</strong>?
              Enrolled students will not be deleted; their class assignment will safely be set to <span className="font-semibold text-[#0D381E]">Unassigned</span>.
            </p>

            <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] hover:bg-[#F9F8F4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClass}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
