const router = require('express').Router();
const pool = require('../db');

// GET /api/medios-pago?clienteId=x
router.get('/', async (req, res) => {
  const { clienteId } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM medios_pago WHERE cliente_id=$1 ORDER BY nombre',
      [clienteId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/medios-pago
router.post('/', async (req, res) => {
  const { clienteId, nombre, tipo, comision, activo } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO medios_pago (cliente_id, nombre, tipo, comision, activo)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [clienteId, nombre, tipo, comision || 0, activo !== false]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/medios-pago/:id
router.put('/:id', async (req, res) => {
  const { nombre, tipo, comision, activo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE medios_pago SET nombre=$1, tipo=$2, comision=$3, activo=$4
       WHERE id=$5 RETURNING *`,
      [nombre, tipo, comision || 0, activo !== false, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/medios-pago/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medios_pago WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
