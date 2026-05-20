# events

Purpose
: Demonstrates Node's `EventEmitter` usage and patterns for decoupling producers and consumers, plus how to build domain-specific events and error channels.

Key concepts
- EventEmitter basics: `on`, `once`, `emit`, `removeListener` and listener invocation order.
- Synchronous vs asynchronous listeners: emitting is synchronous unless handlers themselves use async operations.
- Error events: emit `error` events and ensure there's a listener to avoid process crashes.

Example

```js
const E = require('events')
const emitter = new E()
emitter.on('data', d => console.log('got',d))
emitter.emit('data','hello')
```

Revision checklist
- Do you know how to prevent unhandled `error` events (add an `error` listener)?
- Can you convert a callback-style API into an event emitter that emits `start`, `data`, `end`, and `error`?

Practice tasks
1. Implement an emitter that streams file lines as `data` events and `end` when done.
2. Add a retry mechanism that listens for `error` and re-attempts the failing operation up to N times.
3. Create typed event payloads (JS object shape) and validate them in listeners.
