// when impportig module car name Should start with capital letter
const Emitter = require('events')

const myEmitter = new Emitter()

// when the 'error' event is emitted, the callback function will be executed
myEmitter.on('error',(err)=>{
    console.error(`An error occurred: ${err.message}`)
})
// err is a big class in node js which has many properties and methods, we can use them to get more information about the error


// emitting the 'error' event and passing an error object as an argument
myEmitter.emit('error',new Error('Something went wrong!'))