# Product Requirements Document — Bean & Brew

**Document type:** PRD
**Project:** Bean & Brew — Coffee Shop E-Commerce Web Application
**Version:** 1.0
**Date:** 2026-03-01
**Author:** David Kovač

---

## 1. Overview

This PRD translates the Product Brief into concrete, implementable requirements grouped into **Epics**. Each epic contains **User Stories** with **Acceptance Criteria** that define done.

---

## 2. User Roles

| Role | Description |
|------|-------------|
| `public` | Unauthenticated visitor (not in guest mode) |
| `guest` | Visitor who clicked "Continue as Guest" — can shop and checkout, cannot review or message |
| `client` | Registered and authenticated user with `role = 'client'` |
| `admin` | Authenticated user with `role = 'admin'` |

---

## Epic 1 — Authentication & Session Management

**Goal:** Users can register, log in, and stay logged in across browser sessions. Admins and clients are separated by role.

### Story 1.1 — Register

> As a **public visitor**, I want to create an account so that I can shop and track my orders.

**Acceptance Criteria:**
- Form accepts email and password (minimum 8 characters).
- Duplicate email returns a clear error message.
- Successful registration logs the user in immediately and redirects to the home page.
- New accounts are always created with `role = 'client'`.
- Password is stored as a bcrypt hash (12 rounds); plaintext is never persisted.

### Story 1.2 — Login

> As a **registered user**, I want to sign in with my email and password so that I can access my account.

**Acceptance Criteria:**
- Incorrect credentials show a single generic error ("Invalid email or password") to prevent user enumeration.
- Successful login issues a short-lived JWT access token (15 min) stored in memory only.
- A long-lived refresh token (7 days) is set in an `httpOnly`, `sameSite=strict` cookie.
- Admin users are redirected to `/admin` after login; clients are redirected to `/`.

### Story 1.3 — Persistent Session

> As a **logged-in user**, I want my session to persist when I refresh the browser so that I am not forced to log in repeatedly.

**Acceptance Criteria:**
- On app load, the frontend calls `POST /api/auth/refresh` using the refresh cookie.
- If valid, a new access token is returned and stored in memory.
- The refresh token is rotated on each use (old token deleted, new token issued).
- If the cookie is absent or expired, the user is treated as unauthenticated.

### Story 1.4 — Logout

> As a **logged-in user**, I want to sign out so that my session is fully terminated.

**Acceptance Criteria:**
- Clicking "Sign Out" calls `POST /api/auth/logout`.
- The refresh token is deleted from the database and the cookie is cleared.
- The in-memory access token is set to null.
- The user is redirected to the login page.

### Story 1.5 — Route Protection

> As the **system**, I need to ensure protected pages redirect unauthenticated users to login, and prevent clients from accessing admin pages.

**Acceptance Criteria:**
- Unauthenticated users visiting `/shop`, `/bag`, `/checkout`, `/history`, `/messages`, `/admin`, `/admin/orders`, `/admin/messages` are redirected to `/login`.
- A client visiting an admin route is redirected to `/shop`.
- An admin visiting a client route is redirected to `/admin`.
- Guest users can access `/shop`, `/bag`, and `/checkout` without being redirected.

---

## Epic 2 — Guest Mode

**Goal:** Allow first-time visitors to browse and purchase without creating an account.

### Story 2.1 — Enter Guest Mode

> As a **public visitor**, I want to browse the shop without creating an account so that I can make a purchase with minimal friction.

**Acceptance Criteria:**
- A "Continue as Guest" button is visible on the login page.
- Clicking it sets a guest flag in `sessionStorage` and navigates to the home page.
- Guest state survives page refresh within the same browser session.
- Entering a real login or register clears the guest flag.

### Story 2.2 — Guest Navigation

> As a **guest**, I want to see only the pages relevant to my shopping journey so the navbar is not confusing.

**Acceptance Criteria:**
- Guest navbar shows: Home, Shop, Cart (with item badge), "Guest" label, Sign In button, Register button.
- Contact, My Orders, My Messages links are not visible to guests.
- "Sign In" button clears guest mode and navigates to `/login`.

### Story 2.3 — Guest Checkout

> As a **guest**, I want to place an order by filling in my delivery details without registering so that I can buy quickly.

**Acceptance Criteria:**
- The checkout page is accessible to guests (`allowGuest` on the route).
- Guest orders are submitted to `POST /api/orders/guest` (no authentication required).
- Guest orders are stored with `user_id = NULL` and `is_guest = TRUE`.
- After a successful order, a confirmation screen is shown ("Order placed!") since guests have no order history page.
- All checkout validations (stock, pricing, promo code) apply equally to guest orders.

---

## Epic 3 — Product Catalogue

**Goal:** Clients and guests can browse products. Admins can manage the catalogue.

### Story 3.1 — Browse Products

> As a **client or guest**, I want to browse available coffee products so that I can choose what to buy.

**Acceptance Criteria:**
- All products are listed with name, weight (grams), price, and current stock level.
- Out-of-stock products are clearly marked and the "Add to Cart" button is disabled for them.
- Product list is publicly accessible (no auth required to fetch).

### Story 3.2 — Admin: Add Product

> As an **admin**, I want to add new products to the catalogue so that customers can buy them.

**Acceptance Criteria:**
- Form requires: name, price (dollars), weight (grams), stock quantity, image URL.
- Price is stored as an integer in cents (e.g. `$14.99` → `1499`).
- Product is immediately visible to shoppers after saving.

### Story 3.3 — Admin: Edit Product

> As an **admin**, I want to update product details and stock so that the catalogue stays accurate.

**Acceptance Criteria:**
- All fields (name, price, weight, stock, image URL) are editable.
- Changes are reflected immediately in the shop.
- Existing orders are not affected by price or name changes (snapshots).

### Story 3.4 — Admin: Delete Product

> As an **admin**, I want to remove a discontinued product so that customers cannot order it.

**Acceptance Criteria:**
- A confirmation prompt is shown before deletion.
- After deletion the product no longer appears in the shop.
- Past orders that included the product still display correctly using stored snapshots.

---

## Epic 4 — Shopping Cart

**Goal:** Clients and guests can build an order before committing to checkout.

### Story 4.1 — Add to Cart

> As a **client or guest**, I want to add a product to my cart so that I can buy multiple items at once.

**Acceptance Criteria:**
- Clicking "Add to Cart" adds one unit of the product to the cart.
- The cart badge in the navbar increments immediately.
- Cart state is persisted to `localStorage` so it survives page refresh.

### Story 4.2 — Manage Cart

> As a **client or guest**, I want to adjust quantities and remove items from my cart so that I can finalise my selection before checkout.

**Acceptance Criteria:**
- Quantity `+` and `−` buttons adjust the item quantity.
- The `−` button is disabled when quantity is 1 (cannot go below 1; use remove button instead).
- The `+` button is disabled when quantity equals the product's current stock.
- A remove (✕) button removes the item entirely from the cart.
- The subtotal updates in real time as quantities change.
- An empty cart shows an empty-state prompt to go shopping.

---

## Epic 5 — Checkout

**Goal:** Clients and guests can complete a purchase, with all business rules enforced server-side.

### Story 5.1 — Delivery Form

> As a **shopper**, I want to enter my delivery details so that the shop knows where to send my order.

**Acceptance Criteria:**
- Required fields: First Name, Last Name, Delivery Address, Phone Number.
- All fields must be non-empty to proceed. A clear validation error is shown otherwise.

### Story 5.2 — Payment Method

> As a **shopper**, I want to choose how I pay — on delivery or by card.

**Acceptance Criteria:**
- Two options: "Pay on Delivery" and "Pay by Card".
- Selecting "Pay by Card" reveals card input fields: number (auto-formatted in groups of 4), name, expiry (MM/YY), CVV.
- Card details are validated client-side: card number length, valid month, non-expired date, CVV length.
- Card details are never stored or transmitted to a payment processor.

### Story 5.3 — Promo Code

> As a **shopper**, I want to apply a promo code to get a discount so that I pay less.

**Acceptance Criteria:**
- An input accepts a promo code and an "Apply" button validates it.
- The code `DIGISTORE24` (case-insensitive) is valid and grants a 10% discount.
- The discount is shown as a line item in the order summary before placing the order.
- The applied state is locked (input disabled, button shows ✓ Applied) once valid.
- The promo code is re-validated on the server; a client cannot forge a discount.

### Story 5.4 — Checkout Product Recommendation

> As a **shopper**, I want to see a suggestion for a coffee I have not yet added to my cart so that I can discover products I might enjoy and complete a better order.

**Acceptance Criteria:**
- When the checkout page loads, a recommendation banner is displayed above the order form if at least one in-stock product is not already in the cart.
- The banner shows the product image, name, weight, price, and a short motivational message.
- A single **+ Add to Bag** button adds one unit of the suggested product to the cart immediately, respecting the stock limit.
- Once added, the banner disappears (the product is now in the cart). If another eligible product exists, it becomes the new suggestion.
- If all in-stock products are already in the cart, no banner is shown.
- The recommendation is computed client-side from the already-fetched product list — no extra API call is required.

### Story 5.5 — Place Order

> As a **shopper**, I want to confirm my order so that the shop prepares and ships it to me.

**Acceptance Criteria:**
- Clicking "Place Order" submits to `POST /api/orders` (client) or `POST /api/orders/guest` (guest).
- The server validates stock in an atomic transaction; overselling is impossible.
- If an item is out of stock the order is rejected with a clear message naming the affected product.
- All prices and totals are calculated on the server; client-submitted amounts are ignored.
- Stock is decremented on success.
- Registered clients are redirected to `/history` after success.
- Guests see an on-page confirmation screen.

---

## Epic 6 — Order History (Client)

**Goal:** Registered clients can review all their past purchases.

### Story 6.1 — Order List

> As a **client**, I want to see a list of my past orders so that I can track what I have bought.

**Acceptance Criteria:**
- Orders are shown most-recent first.
- Each row shows: date, customer name, payment method, total, and a Promo badge if a discount was applied.

### Story 6.2 — Order Detail

> As a **client**, I want to expand an order to see exactly what I bought and how much I paid.

**Acceptance Criteria:**
- Clicking an order row opens a modal with all items, quantities, and per-item prices (snapshots).
- Subtotal, discount (if any), and grand total are displayed.
- Delivery address, phone, and payment method are shown.

---

## Epic 7 — Contact & Messaging

**Goal:** Clients (and the general public) can contact the shop; admins can reply; clients see replies.

### Story 7.1 — Submit Contact Message

> As a **public visitor or client**, I want to send a message to the shop team so that I can ask questions or give feedback.

**Acceptance Criteria:**
- Form requires: Name, Email, Subject, Message (min 10 characters).
- For logged-in clients, Name and Email are pre-filled.
- A success confirmation is shown after submission without navigating away.
- The form is not shown in the admin navbar or guest navbar.

### Story 7.2 — Admin: View and Reply to Messages

> As an **admin**, I want to read customer messages and send replies so that customers feel heard and get answers.

**Acceptance Criteria:**
- The Messages tab lists all messages with sender, subject, date, and Replied badge.
- Unread messages are highlighted with a red dot and bold styling.
- Opening a message marks it as read (no further unread indicator for that message).
- A text area allows typing a reply. Clicking "Save Reply" stores and makes it visible to the client.
- An existing reply can be updated ("Update Reply").
- The Messages navbar link shows a badge with the count of unread messages, polled every 60 seconds.
- The badge count clears to zero when the admin visits the Messages page.

### Story 7.3 — Client: View Replies

> As a **client**, I want to see whether the shop has replied to my messages so that I get answers.

**Acceptance Criteria:**
- My Messages page lists all messages the client has sent, with status badges (Replied / Awaiting reply).
- Messages with a new (unseen) reply are highlighted with a red dot.
- The My Messages navbar link shows a numeric badge for unseen replies, polled every 60 seconds.
- Clicking a message opens a modal showing the original message and the admin's reply.
- Opening a message with a new reply marks it as seen (clears the dot; badge count decrements).
- Seen state is stored in `localStorage` keyed by user ID to survive page refresh.

---

## Epic 8 — Product Reviews

**Goal:** Clients can leave one public review; admins can moderate them.

### Story 8.1 — Submit / Edit Review

> As a **client**, I want to leave a star rating and written review so that others can learn from my experience.

**Acceptance Criteria:**
- The review form is on the home page, below the community reviews section.
- Fields: star rating (1–5, interactive), review body (10–500 characters with live character count).
- A client may only have one review; submitting again shows an edit form instead.
- The review appears immediately in the community reviews list after submission.
- Guests and admins do not see the review form.

### Story 8.2 — Admin: Delete Review

> As an **admin**, I want to remove inappropriate reviews so that the public reviews section stays trustworthy.

**Acceptance Criteria:**
- A delete icon is visible on each review card for admin accounts only.
- Clicking shows an inline confirmation prompt ("Sure?").
- Confirmed deletion removes the review immediately.

---

## Epic 9 — Admin Orders Dashboard

**Goal:** Admins can see all orders, identify new ones, and view full order details.

### Story 9.1 — Orders List

> As an **admin**, I want to see all orders from all customers (and guests) so that I can manage fulfilment.

**Acceptance Criteria:**
- All orders listed most-recent first with: customer name, email (or "Guest" label), payment method, total, date.
- Unread orders (not yet opened) are highlighted with a red dot.
- A Promo badge is shown on orders where a discount code was used.
- The page subtitle shows the total number of orders and cumulative income across all orders.
- The Orders navbar link shows a numeric badge for unread orders, polled every 60 seconds.
- The badge clears when the admin visits the Orders page.

### Story 9.2 — Order Detail

> As an **admin**, I want to open an order and see everything about it so that I can prepare and fulfil it.

**Acceptance Criteria:**
- Clicking an order row opens a detail modal showing: all items with quantities and prices (snapshots), subtotal, discount, total, delivery address, phone, payment method, and the customer's email or "Guest".
- Opening an order marks it as read on the server (`is_read = TRUE`), removing the red dot immediately.

---

## 3. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | Passwords hashed with bcrypt (12 rounds). Access tokens in memory only (never localStorage). Refresh tokens in httpOnly, sameSite=strict cookies. All admin routes require `role = 'admin'` server-side check. |
| Data integrity | All prices stored as integers (cents). Checkout uses DB-level `FOR UPDATE` row locking to prevent overselling. Order items store price/name/weight snapshots. |
| Performance | Notification badge polling interval: 60 seconds (sufficient for a small shop). No real-time WebSocket requirement in MVP. |
| Reliability | Checkout is wrapped in a Postgres transaction with explicit ROLLBACK on failure. |
| Browser support | Chrome, Firefox, Edge — last 2 major versions. No IE. |
| Accessibility | Semantic HTML, keyboard-navigable forms, visible focus states. |
