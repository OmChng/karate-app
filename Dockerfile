# syntax=docker/dockerfile:1.7
# Multi-stage build for the Next.js app. Works on macOS and Windows
# via Docker Desktop. Uses Node 20 LTS + a pinned pnpm install.

ARG NODE_VERSION=20.18.0
ARG PNPM_VERSION=9.15.0
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# -------- deps stage --------
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile || pnpm install

# -------- build stage --------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV APP_URL=http://localhost:3000
ENV APP_DEFAULT_LOCALE=es
ENV AUTH_SECRET=build-time-placeholder-not-for-runtime
ENV DATABASE_URL=postgresql://sensei:sensei@localhost:5432/sensei
RUN pnpm build

# -------- runner stage --------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
