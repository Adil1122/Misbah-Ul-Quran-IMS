import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: 'Student' | 'Teacher' | 'Portal Account' | 'Record';
  onConfirm: () => void;
  onClose: () => void;
  warningNote?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  itemType,
  onConfirm,
  onClose,
  warningNote,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E6E2D8] max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="font-heading font-bold text-base">{title || `Delete ${itemType}`}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-[#1A231E]">
          <p className="text-sm">
            Are you sure you want to delete <strong className="text-[#0D381E]">{itemName}</strong>?
          </p>

          <p className="text-[#57655B] leading-relaxed">
            This will permanently remove this {itemType.toLowerCase()} from the system. All associated
            records and access will be updated, and this action will be permanently recorded in the security audit ledger.
          </p>

          {warningNote && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-medium">
              ⚠️ {warningNote}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#F9F8F4] border-t border-[#E6E2D8] p-4 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E6E2D8] text-[#57655B] hover:bg-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Yes, Delete {itemType}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
