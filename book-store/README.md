# book-store

Purpose
: A focused Express app demonstrating a small, testable API for CRUD operations on books. This README defines the project's intent, core concepts to revisit, and concrete ways to rehearse them.

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
