'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition, type FormEvent, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ButtonSpinner } from '@/components/ui/loading';
import { NativeSelect } from '@/components/ui/native-select';
import {
  panelHeaderVariants,
  panelShellClass,
  panelTitleClass,
  tableClass,
  tableHeaderCellClass,
  tableHeaderVariants,
  tableRowClass,
} from '@/components/ui/table-styles';
import { createClassAction } from '@/server/classes/actions';
import { cn } from '@/lib/utils';

interface ClassRow {
  id: string;
  name: string;
  dojoId: string;
  dojoName: string;
  roomId: string | null;
  roomName: string | null;
  scheduleLabel: string;
  capacity: number | null;
  activeMembers: number;
  status: string;
}

interface Props {
  classes: ClassRow[];
  dojos: Array<{ id: string; name: string }>;
  rooms: Array<{ id: string; dojoId: string; dojoName: string; name: string }>;
}

const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const INPUT_CLASS =
  'min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const DAYS = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'] as const;

export default function ClassesClient({ classes, dojos, rooms }: Props) {
  const t = useTranslations('classes');
  const router = useRouter();

  function openClass(id: string) {
    router.push({ pathname: '/classes/[id]', params: { id } } as never);
  }

  function handleClassRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openClass(id);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t('subtitle')}</p>
        </div>
        <CreateClassSheet dojos={dojos} rooms={rooms} />
      </header>

      <section className={panelShellClass}>
        <div className={panelHeaderVariants('accent')}>
          <h2 className={panelTitleClass}>{t('listTitle')}</h2>
        </div>
        {classes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead className={tableHeaderVariants('accent')}>
                <tr>
                  <th scope="col" className={tableHeaderCellClass}>
                    {t('columns.schedule')}
                  </th>
                  <th scope="col" className={tableHeaderCellClass}>
                    {t('columns.name')}
                  </th>
                  <th scope="col" className={tableHeaderCellClass}>
                    {t('columns.dojo')}
                  </th>
                  <th scope="col" className={tableHeaderCellClass}>
                    {t('columns.room')}
                  </th>
                  <th scope="col" className={tableHeaderCellClass}>
                    {t('columns.students')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.map((classRow) => (
                  <tr
                    key={classRow.id}
                    role="link"
                    tabIndex={0}
                    aria-label={t('openDetail', { name: classRow.name })}
                    onClick={() => openClass(classRow.id)}
                    onKeyDown={(event) => handleClassRowKeyDown(event, classRow.id)}
                    className={cn(
                      tableRowClass,
                      'group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    )}
                  >
                    <td className="px-4 py-3 font-medium">{classRow.scheduleLabel}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground group-hover:underline">
                        {classRow.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">{classRow.dojoName}</td>
                    <td className="px-4 py-3">{classRow.roomName ?? t('emptyRoom')}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {classRow.capacity
                        ? t('capacityValue', {
                            count: classRow.activeMembers,
                            capacity: classRow.capacity,
                          })
                        : t('studentCount', { count: classRow.activeMembers })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CreateClassSheet({ dojos, rooms }: { dojos: Props['dojos']; rooms: Props['rooms'] }) {
  const t = useTranslations('classes');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedDojoId, setSelectedDojoId] = useState(dojos[0]?.id ?? '');
  const availableRooms = useMemo(
    () => rooms.filter((room) => room.dojoId === selectedDojoId),
    [rooms, selectedDojoId],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const capacity = String(formData.get('capacity') ?? '');
    setMessage(null);
    startTransition(async () => {
      const res = await createClassAction({
        name: String(formData.get('name') ?? ''),
        dojoId: String(formData.get('dojoId') ?? ''),
        roomId: String(formData.get('roomId') ?? '') || undefined,
        days: formData.getAll('days').map(String) as Array<(typeof DAYS)[number]>,
        startTime: String(formData.get('startTime') ?? ''),
        endTime: String(formData.get('endTime') ?? ''),
        capacity: capacity ? Number(capacity) : undefined,
        notes: String(formData.get('notes') ?? '') || undefined,
      });
      if (!res.ok) {
        setMessage(t(`errors.${res.error ?? 'generic'}`));
        return;
      }
      setMessage(t('created'));
      router.push({ pathname: '/classes/[id]', params: { id: res.data!.id } });
      router.refresh();
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(BUTTON_BASE, 'bg-primary text-primary-foreground hover:bg-primary-hover')}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('new')}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        title={t('new')}
        closeLabel={t('close')}
        className="max-h-[90vh] overflow-y-auto rounded-t-lg sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-96 sm:rounded-none"
      >
        <div className="pr-10">
          <h2 className="text-lg font-semibold">{t('new')}</h2>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('form.name')}
            <input name="name" className={INPUT_CLASS} required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('form.dojo')}
            <NativeSelect
              name="dojoId"
              wrapperClassName="w-full"
              value={selectedDojoId}
              onChange={(event) => setSelectedDojoId(event.currentTarget.value)}
              required
            >
              {dojos.map((dojo) => (
                <option key={dojo.id} value={dojo.id}>
                  {dojo.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('form.room')}
            <NativeSelect name="roomId" wrapperClassName="w-full">
              <option value="">{t('form.roomNone')}</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">{t('form.days')}</legend>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day) => (
                <label
                  key={day}
                  className="flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm"
                >
                  <input name="days" type="checkbox" value={day} className="peer sr-only" />
                  <span className="peer-checked:font-semibold peer-checked:text-primary">
                    {day}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('form.startTime')}
              <input name="startTime" type="time" className={INPUT_CLASS} required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('form.endTime')}
              <input name="endTime" type="time" className={INPUT_CLASS} required />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('form.capacity')}
            <input name="capacity" inputMode="numeric" className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('form.notes')}
            <textarea name="notes" rows={3} className={cn(INPUT_CLASS, 'min-h-24')} />
          </label>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_BASE, 'bg-primary text-primary-foreground hover:bg-primary-hover')}
          >
            {pending && <ButtonSpinner />}
            {pending ? t('saving') : t('save')}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
