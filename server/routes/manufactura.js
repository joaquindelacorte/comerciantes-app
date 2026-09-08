const router = require('express').Router();
const pool = require('../db');

// GET /api/manufactura/formulas?clienteId=x
router.get('/formulas', async (req, res) => {
  const { clienteId } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM formulas WHERE cliente_id = $1 ORDER BY nombre',
      [clienteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/manufactura/formulas/:id/items — ingredientes de una fórmula
router.get('/formulas/:id/items', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT fi.*, i.nombre as insumo_nombre
       FROM formula_items fi
       JOIN insumos i ON i.id = fi.insumo_id
       WHERE fi.formula_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/manufactura/formulas
router.post('/formulas', async (req, res) => {
  const { clienteId, nombre, rendimiento, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO formulas (cliente_id, nombre, rendimiento) VALUES ($1,$2,$3) RETURNING *',
      [clienteId, nombre, rendimiento]
    );
    const formulaId = rows[0].id;
    for (const item of items) {
      await client.query(
        'INSERT INTO formula_items (formula_id, insumo_id, cantidad) VALUES ($1,$2,$3)',
        [formulaId, item.insumoId, item.cantidad]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
