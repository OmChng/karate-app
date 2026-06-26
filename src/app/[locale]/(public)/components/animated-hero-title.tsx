'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

type AnimatedTypingTitleTerm = {
  key: string;
  localized: string;
  japanese: string;
  suffix: string;
};

interface AnimatedTypingTitleProps {
  as?: 'h1' | 'h2';
  finalText: string;
  prefix: string;
  terms: AnimatedTypingTitleTerm[];
  className?: string;
  start?: 'load' | 'view';
}

type TitlePiece =
  | { type: 'text'; key: string; text: string }
  | {
      type: 'term';
      key: string;
      text: string;
      termIndex: number;
      localized: string;
      japanese: string;
      suffix: string;
    };

const TYPE_INTERVAL_MS = 72;
const FINAL_SWAP_DELAY_MS = 520;

export function AnimatedTypingTitle({
  as: Heading = 'h1',
  finalText,
  prefix,
  terms,
  className,
  start = 'load',
}: AnimatedTypingTitleProps) {
  const reducedMotionPreference = useReducedMotion();
  const shouldReduceMotion = reducedMotionPreference === true;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const typingInitializedRef = useRef(false);
  const [shouldStart, setShouldStart] = useState(() => start === 'load' || shouldReduceMotion);
  const pieces = useMemo(() => buildTitlePieces(prefix, terms), [prefix, terms]);
  const typedText = useMemo(() => pieces.map((piece) => piece.text).join(''), [pieces]);
  const localizedLengths = useMemo(
    () => terms.map((term) => `${term.localized}${term.suffix}`.length),
    [terms],
  );
  const [visibleCount, setVisibleCount] = useState(() =>
    shouldReduceMotion ? typedText.length : 0,
  );
  const [localizedVisibleCounts, setLocalizedVisibleCounts] = useState(() =>
    shouldReduceMotion ? localizedLengths : localizedLengths.map(() => 0),
  );
  const initialTypingComplete = visibleCount >= typedText.length;
  const resolved = localizedVisibleCounts.every(
    (count, index) => count >= (localizedLengths[index] ?? 0),
  );
  const currentTermIndex = localizedVisibleCounts.findIndex(
    (count, index) => count < (localizedLengths[index] ?? 0),
  );

  useEffect(() => {
    if (start === 'load' || shouldReduceMotion) {
      setShouldStart(true);
      return;
    }

    const node = headingRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldStart(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldReduceMotion, start]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleCount(typedText.length);
      setLocalizedVisibleCounts(localizedLengths);
      return;
    }
    if (!shouldStart) return;

    if (!typingInitializedRef.current) {
      setVisibleCount(0);
      setLocalizedVisibleCounts(localizedLengths.map(() => 0));
      typingInitializedRef.current = true;
    }

    const interval = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= typedText.length) {
          window.clearInterval(interval);
          return current;
        }

        return current + 1;
      });
    }, TYPE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [localizedLengths, shouldReduceMotion, shouldStart, typedText.length]);

  useEffect(() => {
    if (shouldReduceMotion || !shouldStart || !initialTypingComplete || resolved) return;

    let interval: number | undefined;

    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setLocalizedVisibleCounts((current) => {
          const nextTermIndex = current.findIndex(
            (count, index) => count < (localizedLengths[index] ?? 0),
          );

          if (nextTermIndex === -1) {
            if (interval) window.clearInterval(interval);
            return current;
          }

          const next = [...current];
          next[nextTermIndex] = Math.min(
            (next[nextTermIndex] ?? 0) + 1,
            localizedLengths[nextTermIndex] ?? 0,
          );
          return next;
        });
      }, TYPE_INTERVAL_MS);
    }, FINAL_SWAP_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, [initialTypingComplete, localizedLengths, resolved, shouldReduceMotion, shouldStart]);

  return (
    <Heading
      ref={headingRef}
      aria-label={finalText}
      className={cn('public-typing-title', className)}
      data-public-motion="typing-title"
    >
      <noscript>{finalText}</noscript>
      <span aria-hidden="true">
        {renderTitlePieces({
          pieces,
          visibleCount,
          initialTypingComplete,
          localizedVisibleCounts,
          currentTermIndex,
          resolved,
        })}
        {!initialTypingComplete ? <span className="public-typing-title-cursor" /> : null}
      </span>
    </Heading>
  );
}

function buildTitlePieces(prefix: string, terms: AnimatedTypingTitleTerm[]): TitlePiece[] {
  const pieces: TitlePiece[] = [{ type: 'text', key: 'prefix', text: prefix }];

  for (const [termIndex, term] of terms.entries()) {
    pieces.push({
      type: 'term',
      key: term.key,
      text: `${term.japanese}${term.suffix}`,
      termIndex,
      localized: term.localized,
      japanese: term.japanese,
      suffix: term.suffix,
    });
  }

  return pieces;
}

function renderTitlePieces({
  pieces,
  visibleCount,
  initialTypingComplete,
  localizedVisibleCounts,
  currentTermIndex,
  resolved,
}: {
  pieces: TitlePiece[];
  visibleCount: number;
  initialTypingComplete: boolean;
  localizedVisibleCounts: number[];
  currentTermIndex: number;
  resolved: boolean;
}) {
  let remaining = visibleCount;

  return pieces.map((piece) => {
    if (initialTypingComplete) {
      if (piece.type === 'term') {
        const localizedVisibleCount = resolved
          ? `${piece.localized}${piece.suffix}`.length
          : (localizedVisibleCounts[piece.termIndex] ?? 0);
        const localizedText = `${piece.localized}${piece.suffix}`.slice(0, localizedVisibleCount);
        const isCurrentTerm = !resolved && currentTermIndex === piece.termIndex;

        if (localizedVisibleCount === 0 && !isCurrentTerm) {
          return (
            <span className="public-typing-title-japanese" key={piece.key}>
              {piece.text}
            </span>
          );
        }

        return (
          <span className="public-typing-title-term" key={piece.key}>
            <span className="public-typing-title-term-bg">{piece.japanese}</span>
            <span className="public-typing-title-term-front">
              {localizedText}
              {isCurrentTerm ? <span className="public-typing-title-cursor" /> : null}
            </span>
          </span>
        );
      }

      return <span key={piece.key}>{piece.text}</span>;
    }

    const visibleText = piece.text.slice(0, Math.max(0, remaining));
    remaining -= visibleText.length;

    if (!visibleText) return null;

    if (piece.type === 'term') {
      return (
        <span className="public-typing-title-japanese" key={piece.key}>
          {visibleText}
        </span>
      );
    }

    return <span key={piece.key}>{visibleText}</span>;
  });
}
