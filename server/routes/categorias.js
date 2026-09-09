const router = require('express').Router();
const pool = require('../db');

// GET /api/categorias?clienteId=x
router.get('/', async (req, res) => {
  const { clienteId } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categorias WHERE cliente_id = $1 ORDER BY grupo, nombre',
      [clienteId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/categorias
router.post('/', async (req, res) => {
  const { clienteId, nombre, grupo } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categorias (cliente_id, nombre, grupo) VALUES ($1,$2,$3) RETURNING *',
      [clienteId, nombre, grupo]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/categorias/:id
router.put('/:id', async (req, res) => {
  const { nombre, grupo } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE categorias SET nombre=$1, grupo=$2 WHERE id=$3 RETURNING *',
      [nombre, grupo, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/categorias/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categorias WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
