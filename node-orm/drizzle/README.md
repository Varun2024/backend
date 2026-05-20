# drizzle

Purpose
: Show how Drizzle defines table schemas and how to write type-safe queries that map DB rows to JS objects.

Key concepts
- Schema DSL: table definitions describe columns, types, and constraints in a central file (`schema.js`).
- Typed queries: Drizzle provides a typed query interface so query results match declared column shapes.
- Migrations vs runtime sync: prefer explicit migrations for production and schema sync or dev-only scripts for local iteration.

Revision checklist
- Can you locate the table definitions in `schema.js` and name their columns and types?
- Can you write a simple select using the Drizzle query builder and log results?

Practice tasks
1. Add a `books` table schema entry with `id`, `title`, `isbn`, `created_at`.
2. Use Drizzle to insert a book and read it back in a small script.
3. Add a migration file that creates the table and apply it to the local Docker DB.
