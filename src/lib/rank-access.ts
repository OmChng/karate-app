export const BLACK_BELT_LEAGUE_MIN_RANK_LEVEL = 7;

export function canViewBlackBeltLeague(rankLevel: number | null | undefined) {
  return typeof rankLevel === 'number' && rankLevel >= BLACK_BELT_LEAGUE_MIN_RANK_LEVEL;
}
