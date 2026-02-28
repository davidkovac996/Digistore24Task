# Story 002 — Product Catalogue & Admin Inventory CRUD

**Epic:** 3 — Product Catalogue
**Status:** Done
**Points:** 3

---

## User Story

As an **admin**, I want to create, update, and delete products so that the catalogue reflects what is actually available. As a **client or guest**, I want to browse products so that I can choose what to buy.

---

## Background & Context

Products are the core entity of the storefront. The admin needs full CRUD control. The product list must be publicly readable (no auth required) so guests can browse without logging in.

Prices are stored in **cents** (integers) to avoid floating-point arithmetic. The UI presents them divided by 100 with two decimal places.

Stock levels are colour-coded in the admin view (green / amber / red) to give instant visual feedback.

---

## Tasks

### Backend

- [x] `GET /api/products` — public; return all products ordered by `created_at DESC`
- [x] `GET /api/products/:id` — public; return one product by UUID
- [x] `POST /api/products/admin` — admin only; validate name, price_cents > 0, weight_grams > 0, quantity ≥ 0, image_url; insert and return new product
- [x] `PUT /api/products/admin/:id` — admin only; update any combination of fields; return updated product
- [x] `DELETE /api/products/admin/:id` — admin only; delete product; return 204

### Frontend

- [x] `ShopPage.jsx` — fetch all products; render cards with name, weight, price, stock; disable "Add to Cart" for quantity = 0
- [x] `AdminPage.jsx` (Inventory tab)
  - Table view with image thumbnail, name, weight, price (formatted from cents), stock level (colour-coded)
  - "+ Add Product" opens an inline form
  - "Edit" populates the form with existing values
  - "Delete" triggers an inline confirmation prompt
  - All mutations call the admin API routes and update local state on success

---

## Acceptance Criteria Verification

| Criterion | Result |
|---|---|
| Products visible without login | ✓ (no auth on GET /api/products) |
| Out-of-stock products cannot be added to cart | ✓ (button disabled) |
| Stock colour-coding in admin | ✓ (green ≥ 5, amber 1–4, red = 0) |
| Price stored as cents, displayed as dollars | ✓ |
| Editing price does not change existing orders | ✓ (order items use snapshots) |
| Delete requires confirmation | ✓ |
| Deleted product does not break order history | ✓ (`product_id` in `order_items` uses `ON DELETE SET NULL`) |
