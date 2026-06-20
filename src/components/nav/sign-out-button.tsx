'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { SlidingOverflowText } from './sliding-overflow-text';

export type SignOutButtonProps = {
  label: string;
  showLabel?: boolean;
  className?: string;
  labelClassName?: string;
};

export function SignOutButton({
  label,
  showLabel = true,
  className,
  labelClassName,
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => signOut({ callbackUrl: '/iniciar-sesion' })}
      className={cn(
        'inline-flex h-11 min-w-0 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md border border-transparent px-3 text-sm font-medium transition-colors duration-fast ease-standard hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {showLabel ? (
        <SlidingOverflowText className={labelClassName}>{label}</SlidingOverflowText>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </button>
  );
}
