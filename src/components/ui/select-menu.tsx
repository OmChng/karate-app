'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SelectMenuOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  value: string;
  options: SelectMenuOption[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  contentMinWidth?: string;
  compact?: boolean;
  startAdornment?: ReactNode;
}

export function SelectMenu({
  value,
  options,
  onValueChange,
  ariaLabel,
  disabled,
  placeholder,
  className,
  contentMinWidth = '13.75rem',
  compact = false,
  startAdornment,
}: SelectMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? placeholder ?? options[0]?.label ?? '';

  const updateTriggerWidth = useCallback(() => {
    const width = triggerRef.current?.getBoundingClientRect().width ?? 0;
    setTriggerWidth(Math.ceil(width));
  }, []);

  useEffect(() => {
    updateTriggerWidth();
    const node = triggerRef.current;
    if (!node) return;
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateTriggerWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, [updateTriggerWidth]);

  return (
    <DropdownMenu.Root onOpenChange={(open) => open && updateTriggerWidth()}>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          ref={triggerRef}
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            'select-menu-trigger inline-flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-md border px-3 text-base shadow-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
            compact ? 'min-h-11 px-2.5' : 'min-h-12',
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {startAdornment}
            <span className="min-w-0 truncate text-left">{selectedLabel}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="select-menu-content z-[80] overflow-hidden rounded-md border p-1 shadow-2xl"
          style={
            {
              '--select-menu-trigger-width': `${triggerWidth}px`,
              '--select-menu-min-width': contentMinWidth,
            } as CSSProperties
          }
        >
          <DropdownMenu.RadioGroup value={value} onValueChange={onValueChange}>
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="select-menu-item relative flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 pr-9 text-base font-medium outline-none transition-colors duration-fast ease-standard data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                <DropdownMenu.ItemIndicator className="absolute right-3 inline-flex h-5 w-5 items-center justify-center">
                  <Check className="h-4 w-4" aria-hidden />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
