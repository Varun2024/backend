# Express: Minimal Server

> One-sentence hook: how a framework replaces the giant `switch` statement you'd otherwise write over `node:http`.

## What is Express?

Express is the most popular Node web framework. It's a thin layer on top of the built-in `http` module that gives you:

- A **router**: map `METHOD + path` → handler function.
- **Middleware**: functions that run in sequence on every request (body parsing, auth, logging).
- **Response helpers**: `res.send`, `res.json`, `res.status(...)` instead of raw `writeHead`/`end`.

Mental model: Express takes the "which handler runs for this request?" decision that you'd hand-write with `if (req.url === '/'...)` and turns it into a declarative table.

## Why it matters

Once your app has more than three routes, hand-rolling routing over `node:http` gets painful — nested switches, no URL params, manual body parsing. Express (or a peer like Fastify, Koa, Hono) is the standard next step. Almost every Node backend job asks about it.

## The code in this folder

`index.js`:

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to the home page!');
});

app.get('/contact-us', (req, res) => {
  res.send('Welcome to the contact us page!');
});

app.post('/tweet', (req, res) => {
  res.status(201).send('Tweet created successfully!');
});

app.get('/tweet/:id', (req, res) => {
  const tweetId = req.params.id;
  res.send(`You requested tweet with ID: ${tweetId}`);
});

app.listen(8000, () => {
  console.log('Server is listening on port 8000');
});
```

Key ideas:

- `express()` returns an app object. It's a function itself (compatible with `http.createServer(app)`), which is a fun implementation detail.
- `app.get(path, handler)` / `app.post(path, handler)` register routes for specific HTTP methods. Compare against the tweet folder's `switch(method) { switch(url) { ... } }` — Express is the abstraction that eliminates that pattern.
- `res.send(body)` — sets `Content-Type` heuristically (text vs JSON) and closes the response. No `writeHead`/`end` required.
- `res.status(201).send(...)` — chainable. `201 Created` is the correct status for a successful POST that made something new.
- `'/tweet/:id'` — `:id` is a **URL parameter**. Express parses it and puts the value on `req.params.id`. Try `GET /tweet/42` and see the response.

## Run it

```bash
npm install
node index.js
```

Then:

```bash
curl http://localhost:8000/
curl http://localhost:8000/contact-us
curl -X POST http://localhost:8000/tweet
curl http://localhost:8000/tweet/42
```

## Try this next

1. Add `app.use(express.json())` and a `POST /echo` route that returns `req.body`. Send it JSON with `curl -X POST -H 'Content-Type: application/json' -d '{"a":1}' http://localhost:8000/echo`.
2. Add a logger middleware: `app.use((req, res, next) => { console.log(req.method, req.url); next(); });`. Watch it fire on every request.
3. Add `GET /tweet` that returns a JSON list. Then compare this file's line count to the raw-`http` version in `../tweet/index.js`.

## Gotchas

- **Forgetting `next()` in middleware** — the request just hangs, no error.
- **Sending twice** — `res.send(...)` then `res.send(...)` throws "Cannot set headers after they are sent".
- **Body parser not enabled** — `req.body` is `undefined` until you add `app.use(express.json())` (or `express.urlencoded`).
- **Route order matters** — the first matching route wins. Put specific routes before wildcards.
