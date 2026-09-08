#!/bin/bash
# docker-init.sh — inicializa Postgres si es la primera vez, aplica schema y arranca todo con supervisord

set -e

PGDATA=${PGDATA:-/var/lib/postgresql/data}

# ── 1. Inicializar cluster de Postgres si no existe ─────────────
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "🗄️  Inicializando base de datos PostgreSQL..."
  mkdir -p "$PGDATA"
  chown -R postgres:postgres "$PGDATA"

  su -c "pg_lsclusters" postgres 2>/dev/null || true

  su postgres -c "/usr/lib/postgresql/$(ls /usr/lib/postgresql)/bin/pg_ctl \
    initdb -D $PGDATA \
    -o '--auth=trust --username=postgres'"

  # Configurar acceso local sin contraseña para setup inicial
  echo "host all all 127.0.0.1/32 trust" >> "$PGDATA/pg_hba.conf"
  echo "local all all trust" >> "$PGDATA/pg_hba.conf"

  FIRST_RUN=true
fi

# ── 2. Arrancar Postgres en background para el setup ───────────
echo "▶️  Arrancando PostgreSQL..."
su postgres -c "/usr/lib/postgresql/$(ls /usr/lib/postgresql)/bin/pg_ctl \
  start -D $PGDATA -l /tmp/pg.log -w"

# ── 3. Si es la primera vez: crear user, DB y aplicar schema ───
if [ "$FIRST_RUN" = "true" ]; then
  echo "🔧  Creando usuario y base de datos..."
  su postgres -c "psql -c \"CREATE USER comerciantes WITH PASSWORD 'comerciantes';\""
  su postgres -c "psql -c \"CREATE DATABASE comerciantes OWNER comerciantes;\""

  echo "📋  Aplicando schema..."
  su postgres -c "psql -U comerciantes -d comerciantes -f /app/schema.sql"
  echo "✅  Schema aplicado."
else
  echo "✅  Base de datos existente. Aplicando migraciones pendientes..."
  su postgres -c "psql -U comerciantes -d comerciantes -f /app/schema.sql" 2>/dev/null || true
fi

# Detener Postgres — supervisord lo va a levantar correctamente
su postgres -c "/usr/lib/postgresql/$(ls /usr/lib/postgresql)/bin/pg_ctl \
  stop -D $PGDATA"

# ── 4. Arrancar supervisord (Postgres + Node juntos) ───────────
echo "🚀  Arrancando aplicación..."
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/app.conf
