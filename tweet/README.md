# Manual Routing over `node:http`

> One-sentence hook: what routing looks like when you don't have Express — nested switches on method and URL, plus a hand-rolled request log.

## What is manual routing?

Before you reach for Express, it's worth writing routing by hand once. That means: on every incoming request, look at `req.method` and `req.url`, and pick a response based on those two values. It's ugly, but it's exactly what every framework does under the hood.

## Why it matters

- Makes you appreciate what Express gives you for free.
- Lets you build zero-dependency micro-services when Express would be overkill.
- Teaches you that "routing" is not magic — it's just conditionals.

## The code in this folder

`index.js` — a raw-`http` server that handles a handful of routes and logs every request to `server.log`:

```js
const http = require('node:http');
const fs = require('node:fs');

const server = http.createServer((req, res) => {
  const method = req.method;
  const url = req.url;
  const log = `${Date.now()}: ${method} ${url}`;
  fs.appendFileSync('server.log', log + '\n', 'utf-8');

  switch (method) {
    case 'GET': {
      switch (url) {
        case '/':
          return res.writeHead(200).end('Welcome to the home page!');
        case '/contact-us':
          return res.writeHead(200).end('Welcome to the contact us page!');
        case '/tweet':
          return res.writeHead(200).end('t-1\nt-2\nt-3');
        default:
          return res.writeHead(404).end('Page not found!');
      }
    }
    case 'POST': {
      switch (url) {
        case '/tweet':
          return res.writeHead(200).end('Tweet created successfully!');
        default:
          return res.writeHead(404).end('Page not found!');
      }
    }
  }
});

server.listen(8000, () => {
  console.log('Server is listening on port 8000');
});
```

Things to notice:

- **Nested switch on `method` then `url`** is the "table" a framework's router would express as `app.get('/', ...)`. Compare directly with `../express-server/index.js` — same behavior, fewer lines.
- `fs.appendFileSync` writes each request as a line to `server.log`. It's synchronous, so it blocks the event loop briefly on every request. Fine for learning, bad for production — real apps use `fs.appendFile` (async) or a logging library like pino.
- `res.writeHead(200).end('...')` chains — `writeHead` returns the response so you can `.end` on it.
- No fallthrough for unmatched methods (PUT, DELETE): the switch just ends and `res` is never finished. Client hangs. That's a bug.

## Run it

```bash
npm install   # no runtime deps, but harmless
node index.js
```

Test:

```bash
curl http://localhost:8000/
curl http://localhost:8000/tweet
curl -X POST http://localhost:8000/tweet
curl http://localhost:8000/unknown   # 404
```

Check `server.log` — every request is appended.

## Try this next

1. Add a case for `PUT` or fix the missing default so PUT/DELETE don't hang.
2. Read a POST body: on `POST /tweet`, listen to `req.on('data', chunk => ...)` and `req.on('end', () => ...)` to collect and parse the request body. This is exactly what `express.json()` does for you.
3. Swap `appendFileSync` for `appendFile` (async with callback). Notice you now have to think about ordering.

## Gotchas

- **`appendFileSync` blocks the event loop.** Every request pauses Node briefly while the write completes. Fine for a demo, terrible under load.
- **Missing default arms** leave `res` un-ended and the client hangs. Always end the response on every path.
- **No body parsing.** POST bodies here are ignored — the code just responds to the URL. Reading the body requires stream handling.
- **URLs with query strings** — `req.url` is the full path including `?a=1`. Use `new URL(req.url, 'http://x')` to parse.
