# ── Stage 1: Build del frontend con Vite ──────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY client/ ./client/
COPY vite.config.js ./
RUN node -e "const {build} = require('vite'); build({root:'client',build:{outDir:'../public',emptyOutDir:true}}).then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)})"

# ── Stage 2: Runtime Node + Express ───────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
