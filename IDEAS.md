# Project Ideas — What to Build Next

A grab-bag of backend projects, grouped by what they exercise. Pick one that stretches the next concept on your list, not one that just rehearses things already known.

> Rule of thumb: an idea is only useful if you can write down, in one sentence, **the specific thing it forces you to learn**. If you can't, pick another.

---

## Difficulty legend

- 🟢 **Foundational** — fits in a weekend. One or two new concepts.
- 🟡 **Intermediate** — a week of evenings. Combines 3–4 concepts including a database.
- 🔴 **Advanced** — multi-week. Real-time, queues, multiple services, or scale concerns.

---

## 🟢 Foundational

### 1. URL shortener
- **Learn:** routing, generating short ids, redirect responses (`302`), basic persistence.
- **Stretch:** click analytics per short link.

### 2. Markdown note API
- **Learn:** CRUD against a DB, basic search (`ILIKE`).
- **Stretch:** server-side markdown → HTML render endpoint.

### 3. Weather proxy
- **Learn:** calling external APIs, caching responses to avoid rate limits, env-based API keys.
- **Stretch:** TTL cache per `(lat,lng)` with a 10-minute window.

### 4. File upload service
- **Learn:** `multipart/form-data`, streaming uploads, storing on disk vs S3, virus-scan stubs.
- **Stretch:** signed URLs for downloads.

### 5. Pomodoro timer API
- **Learn:** per-user state, simple auth, basic stats endpoints.
- **Stretch:** daily summary cron job.

---

## 🟡 Intermediate

### 6. Personal expense tracker
- **Learn:** users + ownership, joins, aggregations (`SUM`, `GROUP BY` month/category), validation with Zod.
- **Stretch:** CSV import; monthly budget alerts.

### 7. Task manager with teams
- **Learn:** role-based access (owner / member / viewer), pagination, soft deletes.
- **Stretch:** activity feed; assign / reassign tasks.

### 8. Recipe API with full-text search
- **Learn:** Postgres `tsvector`, GIN indexes, ranking results — extends `book-store/`.
- **Stretch:** ingredient-based filtering (find recipes using what's in the pantry).

### 9. Blog platform with auth
- **Learn:** session vs JWT auth, password hashing (`argon2`), email verification.
- **Stretch:** draft/published states; per-post visibility (public/unlisted/private).

### 10. REST + GraphQL of the same data
- **Learn:** what GraphQL actually solves vs REST; resolvers as a thin layer over services.
- **Stretch:** DataLoader to fix N+1.

### 11. Booking / appointments service
- **Learn:** time zones (the real boss fight), conflict detection, optimistic locking.
- **Stretch:** recurring slots; cancellation policies.

### 12. Webhook receiver + outbound webhook sender
- **Learn:** HMAC signature verification, retry with exponential backoff, idempotency keys.
- **Stretch:** dead-letter queue for repeatedly failing endpoints.

### 13. Rate-limited public API
- **Learn:** API keys, per-key rate limiting with Redis, usage tiers.
- **Stretch:** an admin endpoint that resets a key's window.

---

## 🔴 Advanced

### 14. Real-time multiplayer something (poll, drawing board, presence)
- **Learn:** WebSockets / Socket.IO, broadcasting to rooms, reconnection semantics.
- **Stretch:** persist state so reconnecting clients catch up.

### 15. Job board with async scoring
- **Learn:** background queues (BullMQ), workers separate from the API, idempotent jobs.
- **Stretch:** scheduled re-scoring; embeddings for semantic search.

### 16. URL screenshot service
- **Learn:** headless browser pool, queueing slow tasks, S3 storage, signed URL delivery.
- **Stretch:** webhook callback when the screenshot is ready.

### 17. Chat app with persistence + history pagination
- **Learn:** combining WebSockets with REST history loads, message ordering across reconnects, typing/read receipts.
- **Stretch:** end-to-end encryption (E2EE) sketch — server stores ciphertext only.

### 18. Notification fan-out service
- **Learn:** topics, subscribers, delivery via multiple channels (email/push/web), retries, deduplication.
- **Stretch:** quiet hours per user; digest mode.

### 19. Mini payment ledger
- **Learn:** double-entry bookkeeping, transactional integrity, idempotent endpoints (critical for $$$).
- **Stretch:** integrate Stripe test mode; reconcile webhooks against ledger.

### 20. Multi-tenant SaaS skeleton
- **Learn:** tenant isolation strategies (row-level, schema-per-tenant, db-per-tenant), per-tenant config, billing hooks.
- **Stretch:** subdomain routing (`acme.example.com`).

### 21. Distributed URL crawler
- **Learn:** queue-driven workers, robots.txt politeness, deduping URLs across workers, backpressure.
- **Stretch:** a small search index over crawled pages.

### 22. Feature flag service
- **Learn:** rule evaluation, percentage rollouts, real-time push of flag changes to clients.
- **Stretch:** audit log of every flag change.

---

## "Combine what you've already built" ideas

These reuse concepts from existing directories — fastest path from "I know this" to "I've shipped this":

- **`book-store/` + `authentication-session/`** → book-store with per-user libraries and shared collections.
- **`chatApp/` + `authentication-session/`** → chat with login, persisted rooms, message history.
- **`book-store/` + a queue** → CSV bulk import endpoint that processes async and pushes status updates over WebSocket.
- **`tweet/` + notifications** → followers feed + a fan-out worker that materializes timelines.

---

## How to scope a project so you actually finish it

1. **Write the public API surface in one Markdown table first.** If it has more than ~10 rows, cut.
2. **Pick the smallest persistent schema** that supports those endpoints.
3. **Decide what's explicitly out of scope** (the cut list is more valuable than the in list).
4. **Build the happy path end-to-end first.** Errors, edge cases, polish, tests, deploy — in that order.
5. **Write the mistakes log as you go.** The bugs are the actual learning.
