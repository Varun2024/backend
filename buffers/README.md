# Buffers

> One-sentence hook: how Node holds raw binary bytes in memory, before they're a string.

## What is a Buffer?

A `Buffer` is a fixed-length chunk of raw bytes. When Node reads a file, receives a network packet, or hashes something, it works with bytes first and turns them into a string only when you ask. A Buffer is like a JavaScript array where every slot must be an integer from 0 to 255 (one byte). The mental model: a `Buffer` is what's actually on disk or on the wire; a string is a human-readable interpretation of those bytes using some encoding (usually UTF-8).

## Why it matters

Anywhere you touch I/O in Node — files, TCP sockets, HTTP request bodies, crypto, image processing — you'll get Buffers before you get strings. Understanding them prevents encoding bugs (mojibake), off-by-one errors in binary protocols, and accidental memory disclosure with `allocUnsafe`.

## The code in this folder

`basic.js` walks through five common Buffer operations:

```js
const buf = Buffer.from('Hello, World 1!');
console.log(buf);           // <Buffer 48 65 6c 6c 6f ...>
console.log(buf.toString()); // 'Hello, World 1!'
```

- `Buffer.from(str)` — allocate a buffer and copy the UTF-8 bytes of `str` into it. This is the safest constructor.
- Printing the buffer shows hex bytes. `48` is `H` in ASCII (0x48 = 72 = 'H').
- `.toString()` decodes those bytes back to text using UTF-8 by default.

```js
const buf2 = Buffer.allocUnsafe(13);
const buf3 = Buffer.alloc(13);
```

- `Buffer.alloc(n)` — allocate `n` bytes and **zero them out**. Safe.
- `Buffer.allocUnsafe(n)` — allocate `n` bytes but leave whatever was in memory before. Faster, but the buffer contains whatever old data was sitting there. Only use if you're about to overwrite every byte.

```js
console.log(buf3.toString('utf8', 0, 6)); // 'Hello,'
```

- `.toString(encoding, start, end)` — slice-decode. Here we ask for bytes 0..6 as UTF-8.

```js
buf4[0] = 0x4A; // Change 'H' to 'J'
```

- Buffers are mutable and indexable like arrays. `0x4A` is 74, the ASCII code for `J`.

```js
const combined = Buffer.concat([buf5, buf6]);
```

- `Buffer.concat([...])` — glue multiple buffers into one. This is how you assemble a streamed request body.

## Run it

```bash
node basic.js
```

## Try this next

1. Change `Buffer.from('Hello, World 1!')` to `Buffer.from('Hello, World 1!', 'utf16le')` and print the byte count. Notice each character now takes 2 bytes.
2. `Buffer.allocUnsafe(13)` and print it a few times without writing. See if you catch stale memory.
3. Use `crypto.createHash('sha256').update(Buffer.from('hi')).digest('hex')` and observe the output.

## Gotchas

- **`allocUnsafe` leaks memory contents.** If you send it over the network without fully overwriting it, you could leak secrets. Prefer `alloc` unless you know what you're doing.
- **Byte length != character count.** UTF-8 uses 1–4 bytes per code point. `Buffer.from('é').length` is 2, not 1.
- **Encoding must match.** Bytes written as `latin1` decoded as `utf8` produces garbage. Always know the encoding.
- **Fixed size.** Once allocated, a Buffer can't grow. To "append", use `Buffer.concat`.
