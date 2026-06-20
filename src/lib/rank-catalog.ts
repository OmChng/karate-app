export const rankCatalog = [
  { level: 1, name: '10° Kyu', color: '#ffffff' },
  {
    level: 2,
    name: '10° Kyu',
    color: 'linear-gradient(90deg, #ffffff 0 50%, #facc15 50% 100%)',
  },
  { level: 3, name: '9° Kyu', color: '#facc15' },
  { level: 4, name: '8°/7° Kyu', color: '#fb923c' },
  { level: 5, name: '6°/5° Kyu', color: '#2563eb' },
  { level: 6, name: '4° Kyu', color: '#22c55e' },
  { level: 7, name: '3° Kyu', color: '#a16207' },
  { level: 8, name: '2°/1° Kyu', color: '#78350f' },
  { level: 9, name: 'Shodan-Ho', color: '#111827' },
  { level: 10, name: 'Nidan-Ho', color: '#111827' },
  { level: 11, name: 'Sandan-Ho', color: '#111827' },
  { level: 12, name: 'Yondan-Ho', color: '#111827' },
] as const;

export type RankCatalogEntry = (typeof rankCatalog)[number];
