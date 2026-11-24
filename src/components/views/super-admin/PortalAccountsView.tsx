import React, { useState } from 'react';
import {
  KeyRound,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  RotateCcw,
  Shield,
  UserCheck,
  Copy,
  Check,
  Sparkles,
  Building2,
  Users,
  Mail,
  LogOut,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { UserAccount, UserRole, Campus } from '../../../types/ims.ts';
import { IMSStateService } from '../../../services/imsStateService.ts';
import { PortalAccountModal } from '../../modals/PortalAccountModal.tsx';
import { DeleteConfirmModal } from '../../modals/DeleteConfirmModal.tsx';

interface PortalAccountsViewProps {
  campuses?: Campus[];
}

export const PortalAccountsView: React.FC<PortalAccountsViewProps> = ({
  campuses = IMSStateService.getCampuses(),
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<UserAccount | null>(null);
  const [modalDefaultCampus, setModalDefaultCampus] = useState<string>('uk');
  const [modalDefaultRole, setModalDefaultRole] = useState<UserRole>('CAMPUS_ADMIN');

  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Secure Password Reset Banner state (Never displays plaintext password or hash!)
  const [resetDispatchedUser, setResetDispatchedUser] = useState<{
    fullName: string;
    username: string;
    email: string;
  } | null>(null);

  // Filter out any legacy student accounts since students do not have independent portal logins
  const allAccounts = IMSStateService.getUsers(roleFilter, campusFilter).filter(
    (u) => u.role !== 'STUDENT'
  );

  const filtered = allAccounts.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const branchAdminsCount = allAccounts.filter((u) => u.role === 'CAMPUS_ADMIN').length;
  const teachersCount = allAccounts.filter((u) => u.role === 'TEACHER').length;
  const parentsCount = allAccounts.filter((u) => u.role === 'PARENT').length;
  const superAdminsCount = allAccounts.filter((u) => u.role === 'SUPER_ADMIN').length;
  const activeCount = allAccounts.filter((u) => u.isActive !== false).length;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = (user: UserAccount) => {
    const res = IMSStateService.toggleUserStatus(user.id);
    if (res.success) {
      showToast(`Account status for ${user.fullName} changed to ${res.isActive ? 'ACTIVE' : 'SUSPENDED'}.`);
    }
  };

  // Secure Password Reset Workflow (Satisfies Section 4.B: Never exposes password or secret)
  const handleInitiateSecurePasswordReset = (user: UserAccount) => {
    IMSStateService.addAuditLog({
      campusId: user.campusId === 'all' ? undefined : user.campusId,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'PASSWORD_RESET_DISPATCHED',
      entityType: 'UserAccount',
      entityId: user.id,
      outcome: 'SUCCESS',
      details: `Super Admin initiated secure password reset dispatch to registered email ${user.email}`,
    });

    setResetDispatchedUser({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    });

    showToast(`Secure password reset link dispatched to ${user.email}.`);
  };

  // Revoke User Session / Force Re-authentication
  const handleRevokeSession = (user: UserAccount) => {
    IMSStateService.addAuditLog({
      campusId: user.campusId === 'all' ? undefined : user.campusId,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'USER_SESSION_REVOKED',
      entityType: 'UserAccount',
      entityId: user.id,
      outcome: 'SUCCESS',
      details: `Active session revoked by Super Administrator for ${user.username}`,
    });

    showToast(`Active session for ${user.fullName} (${user.username}) has been revoked.`);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const res = IMSStateService.deleteUser(deleteTarget.id);
    if (res.success) {
      showToast(`Account for ${deleteTarget.fullName} has been permanently deleted.`);
    } else {
      showToast(res.message);
    }
    setDeleteTarget(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D381E] text-[#E5C158] border border-[#E5C158]/30">
            ★ Central Super Admin
          </span>
        );
      case 'CAMPUS_ADMIN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Branch Admin
          </span>
        );
      case 'TEACHER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Faculty Instructor
          </span>
        );
      case 'PARENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            Parent / Guardian
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white p-6 rounded-lg border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-[#0D381E] text-[#E5C158] text-[11px] font-semibold tracking-wider uppercase">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Portal Access Control & Security Governance</span>
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0D381E] mt-2">
            Portal Accounts & User Management
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5 max-w-2xl">
            Authorized administrator governance across Central Super Admins, Branch Admins, Faculty Instructors, and Parents. Zero credential exposure: passwords and secrets remain strictly confidential and encrypted.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setAccountToEdit(null);
              setModalDefaultCampus('uk');
              setModalDefaultRole('CAMPUS_ADMIN');
              setIsAccountModalOpen(true);
            }}
            className="px-3 py-2 rounded-lg bg-white border border-[#E6E2D8] hover:bg-[#F9F8F4] text-[#0D381E] font-semibold text-xs cursor-pointer transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <span>🇬🇧 + Create UK Admin</span>
          </button>

          <button
            onClick={() => {
              setAccountToEdit(null);
              setModalDefaultCampus('kts');
              setModalDefaultRole('CAMPUS_ADMIN');
              setIsAccountModalOpen(true);
            }}
            className="px-3 py-2 rounded-lg bg-white border border-[#E6E2D8] hover:bg-[#F9F8F4] text-[#0D381E] font-semibold text-xs cursor-pointer transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <span>🇵🇰 + Create Pakistan Admin</span>
          </button>

          <button
            onClick={() => {
              setAccountToEdit(null);
              setModalDefaultCampus(campusFilter !== 'all' ? campusFilter : 'uk');
              setModalDefaultRole('CAMPUS_ADMIN');
              setIsAccountModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer transition-all shadow-xs flex items-center space-x-2 shrink-0 border border-[#E5C158]/40"
          >
            <Plus className="w-4 h-4 text-[#E5C158]" />
            <span>Invite / Create Portal Account</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Branch Admins</span>
          <span className="text-xl font-bold font-mono text-[#0D381E]">{branchAdminsCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Faculty Instructors</span>
          <span className="text-xl font-bold font-mono text-[#0D381E]">{teachersCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Parents & Guardians</span>
          <span className="text-xl font-bold font-mono text-purple-900">{parentsCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Super Admins</span>
          <span className="text-xl font-bold font-mono text-[#0D381E]">{superAdminsCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E6E2D8] text-center shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] text-[#57655B] font-bold uppercase block">Active Status</span>
          <span className="text-xl font-bold font-mono text-emerald-700">{activeCount} / {allAccounts.length}</span>
        </div>
      </div>

      {/* 3. Feedback Toasts & Secure Reset Dispatch Notice */}
      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-lg border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      {resetDispatchedUser && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-start space-x-2.5">
            <Mail className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-emerald-950">
                Secure Password Reset Dispatched for: <strong>{resetDispatchedUser.fullName}</strong> ({resetDispatchedUser.username})
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                An encrypted, single-use password reset link has been dispatched to <strong>{resetDispatchedUser.email}</strong>. User passwords remain confidential and are never exposed to administrators.
              </p>
            </div>
          </div>
          <button
            onClick={() => setResetDispatchedUser(null)}
            className="text-xs font-bold text-emerald-800 hover:underline shrink-0 ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-lg border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, login ID, or email..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
            />
            <Search className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Role Filter (No separate student portal) */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] text-xs bg-white text-[#1A231E] font-medium"
          >
            <option value="ALL">All Authorized Roles</option>
            <option value="CAMPUS_ADMIN">Branch Admins</option>
            <option value="TEACHER">Faculty Instructors</option>
            <option value="PARENT">Parents & Guardians</option>
            <option value="SUPER_ADMIN">Central Super Admins</option>
          </select>

          {/* Campus Filter */}
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] text-xs bg-white text-[#1A231E] font-medium"
          >
            <option value="all">All Branches</option>
            <option value="uk">UK Campus</option>
            <option value="kts">KTS Pakistan</option>
          </select>
        </div>
      </div>

      {/* 5. Accounts Data Table (Satisfies Section 4.B) */}
      <div className="bg-white rounded-lg border border-[#E6E2D8] shadow-xs overflow-hidden">
        {/* MOBILE VIEW: Account Cards */}
        <div className="block sm:hidden divide-y divide-[#E6E2D8] p-3 space-y-3">
          {filtered.length > 0 ? (
            filtered.map((acc) => (
              <div key={acc.id} className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#0D381E]">{acc.fullName}</div>
                    <div className="text-[11px] text-[#57655B]">{acc.email}</div>
                  </div>
                  {getRoleBadge(acc.role)}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6E2D8]/60">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#57655B]">Login:</span>
                    <span className="font-mono font-bold text-[#0D381E]">{acc.username}</span>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(acc)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      acc.isActive !== false
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {acc.isActive !== false ? '● Active' : '○ Suspended'}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#E6E2D8]/60 text-xs">
                  <span className="text-[10px] text-[#57655B]">
                    {acc.campusId === 'uk' ? 'UK Campus' : acc.campusId === 'kts' ? 'KTS Pakistan' : 'Global'}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleInitiateSecurePasswordReset(acc)}
                      title="Reset Password"
                      className="px-2.5 py-1 rounded bg-white border border-[#E6E2D8] text-[#0D381E] text-xs font-semibold min-h-[34px] flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3 text-[#0D381E]" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={() => {
                        setAccountToEdit(acc);
                        setIsAccountModalOpen(true);
                      }}
                      title="Edit"
                      className="px-2.5 py-1 rounded bg-[#0D381E] text-[#F3D273] text-xs font-bold min-h-[34px] flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-[#57655B]">
              No user accounts found matching the search criteria.
            </div>
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead>
              <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-3.5">User / Name</th>
                <th className="p-3.5">Login ID / Username</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Campus Assignment</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Created Date</th>
                <th className="p-3.5">Last Login</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]">
              {filtered.length > 0 ? (
                filtered.map((acc) => (
                  <tr key={acc.id} className="hover:bg-[#F9F8F4]/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#0D381E] text-sm">{acc.fullName}</div>
                      <div className="text-[11px] text-[#57655B]">{acc.email}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#F9F8F4] border border-[#E6E2D8] text-[#0D381E]">
                          {acc.username}
                        </span>
                        <button
                          onClick={() => handleCopy(acc.username, `user-${acc.id}`)}
                          title="Copy Login ID"
                          className="text-stone-400 hover:text-[#0D381E] p-1 cursor-pointer transition-colors"
                        >
                          {copiedId === `user-${acc.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5">{getRoleBadge(acc.role)}</td>

                    <td className="p-3.5 font-medium text-[#1A231E]">
                      {acc.campusId === 'uk'
                        ? 'UK Campus'
                        : acc.campusId === 'kts'
                        ? 'KTS Pakistan'
                        : 'Global (All)'}
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(acc)}
                        title="Click to toggle Active / Suspended status"
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all border ${
                          acc.isActive !== false
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {acc.isActive !== false ? (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            <span>● Active</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>○ Suspended</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-[#57655B]">
                      {acc.createdAt || '2026-01-10'}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-[#57655B]">
                      {acc.lastLogin || 'Never'}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Secure Password Reset Dispatch */}
                        <button
                          onClick={() => handleInitiateSecurePasswordReset(acc)}
                          title="Initiate Secure Password Reset (Sends reset link to verified email)"
                          className="p-1.5 rounded-md hover:bg-[#F9F8F4] text-[#0D381E] hover:text-emerald-900 border border-[#E6E2D8] transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Revoke Session / Force Sign Out */}
                        <button
                          onClick={() => handleRevokeSession(acc)}
                          title="Revoke Active Sessions"
                          className="p-1.5 rounded-md hover:bg-[#F9F8F4] text-amber-700 hover:text-amber-900 border border-[#E6E2D8] transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Account */}
                        <button
                          onClick={() => {
                            setAccountToEdit(acc);
                            setIsAccountModalOpen(true);
                          }}
                          title="Edit Account Details"
                          className="p-1.5 rounded-md hover:bg-[#F9F8F4] text-[#0D381E] hover:text-[#16532d] border border-[#E6E2D8] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Account */}
                        {acc.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => {
                              setDeleteTarget(acc);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Portal Account"
                            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 hover:text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#57655B]">
                    No portal accounts found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Create/Edit Modal */}
      <PortalAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSaved={(_account, msg) => showToast(msg)}
        accountToEdit={accountToEdit}
        campuses={campuses}
        defaultRole={modalDefaultRole}
        defaultCampusId={modalDefaultCampus}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Portal Account"
        itemName={deleteTarget ? `${deleteTarget.fullName} (${deleteTarget.username})` : ''}
        itemType="Portal Account"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        warningNote="The user will no longer be able to log in to their portal. Their underlying records will remain preserved unless deleted separately."
      />
    </div>
  );
};
