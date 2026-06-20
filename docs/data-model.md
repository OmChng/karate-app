# Data model — Sensei Modern

> The TypeScript source of truth is [`src/db/schema/`](../src/db/schema/).
> This document mirrors and explains it.

## 1. Entity–relationship diagram

```mermaid
erDiagram
  organization ||--o{ dojo : has
  organization ||--o{ user_role : grants
  organization ||--o{ member : owns
  organization ||--o{ announcement : posts
  organization ||--o{ rank_definition : defines
  organization ||--o{ event : schedules
  dojo ||--o{ class : schedules
  dojo ||--o{ user_role : scopes
  dojo ||--o{ member : enrolls
  class ||--o{ class_instructor : "taught by"
  class ||--o{ attendance : "tracked in"
  user ||--o{ user_role : "has"
  user ||--o{ session : "owns"
  user ||--o{ auth_factor : "registers"
  user ||--o{ audit_log : "actor of"
  member ||--o{ attendance : "records of"
  member ||--o{ payment : "ledger of"
  member ||--o{ promotion : "earns"
  member ||--o{ rank : "history of"
  member ||--o{ member_guardian : "linked to"
  guardian ||--o{ member_guardian : "linked to"
  rank_definition ||--o{ rank : "instance of"
  rank_definition ||--o{ promotion : "target"
  file ||--o{ member : "avatar/document"
  audit_log }o--|| organization : "scoped to"
```

## 2. Conventions

- **IDs**: UUIDv7 (timestamp-ordered) generated DB-side via the
  `gen_random_uuid()` extension is fine for v1; we migrate to UUIDv7
  once Postgres 17 lands across all envs. Stored as `uuid`.
- **Timestamps**: `created_at timestamptz NOT NULL DEFAULT now()`,
  `updated_at timestamptz NOT NULL DEFAULT now()`. Trigger keeps
  `updated_at` fresh.
- **Soft deletes**: `deleted_at timestamptz` (nullable). Partial indexes
  filter on `deleted_at IS NULL` for active rows.
- **Audit fields**: `created_by uuid`, `updated_by uuid` reference
  `user.id` and are written by server actions, never trusted from the
  client.
- **Tenancy**: every business table carries `organization_id` (FK) and,
  where applicable, `dojo_id`. The `withOrg` query helper enforces this
  filter on every read.
- **Naming**: `snake_case` columns, `singular_noun` tables. Junction
  tables are `<a>_<b>`.

## 3. Tables (v1)

### `organization`

| Column                               | Type                                        | Notes               |
| ------------------------------------ | ------------------------------------------- | ------------------- |
| id                                   | uuid PK                                     |                     |
| slug                                 | text UNIQUE                                 | url-safe identifier |
| name                                 | text NOT NULL                               | display name        |
| locale                               | text NOT NULL DEFAULT 'es-MX'               |                     |
| timezone                             | text NOT NULL DEFAULT 'America/Mexico_City' |                     |
| currency                             | text NOT NULL DEFAULT 'MXN'                 | ISO 4217            |
| settings                             | jsonb NOT NULL DEFAULT '{}'                 | feature flags etc.  |
| created_at / updated_at / deleted_at | timestamptz                                 |                     |

Indexes: `slug` unique, `deleted_at IS NULL`.

### `dojo`

Belongs to one organization. May have a parent dojo to support sub-dojos
(self-FK), nullable.

| Column          | Type                          | Notes                |
| --------------- | ----------------------------- | -------------------- |
| id              | uuid PK                       |                      |
| organization_id | uuid FK org                   |                      |
| parent_dojo_id  | uuid FK dojo NULL             | for nested locations |
| name            | text NOT NULL                 |                      |
| code            | text                          | short code           |
| address         | jsonb                         | structured address   |
| timezone        | text                          | overrides org tz     |
| active          | boolean NOT NULL DEFAULT true |                      |
| ... audit/ts    |                               |                      |

Indexes: `(organization_id, active)`, partial `deleted_at IS NULL`.

### `user`

A login identity. May hold multiple roles across orgs/dojos.

| Column            | Type                           | Notes                        |
| ----------------- | ------------------------------ | ---------------------------- |
| id                | uuid PK                        |                              |
| email             | citext UNIQUE NULL             | nullable so phone-only works |
| phone             | text UNIQUE NULL               | E.164 normalized             |
| password_hash     | text                           | argon2id                     |
| name              | text NOT NULL                  |                              |
| locale            | text NOT NULL DEFAULT 'es-MX'  |                              |
| email_verified_at | timestamptz                    |                              |
| phone_verified_at | timestamptz                    |                              |
| last_login_at     | timestamptz                    |                              |
| mfa_enabled       | boolean NOT NULL DEFAULT false |                              |
| ... audit/ts      |                                |                              |

Constraint: `email IS NOT NULL OR phone IS NOT NULL`.

### `user_role`

Joins user → org/dojo with a role.

| Column          | Type              | Notes                                                                                                                              |
| --------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| id              | uuid PK           |                                                                                                                                    |
| user_id         | uuid FK user      |                                                                                                                                    |
| organization_id | uuid FK org       |                                                                                                                                    |
| dojo_id         | uuid FK dojo NULL | NULL means org-wide                                                                                                                |
| role            | text NOT NULL     | enum: `super_admin`, `organization_admin`, `dojo_admin`, `instructor`, `assistant_instructor`, `finance_staff`, `member`, `parent` |
| ... audit/ts    |                   |                                                                                                                                    |

Index: `(user_id, organization_id)`. Unique `(user_id, organization_id, dojo_id, role)`.

### `session`

Auth.js-compatible session table.

| Column        | Type                 | Notes |
| ------------- | -------------------- | ----- |
| id            | uuid PK              |       |
| user_id       | uuid FK user         |       |
| session_token | text UNIQUE          |       |
| expires       | timestamptz NOT NULL |       |
| ip            | inet                 |       |
| user_agent    | text                 |       |

### `account`, `verification_token`, `auth_factor`

Auth.js + MFA scaffolding. Schemas follow the official Drizzle adapter.

### `member`

A student. May be a minor (then guardians are required) or self-managed.

| Column          | Type                               | Notes                                   |
| --------------- | ---------------------------------- | --------------------------------------- |
| id              | uuid PK                            |                                         |
| organization_id | uuid FK org                        |                                         |
| dojo_id         | uuid FK dojo                       | primary dojo                            |
| user_id         | uuid FK user NULL                  | linked login if member self-manages     |
| code            | text                               | dojo-internal code                      |
| first_name      | text NOT NULL                      |                                         |
| last_name       | text NOT NULL                      |                                         |
| date_of_birth   | date                               | drives "is minor"                       |
| gender          | text NULL                          | optional, free-text-of-controlled-vocab |
| email           | citext NULL                        |                                         |
| phone           | text NULL                          |                                         |
| address         | jsonb NULL                         |                                         |
| status          | text NOT NULL DEFAULT 'active'     | enum: `active`, `paused`, `withdrawn`   |
| joined_at       | date NOT NULL DEFAULT current_date |                                         |
| notes           | text NULL                          |                                         |
| avatar_file_id  | uuid FK file NULL                  |                                         |
| ... audit/ts    |                                    |                                         |

Indexes:

- `(organization_id, dojo_id, status)`
- `(organization_id, last_name, first_name)` for sorting
- partial `(organization_id) WHERE deleted_at IS NULL`
- `pg_trgm` GIN on `(first_name || ' ' || last_name)` for fuzzy search

### `guardian`

A parent / legal guardian. May or may not have a `user` login.

| Column          | Type              | Notes                       |
| --------------- | ----------------- | --------------------------- |
| id              | uuid PK           |                             |
| organization_id | uuid FK org       |                             |
| user_id         | uuid FK user NULL |                             |
| first_name      | text NOT NULL     |                             |
| last_name       | text NOT NULL     |                             |
| email           | citext NULL       |                             |
| phone           | text NULL         |                             |
| relationship    | text NULL         | "mother", "father", "tutor" |
| ... audit/ts    |                   |                             |

### `member_guardian`

Junction table: a member has many guardians, a guardian has many members.

```
(member_id, guardian_id) PK
relationship text NULL
is_primary boolean NOT NULL DEFAULT false
```

### `rank_definition`

The belt taxonomy per org (e.g., Goju-Ryu). Defining ranks per org keeps
the model honest about variations.

| Column                 | Type          | Notes                           |
| ---------------------- | ------------- | ------------------------------- |
| id                     | uuid PK       |                                 |
| organization_id        | uuid FK org   |                                 |
| name                   | text NOT NULL | "Cinturón verde"                |
| color                  | text          | hex                             |
| level                  | int NOT NULL  | sort order                      |
| min_age                | int NULL      |                                 |
| min_months_at_previous | int NULL      | minimum tenure before promotion |
| ... audit/ts           |               |                                 |

Unique: `(organization_id, level)`.

### `rank`

Append-only history of a member's belts.

| Column             | Type                           | Notes                       |
| ------------------ | ------------------------------ | --------------------------- |
| id                 | uuid PK                        |                             |
| member_id          | uuid FK member                 |                             |
| rank_definition_id | uuid FK rank_definition        |                             |
| awarded_at         | date NOT NULL                  |                             |
| awarded_by         | uuid FK user NULL              |                             |
| promotion_id       | uuid FK promotion NULL         | back-ref to the exam if any |
| is_current         | boolean NOT NULL DEFAULT false | only one TRUE per member    |
| notes              | text NULL                      |                             |
| ... audit/ts       |                                |                             |

Partial unique index: `(member_id) WHERE is_current = true`.

### `promotion`

Workflow row for a belt promotion.

| Column                    | Type                    | Notes                                                    |
| ------------------------- | ----------------------- | -------------------------------------------------------- |
| id                        | uuid PK                 |                                                          |
| member_id                 | uuid FK member          |                                                          |
| target_rank_definition_id | uuid FK rank_definition |                                                          |
| status                    | text NOT NULL           | enum: `recommended`, `approved`, `rejected`, `cancelled` |
| recommended_by            | uuid FK user NULL       |                                                          |
| approved_by               | uuid FK user NULL       |                                                          |
| exam_date                 | date NULL               |                                                          |
| score                     | numeric(5,2) NULL       |                                                          |
| notes                     | text NULL               |                                                          |
| ... audit/ts              |                         |                                                          |

### `class`

A scheduled class. May be one-off or part of a recurring series.

| Column          | Type                              | Notes                       |
| --------------- | --------------------------------- | --------------------------- |
| id              | uuid PK                           |                             |
| organization_id | uuid FK org                       |                             |
| dojo_id         | uuid FK dojo                      |                             |
| name            | text NOT NULL                     |                             |
| starts_at       | timestamptz NOT NULL              |                             |
| ends_at         | timestamptz NOT NULL              |                             |
| recurrence_rule | text NULL                         | RFC 5545 RRULE if recurring |
| capacity        | int NULL                          |                             |
| rank_min_level  | int NULL                          | prerequisite                |
| status          | text NOT NULL DEFAULT 'scheduled' | enum                        |
| ... audit/ts    |                                   |                             |

### `class_instructor`

Junction.

```
(class_id, user_id) PK
role text NOT NULL  -- 'instructor' | 'assistant_instructor'
```

### `attendance`

Per-class roll call entry.

| Column    | Type                               | Notes                                        |
| --------- | ---------------------------------- | -------------------------------------------- |
| id        | uuid PK                            |                                              |
| class_id  | uuid FK class                      |                                              |
| member_id | uuid FK member                     |                                              |
| status    | text NOT NULL                      | enum: `present`, `late`, `absent`, `excused` |
| marked_by | uuid FK user NULL                  |                                              |
| marked_at | timestamptz NOT NULL DEFAULT now() |                                              |
| notes     | text NULL                          |                                              |

Unique: `(class_id, member_id)`.
Indexes: `(member_id, marked_at desc)`, `(class_id, status)`.

### `payment`

Ledger entry.

| Column          | Type                                       | Notes                                     |
| --------------- | ------------------------------------------ | ----------------------------------------- |
| id              | uuid PK                                    |                                           |
| organization_id | uuid FK org                                |                                           |
| dojo_id         | uuid FK dojo NULL                          |                                           |
| member_id       | uuid FK member                             |                                           |
| amount          | numeric(12,2) NOT NULL CHECK (amount >= 0) |                                           |
| currency        | text NOT NULL DEFAULT 'MXN'                |                                           |
| method          | text NOT NULL                              | enum: `cash`, `transfer`, `card`, `other` |
| period_start    | date NULL                                  |                                           |
| period_end      | date NULL                                  |                                           |
| paid_at         | timestamptz NOT NULL DEFAULT now()         |                                           |
| reference       | text NULL                                  | external reference                        |
| notes           | text NULL                                  |                                           |
| ... audit/ts    |                                            |                                           |

Indexes: `(organization_id, paid_at desc)`, `(member_id, paid_at desc)`.

### `event`, `announcement`, `file`, `audit_log`

Skeletons in the schema with minimum viable columns; full design in v1.1.
`audit_log` is append-only:

```
id, organization_id, actor_user_id, action text, entity text,
entity_id uuid, before jsonb, after jsonb, ip inet, user_agent text,
created_at timestamptz
```

## 4. Indexes summary

Beyond per-table indexes called out above:

- Every FK has an index on the referencing column (Drizzle does this by
  default? — we add explicit ones to be sure).
- Partial `WHERE deleted_at IS NULL` indexes on the active sets of
  `member`, `dojo`, `class`.
- GIN `pg_trgm` index on `member.first_name || ' ' || member.last_name`
  for fuzzy search.
- `(organization_id, dojo_id, created_at desc)` on transactional tables.

## 5. Migration strategy

- Generated via `drizzle-kit generate` from the TS schema.
- Applied via `scripts/migrate.ts` (which uses `drizzle-orm/postgres-js/migrator`).
- Migrations are committed to `drizzle/` and reviewed in PRs.
- Down-migrations are intentionally not generated; we forward-fix.

## 6. Seed strategy

`scripts/seed.ts` populates:

- 1 organization (`Organización Gojukan` demo).
- 1 dojo.
- 1 admin user (`admin@sensei.local`, password `admin1234`, gated by
  `NODE_ENV !== 'production'`).
- 1 instructor user.
- 2 members.
- 8 rank definitions (white → black, simplified Goju-Ryu).
- 1 class for tomorrow.
- A couple of sample attendance + payment rows.

Seed is idempotent (uses `ON CONFLICT DO NOTHING`).

## 7. Data import from the legacy app

Out of scope for the foundation. Once Phase 2 discovery runs against the
real DB, we will know the legacy schema and can write a one-shot importer
in `scripts/import-legacy.ts`.
