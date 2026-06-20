import type { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {children}
    </div>
  );
}
