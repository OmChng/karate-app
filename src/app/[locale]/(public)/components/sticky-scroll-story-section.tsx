'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  AnimatedSectionHeading,
  PREMIUM_EASE,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/reveal';

const STORY_BEATS = [
  { key: 'discipline', number: '01', enter: [0.06, 0.16], exit: [0.3, 0.38] },
  { key: 'community', number: '02', enter: [0.34, 0.44], exit: [0.6, 0.68] },
  { key: 'excellence', number: '03', enter: [0.62, 0.72], exit: [0.88, 0.96] },
] as const;

export function StickyScrollStorySection() {
  const t = useTranslations('publicHome.story');
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const progressScale = useTransform(scrollYProgress, [0.06, 0.96], [0, 1]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.12, 0.9, 0.98], [0.72, 1, 1, 0]);
  const headingY = useTransform(scrollYProgress, [0, 0.2, 0.9, 0.98], [18, 0, 0, -14]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="public-scroll-story-title"
      className="relative overflow-clip bg-[#0b0f14] py-16 text-white lg:h-[300vh] lg:py-0 motion-reduce:lg:h-auto motion-reduce:lg:py-20"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(228,61,48,0.24),transparent_30%),linear-gradient(180deg,rgba(16,19,26,0),rgba(16,19,26,0.78))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

      <div className="container relative lg:hidden">
        <AnimatedSectionHeading
          titleId="public-scroll-story-title"
          className="max-w-3xl"
          eyebrow={t('eyebrow')}
          title={t('title')}
          body={t('body')}
          eyebrowClassName="text-sm font-bold uppercase tracking-[0.18em] text-primary"
          titleClassName="mt-4 text-4xl font-black leading-tight tracking-normal md:text-5xl"
          bodyClassName="mt-5 text-lg leading-8 text-white/70"
        />
        <StaggerContainer className="mt-10 grid gap-4 md:grid-cols-3" staggerDelay={0.08}>
          {STORY_BEATS.map((beat) => (
            <StaggerItem key={beat.key} hover="lift">
              <StoryCard
                number={beat.number}
                title={t(`beats.${beat.key}.title`)}
                body={t(`beats.${beat.key}.body`)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      <div className="container relative hidden lg:sticky lg:top-[76px] lg:block lg:min-h-[calc(100vh-76px)] motion-reduce:lg:static motion-reduce:lg:min-h-0">
        <div className="grid min-h-[calc(100vh-76px)] items-center gap-12 py-16 lg:grid-cols-[0.88fr_1fr] motion-reduce:min-h-0 motion-reduce:py-0">
          <motion.div
            data-public-motion="story-heading"
            style={{
              opacity: shouldReduceMotion ? 1 : headingOpacity,
              y: shouldReduceMotion ? 0 : headingY,
            }}
            className="max-w-xl"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              {t('eyebrow')}
            </p>
            <h2
              id="public-scroll-story-title"
              className="mt-5 text-5xl font-black leading-[0.95] tracking-normal xl:text-6xl"
            >
              {t('title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/70">{t('body')}</p>
          </motion.div>

          <div className="relative">
            <div className="absolute bottom-8 left-7 top-8 w-px bg-white/12" aria-hidden>
              <motion.div
                className="h-full w-px origin-top bg-primary"
                style={{ scaleY: shouldReduceMotion ? 1 : progressScale }}
              />
            </div>
            <div className="grid gap-5 pl-16">
              {STORY_BEATS.map((beat) => (
                <ScrollStoryBeat
                  key={beat.key}
                  progress={scrollYProgress}
                  enterStart={beat.enter[0]}
                  enterEnd={beat.enter[1]}
                  exitStart={beat.exit[0]}
                  exitEnd={beat.exit[1]}
                  number={beat.number}
                  title={t(`beats.${beat.key}.title`)}
                  body={t(`beats.${beat.key}.body`)}
                  reducedMotion={Boolean(shouldReduceMotion)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScrollStoryBeat({
  progress,
  enterStart,
  enterEnd,
  exitStart,
  exitEnd,
  number,
  title,
  body,
  reducedMotion,
}: {
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  enterStart: number;
  enterEnd: number;
  exitStart: number;
  exitEnd: number;
  number: string;
  title: string;
  body: string;
  reducedMotion: boolean;
}) {
  const opacity = useTransform(
    progress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [0, 1, 1, 0],
  );
  const y = useTransform(progress, [enterStart, enterEnd, exitStart, exitEnd], [42, 0, 0, -28]);
  const scale = useTransform(progress, [enterStart, enterEnd, exitStart, exitEnd], [
    0.965,
    1,
    1,
    0.985,
  ]);
  const filter = useTransform(
    progress,
    [enterStart, enterEnd, exitStart, exitEnd],
    ['blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(5px)'],
  );

  return (
    <motion.div
      data-public-motion="story-beat"
      style={{
        opacity: reducedMotion ? 1 : opacity,
        y: reducedMotion ? 0 : y,
        scale: reducedMotion ? 1 : scale,
        filter: reducedMotion ? 'blur(0px)' : filter,
      }}
      transition={{ duration: 0.72, ease: PREMIUM_EASE }}
    >
      <StoryCard number={number} title={title} body={body} />
    </motion.div>
  );
}

function StoryCard({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <article className="relative overflow-hidden border border-white/[0.12] bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(228,61,48,0.75),transparent)]" />
      <p className="text-sm font-black text-primary">{number}</p>
      <h3 className="mt-5 text-3xl font-black leading-tight text-white">{title}</h3>
      <p className="mt-4 text-sm leading-6 text-white/[0.68]">{body}</p>
    </article>
  );
}
