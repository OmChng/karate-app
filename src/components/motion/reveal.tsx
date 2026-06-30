'use client';

import { Children, type ReactNode, useMemo, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'motion/react';

const PREMIUM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface ViewportOptions {
  once?: boolean;
  amount?: number | 'some' | 'all';
  margin?: string;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  blur?: number;
  once?: boolean;
  amount?: ViewportOptions['amount'];
}

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.78,
  y = 40,
  blur = 8,
  once = true,
  amount = 0.28,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = useMemo(
    () => revealVariants({ delay, duration, y, blur }),
    [blur, delay, duration, y],
  );

  return (
    <motion.div
      data-public-motion="reveal"
      className={className}
      initial={shouldReduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once, amount }}
      variants={shouldReduceMotion ? reducedRevealVariants : variants}
    >
      {children}
    </motion.div>
  );
}

export function InitialReveal({
  children,
  className,
  delay = 0,
  duration = 0.72,
  y = 28,
  blur = 6,
}: Omit<RevealProps, 'once' | 'amount'>) {
  const shouldReduceMotion = useReducedMotion();
  const variants = useMemo(
    () => revealVariants({ delay, duration, y, blur }),
    [blur, delay, duration, y],
  );

  return (
    <motion.div
      data-public-motion="initial-reveal"
      className={className}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      variants={shouldReduceMotion ? reducedRevealVariants : variants}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerDelay?: number;
  trigger?: 'viewport' | 'load';
  once?: boolean;
  amount?: ViewportOptions['amount'];
}

export function StaggerContainer({
  children,
  className,
  delayChildren = 0,
  staggerDelay = 0.07,
  trigger = 'viewport',
  once = true,
  amount = 0.22,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = useMemo<Variants>(
    () => ({
      hidden: {},
      visible: {
        transition: {
          delayChildren,
          staggerChildren: staggerDelay,
        },
      },
    }),
    [delayChildren, staggerDelay],
  );

  return (
    <motion.div
      data-public-motion="stagger-container"
      className={className}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate={trigger === 'load' ? 'visible' : undefined}
      whileInView={trigger === 'viewport' ? 'visible' : undefined}
      viewport={trigger === 'viewport' ? { once, amount } : undefined}
      variants={shouldReduceMotion ? reducedContainerVariants : variants}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  y?: number;
  scale?: number;
  blur?: number;
  duration?: number;
  hover?: 'lift' | 'none';
}

export function StaggerItem({
  children,
  className,
  y = 36,
  scale = 0.975,
  blur = 7,
  duration = 0.68,
  hover = 'none',
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = useMemo(
    () => cardRevealVariants({ y, scale, blur, duration }),
    [blur, duration, scale, y],
  );

  return (
    <motion.div
      data-public-motion="stagger-item"
      className={className}
      variants={shouldReduceMotion ? reducedRevealVariants : variants}
      whileHover={
        hover === 'lift' && !shouldReduceMotion
          ? {
              y: -3,
              scale: 1.008,
              transition: { duration: 0.18, ease: PREMIUM_EASE },
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}

interface AnimatedSectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  titleId?: string;
}

export function AnimatedSectionHeading({
  eyebrow,
  title,
  body,
  className,
  eyebrowClassName,
  titleClassName,
  bodyClassName,
  titleId,
}: AnimatedSectionHeadingProps) {
  return (
    <StaggerContainer className={className} staggerDelay={0.09} amount={0.32}>
      {eyebrow ? (
        <StaggerItem y={24} blur={5} duration={0.58}>
          <p className={eyebrowClassName}>{eyebrow}</p>
        </StaggerItem>
      ) : null}
      <StaggerItem y={34} blur={7}>
        <h2 id={titleId} className={titleClassName}>
          {title}
        </h2>
      </StaggerItem>
      {body ? (
        <StaggerItem y={28} blur={5} duration={0.62}>
          <p className={bodyClassName}>{body}</p>
        </StaggerItem>
      ) : null}
    </StaggerContainer>
  );
}

interface HeroTitleRevealProps {
  text: string;
  className?: string;
}

export function HeroTitleReveal({ text, className }: HeroTitleRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const segments = splitHeroTitle(text);

  return (
    <motion.h1
      data-public-motion="hero-title"
      className={className}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: 0.12,
            staggerChildren: 0.075,
          },
        },
      }}
    >
      {segments.map((segment) => (
        <motion.span
          key={segment}
          className="block"
          variants={
            shouldReduceMotion
              ? reducedRevealVariants
              : {
                  hidden: { opacity: 0, y: 34, filter: 'blur(8px)' },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.72, ease: PREMIUM_EASE },
                  },
                }
          }
        >
          {segment}
        </motion.span>
      ))}
    </motion.h1>
  );
}

interface ParallaxElementProps {
  children: ReactNode;
  className?: string;
  distance?: number;
  delay?: number;
}

export function ParallaxElement({
  children,
  className,
  distance = 20,
  delay = 0.18,
}: ParallaxElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);

  return (
    <motion.div
      ref={ref}
      data-public-motion="parallax"
      className={className}
      style={{ y: shouldReduceMotion ? 0 : y }}
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.975, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.84, ease: PREMIUM_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function MotionChildSequence({
  children,
  className,
  delayChildren = 0,
  staggerDelay = 0.08,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerDelay?: number;
}) {
  return (
    <StaggerContainer
      className={className}
      trigger="load"
      delayChildren={delayChildren}
      staggerDelay={staggerDelay}
    >
      {Children.map(children, (child) => (
        <StaggerItem y={26} blur={5}>
          {child}
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

function revealVariants({
  delay,
  duration,
  y,
  blur,
}: {
  delay: number;
  duration: number;
  y: number;
  blur: number;
}): Variants {
  return {
    hidden: {
      opacity: 0,
      y,
      filter: `blur(${blur}px)`,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        delay,
        duration,
        ease: PREMIUM_EASE,
      },
    },
  };
}

function cardRevealVariants({
  y,
  scale,
  blur,
  duration,
}: {
  y: number;
  scale: number;
  blur: number;
  duration: number;
}): Variants {
  return {
    hidden: {
      opacity: 0,
      y,
      scale,
      filter: `blur(${blur}px)`,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration,
        ease: PREMIUM_EASE,
      },
    },
  };
}

const reducedRevealVariants: Variants = {
  hidden: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.01 },
  },
};

const reducedContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { duration: 0.01 } },
};

function splitHeroTitle(text: string) {
  const commaIndex = text.indexOf(',');
  if (commaIndex === -1) return [text];

  return [text.slice(0, commaIndex + 1).trim(), text.slice(commaIndex + 1).trim()].filter(Boolean);
}

export { PREMIUM_EASE };
