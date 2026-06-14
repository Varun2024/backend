# Drizzle ORM + PostgreSQL — General Setup, Best Practices & Tips

The general-purpose Drizzle reference for this repo. Read this when starting any new Node project that needs Drizzle + Postgres — it generalizes the patterns proven out in `book-store/` and `node-orm/`, with extra tips and knowledge you only collect after a few projects.

> Project-specific notes live in [`book-store/DRIZZLE.md`](./book-store/DRIZZLE.md) (FK + GIN full-text reference) and [`node-orm/DRIZZLE.md`](./node-orm/DRIZZLE.md) (first-time learner walkthrough). This file is the umbrella that points to both and adds the higher-level guidance.

---

## 1. The two-package mental model

The single biggest source of confusion is treating Drizzle as one thing. It's two:

| Package | What it is | When it runs | Where it lives |
|---------|-----------|--------------|----------------|
| **`drizzle-orm`** | Runtime query builder | Inside the app | `db/index.js`, route handlers |
| **`drizzle-kit`** | Dev CLI tool | At the terminal | `drizzle.config.js`, `npx drizzle-kit ...` |

They share **only the schema definitions** — the `pgTable(...)` exports.
**Every Drizzle blocker eventually traces back to this fact.** Tattoo it on the inside of your brain.

---

## 2. Standard project layout

```
my-project/
├── docker-compose.yml          # Postgres (see DOCKER.md)
├── .env                        # DATABASE_URL=...
├── .env.example                # committed shape
├── drizzle.config.js           # Drizzle Kit config
├── drizzle/                    # generated migrations (commit these)
│   ├── 0000_initial.sql
│   └── meta/
├── db/
│   └── index.js                # runtime client — exports `db`
└── models/                     # or src/db/schema/
    ├── index.js                # schema entry — re-exports pgTables directly
    ├── user.model.js
    └── post.model.js
```

Two principles to defend:

1. **The "schema entry file" (the one Drizzle Kit reads) re-exports `pgTable` instances directly.** No wrapping, no module objects.
2. **`db/index.js` exports the single runtime client** for the whole app. Imported everywhere; created once.

---

## 3. End-to-end setup — copy template

### 3.1 Install

```bash
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit
```

| Package | Purpose |
|---------|---------|
| `drizzle-orm` | Runtime ORM |
| `pg` | node-postgres driver under Drizzle |
| `dotenv` | Loads `DATABASE_URL` |
| `drizzle-kit` | CLI: migrations, push, studio |

Alternative drivers:
- Serverless / edge (Vercel, Cloudflare, Neon) → use `@neondatabase/serverless` + `drizzle-orm/neon-http`.
- Lightweight / no `pg` → `postgres` package + `drizzle-orm/postgres-js`.
- MySQL → `mysql2` + `drizzle-orm/mysql2`.
- SQLite (local dev only) → `better-sqlite3` + `drizzle-orm/better-sqlite3`.

### 3.2 `docker-compose.yml`

See [`DOCKER.md`](./DOCKER.md) §3.2 for the recommended Postgres setup with a named volume and healthcheck.

### 3.3 `.env`

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/my_project
```

Format: `postgresql://<user>:<password>@<host>:<port>/<database>`.
Commit a `.env.example` with the shape — never the real `.env`.

### 3.4 `drizzle.config.js`

```js
require("dotenv/config");
const { defineConfig } = require("drizzle-kit");

module.exports = defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./models/index.js",
  dbCredentials: { url: process.env.DATABASE_URL },
  // Optional:
  verbose: true,
  strict: true,           // prompts before destructive changes
});
```

ESM variant (drop `require`, use `import 'dotenv/config'; import { defineConfig } from 'drizzle-kit'; export default defineConfig({...})`).

### 3.5 Schema entry — `models/index.js`

```js
const { usersTable } = require('./user.model');
const { postsTable } = require('./post.model');

// pgTables exported DIRECTLY — Drizzle Kit needs to see them.
module.exports = { usersTable, postsTable };
```

### 3.6 A table — `models/user.model.js`

```js
const { pgTable, uuid, varchar, timestamp } = require('drizzle-orm/pg-core');

const usersTable = pgTable("users", {
  id:        uuid().primaryKey().defaultRandom(),
  email:     varchar({ length: 255 }).notNull().unique(),
  name:      varchar({ length: 100 }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

module.exports = { usersTable };
```

### 3.7 Runtime client — `db/index.js`

```js
require("dotenv/config");
const { drizzle } = require("drizzle-orm/node-postgres");

const db = drizzle(process.env.DATABASE_URL);

module.exports = db;
```

`drizzle()` returns the client **directly**. Never destructure.

### 3.8 Apply the schema

```bash
# Prototyping (no migration files):
npx drizzle-kit push

# Real projects (versioned migrations — commit these):
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3.9 Inspect

```bash
npx drizzle-kit studio
```

A local web UI for browsing the DB.

---

## 4. Column types — what to pick

| Need | Type | Notes |
|------|------|-------|
| Primary key | `uuid().primaryKey().defaultRandom()` | Doesn't leak record count like serial integers. |
| Short string | `varchar({ length: N })` | Always set a length. |
| Long string | `text()` | No length limit. |
| Boolean | `boolean()` | |
| Integer | `integer()` | |
| Money | `numeric({ precision, scale })` | **Never `real` or `double`** for money. |
| Timestamp | `timestamp({ withTimezone: true })` | Always with TZ. UTC in DB. |
| JSON | `jsonb()` | Prefer `jsonb` over `json` — indexed, faster. |
| Enum | `pgEnum('role', ['admin','member'])` | Or a `varchar` with a Zod-checked union. |
| Array | `text().array()` | Or use a join table once it stops being trivial. |

**Always do:**

- `.notNull()` on everything that isn't truly optional.
- `.unique()` on columns that should be unique (don't rely on app-level checks).
- `.defaultNow()` on `createdAt` / `updatedAt`.
- `.references(() => otherTable.id, { onDelete: 'cascade' })` — pick a delete policy intentionally.

---

## 5. Relations and joins

### Foreign keys

```js
authorId: uuid()
  .references(() => authorsTable.id, { onDelete: 'cascade' })
  .notNull(),
```

Use an **arrow function** for `references` — defers evaluation so circular imports don't break.

### Joins

```js
const { eq } = require("drizzle-orm");

const result = await db
  .select({
    bookId: booksTable.id,
    title:  booksTable.title,
    author: authorsTable.firstName,
  })
  .from(booksTable)
  .innerJoin(authorsTable, eq(booksTable.authorId, authorsTable.id));
```

### Drizzle's `relations` API (optional, for nested fetches)

```js
const { relations } = require('drizzle-orm');

const authorRelations = relations(authorsTable, ({ many }) => ({
  books: many(booksTable),
}));

const bookRelations = relations(booksTable, ({ one }) => ({
  author: one(authorsTable, {
    fields: [booksTable.authorId],
    references: [authorsTable.id],
  }),
}));
```

Then:

```js
const data = await db.query.authorsTable.findMany({
  with: { books: true },
});
```

Use it when the joins feel like ORM territory; stick with raw `select` + `join` when you want explicit SQL.

---

## 6. Indexes — the rule

**Index every column you filter, join, or sort on.** Anything else is decoration.

```js
const { pgTable, uuid, varchar, index } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');

const booksTable = pgTable("books", {
  id:    uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 200 }).notNull(),
}, (table) => ({
  // B-tree index for exact match / range / sort
  titleIdx: index("books_title_idx").on(table.title),

  // GIN index for full-text search
  searchIdx: index("books_search_idx").using(
    "gin",
    sql`to_tsvector('english', ${table.title})`
  ),
}));
```

Notice the **callback form** at the end of `pgTable(...)`. It receives the columns object and returns an index map.

---

## 7. Query catalog — patterns you'll keep using

```js
const db = require("./db");
const { eq, and, or, ilike, gt, lt, inArray, desc, asc } = require("drizzle-orm");
const { usersTable } = require("./models/user.model");

// SELECT all
await db.select().from(usersTable);

// SELECT specific columns
await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable);

// WHERE
await db.select().from(usersTable).where(eq(usersTable.email, "ada@x.com"));

// AND / OR
await db.select().from(usersTable).where(
  and(eq(usersTable.role, "admin"), gt(usersTable.createdAt, since))
);

// ILIKE (case-insensitive substring)
await db.select().from(usersTable).where(ilike(usersTable.name, `%${q}%`));

// IN
await db.select().from(usersTable).where(inArray(usersTable.id, ids));

// ORDER + LIMIT + OFFSET
await db.select().from(usersTable)
  .orderBy(desc(usersTable.createdAt))
  .limit(20).offset(40);

// INSERT with returning (always do this on create)
const [created] = await db.insert(usersTable)
  .values({ email, name })
  .returning();

// UPDATE
await db.update(usersTable)
  .set({ name: "New Name", updatedAt: new Date() })
  .where(eq(usersTable.id, id))
  .returning();

// DELETE
await db.delete(usersTable).where(eq(usersTable.id, id));

// TRANSACTION
await db.transaction(async (tx) => {
  await tx.insert(usersTable).values(...);
  await tx.insert(postsTable).values(...);
  // throw inside → automatic rollback
});

// COUNT
const { sql } = require("drizzle-orm");
const [{ count }] = await db
  .select({ count: sql`count(*)::int` })
  .from(usersTable);
```

**Every operator (`eq`, `ilike`, `or`, `and`, `gt`, `lt`, `inArray`, `desc`, ...) is an explicit import from `drizzle-orm`. None are globals.**

---

## 8. Migrations — `push` vs `generate`/`migrate`

| | `push` | `generate` + `migrate` |
|--|--------|------------------------|
| Speed | Instant | Two-step |
| Migration files | None | Versioned `.sql` in `./drizzle/` |
| Reviewable in PR | No | Yes |
| Reversible | No | Yes (write a down migration) |
| Use case | Learning, prototypes | Anything that ships |

**Pick one workflow per project from day one.** Mixing them produces drift you'll spend an evening untangling.

**Migration discipline that scales:**

- Commit generated SQL files. They're a permanent record of schema history.
- Never edit a generated migration after it's been applied anywhere. Make a new one.
- Don't mix schema migrations and data seeds in the same file.
- Run migrations as a **separate deploy step**, not from app boot. App boot must not race with migrations.

---

## 9. Best practices that scale

### Schema

- One `pgTable` per file; `models/index.js` re-exports them.
- Plural table names in DB (`users`), matching variable suffix (`usersTable`). Consistency beats cleverness.
- `.notNull()` aggressively. Nullable is a decision.
- UUID PKs by default.
- Always have `createdAt` / `updatedAt` on entity tables.
- FK references use arrow functions; pick `onDelete` explicitly (`cascade`, `set null`, `restrict`).

### Runtime

- **One `db` client per process.** Exported from `db/index.js`. Never call `drizzle()` per request.
- **Wrap multi-statement writes in `db.transaction(...)`.** The atomic guarantees are why you have a SQL database.
- **Always `.returning(...)` after insert/update.** Don't make the caller round-trip again.
- **Never `SELECT *` in hot paths.** With Drizzle: pass an object to `.select({ ... })`.
- **Validate input *before* it hits Drizzle** — pair Zod schemas with table types.

### Config

- Validate `DATABASE_URL` at boot. Fail fast.
- Don't read `process.env.DATABASE_URL` from random files. Centralize in `config/env.js` or `db/index.js`.

### Layout

- `models/` (schema) is separate from `db/` (runtime client). They have different responsibilities.
- `drizzle/` (generated migrations) is committed but not hand-edited.
- `drizzle.config.js` lives at the project root.

---

## 10. Extra tips you only learn after a few projects

- **`pgTable("users", ...)` is the **table name** in Postgres. The variable name on the JS side (`usersTable`) is only used in code.** They don't have to match, but keeping them aligned reduces cognitive load.

- **Drizzle Kit is finicky about TypeScript vs JavaScript schema files.** Use one or the other consistently. Mixing `.ts` schemas with a CommonJS app config has caused at least one wasted afternoon.

- **Connection pool size matters.** `pg` defaults are conservative. For a real API:
  ```js
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
  const db = drizzle(pool);
  ```
  Then your app shares the pool. Serverless (per-request connections) is a different story — use a pooler like PgBouncer/Neon.

- **`jsonb` is almost always the right choice over `json`.** Indexable, faster, retains no insignificant whitespace.

- **Generated columns + GIN over `to_tsvector` is the fastest search path** when you outgrow `ilike`.

- **`pg`'s default timestamp parsing** returns `Date` objects, but **timestamp `withTimezone: true` is correctly UTC**. Without TZ, you'll regret it the first time a server moves regions.

- **`drizzle-kit studio` runs locally and reads `drizzle.config.js`** — if the config can't load `.env`, Studio won't connect. Most "Studio is broken" issues are env-loading issues.

- **Don't try to recreate a `WHERE 1=1` query with Drizzle's `and(...)`.** If the array is empty, pass `undefined` to `.where(...)` or skip it conditionally. `and()` with zero args may emit invalid SQL.

- **`returning()` on `update` and `delete` is also fully supported.** Use it whenever you need to know what changed.

- **For "upsert", use `.onConflictDoUpdate(...)` / `.onConflictDoNothing(...)`** — saves a round trip and a race condition.

- **`drizzle-zod` auto-generates Zod schemas from your tables.** Worth adding the moment you have validation needs:
  ```bash
  npm install drizzle-zod
  ```
  ```js
  const { createInsertSchema, createSelectSchema } = require('drizzle-zod');
  const insertUserSchema = createInsertSchema(usersTable);
  ```

- **The fastest way to debug a Drizzle query is to log the SQL it generates.** Most query methods have a `.toSQL()` you can `console.log` during development.

---

## 11. Blockers and how to escape them

The cumulative list across this repo. If you see one of these, jump straight to the fix.

### `drizzle-kit push` reports "No changes" but DB is empty

Schema entry file exported a module object instead of `pgTable` instances.

```js
// WRONG
const usersTable = require('./user.model');
module.exports = { usersTable };
// CORRECT
const { usersTable } = require('./user.model');
module.exports = { usersTable };
```

### `Cannot read properties of undefined (reading 'select')`

You destructured `drizzle()`'s return. It returns the client directly.

```js
// WRONG: const { db } = drizzle(...)
// CORRECT:
const db = drizzle(process.env.DATABASE_URL);
```

### `Failed query: select  from $1   params: [object Object]`

Handed a module export object to `.from(...)`. Destructure first.

```js
const { usersTable } = require("./models");
db.select().from(usersTable);
```

### `ilike is not defined` / `eq is not defined` / ...

Drizzle operators are not globals. Explicit import:

```js
const { eq, ilike, or, and, gt, lt, inArray } = require("drizzle-orm");
```

### Foreign key silently broken

Plural/singular drift between `pgTable("authors", ...)` and the variable `authorTable` (vs `authorsTable`). Match exactly.

### `relation "X" does not exist` after editing schema

Forgot to re-run `push` (or `generate` + `migrate`). Drizzle Kit doesn't watch files.

### `push` vs `generate` drift

Started with `push`, then ran `generate`. The first generated migration assumes an empty DB and conflicts with the live one.

**Recover:** `docker compose down -v` (wipe DB), then `generate` + `migrate` to rebuild from migrations.

### `ECONNREFUSED 127.0.0.1:5432`

Postgres isn't reachable. See [`DOCKER.md`](./DOCKER.md) §6.

### `Unexpected token '"' is not valid JSON` on POST

Not a Drizzle bug — the client double-stringified the JSON body. Use raw JSON body mode.

### Drizzle Studio can't connect

`drizzle.config.js` couldn't load `DATABASE_URL`. Check that `dotenv/config` is imported at the top.

### Pool exhaustion under load

```
Error: connection terminated due to connection timeout
```

Default `pg.Pool` size (10) is hit. Either raise `max`, fix a connection leak (always `await` queries), or move to a connection pooler like PgBouncer.

### Migrations fail with "type already exists"

You ran `generate` against a DB that already has the schema (from `push`). The first migration tries to create existing types/tables.

**Recover:** wipe the DB and re-migrate, OR mark the migration as applied manually (`drizzle-kit` has limited support; usually wiping is faster in dev).

---

## 12. Command cheat sheet

```bash
# Postgres (Docker)
docker compose up -d
docker compose down -v             # wipe data

# Drizzle Kit
npx drizzle-kit push               # push schema directly (dev)
npx drizzle-kit generate           # generate a versioned migration
npx drizzle-kit migrate            # apply pending migrations
npx drizzle-kit studio             # visual DB explorer
npx drizzle-kit drop               # drop a generated migration file

# Inspect from CLI
docker exec -it <container> psql -U postgres -d <db>
\dt                                # list tables (inside psql)
\d <table>                         # describe a table
```

---

## 13. Mental model in one paragraph

`drizzle-kit` is a CLI tool that reads `drizzle.config.js` → finds your schema entry → scans it for `pgTable` exports → diffs against the live DB → either pushes the change directly or writes a versioned migration. `drizzle-orm` is a runtime query builder that takes the **same `pgTable` objects** and gives you typed, composable SQL through method chains. They share only the schema definitions. When something is broken, the question is almost always: *"is the value I gave Drizzle actually a `pgTable` instance, or a wrapper around one?"*

---

## 14. Where to read next

- **[`DOCKER.md`](./DOCKER.md)** — the Postgres container under Drizzle.
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md) §3** — where the DB layer fits in a layered backend.
- **[`book-store/DRIZZLE.md`](./book-store/DRIZZLE.md)** — concrete reference: FK + GIN full-text.
- **[`node-orm/DRIZZLE.md`](./node-orm/DRIZZLE.md)** — first-time learner walkthrough.
