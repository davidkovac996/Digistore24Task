require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('./index');
const fs = require('fs');
const path = require('path');

async function runSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Schema applied');
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@brewedtrue.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!';
  const hash = await bcrypt.hash(password, 12);

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log('⏭  Admin already exists, skipping.');
    return;
  }

  await query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')`,
    [email, hash]
  );
  console.log(`✅ Admin created: ${email} / ${password}`);
}

async function seedProducts() {
  const { rows } = await query('SELECT COUNT(*) FROM products');
  if (parseInt(rows[0].count) > 0) {
    console.log('⏭  Products already exist, skipping.');
    return;
  }

  const products = [
    {
      name: 'Ethiopian Yirgacheffe',
      price_cents: 1699,
      weight_grams: 250,
      quantity: 20,
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80',
    },
    {
      name: 'Colombian Supremo',
      price_cents: 1499,
      weight_grams: 500,
      quantity: 15,
      image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    },
    {
      name: 'Sumatra Mandheling',
      price_cents: 1599,
      weight_grams: 250,
      quantity: 8,
      image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
    },
    {
      name: 'Guatemala Antigua',
      price_cents: 1799,
      weight_grams: 250,
      quantity: 0,
      image_url: 'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=600&q=80',
    },
    {
      name: 'Kenya AA',
      price_cents: 1899,
      weight_grams: 500,
      quantity: 12,
      image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
    },
    {
      name: 'Brazil Santos',
      price_cents: 1299,
      weight_grams: 1000,
      quantity: 25,
      image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
    },
  ];

  for (const p of products) {
    await query(
      `INSERT INTO products (name, price_cents, weight_grams, quantity, image_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [p.name, p.price_cents, p.weight_grams, p.quantity, p.image_url]
    );
  }
  console.log(`✅ Seeded ${products.length} products`);
}

async function migrate() {
  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) NOT NULL DEFAULT 'cash'
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name       VARCHAR(255) NOT NULL,
      email      VARCHAR(255) NOT NULL,
      subject    VARCHAR(255) NOT NULL,
      body       TEXT NOT NULL,
      is_read    BOOLEAN NOT NULL DEFAULT FALSE,
      reply      TEXT,
      replied_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Migration: reviews table ensured');
}

async function main() {
  console.log('🌱 Starting seed...');
  try {
    await runSchema();
    await migrate();
    await seedAdmin();
    await seedProducts();
    console.log('🎉 Seed complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
