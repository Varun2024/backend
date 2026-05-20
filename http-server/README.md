# http-server

Purpose
: Demonstrates how to build an HTTP server using Node's `http` module to learn low-level request/response handling, routing logic, and manual parsing without a framework.

Key concepts
- Request/response streams: parse request body from `req` data events and call `res.end()` to send a response.
- Manual routing: inspect `req.url` and `req.method` to route requests.
- When to use raw `http`: microservices, performance-sensitive endpoints, or learning; prefer frameworks for productivity.

Small example

```js
http.createServer((req,res)=>{
	if (req.url === '/health') return res.end('ok')
	res.end('hello')
}).listen(3000)
```

Revision checklist
- Can you parse a JSON POST body into an object without Express?
- Do you know how to send headers and status codes manually?

Practice tasks
1. Implement a small JSON body parser and return `400` on parse errors.
2. Add routing for `/`, `/health`, and `/echo` that returns posted JSON.
3. Compare raw headers output with Express `req.headers` for the same request.
