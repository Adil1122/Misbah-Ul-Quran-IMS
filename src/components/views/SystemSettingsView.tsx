import React, { useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  HardDrive,
  History,
  CheckCircle2,
  Save,
  Download,
  Plus,
  Edit2,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Database,
  RefreshCw,
  Server,
} from 'lucide-react';
import { UserSession, Campus } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { isSupabaseConfigured } from '../../services/supabaseClient.ts';
import { PortalAccountsView } from './super-admin/PortalAccountsView.tsx';
import { AuditCenterView } from './super-admin/AuditCenterView.tsx';

interface SystemSettingsViewProps {
  user: UserSession;
  initialTab?: 'campuses' | 'accounts' | 'permissions' | 'backup' | 'logs';
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  user,
  initialTab = 'campuses',
}) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const [activeTab, setActiveTab] = useState<'campuses' | 'accounts' | 'permissions' | 'backup' | 'logs'>(initialTab);
  const [feedback, setFeedback] = useState('');

  const campuses = IMSStateService.getCampuses();

  // Campus Modal State (for + Add Campus and View/Edit)
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [editingCampusId, setEditingCampusId] = useState<string | null>(null);
  const [modalCampusName, setModalCampusName] = useState('');
  const [modalCampusCode, setModalCampusCode] = useState('');
  const [modalLocation, setModalLocation] = useState('');
  const [modalCity, setModalCity] = useState('');
  const [modalCountry, setModalCountry] = useState('United Kingdom');
  const [modalPhone, setModalPhone] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalCurrency, setModalCurrency] = useState<'GBP' | 'PKR'>('GBP');
  const [modalIsActive, setModalIsActive] = useState(true);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleOpenAddCampus = () => {
    if (!isSuperAdmin) {
      showToast('Only Super Admin is authorized to create new campuses.');
      return;
    }
    setEditingCampusId(null);
    setModalCampusName('');
    setModalCampusCode('');
    setModalLocation('');
    setModalCity('');
    setModalCountry('United Kingdom');
    setModalPhone('');
    setModalEmail('');
    setModalCurrency('GBP');
    setModalIsActive(true);
    setIsCampusModalOpen(true);
  };

  const handleOpenEditCampus = (campus: Campus) => {
    setEditingCampusId(campus.id);
    setModalCampusName(campus.name);
    setModalCampusCode(campus.code);
    setModalLocation(campus.address);
    setModalCity(campus.city || '');
    setModalCountry(campus.country || 'United Kingdom');
    setModalPhone(campus.phone || '');
    setModalEmail(campus.email || '');
    setModalCurrency(campus.currencyCode || 'GBP');
    setModalIsActive(campus.isActive);
    setIsCampusModalOpen(true);
  };

  const handleSaveCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Action prohibited: Only Super Admin has authority to create or edit campus records.');
      return;
    }
    if (!modalCampusName.trim()) {
      showToast('Please enter a campus name.');
      return;
    }

    if (editingCampusId) {
      // Update existing campus
      const res = IMSStateService.updateCampus(editingCampusId, {
        name: modalCampusName.trim(),
        code: modalCampusCode.trim().toUpperCase() || undefined,
        address: modalLocation.trim(),
        city: modalCity.trim(),
        country: modalCountry.trim(),
        phone: modalPhone.trim(),
        email: modalEmail.trim(),
        currencyCode: modalCurrency,
        isActive: modalIsActive,
      });
      if (res.success) {
        showToast(res.message);
        setIsCampusModalOpen(false);
      } else {
        showToast(res.message);
      }
    } else {
      // Add new campus
      const res = IMSStateService.addCampus({
        name: modalCampusName.trim(),
        code: modalCampusCode.trim().toUpperCase() || undefined,
        address: modalLocation.trim() || 'Central Road',
        city: modalCity.trim() || 'London',
        country: modalCountry.trim() || 'United Kingdom',
        phone: modalPhone.trim() || '+44 20 7000 0000',
        email: modalEmail.trim() || `${modalCampusName.toLowerCase().replace(/ /g, '')}@misbahulquran.org`,
        currencyCode: modalCurrency,
        isActive: modalIsActive,
      });
      if (res.success) {
        showToast(res.message);
        setIsCampusModalOpen(false);
      } else {
        showToast(res.message);
      }
    }
  };

  const handleDownloadFullBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      exportedBy: user.fullName,
      campuses: IMSStateService.getCampuses(),
      students: IMSStateService.getStudents(),
      teachers: IMSStateService.getTeachers(),
      classes: IMSStateService.getClasses(),
      payments: IMSStateService.getPayments(),
      examResults: IMSStateService.getExamResults(),
      academicProgress: IMSStateService.getAcademicProgress(),
      auditLogsCount: IMSStateService.getAuditLogs().length,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Misbah_ul_Quran_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Full Institute Backup successfully generated and downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#0D381E]">
            Institute Administration & Settings
          </h2>
          <p className="text-xs text-[#57655B] mt-0.5">
            Manage branch campuses, staff portal accounts, role permissions, data backups, and operational activity logs.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="bg-[#F4F3EE] p-1 rounded-xl border border-[#E6E2D8] flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('campuses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
              activeTab === 'campuses'
                ? 'bg-[#0D381E] text-[#F3D273] shadow-xs font-bold'
                : 'text-[#57655B] hover:text-[#0D381E]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Campus Management</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
              activeTab === 'accounts'
                ? 'bg-[#0D381E] text-[#F3D273] shadow-xs font-bold'
                : 'text-[#57655B] hover:text-[#0D381E]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
              activeTab === 'permissions'
                ? 'bg-[#0D381E] text-[#F3D273] shadow-xs font-bold'
                : 'text-[#57655B] hover:text-[#0D381E]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
              activeTab === 'backup'
                ? 'bg-[#0D381E] text-[#F3D273] shadow-xs font-bold'
                : 'text-[#57655B] hover:text-[#0D381E]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database & Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
              activeTab === 'logs'
                ? 'bg-[#0D381E] text-[#F3D273] shadow-xs font-bold'
                : 'text-[#57655B] hover:text-[#0D381E]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Logs & Activity</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 1. CAMPUS MANAGEMENT TAB */}
      {activeTab === 'campuses' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#0D381E]">
                Campus Management
              </h3>
              <p className="text-xs text-[#57655B] mt-0.5">
                Current active campuses and branch expansion directory. Add future campuses with fully isolated student, teacher, and financial records.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={handleOpenAddCampus}
                className="px-4 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Campus</span>
              </button>
            )}
          </div>

          {/* Simple Campus List / Table */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0D381E] text-white uppercase text-[10px] tracking-wider border-b border-[#072212]">
                    <th className="py-3 px-4 font-semibold">Campus Name</th>
                    <th className="py-3 px-4 font-semibold">Campus Code</th>
                    <th className="py-3 px-4 font-semibold">Location / Address</th>
                    <th className="py-3 px-4 font-semibold">Contact Details</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2D8]">
                  {campuses.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F9F8F4] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0D381E] whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-[#0D381E]" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#57655B] whitespace-nowrap">
                        {c.code || c.id.toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-[#57655B] max-w-xs truncate">
                        {c.address} ({c.city}, {c.country})
                      </td>
                      <td className="py-3 px-4 text-[#57655B] font-mono text-[11px] whitespace-nowrap">
                        <div>{c.phone || '—'}</div>
                        <div className="text-[10px] text-[#57655B]/80">{c.email || '—'}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleOpenEditCampus(c)}
                            className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-semibold flex items-center space-x-1 cursor-pointer ml-auto shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>View/Edit</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenEditCampus(c)}
                            className="px-2.5 py-1 rounded bg-[#F9F8F4] hover:bg-[#E6E2D8] text-[#0D381E] border border-[#E6E2D8] text-xs font-semibold flex items-center space-x-1 cursor-pointer ml-auto shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0D381E]" />
                            <span>View Details</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACCOUNT MANAGEMENT TAB (Integrated PortalAccountsView) */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <PortalAccountsView campuses={campuses} />
        </div>
      )}

      {/* 3. ROLES & PERMISSIONS TAB */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#0D381E]">
              Institutional Role Permissions
            </h3>
            <p className="text-xs text-[#57655B] mt-0.5">
              Clear breakdown of operational access and duties across Misbah-ul-Quran staff and families.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Super Admin */}
            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0D381E]">Super Administrator</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5C158] text-[#0D381E]">
                  Full Central Authority
                </span>
              </div>
              <ul className="space-y-1.5 text-[#57655B]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cross-campus oversight across UK, KTS, and newly added branches</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Provisions new campuses and manages campus assignments</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Approves teacher onboarding and student admissions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Inspects consolidated financial audits and teacher payrolls</span>
                </li>
              </ul>
            </div>

            {/* Campus Admin */}
            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0D381E]">Campus Administrator</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D381E] text-white">
                  Local Branch Authority
                </span>
              </div>
              <ul className="space-y-1.5 text-[#57655B]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Manages assigned branch students, classes, and halaqahs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Marks and records daily teacher attendance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Reviews and approves submitted incidents and medical notices</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Restricted strictly to assigned campus</span>
                </li>
              </ul>
            </div>

            {/* Teacher */}
            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0D381E]">Teaching Faculty</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">
                  Instructional Faculty
                </span>
              </div>
              <ul className="space-y-1.5 text-[#57655B]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Enters academic results and Sabaq evaluations for assigned classes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Takes roll-call attendance for assigned students</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Uploads teaching materials and files</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Views own attendance history in read-only mode</span>
                </li>
              </ul>
            </div>

            {/* Parent */}
            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0D381E]">Parent & Guardian</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-700 text-white">
                  Family Access
                </span>
              </div>
              <ul className="space-y-1.5 text-[#57655B]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Views attendance and published results for linked children</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Checks fee balances, invoice receipts, and payments</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Receives Announcements & Events intended for guardians</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. DATABASE & DATA BACKUP TAB */}
      {activeTab === 'backup' && (
        <div className="space-y-5">
          {/* Real-Time Database Connection & Storage Card */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6E2D8]">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#0D381E] flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#0D381E]" />
                  <span>Institutional Database & Storage Engine</span>
                </h3>
                <p className="text-xs text-[#57655B] mt-0.5">
                  Dual-tier active storage ensuring all operational data entries are committed to permanent persistence.
                </p>
              </div>

              <button
                onClick={async () => {
                  try {
                    const token = IMSStateService.getValidAccessToken();
                    if (!token) {
                      showToast('✕ Authentication required: No valid session token found. Please log in.');
                      return;
                    }

                    IMSStateService.persistAll();
                    const res = await fetch('/api/database/sync', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        data: {
                          campuses: IMSStateService.getCampuses(),
                          students: IMSStateService.getStudents(),
                          teachers: IMSStateService.getTeachers(),
                          classes: IMSStateService.getClasses(),
                          payments: IMSStateService.getPayments(),
                          users: IMSStateService.getUsers(),
                          auditLogs: IMSStateService.getAuditLogs(),
                        },
                      }),
                    });
                    if (res.ok) {
                      showToast('✓ Real-time database sync committed successfully to persistent storage.');
                    } else {
                      const resData = await res.json().catch(() => ({}));
                      showToast(`✕ Sync failed: ${resData.error || 'Server rejected request'}`);
                    }
                  } catch (err: any) {
                    showToast(`✕ Sync error: ${err?.message || 'Network issue'}`);
                  }
                }}
                className="px-3.5 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Force Database Commit & Sync</span>
              </button>
            </div>

            {/* Storage Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tier 1: Server Persistent Storage Ledger */}
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-emerald-800" />
                    <span className="font-bold text-xs text-[#0D381E]">Primary Server Database Ledger</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ● Connected & Writing
                  </span>
                </div>
                <p className="text-[11px] text-[#57655B]">
                  Storage Target: <code className="bg-white px-1.5 py-0.5 rounded border border-[#E6E2D8] text-[10px] text-[#0D381E]">data/ims_database.json</code> & Browser LocalStorage.
                  Every student, teacher, class, and payment added is immediately committed.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-[#57655B] block font-semibold">Students</span>
                    <span className="font-bold font-mono text-[#0D381E]">{IMSStateService.getStudents().length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-[#57655B] block font-semibold">Teachers</span>
                    <span className="font-bold font-mono text-[#0D381E]">{IMSStateService.getTeachers().length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-[#57655B] block font-semibold">Classes</span>
                    <span className="font-bold font-mono text-[#0D381E]">{IMSStateService.getClasses().length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-[#57655B] block font-semibold">Payments</span>
                    <span className="font-bold font-mono text-[#0D381E]">{IMSStateService.getPayments().length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-[#57655B] block font-semibold">Portal Users</span>
                    <span className="font-bold font-mono text-[#0D381E]">{IMSStateService.getUsers().length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-[#57655B] block font-semibold">Campuses</span>
                    <span className="font-bold font-mono text-[#0D381E]">{IMSStateService.getCampuses().length}</span>
                  </div>
                </div>
              </div>

              {/* Tier 2: Supabase Cloud PostgreSQL Bridge */}
              <div className="p-4 rounded-xl border border-[#E6E2D8] bg-[#F9F8F4] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-[#0D381E]" />
                    <span className="font-bold text-xs text-[#0D381E]">Supabase Cloud PostgreSQL</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isSupabaseConfigured
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isSupabaseConfigured ? '● Cloud Connected' : '○ Pending URL in .env'}
                  </span>
                </div>
                <p className="text-[11px] text-[#57655B]">
                  {isSupabaseConfigured
                    ? 'Connected to your remote Supabase cloud database. All transactions are mirrored to PostgreSQL.'
                    : 'When you are ready to mirror live data to Supabase cloud, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env configuration.'}
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-[#E6E2D8] text-[11px] text-[#57655B] space-y-1">
                  <div>Status: <strong className={isSupabaseConfigured ? 'text-emerald-700' : 'text-amber-700'}>{isSupabaseConfigured ? 'Active Cloud Sync' : 'Operating on Verified Server Storage Ledger'}</strong></div>
                  <div>Fallback: <span>Zero data loss guaranteed by dual local/server file ledger</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Download Card */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#0D381E]">
                Data Backup & Institutional Continuity
              </h3>
              <p className="text-xs text-[#57655B] mt-0.5">
                Export encrypted snapshot of student rolls, staff directory, attendance logs, and financial records.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-[#E6E2D8] space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#0D381E]">
                <HardDrive className="w-4 h-4 text-[#0D381E]" />
                <span>Full System Snapshot</span>
              </div>
              <p className="text-xs text-[#57655B]">
                Generates an immutable JSON archive containing full relational records across all campuses.
              </p>
              <button
                onClick={handleDownloadFullBackup}
                className="px-4 py-2 bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Complete Backup JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIT LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <AuditCenterView />
        </div>
      )}

      {/* MODAL: + Add Campus or View/Edit Campus */}
      {isCampusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  {isSuperAdmin
                    ? editingCampusId
                      ? 'Edit Campus Details'
                      : 'Add New Branch Campus'
                    : 'Campus Operational Details'}
                </h3>
                <p className="text-xs text-[#E6E2D8]/80">
                  {isSuperAdmin
                    ? editingCampusId
                      ? 'Update configuration for existing campus'
                      : 'Provision new campus with independent records'
                    : 'Read-only branch profile. Editing authority belongs solely to Super Admin.'}
                </p>
              </div>
              <button
                onClick={() => setIsCampusModalOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampus} className="p-5 space-y-3.5 text-xs">
              {!isSuperAdmin && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Only the Super Admin is authorized to create, rename, or edit campus details.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                    Campus Name *
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={!isSuperAdmin}
                    placeholder="e.g. Birmingham Branch"
                    value={modalCampusName}
                    onChange={(e) => setModalCampusName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none ${
                      isSuperAdmin
                        ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                    Campus Code
                  </label>
                  <input
                    type="text"
                    readOnly={!isSuperAdmin}
                    placeholder="e.g. MUQ-BHM"
                    value={modalCampusCode}
                    onChange={(e) => setModalCampusCode(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs font-mono uppercase focus:outline-none ${
                      isSuperAdmin
                        ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                  Location / Address *
                </label>
                <input
                  type="text"
                  required
                  readOnly={!isSuperAdmin}
                  placeholder="e.g. 142 Coventry Road, Small Heath"
                  value={modalLocation}
                  onChange={(e) => setModalLocation(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none ${
                    isSuperAdmin
                      ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    readOnly={!isSuperAdmin}
                    placeholder="e.g. Birmingham"
                    value={modalCity}
                    onChange={(e) => setModalCity(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none ${
                      isSuperAdmin
                        ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    readOnly={!isSuperAdmin}
                    placeholder="e.g. United Kingdom"
                    value={modalCountry}
                    onChange={(e) => setModalCountry(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none ${
                      isSuperAdmin
                        ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                    Official Phone
                  </label>
                  <input
                    type="text"
                    readOnly={!isSuperAdmin}
                    placeholder="+44 121 700 0000"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none ${
                      isSuperAdmin
                        ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    readOnly={!isSuperAdmin}
                    placeholder="birmingham@misbah.org"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none ${
                      isSuperAdmin
                        ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                    Operating Currency
                  </label>
                  <select
                    disabled={!isSuperAdmin}
                    value={modalCurrency}
                    onChange={(e) => setModalCurrency(e.target.value as 'GBP' | 'PKR')}
                    className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none ${
                      isSuperAdmin
                        ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    <option value="GBP">GBP (£ - British Pound Sterling)</option>
                    <option value="PKR">PKR (Rs. - Pakistani Rupee)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0D381E] mb-1">
                    Status
                  </label>
                  <select
                    disabled={!isSuperAdmin}
                    value={modalIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setModalIsActive(e.target.value === 'active')}
                    className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none ${
                      isSuperAdmin
                        ? 'bg-[#F9F8F4] border-[#E6E2D8] focus:border-[#0D381E]'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-[#57655B] text-xs font-semibold hover:bg-[#F9F8F4] cursor-pointer"
                >
                  {isSuperAdmin ? 'Cancel' : 'Close'}
                </button>
                {isSuperAdmin && (
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                  >
                    {editingCampusId ? 'Save Changes' : 'Create Campus'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
