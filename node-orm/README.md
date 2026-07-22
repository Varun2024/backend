# Drizzle ORM: First Contact

> One-sentence hook: how to talk to Postgres from Node without writing raw SQL strings by hand.

## What is an ORM (and Drizzle)?

An **ORM** (Object-Relational Mapper) or **query builder** lets you describe database tables as JavaScript objects and write queries as chained method calls instead of SQL strings. It handles connection pooling, parameter escaping, and gives you IDE autocomplete on column names.

**Drizzle** is a lightweight, TypeScript-first query builder. Unlike heavier ORMs (Sequelize, TypeORM), it stays close to SQL — `db.select().from(userTable)` reads almost like `SELECT * FROM users`. That's a good middle ground: type safety without magic.

For the deep-dive setup guide (docker-compose Postgres, migrations, drizzle-kit commands), see **[DRIZZLE.md](./DRIZZLE.md)**. This README is just the "what is it and how does the code work" intro.

## Why it matters

Every backend eventually needs a database. Writing raw SQL strings is fine for tiny scripts but becomes error-prone at scale (SQL injection, typos in column names, schema drift). A query builder catches many of these at write time.

## The code in this folder

Three tiny files show the three parts of any ORM-backed app.

### `drizzle/schema.js` — the schema

```js
const { pgTable, integer, varchar } = require('drizzle-orm/pg-core');

const userTable = pgTable('users', {
    id: integer('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
});
```

This is the JavaScript description of a Postgres table. `pgTable('users', {...})` says "there is a table named `users` with these columns". Drizzle uses this to generate SQL and to type-check your queries.

### `db/index.js` — the connection

```js
const { drizzle } = require('drizzle-orm/node-postgres');
const db = drizzle(process.env.DATABASE_URL);
module.exports = db;
```

`drizzle(url)` opens a connection pool to Postgres using the URL from `.env`. `db` is your handle for all queries.

### `index.js` — a query

```js
require('dotenv/config');
const db = require('./db');
const { userTable } = require('./drizzle/schema');

async function getAllUsers() {
  const users = await db.select().from(userTable);
  console.log(`All users: ${JSON.stringify(users)}`);
  return users;
}
getAllUsers();
```

`db.select().from(userTable)` compiles to `SELECT id, name, email FROM users`. The result is a plain array of objects. There's also an unused `createUser` that shows `db.insert(userTable).values({...})`.

## Run it

You need Postgres running and a `.env` file with `DATABASE_URL=postgres://user:pass@localhost:5432/dbname`. The included `docker-compose.yml` can start one:

```bash
docker compose up -d
npm install
node index.js
```

See [DRIZZLE.md](./DRIZZLE.md) for the full workflow (generating migrations, `drizzle-kit push`, etc.).

## Try this next

1. Uncomment/call `createUser({ id: 1, name: 'Ada', email: 'ada@x.com' })`, then re-run `getAllUsers()`.
2. Add a `WHERE` clause: `import { eq } from 'drizzle-orm'` and `db.select().from(userTable).where(eq(userTable.id, 1))`.
3. Add a new column (e.g. `createdAt`) in `schema.js`, then run `drizzle-kit push` and re-query.

## Gotchas

- **Schema drift.** Editing `schema.js` doesn't change the database. You must run a migration (`drizzle-kit push` or `generate` + `migrate`) to keep them in sync.
- **`DATABASE_URL` missing.** Without `dotenv/config` at the top, `process.env.DATABASE_URL` is `undefined` and connection fails silently.
- **Integer `id` primary key without auto-increment.** This schema declares `id` as `integer` but not `serial`/`identity`. You must supply an `id` on insert, or switch to `integer('id').primaryKey().generatedAlwaysAsIdentity()`.
- **Connections not closed.** For scripts, add `process.exit(0)` after your query, or the Node process hangs on the open pool.
