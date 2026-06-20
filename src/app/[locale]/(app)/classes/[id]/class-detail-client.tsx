'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition, type FormEvent } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { ButtonSpinner } from '@/components/ui/loading';
import { NativeSelect } from '@/components/ui/native-select';
import {
  assignMemberToClassAction,
  endMemberClassAssignmentAction,
} from '@/server/classes/actions';
import { cn } from '@/lib/utils';
import { getRankIndicatorBackground } from '@/lib/rank-visuals';

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
    dojoName: string;
    scheduleLabel: string;
    capacity: number | null;
    status: string;
    notes: string | null;
  };
  roster: RosterMember[];
  assignableMembers: AssignableMember[];
}

const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function ClassDetailClient({ classRow, roster, assignableMembers }: Props) {
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
          'w-full border border-border text-muted-foreground hover:bg-secondary md:w-fit lg:min-h-0 lg:border-0 lg:px-0 lg:font-normal lg:hover:bg-transparent lg:hover:underline',
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('back')}
      </Link>

      <header className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium text-primary">{classRow.scheduleLabel}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{classRow.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{classRow.dojoName}</p>
      </header>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-base font-semibold">{t('roster')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
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
                  className="-m-2 flex min-h-14 flex-1 items-center gap-3 rounded-md p-2 transition-colors duration-fast ease-standard hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                >
                  <Avatar member={member} />
                  <div className="min-w-0">
                    <div className="truncate font-medium group-hover:underline">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <RankDot
                        color={member.currentRankColor}
                        level={member.currentRankLevel}
                        name={member.currentRankName}
                      />
                      {member.currentRankName ?? t('emptyRank')}
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
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-semibold">{t('notes')}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{classRow.notes}</p>
        </section>
      )}
    </div>
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

function RankDot({
  color,
  level,
  name,
}: {
  color: string | null;
  level: number | null;
  name: string | null;
}) {
  const background = getRankIndicatorBackground({ color, level, name });
  if (!background) return null;
  return (
    <span
      className="h-4 w-4 shrink-0 rounded-full border border-border shadow-sm"
      style={{ background }}
      aria-hidden
    />
  );
}

function imageSource(key: string | null) {
  if (!key) return null;
  if (key.startsWith('/') || key.startsWith('http://') || key.startsWith('https://')) return key;
  return null;
}
