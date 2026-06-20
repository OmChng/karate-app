import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <span className={cn('relative inline-flex min-w-0', wrapperClassName)}>
        <select ref={ref} className={cn('select-control', className)} {...props}>
          {children}
        </select>
        <ChevronDown
          className="select-chevron pointer-events-none absolute right-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2"
          aria-hidden
        />
      </span>
    );
  },
);

NativeSelect.displayName = 'NativeSelect';
