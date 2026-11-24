import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export type PageSizeOption = 20 | 50 | 100 | 500;

interface PaginationControlProps {
  currentPage: number;
  pageSize: PageSizeOption;
  totalRecords: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: PageSizeOption) => void;
  itemName?: string; // e.g. "records", "students", "attendance entries"
  className?: string;
  showTopBar?: boolean; // If used as the top records selector bar
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  itemName = 'records',
  className = '',
  showTopBar = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startRecord = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalRecords);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10) as PageSizeOption;
    onPageSizeChange(newSize);
    onPageChange(1); // Reset to page 1 as required
  };

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    if (clamped !== safeCurrentPage) {
      onPageChange(clamped);
    }
  };

  // Generate numbered pages with smart truncation
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) {
        pages.push('ellipsis');
      }
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safeCurrentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  // TOP SELECTOR BAR VARIANT
  if (showTopBar) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F4F3EE] rounded-xl border border-[#E6E2D8] text-xs ${className}`}
      >
        <div className="flex items-center space-x-2">
          <label htmlFor="top-page-size-select" className="font-bold text-[#0D381E] whitespace-nowrap">
            Show records:
          </label>
          <select
            id="top-page-size-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-[#D8D2C5] font-bold text-[#0D381E] shadow-2xs cursor-pointer focus:ring-2 focus:ring-[#0D381E] focus:outline-hidden"
          >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={500}>500 per page</option>
          </select>
          <span className="text-[#57655B] hidden sm:inline">
            (Quick toggle: 20 | 50 | 100 | 500)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[#57655B] font-medium tabular-nums">
            {totalRecords === 0
              ? `0 ${itemName}`
              : `Showing ${startRecord}–${endRecord} of ${totalRecords} ${itemName}`}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-[#E6E2D8] text-[11px] font-semibold text-[#0D381E]">
            Page {safeCurrentPage} of {totalPages}
          </span>
        </div>
      </div>
    );
  }

  // BOTTOM COMPLETE PAGINATION FOOTER
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-[#E6E2D8] shadow-xs text-xs ${className}`}
    >
      {/* Records count & page size dropdown */}
      <div className="flex items-center justify-between sm:justify-start space-x-3">
        <div className="flex items-center space-x-1.5">
          <label className="text-[#57655B] font-medium whitespace-nowrap">Show:</label>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="px-2.5 py-1 rounded-lg bg-[#F4F3EE] border border-[#D8D2C5] font-bold text-[#0D381E] cursor-pointer hover:bg-white transition-colors focus:ring-2 focus:ring-[#0D381E] focus:outline-hidden"
            aria-label="Records per page"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          <span className="text-[#57655B]">/ page</span>
        </div>

        <span className="text-[#57655B] font-medium tabular-nums border-l border-[#E6E2D8] pl-3">
          {totalRecords === 0 ? (
            <span className="text-amber-800 font-medium">No {itemName} found</span>
          ) : (
            <>
              Showing <strong className="text-[#0D381E] font-mono">{startRecord}–{endRecord}</strong> of{' '}
              <strong className="text-[#0D381E] font-mono">{totalRecords}</strong> {itemName}
            </>
          )}
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center sm:justify-end space-x-1">
        <button
          onClick={() => goToPage(1)}
          disabled={safeCurrentPage <= 1}
          className="p-1.5 rounded-lg border border-[#E6E2D8] text-[#57655B] hover:text-[#0D381E] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] text-[#57655B] hover:text-[#0D381E] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-medium"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center space-x-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ell-${idx}`} className="px-1 text-[#57655B] tracking-widest font-mono text-xs select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === safeCurrentPage;
            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`min-w-[30px] h-[30px] px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0D381E] text-[#F3D273] shadow-xs'
                    : 'text-[#57655B] hover:bg-[#F4F3EE] hover:text-[#0D381E] border border-transparent'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[#E6E2D8] text-[#57655B] hover:text-[#0D381E] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-medium"
          aria-label="Next page"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => goToPage(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[#E6E2D8] text-[#57655B] hover:text-[#0D381E] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
