-- ============================================================
-- Brewed & True – Database Schema
-- Run this file against your PostgreSQL database:
--   psql $DATABASE_URL -f schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(10) NOT NULL DEFAULT 'client'
                  CHECK (role IN ('admin', 'client')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  price_cents   INTEGER NOT NULL CHECK (price_cents > 0),
  weight_grams  INTEGER NOT NULL CHECK (weight_grams > 0),
  quantity      INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  image_url     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  customer_name     VARCHAR(255) NOT NULL,
  customer_surname  VARCHAR(255) NOT NULL,
  delivery_address  TEXT NOT NULL,
  phone             VARCHAR(50) NOT NULL,
  promo_code        VARCHAR(50),
  discount_cents    INTEGER NOT NULL DEFAULT 0,
  subtotal_cents    INTEGER NOT NULL,
  total_cents       INTEGER NOT NULL,
  payment_method    VARCHAR(10) NOT NULL DEFAULT 'cash'
                      CHECK (payment_method IN ('cash', 'card')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Order Items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  UUID NOT NULL REFERENCES orders(id),
  product_id                UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot     VARCHAR(255) NOT NULL,
  unit_price_cents_snapshot INTEGER NOT NULL,
  weight_grams_snapshot     INTEGER NOT NULL,
  quantity                  INTEGER NOT NULL CHECK (quantity >= 1)
);

-- ── Refresh Tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Contact Messages ─────────────────────────────────────────
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
);

-- ── Migrations ───────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
