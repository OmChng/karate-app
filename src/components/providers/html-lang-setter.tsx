'use client';

import { useEffect } from 'react';

/**
 * Syncs `<html lang>` with the current route locale.
 *
 * The root `app/layout.tsx` hardcodes `<html lang="es">` because Spanish
 * remains the default locale and the management app is Spanish-only (see
 * `context/language-and-locale.md`). For the public `/en` route, this
 * component updates `document.documentElement.lang` after hydration so
 * screen readers report the correct language.
 *
 * `<html>` carries `suppressHydrationWarning` in the root layout, which
 * is what allows this client-side mutation without a hydration mismatch.
 */
export function HtmlLangSetter({ locale }: { locale: string }) {
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);
  return null;
}
