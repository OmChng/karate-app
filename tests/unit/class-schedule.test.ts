import { describe, expect, it } from 'vitest';
import { formatClassSchedule, formatClassTimeRange } from '../../src/lib/class-schedule';

describe('formatClassSchedule', () => {
  it('formats recurring class days and whole-hour pm ranges', () => {
    expect(
      formatClassSchedule({
        recurrenceRule: 'L,Mi,V',
        startsAt: new Date('2026-01-05T19:00:00'),
        endsAt: new Date('2026-01-05T20:00:00'),
      }),
    ).toBe('L Mi V 7-8 pm');
  });

  it('preserves minutes and period changes', () => {
    expect(formatClassTimeRange('11:30', '12:45')).toBe('11:30 am-12:45 pm');
  });

  it('orders days as L M Mi J V S D', () => {
    expect(
      formatClassSchedule({
        recurrenceRule: 'D,L,V,Mi',
        startsAt: new Date('2026-01-05T17:00:00'),
        endsAt: new Date('2026-01-05T18:00:00'),
      }),
    ).toBe('L Mi V D 5-6 pm');
  });
});
