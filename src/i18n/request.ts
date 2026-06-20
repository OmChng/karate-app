import { getRequestConfig } from 'next-intl/server';
import { routing, type AppLocale } from './routing';

function isAppLocale(value: string | undefined): value is AppLocale {
  return value !== undefined && (routing.locales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: AppLocale = isAppLocale(requested) ? requested : routing.defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
