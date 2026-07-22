# HTTP Request Inspection

> One-sentence hook: what a raw HTTP request actually looks like when it hits your server.

## What's going on here?

Despite the folder name, `index.js` uses the plain `node:http` module — not `node:http2`. It's a small variant of the `http-server` example that logs the incoming request headers and a timestamp. The learning goal is to see what a browser or `curl` actually sends across the wire (host, user-agent, accept, connection, etc.) instead of treating a request as an opaque blob.

If you later want the real HTTP/2 API, swap `node:http` for `node:http2` and use `http2.createSecureServer` — HTTP/2 in browsers requires TLS.

## Why it matters

Every debugging session eventually comes down to "what did the client actually send?". Being comfortable with `req.headers`, `req.method`, and `req.url` at the raw level saves hours later when a framework does something you don't expect.

## The code in this folder

`index.js`:

```js
const http = require('node:http');

const server = http.createServer(function (req, res) {
    console.log(`incoming at ${Date.now()}`);
    console.log(req.headers)

    res.writeHead(200);
    res.end('This is the response body, yahoooo');
});

server.listen(9000, function () {
    console.log('Server is listening on port 9000');
});
```

Key lines:

- `require('node:http')` — the `node:` prefix is the modern way to import built-in modules. It makes intent explicit and avoids shadowing by a user package named `http`.
- `console.log(req.headers)` — dumps every header the client sent as a plain object. Try hitting the server from a browser vs `curl` and compare.
- `Date.now()` — millisecond timestamp, handy for eyeballing request latency in dev.
- `res.writeHead(200)` + `res.end(...)` — same status-then-body pattern as `http-server`.

## Run it

```bash
node index.js
```

Then:

```bash
curl -v http://localhost:9000/
```

Watch the server terminal. You'll see the headers `curl` sent — `Host`, `User-Agent`, `Accept`. Now open the URL in a browser and compare: browsers send far more (Accept-Language, Sec-Fetch-*, cookies, etc.).

## Try this next

1. Log `req.method` and `req.url` too. Then send `curl -X POST http://localhost:9000/foo` and see what shows up.
2. Log a specific header: `req.headers['user-agent']`. Note that header names are always lowercase in Node.
3. Switch to real HTTP/2: `require('node:http2').createSecureServer({ key, cert }, handler)`. You'll need a self-signed cert (`openssl req ...`).

## Gotchas

- **This is HTTP/1.1, not HTTP/2** — the folder name is aspirational. Real HTTP/2 requires TLS to be reachable from browsers.
- **Header names are lowercased** — `req.headers['Content-Type']` returns `undefined`; use `req.headers['content-type']`.
- **Multiple values** — some headers can repeat (e.g. `Set-Cookie`). Those come through as arrays instead of strings.
