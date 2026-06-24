import { useTranslations } from 'next-intl';
import { AnimatedSectionHeading } from '@/components/motion/reveal';
import { AcademyLocator } from './academy-locator';

export function AcademiesSection() {
  const t = useTranslations('publicHome.academies');

  return (
    <section
      id="academias"
      className="public-light-section bg-white py-16 text-[#10131a] dark:bg-[#10131a] dark:text-white md:py-20"
    >
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
        <AcademyLocator />
      </div>
    </section>
  );
}
