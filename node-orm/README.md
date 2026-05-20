# node-orm

Summary: Examples showing how to use an ORM/Query builder (drizzle) and basic DB connectivity with Docker in this project.

What was learned:

Revision exercises:
1. Inspect `drizzle.config.js` and identify connection settings.
2. Run a simple SELECT using the provided `index.js` DB helper.
3. Add a new table schema and run migration or schema sync.
# node-orm

Purpose
: Demonstrates using a query builder/ORM (Drizzle) for schema definition and DB access, and shows patterns for local DB development with Docker.

Key concepts
- Schema definition: describe tables and columns in a central schema file and keep types synchronized (JS ↔ DB).
- Query builder vs ORM: choose minimal abstraction (Drizzle) for typed queries without heavy ActiveRecord patterns.
- Local DB via Docker: run a disposable DB for development and tests to avoid host machine dependencies.

Revision checklist
- Can you find connection config in `drizzle.config.js` and explain each field?
- Can you run a simple read query using the project's DB helper (`index.js`)?

Practice tasks
1. Start the project's DB using `docker-compose` and run the node script that queries the DB.
2. Add a new table definition and write a small insert+select flow to validate the schema.
3. Write a migration or schema-sync step and verify the change is applied.
