# Chat Room via EventEmitter

> One-sentence hook: how to model a small domain (a chat room) by extending `EventEmitter`, so different concerns can react without knowing about each other.

## What's happening here?

Despite the folder name, this is **not** a WebSocket chat server — it's a single-process simulation. A `ChatRoom` class extends Node's `EventEmitter`. When users join, send messages, or leave, the room emits events. Handlers registered in `index.js` react by logging.

The lesson is the design pattern: encapsulate state (`users` set) inside a class, expose actions as methods (`join`, `sendMessage`, `leave`), and broadcast side effects as events. Whoever cares can subscribe.

## Why it matters

This same pattern shows up everywhere in real Node apps: a `Queue` that emits `'job-done'`, a `Db` wrapper that emits `'connected'`, a `Cache` that emits `'evicted'`. Extending `EventEmitter` is the idiomatic way to build reactive modules in Node. Once you understand this file, you can bolt on a real WebSocket layer (`ws` package) and turn it into a live chat server without changing the domain logic.

## The code in this folder

### `chatRoom.js` — the domain class

```js
const Emitter = require('events');

class ChatRoom extends Emitter {
    constructor() {
        super();
        this.users = new Set();
    }

    join(user) {
        this.users.add(user);
        this.emit('userJoined', user);
    }

    sendMessage(user, message) {
        if (this.users.has(user)) {
            this.emit('message', { user, message });
        } else {
            console.log(`User ${user} is not in the chat room.`);
        }
    }

    leave(user) {
        if (this.users.has(user)) {
            this.users.delete(user);
            this.emit('userLeft', user);
        } else {
            console.log(`User ${user} is not in the chat room.`);
        }
    }
}
```

Key ideas:

- `class ChatRoom extends Emitter` — every ChatRoom **is** an EventEmitter. `super()` in the constructor is required, otherwise `this.emit` won't work.
- `this.users = new Set()` — a `Set` guarantees unique users (no duplicate joins). Using an array here would require an `.includes` check on every add.
- Three events broadcast: `'userJoined'`, `'message'`, `'userLeft'`. Names are just strings — pick something readable.
- `sendMessage` and `leave` guard on membership (`this.users.has(user)`) so ghosts can't spam or leave twice.

### `index.js` — the consumer

```js
const chat = new ChatRoom();

chat.on('userJoined', (user) => console.log(`${user} has joined the chat room.`));
chat.on('message',    ({ user, message }) => console.log(`${user}: ${message}`));
chat.on('userLeft',   (user) => console.log(`${user} has left the chat room.`));

chat.join('Alice');
chat.join('Bob');
chat.sendMessage('Alice', 'Hello, everyone!');
chat.sendMessage('Bob', 'Hi Alice!');
chat.leave('Alice');
chat.sendMessage('Alice', 'Goodbye!'); // Alice already left — logs "not in the chat room"
chat.leave('Bob');
```

Notice: `index.js` never touches `chat.users` directly. It only calls methods and subscribes to events. That's the payoff of the pattern — the consumer and the domain are decoupled.

## Run it

```bash
node index.js
```

Expected output:

```
Alice has joined the chat room.
Bob has joined the chat room.
Alice: Hello, everyone!
Bob: Hi Alice!
Alice has left the chat room.
User Alice is not in the chat room.
Bob has left the chat room.
```

## Try this next

1. Add a `list()` method that emits a `'userList'` event with `Array.from(this.users)`. Subscribe in `index.js` and print.
2. Guard against duplicate joins: emit a `'userAlreadyJoined'` event instead of silently re-adding.
3. Wire this to a real socket: `npm i ws`, create a WebSocket server, and forward `chat.on('message', ...)` to every connected client. That's the leap from simulation to actual chat app.

## Gotchas

- **Forgetting `super()`** in the subclass constructor — `this.emit` will throw.
- **Listener registered after emit** — `emit` is synchronous, so if you `chat.join('Alice')` before `chat.on('userJoined', ...)`, the join event is lost.
- **`Set` uses reference equality for objects.** Storing user objects instead of strings means the same "user" with a new object won't be recognized as a duplicate. Strings (or IDs) are safer as keys.
- **No `'error'` handler.** If any listener throws, and you emit `'error'` without a listener, the process crashes. See `../events/myErrorEve.js`.
