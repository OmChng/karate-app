import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { routing, type AppLocale } from '@/i18n/routing';
import { HtmlLangSetter } from '@/components/providers/html-lang-setter';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * Locale layout. `<html>` and `<body>` live in `src/app/layout.tsx`
 * because Next.js 15 requires them in the root layout. This layer is
 * responsible for the i18n provider and the lang-attribute escape
 * hatch (see `HtmlLangSetter`).
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLangSetter locale={locale} />
      <a href="#main" className="skip-link">
        {t('skipToContent')}
      </a>
      {children}
    </NextIntlClientProvider>
  );
}
