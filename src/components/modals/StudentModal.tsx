import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  User,
  BookOpen,
  MapPin,
  FileText,
  DollarSign,
  HeartPulse,
  Upload,
} from 'lucide-react';
import { Campus, StudentRecord, DocumentAttachment } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { getCampusRegionalConfig, formatCampusCurrency } from '../../utils/currency.ts';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (student: StudentRecord, message?: string) => void;
  studentToEdit?: StudentRecord | null;
  campuses: Campus[];
  activeCampusId?: string;
  defaultCampusId?: string;
  defaultClassId?: string;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  studentToEdit,
  campuses,
  defaultCampusId = 'uk',
  defaultClassId,
}) => {
  const isEditing = Boolean(studentToEdit);

  const [entryMode, setEntryMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [campusId, setCampusId] = useState(defaultCampusId);
  const [classId, setClassId] = useState(defaultClassId || 'cls-g1');
  const [section, setSection] = useState('Section A');
  const [currentGrade, setCurrentGrade] = useState('G1 (Junior Girls Class)');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [dob, setDob] = useState('2016-06-15');
  const [enrollmentDate, setEnrollmentDate] = useState('2026-10-01');
  const [primaryParentName, setPrimaryParentName] = useState('');
  const [primaryParentPhone, setPrimaryParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [quranMilestone, setQuranMilestone] = useState('Noorani Qaida Lesson 5');
  const [hasSiblingDiscount, setHasSiblingDiscount] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState('');
  const [uploadedDocSizeMb, setUploadedDocSizeMb] = useState<number>(2.4);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const classes = IMSStateService.getClasses(campusId);

  useEffect(() => {
    if (studentToEdit) {
      setEntryMode(studentToEdit.entryMode || 'ONLINE');
      setFirstName(studentToEdit.firstName || '');
      setLastName(studentToEdit.lastName || '');
      setAdmissionNumber(studentToEdit.admissionNumber || '');
      setCampusId(studentToEdit.campusId || defaultCampusId);
      setClassId(studentToEdit.classId || 'cls-uk-g1');
      setSection(studentToEdit.section || 'Section A');
      setCurrentGrade(studentToEdit.currentGrade || 'G1 (Junior Girls Class)');
      setGender(studentToEdit.gender || 'FEMALE');
      setDob(studentToEdit.dob || '2016-06-15');
      setEnrollmentDate(studentToEdit.enrollmentDate || '2026-10-01');
      setPrimaryParentName(studentToEdit.primaryParentName || '');
      setPrimaryParentPhone(studentToEdit.primaryParentPhone || '');
      setAddress(studentToEdit.address || '');
      setBloodGroup(studentToEdit.bloodGroup || 'B+');
      setMedicalNotes(studentToEdit.medicalNotes || '');
      setQuranMilestone(studentToEdit.quranMilestone || 'Juz 1');
      setHasSiblingDiscount(Boolean(studentToEdit.hasSiblingDiscount));
      setIsActive(studentToEdit.isActive !== false);
    } else {
      setEntryMode('ONLINE');
      setFirstName('');
      setLastName('');
      setAdmissionNumber('');
      setCampusId(defaultCampusId === 'all' ? 'uk' : defaultCampusId);
      setClassId(defaultClassId || 'cls-uk-g1');
      setSection('Section A');
      setCurrentGrade('G1 (Junior Girls Class)');
      setGender('FEMALE');
      setDob('2016-06-15');
      setEnrollmentDate(new Date().toISOString().split('T')[0]);
      setPrimaryParentName('');
      setPrimaryParentPhone('');
      setAddress('');
      setBloodGroup('B+');
      setMedicalNotes('');
      setQuranMilestone('Noorani Qaida Lesson 5');
      setHasSiblingDiscount(false);
      setUploadedDocName('');
      setUploadedDocSizeMb(2.4);
      setIsActive(true);
    }
    setError('');
    setIsSaving(false);
  }, [studentToEdit, defaultCampusId, isOpen]);

  // Adjust default gender when class changes
  useEffect(() => {
    if (classId === 'cls-g1' || classId === 'cls-g2' || classId === 'cls-uk-g1' || classId === 'cls-uk-g2') {
      setGender('FEMALE');
    } else if (classId === 'cls-b1' || classId === 'cls-b2' || classId === 'cls-hifz' || classId === 'cls-uk-b1' || classId === 'cls-uk-b2' || classId === 'cls-uk-hifz') {
      setGender('MALE');
    }
  }, [classId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Student First Name is required.');
      return;
    }

    if (uploadedDocSizeMb > 500) {
      setError('Attached document exceeds global system limit of 500MB.');
      return;
    }

    const selectedClass = classes.find((c) => c.id === classId);
    const className = selectedClass ? selectedClass.name : 'G1 (Junior Girls Class)';

    const documents: DocumentAttachment[] = [];
    if (uploadedDocName.trim()) {
      documents.push({
        id: `doc-${Date.now()}`,
        name: uploadedDocName.trim(),
        sizeMb: uploadedDocSizeMb,
        type: 'PDF',
        uploadedAt: new Date().toISOString().split('T')[0],
      });
    }

    const campusConfig = getCampusRegionalConfig(campusId);
    const calculatedMonthlyFee = hasSiblingDiscount
      ? campusConfig.siblingMonthlyFee
      : campusConfig.standardMonthlyFee;
    const calculatedAdmissionFee = campusConfig.admissionFee;

    setIsSaving(true);
    setError('');

    try {
      if (isEditing && studentToEdit) {
        const res = await IMSStateService.updateStudent(studentToEdit.id, {
          entryMode,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          admissionNumber: admissionNumber.trim() || studentToEdit.admissionNumber,
          campusId,
          classId,
          className,
          section,
          currentGrade,
          gender,
          dob,
          enrollmentDate,
          primaryParentName: primaryParentName.trim(),
          primaryParentPhone: primaryParentPhone.trim(),
          address: address.trim(),
          bloodGroup,
          medicalNotes: medicalNotes.trim(),
          quranMilestone: quranMilestone.trim(),
          hasSiblingDiscount,
          monthlyFee: calculatedMonthlyFee,
          admissionFee: calculatedAdmissionFee,
          isActive,
        });

        if (res.success) {
          const updated = IMSStateService.getStudentById(studentToEdit.id)!;
          onSaved(updated, `Student ${firstName} ${lastName} successfully updated in database.`);
          onClose();
        } else {
          setError(res.error || 'Failed to update student record in database.');
        }
      } else {
        const res = await IMSStateService.createStudent({
          entryMode,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          admissionNumber: admissionNumber.trim() || undefined,
          campusId,
          classId,
          className,
          section,
          currentGrade,
          gender,
          dob,
          enrollmentDate,
          primaryParentName: primaryParentName.trim(),
          primaryParentPhone: primaryParentPhone.trim(),
          address: address.trim(),
          bloodGroup,
          medicalNotes: medicalNotes.trim(),
          quranMilestone: quranMilestone.trim(),
          hasSiblingDiscount,
          monthlyFee: calculatedMonthlyFee,
          admissionFee: calculatedAdmissionFee,
          isActive,
          documents: documents.length > 0 ? documents : undefined,
        });

        if (res.success && res.student) {
          onSaved(res.student, `New student ${firstName} ${lastName} enrolled with ID ${res.student.admissionNumber} and saved to Supabase.`);
          onClose();
        } else {
          setError(res.error || 'Failed to enroll student in database.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected network error saving student.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-2xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#E5C158] flex items-center justify-center text-[#0D381E] font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                {isEditing ? 'Edit Student Admission Profile' : 'Student Admission Form Entry'}
              </h3>
              <p className="text-xs text-[#E6E2D8]/80">
                Online & Offline admission entry with document verification and sibling discounts
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Admission Entry Mode: Online vs Offline */}
          <div className="p-3.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-[#0D381E] block">Admission Entry Method</span>
              <span className="text-[11px] text-[#57655B]">Select how the application was submitted:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setEntryMode('ONLINE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'ONLINE' ? 'bg-[#0D381E] text-[#F3D273] shadow-xs' : 'bg-white border text-[#57655B]'
                }`}
              >
                Online Entry
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('OFFLINE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'OFFLINE' ? 'bg-[#0D381E] text-[#F3D273] shadow-xs' : 'bg-white border text-[#57655B]'
                }`}
              >
                Offline / Paper Entry
              </button>
            </div>
          </div>

          {/* Section 1: Student Identity */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0D381E] mb-2 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>Student Personal Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#1A231E] mb-1">
                  First Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Bilal"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Last Name / Family Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Siddique"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                >
                  <option value="MALE">Male (Talib)</option>
                  <option value="FEMALE">Female (Taliba)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Class Allocation (The 5 Ongoing Classes) */}
          <div className="pt-2 border-t border-[#E6E2D8]">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0D381E] mb-2 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>Class & Section Allocation</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Enrolled Class Section</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4] font-semibold text-[#0D381E]"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.scheduleTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Admission Date</label>
                <input
                  type="date"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Quran Memorization Milestone</label>
                <input
                  type="text"
                  value={quranMilestone}
                  onChange={(e) => setQuranMilestone(e.target.value)}
                  placeholder="e.g. Juz 8 (Surah Al-Anfal)"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Official Admission Number</label>
                <input
                  type="text"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="Auto-generated if blank (e.g. MUQ-UK-2026-0014)"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs font-mono bg-[#F9F8F4]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Parent/Guardian & Address */}
          <div className="pt-2 border-t border-[#E6E2D8]">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0D381E] mb-2 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>Parent / Guardian & Contact Info</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  value={primaryParentName}
                  onChange={(e) => setPrimaryParentName(e.target.value)}
                  placeholder="e.g. Br. Farhan Siddique"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={primaryParentPhone}
                  onChange={(e) => setPrimaryParentPhone(e.target.value)}
                  placeholder="e.g. +44 7911 123456"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-[#1A231E] mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 45 Bethnal Green Rd, London E2 7DG"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Fees & Sibling Discount Exception */}
          {(() => {
            const currentConfig = getCampusRegionalConfig(campusId);
            const displayFee = hasSiblingDiscount ? currentConfig.siblingMonthlyFee : currentConfig.standardMonthlyFee;
            return (
              <div className="pt-2 border-t border-[#E6E2D8] bg-[#F9F8F4] p-3.5 rounded-xl border border-[#E6E2D8] space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0D381E] flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#E5C158]" />
                  <span>Fee Structure & Sibling Discount Exception ({currentConfig.name})</span>
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer font-bold text-[#0D381E]">
                      <input
                        type="checkbox"
                        checked={hasSiblingDiscount}
                        onChange={(e) => setHasSiblingDiscount(e.target.checked)}
                        className="w-4 h-4 text-[#0D381E] accent-[#0D381E]"
                      />
                      <span>
                        Apply Sibling Discount Exception ({formatCampusCurrency(currentConfig.siblingMonthlyFee, currentConfig.currency)} / month)
                      </span>
                    </label>
                    <p className="text-[11px] text-[#57655B] pl-6 mt-0.5">
                      Standard fee is {formatCampusCurrency(currentConfig.standardMonthlyFee, currentConfig.currency)}/month + {formatCampusCurrency(currentConfig.admissionFee, currentConfig.currency)} admission fee. Sibling exception reduces monthly fee to {formatCampusCurrency(currentConfig.siblingMonthlyFee, currentConfig.currency)}/month. Due date 10th monthly.
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#57655B] uppercase block">Monthly Fee:</span>
                    <span className="text-lg font-bold font-mono text-[#0D381E]">
                      {formatCampusCurrency(displayFee, currentConfig.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section 5: Document Upload (Max 500MB) */}
          <div className="pt-2 border-t border-[#E6E2D8] space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0D381E] flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>Upload Documents (IDs, Birth Certificates - Max 500MB)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#1A231E] mb-1">Document File Name</label>
                <input
                  type="text"
                  value={uploadedDocName}
                  onChange={(e) => setUploadedDocName(e.target.value)}
                  placeholder="e.g. Birth_Certificate_Passport.pdf"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#1A231E] mb-1">File Size (MB) [Max 500MB]</label>
                <input
                  type="number"
                  max={500}
                  min={0.1}
                  step={0.1}
                  value={uploadedDocSizeMb}
                  onChange={(e) => setUploadedDocSizeMb(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E2D8] text-xs font-mono font-bold bg-[#F9F8F4]"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E6E2D8] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-[#57655B] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs flex items-center space-x-1.5 ${
                isSaving ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 text-[#E5C158] ${isSaving ? 'animate-spin' : ''}`} />
              <span>
                {isSaving
                  ? 'Saving to Database...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Confirm & Enroll Student'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
