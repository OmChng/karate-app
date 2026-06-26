import { Shield, Sparkles, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal, StaggerContainer, StaggerItem } from '@/components/motion/reveal';
import { AnimatedTypingTitle } from './animated-hero-title';

const VALUES = ['discipline', 'community', 'growth'] as const;
const ABOUT_TITLE_TERMS = ['structure', 'respect', 'growth'] as const;

export function AboutSection() {
  const t = useTranslations('publicHome.about');
  const titleTerms = ABOUT_TITLE_TERMS.map((key) => ({
    key,
    localized: t(`animatedTitle.terms.${key}.localized`),
    japanese: t(`animatedTitle.terms.${key}.japanese`),
    suffix: t(`animatedTitle.terms.${key}.suffix`),
  }));
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
        <StaggerContainer staggerDelay={0.09} amount={0.32}>
          <StaggerItem y={24} blur={5} duration={0.58}>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              {t('eyebrow')}
            </p>
          </StaggerItem>
          <StaggerItem y={34} blur={7}>
            <AnimatedTypingTitle
              as="h2"
              finalText={t('title')}
              prefix={t('animatedTitle.prefix')}
              terms={titleTerms}
              start="view"
              className="public-light-heading public-typing-title-section mt-4 text-4xl font-black leading-tight tracking-normal text-[#10131a] dark:text-white md:text-5xl"
            />
          </StaggerItem>
        </StaggerContainer>
        <Reveal className="public-light-copy space-y-5 text-lg leading-8 text-[#4b5563] dark:text-white/70">
          <p>{t('body')}</p>
          <p>{t('supporting')}</p>
        </Reveal>
        <StaggerContainer className="grid gap-4 md:col-span-2 md:grid-cols-3" staggerDelay={0.08}>
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
