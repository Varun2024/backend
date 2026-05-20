# buffers

Purpose
: Collections of examples that demonstrate working with Node's binary `Buffer` API and how binary data is handled in Node programs (streams, sockets, file IO).

Key concepts
- `Buffer` basics: creation (`Buffer.from`, `Buffer.alloc`), encoding (utf8, base64), and slicing without copy.
- Typed arrays vs Buffer: Node `Buffer` is a subclass of Uint8Array but has helpful convenience helpers for I/O.
- Streams and chunks: large binary data is processed via streams; buffers represent chunks of bytes.

Short examples

```js
const b = Buffer.from('hello','utf8')
console.log(b.toString('utf8')) // 'hello'

// write to file
await fs.promises.writeFile('out.bin', b)
```

Revision checklist
- Can you convert a string to a buffer in two encodings (utf8, base64) and back?
- Do you understand when Node will provide `Buffer` instances (e.g., stream `data` events)?

Practice tasks
1. Build a parser that reads a file in 16KB Buffer chunks and counts a specific byte pattern.
2. Create a small binary packet format: 4-byte length + payload, then serialize and parse it.
3. Experiment with `Buffer.concat` and measure when slicing avoids copies.
