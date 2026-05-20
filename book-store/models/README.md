# models

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
