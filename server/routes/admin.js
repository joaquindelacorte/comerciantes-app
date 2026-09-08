const router = require('express').Router();
const pool = require('../db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  res.json({ ok: true });
});

// GET /api/admin/clientes
router.get('/clientes', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, pin FROM clientes ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/clientes
router.post('/clientes', adminAuth, async (req, res) => {
  const { nombre, pin } = req.body;
  if (!nombre || !pin) return res.status(400).json({ error: 'nombre y pin son requeridos' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO clientes (nombre, pin) VALUES ($1, $2) RETURNING *',
      [nombre, pin]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/clientes/:id
router.put('/clientes/:id', adminAuth, async (req, res) => {
  const { nombre, pin } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE clientes SET nombre=$1, pin=$2 WHERE id=$3 RETURNING *',
      [nombre, pin, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/clientes/:id
router.delete('/clientes/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware: verifica header Authorization: Bearer <password>
function adminAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  if (token !== ADMIN_PASSWORD) return res.status(401).json({ error: 'No autorizado' });
  next();
}

module.exports = router;
