import React, { useState, useEffect } from 'react';
import { X, Users, Sparkles, DollarSign, BookOpen, Key, Phone, Mail } from 'lucide-react';
import { Campus, TeacherProfile } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (teacher: TeacherProfile, message?: string) => void;
  teacherToEdit?: TeacherProfile | null;
  campuses: Campus[];
  activeCampusId?: string;
  defaultCampusId?: string;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  teacherToEdit,
  campuses,
  activeCampusId,
  defaultCampusId = 'kts',
}) => {
  const isEditing = Boolean(teacherToEdit);
  const effectiveDefaultCampus =
    (activeCampusId && activeCampusId !== 'all' ? activeCampusId : defaultCampusId) || 'kts';

  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [campusId, setCampusId] = useState(effectiveDefaultCampus);
  const [specialization, setSpecialization] = useState('Tajweed & Qiraat Sab\'ah');
  const [qualification, setQualification] = useState('Sanad & Ijazah in Hafs an Asim');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [baseMonthlySalary, setBaseMonthlySalary] = useState<number>(
    effectiveDefaultCampus === 'uk' ? 2400 : 85000
  );
  const [employmentStatus, setEmploymentStatus] = useState<'FULL_TIME' | 'PART_TIME' | 'VISITING'>('FULL_TIME');
  const [portalAccessActive, setPortalAccessActive] = useState(true);
  const [createPortalAccount, setCreatePortalAccount] = useState(true);
  const [initialPassword, setInitialPassword] = useState('teacher123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teacherToEdit) {
      setFullName(teacherToEdit.fullName || '');
      setEmployeeCode(teacherToEdit.employeeCode || '');
      setCampusId(teacherToEdit.campusId || effectiveDefaultCampus);
      setSpecialization(teacherToEdit.specialization || 'Tajweed & Qiraat');
      setQualification(teacherToEdit.qualification || '');
      setEmail(teacherToEdit.email || '');
      setPhone(teacherToEdit.phone || '');
      setBaseMonthlySalary(teacherToEdit.baseMonthlySalary || (teacherToEdit.campusId === 'uk' ? 2400 : 85000));
      setEmploymentStatus(teacherToEdit.employmentStatus || 'FULL_TIME');
      setPortalAccessActive(teacherToEdit.portalAccessActive !== false);
      setCreatePortalAccount(false);
    } else {
      setFullName('');
      setEmployeeCode('');
      setCampusId(effectiveDefaultCampus);
      setSpecialization('Tajweed & Qiraat Sab\'ah');
      setQualification('Sanad & Ijazah in Hafs an Asim (Darul Uloom)');
      setEmail('');
      setPhone('');
      setBaseMonthlySalary(effectiveDefaultCampus === 'uk' ? 2400 : 85000);
      setEmploymentStatus('FULL_TIME');
      setPortalAccessActive(true);
      setCreatePortalAccount(true);
      setInitialPassword('teacher123');
    }
    setError('');
    setIsSubmitting(false);
  }, [teacherToEdit, effectiveDefaultCampus, isOpen]);

  // When campus changes, update default salary currency benchmark
  useEffect(() => {
    if (!teacherToEdit) {
      if (campusId === 'uk') {
        setBaseMonthlySalary(2400);
      } else {
        setBaseMonthlySalary(85000);
      }
    }
  }, [campusId, teacherToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Faculty Full Name is required.');
      return;
    }

    const currency = campusId === 'uk' ? 'GBP' : 'PKR';
    const computedEmail = email.trim() || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@misbah.org`;

    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing && teacherToEdit) {
        const result = await IMSStateService.updateTeacher(teacherToEdit.id, {
          fullName: fullName.trim(),
          employeeCode: employeeCode.trim() || teacherToEdit.employeeCode,
          campusId,
          specialization: specialization.trim(),
          qualification: qualification.trim(),
          email: computedEmail,
          phone: phone.trim(),
          baseMonthlySalary: Number(baseMonthlySalary),
          salaryCurrency: currency,
          employmentStatus,
          portalAccessActive,
        });

        if (result.success) {
          const updated = IMSStateService.getTeacherById(teacherToEdit.id)!;
          onSaved(updated, `Faculty profile for ${fullName} successfully updated.`);
          onClose();
        } else {
          setError(result.error || 'Failed to update faculty member.');
        }
      } else {
        const result = await IMSStateService.createTeacher({
          fullName: fullName.trim(),
          employeeCode: employeeCode.trim() || undefined,
          campusId,
          specialization: specialization.trim(),
          qualification: qualification.trim(),
          email: computedEmail,
          phone: phone.trim(),
          baseMonthlySalary: Number(baseMonthlySalary),
          salaryCurrency: currency,
          employmentStatus,
          portalAccessActive,
          createPortalAccount,
          initialPassword: initialPassword.trim() || 'teacher123',
        });

        if (result.success && result.teacher) {
          onSaved(result.teacher, `New faculty member ${fullName} registered and provisioned in Supabase with Code ${result.teacher.employeeCode}.`);
          onClose();
        } else {
          setError(result.error || 'Database rejected teacher provisioning.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-2xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#E5C158] flex items-center justify-center text-[#0D381E] font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                {isEditing ? 'Edit Faculty Member' : 'Add New Faculty Instructor'}
              </h3>
              <p className="text-xs text-[#E6E2D8]/80">
                {isEditing ? 'Update instructor credentials, compensation, and campus assignment' : 'Register a qualified Qari or Islamic Studies instructor'}
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

          {/* Section 1: Instructor Identity */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0D381E] mb-2 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>Instructor Identity & Credentials</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#1A231E] mb-1">
                  Full Name & Honorific <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Qari Hasan Al-Baqir"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">
                  Employee Code (Optional)
                </label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="Auto-generated if left blank (e.g. TCH-UK-105)"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs font-mono focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Campus / Branch</label>
                <select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  disabled={Boolean(activeCampusId && activeCampusId !== 'all')}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4] disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {campuses
                    .filter((c) => !activeCampusId || activeCampusId === 'all' || c.id === activeCampusId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city}, {c.country})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Specialization</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                >
                  <option value="Tajweed & Qiraat Sab'ah">Tajweed & Qira'at Sab'ah</option>
                  <option value="Hifz Al-Quran Intensive">Hifz Al-Quran Intensive</option>
                  <option value="Nazra & Foundation">Nazra & Foundation Quran</option>
                  <option value="Islamic Studies & Hadith">Islamic Studies & Hadith</option>
                  <option value="Arabic Grammar & Morphology">Arabic Grammar & Morphology</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-[#1A231E] mb-1">Academic Sanad / Qualifications</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. Ijazah in Ten Minor Qira'at (Al-Azhar), Wifaq-ul-Madaris Al-Arabia"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Compensation */}
          <div className="pt-2 border-t border-[#E6E2D8]">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0D381E] mb-2 flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>Contact & Compensation Terms</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Official Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. hasan@misbah.org"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                  />
                  <Mail className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Phone / WhatsApp</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +44 7700 900142"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                  />
                  <Phone className="w-3.5 h-3.5 text-[#57655B] absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">
                  Monthly Base Salary ({campusId === 'uk' ? 'GBP £' : 'PKR Rs.'})
                </label>
                <input
                  type="number"
                  min="0"
                  value={baseMonthlySalary}
                  onChange={(e) => setBaseMonthlySalary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs font-mono font-bold focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Employment Type</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value as 'FULL_TIME' | 'PART_TIME' | 'VISITING')}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs focus:outline-none focus:border-[#0D381E] bg-[#F9F8F4]"
                >
                  <option value="FULL_TIME">Full Time Regular Faculty</option>
                  <option value="PART_TIME">Part Time Instructor</option>
                  <option value="VISITING">Visiting Scholar / Qari</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Portal Login Account Setup */}
          {!isEditing && (
            <div className="pt-3 border-t border-[#E6E2D8] bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-100 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-[#0D381E]">
                <input
                  type="checkbox"
                  checked={createPortalAccount}
                  onChange={(e) => setCreatePortalAccount(e.target.checked)}
                  className="w-4 h-4 text-[#0D381E] rounded accent-[#0D381E]"
                />
                <span className="flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-[#0D381E]" />
                  <span>Automatically Create Portal Login Account for this Faculty Member</span>
                </span>
              </label>
              <p className="text-[11px] text-[#57655B] pl-6">
                Creates portal credentials allowing the teacher to mark roll calls, log daily student Sabaq, and submit reports.
              </p>
              {createPortalAccount && (
                <div className="pl-6 pt-1 flex items-center space-x-2">
                  <span className="text-[11px] text-[#1A231E] font-medium">Initial Password:</span>
                  <input
                    type="text"
                    value={initialPassword}
                    onChange={(e) => setInitialPassword(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-[#E6E2D8] rounded text-xs font-mono font-bold w-40 text-[#0D381E]"
                  />
                </div>
              )}
            </div>
          )}

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
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-lg font-bold text-xs transition-colors shadow-xs flex items-center space-x-1.5 ${
                isSubmitting
                  ? 'bg-[#0D381E]/70 text-[#F3D273]/70 cursor-not-allowed'
                  : 'bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] cursor-pointer'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 text-[#E5C158] ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>
                {isSubmitting
                  ? 'Writing to Supabase...'
                  : isEditing
                  ? 'Save Faculty Profile'
                  : 'Confirm & Register Faculty'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
