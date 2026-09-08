# Comerciantes App

SaaS de gestión operativa para pequeños comercios argentinos (kioscos, almacenes, despensas).

## Stack
- HTML + CSS + JS vanilla
- Vite (dev server + build)
- Supabase (backend)
- Deploy: Railway

## Estructura
```
/
├── index.html          # Entry point
├── src/
│   ├── css/            # Estilos por módulo
│   ├── js/             # Lógica por módulo
│   │   ├── auth.js     # Login por PIN
│   │   ├── resultados.js
│   │   ├── productos.js
│   │   ├── stock.js
│   │   ├── tesoreria.js
│   │   ├── manufactura.js
│   │   └── supabase.js # Cliente Supabase
│   └── components/     # Web components reutilizables (futuro)
├── public/             # Assets estáticos
└── package.json
```

## Módulos planificados
1. Estado de Resultados (P&L) — mensual / acumulado / histórico
2. Márgenes por producto
3. Manufactura (BOM / recetas con costeo)
4. Stock e inventario (descuento automático, alertas de quiebre)
5. Tesorería: cuenta corriente, facturas, terceros, medios de pago
6. Demo con seed de datos (almacén ficticio)

## Pendiente v2
- IVA crédito fiscal en compras de insumos/stock
- Integración con ARCA (ex-AFIP)

## Dev local
```bash
npm install
npm run dev
```

## Deploy Railway
Railway detecta automáticamente el `package.json`. El script `start` usa `$PORT`.
