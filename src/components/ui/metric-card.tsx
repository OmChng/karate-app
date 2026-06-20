import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type MetricTone =
  | 'neutral'
  | 'signal'
  | 'brand'
  | 'primary'
  | 'good'
  | 'success'
  | 'risk'
  | 'warning'
  | 'critical'
  | 'danger'
  | 'info'
  | 'special'
  | 'accent';

const metricToneClass: Record<MetricTone, string> = {
  neutral: 'border-border bg-card text-card-foreground',
  signal:
    'border-primary-border bg-primary-subtle text-primary-subtle-foreground dark:bg-card dark:text-card-foreground',
  brand:
    'border-primary-border bg-primary-subtle text-primary-subtle-foreground dark:bg-card dark:text-card-foreground',
  primary:
    'border-primary-border bg-primary-subtle text-primary-subtle-foreground dark:bg-card dark:text-card-foreground',
  good:
    'border-success-border bg-success-subtle text-success-subtle-foreground dark:bg-card dark:text-card-foreground',
  success:
    'border-success-border bg-success-subtle text-success-subtle-foreground dark:bg-card dark:text-card-foreground',
  risk:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground dark:bg-card dark:text-card-foreground',
  warning:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground dark:bg-card dark:text-card-foreground',
  critical:
    'border-danger-border bg-danger-subtle text-danger-subtle-foreground dark:bg-card dark:text-card-foreground',
  danger:
    'border-danger-border bg-danger-subtle text-danger-subtle-foreground dark:bg-card dark:text-card-foreground',
  info: 'border-info-border bg-info-subtle text-info-subtle-foreground dark:bg-card dark:text-card-foreground',
  special:
    'border-accent-border bg-accent-subtle text-accent-subtle-foreground dark:bg-card dark:text-card-foreground',
  accent:
    'border-accent-border bg-accent-subtle text-accent-subtle-foreground dark:bg-card dark:text-card-foreground',
};

const metricAccentColor: Record<MetricTone, string> = {
  neutral: 'hsl(var(--foreground))',
  signal: 'hsl(var(--primary-border))',
  brand: 'hsl(var(--primary-border))',
  primary: 'hsl(var(--primary-border))',
  good: 'hsl(var(--success-border))',
  success: 'hsl(var(--success-border))',
  risk: 'hsl(var(--warning-border))',
  warning: 'hsl(var(--warning-border))',
  critical: 'hsl(var(--danger-border))',
  danger: 'hsl(var(--danger-border))',
  info: 'hsl(var(--info-border))',
  special: 'hsl(var(--accent-border))',
  accent: 'hsl(var(--accent-border))',
};

interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  detail?: string;
  tone?: MetricTone;
}

export function MetricCard({
  label,
  value,
  detail,
  tone = 'primary',
  className,
  style,
  ...props
}: MetricCardProps) {
  const metricStyle = {
    ...style,
    '--metric-accent': metricAccentColor[tone],
  } as CSSProperties;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-t-[3px] p-4 shadow-sm',
        metricToneClass[tone],
        className,
      )}
      style={metricStyle}
      {...props}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: 'var(--metric-accent)' }}
        aria-hidden
      />
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--metric-accent)]">
        {value}
      </div>
      {detail && <div className="mt-1 text-xs opacity-80">{detail}</div>}
    </div>
  );
}
