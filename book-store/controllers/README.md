# controllers

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
