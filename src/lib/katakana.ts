const FIRST_NAME_KATAKANA: Record<string, string> = {
  abril: 'アブリル',
  alejandra: 'アレハンドラ',
  alejandro: 'アレハンドロ',
  alexa: 'アレクサ',
  alberto: 'アルベルト',
  ana: 'アナ',
  andrea: 'アンドレア',
  andres: 'アンドレス',
  angel: 'アンヘル',
  bruno: 'ブルノ',
  camila: 'カミラ',
  carlos: 'カルロス',
  carolina: 'カロリナ',
  claudia: 'クラウディア',
  daniela: 'ダニエラ',
  diego: 'ディエゴ',
  elena: 'エレナ',
  emilia: 'エミリア',
  emiliano: 'エミリアノ',
  fernanda: 'フェルナンダ',
  fernando: 'フェルナンド',
  gabriela: 'ガブリエラ',
  gael: 'ガエル',
  guadalupe: 'グアダルーペ',
  hector: 'エクトル',
  isabella: 'イサベラ',
  ivan: 'イバン',
  javier: 'ハビエル',
  jorge: 'ホルヘ',
  jose: 'ホセ',
  juan: 'フアン',
  julian: 'フリアン',
  leonardo: 'レオナルド',
  lucia: 'ルシア',
  luis: 'ルイス',
  manuel: 'マヌエル',
  maria: 'マリア',
  mariana: 'マリアナ',
  mateo: 'マテオ',
  mauricio: 'マウリシオ',
  miguel: 'ミゲル',
  monica: 'モニカ',
  natalia: 'ナタリア',
  nicolas: 'ニコラス',
  omar: 'オマル',
  patricio: 'パトリシオ',
  pablo: 'パブロ',
  paula: 'パウラ',
  rafael: 'ラファエル',
  raul: 'ラウル',
  regina: 'レヒナ',
  renata: 'レナタ',
  ricardo: 'リカルド',
  rodrigo: 'ロドリゴ',
  santiago: 'サンティアゴ',
  sebastian: 'セバスティアン',
  sofia: 'ソフィア',
  tomas: 'トマス',
  valeria: 'バレリア',
  victoria: 'ビクトリア',
  ximena: 'ヒメナ',
};

const KATAKANA_SYLLABLES: Record<string, string> = {
  gue: 'ゲ',
  gui: 'ギ',
  que: 'ケ',
  qui: 'キ',
  cha: 'チャ',
  che: 'チェ',
  chi: 'チ',
  cho: 'チョ',
  chu: 'チュ',
  lla: 'ジャ',
  lle: 'ジェ',
  lli: 'ジ',
  llo: 'ジョ',
  llu: 'ジュ',
  ya: 'ジャ',
  ye: 'ジェ',
  yi: 'ジ',
  yo: 'ジョ',
  yu: 'ジュ',
  bra: 'ブラ',
  bre: 'ブレ',
  bri: 'ブリ',
  bro: 'ブロ',
  bru: 'ブル',
  dra: 'ドラ',
  dre: 'ドレ',
  dri: 'ドリ',
  dro: 'ドロ',
  dru: 'ドル',
  fra: 'フラ',
  fre: 'フレ',
  fri: 'フリ',
  fro: 'フロ',
  fru: 'フル',
  gra: 'グラ',
  gre: 'グレ',
  gri: 'グリ',
  gro: 'グロ',
  gru: 'グル',
  pra: 'プラ',
  pre: 'プレ',
  pri: 'プリ',
  pro: 'プロ',
  pru: 'プル',
  tra: 'トラ',
  tre: 'トレ',
  tri: 'トリ',
  tro: 'トロ',
  tru: 'トル',
  ba: 'バ',
  be: 'ベ',
  bi: 'ビ',
  bo: 'ボ',
  bu: 'ブ',
  ca: 'カ',
  ce: 'セ',
  ci: 'シ',
  co: 'コ',
  cu: 'ク',
  da: 'ダ',
  de: 'デ',
  di: 'ディ',
  do: 'ド',
  du: 'ドゥ',
  fa: 'ファ',
  fe: 'フェ',
  fi: 'フィ',
  fo: 'フォ',
  fu: 'フ',
  ga: 'ガ',
  ge: 'ヘ',
  gi: 'ヒ',
  go: 'ゴ',
  gu: 'グ',
  ja: 'ハ',
  je: 'ヘ',
  ji: 'ヒ',
  jo: 'ホ',
  ju: 'フ',
  ka: 'カ',
  ke: 'ケ',
  ki: 'キ',
  ko: 'コ',
  ku: 'ク',
  la: 'ラ',
  le: 'レ',
  li: 'リ',
  lo: 'ロ',
  lu: 'ル',
  ma: 'マ',
  me: 'メ',
  mi: 'ミ',
  mo: 'モ',
  mu: 'ム',
  na: 'ナ',
  ne: 'ネ',
  ni: 'ニ',
  no: 'ノ',
  nu: 'ヌ',
  ña: 'ニャ',
  ñe: 'ニェ',
  ñi: 'ニ',
  ño: 'ニョ',
  ñu: 'ニュ',
  pa: 'パ',
  pe: 'ペ',
  pi: 'ピ',
  po: 'ポ',
  pu: 'プ',
  ra: 'ラ',
  re: 'レ',
  ri: 'リ',
  ro: 'ロ',
  ru: 'ル',
  rra: 'ラ',
  rre: 'レ',
  rri: 'リ',
  rro: 'ロ',
  rru: 'ル',
  sa: 'サ',
  se: 'セ',
  si: 'シ',
  so: 'ソ',
  su: 'ス',
  ta: 'タ',
  te: 'テ',
  ti: 'ティ',
  to: 'ト',
  tu: 'トゥ',
  va: 'バ',
  ve: 'ベ',
  vi: 'ビ',
  vo: 'ボ',
  vu: 'ブ',
  za: 'サ',
  ze: 'セ',
  zi: 'シ',
  zo: 'ソ',
  zu: 'ス',
  a: 'ア',
  e: 'エ',
  i: 'イ',
  o: 'オ',
  u: 'ウ',
};

const FINAL_CONSONANTS: Record<string, string> = {
  b: 'ブ',
  c: 'ク',
  d: 'ド',
  f: 'フ',
  g: 'グ',
  j: 'フ',
  k: 'ク',
  l: 'ル',
  m: 'ン',
  n: 'ン',
  p: 'プ',
  q: 'ク',
  r: 'ル',
  s: 'ス',
  t: 'ト',
  v: 'ブ',
  x: 'クス',
  z: 'ス',
};

const ORDERED_SYLLABLES = Object.keys(KATAKANA_SYLLABLES).sort((a, b) => b.length - a.length);

export function firstGivenName(value: string): string {
  return value.trim().split(/\s+/).filter(Boolean)[0] ?? '';
}

export function latinNameKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñ]/g, '');
}

export function katakanaForFirstName(value: string): string {
  const key = latinNameKey(firstGivenName(value));
  if (!key) return '';

  const knownName = FIRST_NAME_KATAKANA[key];
  if (knownName) return knownName;

  return transliterateLatinNameToKatakana(key);
}

function transliterateLatinNameToKatakana(value: string): string {
  let remaining = value;
  let result = '';

  while (remaining.length > 0) {
    if (remaining.startsWith('h')) {
      remaining = remaining.slice(1);
      continue;
    }

    const syllable = ORDERED_SYLLABLES.find((candidate) => remaining.startsWith(candidate));
    if (syllable) {
      result += KATAKANA_SYLLABLES[syllable];
      remaining = remaining.slice(syllable.length);
      continue;
    }

    const firstLetter = remaining[0]!;
    result += FINAL_CONSONANTS[firstLetter] ?? '';
    remaining = remaining.slice(1);
  }

  return result;
}
