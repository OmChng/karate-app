const domainRankColors = {
  white: '#ffffff',
  yellow: '#facc15',
  orange: '#fb923c',
  blue: '#2563eb',
  green: '#22c55e',
  softBrown: '#a16207',
  darkBrown: '#78350f',
  black: '#111827',
} as const;

export function getRankIndicatorBackground(rank: {
  level?: number | null;
  name?: string | null;
  color?: string | null;
}) {
  if (rank.color) return rank.color;

  const level = rank.level ?? inferRankLevel(rank.name, rank.color);

  switch (level) {
    case 1:
      return domainRankColors.white;
    case 2:
      return split(domainRankColors.white, domainRankColors.yellow);
    case 3:
      return domainRankColors.yellow;
    case 4:
      return domainRankColors.orange;
    case 5:
      return domainRankColors.blue;
    case 6:
      return domainRankColors.green;
    case 7:
      return domainRankColors.softBrown;
    case 8:
      return domainRankColors.darkBrown;
    case 9:
    case 10:
    case 11:
    case 12:
      return domainRankColors.black;
    default:
      return null;
  }
}

function inferRankLevel(name: string | null | undefined, color: string | null | undefined) {
  if (!name) return null;

  if (name === '10° Kyu') {
    return color?.includes('linear-gradient') ? 2 : 1;
  }
  if (name === '9° Kyu') return 3;
  if (name === '8°/7° Kyu') return 4;
  if (name === '6°/5° Kyu') return 5;
  if (name === '4° Kyu') return 6;
  if (name === '3° Kyu') return 7;
  if (name === '2°/1° Kyu') return 8;
  if (name === 'Shodan-Ho') return 9;
  if (name === 'Nidan-Ho') return 10;
  if (name === 'Sandan-Ho') return 11;
  if (name === 'Yondan-Ho') return 12;

  return null;
}

function split(a: string, b: string) {
  return `linear-gradient(90deg, ${a} 0 50%, ${b} 50% 100%)`;
}
