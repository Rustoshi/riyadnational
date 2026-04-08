'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)]',
  success: 'bg-[var(--success-light)] text-[var(--success)] border-transparent',
  warning: 'bg-[var(--warning-light)] text-[var(--warning)] border-transparent',
  error: 'bg-[var(--error-light)] text-[var(--error)] border-transparent',
  info: 'bg-[var(--primary-light)] text-[var(--primary)] border-transparent',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-muted)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  error: 'bg-[var(--error)]',
  info: 'bg-[var(--primary)]',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

// Status badge helper
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    // General
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'success', label: 'Completed' },
    failed: { variant: 'error', label: 'Failed' },
    cancelled: { variant: 'default', label: 'Cancelled' },
    
    // Users
    verified: { variant: 'success', label: 'Verified' },
    unverified: { variant: 'warning', label: 'Unverified' },
    blocked: { variant: 'error', label: 'Blocked' },
    suspended: { variant: 'error', label: 'Suspended' },
    
    // KYC
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'error', label: 'Rejected' },
    under_review: { variant: 'info', label: 'Under Review' },
    
    // Transactions
    processing: { variant: 'info', label: 'Processing' },
    
    // Cards
    issued: { variant: 'success', label: 'Issued' },
    expired: { variant: 'error', label: 'Expired' },
  };

  const config = statusMap[status.toLowerCase()] || { variant: 'default' as BadgeVariant, label: status };

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

export default Badge;
