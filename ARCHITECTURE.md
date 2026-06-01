# Backend Architecture — How a Scalable Service Should Look

A reference for what a real, scalable backend looks like, and the approaches that hold up as the codebase grows past one file. Written so that revisiting it later makes the next project's structure feel obvious.

> Use this as a checklist when starting any non-toy project. Not every item belongs in every service — but every item belongs in the conversation.

---

## 1. The layered model

Most backends — whether Express, NestJS, Fastify, or anything else — converge on roughly five layers. Keep them separated. The minute a layer reaches across the one below it, the codebase starts to rot.

```
┌──────────────────────────────────────────────┐
│  Routes        (HTTP surface — URLs, verbs)  │
├──────────────────────────────────────────────┤
│  Middleware    (auth, parsing, rate limit)   │
├──────────────────────────────────────────────┤
│  Controllers   (request → response orchestration) │
├──────────────────────────────────────────────┤
│  Services      (business logic — pure-ish)   │
├──────────────────────────────────────────────┤
│  Repositories  (DB access, external APIs)    │
└──────────────────────────────────────────────┘
                       │
                       ▼
                  Database / cache / queue
```

| Layer | Owns | Does NOT |
|-------|------|----------|
| **Routes** | URL → handler mapping | Contain logic. Validate. Touch the DB. |
| **Middleware** | Cross-cutting concerns: parsing, auth, logging, rate limiting, error handling | Implement features. Know about specific routes. |
| **Controllers** | Validate input, call services, shape the HTTP response | Run SQL. Hold business rules. |
| **Services** | Business logic, orchestration across repositories | Touch `req`/`res`. Know about HTTP. |
| **Repositories** | All persistence. CRUD + queries. | Hold business rules. |

**Test for clean layering:** could you swap Express for Fastify and only rewrite routes + controllers? Could you swap Postgres for SQLite and only rewrite repositories? If yes, the layering is doing its job.

---

## 2. Directory layout that scales

A layout that survives growth from 1 to 50+ endpoints. Organize by **feature**, not by **file type** — once the project has more than two resources, file-type grouping (`controllers/`, `models/`, `routes/` at the root) becomes painful to navigate.

```
src/
├── app.js                  # build & configure Express, mount routers
├── server.js               # http listen() — separated so app is testable
├── config/
│   ├── env.js              # validate + export typed env vars
│   └── db.js               # db client factory
├── middleware/
│   ├── auth.js
│   ├── error-handler.js
│   ├── request-logger.js
│   └── rate-limit.js
├── features/
│   ├── books/
│   │   ├── book.routes.js
│   │   ├── book.controller.js
│   │   ├── book.service.js
│   │   ├── book.repository.js
│   │   ├── book.schema.js  # zod / validator
│   │   └── book.test.js
│   └── authors/
│       └── …
├── shared/
│   ├── errors.js           # AppError, NotFoundError, ValidationError
│   ├── logger.js
│   └── utils/
└── db/
    ├── schema/             # drizzle / prisma schema files
    └── migrations/
```

Why feature-first:
- New feature = new folder. Nothing else moves.
- Deleting a feature = deleting one folder.
- Easy to extract into a separate service later.

`book-store/` in this repo uses **file-type grouping** because it's small and pedagogical. Past ~3 resources, switch to feature-first.

---

## 3. Approaches that scale

### Config & secrets

- Single `config/env.js` that **validates env at boot** with Zod (or similar). Fail fast if `DATABASE_URL` is missing — don't discover it on the first request.
- Never read `process.env.X` from feature code. Always import from `config`.
- `.env.example` checked in, `.env` in `.gitignore`.

### Error handling

- One `AppError` base class with `statusCode` and `code` fields.
- Throw domain errors (`NotFoundError`, `ConflictError`) from services.
- A single `error-handler` middleware translates them into HTTP responses.
- **Never** scatter `try/catch` in every controller — wrap async handlers with a helper:
  ```js
  const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
  ```

### Validation

- Validate at the edge — in the controller or a `validate(schema)` middleware.
- Zod for schemas; infer types from them in TS.
- Reject early with a 400 + a structured error body, not a stack trace.

### Logging

- One logger (pino, winston) — not `console.log`.
- Log structured JSON in production: `{ level, msg, requestId, userId, … }`.
- Attach a `requestId` per request via middleware so logs across services are correlatable.

### Database

- One client, exported from `config/db.js`.
- Migrations are first-class — never edit production schema by hand.
- Indexes for every column you filter, join, or sort on.
- Never `SELECT *` in hot paths — pick columns explicitly.
- Wrap multi-statement writes in transactions.

### Authentication

- Two common shapes:
  - **Session-based:** server stores session, client gets an opaque cookie. Easy to revoke. Needs a session store (Redis at scale).
  - **JWT (stateless):** client holds a signed token. Hard to revoke without a denylist. Best with short expiry + refresh tokens.
- Authorization (who can do what) is *separate* from authentication (who they are). Centralize it — don't sprinkle `if (user.role === 'admin')` across controllers.

### Rate limiting

- At the edge — middleware on public endpoints. `express-rate-limit` + Redis for distributed services.
- Stricter limits on auth endpoints (login, signup, password reset).

### Caching

- Cache *reads*, never writes.
- Three tiers: in-process (LRU), distributed (Redis), CDN (HTTP cache headers).
- Always design invalidation alongside the cache. "How does this entry go away when the data changes?" before "how fast is the hit path?"

### Background jobs

- Don't do slow work in the request path. Push it to a queue.
- BullMQ + Redis is the boring, correct choice in Node.
- Idempotent jobs — assume every job will run at least twice.

### Observability

- **Logs:** structured + correlation IDs.
- **Metrics:** request count, latency p50/p95/p99, error rate, by endpoint.
- **Traces:** OpenTelemetry once the service talks to more than two others.
- A `/health` endpoint that returns 200 only when dependencies (db, cache) are reachable. A `/ready` separate from `/live` if running on Kubernetes.

### Testing

- **Unit:** services + utilities. Fast, no I/O.
- **Integration:** controllers + repositories against a real DB (testcontainers or a throwaway docker). The bugs that matter live in the seams.
- **E2E:** the golden paths only — login, create, fetch, delete.
- Aim for behavior coverage, not line coverage. 100% lines covered by tests that assert nothing is worse than 50%.

### Deployment

- Stateless app containers. State lives in the DB and cache.
- Horizontal scaling: any instance can serve any request. Sticky sessions are a smell.
- Graceful shutdown — drain in-flight requests on SIGTERM.
- Migrations run in a separate step, not on app boot.

---

## 4. The "12-factor" condensed cheat sheet

Anytime a design feels off, scan this list:

1. **Codebase** — one repo per service (or a clean monorepo).
2. **Dependencies** — declare them all (`package.json`), never rely on system packages.
3. **Config** — in the environment, not in code.
4. **Backing services** — DB, cache, queue are attached resources, swappable via URL.
5. **Build / release / run** — strictly separated.
6. **Processes** — stateless. State goes in backing services.
7. **Port binding** — the app exports an HTTP port; it doesn't need a webserver wrapper.
8. **Concurrency** — scale by adding processes, not threads inside one process.
9. **Disposability** — fast startup, graceful shutdown.
10. **Dev/prod parity** — same DB engine in dev as prod. SQLite in dev + Postgres in prod is a trap.
11. **Logs** — write to stdout. Let the platform aggregate.
12. **Admin processes** — migrations, seeds, one-off scripts run as one-off processes against the same code.

---

## 5. Anti-patterns to avoid

- **God controllers** that hit the DB, validate, format, and email — split it.
- **`console.log` everywhere** instead of a logger.
- **Synchronous heavy work** in the request path — push to a queue.
- **Throwing strings** (`throw "not found"`) — use error classes.
- **Shared mutable state** at module scope. Anything stateful belongs in a backing service.
- **One giant `utils.js`.** Utilities accumulate by feature; let them.
- **Reading `process.env.X` from random files.** Centralize.
- **Auth checks duplicated across routes.** Centralize with middleware or a policy layer.
- **N+1 queries.** Use joins, batch loaders (DataLoader), or eager loading.
- **Mixing migrations with seed data.** Schema in migrations, data in seeds.

---

## 6. When to split into multiple services

Don't, until the pain forces it. Signs the pain is real:

- Two parts of the codebase have **different scaling needs** (e.g. an image processor and a CRUD API).
- Two teams **deploy independently** and step on each other.
- A bounded context is **clearly its own product** (auth as a service, billing).

Until then, a well-layered monolith is faster, simpler, and easier to debug than five tangled services.

---

## 7. Suggested reading path through this repo

To revise these concepts using the projects already here:

1. **`http-server/`** — what Express is hiding from you.
2. **`express-server/`** — the bare framework.
3. **`book-store/`** — layered architecture (routes → controllers → models) + a real DB.
4. **`authentication/authentication-session/`** — sessions, cookies, protected routes.
5. **`chatApp/`** — long-lived connections, real-time state.
6. **Combine them** — build something from [`IDEAS.md`](./IDEAS.md) that exercises 3+ of the above.
