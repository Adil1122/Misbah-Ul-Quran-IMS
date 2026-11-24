import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  CreditCard,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { formatCampusCurrency } from '../../../utils/currency.ts';

interface FinancialAuditCenterViewProps {
  activeCampusId?: string;
}

export const FinancialAuditCenterView: React.FC<FinancialAuditCenterViewProps> = ({
  activeCampusId,
}) => {
  const [auditMode, setAuditMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState('2026-10-07');
  const initialCampus = activeCampusId === 'kts' || activeCampusId === 'uk' ? activeCampusId : 'all';
  const [auditCampus, setAuditCampus] = useState<'all' | 'uk' | 'kts'>(initialCampus);

  useEffect(() => {
    if (activeCampusId === 'kts' || activeCampusId === 'uk') {
      setAuditCampus(activeCampusId);
    } else if (activeCampusId === 'all') {
      setAuditCampus('all');
    }
  }, [activeCampusId]);

  const payments = IMSStateService.getPayments(auditCampus);
  const expenses = IMSStateService.getExpenses(auditCampus);
  const salaries = IMSStateService.getSalaryRecords(undefined, auditCampus);

  // GBP and PKR separated metrics
  const ukCollected = payments.filter((p) => p.currency === 'GBP').reduce((acc, p) => acc + p.amountPaid, 0);
  const ukExpenses = expenses.filter((e) => e.currency === 'GBP').reduce((acc, e) => acc + e.amount, 0);
  const ukSalaries = salaries.filter((s) => s.currency === 'GBP').reduce((acc, s) => acc + s.netSalary, 0);
  const ukNet = ukCollected - (ukExpenses + ukSalaries);

  const ktsCollected = payments.filter((p) => p.currency === 'PKR').reduce((acc, p) => acc + p.amountPaid, 0);
  const ktsExpenses = expenses.filter((e) => e.currency === 'PKR').reduce((acc, e) => acc + e.amount, 0);
  const ktsSalaries = salaries.filter((s) => s.currency === 'PKR').reduce((acc, s) => acc + s.netSalary, 0);
  const ktsNet = ktsCollected - (ktsExpenses + ktsSalaries);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-[#0D381E] text-[#E5C158] text-[11px] font-semibold tracking-wider uppercase">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Central Treasury & Audit Engine</span>
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-2">
            Institutional Financial Audit & Reconciliation
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Strict multi-currency reconciliation distinguishing UK Campus (£ GBP) and KTS Pakistan (Rs PKR).
          </p>
        </div>

        {/* Audit Cadence Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F9F8F4] p-1 rounded-md border border-[#E6E2D8]">
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setAuditMode(mode)}
              className={`px-3 py-1.5 rounded text-xs font-semibold capitalize cursor-pointer transition-colors ${
                auditMode === mode ? 'bg-[#0D381E] text-white shadow-xs' : 'text-[#57655B]'
              }`}
            >
              {mode} Audit
            </button>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg border border-[#E6E2D8] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-[#1A231E]">Audit Scope:</span>
          <select
            value={auditCampus}
            onChange={(e) => setAuditCampus(e.target.value as any)}
            className="p-1.5 rounded border border-[#E6E2D8] bg-[#F9F8F4] text-[#0D381E] font-medium"
          >
            <option value="all">Consolidated (UK & KTS)</option>
            <option value="uk">UK Campus Only (GBP £)</option>
            <option value="kts">KTS Pakistan Only (PKR Rs)</option>
          </select>
        </div>

        {auditMode === 'daily' && (
          <div className="flex items-center space-x-2">
            <span className="text-[#57655B]">Audit Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-1.5 rounded border border-[#E6E2D8] font-mono text-xs bg-white text-[#0D381E]"
            />
          </div>
        )}
      </div>

      {/* MULTI-CURRENCY COMPARATIVE LEDGER BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UK CAMPUS AUDIT */}
        {(auditCampus === 'all' || auditCampus === 'uk') && (
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#57655B]">Branch: UK-01</span>
                <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
                  UK Campus Financial Position
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#0D381E] text-[#E5C158] font-mono font-bold text-xs">
                CURRENCY: GBP (£)
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/50">
                <span className="text-[#57655B]">Total Tuition Collected:</span>
                <span className="font-mono font-bold text-emerald-800">{formatCampusCurrency(ukCollected, 'GBP')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/50">
                <span className="text-[#57655B]">Operating Facility Expenses:</span>
                <span className="font-mono text-rose-700">-{formatCampusCurrency(ukExpenses, 'GBP')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/50">
                <span className="text-[#57655B]">Faculty Salaries Disbursed:</span>
                <span className="font-mono text-rose-700">-{formatCampusCurrency(ukSalaries, 'GBP')}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-sm bg-[#F9F8F4] px-3 rounded mt-2">
                <span className="text-[#0D381E]">Net Operating Balance:</span>
                <span className="font-mono text-emerald-800">
                  {ukNet >= 0 ? `+${formatCampusCurrency(ukNet, 'GBP')}` : `-${formatCampusCurrency(Math.abs(ukNet), 'GBP')}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* KTS PAKISTAN AUDIT */}
        {(auditCampus === 'all' || auditCampus === 'kts') && (
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#57655B]">Branch: KTS-01</span>
                <h3 className="font-heading font-semibold text-lg text-[#0D381E]">
                  KTS Pakistan Financial Position
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#0D381E] text-[#E5C158] font-mono font-bold text-xs">
                CURRENCY: PKR (Rs.)
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/50">
                <span className="text-[#57655B]">Total Tuition Collected:</span>
                <span className="font-mono font-bold text-emerald-800">{formatCampusCurrency(ktsCollected, 'PKR')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/50">
                <span className="text-[#57655B]">Operating Facility Expenses:</span>
                <span className="font-mono text-rose-700">-{formatCampusCurrency(ktsExpenses, 'PKR')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E2D8]/50">
                <span className="text-[#57655B]">Faculty Salaries Disbursed:</span>
                <span className="font-mono text-rose-700">-{formatCampusCurrency(ktsSalaries, 'PKR')}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-sm bg-[#F9F8F4] px-3 rounded mt-2">
                <span className="text-[#0D381E]">Net Operating Balance:</span>
                <span className="font-mono text-emerald-800">
                  {ktsNet >= 0 ? `+${formatCampusCurrency(ktsNet, 'PKR')}` : `-${formatCampusCurrency(Math.abs(ktsNet), 'PKR')}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DAILY / MONTHLY TRANSACTION ITEMIZATION */}
      <div className="bg-white rounded-lg border border-[#E6E2D8] p-5 shadow-xs space-y-3">
        <h4 className="font-heading font-semibold text-base text-[#0D381E]">
          {auditMode === 'daily' ? `Audit Transactions for ${selectedDate}` : 'Audit Ledger Itemization'}
        </h4>

        <div className="divide-y divide-[#E6E2D8] text-xs">
          {payments.map((p) => (
            <div key={p.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-800">[INCOME]</span>
                <span className="font-mono ml-2 font-medium text-[#0D381E]">{p.invoiceNumber}</span>
                <span className="text-[#57655B] ml-2">from {p.studentName} ({p.title})</span>
              </div>
              <span className="font-mono font-bold text-emerald-800">
                +{formatCampusCurrency(p.amountPaid, p.currency || (p.campusId === 'kts' ? 'PKR' : 'GBP'))}
              </span>
            </div>
          ))}

          {expenses.map((e) => (
            <div key={e.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-rose-700">[EXPENSE]</span>
                <span className="font-mono ml-2 font-medium text-[#0D381E]">{e.receiptNumber || 'REC'}</span>
                <span className="text-[#57655B] ml-2">{e.title}</span>
              </div>
              <span className="font-mono font-bold text-rose-700">
                -{formatCampusCurrency(e.amount, e.currency || (e.campusId === 'kts' ? 'PKR' : 'GBP'))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
