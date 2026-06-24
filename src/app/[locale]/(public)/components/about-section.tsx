import { Shield, Sparkles, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AnimatedSectionHeading,
  Reveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/reveal';

const VALUES = ['discipline', 'community', 'growth'] as const;

export function AboutSection() {
  const t = useTranslations('publicHome.about');
  const icons = {
    discipline: Shield,
    community: Users,
    growth: Sparkles,
  };

  return (
    <section
      id="quienes-somos"
      className="public-light-section bg-[#f7f8fa] py-16 text-[#10131a] dark:bg-[#10131a] dark:text-white md:py-20"
    >
      <div className="container grid gap-8 md:grid-cols-[0.85fr_1fr] md:items-start">
        <AnimatedSectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          eyebrowClassName="text-sm font-bold uppercase tracking-[0.18em] text-primary"
          titleClassName="public-light-heading mt-4 text-4xl font-black leading-tight tracking-normal text-[#10131a] dark:text-white md:text-5xl"
        />
        <Reveal className="public-light-copy space-y-5 text-lg leading-8 text-[#4b5563] dark:text-white/70">
          <p>{t('body')}</p>
          <p>{t('supporting')}</p>
        </Reveal>
        <StaggerContainer
          className="grid gap-4 md:col-span-2 md:grid-cols-3"
          staggerDelay={0.08}
        >
          {VALUES.map((key) => {
            const Icon = icons[key];
            return (
              <StaggerItem key={key} hover="lift">
                <article className="public-light-panel h-full border border-[#e5e7eb] bg-white p-5 shadow-[var(--shadow-card)] dark:border-white/[0.12] dark:bg-[#171b24]">
                  <Icon className="h-6 w-6 text-primary" aria-hidden />
                  <h3 className="public-light-heading mt-5 text-xl font-black text-[#10131a] dark:text-white">
                    {t(`values.${key}.title`)}
                  </h3>
                  <p className="public-light-muted mt-3 text-sm leading-6 text-[#4b5563] dark:text-white/[0.68]">
                    {t(`values.${key}.body`)}
                  </p>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
