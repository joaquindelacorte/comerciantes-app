const router = require('express').Router();
const pool = require('../db');

// GET /api/productos?clienteId=x
router.get('/', async (req, res) => {
  const { clienteId } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM productos WHERE cliente_id = $1 ORDER BY nombre',
      [clienteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/productos
router.post('/', async (req, res) => {
  const { clienteId, nombre, costo, precioVenta, stock, stockMinimo, categoriaId } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (cliente_id, nombre, costo, precio_venta, stock, stock_minimo, categoria_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [clienteId, nombre, costo, precioVenta, stock, stockMinimo, categoriaId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
  const { nombre, costo, precioVenta, stock, stockMinimo, categoriaId } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE productos SET nombre=$1, costo=$2, precio_venta=$3, stock=$4,
       stock_minimo=$5, categoria_id=$6 WHERE id=$7 RETURNING *`,
      [nombre, costo, precioVenta, stock, stockMinimo, categoriaId, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/productos/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
