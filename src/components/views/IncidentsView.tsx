import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Paperclip,
  FileText,
  Plus,
  HeartPulse,
  Send,
  AlertOctagon,
  Download,
  Eye,
  Check,
  X,
  Search,
} from 'lucide-react';
import { Campus, UserSession, IncidentReportRecord, MedicalRecord, DocumentAttachment } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';
import { StatusBadge } from '../ui/StatusBadge.tsx';

interface IncidentsViewProps {
  user: UserSession;
  campuses: Campus[];
  activeCampusId: string;
}

const MAX_INCIDENT_FILE_SIZE_BYTES = 7 * 1024 * 1024;

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  user,
  activeCampusId,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'medical'>('incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState(user.role === 'SUPER_ADMIN' ? 'all' : user.activeCampusId);
  const campuses = IMSStateService.getCampuses();

  const allIncidents = IMSStateService.getIncidents(campusFilter === 'all' ? undefined : campusFilter);
  const allMedicalRecords = IMSStateService.getMedicalRecords(campusFilter === 'all' ? undefined : campusFilter);
  const students = IMSStateService.getStudents(campusFilter === 'all' ? undefined : campusFilter);
  const classes = IMSStateService.getClasses(campusFilter === 'all' ? undefined : campusFilter);

  // Filtered by search and role
  const filteredIncidents = allIncidents.filter((inc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStudent = inc.studentName.toLowerCase().includes(q);
      const matchReporter = inc.reporterName.toLowerCase().includes(q);
      const matchType = inc.type.toLowerCase().includes(q);
      const matchDesc = inc.description.toLowerCase().includes(q);
      if (!matchStudent && !matchReporter && !matchType && !matchDesc) return false;
    }
    return true;
  });

  const filteredMedicalRecords = allMedicalRecords.filter((med) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStudent = med.studentName.toLowerCase().includes(q);
      const matchCondition = med.condition.toLowerCase().includes(q);
      const matchAllergies = med.allergies?.toLowerCase().includes(q);
      if (!matchStudent && !matchCondition && !matchAllergies) return false;
    }
    return true;
  });

  const [successNote, setSuccessNote] = useState('');
  const [attachmentError, setAttachmentError] = useState('');

  // New incident modal state
  const [isAddIncidentOpen, setIsAddIncidentOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState(students[0]?.id || '');
  const [incType, setIncType] = useState<'BEHAVIORAL' | 'ACADEMIC' | 'MEDICAL' | 'INJURY'>('BEHAVIORAL');
  const [incSeverity, setIncSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [incDescription, setIncDescription] = useState('');
  const [incActionTaken, setIncActionTaken] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [incidentFormError, setIncidentFormError] = useState('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  // New Medical condition modal state
  const [isAddMedicalOpen, setIsAddMedicalOpen] = useState(false);
  const [medCondition, setMedCondition] = useState('');
  const [medAllergies, setMedAllergies] = useState('');
  const [medNotes, setMedNotes] = useState('');
  const [medEmergencyContact, setMedEmergencyContact] = useState('');

  const [selectedIncidentForReview, setSelectedIncidentForReview] = useState<IncidentReportRecord | null>(null);
  const [selectedMedicalForReview, setSelectedMedicalForReview] = useState<MedicalRecord | null>(null);

  const canApprove = user.role === 'SUPER_ADMIN' || user.role === 'CAMPUS_ADMIN';

  const handleApprove = (id: string) => {
    IMSStateService.updateIncidentStatus(id, 'APPROVED', `Report formally reviewed and approved by ${user.fullName}`);
    setSuccessNote('Report marked as Approved and officially archived in student record.');
    setTimeout(() => setSuccessNote(''), 3500);
  };

  const handleReject = (id: string) => {
    IMSStateService.updateIncidentStatus(id, 'REJECTED', `Report reviewed and rejected by ${user.fullName}`);
    setSuccessNote('Report marked as Rejected.');
    setTimeout(() => setSuccessNote(''), 3500);
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === targetStudentId) || students[0];
    if (!student || !incDescription.trim()) return;

    setIsSubmittingIncident(true);
    setIncidentFormError('');
    try {
      let uploadedDocument: DocumentAttachment | undefined;
      if (attachedFile) {
        const extension = attachedFile.name.split('.').pop()?.toLowerCase() || '';
        const mimeType = attachedFile.type || ({
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
        } as Record<string, string>)[extension];
        if (!mimeType) throw new Error('Unsupported file type. Choose PDF, DOC, DOCX, PNG, JPG, or WEBP.');

        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.includes(',') ? result.split(',')[1] : result);
          };
          reader.onerror = () => reject(new Error('Could not read the selected file.'));
          reader.readAsDataURL(attachedFile);
        });
        const uploadResult = await IMSStateService.uploadDocument({
          entityType: 'STUDENT',
          entityId: student.id,
          campusId: student.campusId || (campusFilter === 'all' ? 'uk' : campusFilter),
          name: attachedFile.name,
          category: 'DISCIPLINARY',
          mimeType,
          sizeBytes: attachedFile.size,
          fileBase64,
        });
        if (!uploadResult.success || !uploadResult.document) {
          throw new Error(uploadResult.error || 'The attachment could not be uploaded.');
        }
        uploadedDocument = uploadResult.document;
      }

      IMSStateService.addIncidentReport({
        campusId: student.campusId || (campusFilter === 'all' ? 'uk' : campusFilter),
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        reporterId: user.id,
        reporterName: user.fullName,
        type: incType,
        severity: incSeverity,
        description: incDescription.trim(),
        actionTaken: incActionTaken.trim() || 'Parent notified; formal warning recorded.',
        attachedFiles: uploadedDocument ? [uploadedDocument] : undefined,
      });

      setSuccessNote(`Incident report logged for ${student.firstName} ${student.lastName}.`);
      setIsAddIncidentOpen(false);
      setIncDescription('');
      setIncActionTaken('');
      setAttachedFile(null);
      setTimeout(() => setSuccessNote(''), 4000);
    } catch (err: any) {
      setIncidentFormError(err?.message || 'Unable to save the incident report.');
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const handleDownloadAttachment = async (file: DocumentAttachment) => {
    try {
      const downloadUrl = file.url || (file.id.startsWith('doc-') ? `/api/documents/${file.id}/download` : undefined);
      if (!downloadUrl) throw new Error('This older attachment has no stored file bytes.');
      const currentUser = IMSStateService.getCurrentUser();
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${currentUser?.token || 'adm-token'}` },
      });
      if (!response.ok) throw new Error('Unable to download this attachment.');
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setAttachmentError('');
    } catch (err: any) {
      setAttachmentError(err?.message || 'Unable to download this attachment.');
    }
  };

  const handleCreateMedical = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === targetStudentId) || students[0];
    if (!student || !medCondition.trim()) return;

    IMSStateService.addMedicalRecord({
      campusId: student.campusId || (campusFilter === 'all' ? 'uk' : campusFilter),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      condition: medCondition.trim(),
      severity: 'HIGH',
      allergies: medAllergies.trim(),
      medicationNotes: medNotes.trim(),
      emergencyContact: medEmergencyContact.trim() || student.primaryParentPhone,
      reportedBy: user.fullName,
    });

    setSuccessNote(`Medical condition record added for ${student.firstName} ${student.lastName}.`);
    setIsAddMedicalOpen(false);
    setMedCondition('');
    setMedAllergies('');
    setMedNotes('');
    setTimeout(() => setSuccessNote(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Workflow Context */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-xl text-[#0D381E] flex items-center space-x-2">
            <span>Incident & Medical Management Center</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full">
              Teacher Submission & Admin Approval
            </span>
          </h3>
          <p className="text-xs text-[#57655B] mt-0.5">
            Log disciplinary observations, medical alerts, and attach letters (up to 500MB). Teacher submissions require Admin review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddIncidentOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-[#E5C158]" />
            <span>Log Incident Report</span>
          </button>

          <button
            onClick={() => setIsAddMedicalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#F9F8F4] hover:bg-[#E6E2D8] border border-[#E6E2D8] text-[#0D381E] text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5"
          >
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Add Medical Alert</span>
          </button>
        </div>
      </div>

      {successNote && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successNote}</span>
        </div>
      )}
      {attachmentError && (
        <div role="alert" className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs">
          {attachmentError}
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E6E2D8] text-xs overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => {
            setActiveTab('incidents');
            setSearchQuery('');
          }}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'incidents'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Incident Reports ({filteredIncidents.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('medical');
            setSearchQuery('');
          }}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'medical'
              ? 'border-[#0D381E] bg-white text-[#0D381E] shadow-2xs'
              : 'border-transparent text-[#57655B] hover:text-[#0D381E]'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
          <span>Medical Records ({filteredMedicalRecords.length})</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E6E2D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#57655B]" />
          <input
            type="text"
            placeholder={activeTab === 'incidents' ? "Search student, reporter, or description..." : "Search student, condition, or allergies..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs focus:outline-none focus:border-[#0D381E]"
          />
        </div>

        {user.role === 'SUPER_ADMIN' && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-[#57655B] text-[11px] font-medium shrink-0">Campus:</span>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-xs font-semibold text-[#0D381E] focus:outline-none"
            >
              <option value="all">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: INCIDENTS TABLE */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden animate-in fade-in">
          {/* MOBILE VIEW: Incident Cards */}
          <div className="block sm:hidden divide-y divide-[#E6E2D8] p-3 space-y-3">
            {filteredIncidents.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#57655B]">
                No incident reports filed or matching search.
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div key={inc.id} className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#0D381E]">{inc.studentName}</div>
                      <div className="text-[11px] text-[#57655B]">Category: {inc.type} · Severity: {inc.severity}</div>
                    </div>
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="text-xs text-[#1A231E] line-clamp-2">{inc.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E6E2D8]/60 text-xs">
                    <span className="text-[10px] text-[#57655B] font-mono">Date: {inc.createdAt}</span>
                    <button
                      onClick={() => setSelectedIncidentForReview(inc)}
                      className="px-3 py-1.5 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer flex items-center space-x-1 min-h-[36px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3.5">Report Date</th>
                  <th className="p-3.5">Student or Teacher</th>
                  <th className="p-3.5">Campus / Class</th>
                  <th className="p-3.5">Report Category</th>
                  <th className="p-3.5">Submitted By</th>
                  <th className="p-3.5 text-center">Approval Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-[#57655B]">
                      No incident reports filed or matching search.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => {
                    const student = students.find((s) => s.id === inc.studentId);
                    return (
                      <tr key={inc.id} className="hover:bg-[#F9F8F4] transition-colors">
                        <td className="p-3.5 font-mono text-[#57655B] whitespace-nowrap">{inc.createdAt}</td>
                        <td className="p-3.5 font-semibold text-[#1A231E]">
                          {inc.studentName}
                          {inc.attachedFiles && inc.attachedFiles.length > 0 && (
                            <span className="ml-1.5 inline-flex items-center text-[10px] text-rose-700 font-normal">
                              <Paperclip className="w-3 h-3 inline mr-0.5" />
                              {inc.attachedFiles.length} file(s)
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E] border border-[#E6E2D8] mr-1.5">
                            {inc.campusId.toUpperCase()}
                          </span>
                          <span className="text-[#57655B]">
                            {student?.className || 'Class Group'}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E]">
                              {inc.type}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                inc.severity === 'HIGH'
                                  ? 'bg-rose-100 text-rose-800'
                                  : inc.severity === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {inc.severity}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium text-[#1A231E] whitespace-nowrap">{inc.reporterName}</td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <StatusBadge status={inc.status} />
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedIncidentForReview(inc)}
                              className="px-2.5 py-1 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer flex items-center space-x-1 shadow-2xs"
                              title="Review complete incident details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            {canApprove && inc.status === 'SUBMITTED' && (
                              <>
                                <button
                                  onClick={() => handleApprove(inc.id)}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer flex items-center space-x-1"
                                  title="Approve Report"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleReject(inc.id)}
                                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer flex items-center space-x-1"
                                  title="Reject Report"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MEDICAL TABLE (Restricted list with minimum identifying information) */}
      {activeTab === 'medical' && (
        <div className="bg-white rounded-xl border border-[#E6E2D8] shadow-xs overflow-hidden animate-in fade-in">
          {/* Privacy Notice Banner */}
          <div className="p-3.5 bg-amber-50/70 border-b border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
            <span className="font-medium">
              🔒 <strong>Restricted Medical Directory:</strong> Only minimal identifying information is listed. Detailed conditions and emergency medication plans are accessible only via authorized individual record review.
            </span>
          </div>

          {/* MOBILE VIEW: Restricted Medical Cards */}
          <div className="block sm:hidden divide-y divide-[#E6E2D8] p-3 space-y-3">
            {filteredMedicalRecords.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#57655B]">
                No medical records on file matching search.
              </div>
            ) : (
              filteredMedicalRecords.map((med) => {
                const student = students.find((s) => s.id === med.studentId);
                const studentClass = classes.find((c) => c.id === student?.classId)?.name || student?.className || 'Standard';
                return (
                  <div key={med.id} className="p-3 bg-[#F9F8F4] rounded-xl border border-[#E6E2D8] space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-[#0D381E]">{med.studentName}</div>
                        <div className="text-[11px] text-[#57655B]">{studentClass} · {med.campusId.toUpperCase()} Campus</div>
                      </div>
                      <StatusBadge status={med.status} />
                    </div>
                    <div className="text-[11px] text-[#57655B]">
                      Confidential Medical Record on File · Logged {med.createdAt}
                    </div>
                    <div className="flex items-center justify-end pt-1 border-t border-[#E6E2D8]/60 text-xs">
                      <button
                        onClick={() => setSelectedMedicalForReview(med)}
                        className="px-3 py-1.5 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer flex items-center space-x-1 min-h-[36px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Medical Record</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE: Minimum Identifying Information List */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-[#F9F8F4] border-b border-[#E6E2D8] text-[#57655B] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3.5">Student / Individual Name</th>
                  <th className="p-3.5">Campus</th>
                  <th className="p-3.5">Class</th>
                  <th className="p-3.5">Record Date</th>
                  <th className="p-3.5 text-center">Record Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {filteredMedicalRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-[#57655B]">
                      No medical records on file matching search.
                    </td>
                  </tr>
                ) : (
                  filteredMedicalRecords.map((med) => {
                    const student = students.find((s) => s.id === med.studentId);
                    const studentClass = classes.find((c) => c.id === student?.classId)?.name || student?.className || 'Standard';
                    return (
                      <tr key={med.id} className="hover:bg-[#F9F8F4] transition-colors">
                        <td className="p-3.5 font-semibold text-[#1A231E]">
                          {med.studentName}
                          <span className="text-[10px] text-[#57655B] block font-normal">
                            Recorded by: {med.reportedBy}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[#57655B]">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F3EE] text-[#0D381E] border border-[#E6E2D8]">
                            {med.campusId.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#1A231E]">
                          {studentClass}
                        </td>
                        <td className="p-3.5 font-mono text-[#57655B]">
                          {med.createdAt}
                        </td>
                        <td className="p-3.5 text-center">
                          <StatusBadge status={med.status} />
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedMedicalForReview(med)}
                            className="px-3 py-1.5 rounded bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-semibold text-xs cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Medical Record</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW INCIDENT MODAL */}
      {selectedIncidentForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-xl w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-[#E5C158]" />
                <h4 className="font-heading font-bold text-base text-[#F3D273]">
                  Incident Review: {selectedIncidentForReview.studentName}
                </h4>
              </div>
              <button
                onClick={() => setSelectedIncidentForReview(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-[#F9F8F4] p-3 rounded-lg border border-[#E6E2D8]">
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Reported By</span>
                  <span className="font-semibold text-[#1A231E]">{selectedIncidentForReview.reporterName}</span>
                </div>
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Date & Campus</span>
                  <span className="font-mono text-[#0D381E]">
                    {selectedIncidentForReview.createdAt} · {selectedIncidentForReview.campusId.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-[#0D381E]">{selectedIncidentForReview.type}</span>
                </div>
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Severity</span>
                  <span className="font-bold text-rose-800">{selectedIncidentForReview.severity}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#0D381E] block mb-1">Detailed Description:</span>
                <p className="bg-white p-3 rounded-lg border border-[#E6E2D8] text-[#1A231E] leading-relaxed">
                  {selectedIncidentForReview.description}
                </p>
              </div>

              {selectedIncidentForReview.actionTaken && (
                <div>
                  <span className="font-bold text-[#0D381E] block mb-1">Action Taken / Resolution:</span>
                  <p className="bg-white p-3 rounded-lg border border-[#E6E2D8] text-[#57655B] leading-relaxed">
                    {selectedIncidentForReview.actionTaken}
                  </p>
                </div>
              )}

              {selectedIncidentForReview.attachedFiles && selectedIncidentForReview.attachedFiles.length > 0 && (
                <div>
                  <span className="font-bold text-[#0D381E] block mb-1">Disciplinary Attachments:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncidentForReview.attachedFiles.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleDownloadAttachment(f)}
                        className="px-2.5 py-1.5 rounded bg-[#F9F8F4] hover:bg-[#E6E2D8] border border-[#E6E2D8] text-[11px] font-semibold text-[#0D381E] flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-700" />
                        <span>{f.name} ({f.sizeMb} MB)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedIncidentForReview.reviewNotes && (
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-950">
                  <span className="font-bold block mb-0.5">Admin Resolution Note:</span>
                  {selectedIncidentForReview.reviewNotes} (Reviewed by: {selectedIncidentForReview.reviewedBy})
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedIncidentForReview(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#57655B] hover:bg-[#E6E2D8] cursor-pointer"
              >
                Close
              </button>
              {canApprove && selectedIncidentForReview.status === 'SUBMITTED' && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleReject(selectedIncidentForReview.id);
                      setSelectedIncidentForReview(null);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-300 cursor-pointer"
                  >
                    Reject Report
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApprove(selectedIncidentForReview.id);
                      setSelectedIncidentForReview(null);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] cursor-pointer shadow-xs"
                  >
                    Approve Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MEDICAL MODAL */}
      {selectedMedicalForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-lg w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-5 h-5 text-rose-400" />
                <h4 className="font-heading font-bold text-base text-[#F3D273]">
                  Medical Record: {selectedMedicalForReview.studentName}
                </h4>
              </div>
              <button
                onClick={() => setSelectedMedicalForReview(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="bg-rose-50/70 p-3.5 rounded-lg border border-rose-100 space-y-1">
                <span className="font-bold text-rose-900 block text-sm">{selectedMedicalForReview.condition}</span>
                <span className="text-rose-800 text-[11px] font-semibold">
                  Severity: {selectedMedicalForReview.severity} · Status: {selectedMedicalForReview.status}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Known Allergies</span>
                  <p className="bg-[#F9F8F4] p-2.5 rounded-lg border border-[#E6E2D8] text-[#1A231E]">
                    {selectedMedicalForReview.allergies || 'None recorded'}
                  </p>
                </div>
                <div>
                  <span className="text-[#57655B] block text-[10px] uppercase font-bold">Emergency Protocol & Contact</span>
                  <p className="bg-[#F9F8F4] p-2.5 rounded-lg border border-[#E6E2D8] font-mono text-[#0D381E] font-bold">
                    {selectedMedicalForReview.emergencyContact || 'Campus administration office'}
                  </p>
                </div>
                {selectedMedicalForReview.medicationNotes && (
                  <div>
                    <span className="text-[#57655B] block text-[10px] uppercase font-bold">Medication Notes</span>
                    <p className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 text-amber-950">
                      {selectedMedicalForReview.medicationNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#F9F8F4] border-t border-[#E6E2D8] text-right">
              <button
                type="button"
                onClick={() => setSelectedMedicalForReview(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0D381E] text-[#F3D273] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: LOG INCIDENT */}
      {isAddIncidentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-lg w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <h4 className="font-heading font-bold text-base text-[#F3D273]">
                Log Student Incident Report
              </h4>
              <button onClick={() => setIsAddIncidentOpen(false)} className="text-white/70 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Select Student</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber}) — {s.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1A231E] mb-1">Incident Type</label>
                  <select
                    value={incType}
                    onChange={(e) => setIncType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                  >
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="MEDICAL">Medical</option>
                    <option value="INJURY">Injury</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1A231E] mb-1">Severity</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={incDescription}
                  onChange={(e) => setIncDescription(e.target.value)}
                  placeholder="Describe the incident objectively..."
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Action Taken</label>
                <input
                  type="text"
                  value={incActionTaken}
                  onChange={(e) => setIncActionTaken(e.target.value)}
                  placeholder="e.g. Disciplinary conference with parent scheduled"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">
                  Attach Disciplinary Letter / File (up to 7 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setIncidentFormError('');
                    if (file && file.size > MAX_INCIDENT_FILE_SIZE_BYTES) {
                      setAttachedFile(null);
                      setIncidentFormError('File size exceeds the 7 MB limit.');
                      e.target.value = '';
                      return;
                    }
                    setAttachedFile(file);
                  }}
                  className="block w-full text-xs text-[#57655B] file:mr-3 file:rounded-md file:border file:border-[#E6E2D8] file:bg-[#F9F8F4] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0D381E] hover:file:bg-[#F4F3EE]"
                />
                <p className="mt-1 text-[10px] text-[#57655B]">PDF, Word, PNG, JPG, or WEBP</p>
                {incidentFormError && <p role="alert" className="mt-1 text-xs text-red-700">{incidentFormError}</p>}
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSubmittingIncident}
                  onClick={() => {
                    setIsAddIncidentOpen(false);
                    setIncidentFormError('');
                  }}
                  className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIncident}
                  className="px-5 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isSubmittingIncident ? 'Saving...' : 'Save Incident Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: ADD MEDICAL CONDITION */}
      {isAddMedicalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-md w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between">
              <h4 className="font-heading font-bold text-base text-[#F3D273]">
                Add Student Medical Alert
              </h4>
              <button onClick={() => setIsAddMedicalOpen(false)} className="text-white/70 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateMedical} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Student</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Medical Condition</label>
                <input
                  type="text"
                  required
                  value={medCondition}
                  onChange={(e) => setMedCondition(e.target.value)}
                  placeholder="e.g. Asthma, Diabetes Type 1, Epilepsy"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Allergies</label>
                <input
                  type="text"
                  value={medAllergies}
                  onChange={(e) => setMedAllergies(e.target.value)}
                  placeholder="e.g. Nuts, Dairy, Penicillin"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A231E] mb-1">Emergency Medication Notes</label>
                <textarea
                  rows={2}
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  placeholder="e.g. EpiPen kept in Room 102 medical box..."
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] text-xs bg-[#F9F8F4]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddMedicalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-xs font-semibold text-[#57655B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0D381E] text-[#F3D273] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Medical Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
