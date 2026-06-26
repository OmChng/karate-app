import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/routing';
import LoginForm from './login-form';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('loginTitle') };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const search = (await searchParams) ?? {};

  const session = await auth();
  if (session?.user) {
    const safeNext =
      search.next && search.next.startsWith('/') && !search.next.startsWith('//')
        ? search.next
        : '/app';
    redirect({ href: safeNext as never, locale });
  }

  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <main
      id="main"
      className="container flex min-h-screen flex-col items-center justify-center py-16"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="p-8">
          <div className="brand-mark mx-auto mb-6 h-10 w-10 rounded-lg" aria-hidden />
          <LoginForm next={search.next} error={search.error} />
          <div className="mt-6 border-t border-border pt-5 text-center">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-input px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('returnToPublicSite')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
