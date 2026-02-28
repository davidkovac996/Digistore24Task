const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const PROMO_CODE = 'digistore24';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_DAYS = 7;

function generateTokens(user) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_EXPIRES_DAYS}d`,
  });
  return { accessToken, refreshToken };
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

// ── POST /api/auth/register ──────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const { rows } = await db.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, 'client')
         RETURNING id, email, role, created_at`,
        [email, passwordHash]
      );
      const user = rows[0];

      const { accessToken, refreshToken } = generateTokens(user);
      const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400000);
      await db.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );

      setRefreshCookie(res, refreshToken);
      return res.status(201).json({
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const { email, password } = req.body;

    try {
      const { rows } = await db.query(
        'SELECT id, email, password_hash, role FROM users WHERE email = $1',
        [email]
      );
      const user = rows[0];

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const { accessToken, refreshToken } = generateTokens(user);
      const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400000);

      // Clean old tokens for this user (optional hygiene)
      await db.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()', [
        user.id,
      ]);
      await db.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );

      setRefreshCookie(res, refreshToken);
      return res.json({
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── POST /api/auth/refresh ───────────────────────────────────
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const { rows } = await db.query(
      `SELECT rt.id, u.id as uid, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [token]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid refresh token.' });

    const user = { id: rows[0].uid, email: rows[0].email, role: rows[0].role };
    const { accessToken, refreshToken: newRefresh } = generateTokens(user);
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400000);

    // Rotate token
    await db.query('DELETE FROM refresh_tokens WHERE id = $1', [rows[0].id]);
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, newRefresh, expiresAt]
    );

    setRefreshCookie(res, newRefresh);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]).catch(() => {});
  }
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.clearCookie('access_token');
  return res.json({ message: 'Logged out.' });
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
