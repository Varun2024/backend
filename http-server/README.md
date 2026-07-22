# Raw HTTP Server

> One-sentence hook: how a Node server actually accepts a request and sends a response, without a framework in the way.

## What is the `http` module?

`http` is a built-in Node module (no install needed) that lets you open a TCP port and answer HTTP requests directly. You give it a callback that receives two objects — `req` (what the client sent) and `res` (what you write back) — and Node handles the socket wiring underneath. Think of it as the bare metal that Express, Fastify, and every other Node web framework are built on top of.

## Why it matters

Every Node web framework ultimately calls `http.createServer` somewhere. Knowing this layer means you can:

- Debug weird framework behavior (headers, status codes, streaming).
- Read Express's source without getting lost.
- Build tiny tools (webhook receivers, health checks) with zero dependencies.

## The code in this folder

`index.js` — a 14-line server:

```js
const http = require('http');

const server = http.createServer((req, res) => {
    console.log("incoming request")
    res.writeHead(200)
    res.end('This is the response body')
})

server.listen(9000, () => {
    console.log('Server is listening on port 9000');
});
```

Key lines:

- `http.createServer(handler)` — registers your request handler. The handler runs once per incoming request.
- `res.writeHead(200)` — writes the status line and headers. `200` means OK.
- `res.end('...')` — writes the body and closes the response. Every request must end with `end()`, otherwise the client hangs.
- `server.listen(9000)` — starts the TCP socket. The callback fires once the port is bound.

Notice there's no routing: **every** URL and **every** method gets the same 200 response. That's on you to add.

## Run it

```bash
node index.js
```

Then in another terminal or a browser:

```bash
curl http://localhost:9000/
curl http://localhost:9000/anything
```

Both return `This is the response body`.

## Try this next

1. Read `req.url` and `req.method`, and return different bodies for `GET /` vs `GET /about`.
2. Use `res.setHeader('Content-Type', 'application/json')` and return `JSON.stringify({ ok: true })`.
3. Return `404` for unknown URLs. What happens if you forget `res.end()`?

## Gotchas

- **Forgetting `res.end()`** — the client will wait forever until it times out.
- **Setting headers after `writeHead`** — throws. Order matters: `setHeader` → `writeHead` → `write`/`end`.
- **No body parsing** — `req` is a stream. To read a POST body you have to listen to `data` and `end` events yourself. Frameworks do this for you.
- **Ports below 1024** — need root/admin on most OSes. Stick to `>= 1024` (e.g. 3000, 8000, 9000).
