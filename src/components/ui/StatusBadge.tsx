import React from 'react';

type BadgeType =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED'
  | 'LEAVE'
  | 'PAID'
  | 'PARTIAL'
  | 'PENDING'
  | 'OVERDUE'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'INACTIVE';

interface StatusBadgeProps {
  status: BadgeType | string;
  className?: string;
}

/**
 * Implements Zero-Pill Discipline: Unboxed clean typography with subtle geometric status indicators
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'PRESENT':
      case 'PAID':
      case 'APPROVED':
      case 'ACTIVE':
        return {
          symbol: '●',
          textColor: 'text-emerald-800',
          dotColor: 'text-emerald-600',
          label: normalized === 'PAID' ? 'Paid' : normalized === 'PRESENT' ? 'Present' : normalized === 'APPROVED' ? 'Approved' : 'Active',
        };

      case 'LATE':
      case 'PARTIAL':
      case 'SUBMITTED':
      case 'PENDING':
        return {
          symbol: '▲',
          textColor: 'text-amber-800',
          dotColor: 'text-amber-600',
          label: normalized === 'PARTIAL' ? 'Partial' : normalized === 'LATE' ? 'Late' : normalized === 'SUBMITTED' ? 'Under Review' : 'Pending',
        };

      case 'LEAVE':
      case 'EXCUSED':
        return {
          symbol: '◆',
          textColor: 'text-sky-800',
          dotColor: 'text-sky-600',
          label: normalized === 'LEAVE' ? 'On Leave' : 'Excused',
        };

      case 'ABSENT':
      case 'OVERDUE':
      case 'REJECTED':
      case 'INACTIVE':
        return {
          symbol: '○',
          textColor: 'text-rose-800',
          dotColor: 'text-rose-600',
          label: normalized === 'ABSENT' ? 'Absent' : normalized === 'OVERDUE' ? 'Overdue' : normalized === 'REJECTED' ? 'Rejected' : 'Inactive',
        };

      default:
        return {
          symbol: '·',
          textColor: 'text-neutral-700',
          dotColor: 'text-neutral-500',
          label: status,
        };
    }
  };

  const config = getStyle();

  return (
    <span className={`inline-flex items-center space-x-1.5 text-xs font-medium tracking-tight ${config.textColor} ${className}`}>
      <span className={`text-[10px] leading-none ${config.dotColor}`}>{config.symbol}</span>
      <span>{config.label}</span>
    </span>
  );
};
