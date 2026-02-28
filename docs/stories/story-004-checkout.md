# Story 004 — Checkout Flow

**Epic:** 5 — Checkout
**Status:** Done
**Points:** 5

---

## User Story

As a **client or guest**, I want to enter my delivery details, choose a payment method, optionally apply a promo code, and place my order — with the guarantee that I cannot be oversold and that the price I see is the price I pay.

---

## Background & Context

Checkout is the most security-critical flow in the application:

1. **Server-side pricing** — the client sends item IDs and quantities; the server looks up prices from the DB and calculates all totals. The client's displayed prices are never trusted.
2. **Atomic stock decrement** — a `BEGIN … FOR UPDATE … COMMIT` transaction prevents two simultaneous checkouts from both succeeding on the last unit.
3. **Promo code validation** — the server validates `DIGISTORE24`; the frontend cannot forge a discount.
4. **Order snapshots** — `order_items` records name, price, and weight at the time of purchase. Future product edits never affect order history.

### Guest Checkout
Guest orders use `POST /api/orders/guest` (no auth middleware). The `user_id` column is `NULL` and `is_guest = TRUE`. After a successful guest order, the frontend shows a confirmation screen (no `/history` to redirect to).

---

## Tasks

### Backend

- [x] `POST /api/orders` — authenticated clients
  - `express-validator` validates: items array (non-empty, valid UUIDs, quantity ≥ 1), customer_name, customer_surname, delivery_address, phone, payment_method (cash|card)
  - `placeOrderTransaction` helper executes:
    1. `SELECT … FOR UPDATE` lock on all product rows
    2. Stock validation — collect all insufficient items and return 409 with full list
    3. Calculate subtotal, apply promo discount server-side
    4. `INSERT orders` with `user_id`, `is_guest = FALSE`
    5. `INSERT order_items` (snapshots) + `UPDATE products SET quantity = quantity - n` for each item
    6. `COMMIT`
  - Returns `{ order_id, total_cents }`

- [x] `POST /api/orders/guest` — no auth required; same `placeOrderTransaction` helper with `userId = null, isGuest = true`

### Frontend

- [x] `CheckoutPage.jsx`
  - Fetches product list on mount to display current prices in the order summary
  - Delivery form: First Name, Last Name, Address, Phone (all required)
  - Payment method toggle: "Pay on Delivery" / "Pay by Card"
  - Card fields (shown only when card selected): number (auto-formatted groups of 4), name, expiry (MM/YY auto-formatted), CVV
  - `validateCard()` function — regex checks length, valid month, non-expired year, CVV digit count
  - Promo code input + Apply button: validates against `DIGISTORE24` client-side for UX; server re-validates for security
  - Order summary sidebar: live item list, subtotal, discount line (if promo applied), shipping (free), total
  - `placeOrder()` — calls the appropriate endpoint (`/orders` or `/orders/guest`); handles 409 (out of stock) with named products in error message
  - On success: client → navigate to `/history`; guest → `setOrderSuccess(true)` → show confirmation screen

- [x] `App.jsx` — `/checkout` route has `allowGuest` on `ProtectedRoute`

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| Overselling impossible | ✓ (`SELECT … FOR UPDATE` transaction) |
| Server-side pricing | ✓ (client prices never trusted) |
| Promo code server-validated | ✓ |
| Expired card rejected | ✓ (client-side `validateCard`, year/month check) |
| 409 error names the out-of-stock product | ✓ |
| Guest checkout works without auth | ✓ (`POST /api/orders/guest`) |
| Guest sees confirmation, not /history | ✓ (`orderSuccess` state) |
| Order items store price/name/weight snapshots | ✓ |
| Cart cleared after success | ✓ (`clearBag()`) |

---

## Notes

The `placeOrderTransaction` helper was extracted into a standalone function so both the authenticated and guest routes share identical business logic. This ensures no behavioural divergence between the two paths — the only difference is the `userId`/`isGuest` input values.
