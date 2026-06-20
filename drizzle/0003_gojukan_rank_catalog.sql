WITH rank_catalog(level, name, color) AS (
  VALUES
    (1, '10° Kyu', '#ffffff'),
    (2, '10° Kyu', 'linear-gradient(90deg, #ffffff 0 50%, #facc15 50% 100%)'),
    (3, '9° Kyu', '#facc15'),
    (4, '8°/7° Kyu', '#fb923c'),
    (5, '6°/5° Kyu', '#2563eb'),
    (6, '4° Kyu', '#22c55e'),
    (7, '3° Kyu', '#a16207'),
    (8, '2°/1° Kyu', '#78350f'),
    (9, 'Shodan-Ho', '#111827'),
    (10, 'Nidan-Ho', '#111827'),
    (11, 'Sandan-Ho', '#111827'),
    (12, 'Yondan-Ho', '#111827')
)
INSERT INTO "rank_definition" ("organization_id", "level", "name", "color")
SELECT "organization"."id", rank_catalog.level, rank_catalog.name, rank_catalog.color
FROM "organization"
CROSS JOIN rank_catalog
ON CONFLICT ("organization_id", "level") DO UPDATE
SET
  "name" = excluded."name",
  "color" = excluded."color",
  "updated_at" = now();
