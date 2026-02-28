const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const PROMO_CODE = 'digistore24';

// Shared order-placement logic used by both authenticated and guest routes
async function placeOrderTransaction(client, { userId, isGuest, items, customer_name, customer_surname, delivery_address, phone, promo_code, payment_method }) {
  await client.query('BEGIN');

  // Lock and fetch products
  const productIds = [...new Set(items.map((i) => i.product_id))];
  const { rows: products } = await client.query(
    `SELECT id, name, price_cents, weight_grams, quantity
     FROM products
     WHERE id = ANY($1::uuid[])
     FOR UPDATE`,
    [productIds]
  );

  const productMap = {};
  for (const p of products) productMap[p.id] = p;

  // Validate stock
  const insufficient = [];
  for (const item of items) {
    const p = productMap[item.product_id];
    if (!p) {
      insufficient.push({ product_id: item.product_id, reason: 'Product not found' });
    } else if (p.quantity < item.quantity) {
      insufficient.push({ product_id: item.product_id, name: p.name, requested: item.quantity, available: p.quantity });
    }
  }
  if (insufficient.length > 0) {
    await client.query('ROLLBACK');
    return { status: 409, body: { error: 'Insufficient stock.', insufficient } };
  }

  // Calculate totals server-side
  let subtotalCents = 0;
  for (const item of items) {
    subtotalCents += productMap[item.product_id].price_cents * item.quantity;
  }
  const promoApplied = promo_code && promo_code.trim().toLowerCase() === PROMO_CODE;
  const discountCents = promoApplied ? Math.round(subtotalCents * 0.1) : 0;
  const totalCents = subtotalCents - discountCents;

  // Insert order
  const { rows: orderRows } = await client.query(
    `INSERT INTO orders
       (user_id, is_guest, customer_name, customer_surname, delivery_address, phone,
        promo_code, discount_cents, subtotal_cents, total_cents, payment_method)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      userId,
      isGuest,
      customer_name.trim(),
      customer_surname.trim(),
      delivery_address.trim(),
      phone.trim(),
      promoApplied ? PROMO_CODE : null,
      discountCents,
      subtotalCents,
      totalCents,
      payment_method,
    ]
  );
  const orderId = orderRows[0].id;

  // Insert order items + decrement stock
  for (const item of items) {
    const p = productMap[item.product_id];
    await client.query(
      `INSERT INTO order_items
         (order_id, product_id, product_name_snapshot, unit_price_cents_snapshot,
          weight_grams_snapshot, quantity)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [orderId, p.id, p.name, p.price_cents, p.weight_grams, item.quantity]
    );
    await client.query(
      `UPDATE products SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2`,
      [item.quantity, p.id]
    );
  }

  await client.query('COMMIT');
  return { status: 201, body: { order_id: orderId, total_cents: totalCents } };
}

const orderValidators = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array.'),
  body('items.*.product_id').isUUID().withMessage('Each item must have a valid product_id.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be >= 1.'),
  body('customer_name').trim().notEmpty().withMessage('customer_name is required.'),
  body('customer_surname').trim().notEmpty().withMessage('customer_surname is required.'),
  body('delivery_address').trim().notEmpty().withMessage('delivery_address is required.'),
  body('phone').trim().notEmpty().withMessage('phone is required.'),
  body('payment_method').isIn(['cash', 'card']).withMessage('payment_method must be cash or card.'),
];

// ── POST /api/orders ──────────────────────────────────────────
// Place a new order (authenticated)
router.post('/', authenticate, orderValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { items, customer_name, customer_surname, delivery_address, phone, promo_code, payment_method } = req.body;
  const client = await db.getClient();
  try {
    const result = await placeOrderTransaction(client, {
      userId: req.user.id,
      isGuest: false,
      items, customer_name, customer_surname, delivery_address, phone, promo_code, payment_method,
    });
    return res.status(result.status).json(result.body);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
});

// ── POST /api/orders/guest ────────────────────────────────────
// Place a new order as a guest (no auth required)
router.post('/guest', orderValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { items, customer_name, customer_surname, delivery_address, phone, promo_code, payment_method } = req.body;
  const client = await db.getClient();
  try {
    const result = await placeOrderTransaction(client, {
      userId: null,
      isGuest: true,
      items, customer_name, customer_surname, delivery_address, phone, promo_code, payment_method,
    });
    return res.status(result.status).json(result.body);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Guest order error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
});

// ── GET /api/orders/mine ──────────────────────────────────────
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, total_cents, subtotal_cents, discount_cents, promo_code,
              customer_name, customer_surname, delivery_address, phone, payment_method, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/orders/mine/:orderId ─────────────────────────────
router.get('/mine/:orderId', authenticate, async (req, res) => {
  try {
    const { rows: orderRows } = await db.query(
      `SELECT id, total_cents, subtotal_cents, discount_cents, promo_code,
              customer_name, customer_surname, delivery_address, phone, payment_method, created_at
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [req.params.orderId, req.user.id]
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Order not found.' });

    const { rows: items } = await db.query(
      `SELECT id, product_id, product_name_snapshot, unit_price_cents_snapshot,
              weight_grams_snapshot, quantity
       FROM order_items
       WHERE order_id = $1`,
      [req.params.orderId]
    );

    res.json({ order: { ...orderRows[0], items } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/orders/admin/unread-count ────────────────────────
router.get('/admin/unread-count', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS count FROM orders WHERE is_read = FALSE`);
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/orders/admin ─────────────────────────────────────
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.id, o.total_cents, o.subtotal_cents, o.discount_cents, o.promo_code,
              o.customer_name, o.customer_surname, o.delivery_address, o.phone, o.payment_method,
              o.is_read, o.is_guest, o.created_at,
              u.email AS user_email
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    );
    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/orders/admin/:id ─────────────────────────────────
router.get('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: orderRows } = await db.query(
      `UPDATE orders SET is_read = TRUE WHERE id = $1
       RETURNING id, total_cents, subtotal_cents, discount_cents, promo_code,
                 customer_name, customer_surname, delivery_address, phone, payment_method,
                 is_read, is_guest, created_at`,
      [req.params.id]
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Order not found.' });

    const { rows: userRows } = await db.query(
      `SELECT u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = $1`,
      [req.params.id]
    );
    const order = { ...orderRows[0], user_email: userRows[0]?.user_email ?? null };

    const { rows: items } = await db.query(
      `SELECT id, product_id, product_name_snapshot, unit_price_cents_snapshot,
              weight_grams_snapshot, quantity
       FROM order_items WHERE order_id = $1`,
      [req.params.id]
    );

    res.json({ order: { ...order, items } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
