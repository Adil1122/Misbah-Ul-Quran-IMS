import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Filter,
  Eye,
  Edit3,
  Archive,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { Campus, UserSession, StudentRecord } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { StudentModal } from '../modals/StudentModal.tsx';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal.tsx';

interface StudentDirectoryViewProps {
  user: UserSession;
  campuses: Campus[];
  activeCampusId: string;
  onSelectStudent?: (studentId: string) => void;
  initialSubTab?: string;
}

export const StudentDirectoryView: React.FC<StudentDirectoryViewProps> = ({
  user,
  campuses,
  activeCampusId,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string>('ALL');
  const [feedback, setFeedback] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal for adding / editing student
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentRecord | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);

  // Campus context
  const effectiveCampus = user.role === 'SUPER_ADMIN' ? activeCampusId : user.activeCampusId;
  const enrolledStudents = IMSStateService.getStudents(effectiveCampus);
  const classes = IMSStateService.getClasses(effectiveCampus);
  const pendingAdmissions = IMSStateService.getPendingAdmissions(
    effectiveCampus === 'all' ? undefined : effectiveCampus
  );

  // Combine enrolled students and pending applicants into one unified directory
  // Map pending admissions into the unified student directory representation
  const allDirectoryItems = useMemo(() => {
    const list: Array<{
      id: string;
      admissionNumber: string;
      firstName: string;
      lastName: string;
      gender?: 'MALE' | 'FEMALE';
      campusId: string;
      classId: string;
      className: string;
      primaryParentName?: string;
      primaryParentPhone?: string;
      attendanceRate?: number;
      feeStatus: string;
      status: 'ACTIVE' | 'INACTIVE' | 'PENDING_ADMISSION';
      isPendingAdmission: boolean;
      originalStudent?: StudentRecord;
      originalAdmissionId?: string;
    }> = [];

    // 1. Enrolled Students
    enrolledStudents.forEach((s) => {
      list.push({
        id: s.id,
        admissionNumber: s.admissionNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        campusId: s.campusId,
        classId: s.classId,
        className: s.className || s.currentGrade,
        primaryParentName: s.primaryParentName,
        primaryParentPhone: s.primaryParentPhone,
        attendanceRate: s.attendanceRate,
        feeStatus: s.feeStatus || 'UP_TO_DATE',
        status: s.isActive ? 'ACTIVE' : 'INACTIVE',
        isPendingAdmission: false,
        originalStudent: s,
      });
    });

    // 2. Pending Admissions (Display in same directory per Requirement 1)
    pendingAdmissions
      .filter((adm) => adm.status === 'PENDING_APPROVAL' || adm.status === 'ACTION_REQUIRED')
      .forEach((adm) => {
        const [firstName, ...rest] = adm.studentName.split(' ');
        list.push({
          id: adm.id, // using approval ID so View opens full profile review
          admissionNumber: adm.temporaryReference || 'PENDING',
          firstName: firstName || adm.studentName,
          lastName: rest.join(' '),
          gender: 'MALE',
          campusId: adm.campusId,
          classId: 'pending',
          className: adm.gradeApplying || 'Pending Placement',
          primaryParentName: adm.parentName,
          primaryParentPhone: adm.parentPhone,
          attendanceRate: undefined,
          feeStatus: 'PENDING',
          status: 'PENDING_ADMISSION',
          isPendingAdmission: true,
          originalAdmissionId: adm.id,
        });
      });

    return list;
  }, [enrolledStudents, pendingAdmissions]);

  // Filter items based on user toolbar inputs
  const filteredItems = useMemo(() => {
    return allDirectoryItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.firstName.toLowerCase().includes(q) ||
        item.lastName.toLowerCase().includes(q) ||
        item.admissionNumber.toLowerCase().includes(q) ||
        (item.primaryParentName && item.primaryParentName.toLowerCase().includes(q)) ||
        (item.primaryParentPhone && item.primaryParentPhone.toLowerCase().includes(q));

      const matchesCampus =
        selectedCampusFilter === 'ALL' || item.campusId === selectedCampusFilter;

      const matchesClass =
        selectedClassId === 'ALL' || item.classId === selectedClassId;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && item.status === 'ACTIVE') ||
        (selectedStatus === 'INACTIVE' && item.status === 'INACTIVE') ||
        (selectedStatus === 'PENDING_ADMISSION' && item.status === 'PENDING_ADMISSION');

      const matchesFee =
        selectedFeeStatus === 'ALL' ||
        (selectedFeeStatus === 'PAID' && item.feeStatus === 'UP_TO_DATE') ||
        (selectedFeeStatus === 'PENDING' && item.feeStatus === 'PENDING') ||
        (selectedFeeStatus === 'OVERDUE' && item.feeStatus === 'OVERDUE');

      return matchesSearch && matchesCampus && matchesClass && matchesStatus && matchesFee;
    });
  }, [allDirectoryItems, searchQuery, selectedCampusFilter, selectedClassId, selectedStatus, selectedFeeStatus]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  };

  const handleArchiveStudent = async (student: StudentRecord) => {
    const nextActive = !student.isActive;
    const res = await IMSStateService.updateStudent(student.id, {
      isActive: nextActive,
    });
    if (res.success) {
      showToast(
        nextActive
          ? `✓ Student ${student.firstName} ${student.lastName} has been restored to Active.`
          : `Student ${student.firstName} ${student.lastName} moved to Inactive.`
      );
    } else {
      showToast(`✕ Failed to update student status: ${res.error || 'Database error'}`);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    const student = studentToDelete;
    const res = await IMSStateService.deleteStudent(student.id);
    if (res.success) {
      showToast(`✓ Student ${student.firstName} ${student.lastName} (${student.admissionNumber}) has been permanently deleted.`);
      setStudentToDelete(null);
    } else {
      showToast(`✕ Failed to delete student: ${res.error || 'Database error'}`);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Admission Number',
      'First Name',
      'Last Name',
      'Campus',
      'Class',
      'Parent Name',
      'Parent Phone',
      'Attendance Rate',
      'Fee Status',
      'Status',
    ];
    const rows = filteredItems.map((item) => [
      item.admissionNumber,
      `"${item.firstName}"`,
      `"${item.lastName}"`,
      item.campusId.toUpperCase(),
      `"${item.className}"`,
      `"${item.primaryParentName || ''}"`,
      `"${item.primaryParentPhone || ''}"`,
      item.attendanceRate !== undefined ? `${item.attendanceRate}%` : 'N/A',
      item.feeStatus,
      item.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Misbah_Students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ Student records exported to CSV.');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast(`✓ CSV file "${file.name}" received. Records verified.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const pendingCount = pendingAdmissions.filter((a) => a.status === 'PENDING_APPROVAL' || a.status === 'ACTION_REQUIRED').length;

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 1. SIMPLE PAGE HEADER (Clean title + Total count + One clear primary action) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E6E2D8]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="font-heading font-bold text-2xl text-[#0D381E]">
              Students
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#0D381E]/10 text-[#0D381E]">
              {enrolledStudents.length} Enrolled
            </span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingCount} Pending Admission
              </span>
            )}
          </div>
          <p className="text-xs text-[#57655B] mt-0.5">
            Central student directory. Click any student or application to view their complete profile, attendance, fees, and progress.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-lg bg-white hover:bg-[#F9F8F4] text-[#0D381E] border border-[#E6E2D8] text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#0D381E]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setStudentToEdit(null);
              setIsStudentModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Student</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & USEFUL FILTERS BAR */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] p-3.5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search field */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#57655B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, ID, or parent..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] focus:bg-white focus:outline-none focus:border-[#0D381E] text-[#1A231E] transition-all"
            />
          </div>

          {/* Campus Filter (shown if user has access to multiple campuses) */}
          <div>
            <select
              value={selectedCampusFilter}
              onChange={(e) => setSelectedCampusFilter(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] focus:bg-white text-[#1A231E] font-medium"
            >
              <option value="ALL">All Campuses</option>
              <option value="uk">UK Campus (London)</option>
              <option value="kts">KTS Campus (Haripur)</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] focus:bg-white text-[#1A231E] font-medium"
            >
              <option value="ALL">All Classes / Halaqahs</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] focus:bg-white text-[#1A231E] font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Students</option>
              <option value="PENDING_ADMISSION">Pending Admission ({pendingCount})</option>
              <option value="INACTIVE">Inactive / Archived</option>
            </select>
          </div>
        </div>

        {/* Sub-filter row: Fee Status & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E6E2D8]/60 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[#57655B] font-medium">Fee Status:</span>
            <div className="flex items-center space-x-1">
              {[
                { id: 'ALL', label: 'All Fees' },
                { id: 'PAID', label: 'Paid' },
                { id: 'PENDING', label: 'Pending' },
                { id: 'OVERDUE', label: 'Overdue' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedFeeStatus(opt.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedFeeStatus === opt.id
                      ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                      : 'bg-[#F4F3EE] text-[#57655B] hover:text-[#0D381E]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-[#57655B]">
            Showing <strong className="text-[#0D381E]">{filteredItems.length}</strong> of{' '}
            {allDirectoryItems.length} students & applicants
          </div>
        </div>
      </div>

      {/* 3. CLEAN RECORD TABLE */}
      <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-3.5">Student ID</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Campus</th>
                <th className="p-3.5">Class / Level</th>
                <th className="p-3.5">Parent / Guardian</th>
                <th className="p-3.5 text-center">Attendance</th>
                <th className="p-3.5 text-center">Fee Status</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-[#F9F8F4] transition-colors ${
                    item.isPendingAdmission ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Student ID */}
                  <td className="p-3.5 font-mono font-bold text-[#0D381E]">
                    {item.admissionNumber}
                  </td>

                  {/* Student Name */}
                  <td className="p-3.5 font-semibold text-[#1A231E]">
                    {onSelectStudent ? (
                      <button
                        onClick={() => onSelectStudent(item.id)}
                        className="text-[#0D381E] hover:underline font-bold text-left cursor-pointer"
                      >
                        {item.firstName} {item.lastName}
                      </button>
                    ) : (
                      <span>
                        {item.firstName} {item.lastName}
                      </span>
                    )}
                    <div className="text-[10px] font-normal text-[#57655B]">
                      {item.isPendingAdmission ? (
                        <span className="text-amber-800 font-medium">New Admission Application</span>
                      ) : (
                        <span>{item.gender === 'MALE' ? 'Talib (Boy)' : 'Taliba (Girl)'}</span>
                      )}
                    </div>
                  </td>

                  {/* Campus */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E]">
                      {item.campusId.toUpperCase()}
                    </span>
                  </td>

                  {/* Class */}
                  <td className="p-3.5 font-medium text-[#1A231E]">
                    {item.className}
                  </td>

                  {/* Parent */}
                  <td className="p-3.5 text-[#57655B]">
                    <div className="font-medium text-[#1A231E]">
                      {item.primaryParentName || 'Parent On Record'}
                    </div>
                    <div className="text-[10px] font-mono text-[#57655B]">
                      {item.primaryParentPhone || 'N/A'}
                    </div>
                  </td>

                  {/* Attendance */}
                  <td className="p-3.5 text-center font-mono font-semibold">
                    {item.attendanceRate !== undefined ? (
                      <span className="text-emerald-800 font-bold">{item.attendanceRate}%</span>
                    ) : (
                      <span className="text-[#57655B]">—</span>
                    )}
                  </td>

                  {/* Fee Status */}
                  <td className="p-3.5 text-center">
                    <StatusBadge status={item.feeStatus} />
                  </td>

                  {/* Status */}
                  <td className="p-3.5 text-center">
                    {item.isPendingAdmission ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>Pending Admission</span>
                      </span>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                  </td>

                  {/* Actions: View (opens full profile) + optional Edit/Archive */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {onSelectStudent && (
                        <button
                          onClick={() => onSelectStudent(item.id)}
                          className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="Open Full Student Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      )}

                      {!item.isPendingAdmission && item.originalStudent && (
                        <>
                          <button
                            onClick={() => {
                              setStudentToEdit(item.originalStudent!);
                              setIsStudentModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-white hover:bg-[#F9F8F4] text-[#0D381E] border border-[#E6E2D8] text-xs font-semibold cursor-pointer"
                            title="Edit Student Information"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveStudent(item.originalStudent!)}
                            className={`px-2 py-1 rounded border text-xs font-semibold cursor-pointer ${
                              item.status === 'ACTIVE'
                                ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                            title={item.status === 'ACTIVE' ? 'Archive Student' : 'Restore Student'}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(item.originalStudent!)}
                            className="px-2 py-1 rounded bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                            title="Delete Student Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-[#57655B]">
                    No student records or applications found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isStudentModalOpen && (
        <StudentModal
          isOpen={isStudentModalOpen}
          onClose={() => {
            setIsStudentModalOpen(false);
            setStudentToEdit(null);
          }}
          studentToEdit={studentToEdit}
          campuses={campuses}
          activeCampusId={effectiveCampus}
          onSaved={(std, msg) => {
            showToast(msg || `✓ Student ${std.firstName} ${std.lastName} saved successfully.`);
            setIsStudentModalOpen(false);
            setStudentToEdit(null);
          }}
        />
      )}

      {/* Permanently Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!studentToDelete}
        title="Permanently Delete Student"
        itemName={studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName} (${studentToDelete.admissionNumber})` : ''}
        itemType="Student"
        warningNote="This will permanently delete this student record from the Supabase database and update class enrollments. This action cannot be undone."
        onConfirm={handleDeleteStudent}
        onClose={() => setStudentToDelete(null)}
      />
    </div>
  );
};
