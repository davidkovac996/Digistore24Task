const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// ── GET /api/reviews ──────────────────────────────────────────
// Public — returns all reviews, newest first
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.rating, r.body, r.created_at, r.updated_at,
              u.email
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    );
    res.json({ reviews: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/reviews ─────────────────────────────────────────
// Authenticated client — create or update own review (upsert)
router.post(
  '/',
  authenticate,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5.'),
    body('body')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Review must be 10-500 characters.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { rating, body: reviewBody } = req.body;
    try {
      const { rows } = await db.query(
        `INSERT INTO reviews (user_id, rating, body)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET rating = EXCLUDED.rating,
               body = EXCLUDED.body,
               updated_at = NOW()
         RETURNING id, rating, body, created_at, updated_at`,
        [req.user.id, rating, reviewBody.trim()]
      );
      res.status(201).json({ review: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── DELETE /api/reviews/:id ───────────────────────────────────
// Admin only
router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  try {
    const { rowCount } = await db.query(
      'DELETE FROM reviews WHERE id = $1',
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Review not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
