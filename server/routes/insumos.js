const router = require('express').Router();
const pool = require('../db');

// GET /api/insumos?clienteId=x
router.get('/', async (req, res) => {
  const { clienteId } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM insumos WHERE cliente_id=$1 ORDER BY nombre',
      [clienteId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/insumos
router.post('/', async (req, res) => {
  const { clienteId, nombre, unidad, costo } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO insumos (cliente_id, nombre, unidad, costo) VALUES ($1,$2,$3,$4) RETURNING *',
      [clienteId, nombre, unidad, costo]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/insumos/:id
router.put('/:id', async (req, res) => {
  const { nombre, unidad, costo } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE insumos SET nombre=$1, unidad=$2, costo=$3 WHERE id=$4 RETURNING *',
      [nombre, unidad, costo, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/insumos/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM insumos WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
