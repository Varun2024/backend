# middleware

Purpose
: Provide reusable functions that run before, after, or around route handlers to implement cross-cutting concerns like logging, parsing, auth, and error handling.

Key concepts
- Execution order: middleware runs in registration order; route handlers act like terminal middleware when they send a response.
- Types: application-level, router-level, error-handling (signature (err, req, res, next)), and built-in middleware (body parser).
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
