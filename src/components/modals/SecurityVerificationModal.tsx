import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, X, CheckCircle2, Lock, ArrowRight, Play } from 'lucide-react';
import { AuthGuardService } from '../../services/authGuardService.ts';

interface SecurityVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityVerificationModal: React.FC<SecurityVerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testResults, setTestResults] = useState(AuthGuardService.runSecurityVerificationTests());

  if (!isOpen) return null;

  const handleReRun = () => {
    setTestResults(AuthGuardService.runSecurityVerificationTests());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-[#E6E2D8] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#072212]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-[#E5C158] flex items-center justify-center text-[#0D381E]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#F3D273]">
                Backend Security & Campus Isolation Guard Suite
              </h3>
              <p className="text-xs text-white/70">
                NestJS 4-Tier Guard Pipeline Verification (Zero Trust)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F9F8F4]">
          {/* Supabase PostgreSQL & Migration Status */}
          <div className="bg-white p-4 rounded-md border border-[#E6E2D8] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-[#0D381E] uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Supabase PostgreSQL Migration Status</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                READY FOR HOSTINGER & SUPABASE
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-[#F4F3EE] border border-[#E6E2D8]">
                <span className="text-[10px] text-[#57655B] block">Source DB</span>
                <span className="font-semibold text-[#0D381E]">MySQL (24 Tables)</span>
              </div>
              <div className="p-2 rounded bg-[#F4F3EE] border border-[#E6E2D8]">
                <span className="text-[10px] text-[#57655B] block">Target DB</span>
                <span className="font-semibold text-[#0D381E]">PostgreSQL 15+</span>
              </div>
              <div className="p-2 rounded bg-[#F4F3EE] border border-[#E6E2D8]">
                <span className="text-[10px] text-[#57655B] block">Strict Time Rules</span>
                <span className="font-semibold text-[#0D381E]">5:00 / 5:30 PM Enforced</span>
              </div>
              <div className="p-2 rounded bg-[#F4F3EE] border border-[#E6E2D8]">
                <span className="text-[10px] text-[#57655B] block">RLS Policies</span>
                <span className="font-semibold text-[#0D381E]">UK vs KTS Scoped</span>
              </div>
            </div>
          </div>

          {/* Architecture Pipeline Banner */}
          <div className="bg-white p-4 rounded-md border border-[#E6E2D8] shadow-xs">
            <h4 className="text-xs font-semibold text-[#0D381E] uppercase tracking-wider mb-2">
              4-Tier NestJS Execution Order
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-[#F4F3EE] border border-[#E6E2D8]">
                <span className="font-mono text-[10px] text-[#57655B] block">Layer 1</span>
                <span className="font-semibold text-[#0D381E]">JwtAuthGuard</span>
              </div>
              <div className="p-2 rounded bg-[#F4F3EE] border border-[#E6E2D8]">
                <span className="font-mono text-[10px] text-[#57655B] block">Layer 2</span>
                <span className="font-semibold text-[#0D381E]">RolesGuard</span>
              </div>
              <div className="p-2 rounded bg-[#F4F3EE] border border-[#E6E2D8]">
                <span className="font-mono text-[10px] text-[#57655B] block">Layer 3</span>
                <span className="font-semibold text-[#0D381E]">CampusScopeGuard</span>
              </div>
              <div className="p-2 rounded bg-[#F4F3EE] border border-[#E6E2D8]">
                <span className="font-mono text-[10px] text-[#57655B] block">Layer 4</span>
                <span className="font-semibold text-[#0D381E]">OwnershipGuard</span>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#0D381E] uppercase tracking-wider">
                Automated Test Scenarios ({testResults.filter((t) => t.passed).length}/{testResults.length} Passing)
              </h4>
              <button
                onClick={handleReRun}
                className="inline-flex items-center space-x-1.5 text-xs text-[#0D381E] font-medium hover:text-[#E5C158]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Re-Execute Tests</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-md border border-[#E6E2D8] flex items-start space-x-3"
                >
                  <div className="mt-0.5">
                    {t.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[#1A231E]">{t.testName}</h5>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F4F3EE] text-[#0D381E] font-semibold border border-[#E6E2D8]">
                        Expected {t.expectedStatus} → Got {t.actualStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[#57655B] mt-0.5">{t.description}</p>
                    <p className="text-[11px] text-[#0D381E] mt-1.5 font-mono bg-[#F9F8F4] p-1.5 rounded border border-[#E6E2D8]/60 leading-relaxed">
                      {t.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E6E2D8] flex items-center justify-between">
          <p className="text-xs text-[#57655B]">
            All unauthorized mutations reject before reaching MySQL execution.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0D381E] text-white rounded text-xs font-semibold hover:bg-[#16532d] transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
