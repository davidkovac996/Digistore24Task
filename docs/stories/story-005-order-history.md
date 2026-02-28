# Story 005 — Order History (Client)

**Epic:** 6 — Order History
**Status:** Done
**Points:** 2

---

## User Story

As a **registered client**, I want to see all my past orders and expand any one to see the full detail so that I can track my purchases.

---

## Background & Context

Order history is a read-only view for clients. It is scoped to the authenticated user (`WHERE user_id = $1`) — clients cannot see each other's orders. Guest orders do not appear here because guests have no `user_id`.

The key design point is that order items display **snapshots** (name, price, weight captured at purchase time), not live product data. This means even if the admin edits or deletes a product after the order was placed, the order history remains accurate and complete.

---

## Tasks

### Backend

- [x] `GET /api/orders/mine` — authenticated; returns all orders for `req.user.id`, newest first; no items in this response (list view)
- [x] `GET /api/orders/mine/:orderId` — authenticated; validates `user_id = req.user.id` (prevents accessing another user's order); returns order + all `order_items`

### Frontend

- [x] `HistoryPage.jsx`
  - Fetches `GET /api/orders/mine` on mount
  - Renders each order as a clickable row: date, customer name, payment method, total, Promo badge
  - Click → fetch `GET /api/orders/mine/:orderId` → open detail modal
  - Modal shows: items with quantity and per-item total (unit_price_cents_snapshot × quantity), subtotal, discount (if any), grand total, delivery address, phone, payment method label
  - Loading spinner while fetching order detail
  - Empty state when no orders exist

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| Client can only see their own orders | ✓ (`WHERE user_id = $1` with `req.user.id`) |
| Snapshots displayed (not live prices) | ✓ (`unit_price_cents_snapshot`, `product_name_snapshot`) |
| Promo discount shown if applied | ✓ |
| Detail loads on click (not pre-fetched) | ✓ (lazy fetch on expand) |
| Empty state shown when no orders | ✓ |
