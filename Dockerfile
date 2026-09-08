# ── Stage 1: Build frontend ────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY client/ ./client/
COPY vite.config.js ./
RUN node -e "\
  const {build} = require('vite');\
  build({root:'client',build:{outDir:'../public',emptyOutDir:true}})\
    .then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)})"

# ── Stage 2: Imagen final con Node + PostgreSQL ────────────────
FROM debian:bookworm-slim

# Instalar Node 20, PostgreSQL 16 y supervisord
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg ca-certificates supervisor \
    postgresql postgresql-client \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── App ────────────────────────────────────────────────────────
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY schema.sql ./schema.sql
COPY --from=builder /app/public ./public

# ── Configuración de PostgreSQL ────────────────────────────────
ENV PGDATA=/var/lib/postgresql/data
ENV PGUSER=comerciantes
ENV PGPASSWORD=comerciantes
ENV PGDATABASE=comerciantes

# DATABASE_URL que usa la app Node (apunta al postgres local)
ENV DATABASE_URL=postgresql://comerciantes:comerciantes@localhost:5432/comerciantes
ENV NODE_ENV=production
ENV PORT=3000

# ── Supervisord: gestiona Postgres + Node juntos ───────────────
COPY supervisord.conf /etc/supervisor/conf.d/app.conf

# ── Entrypoint: inicia DB si es la primera vez ─────────────────
COPY docker-init.sh /docker-init.sh
RUN chmod +x /docker-init.sh

EXPOSE 3000

ENTRYPOINT ["/docker-init.sh"]
