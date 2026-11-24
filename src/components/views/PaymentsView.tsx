import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Bell,
  Plus,
  Send,
  DollarSign,
  Calendar,
  Building,
  Filter,
  Search,
  ArrowRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Campus,
  UserSession,
  PaymentRecord,
  PaymentStatus,
  TeacherSalaryRecord,
  ExpenseRecord,
} from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { formatCampusCurrency, resolveCurrencyCode } from '../../utils/currency.ts';

interface PaymentsViewProps {
  user: UserSession;
  campuses: Campus[];
  activeCampusId: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  user,
  activeCampusId,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'salaries' | 'expenses'>('students');
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const effectiveCampus = user.role === 'SUPER_ADMIN' ? activeCampusId : user.activeCampusId;
  const payments = IMSStateService.getPayments(effectiveCampus);
  const salaryRecords = IMSStateService.getSalaryRecords(effectiveCampus);
  const expenses = IMSStateService.getExpenses(effectiveCampus);

  // Slideout state for Update Invoice Status
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentRecord | null>(null);
  const [modalStatus, setModalStatus] = useState<PaymentStatus>('PAID');
  const [modalMethod, setModalMethod] = useState<string>('Cash');
  const [modalAmountPaid, setModalAmountPaid] = useState<number>(30);

  // Add Expense Modal state
  const defaultExpCurrency = effectiveCampus === 'kts' ? 'PKR' : 'GBP';
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expCategory, setExpCategory] = useState<'UTILITIES' | 'MAINTENANCE' | 'EVENTS' | 'SALARIES'>('UTILITIES');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(defaultExpCurrency === 'PKR' ? 15000 : 150);
  const [expCurrency, setExpCurrency] = useState<'GBP' | 'PKR'>(defaultExpCurrency);

  React.useEffect(() => {
    const newCur = effectiveCampus === 'kts' ? 'PKR' : 'GBP';
    setExpCurrency(newCur);
    setExpAmount(newCur === 'PKR' ? 15000 : 150);
  }, [effectiveCampus]);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Campus-isolated Financial Statistics (never sum GBP and PKR together)
  const ukPayments = payments.filter((p) => p.campusId === 'uk' || p.currency === 'GBP');
  const ktsPayments = payments.filter((p) => p.campusId === 'kts' || p.currency === 'PKR');

  const ukDue = ukPayments.reduce((acc, p) => acc + p.amountDue, 0);
  const ukCollected = ukPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const ukPending = ukDue - ukCollected;

  const ktsDue = ktsPayments.reduce((acc, p) => acc + p.amountDue, 0);
  const ktsCollected = ktsPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const ktsPending = ktsDue - ktsCollected;

  const siblingDiscountCount = payments.filter((p) => p.hasSiblingDiscount).length;

  const handleOpenUpdateModal = (p: PaymentRecord) => {
    setSelectedInvoice(p);
    setModalStatus(p.status === 'PAID' ? 'PAID' : 'PAID');
    setModalMethod(p.paymentMethod || 'Cash');
    setModalAmountPaid(p.amountDue);
  };

  const handleSaveInvoiceStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    IMSStateService.updateInvoiceStatus(
      selectedInvoice.id,
      modalStatus,
      modalMethod,
      modalAmountPaid
    );

    setFeedback(`Invoice ${selectedInvoice.invoiceNumber} updated to ${modalStatus} via ${modalMethod}.`);
    setSelectedInvoice(null);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleSendAutomaticReminders = () => {
    const res = IMSStateService.sendUnpaidFeeReminders();
    setFeedback(res.message);
    setTimeout(() => setFeedback(''), 5000);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;

    const targetCampusId = effectiveCampus === 'all'
      ? (expCurrency === 'PKR' ? 'kts' : 'uk')
      : effectiveCampus;

    IMSStateService.addExpense({
      campusId: targetCampusId,
      category: expCategory,
      title: expTitle.trim(),
      amount: expAmount,
      currency: expCurrency,
      date: new Date().toISOString().split('T')[0],
      approvedBy: user.fullName,
      receiptNumber: `REC-EXP-${Date.now().toString().slice(-4)}`,
    });

    setFeedback(`Expense "${expTitle}" recorded (${expCurrency}) under ${expCategory}.`);
    setIsAddExpenseOpen(false);
    setExpTitle('');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Core Rules Summary & Actions */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-heading font-bold text-xl text-[#0D381E]">
              Financial Management & Accounts
            </h3>
            <span className="text-[10px] bg-[#E5C158] text-[#0D381E] font-bold px-2.5 py-0.5 rounded-full">
              Fee Due: 10th of Each Month
            </span>
          </div>
          <p className="text-xs text-[#57655B] mt-0.5">
            {effectiveCampus === 'kts' ? (
              <>
                KTS Pakistan Campus: Standard fee: <strong>Rs. 3,500 monthly</strong> & <strong>Rs. 1,500 admission</strong> · Sibling discount exception: <strong>Rs. 2,800</strong> · Disbursed in PKR.
              </>
            ) : effectiveCampus === 'uk' ? (
              <>
                UK Campus: Standard fee: <strong>£30 monthly</strong> & <strong>£15 admission</strong> · Sibling discount exception: <strong>10 students at £25</strong> · Salaries paid <strong>every Friday in Cash</strong>.
              </>
            ) : (
              <>
                Multi-Campus Treasury: UK Standard <strong>£30/mo</strong> (Sibling £25) · KTS Standard <strong>Rs. 3,500/mo</strong> (Sibling Rs. 2,800) · Disbursed in GBP & PKR.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'students' && (
            <button
              onClick={handleSendAutomaticReminders}
              className="px-3 sm:px-3.5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5 min-h-[38px]"
            >
              <Send className="w-4 h-4 text-[#E5C158] shrink-0" />
              <span className="hidden sm:inline">Send Reminders for Unpaid Fees (Email/WhatsApp)</span>
              <span className="sm:hidden">Send Fee Reminders</span>
            </button>
          )}

          {activeTab === 'expenses' && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5 min-h-[38px]"
            >
              <Plus className="w-4 h-4 text-[#E5C158] shrink-0" />
              <span>Record Mosque Expense</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E2D8] shadow-2xs">
          <span className="text-[#57655B] block font-medium text-[11px] sm:text-xs">Total Invoiced</span>
          {effectiveCampus === 'uk' ? (
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#0D381E] mt-0.5 block">
              {formatCampusCurrency(ukDue, 'GBP')}
            </span>
          ) : effectiveCampus === 'kts' ? (
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#0D381E] mt-0.5 block">
              {formatCampusCurrency(ktsDue, 'PKR')}
            </span>
          ) : (
            <div className="text-xs sm:text-sm font-bold font-mono text-[#0D381E] mt-0.5 space-y-0.5">
              <div>UK: {formatCampusCurrency(ukDue, 'GBP')}</div>
              <div>KTS: {formatCampusCurrency(ktsDue, 'PKR')}</div>
            </div>
          )}
          <span className="text-[10px] text-[#57655B] truncate block">{payments.length} student invoices</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E2D8] shadow-2xs">
          <span className="text-[#57655B] block font-medium text-[11px] sm:text-xs">Total Collected</span>
          {effectiveCampus === 'uk' ? (
            <>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 mt-0.5 block">
                {formatCampusCurrency(ukCollected, 'GBP')}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold truncate block">
                {ukDue > 0 ? Math.round((ukCollected / ukDue) * 100) : 0}% Collection Rate
              </span>
            </>
          ) : effectiveCampus === 'kts' ? (
            <>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 mt-0.5 block">
                {formatCampusCurrency(ktsCollected, 'PKR')}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold truncate block">
                {ktsDue > 0 ? Math.round((ktsCollected / ktsDue) * 100) : 0}% Collection Rate
              </span>
            </>
          ) : (
            <>
              <div className="text-xs sm:text-sm font-bold font-mono text-emerald-800 mt-0.5 space-y-0.5">
                <div>UK: {formatCampusCurrency(ukCollected, 'GBP')}</div>
                <div>KTS: {formatCampusCurrency(ktsCollected, 'PKR')}</div>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold truncate block mt-0.5">
                Multi-Branch Active
              </span>
            </>
          )}
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E2D8] shadow-2xs">
          <span className="text-[#57655B] block font-medium text-[11px] sm:text-xs">Pending & Overdue</span>
          {effectiveCampus === 'uk' ? (
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-700 mt-0.5 block">
              {formatCampusCurrency(ukPending, 'GBP')}
            </span>
          ) : effectiveCampus === 'kts' ? (
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-700 mt-0.5 block">
              {formatCampusCurrency(ktsPending, 'PKR')}
            </span>
          ) : (
            <div className="text-xs sm:text-sm font-bold font-mono text-amber-700 mt-0.5 space-y-0.5">
              <div>UK: {formatCampusCurrency(ukPending, 'GBP')}</div>
              <div>KTS: {formatCampusCurrency(ktsPending, 'PKR')}</div>
            </div>
          )}
          <span className="text-[10px] text-amber-700 truncate block">Due 10th monthly</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E2D8] shadow-2xs">
          <span className="text-[#57655B] block font-medium text-[11px] sm:text-xs">Sibling Discounts</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#0D381E] mt-0.5 block">{siblingDiscountCount}</span>
          <span className="text-[10px] text-[#57655B] truncate block">
            {effectiveCampus === 'kts' ? 'Rs. 2,800/mo concession' : effectiveCampus === 'uk' ? '£25/month concession' : 'Regional concessions'}
          </span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E6E2D8] text-xs overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'students'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Student Invoices ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('salaries')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'salaries'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Teacher Salaries (Friday Payroll)</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'expenses'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Mosque Expenses</span>
        </button>
      </div>

      {/* TAB 1: STUDENT PAYMENTS & INVOICES */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden animate-in fade-in">
          {/* Filter Bar */}
          <div className="p-3.5 sm:p-4 bg-[#F9F8F4] border-b border-[#E6E2D8] flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#57655B]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[#E6E2D8] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#0D381E]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, invoice..."
                className="pl-7 pr-3 py-1.5 rounded-lg border border-[#E6E2D8] text-xs bg-white w-full sm:w-60 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-[#57655B] absolute left-2 top-2.5" />
            </div>
          </div>

          {/* MOBILE VIEW: Cards for Invoices */}
          <div className="block sm:hidden divide-y divide-[#E6E2D8]">
            {filteredPayments.map((p) => (
              <div key={p.id} className="p-3.5 space-y-2 hover:bg-[#F9F8F4]">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#0D381E]">{p.invoiceNumber}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1A231E]">{p.studentName}</div>
                  <div className="text-[11px] font-mono text-[#57655B]">ID: {p.admissionNumber}</div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6E2D8]/60">
                  <div>
                    <span className="text-[#57655B] text-[10px] block">Amount Due / Paid:</span>
                    <span className="font-bold font-mono text-[#0D381E]">{formatCampusCurrency(p.amountDue, p.currency)}</span>
                    <span className="text-emerald-700 font-mono text-[11px] ml-1.5 font-medium">(Paid {formatCampusCurrency(p.amountPaid, p.currency)})</span>
                  </div>
                  <button
                    onClick={() => handleOpenUpdateModal(p)}
                    className="px-3 py-1.5 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-2xs min-h-[36px]"
                  >
                    Update
                  </button>
                </div>
                <div className="text-[10px] text-[#57655B] flex justify-between pt-0.5">
                  <span>Due: {p.dueDate}</span>
                  <span>Method: {p.paymentMethod || 'Awaiting'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px]">
                  <th className="p-3.5 font-semibold">Invoice #</th>
                  <th className="p-3.5 font-semibold">Student Name</th>
                  <th className="p-3.5 font-semibold">Fee Type / Discount</th>
                  <th className="p-3.5 font-semibold">Amount Due</th>
                  <th className="p-3.5 font-semibold">Paid</th>
                  <th className="p-3.5 font-semibold">Due Date</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold">Payment Method</th>
                  <th className="p-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9F8F4] transition-colors">
                    <td className="p-3.5 font-mono font-medium text-[#0D381E]">{p.invoiceNumber}</td>
                    <td className="p-3.5 font-semibold text-[#1A231E]">
                      {p.studentName}
                      <span className="text-[10px] font-mono text-[#57655B] block">{p.admissionNumber}</span>
                    </td>
                    <td className="p-3.5">
                      {p.hasSiblingDiscount ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5C158]/25 text-[#0D381E] border border-[#E5C158]/40">
                          Sibling Exception ({p.currency === 'PKR' ? 'Rs. 2,800' : '£25'})
                        </span>
                      ) : p.title.includes('Admission') ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          Admission Fee ({p.currency === 'PKR' ? 'Rs. 1,500' : '£15'})
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#57655B]">
                          Standard Tuition ({p.currency === 'PKR' ? 'Rs. 3,500' : '£30'})
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#0D381E]">{formatCampusCurrency(p.amountDue, p.currency)}</td>
                    <td className="p-3.5 font-mono text-emerald-800">{formatCampusCurrency(p.amountPaid, p.currency)}</td>
                    <td className="p-3.5 font-mono text-[#57655B]">{p.dueDate}</td>
                    <td className="p-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3.5 font-medium text-[#57655B]">{p.paymentMethod || 'Awaiting Payment'}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenUpdateModal(p)}
                        className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER SALARIES (WEEKLY FRIDAY CASH PAYROLL) */}
      {activeTab === 'salaries' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden animate-in fade-in space-y-4">
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold block text-emerald-900">Weekly Friday Cash Payroll Regulations</span>
              <span className="text-[11px] text-emerald-800">
                All faculty instructors are disbursed net salary weekly on Friday in <strong>Cash</strong>.
              </span>
            </div>
            <span className="text-xs bg-emerald-200 text-emerald-950 font-bold px-2.5 py-1 rounded">
              Every Friday Disbursements
            </span>
          </div>

          {/* MOBILE VIEW: Salary Cards */}
          <div className="block sm:hidden divide-y divide-[#E6E2D8] px-3.5">
            {salaryRecords.map((sal) => (
              <div key={sal.id} className="py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0D381E]">{sal.teacherName}</span>
                  <StatusBadge status={sal.paymentStatus} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#57655B]">{sal.payPeriod || sal.monthYear}</span>
                  <span className="font-mono font-bold text-sm text-[#0D381E]">
                    {formatCampusCurrency(sal.netSalary, sal.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#57655B] pt-1">
                  <span>Method: <strong className="text-[#0D381E]">CASH</strong></span>
                  <span>{sal.paymentDate || 'Friday (End of Week)'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden sm:block overflow-x-auto p-4">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px]">
                  <th className="p-3.5 font-semibold">Teacher Name</th>
                  <th className="p-3.5 font-semibold">Pay Period</th>
                  <th className="p-3.5 font-semibold">Net Salary</th>
                  <th className="p-3.5 font-semibold">Disbursement Date</th>
                  <th className="p-3.5 font-semibold">Method</th>
                  <th className="p-3.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {salaryRecords.map((sal) => (
                  <tr key={sal.id} className="hover:bg-[#F9F8F4]">
                    <td className="p-3.5 font-bold text-[#0D381E]">{sal.teacherName}</td>
                    <td className="p-3.5 text-[#57655B]">{sal.payPeriod || sal.monthYear}</td>
                    <td className="p-3.5 font-mono font-bold text-[#0D381E]">
                      {formatCampusCurrency(sal.netSalary, sal.currency)}
                    </td>
                    <td className="p-3.5 font-mono text-[#57655B]">{sal.paymentDate || 'Friday (End of Week)'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5C158]/30 text-[#0D381E]">
                        CASH
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <StatusBadge status={sal.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MOSQUE EXPENSES (UTILITIES, MAINTENANCE, EVENTS) */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden animate-in fade-in space-y-4">
          <div className="p-4 bg-[#F9F8F4] border-b border-[#E6E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h4 className="font-heading font-semibold text-base text-[#0D381E]">
                Mosque Operational Expenditures
              </h4>
              <p className="text-xs text-[#57655B]">
                Track utilities (electricity, heating, water), ongoing maintenance, community events, and supplies.
              </p>
            </div>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs flex items-center space-x-1 shrink-0 self-start sm:self-auto min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          </div>

          {/* MOBILE VIEW: Expense Cards */}
          <div className="block sm:hidden divide-y divide-[#E6E2D8] px-3.5">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-[#1A231E]">{exp.title}</span>
                  <span className="font-mono font-bold text-xs text-[#0D381E] shrink-0">
                    {formatCampusCurrency(exp.amount, exp.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    exp.category === 'UTILITIES' ? 'bg-sky-100 text-sky-800' :
                    exp.category === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                    exp.category === 'EVENTS' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {exp.category}
                  </span>
                  <span className="text-[#57655B] font-mono">{exp.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden sm:block overflow-x-auto p-4">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px]">
                  <th className="p-3.5 font-semibold">Expense Title</th>
                  <th className="p-3.5 font-semibold">Category</th>
                  <th className="p-3.5 font-semibold">Amount</th>
                  <th className="p-3.5 font-semibold">Date</th>
                  <th className="p-3.5 font-semibold">Receipt #</th>
                  <th className="p-3.5 font-semibold text-right">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F9F8F4]">
                    <td className="p-3.5 font-medium text-[#1A231E]">{exp.title}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        exp.category === 'UTILITIES' ? 'bg-sky-100 text-sky-800' :
                        exp.category === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                        exp.category === 'EVENTS' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#0D381E]">
                      {formatCampusCurrency(exp.amount, exp.currency)}
                    </td>
                    <td className="p-3.5 font-mono text-[#57655B]">{exp.date}</td>
                    <td className="p-3.5 font-mono text-[#57655B]">{exp.receiptNumber || 'REC-ON-FILE'}</td>
                    <td className="p-3.5 text-right font-medium text-[#0D381E]">{exp.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SLIDEOUT / MODAL: UPDATE INVOICE STATUS (WITH PAYMENT METHOD DROPDOWN) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-md w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-[#E5C158]" />
                <h4 className="font-heading font-bold text-base text-[#F3D273]">
                  Update Invoice Status
                </h4>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceStatus} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Student:</span>
                  <span className="font-bold text-[#0D381E]">{selectedInvoice.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Invoice:</span>
                  <span className="font-mono">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655B]">Amount Due:</span>
                  <span className="font-mono font-bold text-[#0D381E]">
                    {formatCampusCurrency(selectedInvoice.amountDue, selectedInvoice.currency)}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Payment Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as PaymentStatus)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs font-semibold bg-[#F9F8F4]"
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PARTIAL">Partial</option>
                </select>
              </div>

              {/* PAYMENT METHOD DROPDOWN (CASH, ONLINE, DIRECT DEBIT, SUMUP) */}
              <div>
                <label className="block font-bold text-[#1A231E] mb-1">
                  Payment Method Dropdown <span className="text-rose-600">*</span>
                </label>
                <select
                  value={modalMethod}
                  onChange={(e) => setModalMethod(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs font-bold text-[#0D381E] bg-[#F9F8F4]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Direct Debit">Direct Debit</option>
                  <option value="Bank Transfer (SumUp)">Bank Transfer (SumUp)</option>
                </select>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block font-bold text-[#1A231E] mb-1">
                  Amount Paid ({selectedInvoice.currency === 'PKR' ? 'Rs. PKR' : '£ GBP'})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedInvoice.amountDue}
                  value={modalAmountPaid}
                  onChange={(e) => setModalAmountPaid(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs font-mono font-bold bg-[#F9F8F4]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: RECORD MOSQUE EXPENSE */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-md w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <h4 className="font-heading font-bold text-base text-[#F3D273]">
                Record Mosque Expense
              </h4>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-white/70 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Expense Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4] font-semibold"
                >
                  <option value="UTILITIES">Utilities (Heating, Electricity, Water)</option>
                  <option value="MAINTENANCE">Maintenance & Repairs</option>
                  <option value="EVENTS">Events & Competitions</option>
                  <option value="SALARIES">Faculty & Staff Salaries</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Operating Currency</label>
                <select
                  value={expCurrency}
                  onChange={(e) => setExpCurrency(e.target.value as 'GBP' | 'PKR')}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4] font-semibold"
                >
                  <option value="GBP">GBP (£ - UK Campus)</option>
                  <option value="PKR">PKR (Rs. - KTS Pakistan Campus)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Title / Description</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Mosque Gas Central Heating Boiler Inspection"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">
                  Amount ({expCurrency === 'PKR' ? 'Rs. PKR' : '£ GBP'})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs font-mono font-bold bg-[#F9F8F4]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
