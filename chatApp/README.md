# chatApp

Purpose
: A compact module to experiment with room-based messaging and simple in-process broadcasting patterns. Useful for prototyping chat logic before introducing sockets or a message broker.

Key concepts
- Room state management: maintain a list of participants and a bounded history buffer per room.
- Broadcasting: deliver messages to all participants in the room without duplicating state.
- Event ordering and idempotency: ensure message order is preserved and duplicates are guarded.

Example sketch

```js
// simple room structure
const rooms = { roomId: { participants: Set, history: [] } }
function broadcast(roomId, msg) { rooms[roomId].participants.forEach(p=>p.send(msg)) }
```

Revision checklist
- Can you simulate two participants and observe message delivery order?
- Is the history buffer bounded (e.g., 100 messages) and persisted only in memory?

Practice tasks
1. Add a history limit and a function `getRecent(roomId, n)`.
2. Implement a `mute(userId)` flag that prevents broadcast delivery to that user.
3. Add sequence numbers to messages and assert monotonic ordering in tests.
