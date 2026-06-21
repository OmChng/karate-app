import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { themeScript } from '@/components/providers/theme-script';
import esMessages from '../../messages/es.json';

export const metadata: Metadata = {
  title: { default: esMessages.app.name, template: `%s · ${esMessages.app.name}` },
  description: esMessages.app.tagline,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F8FA' },
    { media: '(prefers-color-scheme: dark)', color: '#10131A' },
  ],
};

/**
 * Next.js 15 requires the root layout to render `<html>` and `<body>`.
 * The default locale is hardcoded here because the product is Spanish-only
 * for end users (see `context/language-and-locale.md`). The `/en/...`
 * maintainer escape hatch updates `document.documentElement.lang`
 * client-side via `HtmlLangSetter` in `[locale]/layout.tsx`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
