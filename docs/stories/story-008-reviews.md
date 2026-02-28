# Story 008 — Product Reviews

**Epic:** 8 — Product Reviews
**Status:** Done
**Points:** 2

---

## User Story

As a **client**, I want to leave a star rating and written review on the home page so that other customers can learn from my experience. As an **admin**, I want to remove inappropriate reviews.

---

## Background & Context

Reviews are displayed publicly on the home page in a "Community Reviews" section. They are intentionally simple — one review per account, with a rating and free-text body. The `reviews` table has a `UNIQUE` constraint on `user_id`, enforced at the database level, preventing duplicates even if the API were called directly.

Guests and admins do not see the review form. Admins see a delete control on each review card.

---

## Tasks

### Backend

- [x] `GET /api/reviews` — public; return all reviews with `email` (for display name generation) and `rating`, `body`, `created_at`, `updated_at`
- [x] `POST /api/reviews` — client only; validate rating (1–5) and body (10–500 chars); `INSERT … ON CONFLICT (user_id) DO UPDATE` (upsert — handles concurrent double-submit edge case); return saved review
- [x] `DELETE /api/reviews/:id` — admin only; delete by review UUID; return 204

### Frontend

- [x] `HomePage.jsx` — review section
  - `reviewerName(email)` — derives a display name from email (e.g. `jane@example.com` → `"jane"`)
  - Fetch `GET /api/reviews` on mount; also find the current user's review (`mine = reviews.find(rv => rv.email === user.email)`)
  - **Community reviews list:** maps over all reviews, shows avatar initial, display name, formatted date, star rating, body
  - **Admin delete icon:** shown only when `user.role === 'admin'`; click shows "Sure?" inline confirmation; confirmed → `DELETE /api/reviews/:id` → remove from local state
  - **Review zone (clients only):**
    - No review yet: show the submission form (stars + textarea)
    - Has review, not editing: show "Your Review" card with Edit button
    - Editing: show form pre-filled with existing values
  - `submitReview()` — `POST /api/reviews`; on success update both `reviews` list and `myReview` state
  - Form hidden for: guests (`isGuest = true`), admins (`user.role === 'admin'`), unauthenticated users (show "Log in to leave a review" prompt instead)
  - Interactive star component: hover + click to set rating

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| One review per account (DB unique constraint) | ✓ |
| Guest cannot see review form | ✓ (`isGuest` check) |
| Admin cannot see review form | ✓ (`user.role === 'admin'` check) |
| Unauthenticated sees "Log in" prompt | ✓ |
| Review appears immediately after submit | ✓ (local state update) |
| Edit updates the existing review | ✓ (upsert on server) |
| Admin delete shows confirmation | ✓ |
| Deleted review removed immediately | ✓ (filter from local state) |
