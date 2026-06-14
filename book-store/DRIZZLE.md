# Drizzle ORM + PostgreSQL — Setup & Reference

Everything needed to set up Drizzle against Postgres the way `book-store/` does it, the best practices that hold up in larger projects, and the specific blockers hit while building this one.

> Read this when starting any new Drizzle + Postgres project, or when something is mysteriously broken in this one.

---

## 1. What Drizzle is (and isn't)

- **`drizzle-orm`** — the runtime query builder. Used inside the app: `db.select().from(...)`.
- **`drizzle-kit`** — the dev tool. Used outside the app: generates migrations, pushes schemas, opens Drizzle Studio. Lives in `devDependencies` conceptually (even if installed as a regular dep here).

These are **two separate packages** with **two separate config concerns**:

| Concern | Owned by | File |
|---------|----------|------|
| Connecting to the DB at runtime | `drizzle-orm` | `db/index.js` |
| Generating migrations / pushing schema | `drizzle-kit` | `drizzle.config.js` |

Confusing them is the #1 source of "why does nothing work" — see the [Blockers](#5-blockers-and-how-to-resolve-them) section.

---

## 2. Setup walkthrough

### 2.1 Install

```bash
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit
```

- `drizzle-orm` — the ORM
- `pg` — the underlying Postgres driver (node-postgres)
- `dotenv` — to load `DATABASE_URL` from `.env`
- `drizzle-kit` — migrations / push / studio

### 2.2 Run Postgres locally

`docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:18.3
    container_name: postgres2
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: bookstore
    ports:
      - "5432:5432"
```

```bash
docker compose up -d
```

### 2.3 `.env`

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/bookstore
```

> `.env` is in `.gitignore`. Ship a `.env.example` with the shape (no real values).

### 2.4 Drizzle Kit config — `drizzle.config.js`

```js
require("dotenv/config");
const { defineConfig } = require("drizzle-kit");

module.exports = defineConfig({
  dialect: "postgresql",
  out: "./drizzle",           // migrations folder
  schema: "./models/index.js", // schema entry — MUST export pgTable instances directly
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### 2.5 Schema entry — `models/index.js`

The schema entry is what `drizzle-kit` scans. It **must export `pgTable` instances directly** (not nested in objects, not module-wrapped):

```js
const { booksTable } = require('./book.model');
const { authorsTable } = require('./author.model');

module.exports = { booksTable, authorsTable };
```

### 2.6 Define a table — `models/author.model.js`

```js
const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core');

const authorsTable = pgTable("authors", {
  id: uuid().primaryKey().defaultRandom(),
  firstName: varchar({ length: 50 }).notNull(),
  lastName:  varchar({ length: 50 }).notNull(),
  email:     varchar({ length: 100 }).notNull().unique(),
});

module.exports = { authorsTable };
```

### 2.7 Define a table with FK + GIN index — `models/book.model.js`

```js
const { pgTable, uuid, varchar, text, index } = require('drizzle-orm/pg-core');
const { authorsTable } = require('./author.model');
const { sql } = require('drizzle-orm');

const booksTable = pgTable("books", {
  id:          uuid().primaryKey().defaultRandom(),
  title:       varchar({ length: 100 }).notNull(),
  description: text(),
  authorId:    uuid().references(() => authorsTable.id).notNull(),
}, (table) => ({
  searchIndex: index("title_index").using(
    "gin",
    sql`to_tsvector('english', ${table.title})`
  ),
}));

module.exports = { booksTable };
```

Note the **callback form** for indexes — it receives the columns object and must return an object whose values are `index(...)` builders.

### 2.8 Runtime db client — `db/index.js`

```js
require("dotenv/config");
const { drizzle } = require("drizzle-orm/node-postgres");

const db = drizzle(process.env.DATABASE_URL);

module.exports = db;
```

`drizzle()` returns the **db client directly** — not `{ db }`. Do not destructure.

### 2.9 Push the schema → Postgres

```bash
npx drizzle-kit push      # creates tables directly (fast, dev only)
```

For a real project, generate + apply migrations instead:

```bash
npx drizzle-kit generate  # writes a .sql file in ./drizzle/
npx drizzle-kit migrate   # applies pending migrations
```

### 2.10 Visualize — Drizzle Studio

```bash
npx drizzle-kit studio
```

Opens a local web UI for the DB. Useful for verifying inserts and inspecting indexes without touching `psql`.

---

## 3. Querying — the patterns used here

```js
const db = require("./db");
const { eq, ilike, or } = require("drizzle-orm");
const { booksTable } = require("./models/book.model");

// Select all
await db.select().from(booksTable);

// Select by id
await db.select().from(booksTable).where(eq(booksTable.id, id)).limit(1);

// Full-text search (uses the GIN index from §2.7)
await db.select().from(booksTable).where(
  or(
    ilike(booksTable.title, `%${q}%`),
    ilike(booksTable.description, `%${q}%`)
  )
);

// Insert with returning
const [row] = await db.insert(authorsTable)
  .values({ firstName, lastName, email })
  .returning({ id: authorsTable.id });

// Delete by id
await db.delete(booksTable).where(eq(booksTable.id, id));
```

**Every operator (`eq`, `ilike`, `or`, `and`, `gt`, `lt`, …) is an explicit import from `drizzle-orm`.** None are globals.

---

## 4. Best practices

### Schema

- **One `pgTable` per file**, named `<resource>Table` (plural in DB, table variable matches).
- **The schema entry file (the one Drizzle Kit reads) must export `pgTable` instances directly** — never an object wrapping them, never the module export object.
- **Match plural/singular consistently.** `authorsTable` in the table file means `{ authorsTable }` everywhere. One-character drift = silent foreign-key break.
- **Define FKs with arrow functions:** `references(() => authorsTable.id)` — defers evaluation so circular imports work.
- **Use `defaultRandom()` for uuid PKs.** Sequential integers leak business info (record count, growth rate).
- **Set `.notNull()` aggressively.** Make nullable an explicit decision, not an accident.
- **Add indexes for every column you filter or join on.** For text search, use `GIN` over `to_tsvector(...)`.

### Migrations

- **`push` is for prototypes only.** It mutates the DB without leaving a record. Fine for `book-store/`-style learning; never for production.
- **For real projects:** `generate` creates a versioned SQL file; commit it. `migrate` applies it. Reviewable, auditable, reversible.
- **Never edit a generated migration file by hand** after it's been applied somewhere. Make a new migration instead.

### Runtime

- **One `db` client per process.** Export from `db/index.js`. Don't call `drizzle()` per request.
- **Use connection pooling** — `node-postgres` does this by default via `pg.Pool`. For Vercel/serverless, switch to `drizzle-orm/neon-http` or similar HTTP-based drivers.
- **Wrap multi-statement writes in `db.transaction(async (tx) => { ... })`.**
- **Always `.returning(...)` after `insert`/`update`** so the caller gets the new row's id and can act on it. Don't make them re-query.
- **Never `SELECT *` in hot paths.** With Drizzle: `db.select({ id: t.id, title: t.title }).from(t)`.

### Env & config

- **Validate `DATABASE_URL` at boot.** Throw immediately if missing — don't discover it on the first query.
- **One `.env`, one source of truth.** `drizzle.config.js` and `db/index.js` both read it via `dotenv/config`.

### Project layout

- `models/` holds schema files; `models/index.js` is the schema entry.
- `db/index.js` is the runtime client.
- `drizzle/` is generated — don't hand-edit, but **do commit** generated migrations.
- `drizzle.config.js` lives at the project root.

---

## 5. Blockers and how to resolve them

These are the exact bugs hit while building this project, what they looked like, and what fixed them. If you see one of these messages again, jump straight to the fix.

### 5.1 `drizzle-kit push` reports "No changes"

**Symptom:** Models exist, push runs clean, but Postgres stays empty.

**Cause:** Schema entry file (`models/index.js`) used:
```js
const booksTable = require('./book.model');  // gets the WHOLE module
```
Drizzle Kit's scanner needs **`pgTable` instances**, not a module object.

**Fix:** Destructure the named export:
```js
const { booksTable } = require('./book.model');
```

**Generalize:** Anywhere Drizzle (kit or runtime) gets handed a value it can't recognize as a table, this is usually why.

---

### 5.2 `Failed query: select  from $1   params: [object Object]`

**Symptom:** A SELECT explodes with an empty column list and `$1` where a table should be.

**Cause:** Same family as 5.1, but at runtime — a route handler did:
```js
const authorsTable = require("../models/author.model");  // module object
db.select().from(authorsTable);
```
Drizzle didn't recognize it as a table, so it bound it as a query parameter.

**Fix:**
```js
const { authorsTable } = require("../models/author.model");
```

**Tell:** If the error includes `select  from $N`, it's a table-shape mistake every time.

---

### 5.3 `Cannot read properties of undefined (reading 'select')`

**Symptom:** `db.select()` throws because `db` is `undefined`.

**Cause:** `db/index.js` destructured the wrong shape:
```js
const { db } = drizzle(process.env.DATABASE_URL);  // WRONG
```
`drizzle()` returns the client **directly**, not `{ db }`.

**Fix:**
```js
const db = drizzle(process.env.DATABASE_URL);
module.exports = db;
```

---

### 5.4 `ilike is not defined` (or any operator)

**Symptom:** `ReferenceError: ilike is not defined` when adding search.

**Cause:** Drizzle SQL helpers are **not globals**. Each operator needs an explicit import.

**Fix:**
```js
const { ilike, or, eq, and } = require("drizzle-orm");
```

---

### 5.5 Foreign key silently broken by naming drift

**Symptom:** FK references resolve to nothing; joins return empty.

**Cause:** `book.model.js` imported and referenced `authorTable` (singular) while the actual export was `authorsTable` (plural).

**Fix:** Match exported names exactly. Pick one convention (plural for tables, here) and grep your codebase before declaring a new one.

---

### 5.6 `Unexpected token '"', "\"{\n  \"fi"... is not valid JSON` on POST

**Symptom:** body-parser crashes parsing what should be JSON.

**Cause:** Client sent a **JSON-encoded string** (double-stringified body) instead of a raw JSON object. In Postman: chose "Text" with manually quoted JSON instead of "raw → JSON".

**Fix client-side:** Use raw JSON body mode, not stringified.

(This isn't a Drizzle bug, but it shows up while hitting Drizzle-backed endpoints, so it lives here too.)

---

### 5.7 Migration "drift" between `push` and `generate` workflows

**Symptom:** Started a project with `push`, later switched to `generate`/`migrate`, and migrations don't match the real DB.

**Cause:** `push` doesn't write migration files. The first `generate` after `push` produces a migration as if the DB were empty — and trying to apply it fails because the tables already exist.

**Fix:** Pick one workflow per project from day one. To switch later: drop the DB, run `generate`, then `migrate` to recreate it cleanly. Don't mix.

---

### 5.8 `relation "..." does not exist` after schema change

**Symptom:** Added a new table; queries against it fail with `relation does not exist`.

**Cause:** Forgot to re-run `push` (or `generate` + `migrate`) after editing models.

**Fix:** Drizzle Kit only updates the DB when you ask. Re-run:
```bash
npx drizzle-kit push
```

---

### 5.9 Connection errors after Docker restart

**Symptom:** `ECONNREFUSED 127.0.0.1:5432`.

**Causes & fixes:**
- Container not running → `docker compose up -d`.
- Container restarted with no volume → data lost. Add a volume in `docker-compose.yml` if persistence matters between restarts.
- Wrong port in `DATABASE_URL` vs `docker-compose.yml` → re-check the mapping.

---

## 6. Quick command reference

```bash
# Lifecycle
docker compose up -d              # start Postgres
docker compose down               # stop Postgres
docker compose down -v            # stop AND wipe data

# Drizzle Kit
npx drizzle-kit push              # push schema directly (dev only)
npx drizzle-kit generate          # generate a versioned migration
npx drizzle-kit migrate           # apply pending migrations
npx drizzle-kit studio            # open the visual DB explorer
npx drizzle-kit drop              # drop a generated migration

# Verify from CLI
docker exec -it postgres2 psql -U postgres -d bookstore -c "\dt"
```

---

## 7. Mental model in one paragraph

`drizzle-kit` is a dev tool that reads `drizzle.config.js` → finds the schema entry → scans for `pgTable` exports → diffs against the DB → emits migrations or pushes directly. `drizzle-orm` is a runtime query builder that takes the same `pgTable` objects and lets you write type-safe SQL via methods. The two share only the `pgTable` definitions. If something is broken, the question is almost always: *"is the value I handed Drizzle actually a `pgTable` instance, or something wrapping one?"*
