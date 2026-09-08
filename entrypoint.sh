#!/bin/sh
# entrypoint.sh — espera Postgres, aplica schema y arranca Express

set -e

echo "⏳ Esperando conexión a Postgres..."

# Esperar hasta 60s a que Postgres acepte conexiones
MAX=60
COUNT=0
until node -e "
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  c.connect().then(() => { c.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX ]; then
    echo "❌ Postgres no respondió en ${MAX}s. Abortando."
    exit 1
  fi
  sleep 1
done

echo "✅ Postgres listo. Aplicando schema..."

# Aplicar schema (idempotente: usa IF NOT EXISTS)
node -e "
const fs = require('fs');
const { Client } = require('pg');
const sql = fs.readFileSync('/app/schema.sql', 'utf8');
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
c.connect()
  .then(() => c.query(sql))
  .then(() => { console.log('✅ Schema aplicado.'); c.end(); })
  .catch(e => { console.error('❌ Error aplicando schema:', e.message); process.exit(1); });
"

echo "🚀 Iniciando la app..."
exec node server/index.js
