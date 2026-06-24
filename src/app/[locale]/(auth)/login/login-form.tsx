'use client';

import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { ButtonSpinner } from '@/components/ui/loading';

export default function LoginForm({ next, error }: { next?: string; error?: string }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    error ? t('invalidCredentials') : null,
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    const fd = new FormData(e.currentTarget);
    const identifier = String(fd.get('identifier') ?? '');
    const password = String(fd.get('password') ?? '');
    const res = await signIn('credentials', {
      identifier,
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (!res || res.error) {
      setErrorMessage(t('invalidCredentials'));
      return;
    }
    router.push(next && next.startsWith('/') ? (next as never) : '/app');
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
      aria-busy={!hydrated || submitting}
    >
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('loginTitle')}</h1>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-medium">
          {t('identifierLabel')}
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={!hydrated || submitting}
          placeholder={t('identifierPlaceholder')}
          className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          {t('passwordLabel')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={!hydrated || submitting}
          className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!hydrated || submitting}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {submitting && <ButtonSpinner />}
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
