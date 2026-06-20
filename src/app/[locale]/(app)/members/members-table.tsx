'use client';

import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { useEffect, useState, useTransition, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StatusBadge as SemanticStatusBadge,
  type StatusBadgeVariant,
} from '@/components/ui/status-badge';
import { LoadingWithElapsedTime } from '@/components/ui/loading';
import { SelectMenu } from '@/components/ui/select-menu';
import { getAbsenceVariant, getStudentStatusVariant } from '@/lib/member-visual-state';
import { getRankIndicatorBackground } from '@/lib/rank-visuals';
import {
  tableClass,
  tableHeaderCellClass,
  tableHeaderClass,
  tableRowClass,
  tableShellClass,
} from '@/components/ui/table-styles';
import type { MemberRow } from '@/server/members/queries';
import type { MemberListQuery, MemberSortKey } from '@/server/members/schemas';

interface Props {
  rows: MemberRow[];
  total: number;
  query: MemberListQuery;
  dojos: Array<{ id: string; name: string }>;
}

const FIELD =
  'min-h-12 rounded-md border border-input bg-background px-3 text-base shadow-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

const PAGE_SIZE_OPTIONS = [20, 40, 60, 80, 100] as const;

export default function MembersTable({ rows, total, query, dojos }: Props) {
  const t = useTranslations('members.list');
  const tLoading = useTranslations('loading');
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setHydrated(true);
  }, []);

  function buildHref(overrides: Partial<MemberListQuery>) {
    const next = { ...query, ...overrides };
    return {
      pathname: '/members',
      query: {
        ...(next.q ? { q: next.q } : {}),
        ...(next.status ? { status: next.status } : {}),
        ...(next.dojoId ? { dojoId: next.dojoId } : {}),
        sortBy: next.sortBy ?? 'name',
        sortDir: next.sortDir ?? 'asc',
        page: String(next.page ?? 1),
        pageSize: String(next.pageSize ?? query.pageSize),
      },
    } as never;
  }

  function applyParam(key: 'q' | 'status' | 'dojoId', value: string | undefined) {
    startTransition(() => {
      router.push(
        buildHref({
          page: 1,
          [key]: value && value !== '' ? value : undefined,
        } as Partial<MemberListQuery>),
      );
    });
  }

  function applyPageSize(value: string) {
    startTransition(() => {
      router.push(
        buildHref({
          page: 1,
          pageSize: Number(value) as MemberListQuery['pageSize'],
        }),
      );
    });
  }

  function goToPage(p: number) {
    startTransition(() => {
      router.push(buildHref({ page: p }));
    });
  }

  function applySort(sortBy: MemberSortKey) {
    const sortDir = query.sortBy === sortBy && query.sortDir === 'asc' ? 'desc' : 'asc';
    startTransition(() => {
      router.push(buildHref({ page: 1, sortBy, sortDir }));
    });
  }

  function openMember(id: string) {
    startTransition(() => {
      router.push({ pathname: '/members/[id]', params: { id } } as never);
    });
  }

  function handleMemberRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openMember(id);
  }

  function sortButtonLabel(column: string, isActive: boolean, currentDir: 'asc' | 'desc') {
    return t(isActive && currentDir === 'asc' ? 'sort.descending' : 'sort.ascending', {
      column,
    });
  }

  const pageSizeNumber = query.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSizeNumber));
  const from = total === 0 ? 0 : (query.page - 1) * pageSizeNumber + 1;
  const to = Math.min(total, query.page * pageSizeNumber);
  const statusOptions = [
    { value: '', label: t('filterStatusAll') },
    { value: 'active', label: t('status.active') },
    { value: 'temporary_leave', label: t('status.temporary_leave') },
    { value: 'permanent_leave', label: t('status.permanent_leave') },
    { value: 'recovery', label: t('status.recovery') },
    { value: 'sick', label: t('status.sick') },
  ];
  const dojoOptions = [
    { value: '', label: t('filterDojoAll') },
    ...dojos.map((dojo) => ({ value: dojo.id, label: dojo.name })),
  ];
  const pageSizeOptions = PAGE_SIZE_OPTIONS.map((value) => ({
    value: String(value),
    label: String(value),
  }));

  return (
    <div className="flex flex-col gap-3" aria-busy={pending}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          defaultValue={query.q ?? ''}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          inputMode="search"
          enterKeyHint="search"
          disabled={!hydrated || pending}
          onChange={(e) => {
            const v = e.target.value;
            window.clearTimeout((window as unknown as { __mt?: number }).__mt);
            (window as unknown as { __mt?: number }).__mt = window.setTimeout(
              () => applyParam('q', v),
              300,
            );
          }}
          className={cn(FIELD, 'w-full py-2 md:w-[20rem] lg:w-[22rem]')}
        />
        <SelectMenu
          value={query.status ?? ''}
          options={statusOptions}
          onValueChange={(value) => applyParam('status', value || undefined)}
          disabled={!hydrated || pending}
          className="w-full md:w-[14.5rem]"
          contentMinWidth="14.5rem"
          ariaLabel={t('columns.status')}
        />
        <SelectMenu
          value={query.dojoId ?? ''}
          options={dojoOptions}
          onValueChange={(value) => applyParam('dojoId', value || undefined)}
          disabled={!hydrated || pending}
          className="w-full md:w-[14rem] lg:w-[15rem]"
          contentMinWidth="14rem"
          ariaLabel={t('columns.dojo')}
        />
        <SelectMenu
          value={String(query.pageSize)}
          options={pageSizeOptions}
          onValueChange={applyPageSize}
          disabled={!hydrated || pending}
          className="w-full md:w-[8.75rem]"
          contentMinWidth="10rem"
          ariaLabel={t('pageSize.ariaLabel')}
          compact
          startAdornment={
            <span className="shrink-0 text-muted-foreground">{t('pageSize.label')}</span>
          }
        />
      </div>
      {pending && <LoadingWithElapsedTime label={tLoading('members')} />}

      {/* Phone + tablet portrait: card list */}
      <ul className="flex flex-col gap-2 lg:hidden">
        {rows.length === 0 && (
          <li className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
            {t('empty')}
          </li>
        )}
        {rows.map((m) => (
          <li key={m.id}>
            <Link
              href={{ pathname: '/members/[id]', params: { id: m.id } }}
              aria-label={t('openDetail', { name: fullName(m) })}
              className="flex min-h-16 flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-colors duration-fast ease-standard hover:bg-primary-subtle/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-3">
                <MemberAvatar member={m} photoAlt={t('photoAlt', { name: fullName(m) })} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-medium text-foreground">
                    {fullName(m)}
                  </div>
                  {m.firstNameKatakana && (
                    <div className="text-katakana mt-0.5 truncate text-sm">
                      {m.firstNameKatakana}
                    </div>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <StatusBadge member={m} label={t(`status.${m.status}`)} />
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MobileFact label={t('columns.rank')} value={m.currentRankName ?? t('emptyRank')}>
                  <RankBadge member={m} fallback={t('emptyRank')} />
                </MobileFact>
                <MobileFact label={t('columns.age')} value={formatAge(m.age, t('emptyAge'))} />
                <MobileFact
                  label={t('columns.class')}
                  value={m.assignedClassName ?? t('emptyClass')}
                />
                <MobileFact
                  label={t('columns.absences')}
                  value={t('absences.count', { count: m.monthlyAbsences })}
                  valueVariant={getAbsenceVariant(m.absenceTone)}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop and tablet landscape: table */}
      <div className={cn(tableShellClass, 'hidden lg:block')}>
        <table className={tableClass}>
          <thead className={tableHeaderClass}>
            <tr>
              <th
                scope="col"
                className={tableHeaderCellClass}
                aria-sort={query.sortBy === 'name' ? sortAria(query.sortDir) : 'none'}
              >
                <SortableHeader
                  label={t('columns.student')}
                  sortKey="name"
                  activeSort={query.sortBy}
                  sortDir={query.sortDir}
                  onSort={applySort}
                  ariaLabel={sortButtonLabel(
                    t('columns.student'),
                    query.sortBy === 'name',
                    query.sortDir,
                  )}
                />
              </th>
              <th
                scope="col"
                className={tableHeaderCellClass}
                aria-sort={query.sortBy === 'rank' ? sortAria(query.sortDir) : 'none'}
              >
                <SortableHeader
                  label={t('columns.rank')}
                  sortKey="rank"
                  activeSort={query.sortBy}
                  sortDir={query.sortDir}
                  onSort={applySort}
                  ariaLabel={sortButtonLabel(
                    t('columns.rank'),
                    query.sortBy === 'rank',
                    query.sortDir,
                  )}
                />
              </th>
              <th
                scope="col"
                className={tableHeaderCellClass}
                aria-sort={query.sortBy === 'age' ? sortAria(query.sortDir) : 'none'}
              >
                <SortableHeader
                  label={t('columns.age')}
                  sortKey="age"
                  activeSort={query.sortBy}
                  sortDir={query.sortDir}
                  onSort={applySort}
                  ariaLabel={sortButtonLabel(
                    t('columns.age'),
                    query.sortBy === 'age',
                    query.sortDir,
                  )}
                />
              </th>
              <th scope="col" className={tableHeaderCellClass}>
                {t('columns.class')}
              </th>
              <th
                scope="col"
                className={tableHeaderCellClass}
                aria-sort={query.sortBy === 'absences' ? sortAria(query.sortDir) : 'none'}
              >
                <SortableHeader
                  label={t('columns.absences')}
                  sortKey="absences"
                  activeSort={query.sortBy}
                  sortDir={query.sortDir}
                  onSort={applySort}
                  ariaLabel={sortButtonLabel(
                    t('columns.absences'),
                    query.sortBy === 'absences',
                    query.sortDir,
                  )}
                />
              </th>
              <th scope="col" className={tableHeaderCellClass}>
                {t('columns.status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                  {t('empty')}
                </td>
              </tr>
            )}
            {rows.map((m) => (
              <tr
                key={m.id}
                role="link"
                tabIndex={0}
                aria-label={t('openDetail', { name: fullName(m) })}
                onClick={() => openMember(m.id)}
                onKeyDown={(event) => handleMemberRowKeyDown(event, m.id)}
                className={cn(
                  tableRowClass,
                  'student-row-interactive group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                )}
              >
                <td className="px-3 py-3">
                  <div className="inline-flex min-h-11 max-w-full items-center gap-3 rounded-md px-3 font-medium text-foreground xl:px-0">
                    <MemberAvatar
                      member={m}
                      photoAlt={t('photoAlt', { name: fullName(m) })}
                      small
                    />
                    <span className="min-w-0">
                      <span className="block truncate group-hover:underline">{fullName(m)}</span>
                      {m.firstNameKatakana && (
                        <span className="text-katakana mt-0.5 block truncate text-xs">
                          {m.firstNameKatakana}
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <RankBadge member={m} fallback={t('emptyRank')} />
                </td>
                <td className="px-3 py-3 text-center tabular-nums">
                  {formatAge(m.age, t('emptyAge'))}
                </td>
                <td className="px-3 py-3 text-center">{m.assignedClassName ?? t('emptyClass')}</td>
                <td className="px-3 py-3 text-center">
                  <SemanticStatusBadge variant={getAbsenceVariant(m.absenceTone)}>
                    {t('absences.count', { count: m.monthlyAbsences })}
                  </SemanticStatusBadge>
                </td>
                <td className="px-3 py-3 text-center">
                  <StatusBadge member={m} label={t(`status.${m.status}`)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t('pagination.showing', { from, to, total })}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={query.page <= 1 || !hydrated || pending}
            onClick={() => goToPage(query.page - 1)}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-3 transition-colors duration-fast ease-standard hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('pagination.previous')}
          </button>
          <button
            type="button"
            disabled={query.page >= totalPages || !hydrated || pending}
            onClick={() => goToPage(query.page + 1)}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-3 transition-colors duration-fast ease-standard hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('pagination.next')}
          </button>
        </div>
      </div>
    </div>
  );
}

function fullName(member: MemberRow) {
  return `${member.firstName} ${member.lastName}`;
}

function initials(member: MemberRow) {
  return `${member.firstName.slice(0, 1)}${member.lastName.slice(0, 1)}`.toUpperCase();
}

function imageSource(key: string | null) {
  if (!key) return null;
  if (key.startsWith('/') || key.startsWith('http://') || key.startsWith('https://')) return key;
  return null;
}

function MemberAvatar({
  member,
  photoAlt,
  small = false,
}: {
  member: MemberRow;
  photoAlt: string;
  small?: boolean;
}) {
  const src = imageSource(member.avatarFileKey);
  const size = small ? 'h-9 w-9 text-xs' : 'h-14 w-14 text-sm';

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Avatar files may come from local or external storage; no image loader is configured yet.
      <img
        src={src}
        alt={photoAlt}
        className={cn(size, 'shrink-0 rounded-full border border-border object-cover')}
      />
    );
  }

  return (
    <span
      className={cn(
        size,
        'flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-semibold text-secondary-foreground',
      )}
      aria-hidden
    >
      {initials(member)}
    </span>
  );
}

function RankBadge({ member, fallback }: { member: MemberRow; fallback: string }) {
  const background = getRankIndicatorBackground({
    level: member.currentRankLevel,
    name: member.currentRankName,
    color: member.currentRankColor,
  });

  return (
    <span className="rank-badge inline-flex min-h-7 items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none">
      {background && (
        <span
          className="rank-swatch h-[1.5625rem] w-[1.5625rem] shrink-0 rounded-full border"
          style={{ background }}
          aria-hidden
        />
      )}
      {member.currentRankName ?? fallback}
    </span>
  );
}

function StatusBadge({ member, label }: { member: MemberRow; label: string }) {
  return (
    <SemanticStatusBadge variant={getStudentStatusVariant(member.status)}>
      {label}
    </SemanticStatusBadge>
  );
}

function MobileFact({
  label,
  value,
  valueVariant,
  children,
}: {
  label: string;
  value: string;
  valueVariant?: StatusBadgeVariant;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-md bg-secondary/60 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      {children ? (
        <div className="mt-1">{children}</div>
      ) : valueVariant ? (
        <SemanticStatusBadge className="mt-1" variant={valueVariant}>
          {value}
        </SemanticStatusBadge>
      ) : (
        <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  sortDir,
  onSort,
  ariaLabel,
}: {
  label: string;
  sortKey: MemberSortKey;
  activeSort: MemberSortKey;
  sortDir: 'asc' | 'desc';
  onSort: (sortBy: MemberSortKey) => void;
  ariaLabel: string;
}) {
  const active = activeSort === sortKey;
  const Icon = !active ? ChevronsUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => onSort(sortKey)}
      className={cn(
        'mx-auto inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 text-center transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-periwinkle text-periwinkle-foreground'
          : 'text-inherit hover:bg-black/20 hover:text-white',
      )}
    >
      <span>{label}</span>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}

function sortAria(sortDir: 'asc' | 'desc') {
  return sortDir === 'asc' ? 'ascending' : 'descending';
}

function formatAge(age: number | null, fallback: string) {
  return age === null ? fallback : String(age);
}
