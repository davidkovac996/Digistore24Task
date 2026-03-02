# Bean & Brew — Coffee Shop Web Application

A full-stack coffee shop e-commerce application with a React frontend, Node.js/Express backend, and PostgreSQL database.

---

## Quick Start

Double-click **`setup.cmd`** and follow the prompts.
Press **Enter** at the password prompt to use the default (`postgres`), or enter your existing PostgreSQL password.

The app will open automatically at **http://localhost:5173**

---

## Project Structure

```
Digistore24Task/
├── backend/                          # Node.js + Express API
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js              # PostgreSQL connection pool
│   │   │   ├── schema.sql            # Database schema + migrations
│   │   │   └── seed.js               # Seeds admin user + sample products
│   │   ├── middleware/
│   │   │   └── auth.js               # authenticate + requireAdmin middleware
│   │   ├── routes/
│   │   │   ├── auth.js               # Register, login, logout, refresh, /me
│   │   │   ├── products.js           # Public product list + admin CRUD
│   │   │   ├── orders.js             # Client orders, guest orders, admin orders
│   │   │   ├── contact.js            # Contact form + admin reply system
│   │   │   └── reviews.js            # Public reviews + admin delete
│   │   └── index.js                  # Express app entry point
│   ├── .env.example                  # Environment variable template
│   └── package.json
│
├── frontend/                         # React + Vite SPA
│   ├── public/                       # Static assets (video, favicon)
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth state: user, isGuest, login/logout/guest
│   │   │   └── BagContext.jsx        # Shopping cart (localStorage-backed)
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Navigation + notification badges
│   │   │   ├── ProtectedRoute.jsx    # Role-based + guest route guard
│   │   │   └── CookieBanner.jsx      # GDPR cookie consent banner
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Landing page + reviews
│   │   │   ├── LoginPage.jsx         # Login + guest mode entry
│   │   │   ├── RegisterPage.jsx      # Account registration
│   │   │   ├── ContactPage.jsx       # Public contact form
│   │   │   ├── ShopPage.jsx          # Product catalogue
│   │   │   ├── BagPage.jsx           # Shopping cart
│   │   │   ├── CheckoutPage.jsx      # Checkout flow (client + guest)
│   │   │   ├── HistoryPage.jsx       # Client order history
│   │   │   ├── MyMessagesPage.jsx    # Client: view messages + replies
│   │   │   ├── AdminPage.jsx         # Admin: product inventory CRUD
│   │   │   ├── AdminOrdersPage.jsx   # Admin: orders dashboard
│   │   │   └── AdminMessagesPage.jsx # Admin: messages dashboard + replies
│   │   ├── api.js                    # Axios instance with auto token refresh
│   │   ├── App.jsx                   # Router + layout
│   │   └── main.jsx                  # React entry point
│   └── package.json
│
├── docs/                             # BMAD project documentation
│   ├── product-brief.md              # Business vision, users, goals, business rules
│   ├── prd.md                        # Epics, user stories, acceptance criteria
│   ├── architecture.md               # Tech decisions, DB schema, auth flow, patterns
│   ├── bmad-process.md               # BMAD methodology + key design decisions
│   └── stories/                      # Per-feature developer story files
│       ├── story-001-authentication.md
│       ├── story-002-product-catalogue.md
│       ├── story-003-shopping-cart.md
│       ├── story-004-checkout.md
│       ├── story-005-order-history.md
│       ├── story-006-contact-messaging.md
│       ├── story-007-client-my-messages.md
│       ├── story-008-reviews.md
│       ├── story-009-admin-orders.md
│       ├── story-010-notification-badges.md
│       └── story-011-guest-mode.md
│
├── setup.cmd                         # Windows one-click setup (recommended)
├── setup.ps1                         # PowerShell setup script
├── HOW_TO_RUN.md                     # Detailed setup and run instructions
├── USER_MANUAL.md                    # End-user feature documentation
└── README.md
```

---

## Default Credentials

| Role   | Email                    | Password   |
|--------|--------------------------|------------|
| Admin  | admin@brewedtrue.com     | Admin1234! |
| Client | davidkovac1996@gmail.com | David1234! |
| Client | sarakovac1998@gmail.com  | Sara1234!  |

These accounts are pre-seeded with orders, reviews, and messages so you can explore all features immediately. You can also register any new account to receive the **Client** role automatically.

---

## Promo Code

Apply **`DIGISTORE24`** (case-insensitive) at checkout for a **10% discount**.

---

## Application Routes

| Route               | Access              | Description                              |
|---------------------|---------------------|------------------------------------------|
| `/`                 | Public / All        | Landing page + community reviews         |
| `/login`            | Public              | Sign in or continue as guest             |
| `/register`         | Public              | Create a new client account              |
| `/contact`          | Public + Client     | Contact form (hidden from admin + guest) |
| `/shop`             | Client + **Guest**  | Browse products, add to cart             |
| `/bag`              | Client + **Guest**  | View cart, adjust quantities             |
| `/checkout`         | Client + **Guest**  | Delivery info, promo code, product recommendation, place order |
| `/history`          | Client              | Past orders with itemised detail view    |
| `/messages`         | Client              | View sent messages + admin replies       |
| `/admin`            | Admin               | Product inventory CRUD                   |
| `/admin/orders`     | Admin               | All orders (clients + guests) dashboard  |
| `/admin/messages`   | Admin               | Customer messages + reply system         |

---

## API Endpoints

### Auth
| Method | Path                   | Auth     | Description                         |
|--------|------------------------|----------|-------------------------------------|
| POST   | `/api/auth/register`   | Public   | Register new client account         |
| POST   | `/api/auth/login`      | Public   | Login, returns access token + cookie|
| POST   | `/api/auth/logout`     | Public   | Logout, clears refresh token cookie |
| POST   | `/api/auth/refresh`    | Cookie   | Rotate refresh token, new access JWT|
| GET    | `/api/auth/me`         | Token    | Get current authenticated user      |

### Products
| Method | Path                       | Auth       | Description           |
|--------|----------------------------|------------|-----------------------|
| GET    | `/api/products`            | Public     | List all products     |
| GET    | `/api/products/:id`        | Public     | Get one product       |
| POST   | `/api/products/admin`      | Admin      | Create product        |
| PUT    | `/api/products/admin/:id`  | Admin      | Update product        |
| DELETE | `/api/products/admin/:id`  | Admin      | Delete product        |

### Orders
| Method | Path                            | Auth    | Description                              |
|--------|---------------------------------|---------|------------------------------------------|
| POST   | `/api/orders`                   | Client  | Place order (authenticated)              |
| POST   | `/api/orders/guest`             | Public  | Place order as guest (no auth required)  |
| GET    | `/api/orders/mine`              | Client  | My order list                            |
| GET    | `/api/orders/mine/:orderId`     | Client  | My order detail                          |
| GET    | `/api/orders/admin/unread-count`| Admin   | Count of unread orders (navbar badge)    |
| GET    | `/api/orders/admin`             | Admin   | All orders (clients + guests)            |
| GET    | `/api/orders/admin/:id`         | Admin   | Full order detail; marks order as read   |

### Contact
| Method | Path                               | Auth    | Description                             |
|--------|------------------------------------|---------|-----------------------------------------|
| POST   | `/api/contact`                     | Public  | Submit a contact message                |
| GET    | `/api/contact/mine/replied-ids`    | Client  | IDs of replied messages (badge polling) |
| GET    | `/api/contact/mine`                | Client  | All messages sent by this user          |
| GET    | `/api/contact/admin/unread-count`  | Admin   | Count of unread messages (navbar badge) |
| GET    | `/api/contact/admin`               | Admin   | All contact messages                    |
| GET    | `/api/contact/admin/:id`           | Admin   | Full message; marks as read             |
| PUT    | `/api/contact/admin/:id/reply`     | Admin   | Save or update a reply                  |

### Reviews
| Method | Path                  | Auth    | Description                       |
|--------|-----------------------|---------|-----------------------------------|
| GET    | `/api/reviews`        | Public  | All reviews                       |
| POST   | `/api/reviews`        | Client  | Submit or update own review       |
| DELETE | `/api/reviews/:id`    | Admin   | Delete any review                 |

---

## Security Highlights

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT access tokens** (15 min) stored in memory only — never in `localStorage` or a readable cookie
- **Refresh tokens** (7 days) in `httpOnly`, `sameSite=strict` cookies; rotated on every use; invalidated on logout
- All admin routes protected by **role middleware** on the server — role is never trusted from the client
- **Atomic checkout transaction** — stock locked with `SELECT … FOR UPDATE` and decremented in a single `COMMIT`; overselling is impossible
- **Server-side pricing** — all totals recalculated from DB prices; client-submitted amounts are ignored
- **Order snapshots** — `order_items` stores name, price, and weight at purchase time; history is never affected by future product changes
- **Input validation** on all mutation routes via `express-validator`; parameterised SQL queries throughout

---

## Tech Stack

| Layer    | Technology                                   |
|----------|----------------------------------------------|
| Frontend | React 18, Vite, React Router v6              |
| Backend  | Node.js, Express, express-validator          |
| Database | PostgreSQL (UUID PKs, ACID transactions)     |
| Auth     | JWT (access) + bcrypt + refresh token rotation |
| Styling  | Custom CSS with design tokens                |

---

## Building for Production

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/ — serve with nginx or any static host
```

Update `FRONTEND_URL` in `backend/.env` to match the deployed frontend origin for CORS.
