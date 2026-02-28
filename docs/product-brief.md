# Product Brief — Bean & Brew

**Document type:** Product Brief
**Project:** Bean & Brew — Coffee Shop E-Commerce Web Application
**Version:** 1.0
**Date:** 2026-03-01

---

## 1. Executive Summary

Bean & Brew is a full-stack e-commerce web application for a specialty coffee shop. It enables customers to browse a curated coffee catalogue, manage a shopping cart, place orders online (or as a guest without an account), and communicate with the shop team. A dedicated admin panel gives the shop owner complete control over the product catalogue, incoming orders, and customer messages — all in one place.

---

## 2. Business Problem

Small specialty coffee shops typically rely on third-party platforms (Etsy, Shopify) for online sales, incurring transaction fees and losing control of the customer relationship. At the same time, customers have no direct channel to the shop — they resort to email or social media for support, which is difficult to track.

Bean & Brew solves both problems by providing:
- A self-hosted storefront the shop owns outright (no per-transaction fees).
- A built-in messaging system so customer enquiries are tracked alongside orders.
- A lightweight admin panel so non-technical staff can run daily operations.

---

## 3. Target Users

### 3.1 The Shop Owner / Admin

A small business owner or shop manager who needs to:
- Keep the product catalogue up to date (add, edit, delete items and stock levels).
- Know immediately when a new order arrives, without checking a third-party platform.
- Read and respond to customer messages in one place.
- Get a quick view of total revenue without running reports.

**Technical comfort level:** Moderate — comfortable with web browsers; not a developer.

### 3.2 Registered Customers (Clients)

Coffee enthusiasts who want to:
- Browse and order specialty coffees from home.
- Track their order history with full purchase details.
- Send questions and receive personalised replies from the shop team.
- Leave and manage a public review of their experience.

### 3.3 Guest Shoppers

First-time visitors or occasional buyers who want to make a purchase without the friction of creating an account. They should be able to:
- Browse the full catalogue.
- Add items to a cart that persists in their browser.
- Complete a checkout with just their delivery details — no registration required.

---

## 4. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Reduce time-to-purchase for new visitors | Guest checkout completes in < 3 minutes |
| Give admin full operational visibility | New orders flagged with unread badge within 60 seconds of placement |
| Keep admin workload low | All daily operations completable from three navbar tabs |
| Build customer trust | Reviews visible publicly; admin can moderate |
| Protect revenue | Zero overselling (atomic stock decrements) |

---

## 5. Scope

### In Scope (MVP)

- Public homepage with community reviews
- User registration and login (email + password)
- Guest browsing and checkout (no account required)
- Product catalogue with stock management
- Shopping cart persisted in browser storage
- Full checkout flow with promo code support
- Registered order history with itemised detail
- Contact form + admin reply system
- Admin product CRUD (create, read, update, delete)
- Admin orders dashboard (unread indicators, full detail, total income)
- Admin messages dashboard (unread indicators, reply/update)
- Real-time unread notification badges for admin (orders, messages) and clients (message replies)
- One review per client account; admin can delete any review

### Out of Scope (Future Phases)

- Payment gateway integration (Stripe / PayPal)
- Email notifications for order confirmation
- Product categories and search/filter
- Multi-admin / staff roles
- Customer loyalty points
- Mobile app

---

## 6. Constraints & Assumptions

| Constraint | Detail |
|---|---|
| Self-hosted | Runs on a single server or developer machine; no cloud infra dependency in MVP |
| No payment processor | Card details are validated client-side for UX realism but not transmitted to any processor |
| Single admin account | The seed script creates one admin; staff management is out of scope |
| English only | No i18n in MVP |
| Modern browser | Chrome, Firefox, Edge (last 2 versions); no IE support |

---

## 7. Key Business Rules

1. **Prices are in cents** — all monetary values stored and computed as integers to eliminate floating-point rounding errors. Display layer converts to dollars.
2. **Server-side pricing** — clients never dictate the price of an item; the backend recalculates all totals using DB-stored prices.
3. **Promo code** — `DIGISTORE24` (case-insensitive) gives a 10% discount, applied and validated server-side.
4. **Stock integrity** — stock is locked and decremented inside a database transaction. Concurrent orders for the last unit cannot both succeed.
5. **Order immutability** — each order item stores a snapshot of the product name, price, and weight at purchase time. Subsequent product edits or deletions never alter historical orders.
6. **One review per account** — a client may update their review, but cannot have more than one. Guests cannot review.
7. **Guest identity** — guest orders are stored with `is_guest = TRUE` and no `user_id`. Admins see a "Guest" label in place of an email address.
