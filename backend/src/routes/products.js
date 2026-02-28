const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── GET /api/products ────────────────────────────────────────
// Public – lists all products
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, price_cents, weight_grams, quantity, image_url, created_at, updated_at
       FROM products
       ORDER BY created_at ASC`
    );
    res.json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/products/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, price_cents, weight_grams, quantity, image_url, created_at, updated_at
       FROM products WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Admin product validators ───────────────────────────────────
const productValidators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('price_cents').isInt({ min: 1 }).withMessage('price_cents must be a positive integer.'),
  body('weight_grams').isInt({ min: 1 }).withMessage('weight_grams must be a positive integer.'),
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be >= 0.'),
  body('image_url').trim().isURL().withMessage('image_url must be a valid URL.'),
];

// ── POST /api/admin/products ──────────────────────────────────
router.post(
  '/admin',
  authenticate,
  requireAdmin,
  productValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, price_cents, weight_grams, quantity, image_url } = req.body;
    try {
      const { rows } = await db.query(
        `INSERT INTO products (name, price_cents, weight_grams, quantity, image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name.trim(), price_cents, weight_grams, quantity, image_url.trim()]
      );
      res.status(201).json({ product: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── PUT /api/admin/products/:id ───────────────────────────────
router.put(
  '/admin/:id',
  authenticate,
  requireAdmin,
  productValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, price_cents, weight_grams, quantity, image_url } = req.body;
    try {
      const { rows } = await db.query(
        `UPDATE products
         SET name=$1, price_cents=$2, weight_grams=$3, quantity=$4, image_url=$5, updated_at=NOW()
         WHERE id=$6
         RETURNING *`,
        [name.trim(), price_cents, weight_grams, quantity, image_url.trim(), req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
      res.json({ product: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── DELETE /api/admin/products/:id ────────────────────────────
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
