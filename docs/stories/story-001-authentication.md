# Story 001 — User Authentication & Session Management

**Epic:** 1 — Authentication & Session Management
**Status:** Done
**Points:** 5

---

## User Story

As a **visitor**, I want to register, log in, and have my session persist across page refreshes so that I do not have to sign in repeatedly.

---

## Background & Context

The application has two protected user roles (`client`, `admin`). Auth must be secure — no tokens in `localStorage`, no long-lived access tokens — while still being frictionless (session survives a browser refresh via a cookie).

### Chosen Approach
- **Access token** (JWT, 15 min) — stored in `window.__accessToken` (in-memory). Never in `localStorage` or a readable cookie. Eliminated as soon as the page unloads.
- **Refresh token** (JWT, 7 days) — stored in a DB table and in an `httpOnly`, `sameSite=strict` cookie. Rotated on every use.
- On app load, `AuthContext` fires `POST /api/auth/refresh`. If the cookie is valid, a new access token is issued silently. This restores the session without storing anything sensitive.

---

## Tasks

### Backend

- [x] `POST /api/auth/register`
  - Validate email format, password ≥ 8 chars
  - Check for duplicate email (409 if exists)
  - bcrypt hash password at 12 rounds
  - Insert user with `role = 'client'`
  - Generate access + refresh tokens
  - Store refresh token in `refresh_tokens` table
  - Set `httpOnly` refresh cookie; return `{ user, accessToken }`

- [x] `POST /api/auth/login`
  - Validate credentials
  - Return generic error for wrong email OR wrong password (prevent enumeration)
  - Clean up expired tokens for the user on each login
  - Issue new access + refresh tokens; rotate cookie

- [x] `POST /api/auth/refresh`
  - Read refresh token from cookie
  - Verify JWT signature and check against DB (not just signature)
  - Delete old token, insert new token (rotation)
  - Return new access token

- [x] `POST /api/auth/logout`
  - Delete refresh token from DB
  - Clear refresh cookie
  - Return 200

- [x] `GET /api/auth/me`
  - Requires `authenticate` middleware
  - Return `{ id, email, role, created_at }`

- [x] `authenticate` middleware (`middleware/auth.js`)
  - Extract token from `Authorization: Bearer` header (fallback: cookie)
  - Verify JWT, attach `req.user = { id, email, role }`

- [x] `requireAdmin` middleware
  - Check `req.user.role === 'admin'`, return 403 otherwise

### Frontend

- [x] `AuthContext.jsx`
  - State: `user` (undefined while loading, null when unauthenticated, object when authed), `loading`, `isGuest`
  - On mount: call `POST /api/auth/refresh` → `GET /api/auth/me` to restore session
  - Expose: `login`, `register`, `logout`, `enterAsGuest`, `exitGuest`
  - `login` and `register` clear guest mode before proceeding

- [x] `api.js` (Axios instance)
  - Attach `Authorization: Bearer <window.__accessToken>` to every request
  - On 401: call refresh endpoint once, retry original request
  - On second 401: clear user state

- [x] `LoginPage.jsx` — email + password form; redirect admin → `/admin`, client → `/`
- [x] `RegisterPage.jsx` — email + password form; redirect to `/` on success
- [x] `ProtectedRoute.jsx` — redirect unauthenticated to `/login`; wrong-role redirect; `allowGuest` prop

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| Wrong password shows generic error | ✓ |
| Access token never in localStorage | ✓ (`window.__accessToken`) |
| Refresh cookie is httpOnly | ✓ |
| Session survives browser refresh | ✓ (refresh on mount) |
| Refresh token rotated on each use | ✓ (DELETE old, INSERT new) |
| Admin redirected to `/admin` on login | ✓ |
| bcrypt 12 rounds | ✓ |

---

## Notes

- `refresh_token` cookie path is scoped to `/api/auth` so it is not sent on every request — only on auth calls.
- The `loading` state prevents protected routes from briefly flashing a redirect before the refresh call completes.
