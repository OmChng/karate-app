import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AnimatedSectionHeading,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/reveal';

// Static public placeholder content until the News module exists.
const NEWS_ITEMS = ['grading', 'seminar', 'community'] as const;

export function NewsSection() {
  const t = useTranslations('publicHome.news');

  return (
    <section
      id="noticias"
      className="public-light-section bg-white py-16 text-[#10131a] dark:bg-[#10131a] dark:text-white md:py-20"
    >
      <div className="container">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <AnimatedSectionHeading
            className="max-w-3xl"
            eyebrow={t('eyebrow')}
            title={t('title')}
            body={t('body')}
            eyebrowClassName="text-sm font-bold uppercase tracking-[0.18em] text-primary"
            titleClassName="public-light-heading mt-4 text-4xl font-black leading-tight tracking-normal md:text-5xl"
            bodyClassName="public-light-copy mt-5 text-lg leading-8 text-[#4b5563] dark:text-white/70"
          />
        </div>
        <StaggerContainer className="mt-10 grid gap-5 lg:grid-cols-3" staggerDelay={0.08}>
          {NEWS_ITEMS.map((key) => (
            <StaggerItem key={key} hover="lift">
              <article className="public-light-panel h-full border border-[#e5e7eb] bg-white p-5 shadow-[var(--shadow-card)] dark:border-white/[0.12] dark:bg-[#171b24]">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                  {t(`items.${key}.date`)}
                </p>
                <h3 className="public-light-heading mt-4 text-2xl font-black leading-tight text-[#10131a] dark:text-white">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="public-light-muted mt-4 text-sm leading-6 text-[#4b5563] dark:text-white/[0.68]">
                  {t(`items.${key}.body`)}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  <span>{t('previewLabel')}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
