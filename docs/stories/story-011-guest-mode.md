# Story 011 — Guest Mode

**Epic:** 2 — Guest Mode
**Status:** Done
**Points:** 3

---

## User Story

As a **first-time visitor**, I want to browse the shop and place an order without creating an account so that I can buy quickly without friction.

---

## Background & Context

### What "Guest" Means

Guest mode is a frontend concept layered on top of the existing auth system. A guest:
- Has **no server-side session** — no JWT, no cookie, no `user_id`.
- Is tracked by a `isGuest = true` flag stored in `sessionStorage` (survives refresh within the same browser session; cleared when the tab is closed).
- Can access `/shop`, `/bag`, and `/checkout` via `allowGuest` on `ProtectedRoute`.

### Guest Order Persistence

Guest orders are stored in the database with `user_id = NULL` and `is_guest = TRUE`. They are fully visible to the admin in the Orders tab, labelled "Guest" instead of an email address. This required:
- Making `orders.user_id` nullable: `ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL`
- Adding `orders.is_guest BOOLEAN NOT NULL DEFAULT FALSE`

### What Guests Cannot Do

| Feature | Guest | Reason |
|---|---|---|
| Leave a review | No | Reviews require an account to enforce one-per-user |
| View order history | No | No `user_id` to filter by |
| Send contact messages | No | Contact tab hidden in guest navbar |
| View My Messages | No | No account to match by email |

---

## Tasks

### Database

- [x] `ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL`
- [x] `ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE`

### Backend

- [x] `POST /api/orders/guest` — no `authenticate` middleware; same `placeOrderTransaction` helper with `userId = null, isGuest = true`; all validations (stock, pricing, promo) identical to authenticated checkout
- [x] `GET /api/orders/admin` — changed `JOIN users` to `LEFT JOIN users` so guest orders (no `user_id`) appear in the list; includes `is_guest` field
- [x] `GET /api/orders/admin/:id` — same `LEFT JOIN` change; includes `is_guest` in response

### Frontend

- [x] `AuthContext.jsx`
  - Added `isGuest` state initialised from `sessionStorage.getItem('isGuest') === 'true'`
  - `enterAsGuest()` — sets `sessionStorage` flag + state
  - `exitGuest()` — clears `sessionStorage` flag + state
  - `login()` and `register()` call `exitGuest()` before proceeding (entering a real account always clears guest mode)
  - Context value extended with `{ isGuest, enterAsGuest, exitGuest }`

- [x] `LoginPage.jsx`
  - "or" divider (`.auth-divider` — CSS rule added to `Auth.css`)
  - "Continue as Guest" button → calls `enterAsGuest()` + `navigate('/')`

- [x] `Auth.css`
  - `.auth-divider` with `::before` / `::after` flex lines — visual "or" separator

- [x] `ProtectedRoute.jsx`
  - Added `allowGuest` prop
  - If `allowGuest && isGuest` → render children (bypass auth check)

- [x] `App.jsx`
  - `/shop`, `/bag`, `/checkout` routes: `<ProtectedRoute role="client" allowGuest>`

- [x] `Navbar.jsx`
  - Imports `isGuest`, `exitGuest` from `useAuth()`
  - Contact link: hidden when `isGuest`
  - Guest section (shown when `isGuest`): Shop link, Cart link (with badge), nav-user div with "Guest" label, Sign In button (calls `exitGuest()` + navigate to `/login`), Register link (calls `exitGuest()`)
  - Login/Register section: shown only when `!user && !isGuest`

- [x] `CheckoutPage.jsx`
  - Imports `isGuest` from `useAuth()`
  - `placeOrder()` uses `/orders/guest` endpoint when `isGuest`
  - After success: if guest → `setOrderSuccess(true)` (show confirmation screen); if client → `navigate('/history')`
  - `orderSuccess` renders a "✅ Order placed!" empty-state card with "Continue Shopping" button

- [x] `HomePage.jsx`
  - `isGuest` imported from `useAuth()`
  - `handleShopNow()` — navigates guests to `/shop` (previously only authenticated users were sent to `/shop`)
  - Review form: existing `!user` check already shows "Log in to leave a review" for guests (no extra condition needed)

- [x] `AdminOrdersPage.jsx`
  - Order row: `order.is_guest ? <span class="msg-badge">Guest</span> : <span class="msg-email">{order.user_email}</span>`
  - Modal header: `selected.is_guest ? 'Guest' : selected.user_email`

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| "Continue as Guest" on login page | ✓ |
| Guest lands on home page | ✓ (`navigate('/')`) |
| Guest can access shop, bag, checkout | ✓ (`allowGuest`) |
| Guest cannot access contact, history, messages | ✓ (not in guest navbar; routes require auth) |
| Guest checkout works without JWT | ✓ (`POST /api/orders/guest`) |
| Guest order labelled "Guest" in admin | ✓ (`is_guest` check in AdminOrdersPage) |
| Guest state cleared on real login/register | ✓ (`exitGuest` called in AuthContext) |
| Guest state survives page refresh | ✓ (`sessionStorage`) |
| Guest cannot leave a review | ✓ (review form hidden when `!user`) |
