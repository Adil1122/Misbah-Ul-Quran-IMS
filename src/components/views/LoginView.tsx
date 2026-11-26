import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles, ArrowRight, Check } from 'lucide-react';
import { IMSStateService } from '../../services/imsStateService.ts';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your identifier (email or username) and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await IMSStateService.login(identifier, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F9F8F4] text-[#1A231E]">
      {/* Left 45% Panel: Forest Green Islamic Branding */}
      <div className="md:w-[45%] bg-[#0D381E] text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden bg-islamic-pattern">
        {/* Subtle decorative arch silhouette */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border-8 border-[#E5C158]/10 pointer-events-none"></div>

        {/* Top Branding */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[#E5C158] flex items-center justify-center text-[#0D381E] font-display font-bold text-xl shadow-md">
              MQ
            </div>
            <div>
              <h1 className="font-heading font-semibold text-2xl text-[#F3D273] tracking-wide leading-tight">
                Misbah-ul-Quran
              </h1>
              <p className="text-xs uppercase tracking-widest text-[#E6E2D8]/70 font-medium">
                Institute Management System
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-4 max-w-md">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#16532d]/80 text-[#E5C158] text-xs font-medium border border-[#E5C158]/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Campus Institutional Portal</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-normal text-white leading-snug">
              Nurturing hearts with the light of the Noble Quran.
            </h2>
            <p className="text-sm text-[#E6E2D8]/80 leading-relaxed font-light">
              A unified platform governing academic records, Quranic memorization, faculty roll-calls, and student lifecycles across UK Campus (London) and KTS Pakistan Campus (Haripur).
            </p>
          </div>
        </div>

        {/* Institutional Campus Badges */}
        <div className="pt-8 border-t border-[#16532d]/50 mt-12">
          <p className="text-[11px] uppercase tracking-wider text-[#E5C158] font-medium mb-3">
            Active Operating Branches
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-[#072212]/60 border border-white/10">
              <span className="font-semibold text-white block">UK Campus</span>
              <span className="text-[11px] text-white/60">London · Europe/London (£)</span>
            </div>
            <div className="p-3 rounded bg-[#072212]/60 border border-white/10">
              <span className="font-semibold text-white block">KTS Pakistan Campus</span>
              <span className="text-[11px] text-white/60">Haripur, KPK · Asia/Karachi (Rs)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right 55% Panel: Centered Login Card */}
      <div className="md:w-[55%] flex items-center justify-center p-6 md:p-14 bg-[#F9F8F4]">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#E6E2D8] p-8 md:p-10">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#57655B]">
              Portal Authentication
            </span>
            <h3 className="font-heading font-semibold text-2xl text-[#0D381E] mt-1">
              Assalamu Alaikum
            </h3>
            <p className="text-xs text-[#57655B] mt-1">
              Enter your credentials to access your designated role portal.
            </p>
          </div>


          {errorMessage && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A231E] mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. your.email@misbah.org or username"
                  className="w-full pl-9 pr-3 py-2.5 rounded-md border border-[#E6E2D8] text-sm focus:outline-none focus:border-[#0D381E] focus:ring-1 focus:ring-[#0D381E] transition-all bg-[#FDFCFB]"
                />
                <Mail className="w-4 h-4 text-[#57655B] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#1A231E]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(true);
                    setForgotSubmitted(false);
                    setForgotEmail('');
                  }}
                  className="text-xs text-[#0D381E] hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-md border border-[#E6E2D8] text-sm focus:outline-none focus:border-[#0D381E] focus:ring-1 focus:ring-[#0D381E] transition-all bg-[#FDFCFB]"
                />
                <Lock className="w-4 h-4 text-[#57655B] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#57655B] hover:text-[#0D381E]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-[#57655B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E6E2D8] text-[#0D381E] focus:ring-0"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Warm Gold Primary CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md font-semibold text-sm bg-[#E5C158] hover:bg-[#F3D273] text-[#0D381E] shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Institutional Footer */}
          <div className="mt-8 pt-6 border-t border-[#E6E2D8] text-center text-xs text-[#57655B]">
            <p>Protected by Misbah-ul-Quran Multi-Campus Security & Role Governance.</p>
            <p className="text-[11px] text-[#57655B]/70 mt-1">For account provisioning or branch enrollment, contact your designated Campus Admin.</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6E2D8] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <h3 className="font-heading font-bold text-lg text-[#0D381E]">
                Password Recovery Assistance
              </h3>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="text-[#57655B] hover:text-[#0D381E] text-sm"
              >
                ✕
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Password Reset Instructions Sent</span>
                </div>
                <p>
                  If an authorized account matches <strong>{forgotEmail}</strong>, secure recovery instructions have been initiated. You may also contact your Campus Administrator or Head Office at <strong>admin@misbah.org</strong> for identity verification and administrative reset.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full mt-3 py-2 bg-[#0D381E] text-white rounded text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-[#57655B]">
                  Enter your registered institutional email address. Administrative recovery instructions will be initiated according to security policies.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-[#1A231E] mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@misbah.org"
                    className="w-full px-3 py-2 rounded-md border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E]"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-3 py-1.5 rounded text-xs font-medium text-[#57655B] hover:bg-[#F9F8F4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded text-xs font-semibold bg-[#0D381E] text-white hover:bg-[#16532d]"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
