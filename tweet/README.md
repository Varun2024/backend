# tweet

Purpose
: Example scripts and helpers that show outbound HTTP request patterns from Node.js, including request composition, retries, and error handling.

Key concepts
- HTTP clients: using `fetch`, `axios`, or `node:https` to make outbound calls and handle responses.
- Retry/backoff patterns: implement idempotent retries with exponential backoff for transient errors.
- Testing external calls: mock external HTTP calls during tests to avoid network dependency.

Short example (pseudo)

```js
const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload) })
if (!res.ok) throw new Error('request failed')
```

Revision checklist
- Can you run the script and observe the outbound HTTP request in network logs or a proxy?
- Do you understand when to retry vs when to surface an error (idempotency concerns)?

Practice tasks
1. Add exponential backoff retries (max 3 attempts) for 5xx HTTP responses.
2. Mock the remote endpoint in a test and assert the retry behavior.
3. Switch client implementations (e.g., `node-fetch` → `axios`) and note differences in API and error handling.
