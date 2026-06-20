import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type StatusBadgeVariant =
  | 'neutral'
  | 'good'
  | 'success'
  | 'risk'
  | 'warning'
  | 'riskStrong'
  | 'warningStrong'
  | 'critical'
  | 'danger'
  | 'info'
  | 'special'
  | 'accent';

export const statusBadgeVariantClass: Record<StatusBadgeVariant, string> = {
  neutral: 'border-border bg-secondary text-secondary-foreground',
  good: 'border-success-border bg-success-subtle text-success-subtle-foreground',
  success: 'border-success-border bg-success-subtle text-success-subtle-foreground',
  risk: 'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  warning: 'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  riskStrong:
    'border-warningStrong-border bg-warningStrong-subtle text-warningStrong-subtle-foreground',
  warningStrong:
    'border-warningStrong-border bg-warningStrong-subtle text-warningStrong-subtle-foreground',
  critical: 'border-danger-border bg-danger-subtle text-danger-subtle-foreground',
  danger: 'border-danger-border bg-danger-subtle text-danger-subtle-foreground',
  info: 'border-info-border bg-info-subtle text-info-subtle-foreground',
  special: 'border-accent-border bg-accent-subtle text-accent-subtle-foreground',
  accent: 'border-accent-border bg-accent-subtle text-accent-subtle-foreground',
};

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
}

export function StatusBadge({
  variant = 'neutral',
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-xs font-medium leading-none',
        statusBadgeVariantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
