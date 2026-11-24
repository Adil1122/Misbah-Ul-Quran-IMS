import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Lock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { AuditLogRecord, UserRole } from '../../../types/ims.ts';

export const AuditCenterView: React.FC = () => {
  const [filterCampus, setFilterCampus] = useState<'all' | 'uk' | 'kts'>('all');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterOutcome, setFilterOutcome] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const logs = IMSStateService.getAuditLogs(filterCampus);

  // Filter logic
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      // 1. Search Query
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        l.entityId.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Role Filter
      if (filterRole !== 'ALL' && l.userRole !== filterRole) {
        return false;
      }

      // 3. Outcome Filter
      if (filterOutcome !== 'ALL') {
        const entryOutcome = l.outcome || (l.action.includes('FAILED') ? 'FAILED' : 'SUCCESS');
        if (entryOutcome !== filterOutcome) return false;
      }

      // 4. Category Filter
      if (filterCategory !== 'ALL') {
        if (filterCategory === 'AUTH' && !l.action.includes('LOGIN') && !l.action.includes('LOGOUT') && !l.action.includes('PASSWORD')) {
          return false;
        }
        if (filterCategory === 'ATTENDANCE' && !l.action.includes('ATTENDANCE') && !l.action.includes('ROLLCALL')) {
          return false;
        }
        if (filterCategory === 'FINANCE' && !l.action.includes('PAYMENT') && !l.action.includes('INVOICE') && !l.action.includes('SALARY') && !l.action.includes('EXPENSE')) {
          return false;
        }
        if (filterCategory === 'ACADEMIC' && !l.action.includes('PROGRESS') && !l.action.includes('QURAN') && !l.action.includes('RESULT')) {
          return false;
        }
        if (filterCategory === 'INCIDENT' && !l.action.includes('INCIDENT') && !l.action.includes('MEDICAL')) {
          return false;
        }
        if (filterCategory === 'ADMIN' && !l.action.includes('PORTAL_USER') && !l.action.includes('APPROVAL') && !l.action.includes('VIEW_MODE')) {
          return false;
        }
      }

      // 5. Date Range Filter
      if (startDate && l.timestamp.substring(0, 10) < startDate) return false;
      if (endDate && l.timestamp.substring(0, 10) > endDate) return false;

      return true;
    });
  }, [logs, search, filterRole, filterCategory, filterOutcome, startDate, endDate]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Metric counters
  const totalEventsCount = logs.length;
  const authEventsCount = logs.filter((l) => l.action.includes('LOGIN') || l.action.includes('LOGOUT') || l.action.includes('PASSWORD')).length;
  const attendanceEventsCount = logs.filter((l) => l.action.includes('ATTENDANCE') || l.action.includes('ROLLCALL')).length;
  const financeEventsCount = logs.filter((l) => l.action.includes('PAYMENT') || l.action.includes('INVOICE') || l.action.includes('SALARY')).length;

  const getOutcomeBadge = (log: AuditLogRecord) => {
    const outcome = log.outcome || (log.action.includes('FAILED') ? 'FAILED' : 'SUCCESS');
    if (outcome === 'SUCCESS') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          ✓ Success
        </span>
      );
    }
    if (outcome === 'FAILED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
          ✕ Failed
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
        ℹ Info
      </span>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="font-bold text-[#0D381E]">Super Admin</span>;
      case 'CAMPUS_ADMIN':
        return <span className="font-semibold text-blue-800">Branch Admin</span>;
      case 'TEACHER':
        return <span className="font-semibold text-amber-800">Teacher / Qari</span>;
      case 'PARENT':
        return <span className="font-semibold text-purple-800">Parent / Guardian</span>;
      default:
        return <span className="text-[#57655B]">{role}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-[#0D381E] text-[#E5C158] text-[11px] font-semibold tracking-wider uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>Comprehensive Multi-Portal Activity & Security Ledger</span>
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-2">
            Central Activity & Audit Log Center
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5 max-w-2xl">
            Real-time audit records across Super Admin, Branch Admin, Teacher, and Parent portals. Captures logins, roll-calls, student records, fee status changes, approvals, and administrative actions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center space-x-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audit Integrity: 100% Verifiable</span>
          </span>
        </div>
      </div>

      {/* 2. Executive Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Total Logged Events</span>
          <span className="text-xl font-bold font-mono text-[#0D381E]">{totalEventsCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Auth & Access Events</span>
          <span className="text-xl font-bold font-mono text-blue-900">{authEventsCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Attendance Events</span>
          <span className="text-xl font-bold font-mono text-emerald-800">{attendanceEventsCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Finance & Billing Events</span>
          <span className="text-xl font-bold font-mono text-[#0D381E]">{financeEventsCount}</span>
        </div>
      </div>

      {/* 3. Multi-Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-[#E6E2D8] shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by operator, action, record ID, or details..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#E6E2D8] rounded-lg text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
            />
            <Search className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
          </div>

          {/* Quick reset */}
          {(search || filterCampus !== 'all' || filterRole !== 'ALL' || filterCategory !== 'ALL' || filterOutcome !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterCampus('all');
                setFilterRole('ALL');
                setFilterCategory('ALL');
                setFilterOutcome('ALL');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="text-[11px] font-bold text-[#0D381E] hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-[#E6E2D8]/60">
          <div>
            <label className="block text-[10px] font-bold text-[#57655B] uppercase mb-0.5">Campus</label>
            <select
              value={filterCampus}
              onChange={(e) => {
                setFilterCampus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full p-1.5 rounded-lg border border-[#E6E2D8] bg-white font-medium"
            >
              <option value="all">All Campuses</option>
              <option value="uk">UK Campus</option>
              <option value="kts">KTS Pakistan</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#57655B] uppercase mb-0.5">Role / Portal</label>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-1.5 rounded-lg border border-[#E6E2D8] bg-white font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="CAMPUS_ADMIN">Campus Admin</option>
              <option value="TEACHER">Teacher Portal</option>
              <option value="PARENT">Parent Portal</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#57655B] uppercase mb-0.5">Action Category</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-1.5 rounded-lg border border-[#E6E2D8] bg-white font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="AUTH">Authentication & Logins</option>
              <option value="ATTENDANCE">Attendance & Roll-Call</option>
              <option value="FINANCE">Finance & Invoices</option>
              <option value="ACADEMIC">Sabaq & Results</option>
              <option value="INCIDENT">Incident & Medical</option>
              <option value="ADMIN">Governance & Accounts</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#57655B] uppercase mb-0.5">Outcome</label>
            <select
              value={filterOutcome}
              onChange={(e) => {
                setFilterOutcome(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-1.5 rounded-lg border border-[#E6E2D8] bg-white font-medium"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="INFO">Information Only</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center space-x-1">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#57655B] uppercase mb-0.5">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-1 rounded-lg border border-[#E6E2D8] bg-white font-mono text-[11px]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#57655B] uppercase mb-0.5">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-1 rounded-lg border border-[#E6E2D8] bg-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Audit Log Table */}
      <div className="bg-white rounded-lg border border-[#E6E2D8] shadow-xs overflow-hidden">
        {/* MOBILE VIEW: Audit Cards */}
        <div className="block sm:hidden divide-y divide-[#E6E2D8] p-3 space-y-2.5">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-[#0D381E] block">{log.action}</span>
                    <span className="text-[11px] text-[#57655B]">{log.userName} · {log.campusId?.toUpperCase() || 'GLOBAL'}</span>
                  </div>
                  {getOutcomeBadge(log)}
                </div>
                {log.details && (
                  <p className="text-xs text-[#1A231E] line-clamp-2">{log.details}</p>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-[#E6E2D8]/60 text-[10px] text-[#57655B]">
                  <span className="font-mono">{log.timestamp}</span>
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="px-2.5 py-1 rounded bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer flex items-center space-x-1 min-h-[32px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-[#57655B]">
              No audit log records match the selected criteria.
            </div>
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead>
              <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Portal / Role</th>
                <th className="p-3.5">Campus</th>
                <th className="p-3.5">Action Performed</th>
                <th className="p-3.5">Record Type</th>
                <th className="p-3.5">Outcome</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9F8F4]/80 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-[#57655B] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-3.5 font-bold text-[#0D381E]">{log.userName}</td>
                    <td className="p-3.5">{getRoleBadge(log.userRole)}</td>
                    <td className="p-3.5 font-bold text-xs">
                      {log.campusId ? log.campusId.toUpperCase() : 'GLOBAL'}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] font-semibold text-[#0D381E]">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-[#57655B] font-mono text-[11px]">{log.entityType}</td>
                    <td className="p-3.5">{getOutcomeBadge(log)}</td>
                    <td className="p-3.5 text-[#1A231E] max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-[#57655B] hover:text-[#0D381E] hover:bg-[#F9F8F4] rounded transition-colors cursor-pointer"
                        title="View Full Audit Event Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#57655B]">
                    No audit log records match the selected search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-[#F9F8F4] border-t border-[#E6E2D8] flex items-center justify-between text-xs">
          <span className="text-[#57655B]">
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> -{' '}
            <strong>{Math.min(currentPage * pageSize, filteredLogs.length)}</strong> of{' '}
            <strong>{filteredLogs.length}</strong> entries
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded border border-[#E6E2D8] bg-white hover:bg-[#E6E2D8] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-[#0D381E]">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded border border-[#E6E2D8] bg-white hover:bg-[#E6E2D8] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Detail View Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#E6E2D8] overflow-hidden flex flex-col">
            <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0D381E] bg-[#E5C158] px-2 py-0.5 rounded">
                    Immutable Audit Record
                  </span>
                  <span className="text-xs font-mono text-[#E6E2D8]/80">{selectedLog.id}</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8]">
                <div>
                  <span className="text-[10px] text-[#57655B] uppercase font-bold block">Timestamp</span>
                  <span className="font-mono font-bold text-[#0D381E]">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#57655B] uppercase font-bold block">Outcome</span>
                  <div className="mt-0.5">{getOutcomeBadge(selectedLog)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#57655B] uppercase font-bold block">Operator</span>
                  <span className="font-bold text-[#0D381E]">{selectedLog.userName} ({selectedLog.userRole})</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#57655B] uppercase font-bold block">Campus</span>
                  <span className="font-bold text-[#0D381E]">{selectedLog.campusId ? selectedLog.campusId.toUpperCase() : 'GLOBAL'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#57655B] uppercase font-bold block">Entity Type</span>
                  <span className="font-mono text-[#57655B]">{selectedLog.entityType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#57655B] uppercase font-bold block">Entity Reference ID</span>
                  <span className="font-mono font-bold text-[#0D381E]">{selectedLog.entityId}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#0D381E] block mb-1">Details & Description:</span>
                <p className="p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] text-[#1A231E] leading-relaxed">
                  {selectedLog.details || 'No extended remarks logged.'}
                </p>
              </div>

              {selectedLog.changesBeforeAfter && selectedLog.changesBeforeAfter.length > 0 && (
                <div>
                  <span className="font-bold text-[#0D381E] block mb-1">Field State Mutations (Before / After):</span>
                  <div className="space-y-1.5 p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] font-mono text-[11px]">
                    {selectedLog.changesBeforeAfter.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-bold text-[#0D381E]">{c.field}:</span>
                        <div className="space-x-1">
                          <span className="text-rose-700 line-through">{c.before}</span>
                          <span>→</span>
                          <span className="text-emerald-700 font-bold">{c.after}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#0D381E] text-white hover:bg-[#16532d] rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
