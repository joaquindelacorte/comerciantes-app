const router = require('express').Router();
const pool = require('../db');

// GET /api/tesoreria/tx?clienteId=x&desde=&hasta=
router.get('/tx', async (req, res) => {
  const { clienteId, desde, hasta } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM transacciones
       WHERE cliente_id = $1
         AND ($2::date IS NULL OR fecha >= $2::date)
         AND ($3::date IS NULL OR fecha <= $3::date)
       ORDER BY fecha DESC`,
      [clienteId, desde || null, hasta || null]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tesoreria/tx
router.post('/tx', async (req, res) => {
  const { clienteId, tipo, monto, categoriaId, descripcion, fecha } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO transacciones (cliente_id, tipo, monto, categoria_id, descripcion, fecha)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [clienteId, tipo, monto, categoriaId, descripcion, fecha || 'now()']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tesoreria/cuentas-corrientes?clienteId=x
router.get('/cuentas-corrientes', async (req, res) => {
  const { clienteId } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT cc.*, t.nombre as tercero_nombre
       FROM cuentas_corrientes cc
       JOIN terceros t ON t.id = cc.tercero_id
       WHERE cc.cliente_id = $1`,
      [clienteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
