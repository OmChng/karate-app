import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AboutSection } from './components/about-section';
import { AcademiesSection } from './components/academies-section';
import { ContactCtaSection } from './components/contact-cta-section';
import { HeroSection } from './components/hero-section';
import { InstructorsSection } from './components/instructors-section';
import { NewsSection } from './components/news-section';
import { ProgramsSection } from './components/programs-section';
import { PublicFooter } from './components/public-footer';
import { PublicHeader } from './components/public-header';
import { StickyScrollStorySection } from './components/sticky-scroll-story-section';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'publicHome.metadata' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PublicHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="public-site min-h-screen bg-[#0b0f14] text-white">
      <PublicHeader />
      <main id="main">
        <HeroSection />
        <StickyScrollStorySection />
        <AboutSection />
        <AcademiesSection />
        <ProgramsSection />
        <InstructorsSection />
        <NewsSection />
        <ContactCtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
