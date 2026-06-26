import { setRequestLocale, getTranslations } from 'next-intl/server';
import { and, asc, count, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty, type RoleAccessScope } from '@/lib/rbac';
import { db } from '@/db/client';
import { members, classes, attendance, rankDefinitions, ranks } from '@/db/schema';
import { getRankIndicatorBackground } from '@/lib/rank-visuals';
import { MetricCard, type MetricTone } from '@/components/ui/metric-card';
import {
  panelHeaderDescriptionClass,
  panelHeaderVariants,
  panelShellClass,
} from '@/components/ui/table-styles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return { title: t('title') };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const t = await getTranslations('dashboard');
  const accessScope = getRoleAccessScope(session, [
    'organization_admin',
    'dojo_admin',
    'instructor',
  ]);
  if (isRoleAccessScopeEmpty(accessScope)) {
    notFound();
  }

  let memberCount = 0;
  let classesToday = 0;
  let attendanceWeek = 0;
  let currentMonthBirthdays: BirthdayMember[] = [];
  let nextMonthBirthdays: BirthdayMember[] = [];
  let rankDistribution: RankDistributionSegment[] = [];

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const currentMonthLabel = monthLabel(currentMonth, locale);
  const nextMonthLabel = monthLabel(nextMonth, locale);

  {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const weekAgoIso = weekAgo.toISOString();
    const memberAccessFilter = memberAccessPredicate(accessScope);
    const classAccessFilter = classAccessPredicate(accessScope);

    const memberCountFilters: SQL[] = [eq(members.status, 'active'), isNull(members.deletedAt)];
    if (memberAccessFilter) memberCountFilters.push(memberAccessFilter);
    const [m] = await db
      .select({ c: count() })
      .from(members)
      .where(and(...memberCountFilters));
    memberCount = m?.c ?? 0;

    const rankDistributionFilters: SQL[] = [
      eq(members.status, 'active'),
      isNull(members.deletedAt),
      isNull(rankDefinitions.deletedAt),
    ];
    if (memberAccessFilter) rankDistributionFilters.push(memberAccessFilter);
    const rankRows = await db
      .select({
        level: rankDefinitions.level,
        name: rankDefinitions.name,
        color: rankDefinitions.color,
        studentCount: count().as('student_count'),
      })
      .from(members)
      .innerJoin(ranks, and(eq(ranks.memberId, members.id), eq(ranks.isCurrent, sql`true`)))
      .innerJoin(rankDefinitions, eq(rankDefinitions.id, ranks.rankDefinitionId))
      .where(and(...rankDistributionFilters))
      .groupBy(rankDefinitions.level, rankDefinitions.name, rankDefinitions.color)
      .orderBy(asc(rankDefinitions.level));
    rankDistribution = rankRows.map((row) => ({
      level: row.level,
      name: row.name,
      color: row.color,
      count: Number(row.studentCount ?? 0),
    }));

    const classesTodayFilters: SQL[] = [
      sql`${classes.startsAt} >= ${startIso}::timestamptz`,
      sql`${classes.startsAt} < ${endIso}::timestamptz`,
      isNull(classes.deletedAt),
    ];
    if (classAccessFilter) classesTodayFilters.push(classAccessFilter);
    const [c] = await db
      .select({ c: count() })
      .from(classes)
      .where(and(...classesTodayFilters));
    classesToday = c?.c ?? 0;

    const attendanceFilters: SQL[] = [
      sql`${attendance.markedAt} >= ${weekAgoIso}::timestamptz`,
      eq(attendance.status, 'present'),
      isNull(classes.deletedAt),
    ];
    if (classAccessFilter) attendanceFilters.push(classAccessFilter);
    const [a] = await db
      .select({ c: count() })
      .from(attendance)
      .innerJoin(classes, eq(classes.id, attendance.classId))
      .where(and(...attendanceFilters));
    attendanceWeek = a?.c ?? 0;

    const birthdayFilters: SQL[] = [
      isNull(members.deletedAt),
      sql`${members.dateOfBirth} is not null`,
      sql`extract(month from ${members.dateOfBirth})::int in (${currentMonth}, ${nextMonth})`,
    ];
    if (memberAccessFilter) birthdayFilters.push(memberAccessFilter);
    const birthdayRows = await db
      .select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        dateOfBirth: members.dateOfBirth,
        birthMonth: sql<number>`extract(month from ${members.dateOfBirth})::int`,
        birthDay: sql<number>`extract(day from ${members.dateOfBirth})::int`,
      })
      .from(members)
      .where(and(...birthdayFilters));

    const birthdayMembers = birthdayRows
      .filter((member): member is BirthdayMember => Boolean(member.dateOfBirth))
      .sort((a, b) => a.birthDay - b.birthDay || fullName(a).localeCompare(fullName(b), 'es-MX'));

    currentMonthBirthdays = birthdayMembers.filter((member) => member.birthMonth === currentMonth);
    nextMonthBirthdays = birthdayMembers.filter((member) => member.birthMonth === nextMonth);
  }

  const name = session?.user?.name ?? '';

  const cards: Array<{ label: string; value: string; tone: MetricTone }> = [
    {
      label: t('kpis.members'),
      value: memberCount.toString(),
      tone: 'good',
    },
    {
      label: t('kpis.classesToday'),
      value: classesToday.toString(),
      tone: 'info',
    },
    {
      label: t('kpis.attendanceWeek'),
      value: attendanceWeek.toString(),
      tone: 'signal',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('welcome', { name })}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <MetricCard key={c.label} label={c.label} value={c.value} tone={c.tone} />
        ))}
      </div>
      <section className={panelShellClass}>
        <div className={panelHeaderVariants('accent')}>
          <h2 className="text-lg font-semibold tracking-tight">{t('birthdays.title')}</h2>
          <p className={panelHeaderDescriptionClass}>{t('birthdays.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          <BirthdayList
            title={t('birthdays.currentMonth', { month: currentMonthLabel })}
            empty={t('birthdays.emptyCurrent')}
            members={currentMonthBirthdays}
            openLabel={(name) => t('birthdays.openMember', { name })}
          />
          <BirthdayList
            title={t('birthdays.nextMonth', { month: nextMonthLabel })}
            empty={t('birthdays.emptyNext')}
            members={nextMonthBirthdays}
            openLabel={(name) => t('birthdays.openMember', { name })}
          />
        </div>
      </section>
      <RankDistribution
        title={t('rankDistribution.title')}
        subtitle={t('rankDistribution.subtitle')}
        empty={t('rankDistribution.empty')}
        total={memberCount}
        segments={rankDistribution}
        percentText={(percent) => t('rankDistribution.percent', { percent })}
        segmentLabel={(name, count, percent) =>
          t('rankDistribution.segmentLabel', { rank: name, count, percent })
        }
      />
    </div>
  );
}

function memberAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(members.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(members.dojoId, scope.dojoIds));
  }

  if (predicates.length === 0) return sql`false`;
  if (predicates.length === 1) return predicates[0];
  return or(...predicates) ?? sql`false`;
}

function classAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(classes.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(classes.dojoId, scope.dojoIds));
  }

  if (predicates.length === 0) return sql`false`;
  if (predicates.length === 1) return predicates[0];
  return or(...predicates) ?? sql`false`;
}

interface BirthdayMember {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  birthMonth: number;
  birthDay: number;
}

interface RankDistributionSegment {
  level: number;
  name: string;
  color: string | null;
  count: number;
}

function RankDistribution({
  title,
  subtitle,
  empty,
  total,
  segments,
  percentText,
  segmentLabel,
}: {
  title: string;
  subtitle: string;
  empty: string;
  total: number;
  segments: RankDistributionSegment[];
  percentText: (percent: number) => string;
  segmentLabel: (name: string, count: number, percent: number) => string;
}) {
  return (
    <section className={panelShellClass}>
      <div className={panelHeaderVariants('accent')}>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className={panelHeaderDescriptionClass}>{subtitle}</p>
      </div>
      {segments.length === 0 || total === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto p-4">
          <div className="flex min-w-[34rem] overflow-hidden rounded-md border border-border bg-secondary md:min-w-0">
            {segments.map((segment) => {
              const percent = Math.round((segment.count / total) * 100);
              const label = segmentLabel(segment.name, segment.count, percent);
              const background = getRankIndicatorBackground(segment);
              return (
                <Link
                  key={segment.level}
                  href={{
                    pathname: '/members',
                    query: { rankLevel: String(segment.level), page: '1' },
                  }}
                  aria-label={label}
                  title={percentText(percent)}
                  className="group flex min-h-12 min-w-11 items-center justify-center border-r border-border last:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ flexGrow: segment.count, flexBasis: 0, background: background ?? '' }}
                >
                  <span className="sr-only">{percentText(percent)}</span>
                  <span
                    className="hidden rounded-sm bg-background/85 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-foreground shadow-sm group-hover:block group-focus-visible:block md:block"
                    aria-hidden
                  >
                    {percent}%
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            {segments.map((segment) => {
              const background = getRankIndicatorBackground(segment);
              return (
                <Link
                  key={`legend-${segment.level}`}
                  href={{
                    pathname: '/members',
                    query: { rankLevel: String(segment.level), page: '1' },
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-border"
                    style={{ background: background ?? undefined }}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">
                    {segment.name} · {segment.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function BirthdayList({
  title,
  empty,
  members,
  openLabel,
}: {
  title: string;
  empty: string;
  members: BirthdayMember[];
  openLabel: (name: string) => string;
}) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {members.length === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-secondary/60 p-3 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {members.map((member) => {
            const name = fullName(member);
            return (
              <li key={member.id}>
                <Link
                  href={{ pathname: '/members/[id]', params: { id: member.id } }}
                  aria-label={openLabel(name)}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-md border border-border bg-secondary/60 px-3 py-2 text-sm transition-colors duration-fast ease-standard hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground group-hover:text-foreground">
                      {name}
                    </span>
                    <span className="mt-0.5 block text-muted-foreground group-hover:text-foreground">
                      {formatBirthDate(member.dateOfBirth)}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function fullName(member: { firstName: string; lastName: string }) {
  return `${member.firstName} ${member.lastName}`;
}

function monthLabel(month: number, locale: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-MX', { month: 'long' }).format(
    new Date(2026, month - 1, 1),
  );
}

function formatBirthDate(value: string) {
  const [yearPart, monthPart, dayPart] = value.split('-').map(Number);
  if (!yearPart || !monthPart || !dayPart) return value;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(yearPart, monthPart - 1, dayPart));
}
