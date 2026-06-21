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
  signal: 'border-border bg-card text-card-foreground',
  brand: 'border-border bg-card text-card-foreground',
  primary: 'border-border bg-card text-card-foreground',
  good: 'border-border bg-card text-card-foreground',
  success: 'border-border bg-card text-card-foreground',
  risk: 'border-border bg-card text-card-foreground',
  warning: 'border-border bg-card text-card-foreground',
  critical: 'border-border bg-card text-card-foreground',
  danger: 'border-border bg-card text-card-foreground',
  info: 'border-border bg-card text-card-foreground',
  special: 'border-border bg-card text-card-foreground',
  accent: 'border-border bg-card text-card-foreground',
};

const metricAccentColor: Record<MetricTone, string> = {
  neutral: 'hsl(var(--foreground))',
  signal: 'hsl(var(--primary))',
  brand: 'hsl(var(--primary))',
  primary: 'hsl(var(--primary))',
  good: 'hsl(var(--success))',
  success: 'hsl(var(--success))',
  risk: 'hsl(var(--warning))',
  warning: 'hsl(var(--warning))',
  critical: 'hsl(var(--danger))',
  danger: 'hsl(var(--danger))',
  info: 'hsl(var(--info))',
  special: 'hsl(var(--accent))',
  accent: 'hsl(var(--accent))',
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
    borderTopColor: metricAccentColor[tone],
  } as CSSProperties;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-t-[3px] p-4 shadow-[var(--shadow-card)]',
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
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--metric-accent)]">
        {value}
      </div>
      {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
    </div>
  );
}
