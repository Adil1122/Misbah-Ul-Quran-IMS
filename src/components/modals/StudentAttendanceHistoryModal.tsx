import React, { useState } from 'react';
import { X, Calendar, Filter, CheckCircle2, AlertCircle, Clock, CalendarCheck, Shield } from 'lucide-react';
import { StudentAttendanceRecord, StudentAttendanceStatus } from '../../types/ims.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';

interface StudentAttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  admissionNumber: string;
  className: string;
  attendanceRecords: StudentAttendanceRecord[];
}

export const StudentAttendanceHistoryModal: React.FC<StudentAttendanceHistoryModalProps> = ({
  isOpen,
  onClose,
  studentName,
  admissionNumber,
  className,
  attendanceRecords,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  if (!isOpen) return null;

  // Filter records
  const filtered = attendanceRecords.filter((rec) => {
    if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
    if (startDate && rec.date < startDate) return false;
    if (endDate && rec.date > endDate) return false;
    return true;
  });

  const totalDays = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
  const excusedCount = attendanceRecords.filter((r) => r.status === 'EXCUSED').length;

  const attendancePercentage =
    totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-[#E6E2D8] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0D381E] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#E5C158]/30 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#0D381E] bg-[#E5C158] px-2 py-0.5 rounded">
                Official Roll History
              </span>
              <span className="text-xs text-[#E6E2D8]/80 font-mono">ID: {admissionNumber}</span>
            </div>
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-[#F3D273]">
              {studentName}
            </h3>
            <p className="text-xs text-[#E6E2D8]/80">
              Class: <strong>{className}</strong> · Authorized Roll-Call Ledger
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Summary Strip */}
        <div className="p-4 sm:p-5 bg-[#F9F8F4] border-b border-[#E6E2D8] shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
            <div className="p-3 bg-white rounded-xl border border-[#E6E2D8] shadow-2xs">
              <span className="text-[10px] font-bold text-[#57655B] uppercase block">Total Sessions</span>
              <span className="text-lg font-bold font-mono text-[#0D381E]">{totalDays}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Present</span>
              <span className="text-lg font-bold font-mono text-emerald-700">{presentCount}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Absent</span>
              <span className="text-lg font-bold font-mono text-rose-700">{absentCount}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Late</span>
              <span className="text-lg font-bold font-mono text-amber-700">{lateCount}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E6E2D8] shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#57655B] uppercase block">Attendance Rate</span>
              {attendancePercentage !== null ? (
                <span className={`text-lg font-bold font-mono ${
                  attendancePercentage >= 85 ? 'text-emerald-700' : attendancePercentage >= 70 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {attendancePercentage}%
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#57655B] mt-1 block">No records yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 sm:px-5 sm:py-3 bg-white border-b border-[#E6E2D8] flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-semibold text-[#57655B]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-medium focus:outline-none focus:border-[#0D381E]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present Only</option>
                <option value="ABSENT">Absent Only</option>
                <option value="LATE">Late Only</option>
                <option value="EXCUSED">Excused Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-semibold text-[#57655B]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono"
              />
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-semibold text-[#57655B]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {(statusFilter !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-[#0D381E] font-semibold underline hover:text-[#16532d] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Scrollable Records Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                    <th className="py-2.5 px-3">Remarks & Conduct</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {filtered.map((record) => (
                    <tr key={record.id} className="hover:bg-[#F9F8F4]/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#0D381E]">
                        {record.date}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="py-3 px-3 text-[#57655B]">
                        {record.recordedBy || 'Faculty'}
                      </td>
                      <td className="py-3 px-3 text-[#57655B]">
                        {record.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <CalendarCheck className="w-10 h-10 text-[#57655B]/40 mx-auto" />
              <p className="text-xs font-semibold text-[#1A231E]">No attendance records found</p>
              <p className="text-[11px] text-[#57655B]">
                {totalDays === 0
                  ? 'No attendance sessions have been logged for this student yet.'
                  : 'No records match the selected date or status filter.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-[#57655B]">
            Showing <strong>{filtered.length}</strong> of <strong>{totalDays}</strong> total sessions
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0D381E] text-white hover:bg-[#16532d] rounded-xl font-bold transition-colors cursor-pointer text-xs"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
