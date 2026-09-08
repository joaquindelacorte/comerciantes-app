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

# Instalar PostgreSQL y Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg ca-certificates postgresql \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Detectar version de postgres instalada y guardarla
RUN ls /usr/lib/postgresql > /PG_VERSION

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server/ ./server/
COPY schema.sql ./schema.sql
COPY --from=builder /app/public ./public
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

ENV PGDATA=/var/lib/postgresql/data
ENV PGUSER=comerciantes
ENV PGPASSWORD=comerciantes
ENV PGDATABASE=comerciantes
ENV DATABASE_URL=postgresql://comerciantes:comerciantes@127.0.0.1:5432/comerciantes
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["/app/start.sh"]
