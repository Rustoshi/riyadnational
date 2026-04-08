'use client';

import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

interface TableHeadProps {
  children?: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

interface TableCellProps {
  children?: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
}

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className={`w-full ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`border-b border-[var(--border)] ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className = '', onClick, selected }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`
        border-b border-[var(--border)] last:border-0
        transition-colors duration-150
        ${onClick ? 'cursor-pointer hover:bg-[var(--bg)]' : ''}
        ${selected ? 'bg-[var(--primary-light)]' : ''}
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = '',
  align = 'left',
  sortable,
  sorted,
  onSort,
}: TableHeadProps) {
  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={`
        h-11 px-4
        text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider
        ${alignStyles[align]}
        ${sortable ? 'cursor-pointer hover:text-[var(--text-primary)] select-none' : ''}
        ${className}
      `}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        {sortable && sorted && (
          <span className="text-[var(--primary)]">
            {sorted === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({ children, className = '', align = 'left', colSpan }: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      className={`
        h-12 px-4
        text-sm text-[var(--text-primary)]
        ${alignStyles[align]}
        ${className}
      `}
    >
      {children}
    </td>
  );
}

// Empty state for tables
export function TableEmpty({ message = 'No data found', colSpan = 1 }: { message?: string; colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-32 text-center">
        <div className="flex flex-col items-center justify-center text-[var(--text-muted)]">
          <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export default Table;
