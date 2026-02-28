const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── POST /api/contact ─────────────────────────────────────────
// Public — anyone can submit a message
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('subject').trim().notEmpty().withMessage('Subject is required.'),
    body('body').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, email, subject, body: msgBody } = req.body;
    try {
      await db.query(
        `INSERT INTO contact_messages (name, email, subject, body)
         VALUES ($1, $2, $3, $4)`,
        [name.trim(), email.trim().toLowerCase(), subject.trim(), msgBody.trim()]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET /api/contact/mine/replied-ids ────────────────────────
// Authenticated — IDs of the user's messages with an unseen reply (for navbar badge)
router.get('/mine/replied-ids', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id FROM contact_messages
       WHERE email = $1 AND reply IS NOT NULL AND reply_seen_by_client = FALSE`,
      [req.user.email]
    );
    res.json({ ids: rows.map(r => r.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/contact/mine ─────────────────────────────────────
// Authenticated — returns messages sent from the user's account email
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, subject, body, reply, replied_at, created_at, reply_seen_by_client
       FROM contact_messages
       WHERE email = $1
       ORDER BY created_at DESC`,
      [req.user.email]
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PATCH /api/contact/mine/mark-all-seen ────────────────────
// Authenticated — marks all replied messages as seen by the client
router.patch('/mine/mark-all-seen', authenticate, async (req, res) => {
  try {
    await db.query(
      `UPDATE contact_messages
       SET reply_seen_by_client = TRUE
       WHERE email = $1 AND reply IS NOT NULL`,
      [req.user.email]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PATCH /api/contact/mine/:id/seen ─────────────────────────
// Authenticated — marks a reply as seen by the client
router.patch('/mine/:id/seen', authenticate, async (req, res) => {
  try {
    await db.query(
      `UPDATE contact_messages
       SET reply_seen_by_client = TRUE
       WHERE id = $1 AND email = $2`,
      [req.params.id, req.user.email]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PATCH /api/contact/admin/mark-all-read ───────────────────
// Admin — marks all messages as read
router.patch('/admin/mark-all-read', authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query(`UPDATE contact_messages SET is_read = TRUE WHERE is_read = FALSE`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/contact/admin ────────────────────────────────────
// Admin — list all messages, newest first
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, email, subject, is_read, reply, replied_at, created_at
       FROM contact_messages
       ORDER BY created_at DESC`
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/contact/admin/unread-count ──────────────────────
// Admin — lightweight unread message count for the navbar badge
router.get('/admin/unread-count', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS unread FROM contact_messages WHERE is_read = FALSE`
    );
    res.json({ unread: rows[0].unread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/contact/admin/:id ────────────────────────────────
// Admin — get full message (including body) and mark as read
router.get('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE contact_messages
       SET is_read = TRUE
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Message not found.' });
    res.json({ message: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/contact/admin/:id/reply ─────────────────────────
// Admin — save a reply note and mark as replied
router.put(
  '/admin/:id/reply',
  authenticate,
  requireAdmin,
  [body('reply').trim().notEmpty().withMessage('Reply cannot be empty.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
      const { rows } = await db.query(
        `UPDATE contact_messages
         SET reply = $1, replied_at = NOW(), is_read = TRUE
         WHERE id = $2
         RETURNING *`,
        [req.body.reply.trim(), req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Message not found.' });
      res.json({ message: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
