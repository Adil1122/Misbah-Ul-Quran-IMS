import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Globe,
  Clock,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Shield,
  Edit3,
  Users,
  GraduationCap,
  BookOpen,
  X,
  UserPlus,
} from 'lucide-react';
import { Campus, UserSession } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { PortalAccountModal } from '../modals/PortalAccountModal.tsx';

interface CampusesViewProps {
  campuses: Campus[];
  user?: UserSession;
  onSelectCampus: (campusId: string) => void;
}

export const CampusesView: React.FC<CampusesViewProps> = ({ campuses, user, onSelectCampus }) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = IMSStateService.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [feedback, setFeedback] = useState('');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Edit Campus Modal State
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedCampusForAdmin, setSelectedCampusForAdmin] = useState<'uk' | 'kts'>('uk');
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTimezone, setEditTimezone] = useState('');
  const [editCurrency, setEditCurrency] = useState<'GBP' | 'PKR'>('GBP');

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  };

  const openEditModal = (c: Campus) => {
    setEditingCampus(c);
    setEditName(c.name);
    setEditAddress(c.address);
    setEditCity(c.city || '');
    setEditCountry(c.country || '');
    setEditPhone(c.phone);
    setEditEmail(c.email);
    setEditTimezone(c.timezone);
    setEditCurrency(c.currencyCode);
  };

  const handleSaveCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampus) return;

    const res = IMSStateService.updateCampus(editingCampus.id, {
      name: editName.trim(),
      address: editAddress.trim(),
      city: editCity.trim(),
      country: editCountry.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      timezone: editTimezone.trim(),
      currencyCode: editCurrency,
    });

    if (res.success) {
      showToast(res.message);
      setEditingCampus(null);
    } else {
      showToast(`✕ Error: ${res.message}`);
    }
  };

  const liveCampuses = IMSStateService.getCampuses();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-semibold text-xl text-[#0D381E]">
            Campus Network Directory
          </h3>
          <p className="text-xs text-[#57655B] mt-0.5">
            Operational multi-tenant infrastructure across United Kingdom and KTS Pakistan branches.
          </p>
        </div>

        {isSuperAdmin ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#57655B] bg-[#F9F8F4] px-3 py-1.5 rounded-lg border border-[#E6E2D8] flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0D381E]" />
              <span>Two Core Campuses Configured</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-xs text-[#57655B] bg-[#F9F8F4] px-3 py-1.5 rounded-lg border border-[#E6E2D8]">
            <Shield className="w-3.5 h-3.5 text-[#0D381E]" />
            <span>Campus Configuration Managed by Super Admin</span>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {liveCampuses.map((c) => {
          const studentCount = IMSStateService.getStudents(c.id).length;
          const teacherCount = IMSStateService.getTeachers(c.id).length;
          const classCount = IMSStateService.getClasses(c.id).length;

          return (
            <div key={c.id} className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C158]">
                      Code: {c.code}
                    </span>
                    <h4 className="font-heading font-semibold text-2xl text-[#F3D273]">
                      {c.name}
                    </h4>
                    <p className="text-xs text-white/70">{c.city}, {c.country}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2.5 py-1 rounded bg-[#E5C158] text-[#0D381E] font-bold font-mono">
                      {c.currencyCode}
                    </span>
                    {isSuperAdmin && (
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-[#F3D273] transition-colors cursor-pointer"
                        title="Edit Campus Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Campus Metrics Bar */}
                <div className="grid grid-cols-3 bg-[#F9F8F4] border-b border-[#E6E2D8] p-3 text-center text-xs divide-x divide-[#E6E2D8]">
                  <div>
                    <span className="block text-[10px] text-[#57655B] uppercase font-semibold">Active Students</span>
                    <span className="font-bold text-[#0D381E] text-sm font-mono">{studentCount}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#57655B] uppercase font-semibold">Faculty / Qaris</span>
                    <span className="font-bold text-[#0D381E] text-sm font-mono">{teacherCount}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#57655B] uppercase font-semibold">Halaqahs</span>
                    <span className="font-bold text-[#0D381E] text-sm font-mono">{classCount}</span>
                  </div>
                </div>

                <div className="p-5 space-y-3 text-xs text-[#57655B]">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-[#0D381E] shrink-0" />
                    <span>{c.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#0D381E] shrink-0" />
                    <span>Timezone: <span className="font-mono font-medium text-[#1A231E]">{c.timezone}</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-[#0D381E] shrink-0" />
                    <span>Phone: <span className="font-mono font-medium text-[#1A231E]">{c.phone}</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-[#0D381E] shrink-0" />
                    <span>Email: <span className="font-mono font-medium text-[#1A231E]">{c.email}</span></span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="pt-4 border-t border-[#E6E2D8] flex items-center justify-between">
                  <span className="text-emerald-700 font-semibold text-xs flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Active Operational Branch</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCampusForAdmin(c.id as 'uk' | 'kts');
                            setIsAdminModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded bg-emerald-50 text-emerald-900 font-semibold border border-emerald-300 hover:bg-emerald-100 text-xs cursor-pointer flex items-center space-x-1"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#0D381E]" />
                          <span>+ Create Admin</span>
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="px-2.5 py-1.5 rounded bg-white text-[#0D381E] font-semibold border border-[#E6E2D8] hover:bg-[#F9F8F4] text-xs cursor-pointer flex items-center space-x-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onSelectCampus(c.id)}
                      className="px-3 py-1.5 rounded bg-[#0D381E] text-[#F3D273] font-semibold hover:bg-[#16532d] text-xs transition-colors cursor-pointer"
                    >
                      Switch Context
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Campus Modal */}
      {editingCampus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCampus}
            className="bg-white rounded-xl max-w-lg w-full border border-[#E6E2D8] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#57655B]">Campus Configuration</span>
                <h4 className="font-heading font-bold text-xl text-[#0D381E]">
                  Edit {editingCampus.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingCampus(null)}
                className="p-1 rounded text-[#57655B] hover:text-[#0D381E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">Campus Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">Physical Address *</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">Country</label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">Timezone</label>
                  <input
                    type="text"
                    value={editTimezone}
                    onChange={(e) => setEditTimezone(e.target.value)}
                    placeholder="e.g. Europe/London or Asia/Karachi"
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A231E] mb-1">Operating Currency</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as 'GBP' | 'PKR')}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-white text-[#0D381E] font-medium"
                  >
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="PKR">PKR (Rs - Pakistani Rupee)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingCampus(null)}
                className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] hover:bg-[#F9F8F4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Campus Admin Account Modal for Super Admin */}
      <PortalAccountModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSaved={(account, _msg) => {
          showToast(`✓ Admin account created for ${account.fullName} (${account.username}) at ${account.campusId === 'uk' ? 'UK Campus' : 'KTS Pakistan Campus'}`);
        }}
        campuses={campuses}
        defaultRole="CAMPUS_ADMIN"
        defaultCampusId={selectedCampusForAdmin}
      />
    </div>
  );
};
