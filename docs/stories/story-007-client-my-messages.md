# Story 007 — Client: My Messages & Reply Notifications

**Epic:** 7 — Contact & Messaging
**Status:** Done
**Points:** 3

---

## User Story

As a **client**, I want to see all the messages I have sent to the shop and be notified when one has received a new reply so that I always know if the shop has answered me.

---

## Background & Context

### The Core Problem: "New" vs "Seen" Reply State

The server stores whether a message _has_ a reply, but not whether a particular user _has seen_ that reply. Adding a per-user-per-message seen table would be the server-authoritative approach, but it is heavier than needed for a single-client system. Instead, seen state is tracked in `localStorage` using a `seenReplyIds_{userId}` key containing a JSON array of message UUIDs that the client has personally opened.

The badge count is derived by diffing the server's `replied-ids` list against the local seen set.

### The StrictMode Problem

React 18 StrictMode invokes effects twice in development. If `localStorage.setItem` were called inside a `useEffect` (e.g. on fetch), the second invocation would read the already-updated storage and see all replies as "already seen" — making the unread indicator useless.

**Fix:** localStorage is written **only inside click handlers** (`openMessage`), never inside `useEffect`. Effects only read from localStorage.

---

## Tasks

### Backend

- [x] `GET /api/contact/mine` — returns the client's messages; used to populate the page
- [x] `GET /api/contact/mine/replied-ids` — returns UUIDs of messages that have a reply; polled by Navbar every 60 seconds for the badge

### Frontend

- [x] `MyMessagesPage.jsx`
  - Fetches `GET /api/contact/mine` on mount
  - Reads `seenReplyIds_{user.id}` from localStorage (read-only in useEffect)
  - Computes `newReplyIds` = replied messages whose IDs are not in the seen set
  - Renders message rows using admin CSS classes for visual consistency
  - Unread reply rows: `msg-unread` class + red `msg-dot` on left
  - Status badges: green "Replied" or amber "Awaiting reply"
  - `openMessage(msg)`:
    - Opens the modal showing original message and admin's reply
    - If the message is in `newReplyIds`: writes the ID to `seenReplyIds_{user.id}` in localStorage, removes from `newReplyIds` state
    - **localStorage write happens here (click handler), NOT in useEffect** — solves StrictMode double-invoke issue

- [x] `Navbar.jsx` — My Messages polling
  - `useEffect` on `user`: if `user.role === 'client'`, start 60-second polling of `GET /api/contact/mine/replied-ids`
  - `useEffect` on `[repliedIds, pathname, user]`: diff replied IDs against seen set → `setNewRepliesCount`
  - Badge clears automatically when `newRepliesCount` returns to 0 (user has opened all new replies)

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| Client sees only their own messages | ✓ (`WHERE email = req.user.email`) |
| New reply shows red dot on message row | ✓ |
| Navbar badge shows count of unseen replies | ✓ |
| Opening a replied message marks it as seen | ✓ (click handler writes localStorage) |
| Seen state persists across page refresh | ✓ (localStorage) |
| React StrictMode does not clear "new" state prematurely | ✓ (no localStorage write in useEffect) |
| Polling interval: 60 seconds | ✓ |

---

## Notes

The seen set is keyed by `user.id` (e.g. `seenReplyIds_abc-123-uuid`) so that different clients using the same browser do not share seen state.
