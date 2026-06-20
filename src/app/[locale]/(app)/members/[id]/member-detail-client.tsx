'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition, type FormEvent } from 'react';
import { ArrowLeft, Award, Edit, MoveRight, UserMinus } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { StatusBadge as SemanticStatusBadge } from '@/components/ui/status-badge';
import { ButtonSpinner } from '@/components/ui/loading';
import { NativeSelect } from '@/components/ui/native-select';
import {
  tableClass,
  tableHeaderCellClass,
  tableHeaderClass,
  tableRowClass,
  tableShellClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
import { getStudentStatusVariant } from '@/lib/member-visual-state';
import { getRankIndicatorBackground } from '@/lib/rank-visuals';
import {
  promoteMemberAction,
  transferMemberDojoAction,
  updateMemberStatusAction,
} from '@/server/members/actions';
import {
  assignMemberToClassAction,
  endMemberClassAssignmentAction,
} from '@/server/classes/actions';
import type { MemberStatus } from '@/server/members/schemas';
import { canViewBlackBeltLeague } from '@/lib/rank-access';

interface MemberDetailView {
  id: string;
  firstName: string;
  firstNameKatakana: string | null;
  lastName: string;
  code: string | null;
  curp: string | null;
  dojoId: string;
  dojoName: string;
  email: string | null;
  phone: string | null;
  emergencyPhone: string | null;
  status: MemberStatus;
  dateOfBirth: string | null;
  age: number | null;
  bloodType: string | null;
  specialCareNotes: string | null;
  notes: string | null;
  avatarFileKey: string | null;
  currentRankName: string | null;
  currentRankColor: string | null;
  currentRankLevel: number | null;
}

interface MemberClassView {
  id: string;
  name: string;
  dojoName: string;
  scheduleLabel: string;
  status: string;
}

interface MemberPromotionView {
  id: string;
  targetRankName: string;
  targetRankColor: string | null;
  status: string;
  examDate: string | null;
  score: string | null;
  notes: string | null;
}

interface MemberLeagueResultView {
  id: string;
  eventName: string;
  eventDate: string | null;
  category: string | null;
  result: string | null;
  score: string | null;
  notes: string | null;
}

interface MemberRankOptionView {
  id: string;
  name: string;
  color: string | null;
  level: number;
}

interface Props {
  member: MemberDetailView;
  dojos: Array<{ id: string; name: string }>;
  activeClasses: MemberClassView[];
  assignableClasses: Array<{ id: string; name: string; dojoName: string; scheduleLabel: string }>;
  promotions: MemberPromotionView[];
  blackBeltLeagueResults: MemberLeagueResultView[];
  rankOptions: MemberRankOptionView[];
}

const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';
const INPUT_CLASS =
  'min-h-11 rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

export default function MemberDetailClient({
  member,
  dojos,
  activeClasses,
  assignableClasses,
  promotions,
  blackBeltLeagueResults,
  rankOptions,
}: Props) {
  const t = useTranslations('members.detail');
  const tStatus = useTranslations('members.list.status');
  const fullName = `${member.firstName} ${member.lastName}`;
  const showBlackBeltLeague = canViewBlackBeltLeague(member.currentRankLevel);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link
          href="/members"
          className={cn(
            BUTTON_BASE,
            'w-full border border-border bg-secondary text-foreground hover:bg-purple-subtle/70 hover:text-purple-subtle-foreground md:w-auto',
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('back')}
        </Link>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
          <PromoteSheet member={member} rankOptions={rankOptions} />
          <Link
            href={{ pathname: '/members/[id]/edit', params: { id: member.id } }}
            className={cn(BUTTON_BASE, 'border border-border hover:bg-secondary')}
          >
            <Edit className="h-4 w-4" aria-hidden />
            {t('actions.edit')}
          </Link>
          <TransferSheet member={member} dojos={dojos} />
          <StatusSheet member={member} />
        </div>
      </div>

      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <MemberAvatar member={member} photoAlt={t('photoAlt', { name: fullName })} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                <span>{fullName}</span>
                {member.firstNameKatakana && (
                  <>
                    <span> - </span>
                    <span className="text-katakana">{member.firstNameKatakana}</span>
                  </>
                )}
              </h1>
              <RankDot
                color={member.currentRankColor}
                level={member.currentRankLevel}
                name={member.currentRankName}
              />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{member.currentRankName ?? t('emptyRank')}</span>
              {member.code && <span>{t('codeValue', { code: member.code })}</span>}
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{member.dojoName}</p>
          </div>
          <SemanticStatusBadge
            className="px-3 py-1 text-sm"
            variant={getStudentStatusVariant(member.status)}
          >
            {tStatus(member.status)}
          </SemanticStatusBadge>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <InfoBlock label={t('fields.curp')} value={member.curp} />
        <InfoBlock
          label={t('fields.dateOfBirth')}
          value={formatDate(member.dateOfBirth, t('emptyValue'))}
        />
        <InfoBlock
          label={t('fields.age')}
          value={member.age === null ? t('emptyValue') : t('ageValue', { age: member.age })}
        />
        <InfoBlock label={t('fields.bloodType')} value={member.bloodType} />
        <InfoBlock label={t('fields.emergencyPhone')} value={member.emergencyPhone} />
        <InfoBlock label={t('fields.phone')} value={member.phone} />
        <InfoBlock
          className="lg:col-span-3"
          label={t('fields.specialCareNotes')}
          value={member.specialCareNotes}
        />
      </section>

      <ClassesSection
        memberId={member.id}
        activeClasses={activeClasses}
        assignableClasses={assignableClasses}
      />

      <section className={cn('grid grid-cols-1 gap-4', showBlackBeltLeague && 'xl:grid-cols-2')}>
        <HistoryTable
          title={t('exams.title')}
          empty={t('exams.empty')}
          headers={[t('exams.rank'), t('exams.date'), t('exams.score'), t('exams.status')]}
          rows={promotions.map((promotion) => [
            promotion.targetRankName,
            formatDate(promotion.examDate, t('emptyValue')),
            promotion.score ?? t('emptyValue'),
            t(`promotionStatus.${promotion.status}`),
          ])}
        />
        {showBlackBeltLeague && (
          <HistoryTable
            title={t('blackBelts.title')}
            empty={t('blackBelts.empty')}
            headers={[
              t('blackBelts.event'),
              t('blackBelts.date'),
              t('blackBelts.category'),
              t('blackBelts.result'),
            ]}
            rows={blackBeltLeagueResults.map((result) => [
              result.eventName,
              formatDate(result.eventDate, t('emptyValue')),
              result.category ?? t('emptyValue'),
              result.result ?? t('emptyValue'),
            ])}
          />
        )}
      </section>

      {member.notes && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-semibold">{t('notes')}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{member.notes}</p>
        </section>
      )}
    </div>
  );
}

function PromoteSheet({
  member,
  rankOptions,
}: {
  member: MemberDetailView;
  rankOptions: MemberRankOptionView[];
}) {
  const t = useTranslations('members.detail');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const availableRanks = rankOptions.filter((rank) => rank.level > (member.currentRankLevel ?? 0));
  const nextRank = availableRanks[0];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    startTransition(async () => {
      const res = await promoteMemberAction(member.id, {
        targetRankDefinitionId: String(formData.get('targetRankDefinitionId') ?? ''),
        examDate: String(formData.get('examDate') ?? '') || undefined,
        score: String(formData.get('score') ?? '') || undefined,
        notes: String(formData.get('notes') ?? '') || undefined,
      });
      if (!res.ok) {
        setMessage(t(`actionErrors.${res.error ?? 'generic'}`));
        return;
      }
      setMessage(t('actions.promoteSuccess'));
      router.refresh();
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          disabled={!nextRank}
          className={cn(BUTTON_BASE, 'bg-primary text-primary-foreground hover:bg-primary-hover')}
        >
          <Award className="h-4 w-4" aria-hidden />
          {t('actions.promote')}
        </button>
      </SheetTrigger>
      <ActionSheetContent title={t('promote.title')}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FieldLabel
            label={t('promote.currentRank')}
            value={member.currentRankName ?? t('emptyRank')}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('promote.targetRank')}
            <NativeSelect
              name="targetRankDefinitionId"
              defaultValue={nextRank?.id}
              wrapperClassName="w-full"
              required
            >
              {availableRanks.map((rank) => (
                <option key={rank.id} value={rank.id}>
                  {rank.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('promote.examDate')}
            <input name="examDate" type="date" className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('promote.score')}
            <input name="score" inputMode="decimal" className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('promote.notes')}
            <textarea name="notes" rows={3} className={cn(INPUT_CLASS, 'min-h-24')} />
          </label>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <button
            type="submit"
            disabled={pending || !nextRank}
            className={cn(BUTTON_BASE, 'bg-primary text-primary-foreground hover:bg-primary-hover')}
          >
            {pending && <ButtonSpinner />}
            {pending ? t('actions.saving') : t('actions.confirmPromote')}
          </button>
        </form>
      </ActionSheetContent>
    </Sheet>
  );
}

function TransferSheet({ member, dojos }: { member: MemberDetailView; dojos: Props['dojos'] }) {
  const t = useTranslations('members.detail');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const targetDojos = dojos.filter((dojo) => dojo.id !== member.dojoId);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    startTransition(async () => {
      const res = await transferMemberDojoAction(member.id, {
        targetDojoId: String(formData.get('targetDojoId') ?? ''),
        notes: String(formData.get('notes') ?? '') || undefined,
      });
      if (!res.ok) {
        setMessage(t(`actionErrors.${res.error ?? 'generic'}`));
        return;
      }
      setMessage(t('actions.transferSuccess'));
      router.refresh();
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          disabled={targetDojos.length === 0}
          className={cn(BUTTON_BASE, 'border border-border hover:bg-secondary')}
        >
          <MoveRight className="h-4 w-4" aria-hidden />
          {t('actions.transfer')}
        </button>
      </SheetTrigger>
      <ActionSheetContent title={t('transfer.title')}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FieldLabel label={t('transfer.currentDojo')} value={member.dojoName} />
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('transfer.targetDojo')}
            <NativeSelect name="targetDojoId" wrapperClassName="w-full" required>
              {targetDojos.map((dojo) => (
                <option key={dojo.id} value={dojo.id}>
                  {dojo.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('transfer.notes')}
            <textarea name="notes" rows={3} className={cn(INPUT_CLASS, 'min-h-24')} />
          </label>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <button
            type="submit"
            disabled={pending || targetDojos.length === 0}
            className={cn(BUTTON_BASE, 'bg-primary text-primary-foreground hover:bg-primary-hover')}
          >
            {pending && <ButtonSpinner />}
            {pending ? t('actions.saving') : t('actions.confirmTransfer')}
          </button>
        </form>
      </ActionSheetContent>
    </Sheet>
  );
}

function StatusSheet({ member }: { member: MemberDetailView }) {
  const t = useTranslations('members.detail');
  const tStatus = useTranslations('members.list.status');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const statusOptions: Array<Exclude<MemberStatus, 'active'>> = [
    'temporary_leave',
    'permanent_leave',
    'recovery',
    'sick',
  ];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    startTransition(async () => {
      const res = await updateMemberStatusAction(member.id, {
        status: String(formData.get('status')) as Exclude<MemberStatus, 'active'>,
        notes: String(formData.get('notes') ?? '') || undefined,
      });
      if (!res.ok) {
        setMessage(t(`actionErrors.${res.error ?? 'generic'}`));
        return;
      }
      setMessage(t('actions.statusSuccess'));
      router.refresh();
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            BUTTON_BASE,
            'border border-danger-border text-danger hover:bg-danger-subtle hover:text-danger-subtle-foreground',
          )}
        >
          <UserMinus className="h-4 w-4" aria-hidden />
          {t('actions.withdraw')}
        </button>
      </SheetTrigger>
      <ActionSheetContent title={t('withdraw.title')}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('withdraw.status')}
            <NativeSelect name="status" wrapperClassName="w-full" required>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {tStatus(status)}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('withdraw.notes')}
            <textarea name="notes" rows={3} className={cn(INPUT_CLASS, 'min-h-24')} />
          </label>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_BASE, 'bg-destructive text-destructive-foreground')}
          >
            {pending && <ButtonSpinner />}
            {pending ? t('actions.saving') : t('actions.confirmWithdraw')}
          </button>
        </form>
      </ActionSheetContent>
    </Sheet>
  );
}

function ClassesSection({
  memberId,
  activeClasses,
  assignableClasses,
}: {
  memberId: string;
  activeClasses: MemberClassView[];
  assignableClasses: Props['assignableClasses'];
}) {
  const t = useTranslations('members.detail');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const classId = String(formData.get('classId') ?? '');
    setMessage(null);
    startTransition(async () => {
      const res = await assignMemberToClassAction({ memberId, classId });
      if (!res.ok) {
        setMessage(t(`classActions.errors.${res.error ?? 'generic'}`));
        return;
      }
      setMessage(t('classActions.assigned'));
      router.refresh();
    });
  }

  function remove(classId: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await endMemberClassAssignmentAction({ memberId, classId });
      if (!res.ok) {
        setMessage(t(`classActions.errors.${res.error ?? 'generic'}`));
        return;
      }
      setMessage(t('classActions.removed'));
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="text-base font-semibold">{t('classes.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('classes.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {activeClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('classes.empty')}</p>
        ) : (
          activeClasses.map((classRow) => (
            <div
              key={classRow.id}
              className="flex flex-col gap-3 rounded-md border border-border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-medium">{classRow.scheduleLabel}</div>
                <div className="text-sm text-muted-foreground">
                  {classRow.name} · {classRow.dojoName}
                </div>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(classRow.id)}
                className={cn(BUTTON_BASE, 'border border-border hover:bg-secondary')}
              >
                {pending && <ButtonSpinner />}
                {t('classActions.remove')}
              </button>
            </div>
          ))
        )}
        {assignableClasses.length > 0 && (
          <form
            onSubmit={assign}
            className="flex flex-col gap-2 border-t border-border pt-3 md:flex-row"
          >
            <NativeSelect name="classId" wrapperClassName="flex-1" required>
              {assignableClasses.map((classRow) => (
                <option key={classRow.id} value={classRow.id}>
                  {classRow.scheduleLabel} · {classRow.name}
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
              {pending && <ButtonSpinner />}
              {t('classActions.assign')}
            </button>
          </form>
        )}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </section>
  );
}

function ActionSheetContent({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTranslations('members.detail');
  return (
    <SheetContent
      side="bottom"
      title={title}
      closeLabel={t('actions.close')}
      className="max-h-[90vh] overflow-y-auto rounded-t-lg sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-96 sm:rounded-none"
    >
      <div className="pr-10">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </SheetContent>
  );
}

function HistoryTable({
  title,
  empty,
  headers,
  rows,
}: {
  title: string;
  empty: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className={cn(tableShellClass, 'rounded-none border-0 shadow-none')}>
          <table className={tableClass}>
            <thead className={tableHeaderClass}>
              <tr>
                {headers.map((header) => (
                  <th key={header} scope="col" className={tableHeaderCellClass}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join('|')}`} className={tableRowClass}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 first:font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FieldLabel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null;
  className?: string;
}) {
  const t = useTranslations('members.detail');
  const empty = !value;
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-sm leading-6', empty && 'italic text-muted-foreground')}>
        {empty ? t('emptyValue') : value}
      </div>
    </div>
  );
}

function MemberAvatar({ member, photoAlt }: { member: MemberDetailView; photoAlt: string }) {
  const src = imageSource(member.avatarFileKey);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Avatar files may come from local or external storage; no image loader is configured yet.
      <img
        src={src}
        alt={photoAlt}
        className="h-20 w-20 shrink-0 rounded-full border border-border object-cover md:h-24 md:w-24"
      />
    );
  }

  return (
    <span
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xl font-semibold text-secondary-foreground md:h-24 md:w-24"
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
      className="rank-swatch h-[1.5625rem] w-[1.5625rem] shrink-0 rounded-full border"
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

function formatDate(value: string | null, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(
    new Date(`${value}T00:00:00`),
  );
}
