const ORDERED_DAYS = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'] as const;
const JS_DAY_TO_TOKEN = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'] as const;

export type ClassDayToken = (typeof ORDERED_DAYS)[number];

export function normalizeClassDays(value: string | null | undefined): ClassDayToken[] {
  const tokens = (value ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter((token): token is ClassDayToken => ORDERED_DAYS.includes(token as ClassDayToken));

  return ORDERED_DAYS.filter((day) => tokens.includes(day));
}

export function formatClassSchedule(input: {
  recurrenceRule?: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
}) {
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const recurrenceDays = normalizeClassDays(input.recurrenceRule);
  const days =
    recurrenceDays.length > 0 ? recurrenceDays : [JS_DAY_TO_TOKEN[startsAt.getDay()] ?? 'L'];

  return `${days.join(' ')} ${formatTimeRange(startsAt, endsAt)}`;
}

export function formatClassTimeRange(startTime: string, endTime: string) {
  const start = dateFromTime(startTime);
  const end = dateFromTime(endTime);
  return formatTimeRange(start, end);
}

export function classDateFromTime(time: string, reference = new Date()) {
  const [hours = '0', minutes = '0'] = time.split(':');
  const date = new Date(reference);
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
}

function dateFromTime(time: string) {
  return classDateFromTime(time, new Date('2026-01-05T00:00:00'));
}

function formatTimeRange(start: Date, end: Date) {
  const startPeriod = start.getHours() >= 12 ? 'pm' : 'am';
  const endPeriod = end.getHours() >= 12 ? 'pm' : 'am';
  const startText = formatClock(start, startPeriod !== endPeriod);
  const endText = formatClock(end, true);
  return `${startText}-${endText}`;
}

function formatClock(date: Date, includePeriod: boolean) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const hours12 = hours24 % 12 || 12;
  const minuteText = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
  const period = hours24 >= 12 ? 'pm' : 'am';
  return `${hours12}${minuteText}${includePeriod ? ` ${period}` : ''}`;
}
