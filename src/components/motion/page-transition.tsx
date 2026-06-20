'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from '@/i18n/routing';

type MotionDirection = 'forward' | 'back' | 'neutral';

function routeDepth(pathname: string) {
  return pathname
    .replace(/^\/(?:es|en)(?=\/|$)/, '')
    .split('/')
    .filter(Boolean).length;
}

function transitionDirection(previousPathname: string, nextPathname: string): MotionDirection {
  const previousDepth = routeDepth(previousPathname);
  const nextDepth = routeDepth(nextPathname);

  if (nextDepth > previousDepth) return 'forward';
  if (nextDepth < previousDepth) return 'back';
  return 'neutral';
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [motionDirection, setMotionDirection] = useState<MotionDirection>('neutral');
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === previousPathname.current) return;

    setMotionDirection(transitionDirection(previousPathname.current, pathname));
    previousPathname.current = pathname;
  }, [pathname]);

  return (
    <div
      key={pathname}
      className="page-transition"
      data-motion-direction={motionDirection}
      data-motion-scope="page"
      data-motion-state="enter"
    >
      {children}
    </div>
  );
}
