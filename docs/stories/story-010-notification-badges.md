# Story 010 — Real-Time Notification Badges

**Epic:** Cross-cutting
**Status:** Done
**Points:** 2

---

## User Story

As an **admin**, I want to see a badge count on the Orders and Messages navbar links so I immediately know when new orders or messages arrive, without refreshing the page. As a **client**, I want a badge on My Messages so I know when the shop has replied to me.

---

## Background & Context

True real-time push (WebSockets, SSE) is out of scope for this MVP. Instead, the Navbar polls lightweight count endpoints every 60 seconds. 60 seconds is an acceptable lag for a small shop where the admin is likely already looking at the screen.

### Badge Clearing Strategy

| Badge | Cleared how |
|---|---|
| Admin: Messages | `useEffect` on `pathname === '/admin/messages'` sets count to 0 |
| Admin: Orders | `useEffect` on `pathname === '/admin/orders'` sets count to 0 |
| Client: Replies | Recomputed from `repliedIds` vs localStorage seen set; naturally drops to 0 as messages are opened |

Clearing is done locally (set to 0 in state) and confirmed by the next poll interval. This avoids a race where the user quickly navigates away before the poll fires.

### Why Not Global State / Redux?

All badge state lives in `Navbar.jsx` because it is the only consumer. Lifting it to a context or Redux store would add complexity with no benefit. If a second consumer ever appeared, extraction would be straightforward.

---

## Tasks

### Backend (already covered in Stories 006 and 009)

- [x] `GET /api/contact/admin/unread-count` → `{ unread: number }`
- [x] `GET /api/orders/admin/unread-count` → `{ count: number }`
- [x] `GET /api/contact/mine/replied-ids` → `{ ids: string[] }` (for client badge)

### Frontend

- [x] `Navbar.jsx` — all badge logic centralised here

  **Admin — unread messages:**
  ```
  useEffect([user]) → if admin: fetchUnread() + setInterval(fetchUnread, 60_000)
  useEffect([pathname]) → if /admin/messages: setUnreadMessages(0)
  ```

  **Admin — unread orders:**
  ```
  useEffect([user]) → if admin: fetchOrderCount() + setInterval(fetchOrderCount, 60_000)
  useEffect([pathname]) → if /admin/orders: setNewOrdersCount(0)
  ```

  **Client — unseen replies:**
  ```
  useEffect([user]) → if client: fetchReplied() + setInterval(fetchReplied, 60_000)
  useEffect([repliedIds, pathname, user]) → diff replied IDs vs localStorage seen set → setNewRepliesCount
  ```

- [x] Badge UI — `<span className="bag-badge">{count}</span>` inside the `<Link>` element; styled with the same pill badge used on the cart

- [x] `Navbar.css` — `.nav-messages { display: flex; align-items: center; gap: 0.4rem; }` so the badge sits inline with the link text

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| Admin messages badge shows unread count | ✓ |
| Admin orders badge shows unread count | ✓ |
| Client replies badge shows unseen count | ✓ |
| Polling interval: 60 seconds | ✓ |
| Intervals cleaned up on unmount / user change | ✓ (`return () => clearInterval(interval)`) |
| Badges clear when the relevant page is visited | ✓ |
| No badge for guest or unauthenticated user | ✓ (guards on `user.role`) |
