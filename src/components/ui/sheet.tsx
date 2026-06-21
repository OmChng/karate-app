'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Lightweight Sheet primitive (Radix Dialog under the hood) used for the
 * mobile drawer and any future filter drawers. Mirrors the shadcn/ui API.
 */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-foreground/45 opacity-0 backdrop-blur-sm transition-opacity duration-normal ease-out data-[state=open]:opacity-100',
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

type Side = 'left' | 'right' | 'top' | 'bottom';

const sideClass: Record<Side, string> = {
  left: 'inset-y-0 left-0 h-full w-[min(16.2rem,calc(100vw-1rem))] border-r data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
  right:
    'inset-y-0 right-0 h-full w-72 border-l data-[state=closed]:translate-x-full data-[state=open]:translate-x-0',
  top: 'inset-x-0 top-0 w-full border-b data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0',
  bottom:
    'inset-x-0 bottom-0 w-full border-t data-[state=closed]:translate-y-full data-[state=open]:translate-y-0',
};

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: Side;
  title?: string;
  closeLabel: string;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, side = 'left', title, closeLabel, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col gap-4 bg-card p-4 opacity-0 shadow-[var(--shadow-popover)] transition-[opacity,transform] duration-normal ease-out data-[state=open]:opacity-100',
        sideClass[side],
        className,
      )}
      {...props}
    >
      <DialogPrimitive.Title className="sr-only">{title ?? closeLabel}</DialogPrimitive.Title>
      {children}
      <DialogPrimitive.Close
        className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-standard hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={closeLabel}
      >
        <X className="h-5 w-5" aria-hidden />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

export { Sheet, SheetTrigger, SheetClose, SheetContent };
