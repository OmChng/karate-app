import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export default function ComingSoon({ title, children }: { title: string; children?: ReactNode }) {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 p-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{children ?? t('comingSoon')}</p>
    </div>
  );
}
