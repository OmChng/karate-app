import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { StaggerContainer, StaggerItem } from '@/components/motion/reveal';

export function ContactCtaSection() {
  const t = useTranslations('publicHome.contact');

  return (
    <section
      id="contacto"
      className="bg-white py-16 text-[#10131a] dark:bg-[#0b0f14] dark:text-white md:py-20"
    >
      <div className="container">
        <StaggerContainer
          className="grid gap-8 overflow-hidden border border-[#10131a] bg-[#10131a] p-6 text-white shadow-2xl shadow-[#10131a]/15 dark:border-white/[0.12] dark:bg-white/[0.06] dark:shadow-none md:grid-cols-[1fr_auto] md:items-center md:p-10"
          staggerDelay={0.1}
          amount={0.35}
        >
          <StaggerItem y={34} blur={7}>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              {t('eyebrow')}
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-5xl">
              {t('title')}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">{t('body')}</p>
          </StaggerItem>
          <StaggerItem className="flex flex-col gap-3 sm:flex-row md:flex-col" y={28} blur={5}>
            <a
              href="#academias"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors duration-fast ease-standard hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={t('academyAria')}
            >
              {t('academyCta')}
            </a>
            <Link
              href="/login"
              locale="es"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/20 px-5 text-base font-semibold text-white transition-colors duration-fast ease-standard hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t('loginCta')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
}
