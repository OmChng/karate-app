import Image from 'next/image';
import { ArrowRight, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  InitialReveal,
  ParallaxElement,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/reveal';
import { AnimatedTypingTitle } from './animated-hero-title';

const HERO_STATS = ['academies', 'families', 'formation'] as const;
const HERO_TITLE_TERMS = ['discipline', 'community', 'excellence'] as const;

export function HeroSection() {
  const t = useTranslations('publicHome');
  const titleTerms = HERO_TITLE_TERMS.map((key) => ({
    key,
    localized: t(`hero.animatedTitle.terms.${key}.localized`),
    japanese: t(`hero.animatedTitle.terms.${key}.japanese`),
    suffix: t(`hero.animatedTitle.terms.${key}.suffix`),
  }));

  return (
    <section className="relative overflow-hidden border-b border-[#e5e7eb] bg-[#f7f8fa] dark:border-white/10 dark:bg-[#0b0f14]">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(228,61,48,0.12),transparent_42%,rgba(24,59,91,0.1))] dark:bg-[linear-gradient(110deg,rgba(228,61,48,0.22),transparent_38%,rgba(24,59,91,0.28))]" />
      <div className="container relative grid gap-10 py-12 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.78fr)] md:items-center md:py-16 lg:gap-14 lg:py-20">
        <div className="max-w-3xl">
          <InitialReveal delay={0.04} y={24} blur={4} duration={0.56}>
            <p className="mb-5 inline-flex rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4b5563] shadow-sm dark:border-white/[0.15] dark:bg-white/[0.08] dark:text-white/70 dark:shadow-none">
              {t('hero.eyebrow')}
            </p>
          </InitialReveal>
          <AnimatedTypingTitle
            finalText={t('hero.title')}
            prefix={t('hero.animatedTitle.prefix')}
            terms={titleTerms}
            className="public-typing-title-hero text-balance text-5xl font-black leading-[0.95] tracking-normal text-[#10131a] dark:text-white md:text-6xl lg:text-7xl"
          />
          <InitialReveal delay={0.3} y={26} blur={5} duration={0.62}>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4b5563] dark:text-white/[0.72] md:text-xl">
              {t('hero.subtitle')}
            </p>
          </InitialReveal>
          <InitialReveal
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            delay={0.42}
            y={24}
            blur={5}
            duration={0.58}
          >
            <a
              href="#academias"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors duration-fast ease-standard hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t('actions.academies')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link
              href="/login"
              locale="es"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#10131a]/20 px-5 text-base font-semibold text-[#10131a] transition-colors duration-fast ease-standard hover:bg-[#10131a]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white"
            >
              {t('actions.login')}
            </Link>
          </InitialReveal>
          <StaggerContainer
            className="mt-10"
            trigger="load"
            delayChildren={0.52}
            staggerDelay={0.055}
          >
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {HERO_STATS.map((key) => (
                <StaggerItem
                  key={key}
                  className="border-l-2 border-primary pl-4"
                  y={24}
                  blur={4}
                  duration={0.52}
                >
                  <dt className="text-sm text-[#6b7280] dark:text-white/60">
                    {t(`hero.stats.${key}.label`)}
                  </dt>
                  <dd className="mt-1 text-2xl font-black text-[#10131a] dark:text-white">
                    {t(`hero.stats.${key}.value`)}
                  </dd>
                </StaggerItem>
              ))}
            </dl>
          </StaggerContainer>
        </div>
        <ParallaxElement className="relative min-h-[420px] overflow-hidden border border-white/[0.12] bg-[#121821] shadow-2xl md:min-h-[560px]">
          <Image
            src="/images/brand/gojukan-menu-bg.png"
            alt={t('hero.visualAlt')}
            fill
            priority
            sizes="(min-width: 1024px) 42vw, (min-width: 768px) 46vw, 100vw"
            className="object-cover opacity-70 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.05),rgba(74,18,16,0.88))]" />
          <div className="absolute right-0 top-8 flex min-h-16 w-3/4 -skew-x-12 items-center bg-primary px-7 text-primary-foreground">
            <div className="skew-x-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">
                {t('hero.visualKicker')}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start gap-4 border border-white/[0.15] bg-[#0b0f14]/[0.78] p-5 backdrop-blur">
              <Building2 className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="text-xl font-black text-white">{t('hero.visualTitle')}</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">{t('hero.visualText')}</p>
              </div>
            </div>
          </div>
        </ParallaxElement>
      </div>
    </section>
  );
}
