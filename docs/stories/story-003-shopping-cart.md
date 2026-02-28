# Story 003 — Shopping Cart

**Epic:** 4 — Shopping Cart
**Status:** Done
**Points:** 2

---

## User Story

As a **client or guest**, I want to add products to a cart, adjust quantities, and remove items so that I can curate my order before checking out.

---

## Background & Context

The cart is a pure frontend concern — it requires no backend endpoint. The cart state (array of `{ productId, quantity }` objects) is stored in `localStorage` and managed by `BagContext`.

Persisting to `localStorage` means:
- The cart survives page refreshes and browser restarts.
- Guest carts persist across the browser session.
- Multiple tabs share cart state (via storage events in a future enhancement).

The cart does **not** validate stock on every interaction — stock is only validated server-side at the moment of checkout. The `+` button is capped at the current product's stock at the time the cart page is loaded, but this is a UX convenience, not a guarantee.

---

## Tasks

### Frontend

- [x] `BagContext.jsx`
  - State: `items` — array of `{ productId: string, quantity: number }`
  - Initialised from `localStorage.getItem('bag')` on mount
  - `addItem(productId)` — adds 1 unit; increments if already present
  - `updateQty(productId, qty)` — updates quantity; removes item if qty ≤ 0
  - `removeItem(productId)` — removes item entirely
  - `clearBag()` — empties the cart (called after successful checkout)
  - `bagCount` — derived total item count (sum of quantities) exposed for the navbar badge
  - All state changes are synced to `localStorage` immediately

- [x] `BagPage.jsx`
  - Fetches current product data from `GET /api/products` to display live price and stock
  - Renders each cart item with image, name, weight, per-item price, subtotal
  - `+` button capped at `product.quantity` (current stock); `−` button disabled at quantity 1
  - Remove (✕) button calls `removeItem`
  - Summary panel shows subtotal (shipping always free)
  - "Proceed to Checkout" navigates to `/checkout`
  - Empty cart shows an empty-state prompt

- [x] Navbar cart badge — reads `bagCount` from `BagContext`; shows as a coloured bubble on the 🛒 Cart link

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| Cart persists on page refresh | ✓ (localStorage) |
| Guest cart persists | ✓ (same localStorage mechanism) |
| `−` disabled at quantity 1 | ✓ |
| `+` capped at current stock | ✓ |
| Subtotal updates in real time | ✓ |
| Cart badge shows total item count | ✓ |
| `clearBag` called on successful checkout | ✓ |

---

## Notes

No backend interaction occurs at cart time. Stock is locked and decremented only at checkout in a DB transaction, which is the authoritative stock check. The frontend cap on `+` is a usability guard, not a security control.
