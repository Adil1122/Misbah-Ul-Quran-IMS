import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User, Building2, CheckCircle2, AlertTriangle, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { IMSStateService } from '../../services/imsStateService.ts';

interface InitialSetupViewProps {
  onSetupSuccess: () => void;
}

export const InitialSetupView: React.FC<InitialSetupViewProps> = ({ onSetupSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [defaultCampusId, setDefaultCampusId] = useState<'all' | 'uk' | 'kts'>('all');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasNumberOrSpecial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter the Administrator Full Name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }

    if (!username.trim()) {
      setErrorMessage('Please enter a desired username.');
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage('Password must be at least 8 characters long and include uppercase, lowercase, and numbers or symbols.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = IMSStateService.provisionInitialSuperAdmin({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password,
        defaultCampusId,
      });

      setIsLoading(false);
      if (res.success) {
        onSetupSuccess();
      } else {
        setErrorMessage(res.message);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F9F8F4] text-[#1A231E]">
      {/* Left 45% Branding Panel */}
      <div className="md:w-[45%] bg-[#0D381E] text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden bg-islamic-pattern">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border-8 border-[#E5C158]/10 pointer-events-none"></div>

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

          <div className="mt-10 space-y-4 max-w-md">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#16532d]/80 text-[#E5C158] text-xs font-medium border border-[#E5C158]/25">
              <ShieldCheck className="w-4 h-4 text-[#E5C158]" />
              <span>One-Time System Provisioning</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-normal text-white leading-snug">
              Establish Your Founding Super Administrator Account
            </h2>
            <p className="text-sm text-[#E6E2D8]/80 leading-relaxed font-light">
              Welcome to the production initialization wizard. To protect institutional operations across UK (London) and KTS (Pakistan) branches, provision your initial master account.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-[#16532d]/50 mt-8 text-xs text-[#E6E2D8]/70">
          Misbah-ul-Quran International · Production Environment
        </div>
      </div>

      {/* Right 55% Panel: Provisioning Form */}
      <div className="md:w-[55%] flex items-center justify-center p-6 md:p-12 bg-[#F9F8F4] overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#E6E2D8] p-8">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#57655B]">
              Step 1 of 1 · First-Time Setup
            </span>
            <h3 className="font-heading font-semibold text-2xl text-[#0D381E] mt-1">
              Initialize Super Admin
            </h3>
            <p className="text-xs text-[#57655B] mt-1">
              Enter your official administrative credentials to create the founding account.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A231E] mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Director General Shaykh"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] focus:ring-1 focus:ring-[#0D381E] bg-[#FDFCFB]"
                />
                <User className="w-4 h-4 text-[#57655B] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A231E] mb-1">
                  Official Email <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@misbah.org"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] focus:ring-1 focus:ring-[#0D381E] bg-[#FDFCFB]"
                  />
                  <Mail className="w-4 h-4 text-[#57655B] absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A231E] mb-1">
                  Username <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superadmin"
                  className="w-full px-3 py-2 rounded-md border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] focus:ring-1 focus:ring-[#0D381E] bg-[#FDFCFB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A231E] mb-1">
                Default Primary Campus Context
              </label>
              <select
                value={defaultCampusId}
                onChange={(e) => setDefaultCampusId(e.target.value as any)}
                className="w-full px-3 py-2 rounded-md border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-white text-[#0D381E] font-medium"
              >
                <option value="all">All Campuses (Central UK & Pakistan Governance)</option>
                <option value="uk">UK Campus (London · GBP)</option>
                <option value="kts">KTS Pakistan Campus (Haripur · PKR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A231E] mb-1">
                Master Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password (min 8 chars)"
                  className="w-full pl-9 pr-10 py-2 rounded-md border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] focus:ring-1 focus:ring-[#0D381E] bg-[#FDFCFB]"
                />
                <Lock className="w-4 h-4 text-[#57655B] absolute left-2.5 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-[#57655B] hover:text-[#0D381E]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Checklist */}
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-[#57655B]">
                <span className={`flex items-center space-x-1 ${hasMinLength ? 'text-emerald-700 font-semibold' : ''}`}>
                  <span>{hasMinLength ? '✓' : '○'}</span>
                  <span>At least 8 chars</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasUpper ? 'text-emerald-700 font-semibold' : ''}`}>
                  <span>{hasUpper ? '✓' : '○'}</span>
                  <span>Uppercase letter</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasLower ? 'text-emerald-700 font-semibold' : ''}`}>
                  <span>{hasLower ? '✓' : '○'}</span>
                  <span>Lowercase letter</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasNumberOrSpecial ? 'text-emerald-700 font-semibold' : ''}`}>
                  <span>{hasNumberOrSpecial ? '✓' : '○'}</span>
                  <span>Number or symbol</span>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A231E] mb-1">
                Confirm Master Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] focus:ring-1 focus:ring-[#0D381E] bg-[#FDFCFB]"
                />
                <Lock className="w-4 h-4 text-[#57655B] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordStrong}
              className="w-full py-2.5 px-4 rounded-md font-semibold text-xs bg-[#E5C158] hover:bg-[#F3D273] text-[#0D381E] shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <span>Provisioning Administrator...</span>
              ) : (
                <>
                  <span>Initialize System & Launch IMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
