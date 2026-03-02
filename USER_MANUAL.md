# Bean & Brew — User Manual

This document describes every feature available in the Bean & Brew application, organised by user role.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Public Features](#public-features)
3. [Guest Mode](#guest-mode)
4. [Client Features](#client-features)
5. [Admin Features](#admin-features)
6. [Navigation Reference](#navigation-reference)

---

## Getting Started

### Accessing the App

Open your browser and navigate to `http://localhost:5173` (or the address shown after running the setup script).

### Demo Accounts

| Role   | Email                    | Password   |
|--------|--------------------------|------------|
| Admin  | admin@brewedtrue.com     | Admin1234! |
| Client | *(any registered email)* | *(your password)* |

Register any new account to receive the **Client** role automatically.

### Staying Logged In

Sessions are maintained via a secure refresh token stored in an httpOnly cookie. Closing and reopening the browser does not log you out — your session is restored automatically for up to 7 days.

---

## Public Features

These pages are accessible to anyone, with no account required.

### Home Page (`/`)

- Browse the Bean & Brew landing page with brand information and featured content.
- View the **Community Reviews** section showing star ratings and comments left by customers.
- Use the **Shop Our Coffees** or **Start Shopping** buttons to browse products — these redirect to the registration page if you are not logged in.
- Use the **Login** or **Register** links in the navigation bar to get started.

### Register (`/register`)

- Create a new account by entering your email address and a password.
- All new accounts are assigned the **Client** role automatically.

### Login (`/login`)

- Sign in with your email and password.
- After a successful login, admins are redirected to the Inventory page; clients are redirected to the home page.
- From this page you can also **Continue as Guest** (see Guest Mode below) or click **Register here** to create an account.

### Contact Us (`/contact`)

- Send a message to the Bean & Brew team.
- Fill in: **Name**, **Email**, **Subject**, and **Message** (minimum 10 characters).
- If you are already logged in as a client, your name and email are pre-filled automatically.
- A success confirmation appears after sending. You can submit another message immediately without leaving the page.

> The Contact page is not visible to admins or guests — it is available to the public and to logged-in clients only.

---

## Guest Mode

Guest mode lets you browse the shop and place an order without creating an account.

### Entering Guest Mode

On the **Login page**, click **Continue as Guest**. You are taken directly to the home page.

### What Guests Can Do

| Feature | Available |
|---|---|
| Browse the home page | Yes |
| Browse the shop | Yes |
| Add items to cart | Yes |
| Proceed to checkout and place an order | Yes |
| Leave a review | No |
| View order history | No |
| Send contact messages | No |
| Access My Messages | No |

### Guest Navigation Bar

As a guest you see: **Home**, **Shop**, **Cart** (with item badge), a **Guest** label, a **Sign In** button, and a **Register** button. The Contact link and all client-specific tabs are hidden.

### Guest Checkout

Guests can complete a full checkout without signing in:

1. Add items to the cart in the Shop.
2. Click **Proceed to Checkout** from the Cart page.
3. Fill in your delivery details and choose a payment method.
4. Optionally apply the promo code **`DIGISTORE24`** for 10% off.
5. Click **Place Order**.

After a successful guest order, a confirmation screen is shown. Guest orders appear in the admin Orders tab and are labelled **Guest** instead of showing an email address.

> Your cart is saved in the browser. It persists across page refreshes even in guest mode.

### Leaving Guest Mode

- Click **Sign In** in the navbar to return to the login page and sign in or register.
- Clicking **Register** in the navbar also exits guest mode.

---

## Client Features

These features require a logged-in account with the **Client** role.

### Shop (`/shop`)

- Browse all available coffee products with name, weight, price, and current stock level.
- Products with **zero stock** are clearly labelled and cannot be added to the cart.
- Click **Add to Cart** to add a product. The cart icon in the navigation bar updates with the running item count.

### Cart (`/bag`)

- View all items currently in your cart.
- Use the **+** and **−** buttons to adjust quantities. The maximum is capped at the current stock level.
- Click **✕** to remove an individual item.
- The order total updates in real time.
- Click **Proceed to Checkout** to move to the checkout page, or **Continue Shopping** to go back to the shop.

### Checkout (`/checkout`)

The checkout page has three sections:

#### Delivery Information

Required fields:
- First Name
- Last Name
- Delivery Address
- Phone Number

#### Payment Method

Choose one of two options:

- **Pay on Delivery** — pay with cash when your order arrives.
- **Pay by Card** — enter your card details:
  - Card Number (auto-formatted in groups of 4)
  - Name on Card
  - Expiry date in MM/YY format (expired cards are rejected)
  - CVV (3–4 digits)

> Card details are validated client-side only and are not stored or transmitted to any payment processor.

#### Promo Code

Enter **`DIGISTORE24`** (case-insensitive) and click **Apply** to receive a **10% discount** on the order total. The discounted amount is shown in the Order Summary before placing the order. Shipping is always free.

#### Product Recommendation

At the top of the checkout page you may see a **"Before you check out…"** banner featuring a coffee that is not yet in your cart. This is a personalised suggestion based on what is currently in stock.

- The recommendation shows the product image, name, weight, and price.
- Click **+ Add to Bag** to add one unit to your order instantly — no need to go back to the shop.
- The banner disappears automatically once you add the suggested product (it is now in your cart).
- If all in-stock products are already in your cart, no recommendation is shown.

Click **Place Order** to confirm. If an item has sold out since you added it to your cart, you are informed and the order is not placed until you update your cart.

After a successful order you are taken to your Order History page.

### Order History (`/history`)

- View all your past orders, most recent first.
- Each row shows the order date, total amount, payment method, and a promo badge if a discount was applied.
- Click any order row to open a detail panel showing:
  - All items with quantities and the price at the time of purchase (snapshots — unaffected by future price changes)
  - Subtotal, discount (if any), and total
  - Delivery address and phone number
  - Payment method

### My Messages (`/messages`)

- View all contact messages you have sent to Bean & Brew.
- Status badges show whether each message has been **Replied** (green) or is **Awaiting reply** (amber).
- Unread replies are highlighted with a **red dot** on the left side of the message row.
- The **My Messages** link in the navbar shows a number badge when there are new (unread) replies.
- Click any message to read it:
  - Your original message is shown at the top.
  - The admin's reply (if any) appears below.
  - Opening the message marks the reply as read and clears it from the badge count.
- Click **+ New Message** to go to the Contact page and send a new enquiry.

### Leave a Review

- On the **Home page**, logged-in clients see a **Leave a Review** form at the bottom of the Community Reviews section.
- Select a star rating (1–5) and write a comment (10–500 characters).
- Click **Submit Review** to publish it immediately.
- You can have only one review per account. If a review already exists, an **Edit** button lets you update it at any time.

> Guests and admins cannot submit or edit reviews.

### Sign Out

Click **Sign Out** in the navigation bar. Your session is cleared and you are redirected to the login page.

---

## Admin Features

Admin accounts have a completely different set of tabs. The Contact page is not shown to admins. Shop buttons on the home page are disabled for admin accounts.

### Inventory (`/admin`)

Manage the coffee product catalogue.

#### Viewing Products

Products are shown in a table with their image, name, weight, price, and stock level. Stock levels are colour-coded:

| Colour | Meaning |
|--------|---------|
| Green  | In stock |
| Amber  | Low stock (fewer than 5 units) |
| Red    | Out of stock |

#### Adding a Product

1. Click **+ Add Product**.
2. Fill in all fields:
   - **Product Name**
   - **Price** in dollars (e.g. `14.99`)
   - **Weight** in grams (e.g. `250`)
   - **Stock** — number of packs available (0 is allowed)
   - **Image URL** — a direct link to a product photo
3. Click **Add Product** to save.

#### Editing a Product

1. Click **Edit** next to any product.
2. Modify any field.
3. Click **Save Changes** to apply.

> Editing a price does not affect past orders — each order stores a price snapshot taken at the time of purchase.

#### Deleting a Product

1. Click **Delete** next to any product.
2. A confirmation prompt appears. Click **Delete** to confirm or **Cancel** to abort.

> Deleting a product does not affect past orders that included it.

---

### Orders (`/admin/orders`)

View every order placed by clients and guests.

#### Orders List

- All orders are shown with the customer name, email (or **Guest** label), payment method, total amount, and order date.
- A **Promo** badge is shown on orders where a discount code was applied.
- **Unread orders** (orders you have not yet opened) are highlighted with a **red dot** on the left and bold styling.
- The **Orders** link in the navbar displays a number badge for unread orders. The badge clears when you visit this page.
- The subtitle shows the total number of orders and the **cumulative income** from all orders.

#### Opening an Order

Click any order row to open the detail modal:

- All items purchased, with quantities and the price at the time of purchase.
- Subtotal, discount (if applicable), and final total.
- Delivery address and phone number.
- Payment method (Card or Pay on Delivery).
- The customer's email — or **Guest** if the order was placed without an account.

Opening an order automatically marks it as read and removes the red dot.

---

### Messages (`/admin/messages`)

View and respond to all contact form submissions.

#### Message List

- All messages are shown with sender name, email, subject, date, and a **Replied** badge if a reply has been sent.
- **Unread messages** are highlighted with a **red dot** on the left and bold styling.
- The subtitle shows the total message count and how many are unread.
- The **Messages** link in the navbar shows a number badge for unread messages. The badge clears when you visit this page.

#### Reading a Message

- Click any message row to open it in a modal.
- The message is automatically marked as **read** when opened.

#### Replying to a Message

1. Type your reply in the **Write a Reply** text area.
2. Click **Save Reply**.
3. The reply is immediately visible to the client in their **My Messages** page, where it will appear highlighted as a new unread reply.

#### Updating a Reply

- If a reply has already been saved, the existing text is shown above the input area.
- Edit the text and click **Update Reply** to overwrite the previous response.

---

### Deleting Reviews

- Admins can remove any review from the **Community Reviews** section on the home page.
- A small red trash icon appears in the bottom-right corner of each review card (visible only to admins).
- Click the icon, then confirm deletion in the inline prompt.
- The review is removed immediately.

---

## Navigation Reference

| Page / Link      | Not logged in | Guest | Client | Admin |
|------------------|:---:|:---:|:---:|:---:|
| Home             | Yes | Yes | Yes | Yes |
| Contact          | Yes | —   | Yes | —   |
| Login / Register | Yes | Yes | —   | —   |
| Shop             | —   | Yes | Yes | —   |
| Cart             | —   | Yes | Yes | —   |
| Checkout         | —   | Yes | Yes | —   |
| Order History    | —   | —   | Yes | —   |
| My Messages      | —   | —   | Yes | —   |
| Leave a Review   | —   | —   | Yes | —   |
| Inventory        | —   | —   | —   | Yes |
| Orders (admin)   | —   | —   | —   | Yes |
| Messages (admin) | —   | —   | —   | Yes |
| Delete Reviews   | —   | —   | —   | Yes |
