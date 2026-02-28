# Story 006 — Contact Form & Admin Messaging

**Epic:** 7 — Contact & Messaging
**Status:** Done
**Points:** 3

---

## User Story

As a **public visitor or client**, I want to send a message to the shop. As an **admin**, I want to read every message and write a reply that the customer can see.

---

## Background & Context

The contact system is a simple one-way messaging channel with an admin reply feature. There is no threading — each `contact_messages` row has a single `reply` text field and `replied_at` timestamp.

Messages are matched to registered users by **email address** (not `user_id`). This means:
- Public visitors can send messages using any email.
- Logged-in clients see their messages on the My Messages page if the email they used matches their account email.
- This allows pre-login enquiries to appear in a client's history after they register with the same email.

The admin Messages tab is a **separate page** (`/admin/messages`) — it is not a tab inside the Inventory page. This keeps the admin navbar clean and predictable.

---

## Tasks

### Backend

- [x] `POST /api/contact` — public; validate name, email (valid format), subject, body (min 10 chars); insert into `contact_messages`
- [x] `GET /api/contact/mine` — authenticated client; returns messages `WHERE email = req.user.email` ordered newest first
- [x] `GET /api/contact/mine/replied-ids` — authenticated client; returns UUIDs of messages that have a non-null reply; used for navbar badge polling (declared before `/mine/:id` to avoid route conflict)
- [x] `GET /api/contact/admin` — admin only; returns all messages with `is_read`, `reply`, `replied_at`
- [x] `GET /api/contact/admin/unread-count` — admin only; `COUNT(*) WHERE is_read = FALSE`; for navbar badge
- [x] `GET /api/contact/admin/:id` — admin only; `UPDATE … SET is_read = TRUE … RETURNING *` atomically marks read and returns full message
- [x] `PUT /api/contact/admin/:id/reply` — admin only; validate non-empty reply; `UPDATE SET reply = $1, replied_at = NOW(), is_read = TRUE`

### Frontend

- [x] `ContactPage.jsx`
  - Form fields: Name, Email, Subject, Message
  - Pre-fill Name and Email for authenticated clients
  - Submit → `POST /api/contact`; show success banner without navigating away
  - Not shown in the admin navbar or guest navbar

- [x] `AdminMessagesPage.jsx`
  - Fetches `GET /api/contact/admin` on mount
  - Message list using admin CSS classes: `msg-row`, `msg-dot-wrap`, `msg-dot`, `msg-from`, `msg-name`, `msg-email`, `msg-meta`, `msg-badge`
  - Unread rows: `msg-unread` class + red `msg-dot` on left
  - Subtitle: total count + unread count
  - Click row → fetch `GET /api/contact/admin/:id` (marks read, removes dot from local state) → open modal
  - Modal: full message body + reply textarea
  - "Save Reply" / "Update Reply" calls `PUT /api/contact/admin/:id/reply`; updates local state
  - "Replied" green badge shown on rows that have a reply

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| Public contact form works without login | ✓ |
| Logged-in client's name/email pre-filled | ✓ |
| Admin sees all messages | ✓ |
| Opening message marks it as read atomically | ✓ (`UPDATE … RETURNING`) |
| Unread messages have red dot | ✓ |
| Admin can save and update replies | ✓ |
| Replied messages show green badge | ✓ |
| Contact tab not shown to admin or guest | ✓ |

---

## Notes

Route ordering is critical in `contact.js`. The route `/mine/replied-ids` must be declared **before** any `/mine/:id` route, and `/admin/unread-count` must be declared **before** `/admin/:id`, otherwise Express would treat the literal path segment (`replied-ids`, `unread-count`) as a parameter value.
