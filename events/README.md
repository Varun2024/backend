# EventEmitter

> One-sentence hook: how one part of your app tells another part "something happened", without knowing who's listening.

## What is EventEmitter?

`EventEmitter` is a built-in Node class that implements the publisher/subscriber pattern. One piece of code `emit`s a named event with some data; any other code that has called `.on('sameName', callback)` runs its callback. It decouples "the thing that happened" from "what to do about it".

Analogy: a radio station. The DJ (emitter) broadcasts on a frequency. Anyone tuned in (listener) hears it. The DJ doesn't know or care who's listening.

## Why it matters

EventEmitter is the foundation of most of Node's async APIs. HTTP servers, streams, sockets, child processes — they all extend `EventEmitter`. When you write `server.on('request', ...)`, you're using it. Understanding it means you can build clean, decoupled modules and read the standard library confidently.

## The code in this folder

Three small examples, from simplest to most idiomatic.

### `myEve.js` — direct usage

```js
const EventEmitter = require('events')
const myEmitter = new EventEmitter()

myEmitter.on('greet', (message) => {
    console.log(`hello, this is event emitter example, ${message}`)
})

myEmitter.once('notify', () => {
    console.log(`hello, this is a one-time event`)
})

myEmitter.emit('greet', 'BHADWA')
myEmitter.emit('notify')
myEmitter.emit('notify') // no output — `once` already fired
```

Key methods:

- `.on(name, fn)` — subscribe. Fires every time the event is emitted.
- `.once(name, fn)` — subscribe, but auto-unsubscribe after the first fire.
- `.emit(name, ...args)` — broadcast. All listeners run synchronously in the order they were registered.
- `.removeListener(name, fn)` — unsubscribe. Note: the function reference must be the **same** one you passed to `.on`, so anonymous inline callbacks can't be removed.
- `.listeners(name)` — array of currently registered listeners.

### `myEveClass.js` — extending EventEmitter

```js
class MyEveClass extends EveEmitter {
    sendMessage(message) {
        this.emit('message', message)
    }
}
```

This is the idiomatic pattern. Instead of using a bare emitter, you build your own class that **is** an emitter. `sendMessage` is a public method; internally it broadcasts a `'message'` event. Consumers only need `chat.on('message', ...)` — they don't need to know how the message got there.

### `myErrorEve.js` — the `'error'` event

```js
myEmitter.on('error', (err) => {
    console.error(`An error occurred: ${err.message}`)
})
myEmitter.emit('error', new Error('Something went wrong!'))
```

`'error'` is a special event name in Node. If you `emit('error', ...)` and **no one is listening**, Node crashes the process. That's why every real emitter should register at least one error listener.

## Run it

```bash
node myEve.js
node myEveClass.js
node myErrorEve.js
```

## Try this next

1. In `myEve.js`, name the callback (`function greetHandler(m) {...}`) and pass the same reference to `.removeListener`. Confirm the second `emit` produces no output.
2. In `myEveClass.js`, add a `broadcast` method that emits `message` to all listeners with a `[SERVER]` prefix.
3. In `myErrorEve.js`, comment out the `.on('error', ...)` call and re-run. Watch the process crash.

## Gotchas

- **Anonymous callbacks can't be removed.** Store the function in a variable if you need to `removeListener` later.
- **`emit` is synchronous.** All listeners run before `emit` returns. If a listener throws, later listeners may not run.
- **Unhandled `'error'` crashes Node.** Always attach an error listener on emitters you own.
- **Default max 10 listeners.** Adding more logs a memory-leak warning. If you truly need more, use `.setMaxListeners(n)` — but usually the warning is real and something is leaking.
