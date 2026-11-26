import React, { useState, useEffect } from 'react';
import { X, KeyRound, Sparkles, Shield, User, Mail, Building2, Lock, RefreshCw } from 'lucide-react';
import { Campus, UserAccount, UserRole } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';

interface PortalAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (account: UserAccount, message: string) => void;
  accountToEdit?: UserAccount | null;
  campuses: Campus[];
  defaultRole?: UserRole;
  defaultCampusId?: string;
}

export const PortalAccountModal: React.FC<PortalAccountModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  accountToEdit,
  campuses,
  defaultRole = 'CAMPUS_ADMIN',
  defaultCampusId = 'uk',
}) => {
  const isEditing = Boolean(accountToEdit);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [campusId, setCampusId] = useState(defaultCampusId);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Misbah';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    res += '!';
    setPassword(res);
  };

  useEffect(() => {
    if (accountToEdit) {
      setFullName(accountToEdit.fullName || '');
      setUsername(accountToEdit.username || '');
      setEmail(accountToEdit.email || '');
      setPassword(''); // Never expose existing password to Super Admin!
      setRole(accountToEdit.role || 'CAMPUS_ADMIN');
      setCampusId(accountToEdit.campusId || 'uk');
      setIsActive(accountToEdit.isActive !== false);
    } else {
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('Misbah2026!');
      setRole(defaultRole === 'STUDENT' ? 'CAMPUS_ADMIN' : defaultRole);
      setCampusId(defaultCampusId === 'all' ? 'uk' : defaultCampusId);
      setIsActive(true);
    }
    setError('');
  }, [accountToEdit, defaultRole, defaultCampusId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!username.trim()) {
      setError('Username / Login ID is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (isEditing && accountToEdit) {
      const res = await IMSStateService.updateUser(accountToEdit.id, {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        role,
        campusId,
        isActive,
        password: password.trim() || undefined,
      });

      if (res.success) {
        const updated = IMSStateService.getUserById(accountToEdit.id)!;
        onSaved(updated, `Portal account for ${fullName} updated successfully.`);
        onClose();
      } else {
        setError(res.message);
      }
    } else {
      const res = await IMSStateService.createUser({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        role,
        campusId,
        isActive,
        password: password.trim() || 'Misbah2026!',
      });

      if (res.success && res.user) {
        onSaved(res.user, `New portal login created for ${fullName} with username ${res.user.username}.`);
        onClose();
      } else {
        setError(res.message);
      }
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'CAMPUS_ADMIN':
        return 'Branch Administrator: Can manage branch students, teachers, roll-calls, fee receipts, and incidents for this campus.';
      case 'TEACHER':
        return 'Teacher / Qari: Can view assigned halaqahs, mark attendance roll calls, and log student Quran Sabaq & Manzil.';
      case 'STUDENT':
        return 'Student: Can view personal Quran progress, attendance records, exam results, and madrasa notices.';
      case 'PARENT':
        return 'Parent / Guardian: Can monitor children\'s attendance, Quran memorization, and fee invoices.';
      case 'SUPER_ADMIN':
        return 'Super Administrator: Full global governance over all campuses, users, and audit records.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-lg w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#E5C158] flex items-center justify-center text-[#0D381E] font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                {isEditing ? 'Edit Portal Account' : 'Create Portal Login Account'}
              </h3>
              <p className="text-xs text-[#E6E2D8]/80">
                {isEditing ? 'Update login credentials, branch assignment, and access role' : 'Grant authenticated portal access to branch staff, teachers, or students'}
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

          {/* Role & Campus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#1A231E] mb-1">
                Account Role <span className="text-rose-600">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setRole(newRole);
                  if (newRole === 'SUPER_ADMIN') setCampusId('all');
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4] font-semibold text-[#0D381E]"
              >
                <option value="CAMPUS_ADMIN">Branch Administrator</option>
                <option value="TEACHER">Faculty Instructor / Qari</option>
                <option value="PARENT">Parent / Guardian</option>
                <option value="SUPER_ADMIN">Central Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#1A231E] mb-1">
                Assigned Campus / Branch <span className="text-rose-600">*</span>
              </label>
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                disabled={role === 'SUPER_ADMIN'}
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4] disabled:opacity-60"
              >
                {role === 'SUPER_ADMIN' ? (
                  <option value="all">Global (All Campuses)</option>
                ) : (
                  <>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Role Explainer Card for Non-Tech Admin */}
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] text-[#0D381E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold">Role Access: </span>
              <span>{getRoleDescription()}</span>
            </div>
            {!isEditing && role === 'CAMPUS_ADMIN' && (
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCampusId('uk');
                    setFullName('UK Branch Administrator');
                    setUsername('admin.uk');
                    setEmail('admin.uk@misbah.org');
                  }}
                  className="px-2 py-0.5 rounded bg-white border border-[#E6E2D8] hover:bg-[#F9F8F4] text-[10px] font-bold text-[#0D381E] cursor-pointer"
                >
                  🇬🇧 UK Admin Template
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCampusId('kts');
                    setFullName('KTS Pakistan Branch Administrator');
                    setUsername('admin.kts');
                    setEmail('admin.kts@misbah.org');
                  }}
                  className="px-2 py-0.5 rounded bg-white border border-[#E6E2D8] hover:bg-[#F9F8F4] text-[10px] font-bold text-[#0D381E] cursor-pointer"
                >
                  🇵🇰 Pakistan Admin Template
                </button>
              </div>
            )}
          </div>

          {/* User Identity */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block font-medium text-[#1A231E] mb-1">
                User Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ustadh Tariq Mahmood"
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#1A231E] mb-1">
                  Login ID / Username <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'STUDENT' ? 'e.g. MUQ-UK-2026-0001' : 'e.g. admin.uk'}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs font-mono font-bold focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tariq@misbah.org"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-[#1A231E]">
                  {isEditing ? 'Reset Password (Optional)' : 'Initial Temporary Password'} {!isEditing && <span className="text-rose-600">*</span>}
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] text-[#0D381E] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Secure Temporary Password</span>
                </button>
              </div>
              <input
                type="text"
                required={!isEditing}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Leave blank to preserve user\'s existing confidential password' : 'Enter temporary password or click generate'}
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs font-mono font-bold text-[#0D381E] focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
              />
              {isEditing && (
                <p className="text-[10px] text-[#57655B] mt-1">
                  🔒 Confidential credentials: administrators cannot view users' stored passwords. Enter a new value only if the user explicitly requested a manual override.
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium text-[#1A231E] mb-1">Account Login Status</label>
              <select
                value={isActive ? 'ACTIVE' : 'SUSPENDED'}
                onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
              >
                <option value="ACTIVE">● Active (User Can Log In)</option>
                <option value="SUSPENDED">○ Suspended (Login Temporarily Blocked)</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E6E2D8] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-[#57655B] hover:bg-[#F9F8F4] text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>{isEditing ? 'Save Account Changes' : 'Create Portal Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
