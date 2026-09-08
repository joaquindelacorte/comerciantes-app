# Comerciantes App

SaaS de gestión operativa para pequeños comercios argentinos (kioscos, almacenes, despensas).

## Stack

- **Frontend:** HTML + CSS + JS vanilla (Vite)
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Deploy:** Railway / Docker

---

## 🐳 Dev local con Docker (recomendado)

Levanta la app **y** la base de datos en un solo comando. El `schema.sql` se carga automáticamente la primera vez.

```bash
docker compose up --build
```

- App: http://localhost:3000
- Postgres: `localhost:5432` (user: `comerciantes`, pass: `comerciantes`, db: `comerciantes`)

Para bajar todo:
```bash
docker compose down          # detiene contenedores
docker compose down -v       # detiene + borra datos de la DB
```

---

## ⚙️ Dev local sin Docker

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env desde el ejemplo y completar DATABASE_URL
cp .env.example .env

# 3. Crear la DB y cargar el schema
psql $DATABASE_URL < schema.sql

# 4. Correr app y cliente en paralelo
npm run dev
# → Express en :3000
# → Vite en :5173 (proxea /api a :3000)
```

---

## 🚂 Deploy en Railway

Railway detecta el `Dockerfile` automáticamente.

1. Push al repo → Railway redespliega solo
2. En el proyecto de Railway: **+ New → Database → PostgreSQL**
3. Railway inyecta `DATABASE_URL` automáticamente en la app
4. Ejecutar el schema en Railway (una sola vez):

```bash
# Opción A: desde el Query Runner de Railway (panel web)
# Copiar y pegar el contenido de schema.sql

# Opción B: con railway CLI
railway run psql $DATABASE_URL < schema.sql
```

---

## 📁 Estructura

```
├── Dockerfile            # Multi-stage: Vite build → Node runtime
├── docker-compose.yml    # App + Postgres para dev local
├── schema.sql            # Tablas iniciales (se auto-carga en Docker)
├── railway.toml          # Config de build/start para Railway
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── css/main.css
│       └── js/
│           ├── main.js
│           └── auth.js
└── server/
    ├── index.js          # Express (sirve /api/* y build estático)
    ├── db.js             # Pool pg con DATABASE_URL
    └── routes/
        ├── auth.js
        ├── productos.js
        ├── stock.js
        ├── tesoreria.js
        └── manufactura.js
```

---

## 📦 Módulos planificados

1. Estado de Resultados (P&L) — mensual / acumulado / histórico
2. Márgenes por producto
3. Manufactura (BOM / recetas con costeo)
4. Stock e inventario (descuento automático, alertas de quiebre)
5. Tesorería: cuenta corriente, facturas, terceros, medios de pago

## 🔜 Pendiente v2

- IVA crédito fiscal en compras de insumos/stock
- Integración con ARCA (ex-AFIP)
