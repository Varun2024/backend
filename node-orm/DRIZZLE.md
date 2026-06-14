# Drizzle ORM + PostgreSQL — First-Time Setup Guide

This directory is the *learning sandbox* for Drizzle. The goal here isn't to build a real app — it's to internalize how Drizzle, Drizzle Kit, Postgres, and your code all connect. Read this top-to-bottom the first time; treat it as reference after.

> For a more complete reference with FKs, indexes, and a richer query catalog, see [`book-store/DRIZZLE.md`](../book-store/DRIZZLE.md). This file is the on-ramp.

---

## 1. Two packages, two jobs — internalize this first

The single biggest source of confusion when starting with Drizzle is treating it as one thing. It's two:

| Package | What it is | When it runs | Where it's used |
|---------|-----------|--------------|-----------------|
| **`drizzle-orm`** | Runtime query builder | Inside your app | `db/index.js`, route handlers |
| **`drizzle-kit`** | Dev CLI tool | At the terminal | `drizzle.config.js`, `npx drizzle-kit ...` |

They share only **the schema definitions** (the `pgTable(...)` exports). Keep that fact in your head — every blocker you'll hit traces back to it.

---

## 2. The full setup, end-to-end

### Step 1: Install

```bash
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit
```

| Package | Why |
|---------|-----|
| `drizzle-orm` | The ORM you query with |
| `pg` | The actual Postgres driver under Drizzle |
| `dotenv` | Loads `DATABASE_URL` from `.env` |
| `drizzle-kit` | CLI for migrations, push, studio |

### Step 2: Run Postgres locally with Docker

`docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:18.3
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: learn_orm
    ports:
      - "5432:5432"
```

```bash
docker compose up -d
```

Why Docker: no system-wide install, no version drift, throw it away with `docker compose down -v` when done.

### Step 3: `.env`

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/learn_orm
```

Format breakdown:
```
postgresql://<user>:<password>@<host>:<port>/<database>
```

`.env` should be in `.gitignore`. Ship a `.env.example` so the next person knows the shape.

### Step 4: `drizzle.config.js` — Drizzle Kit's instructions

```js
require("dotenv/config");
const { defineConfig } = require("drizzle-kit");

module.exports = defineConfig({
  dialect: "postgresql",         // which DB engine
  out: "./drizzle",               // where generated migrations go
  schema: "./drizzle/schema.js",  // where Drizzle Kit looks for pgTable exports
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

**Mental model:** this file is read **only** by the `drizzle-kit` CLI. The app itself never imports it.

### Step 5: Define a table — `drizzle/schema.js`

```js
const { pgTable, uuid, varchar, integer } = require("drizzle-orm/pg-core");

const usersTable = pgTable("users", {
  id:    uuid().primaryKey().defaultRandom(),
  name:  varchar({ length: 100 }).notNull(),
  email: varchar({ length: 100 }).notNull().unique(),
  age:   integer(),
});

// CRITICAL: export pgTable instances DIRECTLY.
// Drizzle Kit scans this file for them.
module.exports = { usersTable };
```

Three rules to keep this file healthy:

1. **Each value exported must be a `pgTable` instance** — not an object containing one.
2. **Use `.notNull()` on every non-optional column.** Make nullable an explicit choice.
3. **Use `uuid().defaultRandom()` for primary keys** unless you have a reason not to.

### Step 6: Push the schema → Postgres

```bash
npx drizzle-kit push
```

This compares your schema to the database and applies the diff directly — fast for prototypes, no migration file produced.

Want versioned migrations instead (the real-project workflow)?

```bash
npx drizzle-kit generate   # writes a .sql file in ./drizzle/
npx drizzle-kit migrate    # applies pending migrations
```

### Step 7: The runtime client — `db/index.js`

```js
require("dotenv/config");
const { drizzle } = require("drizzle-orm/node-postgres");

const db = drizzle(process.env.DATABASE_URL);

module.exports = db;
```

**Two things will trip you up here:**

- `drizzle()` returns the db client **directly**. Do **not** do `const { db } = drizzle(...)`.
- `drizzle-orm/node-postgres` — the import path encodes which driver. There are different paths for `neon-http`, `postgres-js`, `mysql2`, etc.

### Step 8: Query — `index.js`

```js
require("dotenv/config");
const db = require("./db");
const { usersTable } = require("./drizzle/schema");
const { eq } = require("drizzle-orm");

async function main() {
  // Insert
  const [created] = await db.insert(usersTable)
    .values({ name: "Ada", email: "ada@example.com", age: 36 })
    .returning();

  // Select all
  const all = await db.select().from(usersTable);

  // Select by column
  const ada = await db.select().from(usersTable)
    .where(eq(usersTable.email, "ada@example.com"))
    .limit(1);

  console.log({ created, all, ada });
}

main();
```

**Notice:** `eq` is an explicit import. Every operator (`eq`, `ilike`, `or`, `and`, `gt`, `lt`, ...) must be imported from `drizzle-orm`. None of them are globals.

### Step 9: Inspect visually

```bash
npx drizzle-kit studio
```

Opens a local web UI for browsing the DB. Useful for verifying inserts without writing a SELECT.

---

## 3. Best practices, even at this stage

These habits scale — get them in muscle memory now.

- **One `pgTable` per file** once you have more than two.
- **The schema entry file in `drizzle.config.js` must export `pgTable` instances directly.** Never an object wrapping them.
- **Match plural/singular consistently** between file/variable/table name. `usersTable` → `pgTable("users", ...)` → `{ usersTable }`.
- **Set `.notNull()` aggressively.** Nullable should be a decision, not an oversight.
- **Use arrow functions for FK references:** `references(() => usersTable.id)` — avoids circular-import landmines.
- **Always `.returning()` after insert/update** so the next code path knows the new id.
- **One `db` client per process.** Export from `db/index.js`. Never call `drizzle()` per request.
- **Validate `DATABASE_URL` at boot.** Throw immediately if it's missing; don't discover it on the first query.
- **Pick `push` OR `generate/migrate` per project from day one** — mixing them produces drift you have to manually untangle.

---

## 4. Blockers you will hit (and how to escape)

These are not hypothetical — they're the bugs hit in this repo, distilled.

### "I ran `push`, it said no changes, but my DB is empty"

You exported the wrong shape from the schema entry file.

```js
// WRONG — assigns the whole module to usersTable
const usersTable = require('./users.model');
module.exports = { usersTable };

// CORRECT — destructure the named export first
const { usersTable } = require('./users.model');
module.exports = { usersTable };
```

Drizzle Kit's scanner only recognizes direct `pgTable` exports.

---

### `Cannot read properties of undefined (reading 'select')`

`db` is `undefined` because you destructured `drizzle()`'s return value.

```js
// WRONG
const { db } = drizzle(process.env.DATABASE_URL);
// CORRECT
const db = drizzle(process.env.DATABASE_URL);
```

`drizzle()` returns the client **directly**.

---

### `Failed query: select  from $1   params: [object Object]`

You handed a **module export object** to `.from(...)` instead of a `pgTable`.

```js
// WRONG
const usersTable = require("./drizzle/schema");
db.select().from(usersTable);   // usersTable is the WHOLE module here

// CORRECT
const { usersTable } = require("./drizzle/schema");
db.select().from(usersTable);
```

The empty column list and `$N` placeholder are the tell — Drizzle didn't recognize the value as a table, so it bound it as a parameter.

---

### `ilike is not defined` (or `eq is not defined`, `or is not defined`, ...)

Drizzle operators are not globals. Import every one you use:

```js
const { eq, ilike, or, and, gt, lt } = require("drizzle-orm");
```

---

### `ECONNREFUSED 127.0.0.1:5432`

Postgres isn't reachable. Walk this checklist:

1. Is Docker running? `docker ps` — should show the Postgres container.
2. If not: `docker compose up -d`.
3. Is the port mapped correctly? `5432:5432` in `docker-compose.yml`, same port in `DATABASE_URL`.
4. Is the password right? Compare `POSTGRES_PASSWORD` and the URL.
5. Did the container restart without a volume and lose state? Add a volume if persistence matters between runs.

---

### `relation "users" does not exist` after editing the schema

You forgot to re-run `push` (or `generate` + `migrate`). Drizzle Kit doesn't watch files — it only updates the DB when you ask.

```bash
npx drizzle-kit push
```

---

### `push` and `generate` disagree

You started with `push`, then ran `generate` later. The first generated migration assumes an empty DB and conflicts with what `push` already created.

**Fix:** Pick one workflow per project from day one. To switch: drop the DB (`docker compose down -v`), run `generate`, then `migrate` to recreate cleanly.

---

## 5. Command cheat sheet

```bash
# Postgres lifecycle
docker compose up -d              # start
docker compose down               # stop
docker compose down -v            # stop AND wipe data

# Drizzle Kit
npx drizzle-kit push              # push schema directly (dev workflow)
npx drizzle-kit generate          # generate a versioned migration (prod workflow)
npx drizzle-kit migrate           # apply pending migrations
npx drizzle-kit studio            # visual DB explorer
npx drizzle-kit drop              # drop a generated migration file

# Inspect the DB from CLI
docker exec -it <container_name> psql -U postgres -d learn_orm -c "\dt"
```

---

## 6. The one-paragraph mental model

`drizzle-kit` is a CLI tool that reads `drizzle.config.js` → finds your schema file → scans it for `pgTable` exports → diffs against the live database → pushes the changes (or writes a migration file). `drizzle-orm` is a runtime library that takes the **same `pgTable` objects** and lets you write queries through method chains. They share only the schema definitions. When something breaks, the question is almost always: *"is the value I gave Drizzle actually a `pgTable` instance, or some wrapper around one?"*

---

## 7. Where to go next

Once this directory makes sense:

- Read [`book-store/DRIZZLE.md`](../book-store/DRIZZLE.md) for foreign keys, GIN indexes, full-text search, transactions, and the longer blockers log.
- Re-read [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §3 (Database) for what's the same regardless of ORM.
- Build something from [`../IDEAS.md`](../IDEAS.md) that needs at least two tables with a relation between them.
