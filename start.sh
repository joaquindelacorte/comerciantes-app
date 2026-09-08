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

# ── 3. Setup: SIEMPRE conectar a 'postgres' (existe siempre) ──
#    Los || true evitan fallo si user/DB ya existen en reinicios
echo "==> Configurando usuario y base de datos..."
su postgres -c "psql -U postgres -d postgres -c \"CREATE USER comerciantes WITH PASSWORD 'comerciantes';\"" 2>/dev/null || true
su postgres -c "psql -U postgres -d postgres -c \"CREATE DATABASE comerciantes OWNER comerciantes;\"" 2>/dev/null || true

# ── 4. Aplicar schema (IF NOT EXISTS => idempotente) ─────────
echo "==> Aplicando schema..."
su postgres -c "psql -U postgres -d comerciantes -f /app/schema.sql"
echo "==> Schema OK"

# ── 5. Insertar cliente demo si no existe ─────────────────────
echo "==> Cargando datos demo..."
su postgres -c "psql -U postgres -d comerciantes -c \
  \"INSERT INTO clientes (nombre, pin) \
    SELECT 'Almacen Demo', '1234' \
    WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'Almacen Demo');\"" || true
echo "==> Demo listo: negocio='Almacen Demo' PIN=1234"

# ── 6. Node en primer plano ───────────────────────────────────
echo "==> Iniciando app en puerto $PORT..."
exec node /app/server/index.js
