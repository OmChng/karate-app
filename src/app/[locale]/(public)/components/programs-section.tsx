import { Award, CalendarDays, GraduationCap, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AnimatedSectionHeading,
  Reveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/reveal';

const PROGRAMS = [
  { key: 'children', Icon: Users },
  { key: 'youthAdults', Icon: GraduationCap },
  { key: 'ranks', Icon: Award },
  { key: 'seminars', Icon: CalendarDays },
] as const;

export function ProgramsSection() {
  const t = useTranslations('publicHome.programs');

  return (
    <section
      id="programas"
      className="bg-[#f7f8fa] py-16 text-[#10131a] dark:bg-[#10131a] dark:text-white md:py-20"
    >
      <div className="container">
        <div className="grid gap-6 md:grid-cols-[0.72fr_1fr] md:items-end">
          <AnimatedSectionHeading
            eyebrow={t('eyebrow')}
            title={t('title')}
            eyebrowClassName="text-sm font-bold uppercase tracking-[0.18em] text-primary"
            titleClassName="mt-4 text-4xl font-black leading-tight tracking-normal text-[#10131a] dark:text-white md:text-5xl"
          />
          <Reveal>
            <p className="text-lg leading-8 text-[#4b5563] dark:text-white/70">{t('body')}</p>
          </Reveal>
        </div>
        <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map(({ key, Icon }) => (
            <StaggerItem key={key} hover="lift">
              <article className="h-full border border-[#10131a] bg-[#10131a] p-5 text-white shadow-[var(--shadow-card)] dark:border-white/[0.12] dark:bg-white/[0.06] dark:shadow-none">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-6 text-xl font-black text-white">{t(`items.${key}.title`)}</h3>
                <p className="mt-3 text-sm leading-6 text-white/[0.68]">{t(`items.${key}.body`)}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
