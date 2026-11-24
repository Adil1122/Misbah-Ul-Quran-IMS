import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  GraduationCap,
  Users,
  CreditCard,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StudentRecord, TeacherProfile, PaymentRecord } from '../../types/ims.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent?: (studentId: string) => void;
  onSelectTeacher?: (teacherId: string) => void;
  onNavigateTab?: (tabId: string) => void;
  activeCampusId: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onSelectTeacher,
  onNavigateTab,
  activeCampusId,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'STUDENTS' | 'TEACHERS' | 'PAYMENTS'>('ALL');

  const allStudents = useMemo(() => IMSStateService.getStudents(activeCampusId), [activeCampusId]);
  const allTeachers = useMemo(() => IMSStateService.getTeachers(activeCampusId), [activeCampusId]);
  const allPayments = useMemo(() => IMSStateService.getPayments(activeCampusId), [activeCampusId]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return {
        students: allStudents.slice(0, 4),
        teachers: allTeachers.slice(0, 3),
        payments: allPayments.slice(0, 3),
        totalCount: 10,
      };
    }

    const q = query.toLowerCase().trim();

    const matchedStudents = allStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        (s.className && s.className.toLowerCase().includes(q)) ||
        (s.primaryParentName && s.primaryParentName.toLowerCase().includes(q))
    );

    const matchedTeachers = allTeachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        t.employeeCode.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
    );

    const matchedPayments = allPayments.filter(
      (p) =>
        p.studentName.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.admissionNumber.toLowerCase().includes(q) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
        p.status.toLowerCase().includes(q)
    );

    return {
      students: matchedStudents,
      teachers: matchedTeachers,
      payments: matchedPayments,
      totalCount: matchedStudents.length + matchedTeachers.length + matchedPayments.length,
    };
  }, [query, allStudents, allTeachers, allPayments]);

  if (!isOpen) return null;

  const showStudents = filterType === 'ALL' || filterType === 'STUDENTS';
  const showTeachers = filterType === 'ALL' || filterType === 'TEACHERS';
  const showPayments = filterType === 'ALL' || filterType === 'PAYMENTS';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E6E2D8] max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 bg-[#0D381E] text-white flex items-center space-x-3 border-b border-[#E5C158]/30">
          <Search className="w-5 h-5 text-[#E5C158] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, faculty, or payments by name, ID, invoice..."
            className="w-full bg-transparent text-white placeholder-white/60 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-white/60 hover:text-white text-xs cursor-pointer px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="bg-[#F9F8F4] px-4 py-2 border-b border-[#E6E2D8] flex items-center justify-between text-xs overflow-x-auto">
          <div className="flex items-center space-x-2">
            <span className="text-[#57655B] font-medium hidden sm:inline">Filter:</span>
            {(['ALL', 'STUDENTS', 'TEACHERS', 'PAYMENTS'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-2xs'
                    : 'bg-white text-[#57655B] hover:text-[#0D381E] border border-[#E6E2D8]'
                }`}
              >
                {type === 'ALL'
                  ? `All (${results.totalCount})`
                  : type === 'STUDENTS'
                  ? `Students (${results.students.length})`
                  : type === 'TEACHERS'
                  ? `Faculty (${results.teachers.length})`
                  : `Payments (${results.payments.length})`}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[#57655B] font-mono hidden md:inline">
            Press ESC to exit
          </span>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* STUDENTS SECTION */}
          {showStudents && results.students.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[#0D381E] font-bold pb-1 border-b border-[#E6E2D8]/60">
                <span className="flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0D381E]" />
                  <span>Students ({results.students.length})</span>
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onNavigateTab('students');
                      onClose();
                    }}
                    className="text-[11px] text-[#57655B] hover:text-[#0D381E] hover:underline"
                  >
                    View All Directory →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.students.map((std) => (
                  <div
                    key={std.id}
                    onClick={() => {
                      if (onSelectStudent) onSelectStudent(std.id);
                      else if (onNavigateTab) onNavigateTab('students');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg border border-[#E6E2D8] bg-[#FDFCFB] hover:border-[#0D381E] hover:bg-white hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-[#0D381E] block group-hover:text-[#16532d]">
                        {std.firstName} {std.lastName}
                      </span>
                      <span className="text-[10px] text-[#57655B] font-mono">
                        {std.admissionNumber} · {std.className || std.currentGrade}
                      </span>
                      {std.hasSiblingDiscount && (
                        <span className="text-[9px] block text-amber-700 font-semibold">
                          Sibling Discount (£25)
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#57655B] group-hover:text-[#0D381E] group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEACHERS SECTION */}
          {showTeachers && results.teachers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[#0D381E] font-bold pb-1 border-b border-[#E6E2D8]/60">
                <span className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0D381E]" />
                  <span>Faculty & Teachers ({results.teachers.length})</span>
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onNavigateTab('teachers');
                      onClose();
                    }}
                    className="text-[11px] text-[#57655B] hover:text-[#0D381E] hover:underline"
                  >
                    View Faculty Registry →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.teachers.map((tch) => (
                  <div
                    key={tch.id}
                    onClick={() => {
                      if (onSelectTeacher) onSelectTeacher(tch.id);
                      else if (onNavigateTab) onNavigateTab('teachers');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg border border-[#E6E2D8] bg-[#FDFCFB] hover:border-[#0D381E] hover:bg-white hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-[#0D381E] block group-hover:text-[#16532d]">
                        {tch.fullName}
                      </span>
                      <span className="text-[10px] text-[#57655B] font-mono">
                        {tch.employeeCode} · {tch.specialization}
                      </span>
                      <span className="text-[9px] block text-emerald-800 font-semibold">
                        Salary: {tch.salaryCurrency === 'GBP' ? '£' : 'PKR '}{tch.baseMonthlySalary}/mo (Cash)
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#57655B] group-hover:text-[#0D381E] group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENTS SECTION */}
          {showPayments && results.payments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[#0D381E] font-bold pb-1 border-b border-[#E6E2D8]/60">
                <span className="flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#0D381E]" />
                  <span>Payments & Invoices ({results.payments.length})</span>
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onNavigateTab('finance-overview');
                      onClose();
                    }}
                    className="text-[11px] text-[#57655B] hover:text-[#0D381E] hover:underline"
                  >
                    View Invoices →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.payments.map((pmt) => (
                  <div
                    key={pmt.id}
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('finance-overview');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg border border-[#E6E2D8] bg-[#FDFCFB] hover:border-[#0D381E] hover:bg-white hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[#0D381E]">{pmt.studentName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            pmt.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pmt.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pmt.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#57655B] font-mono">
                        Invoice: {pmt.invoiceNumber} · Due: {pmt.dueDate}
                      </span>
                      <span className="text-[10px] block font-mono font-bold text-[#0D381E]">
                        £{pmt.amountPaid} / £{pmt.amountDue} · Method: {pmt.paymentMethod || 'Cash'}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#57655B] group-hover:text-[#0D381E] group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.totalCount === 0 && (
            <div className="py-12 text-center text-[#57655B] space-y-1">
              <Search className="w-8 h-8 text-[#57655B]/40 mx-auto" />
              <p className="font-semibold text-sm">No records match "{query}"</p>
              <p className="text-[11px]">Try searching by student name, admission number, teacher name, or invoice number.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
