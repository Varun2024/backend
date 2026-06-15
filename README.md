# Backend Learning Lab

A collection of small, self-contained Node.js backend projects. Each subdirectory explores one concept end-to-end — raw HTTP, Express, ORMs, real-time, auth — so that revisiting a topic later means opening *one* folder, not untangling a monorepo.

> **If you just opened this repo:** start with [Repo map](#repo-map), then read [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how a real backend is structured, and [`IDEAS.md`](./IDEAS.md) when looking for the next thing to build.

---

## Repo map

Projects are sorted roughly by complexity — earlier ones are foundational, later ones combine multiple concepts.

| # | Directory | Concept | Stack | PM |
|---|-----------|---------|-------|-----|
| 1 | `http-server/` | The raw Node `http` module — no framework | Node only | npm |
| 2 | `http2/` | HTTP/2 streams and server push | Node only | npm |
| 3 | `buffers/` | Binary data with `Buffer` | Node only | npm |
| 4 | `events/` | `EventEmitter` patterns | Node only | npm |
| 5 | `express-server/` | Minimal Express app | Express | npm |
| 6 | `node-orm/` | ORM fundamentals | Node + ORM | npm |
| 7 | `book-store/` | Full CRUD: routes → controllers → models, Postgres + Drizzle, full-text search | Express + Drizzle + Postgres | npm |
| 8 | `tweet/` | Tweet-style API experiment | Express | npm |
| 9 | `chatApp/` | Real-time chat | Express + sockets | npm |
| 10 | `authentication/authentication-session/` | Session-based auth, ES Modules | Express 5 + Drizzle + Postgres | **pnpm** |

Each subdirectory has its own `README.md` covering purpose, setup, key concepts, and (where applicable) a **Mistakes Made** log of bugs hit and how they were fixed.

---

## Quick start (any project)

```bash
cd <project>
# npm-based projects:
npm install && npm start
# pnpm-based projects (currently: authentication-session):
pnpm install && pnpm dev
```

Projects that need Postgres ship a `docker-compose.yml`:

```bash
docker compose up -d
```

Most servers bind to `http://localhost:8000`. Hit `/health` first when one exists.

---

## How to use this repo for learning

A practical loop that has worked well here:

1. **Pick a concept** from [`ARCHITECTURE.md`](./ARCHITECTURE.md) or [`IDEAS.md`](./IDEAS.md).
2. **Find the closest existing project** in the [repo map](#repo-map) and re-read its README.
3. **Open its mistakes log** — the bugs there are usually the ones that block you too.
4. **Build a new directory** rather than mutating an existing one — keep each experiment isolated.
5. **Update the mistakes log** when you hit something new. Future-you will thank present-you.

---

## Repo conventions

- One concept per directory. Don't reach across directories — copy and adapt.
- Every subdirectory ships a `README.md` with: **Purpose**, **Setup**, **API surface** (if applicable), **Key concepts**, **Mistakes log**.
- Prefer **ES Modules** (`"type": "module"`) for new projects.
- Use **`node --watch`** for dev — no `nodemon`.
- Pin the package manager via `devEngines.packageManager` so contributors can't mix npm/yarn/pnpm.
- Secrets in `.env`, never committed. `.env.example` shows the shape.
- Each new bug worth remembering gets a numbered entry in that project's mistakes log: **Symptom → Root cause → Fix → Takeaway**.

---

## Where to read next

Root-level guides (general, reusable across any project):

- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — how a scalable backend is laid out, the layers, and the approaches that actually hold up under growth.
- **[`DOCKER.md`](./DOCKER.md)** — running Postgres (and friends) under Docker for backend dev. Compose templates, blockers, hygiene.
- **[`DRIZZLE.md`](./DRIZZLE.md)** — general Drizzle ORM + Postgres setup, best practices, query catalog, and a cumulative blockers list.
- **[`IDEAS.md`](./IDEAS.md)** — future project ideas, grouped by difficulty and the skill they exercise.

Project-specific deep dives:

- **[`book-store/README.md`](./book-store/README.md)** — the richest mistakes log in the repo. Drizzle / Express / Postgres pitfalls live there.
- **[`book-store/DRIZZLE.md`](./book-store/DRIZZLE.md)** — concrete reference: FK + GIN full-text search.
- **[`node-orm/DRIZZLE.md`](./node-orm/DRIZZLE.md)** — first-time Drizzle learner walkthrough.
- **[`authentication/authentication-session/README.md`](./authentication/authentication-session/README.md)** — pnpm + Express 5 + ESM bootstrap template.
