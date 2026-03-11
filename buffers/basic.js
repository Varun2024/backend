const {Buffer} = require('buffer');
 
// Create a buffer from a string
// const buf = Buffer.alloc(4);
// console.log(buf[2])

// cleans memory and fills it with zeros
const buf = Buffer.from('Hello, World 1!');
console.log(buf)
// Output: <Buffer 48 65 6c 6c 6f 2c 20 57 6f 72 6c 64 21>
// convert the buffer back to a string
console.log(buf.toString()); // Output: Hello, World!


// allocUnsafe does not clean the memory, so it may contain old data. It is faster than alloc but should be used with caution.
const buf2 = Buffer.allocUnsafe(13);
console.log(buf2)
buf2.write('Hello, World 2!');

const buf3 = Buffer.alloc(13);
buf3.write('Hello, uni!');
console.log(buf3.toString('utf8', 0, 6)); // Output: Hello,

const buf4 = Buffer.from('Hello, World 4!');
console.log(buf4)
buf4[0] = 0x4A; // Change 'H' to 'J'
console.log(buf4.toString()); // Output: Jello, World 4!

const buf5 = Buffer.from('Hello');
const buf6 = Buffer.from('-World');
const combined = Buffer.concat([buf5, buf6]);
console.log(combined.toString()); // Output: Hello-World
console.log(combined.length) // Output: 11
