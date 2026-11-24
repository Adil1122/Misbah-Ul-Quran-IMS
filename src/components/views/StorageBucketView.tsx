import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderArchive,
  HardDrive,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileCode,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  RefreshCw,
  Folder,
  FolderOpen,
  Lock,
  ShieldCheck,
  Server,
  Database,
  Calendar,
  X,
  FileUp,
  Layers,
  ArrowUpDown,
  Building2,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { UserSession, DocumentAttachment } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';

interface StorageBucketViewProps {
  user: UserSession;
  activeCampusId?: string;
}

type BucketFolder = 'ALL' | 'STUDENT' | 'TEACHER' | 'CAMPUS' | 'SYSTEM';

const DOCUMENT_CATEGORIES = [
  { value: 'ALL', label: 'All Document Categories' },
  { value: 'SANAD', label: 'Quran Sanad & Ijazah Certifications' },
  { value: 'ADMISSION', label: 'Signed Parent Admission Agreements' },
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificates & Official IDs' },
  { value: 'MEDICAL', label: 'Medical Clearance & Allergy Records' },
  { value: 'EMPLOYMENT_CONTRACT', label: 'Faculty Contracts & Appointments' },
  { value: 'DISCIPLINARY', label: 'Official Disciplinary Notices' },
  { value: 'OTHER', label: 'General Institution Records' },
];

export const StorageBucketView: React.FC<StorageBucketViewProps> = ({
  user,
  activeCampusId = 'all',
}) => {
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<BucketFolder>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCampus, setSelectedCampus] = useState<string>(activeCampusId);

  // Modals & Panels
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentAttachment | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentAttachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLinkDocId, setCopiedLinkDocId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFolder, setUploadFolder] = useState<'STUDENT' | 'TEACHER' | 'CAMPUS' | 'SYSTEM'>('STUDENT');
  const [uploadCategory, setUploadCategory] = useState('ADMISSION');
  const [uploadEntityId, setUploadEntityId] = useState('');
  const [uploadCampus, setUploadCampus] = useState<string>(
    user.activeCampusId !== 'all' ? user.activeCampusId : 'uk'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load all documents from the backend storage API
  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const currentUser = IMSStateService.getCurrentUser() || user;
      const res = await fetch('/api/documents', {
        headers: {
          Authorization: `Bearer ${currentUser?.token || 'adm-token'}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.documents)) {
          setDocuments(json.documents);
        }
      }
    } catch (err) {
      console.warn('[StorageBucketView] Failed to fetch documents from server API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  // Sync campus filter if parent props change
  useEffect(() => {
    if (activeCampusId) {
      setSelectedCampus(activeCampusId);
    }
  }, [activeCampusId]);

  // Dynamic filter computation
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Campus filter
      if (selectedCampus !== 'all' && doc.campusId && doc.campusId.toLowerCase() !== selectedCampus.toLowerCase()) {
        return false;
      }

      // 2. Folder filter
      if (selectedFolder !== 'ALL') {
        const entity = (doc.entityType || '').toUpperCase();
        if (selectedFolder === 'SYSTEM' && entity !== 'SYSTEM' && entity !== 'CAMPUS' && entity !== '') {
          return false;
        } else if (selectedFolder !== 'SYSTEM' && entity !== selectedFolder) {
          return false;
        }
      }

      // 3. Category filter
      if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(q);
        const matchRef = (doc.entityId || '').toLowerCase().includes(q);
        const matchUploader = (doc.uploadedBy || '').toLowerCase().includes(q);
        const matchCat = (doc.category || '').toLowerCase().includes(q);
        if (!matchName && !matchRef && !matchUploader && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [documents, selectedCampus, selectedFolder, selectedCategory, searchQuery]);

  // Metrics computation
  const metrics = useMemo(() => {
    const totalFiles = documents.length;
    const totalMb = documents.reduce((acc, d) => acc + (d.sizeMb || 0.5), 0);
    const studentFiles = documents.filter((d) => (d.entityType || '').toUpperCase() === 'STUDENT').length;
    const teacherFiles = documents.filter((d) => (d.entityType || '').toUpperCase() === 'TEACHER').length;
    const campusFiles = totalFiles - studentFiles - teacherFiles;

    return {
      totalFiles,
      totalMb: totalMb.toFixed(2),
      studentFiles,
      teacherFiles,
      campusFiles: Math.max(0, campusFiles),
    };
  }, [documents]);

  // Handle file selection in Upload Modal
  const handleFilePicked = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      showToast('error', 'File size exceeds 25 MB limit.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    const valid = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp'];
    if (!ext || !valid.includes(ext)) {
      showToast('error', 'Unsupported file format. Please upload PDF, Word (DOC/DOCX), or Images (PNG, JPG, WEBP).');
      return;
    }
    setUploadFile(file);
    if (!uploadTitle.trim()) {
      const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadTitle(rawName.replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilePicked(e.dataTransfer.files[0]);
    }
  };

  // Submit Upload to Bucket
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('error', 'Please select a file to upload.');
      return;
    }
    if (!uploadTitle.trim()) {
      showToast('error', 'Please provide a descriptive document title.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      // Convert file to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const commaIndex = result.indexOf(',');
          resolve(commaIndex !== -1 ? result.substring(commaIndex + 1) : result);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(uploadFile);

      setUploadProgress(40);
      const base64Data = await base64Promise;

      setUploadProgress(65);
      const currentUser = IMSStateService.getCurrentUser() || user;
      const refId = uploadEntityId.trim() || `ref-${Date.now()}`;

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token || 'adm-token'}`,
        },
        body: JSON.stringify({
          entityType: uploadFolder,
          entityId: refId,
          campusId: uploadCampus,
          name: uploadTitle.trim(),
          category: uploadCategory,
          mimeType: uploadFile.type || 'application/pdf',
          sizeBytes: uploadFile.size,
          fileBase64: base64Data,
        }),
      });

      setUploadProgress(90);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server rejected file upload.');
      }

      setUploadProgress(100);
      showToast('success', `✓ File "${uploadTitle.trim()}" successfully deposited into misbah-documents bucket.`);
      
      // Reset form and reload
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadEntityId('');
      await loadDocuments();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to upload document to bucket.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete Document Confirmation
  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);

    try {
      const currentUser = IMSStateService.getCurrentUser() || user;
      const res = await fetch(`/api/documents/${docToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentUser?.token || 'adm-token'}`,
        },
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete file from storage.');
      }

      showToast('success', `✓ Document "${docToDelete.name}" purged from bucket storage.`);
      setDocToDelete(null);
      await loadDocuments();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete document from bucket.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy signed link
  const handleCopySignedLink = async (doc: DocumentAttachment) => {
    const fullUrl = `${window.location.origin}/api/documents/${doc.id}/view`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLinkDocId(doc.id);
      showToast('success', '✓ Secure link copied to clipboard (authenticated session required).');
      setTimeout(() => setCopiedLinkDocId(null), 3000);
    } catch {
      showToast('error', 'Could not copy link to clipboard.');
    }
  };

  const getFileIcon = (mimeType?: string, type?: string) => {
    const m = (mimeType || '').toLowerCase();
    const t = (type || '').toLowerCase();
    if (m.startsWith('image/') || t === 'image') {
      return <ImageIcon className="w-5 h-5 text-amber-600" />;
    }
    if (m.includes('word') || m.includes('doc') || t === 'doc') {
      return <FileCode className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-emerald-700" />;
  };

  const sqlSetupScript = `-- ==============================================================================
-- MISBAH-UL-QURAN IMS — SUPABASE STORAGE SETUP
-- Bucket: 'misbah-documents' (Private bucket with signed URLs & RLS)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'misbah-documents',
  'misbah-documents',
  false,
  15728640,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640;

-- Storage Policies
DROP POLICY IF EXISTS "misbah_documents_upload_policy" ON storage.objects;
CREATE POLICY "misbah_documents_upload_policy" ON storage.objects
  FOR INSERT TO authenticated, anon
  WITH CHECK (bucket_id = 'misbah-documents');

DROP POLICY IF EXISTS "misbah_documents_select_policy" ON storage.objects;
CREATE POLICY "misbah_documents_select_policy" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'misbah-documents');

DROP POLICY IF EXISTS "misbah_documents_delete_policy" ON storage.objects;
CREATE POLICY "misbah_documents_delete_policy" ON storage.objects
  FOR DELETE TO authenticated, anon
  USING (bucket_id = 'misbah-documents');`;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl bg-white border border-[#E6E2D8] animate-in slide-in-from-top-3">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold text-[#0D381E]">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-[#57655B] hover:text-[#0D381E] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header Card with Islamic Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0D381E] via-[#124426] to-[#0A2916] text-white p-6 sm:p-8 rounded-3xl border border-[#E5C158]/30 shadow-lg">
        {/* Subtle Islamic Geometric Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#E5C158]/15 via-transparent to-transparent pointer-events-none -mr-16 -mt-16 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#E5C158]/40 text-[#F3D273] text-xs font-medium">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Supabase Object Storage · misbah-documents</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
              <span className="text-[11px] font-semibold text-emerald-300">Live</span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#FAF9F5]">
              Document Storage Bucket
            </h1>
            <p className="text-sm text-white/80 max-w-2xl font-body leading-relaxed">
              Authoritative, multi-campus encrypted object storage vault. Holds student birth certificates,
              parent tuition agreements, teacher appointment contracts, and verified Ijazah Sanads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 border border-white/20 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              <Database className="w-4 h-4 text-[#F3D273]" />
              <span>Bucket RLS & SQL</span>
            </button>

            <button
              onClick={loadDocuments}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 border border-white/20 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Refresh Storage Objects"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F3D273]' : ''}`} />
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E5C158] to-[#D4AF37] hover:from-[#ECD278] hover:to-[#DEBD4E] text-[#0D381E] font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload to Bucket</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <div className="text-[11px] text-white/70 font-medium">Total Files Stored</div>
            <div className="text-xl sm:text-2xl font-bold font-heading text-[#F3D273] mt-0.5">
              {metrics.totalFiles}
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <div className="text-[11px] text-white/70 font-medium">Storage Utilized</div>
            <div className="text-xl sm:text-2xl font-bold font-heading text-white mt-0.5">
              {metrics.totalMb} <span className="text-xs text-white/60">MB</span>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <div className="text-[11px] text-white/70 font-medium">Student Files</div>
            <div className="text-xl sm:text-2xl font-bold font-heading text-emerald-300 mt-0.5">
              {metrics.studentFiles}
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <div className="text-[11px] text-white/70 font-medium">Faculty & Sanads</div>
            <div className="text-xl sm:text-2xl font-bold font-heading text-amber-300 mt-0.5">
              {metrics.teacherFiles}
            </div>
          </div>
        </div>
      </div>

      {/* Bucket Folder Navigator */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
          <div className="flex items-center space-x-2">
            <FolderArchive className="w-4 h-4 text-[#0D381E]" />
            <span className="font-heading font-bold text-sm text-[#0D381E]">
              Bucket Directory Navigation:
            </span>
          </div>

          {/* Campus Selector */}
          <div className="flex items-center space-x-2">
            <Building2 className="w-3.5 h-3.5 text-[#57655B]" />
            <span className="text-xs text-[#57655B] font-medium">Campus Scope:</span>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-lg text-[#0D381E] cursor-pointer"
            >
              <option value="all">All Campuses (Multi-Campus)</option>
              <option value="uk">UK Campus (London)</option>
              <option value="kts">KTS Campus (Pakistan)</option>
            </select>
          </div>
        </div>

        {/* Folder Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3">
          <button
            onClick={() => setSelectedFolder('ALL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFolder === 'ALL'
                ? 'bg-[#0D381E] text-white border-[#0D381E] shadow-sm'
                : 'bg-[#F9F8F4] text-[#0D381E] border-[#E6E2D8] hover:bg-[#F4F3EE]'
            }`}
          >
            <div className="flex items-center justify-between">
              <FolderOpen className={`w-4 h-4 ${selectedFolder === 'ALL' ? 'text-[#F3D273]' : 'text-amber-600'}`} />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/10">
                {documents.length}
              </span>
            </div>
            <div className="font-bold text-xs mt-2">/ (Root Bucket)</div>
            <div className={`text-[10px] mt-0.5 ${selectedFolder === 'ALL' ? 'text-white/70' : 'text-[#57655B]'}`}>
              All stored records
            </div>
          </button>

          <button
            onClick={() => setSelectedFolder('STUDENT')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFolder === 'STUDENT'
                ? 'bg-[#0D381E] text-white border-[#0D381E] shadow-sm'
                : 'bg-[#F9F8F4] text-[#0D381E] border-[#E6E2D8] hover:bg-[#F4F3EE]'
            }`}
          >
            <div className="flex items-center justify-between">
              <GraduationCap className={`w-4 h-4 ${selectedFolder === 'STUDENT' ? 'text-[#F3D273]' : 'text-emerald-700'}`} />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/10">
                {metrics.studentFiles}
              </span>
            </div>
            <div className="font-bold text-xs mt-2">students/</div>
            <div className={`text-[10px] mt-0.5 ${selectedFolder === 'STUDENT' ? 'text-white/70' : 'text-[#57655B]'}`}>
              Admissions & IDs
            </div>
          </button>

          <button
            onClick={() => setSelectedFolder('TEACHER')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFolder === 'TEACHER'
                ? 'bg-[#0D381E] text-white border-[#0D381E] shadow-sm'
                : 'bg-[#F9F8F4] text-[#0D381E] border-[#E6E2D8] hover:bg-[#F4F3EE]'
            }`}
          >
            <div className="flex items-center justify-between">
              <User className={`w-4 h-4 ${selectedFolder === 'TEACHER' ? 'text-[#F3D273]' : 'text-amber-600'}`} />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/10">
                {metrics.teacherFiles}
              </span>
            </div>
            <div className="font-bold text-xs mt-2">teachers/</div>
            <div className={`text-[10px] mt-0.5 ${selectedFolder === 'TEACHER' ? 'text-white/70' : 'text-[#57655B]'}`}>
              Sanads & Contracts
            </div>
          </button>

          <button
            onClick={() => setSelectedFolder('CAMPUS')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFolder === 'CAMPUS'
                ? 'bg-[#0D381E] text-white border-[#0D381E] shadow-sm'
                : 'bg-[#F9F8F4] text-[#0D381E] border-[#E6E2D8] hover:bg-[#F4F3EE]'
            }`}
          >
            <div className="flex items-center justify-between">
              <Building2 className={`w-4 h-4 ${selectedFolder === 'CAMPUS' ? 'text-[#F3D273]' : 'text-blue-700'}`} />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/10">
                {metrics.campusFiles}
              </span>
            </div>
            <div className="font-bold text-xs mt-2">campuses/</div>
            <div className={`text-[10px] mt-0.5 ${selectedFolder === 'CAMPUS' ? 'text-white/70' : 'text-[#57655B]'}`}>
              Accreditation & Deeds
            </div>
          </button>

          <button
            onClick={() => setSelectedFolder('SYSTEM')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              selectedFolder === 'SYSTEM'
                ? 'bg-[#0D381E] text-white border-[#0D381E] shadow-sm'
                : 'bg-[#F9F8F4] text-[#0D381E] border-[#E6E2D8] hover:bg-[#F4F3EE]'
            }`}
          >
            <div className="flex items-center justify-between">
              <Server className={`w-4 h-4 ${selectedFolder === 'SYSTEM' ? 'text-[#F3D273]' : 'text-purple-700'}`} />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/10">
                0
              </span>
            </div>
            <div className="font-bold text-xs mt-2">system/</div>
            <div className={`text-[10px] mt-0.5 ${selectedFolder === 'SYSTEM' ? 'text-white/70' : 'text-[#57655B]'}`}>
              Audit Snapshots
            </div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#57655B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by file name, ref ID, uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl text-xs text-[#0D381E] focus:outline-hidden focus:ring-2 focus:ring-[#0D381E]"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#57655B] shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto text-xs font-semibold px-3 py-2 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl text-[#0D381E] cursor-pointer"
          >
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stored Objects Table */}
      <div className="bg-white rounded-2xl border border-[#E6E2D8] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6E2D8] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-[#0D381E]" />
            <h3 className="font-heading font-bold text-base text-[#0D381E]">
              Bucket Storage Objects ({filteredDocuments.length})
            </h3>
          </div>
          <div className="text-xs text-[#57655B]">
            Bucket: <code className="bg-[#F4F3EE] px-1.5 py-0.5 rounded font-mono text-[#0D381E]">misbah-documents</code>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#57655B]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0D381E] mb-2" />
            Connecting to Supabase Storage and querying objects...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F9F8F4] border border-[#E6E2D8] flex items-center justify-center mx-auto text-[#57655B]">
              <FolderArchive className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-sm text-[#0D381E]">
              No Documents in this View
            </h4>
            <p className="text-xs text-[#57655B] max-w-sm mx-auto">
              No files currently match the selected folder, category, or search filters.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-[#0D381E] text-[#F3D273] font-bold text-xs rounded-xl hover:bg-[#16532d] cursor-pointer shadow-xs"
            >
              Upload First File to Bucket
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F4] text-[#57655B] font-semibold border-b border-[#E6E2D8]">
                <tr>
                  <th className="py-3 px-4">Document / File Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Target Folder</th>
                  <th className="py-3 px-4">Campus</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2D8]">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#FDFCF7] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-[#F9F8F4] border border-[#E6E2D8] shrink-0">
                          {getFileIcon(doc.mimeType, doc.type)}
                        </div>
                        <div>
                          <div className="font-bold text-[#0D381E] flex items-center space-x-1.5">
                            <span>{doc.name}</span>
                            {doc.category === 'SANAD' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                Sanad
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#57655B] font-mono mt-0.5">
                            Ref ID: {doc.entityId || 'N/A'} {doc.uploadedBy ? `· ${doc.uploadedBy}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#F4F3EE] text-[#0D381E] border border-[#E6E2D8] text-[11px] font-medium">
                        {doc.category ? doc.category.replace(/_/g, ' ') : 'General'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#57655B]">
                      {doc.entityType ? `${doc.entityType.toLowerCase()}s/` : 'root/'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          doc.campusId === 'uk'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : doc.campusId === 'kts'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {doc.campusId || 'all'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#57655B]">
                      {doc.sizeMb ? `${doc.sizeMb} MB` : '1.0 MB'}
                    </td>

                    <td className="py-3 px-4 text-[#57655B] text-[11px]">
                      {doc.uploadedAt ? doc.uploadedAt.substring(0, 10) : 'Recent'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Preview */}
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg border border-[#E6E2D8] hover:bg-[#F4F3EE] text-[#0D381E] cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct Download */}
                        <a
                          href={doc.url || `/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          download={doc.name}
                          className="p-1.5 rounded-lg border border-[#E6E2D8] hover:bg-[#F4F3EE] text-[#0D381E] cursor-pointer"
                          title="Download from Bucket"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopySignedLink(doc)}
                          className="p-1.5 rounded-lg border border-[#E6E2D8] hover:bg-[#F4F3EE] text-[#0D381E] cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedLinkDocId === doc.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Delete */}
                        {(user.role === 'SUPER_ADMIN' || user.role === 'CAMPUS_ADMIN') && (
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 cursor-pointer"
                            title="Purge from Storage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: UPLOAD TO BUCKET */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2.5">
                <UploadCloud className="w-5 h-5 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Upload to misbah-documents Bucket
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} className="p-6 space-y-4 text-xs">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#0D381E] bg-[#F4F3EE]'
                    : uploadFile
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-[#D8D2C5] hover:border-[#0D381E] bg-[#F9F8F4]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilePicked(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                />

                {uploadFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <div className="font-bold text-[#0D381E] text-sm">{uploadFile.name}</div>
                    <div className="text-[11px] text-[#57655B]">
                      {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB · Click to change file
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <FileUp className="w-8 h-8 text-[#0D381E] mx-auto opacity-70" />
                    <div className="font-bold text-[#0D381E]">Click or drag & drop file here</div>
                    <div className="text-[11px] text-[#57655B]">
                      Supports PDF, Word Documents, and Images up to 25 MB
                    </div>
                  </div>
                )}
              </div>

              {/* Document Title */}
              <div>
                <label className="block font-bold text-[#0D381E] mb-1">
                  Document Title / Description:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Birth Certificate - Muhammad Bilal"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0D381E]"
                />
              </div>

              {/* Grid: Target Folder & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Target Folder:</label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl font-semibold"
                  >
                    <option value="STUDENT">students/ (Student Records)</option>
                    <option value="TEACHER">teachers/ (Faculty Documents)</option>
                    <option value="CAMPUS">campuses/ (Campus Branch Files)</option>
                    <option value="SYSTEM">system/ (System Snapshots)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Document Category:</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl font-semibold"
                  >
                    <option value="ADMISSION">Admission Agreement</option>
                    <option value="BIRTH_CERTIFICATE">Birth Certificate / ID</option>
                    <option value="SANAD">Ijazah / Quran Sanad</option>
                    <option value="EMPLOYMENT_CONTRACT">Teacher Contract</option>
                    <option value="MEDICAL">Medical Record</option>
                    <option value="DISCIPLINARY">Disciplinary Notice</option>
                    <option value="OTHER">Other Verified Document</option>
                  </select>
                </div>
              </div>

              {/* Grid: Campus & Reference ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Campus Isolation:</label>
                  <select
                    value={uploadCampus}
                    onChange={(e) => setUploadCampus(e.target.value)}
                    className="w-full p-2.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl font-semibold"
                  >
                    <option value="uk">UK Campus (London)</option>
                    <option value="kts">KTS Campus (Pakistan)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0D381E] mb-1">Reference ID (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. STD-001 or TCH-KTS-1"
                    value={uploadEntityId}
                    onChange={(e) => setUploadEntityId(e.target.value)}
                    className="w-full p-2.5 bg-[#F9F8F4] border border-[#E6E2D8] rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[11px] text-[#57655B]">
                    <span>Uploading and verifying with Supabase Storage...</span>
                    <span className="font-mono font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E6E2D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0D381E] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E6E2D8]">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D8D2C5] text-[#57655B] font-semibold hover:bg-[#F4F3EE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2 rounded-xl bg-[#0D381E] hover:bg-[#16532d] text-[#F3D273] font-bold cursor-pointer disabled:opacity-50 shadow-xs flex items-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Depositing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Deposit into Bucket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DOCUMENT PREVIEW */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 px-6 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2.5">
                <Eye className="w-5 h-5 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-base text-[#F3D273] truncate max-w-md">
                  {previewDoc.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewDoc.url || `/api/documents/${previewDoc.id}/download`}
                  download={previewDoc.name}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-[#F9F8F4] flex flex-col items-center justify-center min-h-[350px]">
              {previewDoc.mimeType?.startsWith('image/') || previewDoc.type === 'IMAGE' ? (
                <img
                  src={`/api/documents/${previewDoc.id}/view`}
                  alt={previewDoc.name}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md border border-[#E6E2D8]"
                />
              ) : (
                <div className="text-center space-y-4 max-w-md p-6 bg-white rounded-2xl border border-[#E6E2D8] shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-[#0D381E] text-base">
                      {previewDoc.name}
                    </h4>
                    <p className="text-xs text-[#57655B] mt-1">
                      Category: {previewDoc.category || 'Official Document'} · {previewDoc.sizeMb || '1.0'} MB
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center space-x-3">
                    <a
                      href={`/api/documents/${previewDoc.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#0D381E] text-[#F3D273] font-bold text-xs hover:bg-[#16532d] shadow-xs flex items-center space-x-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Browser Window</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-white border-t border-[#E6E2D8] flex items-center justify-between text-xs text-[#57655B]">
              <span className="font-mono">Storage: misbah-documents</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 rounded-lg border border-[#D8D2C5] hover:bg-[#F4F3EE] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PURGE CONFIRMATION */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-700">
              <div className="p-2 rounded-full bg-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-[#0D381E]">
                Purge Document from Storage?
              </h3>
            </div>

            <p className="text-[#57655B] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#0D381E]">"{docToDelete.name}"</strong>? This will remove the
              binary file from the <code className="font-mono">misbah-documents</code> bucket and delete
              its metadata record.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#D8D2C5] text-[#57655B] font-semibold hover:bg-[#F4F3EE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: BUCKET RLS & SQL INSPECTOR */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#E6E2D8] overflow-hidden">
            <div className="bg-[#0D381E] text-white p-5 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2.5">
                <Database className="w-5 h-5 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-lg text-[#F3D273]">
                  Supabase Storage Bucket & RLS Configuration
                </h3>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Bucket Policy Specifications</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Bucket <code className="font-mono font-bold">misbah-documents</code> is configured as a private bucket with
                  AES-256 storage encryption. Downloads require authenticated signed tokens, eliminating public URL leakage.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#0D381E]">
                    SQL Setup Script (Run in Supabase SQL Editor if resetting storage):
                  </span>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(sqlSetupScript);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="flex items-center space-x-1 text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-[#1e293b] text-[#f8fafc] rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed border border-slate-700">
                  {sqlSetupScript}
                </pre>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#E6E2D8]">
                <button
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0D381E] text-[#F3D273] font-bold text-xs hover:bg-[#16532d] cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
