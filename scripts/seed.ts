/**
 * Seeds the database with Gojukan demo data for local development.
 *
 * Idempotent: re-running won't duplicate rows.
 * Refuses to run in production.
 *
 * Usage: pnpm db:seed
 */
import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: '.env.local', quiet: true });
loadDotenv({ quiet: true });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import * as argon2 from 'argon2';
import {
  organizations,
  dojos,
  users,
  userRoles,
  members,
  rankDefinitions,
  ranks,
  classes,
  classInstructors,
  memberClassAssignments,
  rooms,
  guardians,
  memberGuardians,
  attendance,
  payments,
  files,
} from '../src/db/schema';
import type { UserRole } from '../src/db/schema';
import { katakanaForFirstName } from '../src/lib/katakana';
import { rankCatalog } from '../src/lib/rank-catalog';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run seed in production.');
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');

const client = postgres(url, { max: 1 });
const db = drizzle(client);

async function hash(pw: string) {
  return argon2.hash(pw, { type: argon2.argon2id });
}

const BOSQUES_KEY = 'bosquesSantaAnita';
const MIN_STUDENTS_PER_ACADEMY = 60;
const DEFAULT_STUDENTS_PER_ACADEMY = 80;
const MAX_STUDENTS_PER_ACADEMY = 100;

const SEEDED_ACADEMIES = [
  {
    key: BOSQUES_KEY,
    code: 'BSA',
    sourceId: '32',
    area: 'Jalisco',
    name: 'Bosques de Santa Anita',
    address:
      'Boulevard Bosques de Santa Anita 2355-28, San Agustín, 45643 Tlajomulco de Zúñiga, Jal.',
    lat: 20.571194104695888,
    lng: -103.49416761616162,
    phone: '3313423048',
    whatsapp: '3313423048',
  },
  {
    key: 'bugambilias',
    code: 'BUG',
    sourceId: '24',
    area: 'Zapopan',
    name: 'Bugambilias',
    address: 'Av. Lorenzo Barcelata 513 Int. 4, Valle de Bugambilias, 45237 Zapopan, Jal.',
    lat: 20.608971250867985,
    lng: -103.4485284519446,
    phone: '3330778952',
    whatsapp: '3330778952',
  },
  {
    key: 'lasAguilas',
    code: 'AGU',
    sourceId: '18',
    area: 'Zapopan',
    name: 'Las Águilas',
    address: 'Av. Sierra de Mazamitla 5733, Pinar de la Calma, 45080 Zapopan, Jal.',
    lat: 20.62322366268819,
    lng: -103.41526651928667,
    phone: '3336347906',
    whatsapp: '3333925394',
  },
  {
    key: 'sanAgustin',
    code: 'SAG',
    sourceId: '17',
    area: 'Tlajomulco de Zúñiga',
    name: 'San Agustín',
    address: 'José María Morelos 115-B, Colonia San Agustín, 45645 Tlajomulco de Zúñiga, Jal.',
    lat: 20.547979010094775,
    lng: -103.46245301276805,
    phone: '3332716129',
    whatsapp: '3334449972',
  },
] as const;

const SEEDED_ROOMS_BY_ACADEMY = {
  bosquesSantaAnita: [
    {
      key: 'principal',
      name: 'Dojo principal',
      capacity: 24,
      notes: 'Tatami principal para clases regulares y grupos grandes.',
    },
    {
      key: 'auxiliar',
      name: 'Salón auxiliar',
      capacity: 14,
      notes: 'Espacio secundario para grupos pequeños, asesorías y preparación.',
    },
  ],
  bugambilias: [
    {
      key: 'principal',
      name: 'Dojo principal',
      capacity: 22,
      notes: 'Salón principal para la operación semanal de Bugambilias.',
    },
  ],
  lasAguilas: [
    {
      key: 'principal',
      name: 'Dojo principal',
      capacity: 22,
      notes: 'Salón principal para la operación semanal de Las Águilas.',
    },
  ],
  sanAgustin: [
    {
      key: 'principal',
      name: 'Dojo principal',
      capacity: 22,
      notes: 'Salón principal para la operación semanal de San Agustín.',
    },
  ],
} as const;

type SeedAcademy = (typeof SEEDED_ACADEMIES)[number];
type SeedAcademyKey = SeedAcademy['key'];
type SeedRoomKey = (typeof SEEDED_ROOMS_BY_ACADEMY)[SeedAcademyKey][number]['key'];

interface MemberSeedInput {
  firstName: string;
  firstNameKatakana?: string;
  lastName: string;
  code: string;
  rankLevel: number;
  avatarFileKey?: string;
  dateOfBirth?: string;
  curp?: string;
  bloodType?: string;
  specialCareNotes?: string;
  emergencyPhone?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

function seedStudentsPerAcademy() {
  const raw = process.env.SEED_STUDENTS_PER_ACADEMY;
  if (!raw) return DEFAULT_STUDENTS_PER_ACADEMY;

  const value = Number(raw);
  if (
    !Number.isInteger(value) ||
    value < MIN_STUDENTS_PER_ACADEMY ||
    value > MAX_STUDENTS_PER_ACADEMY
  ) {
    throw new Error(
      `SEED_STUDENTS_PER_ACADEMY must be an integer between ${MIN_STUDENTS_PER_ACADEMY} and ${MAX_STUDENTS_PER_ACADEMY}.`,
    );
  }
  return value;
}

const STUDENTS_PER_ACADEMY = seedStudentsPerAcademy();

const GENERATED_FIRST_NAMES = [
  'Valeria',
  'Mateo',
  'Camila',
  'Santiago',
  'Regina',
  'Leonardo',
  'Sofía',
  'Emiliano',
  'Ximena',
  'Diego',
  'Natalia',
  'Rodrigo',
  'Lucía',
  'Bruno',
  'Mariana',
  'Julián',
  'Abril',
  'Mauricio',
  'Alexa',
  'Omar',
  'Andrea',
  'Jorge',
  'Gabriela',
  'Ricardo',
  'Alejandra',
  'Manuel',
  'Mónica',
  'Fernando',
  'Ana',
  'Pablo',
  'Carlos',
  'Isabella',
  'Renata',
  'Gael',
  'Paula',
  'Nicolás',
] as const;

const GENERATED_PATERNAL_LAST_NAMES = [
  'Aguilar',
  'Arias',
  'Bautista',
  'Benítez',
  'Campos',
  'Carrillo',
  'Castillo',
  'Ceballos',
  'Cortés',
  'Delgado',
  'Escobar',
  'Espinosa',
  'Ferrer',
  'Fuentes',
  'García',
  'Gómez',
  'Hernández',
  'Ibarra',
  'Lara',
  'López',
  'Luna',
  'Márquez',
  'Mejía',
  'Mendoza',
  'Montiel',
  'Morales',
  'Nava',
  'Núñez',
  'Ochoa',
  'Ortega',
  'Palacios',
  'Paredes',
  'Pérez',
  'Pineda',
  'Quiroz',
  'Ramos',
] as const;

const GENERATED_MATERNAL_LAST_NAMES = [
  'Alcántara',
  'Beltrán',
  'Brito',
  'Cárdenas',
  'Castañeda',
  'Cruz',
  'Díaz',
  'Franco',
  'Gil',
  'Herrera',
  'Lara',
  'León',
  'Lozano',
  'Maldonado',
  'Medina',
  'Mena',
  'Mercado',
  'Mora',
  'Nava',
  'Paredes',
  'Peña',
  'Ponce',
  'Prado',
  'Ríos',
  'Rivas',
  'Robles',
  'Ruiz',
  'Salas',
  'Salcedo',
  'Soto',
  'Tapia',
  'Trejo',
  'Valle',
  'Vargas',
  'Vera',
  'Vidal',
] as const;

const GENERATED_BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'] as const;

function generatedDateOfBirth(sequence: number) {
  const group = sequence % 5;
  const year =
    group === 0
      ? 2019 - (sequence % 2)
      : group <= 2
        ? 2017 - (sequence % 4)
        : group === 3
          ? 2012 - (sequence % 5)
          : 2006 - (sequence % 22);
  const month = (sequence % 12) + 1;
  const day = (sequence % 27) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generatedRankLevel(sequence: number) {
  const group = sequence % 5;
  if (group === 0) return 1 + (sequence % 3);
  if (group <= 2) return 1 + (sequence % 6);
  if (group === 3) return 2 + (sequence % 7);
  return 4 + (sequence % 9);
}

function generatedPhone(base: string, academy: SeedAcademy, sequence: number, offset = 0) {
  const prefix = base.replace(/\D/g, '').slice(0, 6).padEnd(6, '0');
  const suffix = String(Number(academy.sourceId) * 100 + sequence + offset)
    .padStart(4, '0')
    .slice(-4);
  return `${prefix}${suffix}`;
}

function generatedMemberInput(academy: SeedAcademy, sequence: number): MemberSeedInput {
  const firstName = GENERATED_FIRST_NAMES[(sequence - 1) % GENERATED_FIRST_NAMES.length]!;
  const paternal =
    GENERATED_PATERNAL_LAST_NAMES[
      (sequence + academy.code.length - 1) % GENERATED_PATERNAL_LAST_NAMES.length
    ]!;
  const maternal =
    GENERATED_MATERNAL_LAST_NAMES[
      (sequence * 3 + academy.sourceId.length) % GENERATED_MATERNAL_LAST_NAMES.length
    ]!;
  const padded = String(sequence).padStart(3, '0');
  const lowerCode = academy.code.toLowerCase();

  return {
    firstName,
    firstNameKatakana: katakanaForFirstName(firstName),
    lastName: `${paternal} ${maternal}`,
    code: `${academy.code}-G${padded}`,
    rankLevel: generatedRankLevel(sequence),
    dateOfBirth: generatedDateOfBirth(sequence),
    bloodType: GENERATED_BLOOD_TYPES[(sequence - 1) % GENERATED_BLOOD_TYPES.length],
    emergencyPhone: generatedPhone(academy.whatsapp, academy, sequence, 500),
    email: `demo.${lowerCode}.gen${padded}@sensei.local`,
    phone: generatedPhone(academy.phone, academy, sequence),
    notes: `Alumno demo generado para carga de datos en ${academy.name}.`,
  };
}

async function main() {
  console.log('Seeding demo data...');

  const stats = {
    dojosCreated: 0,
    dojosUpdated: 0,
    usersCreated: 0,
    usersUpdated: 0,
    rolesCreated: 0,
    roomsCreated: 0,
    roomsUpdated: 0,
    membersCreated: 0,
    membersUpdated: 0,
    guardiansCreated: 0,
    guardiansUpdated: 0,
    guardianLinksCreated: 0,
    classesCreated: 0,
    classesUpdated: 0,
    attendanceCreated: 0,
    paymentsCreated: 0,
  };

  // Organization
  const orgSlug = 'gojukan-demo';
  let [org] = await db.select().from(organizations).where(eq(organizations.slug, orgSlug));
  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({
        slug: orgSlug,
        name: 'Organización Gojukan (Demo)',
        locale: 'es-MX',
      })
      .returning();
  }

  async function upsertAcademyDojo(academy: SeedAcademy) {
    const candidates =
      academy.key === BOSQUES_KEY
        ? await db
            .select()
            .from(dojos)
            .where(
              sql`${dojos.organizationId} = ${org!.id} AND (${dojos.code} = ${academy.code} OR ${dojos.name} = ${academy.name} OR ${dojos.code} = 'CTR' OR ${dojos.name} = 'Dojo Central')`,
            )
        : await db
            .select()
            .from(dojos)
            .where(
              sql`${dojos.organizationId} = ${org!.id} AND (${dojos.code} = ${academy.code} OR ${dojos.name} = ${academy.name})`,
            );
    let row =
      candidates.find((candidate) => candidate.code === academy.code) ??
      candidates.find((candidate) => candidate.name === academy.name) ??
      candidates[0];
    const dojoValues = {
      organizationId: org!.id,
      name: academy.name,
      code: academy.code,
      address: {
        area: academy.area,
        line1: academy.address,
        lat: academy.lat,
        lng: academy.lng,
        phone: academy.phone,
        whatsapp: academy.whatsapp,
        publicKey: academy.key,
        sourceId: academy.sourceId,
      },
      timezone: 'America/Mexico_City',
      active: true,
      deletedAt: null,
      updatedAt: new Date(),
    };

    if (!row) {
      [row] = await db.insert(dojos).values(dojoValues).returning();
      stats.dojosCreated += 1;
      return row!;
    }

    const [updated] = await db
      .update(dojos)
      .set(dojoValues)
      .where(eq(dojos.id, row.id))
      .returning();
    stats.dojosUpdated += 1;
    return updated ?? row;
  }

  async function moveLegacyCentralDojoData(targetDojoId: string) {
    const legacyDojos = await db
      .select()
      .from(dojos)
      .where(
        sql`${dojos.organizationId} = ${org!.id} AND ${dojos.id} <> ${targetDojoId} AND (${dojos.code} = 'CTR' OR ${dojos.name} = 'Dojo Central')`,
      );

    for (const legacyDojo of legacyDojos) {
      await db
        .update(members)
        .set({ dojoId: targetDojoId })
        .where(eq(members.dojoId, legacyDojo.id));
      await db
        .update(classes)
        .set({ dojoId: targetDojoId })
        .where(eq(classes.dojoId, legacyDojo.id));
      await db
        .update(payments)
        .set({ dojoId: targetDojoId })
        .where(eq(payments.dojoId, legacyDojo.id));
      await db
        .update(userRoles)
        .set({ dojoId: targetDojoId })
        .where(eq(userRoles.dojoId, legacyDojo.id));
      await db
        .update(dojos)
        .set({
          active: false,
          deletedAt: new Date(),
          updatedAt: new Date(),
          code: `CTR-MIGRADO-${legacyDojo.id.slice(0, 8)}`,
          name: 'Dojo Central (migrado a Bosques de Santa Anita)',
        })
        .where(eq(dojos.id, legacyDojo.id));
    }
  }

  const academyDojosByKey = {} as Record<
    SeedAcademyKey,
    Awaited<ReturnType<typeof upsertAcademyDojo>>
  >;
  for (const academy of SEEDED_ACADEMIES) {
    academyDojosByKey[academy.key] = await upsertAcademyDojo(academy);
  }
  await moveLegacyCentralDojoData(academyDojosByKey[BOSQUES_KEY].id);

  async function ensureRoom(
    academyKey: SeedAcademyKey,
    input: (typeof SEEDED_ROOMS_BY_ACADEMY)[SeedAcademyKey][number],
  ) {
    const dojo = academyDojosByKey[academyKey];
    let [row] = await db
      .select()
      .from(rooms)
      .where(sql`${rooms.dojoId} = ${dojo.id} AND ${rooms.name} = ${input.name}`);
    const roomValues = {
      organizationId: org!.id,
      dojoId: dojo.id,
      name: input.name,
      capacity: input.capacity,
      notes: input.notes,
      active: true,
      deletedAt: null,
      updatedAt: new Date(),
    };

    if (!row) {
      [row] = await db.insert(rooms).values(roomValues).returning();
      stats.roomsCreated += 1;
      return row!;
    }

    const [updated] = await db
      .update(rooms)
      .set(roomValues)
      .where(eq(rooms.id, row.id))
      .returning();
    stats.roomsUpdated += 1;
    return updated ?? row;
  }

  const academyRoomsByKey = {} as Record<
    SeedAcademyKey,
    Record<SeedRoomKey, typeof rooms.$inferSelect>
  >;
  for (const academy of SEEDED_ACADEMIES) {
    academyRoomsByKey[academy.key] = {} as Record<SeedRoomKey, typeof rooms.$inferSelect>;
    for (const roomInput of SEEDED_ROOMS_BY_ACADEMY[academy.key]) {
      academyRoomsByKey[academy.key][roomInput.key] = await ensureRoom(academy.key, roomInput);
    }
  }

  // Users
  async function upsertUser(input: {
    email: string;
    name: string;
    password: string;
    role: UserRole;
    dojoId?: string | null;
  }) {
    let [user] = await db.select().from(users).where(eq(users.email, input.email));
    const passwordHash = await hash(input.password);
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
          passwordHash,
          emailVerifiedAt: new Date(),
        })
        .returning();
      stats.usersCreated += 1;
    } else {
      const [updated] = await db
        .update(users)
        .set({
          name: input.name,
          passwordHash,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      user = updated ?? user;
      stats.usersUpdated += 1;
    }
    const existing = await db
      .select()
      .from(userRoles)
      .where(
        input.dojoId
          ? sql`${userRoles.userId} = ${user!.id} AND ${userRoles.organizationId} = ${org!.id} AND ${userRoles.dojoId} = ${input.dojoId} AND ${userRoles.role} = ${input.role}`
          : sql`${userRoles.userId} = ${user!.id} AND ${userRoles.organizationId} = ${org!.id} AND ${userRoles.dojoId} IS NULL AND ${userRoles.role} = ${input.role}`,
      );
    if (existing.length === 0) {
      await db.insert(userRoles).values({
        userId: user!.id,
        organizationId: org!.id,
        dojoId: input.dojoId ?? null,
        role: input.role,
      });
      stats.rolesCreated += 1;
    }
    return user!;
  }

  async function disableLegacyGenericLogin(email: string) {
    const [legacyUser] = await db.select().from(users).where(eq(users.email, email));
    if (!legacyUser) return;
    await db
      .update(users)
      .set({
        email: `retired.${legacyUser.id.slice(0, 8)}.${email}`,
        passwordHash: null,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, legacyUser.id));
  }

  await upsertUser({
    email: 'superadmin@sensei.local',
    name: 'Super Admin Gojukan',
    password: 'superadmin1234',
    role: 'super_admin',
    dojoId: null,
  });

  await upsertUser({
    email: 'orgadmin@sensei.local',
    name: 'Administración Gojukan',
    password: 'admin1234',
    role: 'organization_admin',
    dojoId: null,
  });

  const academyUsersByKey = {} as Record<
    SeedAcademyKey,
    {
      admin: Awaited<ReturnType<typeof upsertUser>>;
      instructor: Awaited<ReturnType<typeof upsertUser>>;
    }
  >;
  for (const academy of SEEDED_ACADEMIES) {
    const normalizedKey = academy.key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const dojoId = academyDojosByKey[academy.key].id;
    academyUsersByKey[academy.key] = {
      admin: await upsertUser({
        email: `admin.${normalizedKey}@sensei.local`,
        name: `Admin ${academy.name}`,
        password: 'admin1234',
        role: 'dojo_admin',
        dojoId,
      }),
      instructor: await upsertUser({
        email: `sensei.${normalizedKey}@sensei.local`,
        name: `Sensei ${academy.name}`,
        password: 'sensei1234',
        role: 'instructor',
        dojoId,
      }),
    };
  }

  await disableLegacyGenericLogin('admin@sensei.local');
  await disableLegacyGenericLogin('sensei@sensei.local');

  // Rank definitions (Gojukan scale)
  for (const b of rankCatalog) {
    const existing = await db
      .select()
      .from(rankDefinitions)
      .where(
        sql`${rankDefinitions.organizationId} = ${org!.id} AND ${rankDefinitions.level} = ${b.level}`,
      );
    if (existing.length === 0) {
      await db.insert(rankDefinitions).values({ organizationId: org!.id, ...b });
    } else if (existing[0]!.name !== b.name || existing[0]!.color !== b.color) {
      await db
        .update(rankDefinitions)
        .set({ name: b.name, color: b.color, updatedAt: new Date() })
        .where(eq(rankDefinitions.id, existing[0]!.id));
    }
  }
  const allRanks = await db
    .select()
    .from(rankDefinitions)
    .where(eq(rankDefinitions.organizationId, org!.id));

  // Members
  const seededMembersByAcademy: Record<
    SeedAcademyKey,
    Array<Awaited<ReturnType<typeof upsertMember>>>
  > = {
    bosquesSantaAnita: [],
    bugambilias: [],
    lasAguilas: [],
    sanAgustin: [],
  };

  // Members without an explicit academy are legacy CTR demo records and belong to Bosques.
  async function upsertMember(input: MemberSeedInput & { academyKey?: SeedAcademyKey }) {
    const academyKey = input.academyKey ?? BOSQUES_KEY;
    const dojo = academyDojosByKey[academyKey];
    const actor = academyUsersByKey[academyKey].admin;
    const existing = await db
      .select()
      .from(members)
      .where(sql`${members.organizationId} = ${org!.id} AND ${members.code} = ${input.code}`);
    let row = existing[0];
    const avatarFileId = input.avatarFileKey
      ? (await ensureAvatarFile(input.avatarFileKey, `${input.code}.svg`, actor.id)).id
      : row?.avatarFileId;
    const memberValues = {
      dojoId: dojo!.id,
      ...(avatarFileId ? { avatarFileId } : {}),
      firstName: input.firstName,
      firstNameKatakana: input.firstNameKatakana,
      lastName: input.lastName,
      code: input.code,
      curp: input.curp,
      dateOfBirth: input.dateOfBirth,
      bloodType: input.bloodType,
      specialCareNotes: input.specialCareNotes,
      emergencyPhone: input.emergencyPhone,
      email: input.email,
      phone: input.phone,
      status: 'active' as const,
      notes: input.notes,
      updatedBy: actor.id,
      updatedAt: new Date(),
    };

    if (!row) {
      [row] = await db
        .insert(members)
        .values({
          organizationId: org!.id,
          ...memberValues,
          createdBy: actor.id,
        })
        .returning();
      stats.membersCreated += 1;
    } else {
      const [updated] = await db
        .update(members)
        .set(memberValues)
        .where(eq(members.id, row.id))
        .returning();
      row = updated ?? row;
      stats.membersUpdated += 1;
    }
    await ensureCurrentRank(row!.id, input.rankLevel, actor.id);
    await ensureClientForMember(row!, input, academyKey);
    seededMembersByAcademy[academyKey].push(row!);
    return row!;
  }

  async function ensureAvatarFile(key: string, originalName: string, uploadedBy: string) {
    const [existing] = await db
      .select()
      .from(files)
      .where(sql`${files.organizationId} = ${org!.id} AND ${files.key} = ${key}`);
    if (existing) return existing;

    const [file] = await db
      .insert(files)
      .values({
        organizationId: org!.id,
        uploadedBy,
        key,
        contentType: 'image/svg+xml',
        originalName,
      })
      .returning();
    return file!;
  }

  async function ensureCurrentRank(memberId: string, rankLevel: number, awardedBy: string) {
    const def = allRanks.find((r) => r.level === rankLevel);
    if (!def) return;

    const [current] = await db
      .select({ rankId: ranks.id, level: rankDefinitions.level })
      .from(ranks)
      .innerJoin(rankDefinitions, eq(rankDefinitions.id, ranks.rankDefinitionId))
      .where(sql`${ranks.memberId} = ${memberId} AND ${ranks.isCurrent} = true`);

    if (current?.level === rankLevel) return;

    await db
      .update(ranks)
      .set({ isCurrent: false })
      .where(sql`${ranks.memberId} = ${memberId} AND ${ranks.isCurrent} = true`);

    await db.insert(ranks).values({
      memberId,
      rankDefinitionId: def.id,
      awardedAt: new Date().toISOString().slice(0, 10),
      awardedBy,
      isCurrent: true,
      notes: 'Rango demo asignado por seed.',
    });
  }

  function codeToken(code: string) {
    return code
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function codeNumber(code: string) {
    return [...code].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

  function fallbackClientPhone(academy: SeedAcademy, code: string) {
    return generatedPhone(academy.whatsapp, academy, (codeNumber(code) % 700) + 100, 900);
  }

  async function ensureClientForMember(
    member: typeof members.$inferSelect,
    input: MemberSeedInput,
    academyKey: SeedAcademyKey,
  ) {
    const academy = SEEDED_ACADEMIES.find((item) => item.key === academyKey)!;
    const age = ageFromDateOfBirth(input.dateOfBirth);
    const underage = age === null || age < 18;
    const token = codeToken(input.code);
    const relationship = underage ? 'tutor' : 'alumno';
    const email = `cliente.${token}@sensei.local`;
    const phone =
      (underage ? input.emergencyPhone || input.phone : input.phone || input.emergencyPhone) ??
      fallbackClientPhone(academy, input.code);
    const clientValues = {
      organizationId: org!.id,
      firstName: underage ? `Tutor ${input.firstName}` : input.firstName,
      lastName: input.lastName,
      email,
      phone,
      relationship,
      deletedAt: null,
      updatedAt: new Date(),
    };

    let [client] = await db
      .select()
      .from(guardians)
      .where(sql`${guardians.organizationId} = ${org!.id} AND ${guardians.email} = ${email}`);

    if (!client) {
      [client] = await db.insert(guardians).values(clientValues).returning();
      stats.guardiansCreated += 1;
    } else {
      const [updated] = await db
        .update(guardians)
        .set(clientValues)
        .where(eq(guardians.id, client.id))
        .returning();
      client = updated ?? client;
      stats.guardiansUpdated += 1;
    }

    const existingLink = await db
      .select()
      .from(memberGuardians)
      .where(
        sql`${memberGuardians.memberId} = ${member.id} AND ${memberGuardians.guardianId} = ${client!.id}`,
      );

    if (existingLink.length === 0) {
      await db.insert(memberGuardians).values({
        memberId: member.id,
        guardianId: client!.id,
        relationship,
        isPrimary: true,
      });
      stats.guardianLinksCreated += 1;
    }
  }

  type DemoClassKey = 'smallKids' | 'bigKids' | 'teens' | 'adults';
  const demoClassAssignments: Array<{
    academyKey: SeedAcademyKey;
    memberId: string;
    classKey: DemoClassKey;
  }> = [];

  function ageFromDateOfBirth(dateOfBirth?: string) {
    if (!dateOfBirth) return null;
    const [yearText, monthText, dayText] = dateOfBirth.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (!year || !month || !day) return null;

    const today = new Date();
    let age = today.getFullYear() - year;
    const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
    if (today < birthdayThisYear) age -= 1;
    return age;
  }

  function classKeyForDateOfBirth(dateOfBirth?: string): DemoClassKey {
    const age = ageFromDateOfBirth(dateOfBirth);
    if (age === null) return 'adults';
    if (age <= 8) return 'smallKids';
    if (age <= 12) return 'bigKids';
    if (age <= 17) return 'teens';
    return 'adults';
  }

  function queueClassAssignment(
    memberId: string,
    dateOfBirth?: string,
    academyKey: SeedAcademyKey = BOSQUES_KEY,
  ) {
    demoClassAssignments.push({
      academyKey,
      memberId,
      classKey: classKeyForDateOfBirth(dateOfBirth),
    });
  }

  const m1 = await upsertMember({
    firstName: 'Luis',
    firstNameKatakana: 'ルイス',
    lastName: 'Hernández',
    code: 'CTR-001',
    rankLevel: 4,
    dateOfBirth: '2014-03-12',
  });
  queueClassAssignment(m1.id, '2014-03-12');
  const m2 = await upsertMember({
    firstName: 'María',
    firstNameKatakana: 'マリア',
    lastName: 'Pérez',
    code: 'CTR-002',
    rankLevel: 2,
    dateOfBirth: '2016-08-24',
  });
  queueClassAssignment(m2.id, '2016-08-24');

  const demoRankMembers = [
    {
      firstName: 'Valeria',
      firstNameKatakana: 'バレリア',
      lastName: 'Vega Martínez',
      code: 'CTR-R01',
      rankLevel: 1,
      avatarFileKey: '/demo/alumnos/ctr-r01.svg',
      dateOfBirth: '2017-02-04',
      curp: 'VEGA170204MJCRML01',
      bloodType: 'O+',
      specialCareNotes: 'Usa lentes durante actividades de lectura; sin restricciones físicas.',
      emergencyPhone: '5550201001',
      phone: '5550101001',
      email: 'demo.rango01@sensei.local',
      notes: 'Alumno demo para Color blanco, 10° Kyu.',
    },
    {
      firstName: 'Rodrigo',
      firstNameKatakana: 'ロドリゴ',
      lastName: 'Ruiz Castillo',
      code: 'CTR-R02',
      rankLevel: 2,
      avatarFileKey: '/demo/alumnos/ctr-r02.svg',
      dateOfBirth: '2016-07-19',
      curp: 'RUCA160719HJCMRS02',
      bloodType: 'A+',
      specialCareNotes: 'Avisar a tutor si presenta dolor de rodilla después de saltos repetidos.',
      emergencyPhone: '5550201002',
      phone: '5550101002',
      email: 'demo.rango02@sensei.local',
      notes: 'Alumno demo para Color blanco + amarillo, 10° Kyu.',
    },
    {
      firstName: 'Daniela',
      firstNameKatakana: 'ダニエラ',
      lastName: 'López Prado',
      code: 'CTR-R03',
      rankLevel: 3,
      avatarFileKey: '/demo/alumnos/ctr-r03.svg',
      dateOfBirth: '2015-08-11',
      curp: 'LOPD150811MJCPZN03',
      bloodType: 'B+',
      specialCareNotes:
        'Alergia leve al polvo; mantener inhalador disponible si el tutor lo entrega.',
      emergencyPhone: '5550201003',
      phone: '5550101003',
      email: 'demo.rango03@sensei.local',
      notes: 'Alumno demo para Color amarillo, 9° Kyu.',
    },
    {
      firstName: 'Héctor',
      firstNameKatakana: 'エクトル',
      lastName: 'Hernández León',
      code: 'CTR-R04',
      rankLevel: 4,
      avatarFileKey: '/demo/alumnos/ctr-r04.svg',
      dateOfBirth: '2014-03-12',
      curp: 'HEHL140312HJCRRS04',
      bloodType: 'AB+',
      specialCareNotes: 'Requiere calentamiento extra en tobillos antes de kumite.',
      emergencyPhone: '5550201004',
      phone: '5550101004',
      email: 'demo.rango04@sensei.local',
      notes: 'Alumno demo para Color naranja, 8°/7° Kyu.',
    },
    {
      firstName: 'Sofía',
      firstNameKatakana: 'ソフィア',
      lastName: 'Gómez Salas',
      code: 'CTR-R05',
      rankLevel: 5,
      avatarFileKey: '/demo/alumnos/ctr-r05.svg',
      dateOfBirth: '2013-05-26',
      curp: 'GOSA130526MJCNLD05',
      bloodType: 'O-',
      specialCareNotes: 'Evitar entrenar si reporta migraña; avisar a recepción.',
      emergencyPhone: '5550201005',
      phone: '5550101005',
      email: 'demo.rango05@sensei.local',
      notes: 'Alumno demo para Color azul, 6°/5° Kyu.',
    },
    {
      firstName: 'Mateo',
      firstNameKatakana: 'マテオ',
      lastName: 'Pérez Maldonado',
      code: 'CTR-R06',
      rankLevel: 6,
      avatarFileKey: '/demo/alumnos/ctr-r06.svg',
      dateOfBirth: '2012-09-18',
      curp: 'PEMA120918HJCRDN06',
      bloodType: 'A-',
      specialCareNotes: 'Hidratación frecuente en sesiones largas.',
      emergencyPhone: '5550201006',
      phone: '5550101006',
      email: 'demo.rango06@sensei.local',
      notes: 'Alumno demo para Color verde, 4° Kyu.',
    },
    {
      firstName: 'Victoria',
      firstNameKatakana: 'ビクトリア',
      lastName: 'Navarro Vargas',
      code: 'CTR-R07',
      rankLevel: 7,
      avatarFileKey: '/demo/alumnos/ctr-r07.svg',
      dateOfBirth: '2011-11-04',
      curp: 'NAVV111104MJCVLG07',
      bloodType: 'B-',
      specialCareNotes: 'Puede apoyar como alumna guía; monitorear carga de entrenamiento.',
      emergencyPhone: '5550201007',
      phone: '5550101007',
      email: 'demo.rango07@sensei.local',
      notes: 'Alumno demo para Color café, 3° Kyu.',
    },
    {
      firstName: 'Diego',
      firstNameKatakana: 'ディエゴ',
      lastName: 'Rojas Rivera',
      code: 'CTR-R08',
      rankLevel: 8,
      avatarFileKey: '/demo/alumnos/ctr-r08.svg',
      dateOfBirth: '2010-06-30',
      curp: 'RORD100630HJCSLL08',
      bloodType: 'AB-',
      specialCareNotes: 'Revisar vendaje de muñeca antes de trabajo con manoplas.',
      emergencyPhone: '5550201008',
      phone: '5550101008',
      email: 'demo.rango08@sensei.local',
      notes: 'Alumno demo para Color marrón, 2°/1° Kyu.',
    },
    {
      firstName: 'Fernanda',
      firstNameKatakana: 'フェルナンダ',
      lastName: 'Castillo Flores',
      code: 'CTR-R09',
      rankLevel: 9,
      avatarFileKey: '/demo/alumnos/ctr-r09.svg',
      dateOfBirth: '2009-02-15',
      curp: 'CASF090215MJCMRR09',
      bloodType: 'O+',
      specialCareNotes: 'Candidata a apoyo de clase infantil; cuidar descansos entre bloques.',
      emergencyPhone: '5550201009',
      phone: '5550101009',
      email: 'demo.rango09@sensei.local',
      notes: 'Alumno demo para Shodan-Ho.',
    },
    {
      firstName: 'Santiago',
      firstNameKatakana: 'サンティアゴ',
      lastName: 'Torres Montes',
      code: 'CTR-R10',
      rankLevel: 10,
      avatarFileKey: '/demo/alumnos/ctr-r10.svg',
      dateOfBirth: '2008-09-03',
      curp: 'TOMS080903HJCRND10',
      bloodType: 'A+',
      specialCareNotes:
        'Entrenamiento avanzado; registrar observaciones técnicas después de ligas.',
      emergencyPhone: '5550201010',
      phone: '5550101010',
      email: 'demo.rango10@sensei.local',
      notes: 'Alumno demo para Nidan-Ho.',
    },
    {
      firstName: 'Ana',
      firstNameKatakana: 'アナ',
      lastName: 'Vargas Salcedo',
      code: 'CTR-R11',
      rankLevel: 11,
      avatarFileKey: '/demo/alumnos/ctr-r11.svg',
      dateOfBirth: '2007-04-27',
      curp: 'VASA070427MJCLNN11',
      bloodType: 'B+',
      specialCareNotes:
        'Puede asistir a sensei en clase de principiantes; confirmar disponibilidad.',
      emergencyPhone: '5550201011',
      phone: '5550101011',
      email: 'demo.rango11@sensei.local',
      notes: 'Alumno demo para Sandan-Ho.',
    },
    {
      firstName: 'Emiliano',
      firstNameKatakana: 'エミリアノ',
      lastName: 'Quezada Díaz',
      code: 'CTR-R12',
      rankLevel: 12,
      avatarFileKey: '/demo/alumnos/ctr-r12.svg',
      dateOfBirth: '2006-01-21',
      curp: 'QUED060121HJCVDR12',
      bloodType: 'O-',
      specialCareNotes: 'Perfil avanzado; registrar plan técnico individual y resultados de liga.',
      emergencyPhone: '5550201012',
      phone: '5550101012',
      email: 'demo.rango12@sensei.local',
      notes: 'Alumno demo para Yondan-Ho.',
    },
  ];

  for (const demoMember of demoRankMembers) {
    const row = await upsertMember(demoMember);
    queueClassAssignment(row.id, demoMember.dateOfBirth);
  }

  const additionalDemoMembers = [
    {
      firstName: 'Camila',
      firstNameKatakana: 'カミラ',
      lastName: 'Santos Mora',
      code: 'CTR-C01',
      rankLevel: 1,
      dateOfBirth: '2019-04-10',
    },
    {
      firstName: 'Renata',
      firstNameKatakana: 'レナタ',
      lastName: 'Luna Mercado',
      code: 'CTR-C02',
      rankLevel: 1,
      dateOfBirth: '2019-12-02',
    },
    {
      firstName: 'Gael',
      firstNameKatakana: 'ガエル',
      lastName: 'Mendoza Cruz',
      code: 'CTR-C03',
      rankLevel: 1,
      dateOfBirth: '2018-06-17',
    },
    {
      firstName: 'Regina',
      firstNameKatakana: 'レヒナ',
      lastName: 'Ortega Ríos',
      code: 'CTR-C04',
      rankLevel: 2,
      dateOfBirth: '2018-10-08',
    },
    {
      firstName: 'Sebastián',
      firstNameKatakana: 'セバスティアン',
      lastName: 'Aguilar Peña',
      code: 'CTR-C05',
      rankLevel: 2,
      dateOfBirth: '2019-01-23',
    },
    {
      firstName: 'Lucía',
      firstNameKatakana: 'ルシア',
      lastName: 'Campos Vidal',
      code: 'CTR-C06',
      rankLevel: 1,
      dateOfBirth: '2020-02-14',
    },
    {
      firstName: 'Emilia',
      firstNameKatakana: 'エミリア',
      lastName: 'Fuentes Solís',
      code: 'CTR-C07',
      rankLevel: 2,
      dateOfBirth: '2018-03-29',
    },
    {
      firstName: 'Bruno',
      firstNameKatakana: 'ブルノ',
      lastName: 'Núñez Paredes',
      code: 'CTR-C08',
      rankLevel: 1,
      dateOfBirth: '2019-07-06',
    },
    {
      firstName: 'Paula',
      firstNameKatakana: 'パウラ',
      lastName: 'Ibarra León',
      code: 'CTR-C09',
      rankLevel: 2,
      dateOfBirth: '2018-11-19',
    },
    {
      firstName: 'Leonardo',
      firstNameKatakana: 'レオナルド',
      lastName: 'Cortés Mena',
      code: 'CTR-C10',
      rankLevel: 1,
      dateOfBirth: '2020-05-04',
    },
    {
      firstName: 'Ximena',
      firstNameKatakana: 'ヒメナ',
      lastName: 'Pineda Soto',
      code: 'CTR-C11',
      rankLevel: 2,
      dateOfBirth: '2019-09-25',
    },
    {
      firstName: 'Andrés',
      firstNameKatakana: 'アンドレス',
      lastName: 'Mejía Robles',
      code: 'CTR-C12',
      rankLevel: 1,
      dateOfBirth: '2018-01-12',
    },
    {
      firstName: 'Isabella',
      firstNameKatakana: 'イサベラ',
      lastName: 'Márquez Nava',
      code: 'CTR-C13',
      rankLevel: 3,
      dateOfBirth: '2017-08-03',
    },
    {
      firstName: 'Emiliano',
      firstNameKatakana: 'エミリアノ',
      lastName: 'Ferrer Lozano',
      code: 'CTR-C14',
      rankLevel: 3,
      dateOfBirth: '2016-12-09',
    },
    {
      firstName: 'Natalia',
      firstNameKatakana: 'ナタリア',
      lastName: 'Reyes Alcántara',
      code: 'CTR-C15',
      rankLevel: 4,
      dateOfBirth: '2015-05-16',
    },
    {
      firstName: 'Julián',
      firstNameKatakana: 'フリアン',
      lastName: 'Serrano Gil',
      code: 'CTR-C16',
      rankLevel: 4,
      dateOfBirth: '2014-11-28',
    },
    {
      firstName: 'Abril',
      firstNameKatakana: 'アブリル',
      lastName: 'Carrillo Díaz',
      code: 'CTR-C17',
      rankLevel: 5,
      dateOfBirth: '2013-10-07',
    },
    {
      firstName: 'Mauricio',
      firstNameKatakana: 'マウリシオ',
      lastName: 'Escobar Franco',
      code: 'CTR-C18',
      rankLevel: 5,
      dateOfBirth: '2014-02-20',
    },
    {
      firstName: 'Carolina',
      firstNameKatakana: 'カロリナ',
      lastName: 'Delgado Ruiz',
      code: 'CTR-C19',
      rankLevel: 6,
      dateOfBirth: '2015-09-11',
    },
    {
      firstName: 'Iván',
      firstNameKatakana: 'イバン',
      lastName: 'Salazar Trejo',
      code: 'CTR-C20',
      rankLevel: 6,
      dateOfBirth: '2013-01-30',
    },
    {
      firstName: 'Mariana',
      firstNameKatakana: 'マリアナ',
      lastName: 'Arias Beltrán',
      code: 'CTR-C21',
      rankLevel: 5,
      dateOfBirth: '2012-07-18',
    },
    {
      firstName: 'Patricio',
      firstNameKatakana: 'パトリシオ',
      lastName: 'Rangel Tapia',
      code: 'CTR-C22',
      rankLevel: 6,
      dateOfBirth: '2011-02-09',
    },
    {
      firstName: 'Alexa',
      firstNameKatakana: 'アレクサ',
      lastName: 'Morales Castañeda',
      code: 'CTR-C23',
      rankLevel: 7,
      dateOfBirth: '2010-12-22',
    },
    {
      firstName: 'Omar',
      firstNameKatakana: 'オマル',
      lastName: 'Zamora Brito',
      code: 'CTR-C24',
      rankLevel: 7,
      dateOfBirth: '2009-08-13',
    },
    {
      firstName: 'Claudia',
      firstNameKatakana: 'クラウディア',
      lastName: 'Benítez Lara',
      code: 'CTR-C25',
      rankLevel: 8,
      dateOfBirth: '2008-11-05',
    },
    {
      firstName: 'Nicolás',
      firstNameKatakana: 'ニコラス',
      lastName: 'García Ponce',
      code: 'CTR-C26',
      rankLevel: 8,
      dateOfBirth: '2012-03-26',
    },
    {
      firstName: 'Elena',
      firstNameKatakana: 'エレナ',
      lastName: 'Palacios Rivas',
      code: 'CTR-C27',
      rankLevel: 6,
      dateOfBirth: '2011-06-02',
    },
    {
      firstName: 'Tomás',
      firstNameKatakana: 'トマス',
      lastName: 'Ochoa Quiroz',
      code: 'CTR-C28',
      rankLevel: 7,
      dateOfBirth: '2010-04-15',
    },
    {
      firstName: 'Andrea',
      firstNameKatakana: 'アンドレア',
      lastName: 'Espinosa Valle',
      code: 'CTR-C29',
      rankLevel: 8,
      dateOfBirth: '2009-10-31',
    },
    {
      firstName: 'Jorge',
      firstNameKatakana: 'ホルヘ',
      lastName: 'Montiel Cárdenas',
      code: 'CTR-C30',
      rankLevel: 9,
      dateOfBirth: '2007-12-01',
    },
    {
      firstName: 'Gabriela',
      firstNameKatakana: 'ガブリエラ',
      lastName: 'Lara Méndez',
      code: 'CTR-C31',
      rankLevel: 9,
      dateOfBirth: '2005-05-24',
    },
    {
      firstName: 'Ricardo',
      firstNameKatakana: 'リカルド',
      lastName: 'Bautista Ramos',
      code: 'CTR-C32',
      rankLevel: 10,
      dateOfBirth: '1998-03-14',
    },
    {
      firstName: 'Alejandra',
      firstNameKatakana: 'アレハンドラ',
      lastName: 'Treviño Cruz',
      code: 'CTR-C33',
      rankLevel: 10,
      dateOfBirth: '1993-09-27',
    },
    {
      firstName: 'Manuel',
      firstNameKatakana: 'マヌエル',
      lastName: 'Ceballos Vera',
      code: 'CTR-C34',
      rankLevel: 11,
      dateOfBirth: '1988-07-08',
    },
    {
      firstName: 'Mónica',
      firstNameKatakana: 'モニカ',
      lastName: 'Esquivel Rosas',
      code: 'CTR-C35',
      rankLevel: 12,
      dateOfBirth: '1985-01-17',
    },
    {
      firstName: 'Fernando',
      firstNameKatakana: 'フェルナンド',
      lastName: 'Valdés Herrera',
      code: 'CTR-C36',
      rankLevel: 11,
      dateOfBirth: '1979-06-12',
    },
  ];

  for (const demoMember of additionalDemoMembers) {
    const row = await upsertMember({
      ...demoMember,
      email: `demo.clase${demoMember.code.slice(-2)}@sensei.local`,
      phone: `55503010${demoMember.code.slice(-2)}`,
      emergencyPhone: `55504010${demoMember.code.slice(-2)}`,
      notes: 'Alumno demo generado para poblar clases por edad.',
    });
    queueClassAssignment(row.id, demoMember.dateOfBirth);
  }

  const academyDemoMemberGroups: Array<{
    academyKey: Exclude<SeedAcademyKey, typeof BOSQUES_KEY>;
    members: MemberSeedInput[];
  }> = [
    {
      academyKey: 'bugambilias',
      members: [
        {
          firstName: 'Aitana',
          firstNameKatakana: 'アイタナ',
          lastName: 'Bravo Medina',
          code: 'BUG-001',
          rankLevel: 1,
          dateOfBirth: '2018-05-15',
          phone: '3330778001',
          emergencyPhone: '3330778101',
          email: 'demo.bug001@sensei.local',
          notes: 'Alumno demo de la academia Bugambilias.',
        },
        {
          firstName: 'Iker',
          firstNameKatakana: 'イケル',
          lastName: 'Salcedo Rivas',
          code: 'BUG-002',
          rankLevel: 3,
          dateOfBirth: '2015-10-22',
          phone: '3330778002',
          emergencyPhone: '3330778102',
          email: 'demo.bug002@sensei.local',
          notes: 'Alumno demo de la academia Bugambilias.',
        },
        {
          firstName: 'Regina',
          firstNameKatakana: 'レヒナ',
          lastName: 'Lozano Ávila',
          code: 'BUG-003',
          rankLevel: 5,
          dateOfBirth: '2012-01-18',
          phone: '3330778003',
          emergencyPhone: '3330778103',
          email: 'demo.bug003@sensei.local',
          notes: 'Alumno demo de la academia Bugambilias.',
        },
        {
          firstName: 'Hugo',
          firstNameKatakana: 'ウゴ',
          lastName: 'Moreno Casas',
          code: 'BUG-004',
          rankLevel: 8,
          dateOfBirth: '2009-09-09',
          phone: '3330778004',
          emergencyPhone: '3330778104',
          email: 'demo.bug004@sensei.local',
          notes: 'Alumno demo de la academia Bugambilias.',
        },
      ],
    },
    {
      academyKey: 'lasAguilas',
      members: [
        {
          firstName: 'Julieta',
          firstNameKatakana: 'フリエタ',
          lastName: 'Aguirre Santos',
          code: 'AGU-001',
          rankLevel: 2,
          dateOfBirth: '2017-06-28',
          phone: '3336347001',
          emergencyPhone: '3336347101',
          email: 'demo.agu001@sensei.local',
          notes: 'Alumno demo de la academia Las Águilas.',
        },
        {
          firstName: 'Damián',
          firstNameKatakana: 'ダミアン',
          lastName: 'Paredes Cano',
          code: 'AGU-002',
          rankLevel: 4,
          dateOfBirth: '2014-12-03',
          phone: '3336347002',
          emergencyPhone: '3336347102',
          email: 'demo.agu002@sensei.local',
          notes: 'Alumno demo de la academia Las Águilas.',
        },
        {
          firstName: 'Montserrat',
          firstNameKatakana: 'モンセラット',
          lastName: 'Silva Ponce',
          code: 'AGU-003',
          rankLevel: 6,
          dateOfBirth: '2011-07-21',
          phone: '3336347003',
          emergencyPhone: '3336347103',
          email: 'demo.agu003@sensei.local',
          notes: 'Alumno demo de la academia Las Águilas.',
        },
        {
          firstName: 'Erick',
          firstNameKatakana: 'エリック',
          lastName: 'Cárdenas Soto',
          code: 'AGU-004',
          rankLevel: 9,
          dateOfBirth: '2006-11-11',
          phone: '3336347004',
          emergencyPhone: '3336347104',
          email: 'demo.agu004@sensei.local',
          notes: 'Alumno demo de la academia Las Águilas.',
        },
      ],
    },
    {
      academyKey: 'sanAgustin',
      members: [
        {
          firstName: 'Romina',
          firstNameKatakana: 'ロミナ',
          lastName: 'Nava Castillo',
          code: 'SAG-001',
          rankLevel: 1,
          dateOfBirth: '2019-03-19',
          phone: '3332716001',
          emergencyPhone: '3332716101',
          email: 'demo.sag001@sensei.local',
          notes: 'Alumno demo de la academia San Agustín.',
        },
        {
          firstName: 'Alan',
          firstNameKatakana: 'アラン',
          lastName: 'Tovar Robles',
          code: 'SAG-002',
          rankLevel: 3,
          dateOfBirth: '2016-02-07',
          phone: '3332716002',
          emergencyPhone: '3332716102',
          email: 'demo.sag002@sensei.local',
          notes: 'Alumno demo de la academia San Agustín.',
        },
        {
          firstName: 'Paola',
          firstNameKatakana: 'パオラ',
          lastName: 'Mendoza Gálvez',
          code: 'SAG-003',
          rankLevel: 6,
          dateOfBirth: '2011-08-29',
          phone: '3332716003',
          emergencyPhone: '3332716103',
          email: 'demo.sag003@sensei.local',
          notes: 'Alumno demo de la academia San Agustín.',
        },
        {
          firstName: 'Leonel',
          firstNameKatakana: 'レオネル',
          lastName: 'Figueroa Reyes',
          code: 'SAG-004',
          rankLevel: 10,
          dateOfBirth: '1999-04-04',
          phone: '3332716004',
          emergencyPhone: '3332716104',
          email: 'demo.sag004@sensei.local',
          notes: 'Alumno demo de la academia San Agustín.',
        },
      ],
    },
  ];

  for (const group of academyDemoMemberGroups) {
    for (const demoMember of group.members) {
      const row = await upsertMember({ ...demoMember, academyKey: group.academyKey });
      queueClassAssignment(row.id, demoMember.dateOfBirth, group.academyKey);
    }
  }

  async function ensureGeneratedAcademyMembers(academy: SeedAcademy) {
    const staticCount = seededMembersByAcademy[academy.key].length;
    const generatedCount = Math.max(0, STUDENTS_PER_ACADEMY - staticCount);

    for (let sequence = 1; sequence <= generatedCount; sequence += 1) {
      const demoMember = generatedMemberInput(academy, sequence);
      const row = await upsertMember({ ...demoMember, academyKey: academy.key });
      queueClassAssignment(row.id, demoMember.dateOfBirth, academy.key);
    }
  }

  for (const academy of SEEDED_ACADEMIES) {
    await ensureGeneratedAcademyMembers(academy);
  }

  function dateWithTime(time: string) {
    const [hours = '0', minutes = '0'] = time.split(':');
    const date = new Date('2026-01-05T00:00:00');
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date;
  }

  async function ensureClass(input: {
    academyKey: SeedAcademyKey;
    roomKey: SeedRoomKey;
    name: string;
    startTime: string;
    endTime: string;
    recurrenceRule: string;
    capacity: number;
    notes: string;
  }) {
    const dojo = academyDojosByKey[input.academyKey];
    const room = academyRoomsByKey[input.academyKey][input.roomKey];
    const instructor = academyUsersByKey[input.academyKey].instructor;
    const existingClass = await db
      .select()
      .from(classes)
      .where(sql`${classes.dojoId} = ${dojo!.id} AND ${classes.name} = ${input.name}`);
    let row = existingClass[0];
    const classValues = {
      organizationId: org!.id,
      dojoId: dojo!.id,
      roomId: room.id,
      name: input.name,
      startsAt: dateWithTime(input.startTime),
      endsAt: dateWithTime(input.endTime),
      recurrenceRule: input.recurrenceRule,
      capacity: input.capacity,
      notes: input.notes,
      status: 'scheduled' as const,
      updatedAt: new Date(),
    };

    if (!row) {
      [row] = await db.insert(classes).values(classValues).returning();
      stats.classesCreated += 1;
    } else {
      const [updated] = await db
        .update(classes)
        .set(classValues)
        .where(eq(classes.id, row.id))
        .returning();
      row = updated ?? row;
      stats.classesUpdated += 1;
    }

    const instructorRows = await db
      .select()
      .from(classInstructors)
      .where(
        sql`${classInstructors.classId} = ${row!.id} AND ${classInstructors.userId} = ${instructor.id}`,
      );
    if (instructorRows.length === 0) {
      await db.insert(classInstructors).values({
        classId: row!.id,
        userId: instructor.id,
        role: 'instructor',
      });
    }

    return row!;
  }

  type DemoClassMap = Record<DemoClassKey, Awaited<ReturnType<typeof ensureClass>>>;
  const demoClassesByAcademy = {} as Record<SeedAcademyKey, DemoClassMap>;
  for (const academy of SEEDED_ACADEMIES) {
    demoClassesByAcademy[academy.key] = {
      smallKids: await ensureClass({
        academyKey: academy.key,
        roomKey: 'principal',
        name: 'Niños pequeños',
        startTime: '16:00',
        endTime: '17:00',
        recurrenceRule: 'L,M,Mi,J,V',
        capacity: 18,
        notes: `LMMiJV 4 - 5 pm. Grupo demo para niños pequeños en ${academy.name}.`,
      }),
      bigKids: await ensureClass({
        academyKey: academy.key,
        roomKey: 'principal',
        name: 'Niños grandes',
        startTime: '17:00',
        endTime: '18:00',
        recurrenceRule: 'L,M,Mi,J,V',
        capacity: 22,
        notes: `LMMiJV 5 - 6 pm. Grupo demo para niños grandes en ${academy.name}.`,
      }),
      teens: await ensureClass({
        academyKey: academy.key,
        roomKey: academy.key === BOSQUES_KEY ? 'auxiliar' : 'principal',
        name: 'Adolescentes',
        startTime: '18:00',
        endTime: '19:00',
        recurrenceRule: 'L,M,Mi,J,V',
        capacity: 24,
        notes: `LMMiJV 6 - 7 pm. Grupo demo para adolescentes en ${academy.name}.`,
      }),
      adults: await ensureClass({
        academyKey: academy.key,
        roomKey: academy.key === BOSQUES_KEY ? 'auxiliar' : 'principal',
        name: 'Adultos',
        startTime: '19:00',
        endTime: '20:00',
        recurrenceRule: 'L,Mi,V',
        capacity: 24,
        notes: `LMiV 7 - 8 pm. Grupo demo para adultos en ${academy.name}.`,
      }),
    };
  }

  async function ensureClassAssignment(memberId: string, classId: string) {
    const existing = await db
      .select()
      .from(memberClassAssignments)
      .where(
        sql`${memberClassAssignments.memberId} = ${memberId} AND ${memberClassAssignments.classId} = ${classId} AND ${memberClassAssignments.endedAt} IS NULL`,
      );
    if (existing.length === 0) {
      await db.insert(memberClassAssignments).values({
        memberId,
        classId,
      });
    }
  }

  for (const assignment of demoClassAssignments) {
    await ensureClassAssignment(
      assignment.memberId,
      demoClassesByAcademy[assignment.academyKey][assignment.classKey].id,
    );
  }

  // Sample attendance + payment
  for (const academy of SEEDED_ACADEMIES) {
    const academyMembers = seededMembersByAcademy[academy.key];
    const attendanceClass = demoClassesByAcademy[academy.key].bigKids;
    const instructor = academyUsersByKey[academy.key].instructor;
    const academyAdmin = academyUsersByKey[academy.key].admin;
    const [firstMember, secondMember = firstMember] = academyMembers;

    if (firstMember) {
      const existingAttendance = await db
        .select()
        .from(attendance)
        .where(
          sql`${attendance.classId} = ${attendanceClass.id} AND ${attendance.memberId} = ${firstMember.id}`,
        );
      if (existingAttendance.length === 0) {
        await db.insert(attendance).values({
          classId: attendanceClass.id,
          memberId: firstMember.id,
          status: 'present',
          markedBy: instructor.id,
        });
        stats.attendanceCreated += 1;
      }
    }

    if (secondMember) {
      const existingAttendance = await db
        .select()
        .from(attendance)
        .where(
          sql`${attendance.classId} = ${attendanceClass.id} AND ${attendance.memberId} = ${secondMember.id}`,
        );
      if (existingAttendance.length === 0) {
        await db.insert(attendance).values({
          classId: attendanceClass.id,
          memberId: secondMember.id,
          status: academy.key === BOSQUES_KEY ? 'absent' : 'late',
          markedBy: instructor.id,
        });
        stats.attendanceCreated += 1;
      }
    }

    const paymentMember = secondMember ?? firstMember;
    if (paymentMember) {
      const existingPayments = await db
        .select()
        .from(payments)
        .where(sql`${payments.memberId} = ${paymentMember.id}`);
      if (existingPayments.length === 0) {
        await db.insert(payments).values({
          organizationId: org!.id,
          dojoId: academyDojosByKey[academy.key].id,
          memberId: paymentMember.id,
          amount: '600.00',
          method: 'cash',
          reference: 'Mensualidad demo',
          createdBy: academyAdmin.id,
        });
        stats.paymentsCreated += 1;
      }
    }
  }

  console.log(
    `Seed complete: ${SEEDED_ACADEMIES.length} academies, ${STUDENTS_PER_ACADEMY} students per academy, ${stats.usersCreated + stats.usersUpdated} users, ${stats.membersCreated + stats.membersUpdated} students.`,
  );
  console.log('Super admin: superadmin@sensei.local / superadmin1234');
  console.log('Academy users: admin.<academy>@sensei.local and sensei.<academy>@sensei.local');
}

main()
  .then(() => client.end())
  .catch(async (err) => {
    console.error(`Seed failed: ${err instanceof Error ? err.message : String(err)}`);
    await client.end();
    process.exit(1);
  });
