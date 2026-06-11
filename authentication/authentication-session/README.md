# authentication-session

Purpose
: An Express app for exploring **session-based authentication** — server-side sessions, cookies, and protected routes. Uses **pnpm** as the package manager and ES Modules (`"type": "module"`).

## Tech stack

- **Runtime:** Node.js (with `--watch` for dev hot reload)
- **Framework:** Express 5
- **Package manager:** pnpm (`^11.5.2`) — pinned via `devEngines.packageManager` with `onFail: "download"`, so a missing/wrong pnpm version is auto-fetched.
- **Module system:** ESM (`import`/`export`)

## Setup steps — Express backend with pnpm

These are the steps used to bootstrap this directory. Use them as a template for any new pnpm + Express service.

### 1. Initialize the project

```bash
mkdir authentication-session
cd authentication-session
pnpm init
```

`pnpm init` creates `package.json`. Edit it to add `"type": "module"` so `import` syntax works without a build step.

### 2. Pin pnpm as the package manager

Add this to `package.json` so contributors don't accidentally use npm/yarn:

```json
"devEngines": {
  "packageManager": {
    "name": "pnpm",
    "version": "^11.5.2",
    "onFail": "download"
  }
}
```

`onFail: "download"` makes pnpm fetch the correct version automatically when missing.

### 3. Install Express

```bash
pnpm add express
pnpm add -D @types/express @types/node
```

- `pnpm add` → runtime dependency
- `pnpm add -D` → dev-only (type definitions for editor IntelliSense)

### 4. Add run scripts

In `package.json`:

```json
"scripts": {
  "start": "node index.js",
  "dev": "node --watch index.js"
}
```

`node --watch` re-runs the file on save — no `nodemon` needed in modern Node.

### 5. Minimal server (`index.js`)

```js
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
  return res.json({ status: 'server ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

### 6. Run

```bash
pnpm dev      # auto-reload on changes
pnpm start    # plain start
```

Open `http://localhost:8000` → `{"status":"server ok"}`.

## pnpm cheatsheet

| Task | Command |
|------|---------|
| Install all deps | `pnpm install` |
| Add runtime dep | `pnpm add <pkg>` |
| Add dev dep | `pnpm add -D <pkg>` |
| Remove dep | `pnpm remove <pkg>` |
| Run script | `pnpm <script>` (e.g. `pnpm dev`) |
| Update deps | `pnpm update` |
| Audit | `pnpm audit` |

## Why pnpm over npm

- **Disk-efficient:** packages are stored once in a global content-addressable store and hard-linked into `node_modules`.
- **Strict by default:** prevents accidental access to non-declared dependencies (phantom deps).
- **Fast:** parallel installs, smarter resolution.

## Planned learning checkpoints

- [ ] Add `express-session` and configure a session store (memory → Redis later)
- [ ] Login / logout routes that set and destroy the session
- [ ] `requireAuth` middleware that gates protected routes
- [ ] Cookie flags: `httpOnly`, `secure`, `sameSite`
- [ ] Session fixation & CSRF protection notes
