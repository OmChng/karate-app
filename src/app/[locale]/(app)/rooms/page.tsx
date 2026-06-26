import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { listRoomsForManagement } from '@/server/rooms/queries';
import {
  panelHeaderDescriptionClass,
  panelHeaderVariants,
  panelShellClass,
  tableClass,
  tableHeaderCellClass,
  tableHeaderVariants,
  tableRowClass,
} from '@/components/ui/table-styles';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('rooms');
  const session = await auth();
  const accessScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  if (isRoleAccessScopeEmpty(accessScope)) notFound();

  const roomRows = await listRoomsForManagement(accessScope);

  return (
    <section className={panelShellClass}>
      <div className={panelHeaderVariants('accent')}>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className={panelHeaderDescriptionClass}>{t('subtitle')}</p>
      </div>
      {roomRows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={tableHeaderVariants('accent')}>
              <tr>
                <th scope="col" className={tableHeaderCellClass}>
                  {t('columns.room')}
                </th>
                <th scope="col" className={tableHeaderCellClass}>
                  {t('columns.dojo')}
                </th>
                <th scope="col" className={tableHeaderCellClass}>
                  {t('columns.capacity')}
                </th>
                <th scope="col" className={tableHeaderCellClass}>
                  {t('columns.classes')}
                </th>
                <th scope="col" className={tableHeaderCellClass}>
                  {t('columns.status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {roomRows.map((room) => (
                <tr key={room.id} className={tableRowClass}>
                  <td className="px-4 py-3">
                    <Link
                      href={{ pathname: '/rooms/[id]', params: { id: room.id } }}
                      className="group inline-flex min-h-11 items-center gap-2 rounded-md font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="group-hover:underline">{room.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </Link>
                  </td>
                  <td className="px-4 py-3">{room.dojoName}</td>
                  <td className="px-4 py-3 tabular-nums">{room.capacity ?? t('emptyCapacity')}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {t('classCount', { count: room.classCount })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex min-h-8 items-center rounded-md px-2 text-xs font-semibold',
                        room.active
                          ? 'bg-success-subtle text-success-subtle-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {room.active ? t('status.active') : t('status.inactive')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
