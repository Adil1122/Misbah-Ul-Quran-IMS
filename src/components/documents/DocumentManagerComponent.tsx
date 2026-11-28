import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Image,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { DocumentAttachment } from '../../types/ims.ts';
import { IMSStateService } from '../../services/imsStateService.ts';

interface DocumentManagerComponentProps {
  entityType: 'STUDENT' | 'TEACHER';
  entityId: string;
  entityName: string;
  campusId: string;
  userRole?: string;
  initialDocuments?: DocumentAttachment[];
  onDocumentChange?: (documents: DocumentAttachment[]) => void;
  canUpload?: boolean;
  canDelete?: boolean;
}

const DOCUMENT_CATEGORIES = [
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate / Official National ID' },
  { value: 'ADMISSION', label: 'Signed Parent Admission & Tuition Agreement' },
  { value: 'SANAD', label: 'Ijazah / Quran Sanad Certification' },
  { value: 'MEDICAL', label: 'Medical Clearance & Allergy Record' },
  { value: 'EMPLOYMENT_CONTRACT', label: 'Teacher Appointment & Confidentiality Contract' },
  { value: 'DISCIPLINARY', label: 'Official Disciplinary or Behavior Notice' },
  { value: 'OTHER', label: 'Other Verified Documentation' },
];

export const DocumentManagerComponent: React.FC<DocumentManagerComponentProps> = ({
  entityType,
  entityId,
  entityName,
  campusId,
  userRole = 'SUPER_ADMIN',
  initialDocuments = [],
  onDocumentChange,
  canUpload = true,
  canDelete = true,
}) => {
  const [documents, setDocuments] = useState<DocumentAttachment[]>(initialDocuments);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [category, setCategory] = useState(
    entityType === 'TEACHER' ? 'SANAD' : 'BIRTH_CERTIFICATE'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentAttachment | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentAttachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialDocuments changes from parent
  useEffect(() => {
    if (initialDocuments) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  // Fetch documents from server on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDocs = async () => {
      try {
        const currentUser = IMSStateService.getCurrentUser();
        const res = await fetch(`/api/documents?entityType=${entityType}&entityId=${entityId}`, {
          headers: {
            Authorization: `Bearer ${currentUser?.token || 'adm-token'}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && Array.isArray(json.documents) && json.documents.length > 0) {
            setDocuments(json.documents);
            if (onDocumentChange) onDocumentChange(json.documents);
          }
        }
      } catch {
        // use local state
      }
    };
    fetchDocs();
    return () => {
      isMounted = false;
    };
  }, [entityType, entityId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleFileSelect = (file: File) => {
    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      showNotification('error', 'File size exceeds the 25MB maximum limit.');
      return;
    }
    // Validate format
    const validExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      showNotification(
        'error',
        'Unsupported file format. Please upload PDF, Word (DOC, DOCX), or Image (PNG, JPG, WEBP).'
      );
      return;
    }

    setSelectedFile(file);
    if (!documentTitle.trim()) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setDocumentTitle(nameWithoutExt.replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showNotification('error', 'Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
      });
      reader.readAsDataURL(selectedFile);

      setUploadProgress(50);
      const fileBase64 = await base64Promise;
      setUploadProgress(75);

      const res = await IMSStateService.uploadDocument({
        entityType,
        entityId,
        campusId: campusId || 'uk',
        name: documentTitle.trim() || selectedFile.name,
        category,
        mimeType: selectedFile.type || 'application/pdf',
        sizeBytes: selectedFile.size,
        fileBase64,
      });

      setUploadProgress(100);

      if (res.success && res.document) {
        const updated = [res.document, ...documents.filter((d) => d.id !== res.document!.id)];
        setDocuments(updated);
        if (onDocumentChange) onDocumentChange(updated);
        showNotification('success', `✓ Document "${res.document.name}" uploaded and verified successfully.`);
        setIsUploadOpen(false);
        setSelectedFile(null);
        setDocumentTitle('');
      } else {
        showNotification('error', res.error || 'Failed to upload document.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Unexpected error during upload.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = (doc: DocumentAttachment) => {
    const downloadUrl = `/api/documents/${doc.id}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', doc.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', `Downloading "${doc.name}"...`);
  };

  const handleView = (doc: DocumentAttachment) => {
    const viewUrl = `/api/documents/${doc.id}/view`;
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const res = await IMSStateService.deleteDocument(docToDelete.id, entityType, entityId);
      if (res.success) {
        const updated = documents.filter((d) => d.id !== docToDelete.id);
        setDocuments(updated);
        if (onDocumentChange) onDocumentChange(updated);
        showNotification('success', `✓ Document "${docToDelete.name}" permanently deleted.`);
        setDocToDelete(null);
      } else {
        showNotification('error', res.error || 'Failed to delete document.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Error deleting document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFormatBadge = (type?: string, name?: string) => {
    const ext = name?.includes('.') ? name.split('.').pop()?.toUpperCase() : (type || 'PDF');
    if (ext === 'PDF') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">PDF</span>;
    }
    if (['PNG', 'JPG', 'JPEG', 'WEBP', 'IMAGE'].includes(ext || '')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">{ext}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">{ext}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-[#EBF7EE] text-[#0D381E] border border-[#C3E4CD]'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#0D381E] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E2D8]">
        <div>
          <h4 className="font-heading font-semibold text-base text-[#0D381E] flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#E5C158]" />
            <span>Official Records & Verified Documents</span>
          </h4>
          <p className="text-xs text-[#57655B] mt-0.5">
            Verified admissions, legal identity, qualifications, and agreement files for {entityName}.
          </p>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setDocumentTitle('');
              setIsUploadOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#0D381E] hover:bg-[#155A31] text-[#E5C158] font-bold text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-[#E6E2D8] bg-[#F9F8F4] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#E5C158]/20 flex items-center justify-center text-[#0D381E]">
            <File className="w-6 h-6" />
          </div>
          <div>
            <h5 className="font-heading font-bold text-sm text-[#0D381E]">No documents uploaded yet</h5>
            <p className="text-xs text-[#57655B] mt-1 max-w-md mx-auto">
              Securely upload birth certificates, admissions agreements, Ijazah Sanads, or medical clearance records (up to 25MB).
            </p>
          </div>
          {canUpload && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#0D381E] text-xs font-bold text-[#0D381E] hover:bg-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload First Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[#E6E2D8] border border-[#E6E2D8] rounded-xl overflow-hidden bg-white shadow-xs">
          {documents.map((doc) => {
            const categoryMatch = DOCUMENT_CATEGORIES.find((c) => c.value === doc.category);
            const categoryLabel = categoryMatch ? categoryMatch.label : (doc.category || 'General Documentation');
            const isImageOrPdf = doc.type === 'PDF' || doc.type === 'IMAGE' || doc.name.endsWith('.pdf') || doc.name.endsWith('.png') || doc.name.endsWith('.jpg');

            return (
              <div
                key={doc.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9F8F4] transition-colors"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#0D381E]/10 flex items-center justify-center text-[#0D381E] shrink-0 mt-0.5">
                    {doc.type === 'IMAGE' ? (
                      <Image className="w-4 h-4 text-[#0D381E]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#0D381E]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-semibold text-xs text-[#1A231E] truncate max-w-sm">
                        {doc.name}
                      </span>
                      {getFormatBadge(doc.type, doc.name)}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-[#57655B] mt-0.5">
                      <span className="font-medium text-[#0D381E]">{categoryLabel}</span>
                      <span>•</span>
                      <span>{doc.sizeMb ? `${doc.sizeMb} MB` : 'Verified'}</span>
                      <span>•</span>
                      <span>Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Active'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  {/* View action */}
                  {isImageOrPdf && doc.fileAvailable !== false && (
                    <button
                      type="button"
                      onClick={() => handleView(doc)}
                      title="View inline"
                      className="px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] hover:bg-white text-[#0D381E] font-medium text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                  )}

                  {/* Download action */}
                  {doc.fileAvailable === false ? (
                    <span
                      title="Imported from the old system; the file itself was not transferred."
                      className="px-2.5 py-1.5 rounded-lg border border-dashed border-[#E6E2D8] text-[#8A948C] text-xs font-medium"
                    >
                      File not available
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      title="Download file bytes"
                      className="px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] bg-white hover:bg-[#F4F3EE] text-[#0D381E] font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0D381E]" />
                      <span>Download</span>
                    </button>
                  )}

                  {/* Delete action */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      title="Delete document"
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-lg w-full overflow-hidden">
            <div className="bg-[#0D381E] text-white p-4 flex items-center justify-between border-b border-[#E5C158]/30">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-[#E5C158]" />
                <h3 className="font-heading font-bold text-sm text-[#F3D273]">
                  Upload Document for {entityName}
                </h3>
              </div>
              <button
                onClick={() => !isUploading && setIsUploadOpen(false)}
                disabled={isUploading}
                className="text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#0D381E] bg-[#EBF7EE]'
                    : selectedFile
                    ? 'border-[#0D381E] bg-[#F9F8F4]'
                    : 'border-[#E6E2D8] hover:border-[#0D381E] bg-[#FAFAF8]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-1">
                    <FileText className="w-8 h-8 text-[#0D381E] mx-auto" />
                    <span className="font-bold text-xs text-[#0D381E] block truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-[#57655B]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                    </span>
                    <span className="text-[10px] text-emerald-700 block font-semibold">
                      Click to change file
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="w-8 h-8 text-[#57655B] mx-auto" />
                    <span className="font-bold text-xs text-[#1A231E] block">
                      Choose file or drag & drop here
                    </span>
                    <span className="text-[11px] text-[#57655B] block">
                      PDF, DOC, DOCX, PNG, JPG (Max 25MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Document Category */}
              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Document Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs font-medium focus:border-[#0D381E] focus:outline-none"
                >
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Title */}
              <div>
                <label className="block font-semibold text-[#1A231E] mb-1">
                  Document Title / Description *
                </label>
                <input
                  type="text"
                  required
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="e.g. Official Birth Certificate / NADRA B-Form"
                  className="w-full p-2.5 rounded-lg border border-[#E6E2D8] bg-[#F9F8F4] text-xs focus:border-[#0D381E] focus:outline-none"
                />
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[11px] text-[#57655B]">
                    <span>Uploading and verifying with Supabase Storage...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#E6E2D8] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#0D381E] h-2 rounded-full transition-all duration-300"
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
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E2D8] hover:bg-[#F4F3EE] font-medium text-xs text-[#57655B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-4 py-2 rounded-lg bg-[#0D381E] hover:bg-[#155A31] text-[#E5C158] font-bold text-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Verify</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-[#1A231E]">
                  Delete Document
                </h4>
                <p className="text-xs text-[#57655B]">Permanently remove verified file</p>
              </div>
            </div>

            <p className="text-xs text-[#57655B]">
              Are you sure you want to permanently delete <strong>"{docToDelete.name}"</strong>? This will remove the file from storage and cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E6E2D8]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDocToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-[#E6E2D8] hover:bg-[#F4F3EE] text-xs font-semibold text-[#57655B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
