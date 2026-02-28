# BMAD Process — Bean & Brew

**Document type:** Process Overview
**Project:** Bean & Brew — Coffee Shop E-Commerce Web Application
**Version:** 1.0
**Date:** 2026-03-01

---

## What is BMAD?

BMAD (Business Minded Agile Development) is an AI-assisted development methodology that structures collaboration between a human developer and an AI coding assistant (Claude). Rather than describing tasks in vague terms and hoping for the best, BMAD front-loads structured thinking — business brief, requirements, architecture, and story breakdown — so that the AI has precise, unambiguous context at every step.

The core insight is: **the quality of AI-generated code is proportional to the quality of the inputs given to it.** BMAD is a discipline for producing those inputs systematically.

---

## BMAD Roles

In this project, one developer acted as all four roles sequentially before each implementation phase:

| Role | Responsibility | Output |
|---|---|---|
| **Business Analyst** | Define the problem, users, goals, constraints | `product-brief.md` |
| **Product Manager** | Translate goals into measurable requirements | `prd.md` |
| **Architect** | Design the system: tech choices, data model, auth flow, patterns | `architecture.md` |
| **Developer** | Break requirements into self-contained stories; provide to Claude | `stories/*.md` |

---

## The BMAD Workflow Applied to Bean & Brew

### Phase 1 — Product Brief

Before writing a single line of code, the business context was documented:
- Who are the users? (admin, registered client, guest shopper)
- What problem does this solve? (self-hosted storefront, no transaction fees, built-in messaging)
- What are the key business rules? (prices in cents, server-side pricing, one review per account, atomic checkout)
- What is in scope for the MVP, and what is deferred?

This brief served as the north star throughout development. When feature requests arrived mid-project (e.g. guest mode, orders tab), they were evaluated against the brief before being designed.

### Phase 2 — Product Requirements Document (PRD)

The brief was expanded into epics and user stories with acceptance criteria. Each story followed the format:

```
As a [role], I want to [action] so that [outcome].

Acceptance Criteria:
- [concrete, testable condition]
- [concrete, testable condition]
```

Writing AC before implementation forced precision. For example, the notification badge story required deciding: *Where is "seen" state stored — server or localStorage? What happens in React StrictMode?* These decisions were made in the PRD, not discovered mid-implementation.

### Phase 3 — Architecture Document

With requirements locked, the technical architecture was designed:
- Why PostgreSQL (not SQLite or MySQL)? → `FOR UPDATE` row locking, UUID support.
- Why JWT in memory (not localStorage)? → XSS protection.
- Why `sessionStorage` for guest state (not a server session)? → Stateless backend, no auth endpoint needed.
- How does the Axios interceptor retry on 401? → Token refresh happens transparently to page components.
- How does checkout prevent overselling? → Transaction diagram with `BEGIN / FOR UPDATE / COMMIT`.

Architecture decisions made up-front prevented costly mid-implementation pivots (e.g. discovering that SQLite doesn't support row locking only after starting to build checkout).

### Phase 4 — Story Breakdown & Implementation

Each PRD story was expanded into a developer-facing story file containing:
- The user story
- Background & context (the *why* behind decisions)
- A task checklist (backend tasks, frontend tasks, DB tasks)
- Acceptance criteria verification table

Each story was provided to Claude as a prompt, along with the relevant architecture context. Claude implemented the story; the developer reviewed the output, flagged issues, and iterated.

**Example prompt pattern used:**
> "Implement Story 009 — Admin Orders Dashboard. The database already has `is_read` on `contact_messages` (same pattern needed for orders). Use `LEFT JOIN` since guest orders have no `user_id`. Declare `/admin/unread-count` before `/admin/:id` to avoid Express route conflict. See architecture.md §6.2 for the route ordering convention."

This level of context produced correct, production-quality code on the first attempt far more often than vague prompts like *"make an admin orders page"*.

---

## Key Decisions Made During BMAD Planning (Before Any Code)

### 1. Prices in Cents
Decided in the Product Brief. JavaScript floating-point would cause `0.1 + 0.2 = 0.30000000000004`. Storing cents as integers and dividing by 100 only at the display layer eliminates this class of bug entirely.

### 2. Order Snapshots
Decided in the PRD (Story 004 AC: *"Order items store price/name/weight snapshots"*). Without snapshots, editing a product's name or price after an order is placed would silently corrupt the order history.

### 3. Server-Side Pricing
Decided in the Product Brief (Key Business Rules §7). Without this, a client could manipulate the request body to pay $0.01 for any item.

### 4. Two-Token Auth (JWT + Refresh)
Decided in the Architecture Document §4. Access token in memory eliminates XSS theft. Refresh token in httpOnly cookie with rotation provides session persistence without localStorage.

### 5. Server-Side is_read for Admin Notifications
Decided during Story 009 design, after evaluating localStorage as an alternative:
- **localStorage approach considered:** Store count of seen orders. Rejected — React StrictMode double-invokes effects, causing the seen count to be written before the admin sees anything new.
- **Server-side is_read chosen:** `UPDATE orders SET is_read = TRUE` when the admin opens an order. Durable, cross-session, identical to the existing `contact_messages.is_read` pattern.

### 6. localStorage (Client-Only Write-on-Click) for Client Reply Badges
Decided during Story 007 design. The server tracks *whether* a message has a reply, but not *whether a specific user has seen it*. Rather than adding a `user_message_views` join table, `seenReplyIds_{userId}` in localStorage is sufficient for a single-user scenario. **Critical detail:** localStorage is written only in click handlers, never in `useEffect`, to avoid React StrictMode corruption.

### 7. Guest Mode as Frontend State (sessionStorage)
Decided during Story 011 design. Alternatives considered:
- **Server-side guest session:** Would require an auth endpoint with no credentials — adds backend complexity for no benefit.
- **No persistence:** Guest state lost on refresh — poor UX.
- **localStorage:** Would persist across browser restarts — a guest who closed the tab would still be in "guest mode" days later.
- **sessionStorage chosen:** Persists within the tab session; cleared when the tab closes. Matches the expected UX mental model.

---

## What BMAD Produced That a Traditional Approach Would Not

| Without BMAD | With BMAD |
|---|---|
| "Make a checkout page" → discovered overselling bug in testing | Checkout transaction with `FOR UPDATE` specified in architecture before a line was written |
| "Add a notification badge" → localStorage bug discovered in prod | StrictMode localStorage issue identified and solved during story design |
| "Admin should see orders" → guest orders crash the query (JOIN fails for NULL user_id) | `LEFT JOIN` specified in story 009 before the route was created |
| Multiple re-designs as requirements shifted | Scope locked in PRD; mid-project changes evaluated against brief before accepted |
| Vague prompts → mediocre AI output → heavy editing | Story files as precise prompts → production-quality first-attempt output |

---

## Document Index

| Document | Purpose |
|---|---|
| `docs/product-brief.md` | Business vision, users, goals, in-scope features, business rules |
| `docs/prd.md` | Epics, user stories, acceptance criteria |
| `docs/architecture.md` | Tech stack rationale, DB schema, auth flow, frontend patterns, security |
| `docs/stories/story-001-authentication.md` | Auth & session management |
| `docs/stories/story-002-product-catalogue.md` | Product CRUD (admin) + shop (client/guest) |
| `docs/stories/story-003-shopping-cart.md` | Cart (localStorage-backed) |
| `docs/stories/story-004-checkout.md` | Full checkout flow with atomic stock decrement |
| `docs/stories/story-005-order-history.md` | Client order history with detail view |
| `docs/stories/story-006-contact-messaging.md` | Contact form + admin reply system |
| `docs/stories/story-007-client-my-messages.md` | Client reply notifications + StrictMode-safe localStorage |
| `docs/stories/story-008-reviews.md` | One-per-account reviews + admin moderation |
| `docs/stories/story-009-admin-orders.md` | Admin orders tab with server-side is_read + guest order support |
| `docs/stories/story-010-notification-badges.md` | Polling-based navbar badges for admin and client |
| `docs/stories/story-011-guest-mode.md` | Full guest mode: browse, cart, checkout, admin labelling |
