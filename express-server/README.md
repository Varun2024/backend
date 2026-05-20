# express-server

Purpose
: A minimal Express app example for learning app lifecycle, middleware registration, router mounting, and graceful shutdown in a Node service.

Key concepts
- Bootstrapping: `app.use` to register middleware, `app.use('/path', router)` to mount routers, `app.listen` to start.
- Config and environment: read configuration from `.env` with `process.env` and prefer typed config objects for app code.
- Shutdown and signals: close HTTP server and database connections on `SIGINT`/`SIGTERM`.

Example

```js
const server = app.listen(PORT, ()=>console.log('up'))
process.on('SIGINT', ()=> server.close(()=>process.exit(0)))
```

Revision checklist
- Can you start the server and access `/health` or `/` endpoints?
- Is configuration loaded from environment variables and not hardcoded?

Practice tasks
1. Add a `/health` endpoint that returns `{status: 'ok'}` and perform a liveness check.
2. Implement graceful shutdown that closes connections and exits cleanly.
3. Add a middleware to log startup config (without secrets) for troubleshooting.
