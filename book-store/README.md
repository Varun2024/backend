# book-store

Purpose
: A focused Express app demonstrating a small, testable API for CRUD on **books** and **authors**, backed by **PostgreSQL via Drizzle ORM**. This README defines the project's intent, the current API surface, setup, key concepts, and a running mistakes log.

## Tech stack

- **Runtime / framework:** Node.js + Express 5 (CommonJS)
- **Database:** PostgreSQL 18 (via `docker-compose.yml`)
- **ORM / migrations:** Drizzle ORM + `drizzle-kit`
- **Config:** `dotenv`
- **Dev:** `node --watch index.js`

## Setup

```bash
# 1. Start Postgres
docker compose up -d        # exposes postgres on :5432, db = bookstore

# 2. Install deps
npm install

# 3. Configure env — create .env
echo "DATABASE_URL=postgresql://postgres:admin@localhost:5432/bookstore" > .env

# 4. Push schema to DB
npx drizzle-kit push

# 5. Run
npm start                   # node --watch index.js
```

Server starts on `http://localhost:8000`. Hit `/health` to verify.

## Current API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/books` | List books — supports `?search=<query>` full-text search |
| GET | `/books/:id` | Fetch a book by id |
| POST | `/books` | Create a book |
| DELETE | `/books/:id` | Delete a book by id |
| GET | `/authors` | List authors |
| GET | `/authors/:id` | Fetch an author by id |
| GET | `/authors/:id/books` | List all books by author id |
| POST | `/authors` | Create an author |

POST bodies must be valid JSON with `Content-Type: application/json` — not a JSON-encoded string. See the mistakes log below for the gotcha.

Key concepts (what to remember)
- App structure: `index.js` boots the app; routers group endpoints; controllers contain request logic; models handle persistence.
- Separation of concerns: controllers should not access raw HTTP details beyond `req`/`res` and must delegate data work to models.
- Middleware role: cross-cutting concerns (logging, parsing, auth) live as middleware and are executed in registration order.

Concrete example
- Route → Controller → Model flow:

```js
// routes/book.routes.js
router.post('/books', bookController.create)

// controllers/book.controller.js
async function create(req, res) {
	const book = await BookModel.create(req.body)
	res.status(201).json(book)
}
```

Revision checklist (quick)
- Can you list the files that handle: routing, validation, business logic, persistence?
- Can you sketch the lifecycle of one request from incoming HTTP to DB write and back?
- Can you write a unit test for a controller that stubs the model?

Quiz (2 questions)
1. Why should controllers avoid direct DB queries? (Answer: testability, single responsibility, reuse)
2. Where should input validation live and why? (Answer: controller or dedicated validation middleware — keep controllers thin and reusable)

Practice tasks
1. Add input validation middleware that rejects requests missing `title` with HTTP 400.
2. Write one unit test that stubs `BookModel.create` and asserts the controller responds 201.
3. Replace in-memory models with a simple JSON file-backed storage and observe behavior across restarts.

---

## routes/

Purpose
: Define the HTTP surface of the app: map HTTP verbs and paths to controller handlers using Express Router. Routes should remain declarative and small.

Key concepts
- RESTful mapping: resources (books) use consistent HTTP verbs (GET, POST, PUT/PATCH, DELETE).
- Router modularity: use `express.Router()` to group related endpoints and mount them under a path prefix in the app.
- Keep routes declarative: no heavy logic — delegate to controllers and middleware.

Example

```js
const router = require('express').Router()
router.get('/books', bookController.list)
router.post('/books', validateBook, bookController.create)
module.exports = router
```

Revision checklist
- Where are routers mounted in `index.js`? Can you change the prefix to `/api/v1`?
- Are routes free of business logic and delegating to controller functions?

Practice tasks
1. Add `GET /books/search?author=` route and delegate to a controller that uses a model filter.
2. Mount the router under `/api/v1` and ensure all existing requests still work.
3. Add OpenAPI-style comments for one endpoint to practice documenting the surface.

---

## controllers/

Purpose
: Host the functions that translate route requests into application actions. Controllers validate input (or call validators), orchestrate model calls, and format responses.

Key concepts
- Thin controllers: validate → call domain/model → format response. Keep business logic out of controllers.
- Error propagation: throw or call `next(err)` and rely on centralized error middleware for HTTP status mapping and logging.
- Testability: controllers should be easy to test by stubbing models and validators.

Example pattern

```js
// controller
async function getById(req, res, next) {
	try {
		const book = await BookModel.findById(req.params.id)
		if (!book) return res.status(404).json({ error: 'Not found' })
		res.json(book)
	} catch (err) { next(err) }
}
```

Revision checklist
- Can you write a controller that returns 404 for missing resources and 500 on unexpected errors?
- Can you stub `BookModel` in a unit test and assert controller output?

Quick exercises
1. Extract validation into `validators/book.js` and call it from the controller.
2. Add a `wrapAsync` helper to avoid repeated try/catch blocks.
3. Ensure all controllers use uniform error payload shape: `{ error: string, details?: any }`.

---

## models/

Purpose
: Encapsulate persistence and domain rules. Models expose a focused API (CRUD) for controllers and encapsulate data-layer implementation details (in-memory, file, or DB).

Key concepts
- Single responsibility: models only manage data and domain invariants.
- API shape: common methods are `create`, `findById`, `findAll`, `update`, `delete`.
- Storage swap: because controllers talk to model APIs, you can swap in-memory stores for databases without altering controllers.

Example contract

```js
// BookModel API (example)
async create(bookData) // -> saved book
async findById(id) // -> book|null
async findAll(filters) // -> array
async update(id, patch) // -> updated book
async delete(id) // -> boolean
```

Revision checklist
- Can you list the model methods and their expected return values?
- Can you swap the in-memory store for a simple JSON file store and preserve the API?

Practice tasks
1. Implement file-backed persistence (`fs.promises`) for `create` and `findAll`.
2. Add domain validation (unique ISBN) and throw a clear error when it fails.
3. Write tests that assert model methods behave consistently across restarts when using file-backed storage.

---

## middleware/

Purpose
: Provide reusable functions that run before, after, or around route handlers to implement cross-cutting concerns like logging, parsing, auth, and error handling.

Key concepts
- Execution order: middleware runs in registration order; route handlers act like terminal middleware when they send a response.
- Types: application-level, router-level, error-handling (signature `(err, req, res, next)`), and built-in middleware (body parser).
- Attaching data: middleware may augment `req` (e.g., `req.user`) but should avoid surprising side effects.

Concrete examples

```js
// logger middleware
function logger(req, res, next) {
	const start = Date.now()
	res.on('finish', () => console.log(req.method, req.url, Date.now()-start))
	next()
}

// error handler
function errorHandler(err, req, res, next) {
	console.error(err)
	res.status(err.status || 500).json({ error: err.message })
}
```

Revision checklist
- Can you add a middleware to measure and log request duration?
- Do you understand where to place error-handling middleware (after all routes)?

Practice tasks
1. Implement a request-duration middleware and verify logs include duration.
2. Add an auth stub middleware that sets `req.user` and gate a protected route.
3. Convert a synchronous function into middleware and observe error propagation to the error handler.

---

## Notes — Mistakes Made (Lessons Learned)

A running log of bugs hit while building this project, the root cause, and the fix. Re-read this before starting similar work.

### 1. Drizzle `push` reported "No changes" even though models existed

**Symptom:** `npx drizzle-kit push` detected zero changes; PostgreSQL stayed empty.

**Root cause:** In `models/index.js`, tables were imported with:
```js
const booksTable = require('./book.model')
```
That assigns the entire `module.exports` object (`{ booksTable: <pgTable> }`) to the variable — not the `pgTable` instance itself. Drizzle's schema scanner needs direct `pgTable` exports, so it saw "no tables".

**Fix:** Destructure the named export:
```js
const { booksTable } = require('./book.model')
const { authorsTable } = require('./author.model')
```

**Takeaway:** Drizzle's schema scanner needs *direct* `pgTable` instances exported from the schema entry file. Always destructure named exports.

### 2. Foreign key broken by naming mismatch

**Symptom:** FK references failed to resolve in `book.model.js`.

**Root cause:** Import and FK reference used `authorTable` while the actual export was `authorsTable` (plural). One character, completely silent break.

**Fix:** Match export and import names exactly — `authorsTable` everywhere.

**Takeaway:** Keep table names consistent across files. Plural vs singular matters.

### 3. `localhost:8000` returned 404

**Symptom:** Server logs "Http server running at port 8000", but hitting `http://localhost:8000` returned `Cannot GET /`.

**Root cause:** `index.js` only mounts `/books`:
```js
app.use("/books", bookRouter)
```
There is no handler for `/`. Express correctly returns 404.

**Fix:** Hit `http://localhost:8000/books` instead, or add a root route:
```js
app.get('/', (req, res) => res.send('OK'))
```

**Takeaway:** "Server is running" ≠ "every path responds". Only registered routes work.

### 4. `Cannot read properties of undefined (reading 'select')`

**Symptom:** Hitting `/books` threw `TypeError: Cannot read properties of undefined (reading 'select')` from the controller's `db.select()`.

**Root cause:** `db/index.js` destructured the wrong shape:
```js
const { db } = drizzle(process.env.DATABASE_URL)  // WRONG
```
`drizzle()` returns the db instance *directly*, not an object wrapping it. So `db` ended up `undefined`, and `db.select()` blew up.

**Fix:**
```js
const db = drizzle(process.env.DATABASE_URL)
module.exports = db
```

**Takeaway:** Check what a factory function actually returns before destructuring. Drizzle's `drizzle()` returns the db client, not `{ db }`.

### 5. `ilike is not defined` when adding `?search=`

**Symptom:** Implementing full-text search on `/books?search=` blew up with `ReferenceError: ilike is not defined`.

**Root cause:** Used `ilike(...)` in the query without importing it from `drizzle-orm`. Drizzle SQL helpers (`eq`, `ilike`, `or`, `and`, etc.) are *not* globals — each must be explicitly imported.

**Fix:**
```js
const { ilike, or } = require("drizzle-orm")
```

**Takeaway:** Every Drizzle operator needs an explicit import. The error is a plain `ReferenceError`, not a Drizzle-specific message — easy to misread.

### 6. `Failed query: select  from $1` on `/authors`

**Symptom:** `GET /authors` returned `Error: Failed query: select  from $1   params: [object Object]`. Note the empty column list and `$1` placeholder where a table should be.

**Root cause:** Passed the **module export object** to `db.select().from(...)` instead of the actual `pgTable`:
```js
const authorsTable = require("../models/author.model")   // WRONG — gets the whole module
db.select().from(authorsTable)                            // Drizzle binds it as a parameter
```

**Fix:** Destructure the named export, same root cause family as mistake #1:
```js
const { authorsTable } = require("../models/author.model")
```

**Takeaway:** When Drizzle emits `select  from $1`, it's telling you it received a value it can't recognize as a table — usually a module-shape mistake.

### 7. `Unexpected token '"', "\"{\n  \"fi"... is not valid JSON` on POST `/authors`

**Symptom:** Posting an author body crashed `body-parser`'s JSON parser with `SyntaxError: Unexpected token '"'`. The truncated payload `"{\n  \"fi"...` is the giveaway.

**Root cause:** The client sent a **JSON-encoded string** (the JSON body was wrapped in quotes and re-escaped) instead of a raw JSON object. `express.json()` then tried to parse a string that starts with `"`, which is technically valid JSON (a string literal) but not the object the handler expected — and depending on the client, sometimes ends up double-stringified and fails outright.

**Fix:**
- Send a raw JSON object, not a stringified one:
  ```http
  POST /authors
  Content-Type: application/json

  { "firstName": "Ada", "lastName": "Lovelace", "email": "ada@x.com" }
  ```
- In Postman/Thunder Client, choose **Body → raw → JSON**, not "Text" with a manually quoted JSON string.

**Takeaway:** "Not valid JSON" errors that start with a `"` token almost always mean the body was stringified twice. Check the client's content type and body mode before blaming the server.

### 8. Author POST succeeded but response was unhelpful

**Symptom:** `POST /authors` actually inserted the row, but the response gave the client nothing useful to act on.

**Root cause:** The handler returned a bare success message with no inserted id, so the client couldn't follow up (e.g. fetch the new author or attach books to it).

**Fix:** Use Drizzle's `.returning(...)` to surface the new id and respond with a meaningful payload:
```js
const [result] = await db.insert(authorsTable).values({ firstName, lastName, email })
  .returning({ id: authorsTable.id })
res.status(201).json({ message: "Author added", id: result.id })
```

**Takeaway:** Write endpoints assume the next call. A create endpoint should return at least the new resource's id (and ideally the full row) so the client doesn't need a second round-trip to find what it just made.

### General lessons

- **Read return shapes carefully.** Three of the four bugs above were destructuring mistakes — wrong assumption about what a value looks like.
- **Match exported names exactly.** Plural/singular drift is silent and painful.
- **"Server running" only proves the listener bound a port.** Routing is a separate concern; test each route.
- **When Drizzle says "no changes," suspect the schema entry file first** — it usually means the scanner couldn't find tables, not that the DB is in sync.
