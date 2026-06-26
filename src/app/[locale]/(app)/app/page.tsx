import { setRequestLocale, getTranslations } from 'next-intl/server';
import { and, count, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { getRoleAccessScope, isRoleAccessScopeEmpty, type RoleAccessScope } from '@/lib/rbac';
import { db } from '@/db/client';
import { members, classes, attendance, payments } from '@/db/schema';
import { formatCurrency } from '@/lib/utils';
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
  let revenueMonth = 0;
  let currentMonthBirthdays: BirthdayMember[] = [];
  let nextMonthBirthdays: BirthdayMember[] = [];

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
    const monthStart = new Date(today);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const weekAgoIso = weekAgo.toISOString();
    const monthStartIso = monthStart.toISOString();
    const memberAccessFilter = memberAccessPredicate(accessScope);
    const classAccessFilter = classAccessPredicate(accessScope);
    const paymentAccessFilter = paymentAccessPredicate(accessScope);

    const memberCountFilters: SQL[] = [eq(members.status, 'active'), isNull(members.deletedAt)];
    if (memberAccessFilter) memberCountFilters.push(memberAccessFilter);
    const [m] = await db
      .select({ c: count() })
      .from(members)
      .where(and(...memberCountFilters));
    memberCount = m?.c ?? 0;

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

    const revenueFilters: SQL[] = [
      sql`${payments.paidAt} >= ${monthStartIso}::timestamptz`,
      isNull(payments.deletedAt),
    ];
    if (paymentAccessFilter) revenueFilters.push(paymentAccessFilter);
    const [r] = await db
      .select({ total: sql<string>`COALESCE(SUM(${payments.amount})::text, '0')` })
      .from(payments)
      .where(and(...revenueFilters));
    revenueMonth = Number(r?.total ?? 0);

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
    {
      label: t('kpis.revenueMonth'),
      value: formatCurrency(revenueMonth, 'MXN', 'es-MX'),
      tone: 'good',
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

function paymentAccessPredicate(scope: RoleAccessScope): SQL | undefined {
  if (scope.global) return undefined;

  const predicates: SQL[] = [];
  if (scope.organizationIds.length > 0) {
    predicates.push(inArray(payments.organizationId, scope.organizationIds));
  }
  if (scope.dojoIds.length > 0) {
    predicates.push(inArray(payments.dojoId, scope.dojoIds));
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
