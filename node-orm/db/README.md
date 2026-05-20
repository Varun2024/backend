# db

Purpose
: Central place for database connection bootstrap, pooling, and small helper utilities used by the application to run queries against the local development DB.

Key concepts
- Connection pooling: reuse DB connections via a pool for efficiency and to control concurrency.
- Helper layer: wrap raw DB client calls with small helpers to standardize error handling and result shapes.
- Migrations/seeds: place migration scripts or seed helpers near DB initialization so developers can reproduce state.

Example

```js
const pool = new Pool(config)
module.exports.query = (text, params) => pool.query(text, params)
```

Revision checklist
- Can you start the DB and use `db/index.js` to run a simple `SELECT 1`?
- Is connection config pulled from env vars with sensible defaults?

Practice tasks
1. Add a `withTransaction(fn)` helper that begins a transaction, calls `fn(client)` and commits/rolls back.
2. Create a small seed function that inserts a few sample rows for local testing.
3. Add logging for slow queries (>100ms) to aid debugging.
