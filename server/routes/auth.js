const router = require('express').Router();
const pool = require('../db');

// GET /api/auth/clientes — lista todos los negocios (id + nombre)
router.get('/clientes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre FROM clientes ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — valida PIN
router.post('/login', async (req, res) => {
  const { clienteId, pin } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre FROM clientes WHERE id = $1 AND pin = $2',
      [clienteId, pin]
    );
    if (!rows.length) return res.status(401).json({ error: 'PIN incorrecto' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
