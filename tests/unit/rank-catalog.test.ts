import { describe, expect, it } from 'vitest';
import { rankCatalog } from '../../src/lib/rank-catalog';
import { canViewBlackBeltLeague } from '../../src/lib/rank-access';
import { getRankIndicatorBackground } from '../../src/lib/rank-visuals';

describe('rankCatalog', () => {
  it('contains the 12 Gojukan grades in order', () => {
    expect(rankCatalog.map((rank) => rank.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(rankCatalog.map((rank) => rank.name)).toEqual([
      '10° Kyu',
      '10° Kyu',
      '9° Kyu',
      '8°/7° Kyu',
      '6°/5° Kyu',
      '4° Kyu',
      '3° Kyu',
      '2°/1° Kyu',
      'Shodan-Ho',
      'Nidan-Ho',
      'Sandan-Ho',
      'Yondan-Ho',
    ]);
  });

  it('uses a gradient for the white and yellow grade', () => {
    const whiteYellow = rankCatalog.find((rank) => rank.level === 2);

    expect(whiteYellow?.color).toContain('linear-gradient');
    expect(whiteYellow?.color).toContain('#ffffff');
    expect(whiteYellow?.color).toContain('#facc15');
  });

  it('uses the non-negotiable association belt colors', () => {
    expect(rankCatalog.find((rank) => rank.level === 1)?.color).toBe('#ffffff');
    expect(rankCatalog.find((rank) => rank.level === 3)?.color).toBe('#facc15');
    expect(rankCatalog.find((rank) => rank.level === 4)?.color).toBe('#fb923c');
    expect(rankCatalog.find((rank) => rank.level === 5)?.color).toBe('#2563eb');
    expect(rankCatalog.find((rank) => rank.level === 6)?.color).toBe('#22c55e');
    expect(rankCatalog.find((rank) => rank.level === 7)?.color).toBe('#a16207');
    expect(rankCatalog.find((rank) => rank.level === 8)?.color).toBe('#78350f');
    expect(rankCatalog.find((rank) => rank.level === 9)?.color).toBe('#111827');
  });

  it('preserves persisted rank colors instead of normalizing them to UI palette colors', () => {
    expect(getRankIndicatorBackground({ color: '#22c55e', level: 6, name: '4° Kyu' })).toBe(
      '#22c55e',
    );
  });

  it('shows black belt league only for cafe, marron, and black belt levels', () => {
    expect([null, undefined, 1, 2, 3, 4, 5, 6].map(canViewBlackBeltLeague)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect([7, 8, 9, 10, 11, 12].map(canViewBlackBeltLeague)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
  });
});
