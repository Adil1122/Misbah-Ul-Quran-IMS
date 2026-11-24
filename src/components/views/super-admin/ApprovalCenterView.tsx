import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  KeyRound,
  FileCheck,
  Clock,
} from 'lucide-react';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { formatCampusCurrency } from '../../../utils/currency.ts';

export const ApprovalCenterView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'teachers'>('students');
  const [feedback, setFeedback] = useState('');
  const [customOfficialId, setCustomOfficialId] = useState<{ [approvalId: string]: string }>({});

  const pendingStudents = IMSStateService.getPendingAdmissions();
  const pendingTeachers = IMSStateService.getPendingTeachers();

  const handleApproveStudent = (approvalId: string, campusId: string) => {
    const customId = customOfficialId[approvalId] || `MUQ-${campusId.toUpperCase()}-2026-0009`;
    IMSStateService.approveStudentAdmission(approvalId, customId);
    setFeedback(`Student approved! Official ID [${customId}] assigned and portal access generated.`);
    setTimeout(() => setFeedback(''), 4500);
  };

  const handleRejectStudent = (approvalId: string) => {
    IMSStateService.rejectStudentAdmission(approvalId, 'Incomplete documentation');
    setFeedback('Student admission rejected and notification sent to branch admin.');
    setTimeout(() => setFeedback(''), 4500);
  };

  const handleApproveTeacher = (approvalId: string) => {
    IMSStateService.approveTeacherOnboarding(approvalId);
    setFeedback('Teacher approved and appointed to faculty staff with official employee code.');
    setTimeout(() => setFeedback(''), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-[#0D381E] text-[#E5C158] text-[11px] font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Central Governance</span>
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-2">
            Admissions & Faculty Onboarding Approval Center
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Branch-created records remain in pending state until officially approved and assigned permanent credentials by the Super Admin.
          </p>
        </div>

        {/* Sub-Tab Selector */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-[#F9F8F4] p-1 rounded-lg border border-[#E6E2D8]">
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer min-h-[38px] ${
              activeSubTab === 'students' ? 'bg-[#0D381E] text-white shadow-xs' : 'text-[#57655B]'
            }`}
          >
            Student Admissions ({pendingStudents.filter((s) => s.status === 'PENDING_APPROVAL').length})
          </button>
          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer min-h-[38px] ${
              activeSubTab === 'teachers' ? 'bg-[#0D381E] text-white shadow-xs' : 'text-[#57655B]'
            }`}
          >
            Teacher Onboarding ({pendingTeachers.filter((t) => t.status === 'PENDING_APPROVAL').length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SUBTAB 1: STUDENT ADMISSION APPROVALS */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          {pendingStudents.map((adm) => (
            <div
              key={adm.id}
              className={`bg-white rounded-lg border p-5 shadow-xs space-y-3 ${
                adm.status === 'APPROVED' ? 'border-emerald-300 opacity-70' : 'border-[#E6E2D8]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6E2D8]">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-[#0D381E]">{adm.studentName}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4F3EE] text-[#57655B]">
                      {adm.temporaryReference}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${adm.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {adm.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#57655B] mt-0.5">
                    Branch: <strong className="text-[#0D381E]">{adm.campusName}</strong> · Applying for: <strong className="text-[#0D381E]">{adm.gradeApplying}</strong> · Submitted: {adm.submissionDate} by {adm.submittedByAdminName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#57655B]">
                <div>
                  <span className="font-semibold text-[#1A231E]">Parent / Guardian:</span> {adm.parentName} ({adm.parentPhone})
                </div>
                <div>
                  <span className="font-semibold text-[#1A231E]">Branch Admin Notes:</span> {adm.notes}
                </div>
              </div>

              {adm.status === 'PENDING_APPROVAL' && (
                <div className="pt-3 border-t border-[#E6E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-medium text-[#1A231E]">Assign Official Student ID:</span>
                    <input
                      type="text"
                      placeholder={`e.g. MUQ-${adm.campusId.toUpperCase()}-2026-0009`}
                      defaultValue={`MUQ-${adm.campusId.toUpperCase()}-2026-0009`}
                      onChange={(e) =>
                        setCustomOfficialId((prev) => ({
                          ...prev,
                          [adm.id]: e.target.value,
                        }))
                      }
                      className="px-2.5 py-1 border border-[#E6E2D8] rounded text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRejectStudent(adm.id)}
                      className="px-3 py-1.5 rounded text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveStudent(adm.id, adm.campusId)}
                      className="px-4 py-1.5 rounded text-xs font-semibold bg-[#0D381E] hover:bg-[#16532d] text-white cursor-pointer shadow-xs"
                    >
                      Approve & Finalize Identity
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 2: TEACHER ONBOARDING APPROVALS */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-4">
          {pendingTeachers.map((tch) => (
            <div
              key={tch.id}
              className={`bg-white rounded-lg border p-5 shadow-xs space-y-3 ${
                tch.status === 'APPROVED' ? 'border-emerald-300 opacity-70' : 'border-[#E6E2D8]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6E2D8]">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-[#0D381E]">{tch.teacherName}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tch.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {tch.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#57655B] mt-0.5">
                    Branch: <strong className="text-[#0D381E]">{tch.campusName}</strong> · Specialization: <strong className="text-[#0D381E]">{tch.specialization}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#57655B] uppercase block">Proposed Salary</span>
                  <span className="font-mono font-bold text-base text-[#0D381E]">
                    {formatCampusCurrency(tch.proposedBaseSalary, tch.salaryCurrency || (tch.campusId === 'kts' ? 'PKR' : 'GBP'))}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-1 text-[#57655B]">
                <p><span className="font-semibold text-[#1A231E]">Academic Qualifications:</span> {tch.qualification}</p>
                <p><span className="font-semibold text-[#1A231E]">Branch Admin Recommendation:</span> {tch.notes}</p>
              </div>

              {tch.status === 'PENDING_APPROVAL' && (
                <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleApproveTeacher(tch.id)}
                    className="px-4 py-1.5 rounded text-xs font-semibold bg-[#0D381E] hover:bg-[#16532d] text-white cursor-pointer shadow-xs"
                  >
                    Approve Faculty Appointment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
