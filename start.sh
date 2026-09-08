#!/bin/bash
set -e

PG_VERSION=$(cat /PG_VERSION)
PG_BIN="/usr/lib/postgresql/${PG_VERSION}/bin"
PGDATA=${PGDATA:-/var/lib/postgresql/data}

echo "==> PostgreSQL $PG_VERSION | PGDATA=$PGDATA"

# ── 1. Inicializar cluster si no existe ───────────────────────
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "==> Inicializando cluster PostgreSQL..."
  mkdir -p "$PGDATA"
  chown postgres:postgres "$PGDATA"
  su postgres -c "$PG_BIN/initdb -D $PGDATA --auth=trust -U postgres"
fi

# ── 2. Arrancar Postgres como daemon ──────────────────────────
echo "==> Arrancando PostgreSQL..."
su postgres -c "$PG_BIN/pg_ctl start -D $PGDATA -l /tmp/pg.log -w -t 30"

# ── 3. Crear user/DB y aplicar schema (idempotente) ──────────
echo "==> Configurando base de datos..."
su postgres -c "psql -U postgres -tc \
  \"SELECT 1 FROM pg_roles WHERE rolname='comerciantes'\" \
  | grep -q 1 || psql -U postgres -c \
  \"CREATE USER comerciantes WITH PASSWORD 'comerciantes';\""

su postgres -c "psql -U postgres -tc \
  \"SELECT 1 FROM pg_database WHERE datname='comerciantes'\" \
  | grep -q 1 || psql -U postgres -c \
  \"CREATE DATABASE comerciantes OWNER comerciantes;\""

echo "==> Aplicando schema..."
su postgres -c "psql -U comerciantes -d comerciantes -f /app/schema.sql"
echo "==> Schema OK"

# ── 4. Arrancar Node en primer plano ─────────────────────────
echo "==> Iniciando app en puerto $PORT..."
exec node /app/server/index.js
