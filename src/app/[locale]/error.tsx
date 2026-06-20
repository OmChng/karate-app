'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="container flex min-h-screen flex-col items-center justify-center gap-4 py-16"
    >
      <h1 className="text-3xl font-bold">{t('error')}</h1>
      <p className="text-muted-foreground">{t('errorDescription')}</p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">{t('errorId', { id: error.digest })}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
      >
        {t('retry')}
      </button>
    </main>
  );
}
