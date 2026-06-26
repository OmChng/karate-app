import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty } from '@/lib/rbac';
import { getRoomDetailForManagement } from '@/server/rooms/queries';
import {
  panelHeaderDescriptionClass,
  panelHeaderVariants,
  panelShellClass,
  panelTitleClass,
  tableClass,
  tableHeaderCellClass,
  tableHeaderVariants,
  tableRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('rooms.detail');
  const session = await auth();
  const accessScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  if (isRoleAccessScopeEmpty(accessScope)) notFound();

  const data = await getRoomDetailForManagement(accessScope, id);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/rooms"
        className={cn(
          'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-fit',
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('back')}
      </Link>

      <header className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium text-primary">{data.room.dojoName}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.room.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.room.capacity
            ? t('capacityValue', { capacity: data.room.capacity })
            : t('emptyCapacity')}
        </p>
      </header>

      <section className={panelShellClass}>
        <div className={panelHeaderVariants('accent')}>
          <h2 className={panelTitleClass}>{t('classesTitle')}</h2>
          <p className={panelHeaderDescriptionClass}>
            {t('classCount', { count: data.classes.length })}
          </p>
        </div>
        {data.classes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t('emptyClasses')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead className={tableHeaderVariants('accent')}>
                <tr>
                  <th scope="col" className={tableHeaderCellClass}>
                    {t('columns.schedule')}
                  </th>
                  <th scope="col" className={tableHeaderCellClass}>
                    {t('columns.class')}
                  </th>
                  <th scope="col" className={tableHeaderCellClass}>
                    {t('columns.capacity')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.classes.map((classRow) => (
                  <tr key={classRow.id} className={tableRowClass}>
                    <td className="px-4 py-3 font-medium">{classRow.scheduleLabel}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={{ pathname: '/classes/[id]', params: { id: classRow.id } }}
                        className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {classRow.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {classRow.capacity ?? t('emptyCapacity')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.room.notes && (
        <section className={panelShellClass}>
          <div className={panelHeaderVariants('accent')}>
            <h2 className={panelTitleClass}>{t('notes')}</h2>
          </div>
          <p className="whitespace-pre-wrap p-4 text-sm leading-6">{data.room.notes}</p>
        </section>
      )}
    </div>
  );
}
