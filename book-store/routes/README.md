# routes

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
