import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import * as argon2 from 'argon2';
import { z } from 'zod';
import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { users, userRoles } from '@/db/schema';
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} from '@/lib/login-rate-limit';
import { isEmailLike, normalizeEmail, normalizePhone } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/db/schema/enums';

const credentialsSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(512),
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string | null;
      phone: string | null;
      name: string;
      image?: string | null;
      locale: string;
      roles: Array<{
        organizationId: string;
        dojoId: string | null;
        role: UserRole;
      }>;
    };
  }
}
// silence "DefaultSession unused" — keep the import for downstream type augmentation users.
type _KeepDefaultSession = DefaultSession;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/iniciar-sesion' },
  providers: [
    Credentials({
      name: 'Email o teléfono',
      credentials: {
        identifier: { label: 'Email o teléfono', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      authorize: async (raw, request) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;

        const isEmail = isEmailLike(identifier);
        const normalized = isEmail ? normalizeEmail(identifier) : normalizePhone(identifier);
        const rateLimit = await checkLoginRateLimit(normalized, request.headers);

        if (rateLimit.limited) {
          await recordLoginFailure(rateLimit.subject, 'rate_limited');
          logger.warn(
            {
              identifierFailures: rateLimit.identifierFailures,
              ipFailures: rateLimit.ipFailures,
              retryAfterSeconds: rateLimit.retryAfterSeconds,
            },
            'login: rate limited',
          );
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(isEmail ? eq(users.email, normalized) : eq(users.phone, normalized))
          .limit(1);
        if (!user || !user.passwordHash) {
          await recordLoginFailure(rateLimit.subject, 'invalid_credentials');
          return null;
        }

        const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
        if (!ok) {
          await recordLoginFailure(rateLimit.subject, 'invalid_credentials');
          logger.info({ userId: user.id }, 'login: bad password');
          return null;
        }

        await recordLoginSuccess(rateLimit.subject);
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
        logger.info({ userId: user.id }, 'login: success');

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'id' in user && typeof user.id === 'string') {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.sub) return session;
      const [u] = await db.select().from(users).where(eq(users.id, token.sub)).limit(1);
      if (!u) return session;

      const roles = await db
        .select({
          organizationId: userRoles.organizationId,
          dojoId: userRoles.dojoId,
          role: userRoles.role,
        })
        .from(userRoles)
        .where(eq(userRoles.userId, u.id));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user = {
        id: u.id,
        email: u.email,
        phone: u.phone,
        name: u.name,
        image: u.image,
        locale: u.locale,
        roles,
      };
      return session;
    },
  },
});

/**
 * Helper to find a user by either email or normalized phone.
 * Exported for tests.
 */
export async function findUserByIdentifier(identifier: string) {
  const isEmail = isEmailLike(identifier);
  const normalized = isEmail ? normalizeEmail(identifier) : normalizePhone(identifier);
  const [u] = await db
    .select()
    .from(users)
    .where(
      or(
        and(sql`${users.email} IS NOT NULL`, eq(users.email, normalized)),
        and(sql`${users.phone} IS NOT NULL`, eq(users.phone, normalized)),
      ),
    )
    .limit(1);
  return u ?? null;
}
