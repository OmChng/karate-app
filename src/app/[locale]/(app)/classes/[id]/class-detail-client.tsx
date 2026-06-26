'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { ArrowLeft, Edit, Trash2, UserPlus } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ButtonSpinner } from '@/components/ui/loading';
import { NativeSelect } from '@/components/ui/native-select';
import {
  panelHeaderDescriptionClass,
  panelHeaderVariants,
  panelShellClass,
  panelTitleClass,
} from '@/components/ui/table-styles';
import {
  assignMemberToClassAction,
  endMemberClassAssignmentAction,
  softDeleteClassAction,
  updateClassAction,
} from '@/server/classes/actions';
import { cn } from '@/lib/utils';
import { getRankIndicatorBackground } from '@/lib/rank-visuals';
import { normalizeClassDays } from '@/lib/class-schedule';

interface RosterMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarFileKey: string | null;
  currentRankName: string | null;
  currentRankColor: string | null;
  currentRankLevel: number | null;
  status: string;
}

interface AssignableMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  classRow: {
    id: string;
    name: string;
    dojoId: string;
    dojoName: string;
    roomId: string | null;
    roomName: string | null;
    startsAt: Date | string;
    endsAt: Date | string;
    recurrenceRule: string | null;
    scheduleLabel: string;
    capacity: number | null;
    status: string;
    notes: string | null;
  };
  dojos: Array<{ id: string; name: string }>;
  rooms: Array<{ id: string; dojoId: string; dojoName: string; name: string }>;
  roster: RosterMember[];
  assignableMembers: AssignableMember[];
}

const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const INPUT_CLASS =
  'min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const DAYS = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'] as const;

export default function ClassDetailClient({
  classRow,
  dojos,
  rooms,
  roster,
  assignableMembers,
}: Props) {
  const t = useTranslations('classes.detail');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const memberId = String(formData.get('memberId') ?? '');
    setMessage(null);
    startTransition(async () => {
      const res = await assignMemberToClassAction({ memberId, classId: classRow.id });
      if (!res.ok) {
        setMessage(t(`errors.${res.error ?? 'generic'}`));
        return;
      }
      setMessage(t('assigned'));
      router.refresh();
    });
  }

  function remove(memberId: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await endMemberClassAssignmentAction({ memberId, classId: classRow.id });
      if (!res.ok) {
        setMessage(t(`errors.${res.error ?? 'generic'}`));
        return;
      }
      setMessage(t('removed'));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/classes"
        className={cn(
          BUTTON_BASE,
          'w-full border border-input bg-card text-foreground hover:bg-secondary md:w-fit',
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('back')}
      </Link>

      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{classRow.scheduleLabel}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{classRow.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {classRow.dojoName} · {classRow.roomName ?? t('emptyRoom')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <EditClassSheet classRow={classRow} dojos={dojos} rooms={rooms} />
            <DeleteClassButton classRow={classRow} onMessage={setMessage} />
          </div>
        </div>
      </header>

      <section className={panelShellClass}>
        <div className={panelHeaderVariants('accent')}>
          <h2 className={panelTitleClass}>{t('roster')}</h2>
          <p className={panelHeaderDescriptionClass}>
            {classRow.capacity
              ? t('capacityValue', { count: roster.length, capacity: classRow.capacity })
              : t('studentCount', { count: roster.length })}
          </p>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('emptyRoster')}</p>
          ) : (
            roster.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-md border border-border p-3 md:flex-row md:items-center md:justify-between"
              >
                <Link
                  href={{ pathname: '/members/[id]', params: { id: member.id } }}
                  className="group -m-2 flex min-h-14 flex-1 items-center gap-3 rounded-md p-2 transition-colors duration-fast ease-standard hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar member={member} />
                  <div className="min-w-0">
                    <div className="truncate font-medium group-hover:underline">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <RankText
                        color={member.currentRankColor}
                        level={member.currentRankLevel}
                        name={member.currentRankName}
                        fallback={t('emptyRank')}
                      />
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(member.id)}
                  className={cn(BUTTON_BASE, 'border border-border hover:bg-secondary')}
                >
                  {pending && <ButtonSpinner />}
                  {t('remove')}
                </button>
              </div>
            ))
          )}

          {assignableMembers.length > 0 && (
            <form
              onSubmit={assign}
              className="flex flex-col gap-2 border-t border-border pt-3 md:flex-row"
            >
              <NativeSelect name="memberId" wrapperClassName="flex-1" required>
                {assignableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.lastName}, {member.firstName}
                  </option>
                ))}
              </NativeSelect>
              <button
                type="submit"
                disabled={pending}
                className={cn(
                  BUTTON_BASE,
                  'bg-primary text-primary-foreground hover:bg-primary-hover',
                )}
              >
                {pending ? <ButtonSpinner /> : <UserPlus className="h-4 w-4" aria-hidden />}
                {t('assign')}
              </button>
            </form>
          )}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </section>

      {classRow.notes && (
        <section className={panelShellClass}>
          <div className={panelHeaderVariants('accent')}>
            <h2 className={panelTitleClass}>{t('notes')}</h2>
          </div>
          <p className="whitespace-pre-wrap p-4 text-sm leading-6">{classRow.notes}</p>
        </section>
      )}
    </div>
  );
}

function EditClassSheet({
  classRow,
  dojos,
  rooms,
}: {
  classRow: Props['classRow'];
  dojos: Props['dojos'];
  rooms: Props['rooms'];
}) {
  const t = useTranslations('classes.detail');
  const tClasses = useTranslations('classes');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const selectedDays = normalizeClassDays(classRow.recurrenceRule);
  const [selectedDojoId, setSelectedDojoId] = useState(classRow.dojoId);
  const [selectedRoomId, setSelectedRoomId] = useState(classRow.roomId ?? '');
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
      const res = await updateClassAction(classRow.id, {
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
      setMessage(t('updated'));
      router.refresh();
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className={cn(BUTTON_BASE, 'border border-input hover:bg-secondary')}>
          <Edit className="h-4 w-4" aria-hidden />
          {t('edit')}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        title={t('edit')}
        closeLabel={tClasses('close')}
        className="max-h-[90vh] overflow-y-auto rounded-t-lg sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-96 sm:rounded-none"
      >
        <div className="pr-10">
          <h2 className="text-lg font-semibold">{t('edit')}</h2>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {tClasses('form.name')}
            <input name="name" className={INPUT_CLASS} defaultValue={classRow.name} required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {tClasses('form.dojo')}
            <NativeSelect
              name="dojoId"
              wrapperClassName="w-full"
              value={selectedDojoId}
              onChange={(event) => {
                const dojoId = event.currentTarget.value;
                setSelectedDojoId(dojoId);
                if (!rooms.some((room) => room.dojoId === dojoId && room.id === selectedRoomId)) {
                  setSelectedRoomId('');
                }
              }}
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
            {tClasses('form.room')}
            <NativeSelect
              name="roomId"
              wrapperClassName="w-full"
              value={selectedRoomId}
              onChange={(event) => setSelectedRoomId(event.currentTarget.value)}
            >
              <option value="">{tClasses('form.roomNone')}</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">{tClasses('form.days')}</legend>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day) => (
                <label
                  key={day}
                  className="flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm"
                >
                  <input
                    name="days"
                    type="checkbox"
                    value={day}
                    defaultChecked={selectedDays.includes(day)}
                    className="peer sr-only"
                  />
                  <span className="peer-checked:font-semibold peer-checked:text-primary">
                    {day}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {tClasses('form.startTime')}
              <input
                name="startTime"
                type="time"
                className={INPUT_CLASS}
                defaultValue={timeInputValue(classRow.startsAt)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {tClasses('form.endTime')}
              <input
                name="endTime"
                type="time"
                className={INPUT_CLASS}
                defaultValue={timeInputValue(classRow.endsAt)}
                required
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {tClasses('form.capacity')}
            <input
              name="capacity"
              inputMode="numeric"
              className={INPUT_CLASS}
              defaultValue={classRow.capacity ?? ''}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {tClasses('form.notes')}
            <textarea
              name="notes"
              rows={3}
              className={cn(INPUT_CLASS, 'min-h-24')}
              defaultValue={classRow.notes ?? ''}
            />
          </label>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_BASE, 'bg-primary text-primary-foreground hover:bg-primary-hover')}
          >
            {pending && <ButtonSpinner />}
            {pending ? tClasses('saving') : t('saveChanges')}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function DeleteClassButton({
  classRow,
  onMessage,
}: {
  classRow: Props['classRow'];
  onMessage: (message: string | null) => void;
}) {
  const t = useTranslations('classes.detail');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(t('deleteConfirm', { name: classRow.name }))) return;
    onMessage(null);
    startTransition(async () => {
      const res = await softDeleteClassAction(classRow.id);
      if (!res.ok) {
        onMessage(t(`errors.${res.error ?? 'generic'}`));
        return;
      }
      router.push('/classes');
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onDelete}
      className={cn(BUTTON_BASE, 'border border-danger text-danger hover:bg-danger-subtle')}
    >
      {pending ? <ButtonSpinner /> : <Trash2 className="h-4 w-4" aria-hidden />}
      {t('delete')}
    </button>
  );
}

function Avatar({ member }: { member: RosterMember }) {
  const src = imageSource(member.avatarFileKey);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Avatar files may come from local or external storage; no image loader is configured yet.
      <img
        src={src}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold"
      aria-hidden
    >
      {member.firstName.slice(0, 1)}
      {member.lastName.slice(0, 1)}
    </span>
  );
}

function RankText({
  color,
  level,
  name,
  fallback,
}: {
  color: string | null;
  level: number | null;
  name: string | null;
  fallback: string;
}) {
  const background = getRankIndicatorBackground({ color, level, name });

  return (
    <span className="inline-grid w-[10.25rem] max-w-full grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2 text-left">
      {background ? (
        <span
          className="h-[1.5625rem] w-[1.5625rem] shrink-0 justify-self-center rounded-full border-2 border-border shadow-sm"
          style={{ background }}
          aria-hidden
        />
      ) : (
        <span className="h-[1.5625rem] w-[1.5625rem] shrink-0 justify-self-center" aria-hidden />
      )}
      <span className="min-w-0 truncate">{name ?? fallback}</span>
    </span>
  );
}

function imageSource(key: string | null) {
  if (!key) return null;
  if (key.startsWith('/') || key.startsWith('http://') || key.startsWith('https://')) return key;
  return null;
}

function timeInputValue(value: Date | string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
