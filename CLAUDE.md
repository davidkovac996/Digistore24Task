# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bean & Brew** (a.k.a. Brewed & True) is a full-stack coffee shop e-commerce app: React/Vite frontend + Node.js/Express backend + PostgreSQL.

- Frontend: http://localhost:5173 (Vite dev server, proxies `/api` → backend)
- Backend API: http://localhost:4000
- Database: PostgreSQL, database name `brewedtrue`

## Development Commands

### Backend (from `backend/`)
```bash
npm install          # Install dependencies
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start without auto-reload
npm run seed         # Create schema + seed admin user and sample products
```

### Frontend (from `frontend/`)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build → frontend/dist/
npm run preview      # Preview production build locally
```

### Backend environment setup
```bash
cd backend
copy .env.example .env   # Windows
# Then edit .env and set DATABASE_URL with your PostgreSQL password
```

Required `.env` variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT` (4000), `NODE_ENV`, `FRONTEND_URL`.

### Database setup (manual)
```bash
psql -U postgres -c "CREATE DATABASE brewedtrue;"
cd backend && npm run seed
```

The seed script runs `schema.sql` automatically before inserting data.

## Architecture

### Authentication Flow
- **Access tokens** (15 min JWT): stored in `window.__accessToken` (in-memory only, never localStorage).
- **Refresh tokens** (7 days): stored in an httpOnly cookie and in the `refresh_tokens` DB table.
- On app load, `AuthContext` calls `POST /api/auth/refresh` to restore session from the cookie.
- `frontend/src/api.js` is a shared Axios instance that attaches the access token and auto-retries on 401 by calling the refresh endpoint.
- Backend middleware: `authenticate` verifies the Bearer token; `requireAdmin` checks `req.user.role === 'admin'`.

### Data Integrity Patterns
- **Prices in cents** (integers) throughout DB and API — never floating point.
- **Order snapshots**: `order_items` stores `product_name_snapshot`, `unit_price_cents_snapshot`, `weight_grams_snapshot` so order history is immutable even if products change.
- **Atomic checkout**: stock is locked and decremented in a single DB transaction to prevent overselling.
- **Server-side pricing**: all totals are calculated on the backend; client prices are never trusted.
- **Promo code**: `DIGISTORE24` (case-insensitive) = 10% discount, applied server-side at checkout.

### Frontend State
- `AuthContext` (`src/context/AuthContext.jsx`): current user, login/logout/register.
- `BagContext` (`src/context/BagContext.jsx`): shopping cart, persisted to `localStorage`.
- `ProtectedRoute` wraps routes that require auth or a specific role (`client`/`admin`).

### Vite Proxy
All frontend requests to `/api/*` are proxied to `http://localhost:4000` via `vite.config.js`. In production, configure a reverse proxy (e.g., nginx) instead.

### Backend Module System
Backend uses **CommonJS** (`require`/`module.exports`). Frontend uses **ES Modules** (`import`/`export`).
