import type { ReactNode } from 'react';
import { redirect } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { MobileNavTrigger } from '@/components/nav/mobile-nav-trigger';
import { SidebarDesktop } from '@/components/nav/sidebar';
import { BottomNav } from '@/components/nav/bottom-nav';
import { PageTransition } from '@/components/motion/page-transition';
import { canAccessFinance } from '@/lib/rbac';

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const user = session?.user;
  if (!user) {
    redirect({ href: '/login', locale });
  }
  const userName = user?.name ?? '';
  const canViewFinance = canAccessFinance(session);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <SidebarDesktop user={{ name: userName }} canViewFinance={canViewFinance} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-3 z-40 md:hidden">
          <MobileNavTrigger userName={userName} canViewFinance={canViewFinance} />
        </div>
        <main
          id="main"
          className="management-paper-surface min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-20 md:pb-0"
        >
          <div className="container py-4 sm:py-6">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
