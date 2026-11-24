import React, { useState } from 'react';
import { KeyRound, Shield, Search, CheckCircle2, Lock, Edit3 } from 'lucide-react';
import { IMSStateService } from '../../../services/imsStateService.ts';

export const StudentIdAndAccountsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newIdVal, setNewIdVal] = useState('');

  const students = IMSStateService.getStudents('all');

  const filtered = students.filter(
    (s) =>
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveId = (studentId: string) => {
    if (!newIdVal.trim()) return;
    IMSStateService.assignOfficialStudentId(studentId, newIdVal.trim());
    setEditingStudentId(null);
    setFeedback(`Official Student ID changed to ${newIdVal.trim()} with permanent audit entry.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleToggleAccess = (studentId: string, currentStatus?: boolean) => {
    IMSStateService.toggleUserPortalAccess('STUDENT', studentId, !currentStatus);
    setFeedback(`Portal status toggled to ${!currentStatus ? 'ACTIVE' : 'SUSPENDED'}.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleResetPassword = (name: string, id: string) => {
    setFeedback(`Temporary password generated for ${name} [${id}]. Password change required on first login.`);
    setTimeout(() => setFeedback(''), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-[#0D381E] text-[#E5C158] text-[11px] font-semibold tracking-wider uppercase">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Permanent Identification & Portal Credentials</span>
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-2">
            Official Student ID & Portal Account Governance
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Super Admin sole authority to manage permanent Student IDs (`MUQ-...`), portal account activations, and credential resets.
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or official ID..."
            className="px-3 py-1.5 border border-[#E6E2D8] rounded w-64 text-xs focus:outline-none focus:border-[#0D381E]"
          />
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Accounts & IDs Table */}
      <div className="bg-white rounded-lg border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead>
              <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider">
                <th className="p-3.5 font-semibold">Official Student ID</th>
                <th className="p-3.5 font-semibold">Student Name</th>
                <th className="p-3.5 font-semibold">Branch</th>
                <th className="p-3.5 font-semibold">Class / Grade</th>
                <th className="p-3.5 font-semibold">Portal Status</th>
                <th className="p-3.5 font-semibold text-right">Super Admin Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[#F9F8F4] transition-colors">
                  <td className="p-3.5 font-mono font-bold text-[#0D381E]">
                    {editingStudentId === s.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={newIdVal}
                          onChange={(e) => setNewIdVal(e.target.value)}
                          className="px-2 py-0.5 border border-[#E6E2D8] rounded text-xs font-mono font-bold"
                        />
                        <button
                          onClick={() => handleSaveId(s.id)}
                          className="px-2 py-0.5 bg-[#0D381E] text-white rounded text-[10px]"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>{s.admissionNumber}</span>
                        <button
                          onClick={() => {
                            setEditingStudentId(s.id);
                            setNewIdVal(s.admissionNumber);
                          }}
                          title="Reassign official permanent ID"
                          className="text-[#57655B] hover:text-[#0D381E] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 font-semibold text-[#1A231E]">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="p-3.5 font-medium text-[#0D381E]">
                    {s.campusId === 'uk' ? 'UK Campus' : 'KTS Pakistan'}
                  </td>
                  <td className="p-3.5 text-[#57655B]">{s.currentGrade}</td>
                  <td className="p-3.5">
                    <span
                      className={`font-semibold text-xs ${
                        s.portalAccessActive ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {s.portalAccessActive ? '● Active' : '○ Suspended'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleAccess(s.id, s.portalAccessActive)}
                        className="px-2 py-1 rounded text-xs font-medium border border-[#E6E2D8] hover:bg-[#F4F3EE] cursor-pointer"
                      >
                        {s.portalAccessActive ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(`${s.firstName} ${s.lastName}`, s.admissionNumber)}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-[#0D381E] hover:bg-[#16532d] text-white cursor-pointer"
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
