'use client';

import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function SlidingOverflowText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [pan, setPan] = useState(0);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      setPan(Math.max(0, inner.scrollWidth - outer.clientWidth));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [children]);

  return (
    <span
      ref={outerRef}
      className={cn('sliding-overflow-text min-w-0 overflow-hidden whitespace-nowrap', className)}
      data-overflow={pan > 0 ? 'true' : undefined}
      style={{ '--sliding-overflow-pan': `${pan}px` } as CSSProperties}
    >
      <span ref={innerRef} className="sliding-overflow-text-inner inline-block pr-3">
        {children}
      </span>
    </span>
  );
}
