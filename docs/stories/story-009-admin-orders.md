# Story 009 — Admin Orders Dashboard

**Epic:** 9 — Admin Orders Dashboard
**Status:** Done
**Points:** 3

---

## User Story

As an **admin**, I want a dedicated Orders tab in my navigation so that I can see every order (from registered clients and guests), instantly know when a new one arrives, view the full order detail, and know the total income from all orders.

---

## Background & Context

### Unread State: Server-side is_read

Early design considered using `localStorage` to track which orders the admin had seen (storing a count or a set of IDs). This was abandoned for two reasons:

1. **StrictMode double-invoke** — writing to localStorage in a `useEffect` would cause the second invocation to see the already-updated value, clearing "new" state before the admin ever sees it.
2. **Multi-session reliability** — if the admin logs in from a different browser, localStorage state is lost. Server-side `is_read` works correctly everywhere.

The `is_read` column on the `orders` table (same pattern as `contact_messages.is_read`) solved both issues. Opening an order runs `UPDATE orders SET is_read = TRUE WHERE id = $1` on the server — durable, authoritative, and shared across sessions.

### Guest Orders
Guest orders have `user_id = NULL` and `is_guest = TRUE`. The admin query uses `LEFT JOIN users` so guest orders appear in the list. The email column is `NULL` for guests; the frontend shows a "Guest" badge instead.

---

## Tasks

### Database

- [x] `ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE`
- [x] `ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL` — enables guest orders
- [x] `ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE`

### Backend

- [x] `GET /api/orders/admin/unread-count` — admin only; `COUNT(*) WHERE is_read = FALSE`; for navbar badge polling
- [x] `GET /api/orders/admin` — admin only; `LEFT JOIN users` (handles guest orders); includes `is_read`, `is_guest`, `user_email`; ordered by `created_at DESC`
- [x] `GET /api/orders/admin/:id` — admin only; `UPDATE orders SET is_read = TRUE WHERE id = $1 RETURNING …`; fetches `order_items`; fetches email via `LEFT JOIN`; returns full order including `is_guest`
- [x] Both named routes (`/admin/unread-count`) declared before parameterised route (`/admin/:id`) to avoid Express route conflict

### Frontend

- [x] `AdminOrdersPage.jsx`
  - Fetches `GET /api/orders/admin` on mount
  - Renders orders list using the same admin CSS classes as the Messages page (`msg-row`, `msg-dot`, `msg-unread`, etc.) for visual consistency
  - Unread orders: red `msg-dot` on left, `msg-unread` highlight
  - Guest orders: "Guest" badge in the email position; `msg-badge` styled inline
  - Promo badge on orders with a `promo_code`
  - Subtitle: total order count + total income (`SUM(total_cents)` computed client-side from the order list, formatted as dollars)
  - `openOrder(order)`:
    - Sets `selected` (for modal) + `detailLoading`
    - Fetches `GET /api/orders/admin/:id`
    - On success: sets `detail`; updates local `orders` state to set `is_read = true` immediately (removes dot without waiting for next poll)

- [x] `Navbar.jsx` — Orders badge polling
  - 60-second interval on `GET /api/orders/admin/unread-count`
  - Badge count set to 0 when `pathname === '/admin/orders'`

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| New orders show red dot | ✓ (`!order.is_read`) |
| Opening an order marks it read on the server | ✓ (`UPDATE is_read = TRUE`) |
| Red dot removed immediately on open | ✓ (local state update in `openOrder`) |
| Guest orders appear with "Guest" badge | ✓ (`LEFT JOIN`, `is_guest` check) |
| Total income displayed | ✓ (`reduce` over `total_cents`, formatted) |
| Navbar badge clears when page visited | ✓ (`pathname` effect) |
| Navbar badge polls every 60 seconds | ✓ (`setInterval`) |
| Promo badge visible on discounted orders | ✓ |
| Order detail modal shows items (snapshots) | ✓ |
| Route ordering: unread-count before :id | ✓ |
