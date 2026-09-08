const router = require('express').Router();
const pool = require('../db');

// GET /api/stock?clienteId=x
router.get('/', async (req, res) => {
  const { clienteId } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT sm.*, p.nombre as producto_nombre
       FROM stock_movimientos sm
       JOIN productos p ON p.id = sm.producto_id
       WHERE p.cliente_id = $1
       ORDER BY sm.fecha DESC`,
      [clienteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stock — registra movimiento y actualiza stock
router.post('/', async (req, res) => {
  const { productoId, tipo, cantidad, motivo } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO stock_movimientos (producto_id, tipo, cantidad, motivo)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [productoId, tipo, cantidad, motivo]
    );
    const delta = tipo === 'entrada' ? cantidad : -cantidad;
    await client.query(
      'UPDATE productos SET stock = stock + $1 WHERE id = $2',
      [delta, productoId]
    );
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
