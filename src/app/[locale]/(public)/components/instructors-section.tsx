import { Medal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AnimatedSectionHeading, StaggerContainer, StaggerItem } from '@/components/motion/reveal';

// Static public placeholder content until instructor profiles are exposed publicly.
const INSTRUCTORS = ['chief', 'formation', 'operations'] as const;

export function InstructorsSection() {
  const t = useTranslations('publicHome.instructors');

  return (
    <section className="public-light-section bg-[#f7f8fa] py-16 text-[#10131a] dark:bg-[#10131a] dark:text-white md:py-20">
      <div className="container">
        <AnimatedSectionHeading
          className="max-w-3xl"
          eyebrow={t('eyebrow')}
          title={t('title')}
          body={t('body')}
          eyebrowClassName="text-sm font-bold uppercase tracking-[0.18em] text-primary"
          titleClassName="public-light-heading mt-4 text-4xl font-black leading-tight tracking-normal md:text-5xl"
          bodyClassName="public-light-copy mt-5 text-lg leading-8 text-[#4b5563] dark:text-white/70"
        />
        <StaggerContainer className="mt-10 grid gap-5 md:grid-cols-3" staggerDelay={0.08}>
          {INSTRUCTORS.map((key) => (
            <StaggerItem key={key} hover="lift">
              <article className="public-light-panel h-full border border-[#e5e7eb] bg-white p-5 shadow-[var(--shadow-card)] dark:border-white/[0.12] dark:bg-[#171b24]">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#10131a] text-white">
                  <Medal className="h-7 w-7 text-primary" aria-hidden />
                </div>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-primary">
                  {t(`items.${key}.role`)}
                </p>
                <h3 className="public-light-heading mt-2 text-xl font-black text-[#10131a] dark:text-white">
                  {t(`items.${key}.name`)}
                </h3>
                <p className="public-light-muted mt-3 text-sm leading-6 text-[#4b5563] dark:text-white/[0.68]">
                  {t(`items.${key}.body`)}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
