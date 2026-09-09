const router = require('express').Router();
const pool = require('../db');

// GET /api/terceros?clienteId=x&tipo=cliente|proveedor
router.get('/', async (req, res) => {
  const { clienteId, tipo } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM terceros WHERE cliente_id=$1 ${tipo ? 'AND tipo=$2' : ''} ORDER BY nombre`,
      tipo ? [clienteId, tipo] : [clienteId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/terceros
router.post('/', async (req, res) => {
  const { clienteId, nombre, tipo } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO terceros (cliente_id, nombre, tipo) VALUES ($1,$2,$3) RETURNING *',
      [clienteId, nombre, tipo]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/terceros/:id
router.put('/:id', async (req, res) => {
  const { nombre, tipo } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE terceros SET nombre=$1, tipo=$2 WHERE id=$3 RETURNING *',
      [nombre, tipo, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/terceros/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM terceros WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
