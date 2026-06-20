'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { SlidingOverflowText } from './sliding-overflow-text';

export default function ThemeToggleButton({
  showLabel = false,
  className,
  labelClassName,
}: {
  showLabel?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  const t = useTranslations('nav');
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? t('switchToLight') : t('switchToDark');
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={cn(
        'inline-flex h-11 min-w-0 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md border border-transparent text-sm font-medium text-muted-foreground transition-colors duration-fast ease-standard hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        showLabel ? 'px-3' : 'w-11',
        className,
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {showLabel ? (
        <SlidingOverflowText className={labelClassName}>{label}</SlidingOverflowText>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </button>
  );
}
