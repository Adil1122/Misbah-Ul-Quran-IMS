import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { UserSession } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession;
  onProfileUpdated?: (message: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [username, setUsername] = useState(user.username || '');

  // Password fields
  const [changePasswordEnabled, setChangePasswordEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setUsername(user.username || '');
      setChangePasswordEnabled(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Misbah';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    res += '!';
    setNewPassword(res);
    setConfirmPassword(res);
    setShowNewPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!username.trim()) {
      setError('Username / Login ID is required.');
      return;
    }

    if (changePasswordEnabled) {
      if (!currentPassword) {
        setError('Please enter your current password to authorize changing your password.');
        return;
      }
      if (!newPassword || newPassword.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match.');
        return;
      }
    }

    setIsLoading(true);
    {
      const res = await IMSStateService.updateCurrentProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        currentPassword: changePasswordEnabled ? currentPassword : undefined,
        newPassword: changePasswordEnabled ? newPassword : undefined,
      });

      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(res.message);
        if (onProfileUpdated) onProfileUpdated(res.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-lg w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#E5C158] flex items-center justify-center text-[#0D381E] font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                Edit Profile & Password
              </h3>
              <p className="text-xs text-[#E6E2D8]/80">
                Manage your administrator profile details and login password
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Account Role Badge */}
          <div className="p-3 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#57655B] uppercase font-bold block">Assigned Role</span>
              <span className="text-xs font-bold text-[#0D381E]">{user.role}</span>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#0D381E] text-[#E5C158] font-bold text-[10px] tracking-wider uppercase">
              Authenticated
            </span>
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-medium text-[#1A231E] mb-1">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Shaykh Dr. Muhammad Ibrahim"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
              />
              <User className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Email Address & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#1A231E] mb-1">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. superadmin@misbah.org"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                />
                <Mail className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#1A231E] mb-1">
                Login ID / Username <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. superadmin"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E6E2D8] text-xs font-mono font-bold focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                />
                <KeyRound className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Password Change Toggle */}
          <div className="pt-3 border-t border-[#E6E2D8]">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-[#0D381E]">
                <input
                  type="checkbox"
                  checked={changePasswordEnabled}
                  onChange={(e) => setChangePasswordEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#0D381E] rounded accent-[#0D381E]"
                />
                <span>Change Account Password</span>
              </label>
              {changePasswordEnabled && (
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-[#0D381E] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Password</span>
                </button>
              )}
            </div>

            {changePasswordEnabled && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3 animate-in fade-in">
                {/* Current Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#1A231E]">
                      Current Password <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] text-[#57655B] font-mono">
                      (Default: admin123)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required={changePasswordEnabled}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your existing password (e.g. admin123)"
                      className="w-full pl-8 pr-9 py-2 rounded-lg border border-amber-300 text-xs font-mono focus:outline-none focus:border-[#0D381E] bg-white"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-2.5 text-[#57655B] hover:text-[#0D381E]"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#1A231E] mb-1">
                      New Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required={changePasswordEnabled}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 chars"
                        className="w-full pl-8 pr-9 py-2 rounded-lg border border-amber-300 text-xs font-mono font-bold text-[#0D381E] focus:outline-none focus:border-[#0D381E] bg-white"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2.5 text-[#57655B] hover:text-[#0D381E]"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-[#1A231E] mb-1">
                      Confirm New Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required={changePasswordEnabled}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-amber-300 text-xs font-mono font-bold text-[#0D381E] focus:outline-none focus:border-[#0D381E] bg-white"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E6E2D8] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-[#57655B] hover:bg-[#F9F8F4] text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer transition-colors shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>{isLoading ? 'Saving Changes...' : 'Save Profile & Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
