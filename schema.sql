-- schema.sql — ejecutar en Railway PostgreSQL

CREATE TABLE clientes (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  pin       TEXT NOT NULL
);

CREATE TABLE categorias (
  id         SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  grupo      TEXT CHECK (grupo IN ('COGS','FIJO','VARIABLE','FINANCIERO','IMPUESTOS'))
);

CREATE TABLE terceros (
  id         SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  tipo       TEXT CHECK (tipo IN ('cliente','proveedor'))
);

CREATE TABLE productos (
  id           SERIAL PRIMARY KEY,
  cliente_id   INT REFERENCES clientes(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  costo        NUMERIC(12,2) DEFAULT 0,
  precio_venta NUMERIC(12,2) DEFAULT 0,
  stock        NUMERIC(12,3) DEFAULT 0,
  stock_minimo NUMERIC(12,3) DEFAULT 0,
  categoria_id INT REFERENCES categorias(id)
);

CREATE TABLE stock_movimientos (
  id          SERIAL PRIMARY KEY,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  tipo        TEXT CHECK (tipo IN ('entrada','salida')),
  cantidad    NUMERIC(12,3) NOT NULL,
  motivo      TEXT,
  fecha       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE insumos (
  id         SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  unidad     TEXT,
  costo      NUMERIC(12,4) DEFAULT 0
);

CREATE TABLE formulas (
  id          SERIAL PRIMARY KEY,
  cliente_id  INT REFERENCES clientes(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  rendimiento NUMERIC(12,3) DEFAULT 1
);

CREATE TABLE formula_items (
  id         SERIAL PRIMARY KEY,
  formula_id INT REFERENCES formulas(id) ON DELETE CASCADE,
  insumo_id  INT REFERENCES insumos(id),
  cantidad   NUMERIC(12,4) NOT NULL
);

CREATE TABLE transacciones (
  id           SERIAL PRIMARY KEY,
  cliente_id   INT REFERENCES clientes(id) ON DELETE CASCADE,
  tipo         TEXT CHECK (tipo IN ('ingreso','gasto')),
  monto        NUMERIC(12,2) NOT NULL,
  categoria_id INT REFERENCES categorias(id),
  descripcion  TEXT,
  fecha        DATE DEFAULT CURRENT_DATE
);

CREATE TABLE cuentas_corrientes (
  id          SERIAL PRIMARY KEY,
  cliente_id  INT REFERENCES clientes(id) ON DELETE CASCADE,
  tercero_id  INT REFERENCES terceros(id),
  monto       NUMERIC(12,2) NOT NULL,
  estado      TEXT CHECK (estado IN ('pendiente','parcial','pagada','vencida')) DEFAULT 'pendiente',
  vencimiento DATE,
  descripcion TEXT,
  fecha       DATE DEFAULT CURRENT_DATE
);
