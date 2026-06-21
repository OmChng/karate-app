'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTransition } from 'react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const t = useTranslations('nav');

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as 'es' | 'en';
    startTransition(() => {
      router.replace(pathname as never, { locale: next });
    });
  }

  return (
    <label className="text-xs text-muted-foreground">
      <span className="sr-only">{t('language')}</span>
      <select
        value={locale}
        onChange={onChange}
        disabled={pending}
        className="rounded-md border border-input bg-card px-2 py-1 text-xs"
      >
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
