ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "first_name_katakana" text;
--> statement-breakpoint
UPDATE "member"
SET "first_name_katakana" = CASE "first_name"
  WHEN 'Luis' THEN 'ルイス'
  WHEN 'María' THEN 'マリア'
  WHEN 'Valeria' THEN 'バレリア'
  WHEN 'Rodrigo' THEN 'ロドリゴ'
  WHEN 'Daniela' THEN 'ダニエラ'
  WHEN 'Héctor' THEN 'エクトル'
  WHEN 'Sofía' THEN 'ソフィア'
  WHEN 'Mateo' THEN 'マテオ'
  WHEN 'Victoria' THEN 'ビクトリア'
  WHEN 'Diego' THEN 'ディエゴ'
  WHEN 'Fernanda' THEN 'フェルナンダ'
  WHEN 'Santiago' THEN 'サンティアゴ'
  WHEN 'Ana' THEN 'アナ'
  WHEN 'Emiliano' THEN 'エミリアノ'
  ELSE "first_name_katakana"
END
WHERE "code" IN (
  'CTR-001',
  'CTR-002',
  'CTR-R01',
  'CTR-R02',
  'CTR-R03',
  'CTR-R04',
  'CTR-R05',
  'CTR-R06',
  'CTR-R07',
  'CTR-R08',
  'CTR-R09',
  'CTR-R10',
  'CTR-R11',
  'CTR-R12'
);
