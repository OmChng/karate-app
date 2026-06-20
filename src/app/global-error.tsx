'use client';

import { useEffect } from 'react';
import esMessages from '../../messages/es.json';

const t = esMessages.common;

/**
 * Last-resort error boundary. Next.js renders this when an error
 * propagates above the root layout itself (i.e. before
 * `src/app/layout.tsx` could mount). Because it replaces the root
 * layout, it MUST own its own `<html>` and `<body>`. Spanish fallback
 * copy is read directly from `messages/es.json` because this fires when
 * the i18n provider is already broken.
 *
 * Do not import anything that depends on a working IntlProvider here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        <main className="container flex min-h-screen flex-col items-center justify-center gap-4 py-16 text-center">
          <h1 className="text-3xl font-bold">{t.error}</h1>
          <p className="max-w-md text-muted-foreground">{t.errorDescription}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              {t.errorId.replace('{id}', '')}
              <code>{error.digest}</code>
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
