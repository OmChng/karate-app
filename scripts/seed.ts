/**
 * Seeds the database with a small demo org for local development.
 *
 * Idempotent: re-running won't duplicate rows.
 * Refuses to run in production.
 *
 * Usage: pnpm db:seed
 */
import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: '.env.local' });
loadDotenv();
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
  attendance,
  payments,
  files,
} from '../src/db/schema';
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

async function main() {
  console.log('Seeding demo data...');

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
    console.log(`  + organization ${org!.slug}`);
  } else {
    console.log(`  = organization ${org.slug}`);
  }

  // Dojo
  let [dojo] = await db
    .select()
    .from(dojos)
    .where(sql`${dojos.organizationId} = ${org!.id} AND ${dojos.name} = 'Dojo Central'`);
  if (!dojo) {
    [dojo] = await db
      .insert(dojos)
      .values({ organizationId: org!.id, name: 'Dojo Central', code: 'CTR' })
      .returning();
    console.log(`  + dojo ${dojo!.name}`);
  } else {
    console.log(`  = dojo ${dojo.name}`);
  }

  // Users
  async function upsertUser(input: {
    email: string;
    name: string;
    password: string;
    role: 'organization_admin' | 'instructor' | 'member';
  }) {
    let [user] = await db.select().from(users).where(eq(users.email, input.email));
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
          passwordHash: await hash(input.password),
          emailVerifiedAt: new Date(),
        })
        .returning();
      console.log(`  + user ${user!.email}`);
    } else {
      console.log(`  = user ${user.email}`);
    }
    const existing = await db
      .select()
      .from(userRoles)
      .where(
        sql`${userRoles.userId} = ${user!.id} AND ${userRoles.organizationId} = ${org!.id} AND ${userRoles.role} = ${input.role}`,
      );
    if (existing.length === 0) {
      await db.insert(userRoles).values({
        userId: user!.id,
        organizationId: org!.id,
        dojoId: input.role === 'organization_admin' ? null : dojo!.id,
        role: input.role,
      });
      console.log(`    grant ${input.role}`);
    }
    return user!;
  }

  const admin = await upsertUser({
    email: 'admin@sensei.local',
    name: 'Admin Demo',
    password: 'admin1234',
    role: 'organization_admin',
  });
  const instructor = await upsertUser({
    email: 'sensei@sensei.local',
    name: 'Sensei Demo',
    password: 'sensei1234',
    role: 'instructor',
  });

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
  console.log(`  = rank definitions: ${allRanks.length}`);

  // Members
  async function upsertMember(input: {
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
  }) {
    const existing = await db
      .select()
      .from(members)
      .where(sql`${members.organizationId} = ${org!.id} AND ${members.code} = ${input.code}`);
    let row = existing[0];
    const avatarFileId = input.avatarFileKey
      ? (await ensureAvatarFile(input.avatarFileKey, `${input.code}.svg`)).id
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
      updatedBy: admin.id,
      updatedAt: new Date(),
    };

    if (!row) {
      [row] = await db
        .insert(members)
        .values({
          organizationId: org!.id,
          ...memberValues,
          createdBy: admin.id,
        })
        .returning();
      console.log(`  + member ${row!.firstName} ${row!.lastName}`);
    } else {
      const [updated] = await db
        .update(members)
        .set(memberValues)
        .where(eq(members.id, row.id))
        .returning();
      row = updated ?? row;
      console.log(`  = member ${row.firstName} ${row.lastName}`);
    }
    await ensureCurrentRank(row!.id, input.rankLevel);
    return row!;
  }

  async function ensureAvatarFile(key: string, originalName: string) {
    const [existing] = await db
      .select()
      .from(files)
      .where(sql`${files.organizationId} = ${org!.id} AND ${files.key} = ${key}`);
    if (existing) return existing;

    const [file] = await db
      .insert(files)
      .values({
        organizationId: org!.id,
        uploadedBy: admin.id,
        key,
        contentType: 'image/svg+xml',
        originalName,
      })
      .returning();
    return file!;
  }

  async function ensureCurrentRank(memberId: string, rankLevel: number) {
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
      awardedBy: admin.id,
      isCurrent: true,
      notes: 'Rango demo asignado por seed.',
    });
  }

  type DemoClassKey = 'smallKids' | 'bigKids' | 'teens' | 'adults';
  const demoClassAssignments: Array<{ memberId: string; classKey: DemoClassKey }> = [];

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

  function queueClassAssignment(memberId: string, dateOfBirth?: string) {
    demoClassAssignments.push({ memberId, classKey: classKeyForDateOfBirth(dateOfBirth) });
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

  function dateWithTime(time: string) {
    const [hours = '0', minutes = '0'] = time.split(':');
    const date = new Date('2026-01-05T00:00:00');
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date;
  }

  async function ensureClass(input: {
    name: string;
    startTime: string;
    endTime: string;
    recurrenceRule: string;
    capacity: number;
    notes: string;
  }) {
    const existingClass = await db
      .select()
      .from(classes)
      .where(sql`${classes.dojoId} = ${dojo!.id} AND ${classes.name} = ${input.name}`);
    let row = existingClass[0];
    const classValues = {
      organizationId: org!.id,
      dojoId: dojo!.id,
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
      console.log(`  + class ${row!.name}`);
    } else {
      const [updated] = await db
        .update(classes)
        .set(classValues)
        .where(eq(classes.id, row.id))
        .returning();
      row = updated ?? row;
      console.log(`  = class ${row.name}`);
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

  const demoClasses: Record<DemoClassKey, Awaited<ReturnType<typeof ensureClass>>> = {
    smallKids: await ensureClass({
      name: 'Niños pequeños',
      startTime: '16:00',
      endTime: '17:00',
      recurrenceRule: 'L,M,Mi,J,V',
      capacity: 18,
      notes: 'LMMiJV 4 - 5 pm. Grupo demo para niños pequeños.',
    }),
    bigKids: await ensureClass({
      name: 'Niños grandes',
      startTime: '17:00',
      endTime: '18:00',
      recurrenceRule: 'L,M,Mi,J,V',
      capacity: 22,
      notes: 'LMMiJV 5 - 6 pm. Grupo demo para niños grandes.',
    }),
    teens: await ensureClass({
      name: 'Adolescentes',
      startTime: '18:00',
      endTime: '19:00',
      recurrenceRule: 'L,M,Mi,J,V',
      capacity: 24,
      notes: 'LMMiJV 6 - 7 pm. Grupo demo para adolescentes.',
    }),
    adults: await ensureClass({
      name: 'Adultos',
      startTime: '19:00',
      endTime: '20:00',
      recurrenceRule: 'L,Mi,V',
      capacity: 24,
      notes: 'LMiV 7 - 8 pm. Grupo demo para adultos.',
    }),
  };

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
    await ensureClassAssignment(assignment.memberId, demoClasses[assignment.classKey].id);
  }

  // Sample attendance + payment
  const attendanceClass = demoClasses.bigKids;
  const att1 = await db
    .select()
    .from(attendance)
    .where(sql`${attendance.classId} = ${attendanceClass.id} AND ${attendance.memberId} = ${m1.id}`);
  if (att1.length === 0) {
    await db.insert(attendance).values({
      classId: attendanceClass.id,
      memberId: m1.id,
      status: 'present',
      markedBy: instructor.id,
    });
  }
  const att2 = await db
    .select()
    .from(attendance)
    .where(sql`${attendance.classId} = ${attendanceClass.id} AND ${attendance.memberId} = ${m2.id}`);
  if (att2.length === 0) {
    await db.insert(attendance).values({
      classId: attendanceClass.id,
      memberId: m2.id,
      status: 'absent',
      markedBy: instructor.id,
    });
  }
  const pay1 = await db
    .select()
    .from(payments)
    .where(sql`${payments.memberId} = ${m2.id}`);
  if (pay1.length === 0) {
    await db.insert(payments).values({
      organizationId: org!.id,
      dojoId: dojo!.id,
      memberId: m2.id,
      amount: '600.00',
      method: 'cash',
      reference: 'Mensualidad demo',
      createdBy: admin.id,
    });
  }

  console.log('\nSeed complete.');
  console.log('Login: admin@sensei.local / admin1234');
  console.log('Login: sensei@sensei.local / sensei1234');
}

main()
  .then(() => client.end())
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await client.end();
    process.exit(1);
  });
