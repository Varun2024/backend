# http2

Purpose
: Explore Node's `http2` API to understand multiplexed streams, header compression, and differences vs HTTP/1.1, including basic server and client examples.

Key concepts
- Streams: HTTP/2 uses independent streams over a single TCP/TLS connection allowing multiplexing.
- Headers: pseudo-headers (e.g., `:path`) and HPACK compression change how headers are encoded/decoded.
- TLS: most HTTP/2 usage requires secure connections; local testing may use insecure mode for experiments.

Example

```js
const server = http2.createServer()
server.on('stream',(stream,headers)=>{
	stream.respond({':status':200})
	stream.end('ok')
})
```

Revision checklist
- Can you open an HTTP/2 client connection and issue two requests that share the same TCP connection?
- Do you understand why multiplexing reduces head-of-line blocking?

Practice tasks
1. Run the server and use an HTTP/2 client (e.g., `node --experimental-http2` client sample) to issue parallel requests.
2. Inspect request/response headers and note pseudo-header differences from HTTP/1.1.
3. Try enabling TLS for the server and observe client connection details.
