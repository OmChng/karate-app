import Link from 'next/link';
import esMessages from '../../messages/es.json';

const t = esMessages.common;

/**
 * Root-level 404. Renders for paths that don't match any segment
 * (including `[locale]`). Routes inside `[locale]` use
 * `src/app/[locale]/not-found.tsx` instead. It reads the Spanish
 * message file directly because this can render outside the IntlProvider.
 */
export default function RootNotFound() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-3xl font-bold">{t.notFound}</h1>
      <p className="max-w-md text-muted-foreground">{t.notFoundDescription}</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t.goHome}
      </Link>
    </main>
  );
}
