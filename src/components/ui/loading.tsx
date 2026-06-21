'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LoadingWithElapsedTimeProps {
  label: string;
  className?: string;
  showAfterMs?: number;
  elapsedAfterMs?: number;
}

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      aria-hidden
    />
  );
}

export function ButtonSpinner({ className }: { className?: string }) {
  return <InlineSpinner className={cn('h-3.5 w-3.5', className)} />;
}

export function LoadingWithElapsedTime({
  label,
  className,
  showAfterMs = 800,
  elapsedAfterMs = 2000,
}: LoadingWithElapsedTimeProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [visible, setVisible] = useState(showAfterMs === 0);

  useEffect(() => {
    const startedAt = performance.now();
    const visibilityTimer = window.setTimeout(() => setVisible(true), showAfterMs);
    const interval = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 100);

    return () => {
      window.clearTimeout(visibilityTimer);
      window.clearInterval(interval);
    };
  }, [showAfterMs]);

  if (!visible) return null;

  const showElapsed = elapsedMs >= elapsedAfterMs;
  const seconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex min-h-11 items-center gap-2 text-sm text-muted-foreground', className)}
    >
      <InlineSpinner className="text-primary" />
      <span>
        {label}
        {showElapsed ? ` ${seconds}s` : ''}
      </span>
    </div>
  );
}

export function PageLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3">
        <div className="h-7 w-52 animate-pulse rounded-md bg-secondary" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-secondary" />
      </div>
      <CardSkeleton />
      <LoadingWithElapsedTime label={label} />
    </div>
  );
}

export function SectionLoading({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
        <div className="h-3 w-full animate-pulse rounded bg-secondary" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
      </div>
      <LoadingWithElapsedTime className="mt-3" label={label} />
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]',
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-md bg-secondary" />
        <div className="h-24 animate-pulse rounded-md bg-secondary md:col-span-2" />
        <div className="h-16 animate-pulse rounded-md bg-secondary" />
        <div className="h-16 animate-pulse rounded-md bg-secondary" />
        <div className="h-16 animate-pulse rounded-md bg-secondary" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="h-11 animate-pulse bg-secondary" />
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-3 px-4 py-3">
            <div className="col-span-2 h-5 animate-pulse rounded bg-secondary" />
            <div className="h-5 animate-pulse rounded bg-secondary" />
            <div className="h-5 animate-pulse rounded bg-secondary" />
            <div className="h-5 animate-pulse rounded bg-secondary" />
            <div className="h-5 animate-pulse rounded bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}
