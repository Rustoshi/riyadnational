'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon,
  className = '',
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={`
        bg-[var(--surface)] 
        border border-[var(--border)] 
        rounded-[var(--radius-lg)]
        p-5
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {value}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-[var(--success)]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[var(--error)]" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'
                }`}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-[var(--text-muted)]">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
