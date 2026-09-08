# ── Stage 1: Build del frontend ───────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY client/ ./client/
COPY vite.config.js ./
RUN node -e "\
  const {build} = require('vite');\
  build({root:'client',build:{outDir:'../public',emptyOutDir:true}})\
    .then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)})"

# ── Stage 2: Runtime ───────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# pg_isready no está disponible en alpine, usamos el cliente node directamente.
# Solo necesitamos las dependencias de producción.
COPY package*.json ./
RUN npm ci --omit=dev

# Código del servidor
COPY server/ ./server/

# Schema SQL (el entrypoint lo aplica al iniciar)
COPY schema.sql ./schema.sql

# Frontend buildeado
COPY --from=builder /app/public ./public

# Entrypoint: espera DB → aplica schema → arranca Express
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
