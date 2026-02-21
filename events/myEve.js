// importing the events module
const EventEmitter = require('events')

// creating an instance of the EventEmitter class
const myEmitter = new EventEmitter()

// when the 'greet' event is emitted, the callback function will be executed
myEmitter.on('greet',(message)=>{
    console.log(`hello,this is event emitter example,${message}`)
})

// invoked only once
myEmitter.once('notify',()=>{
    console.log(`hello,this is a one-time event`)
})



// emitting the 'greet' event and passing a message as an argument(message)
myEmitter.emit('greet','BHADWA')
myEmitter.removeListener('greet',(message)=>{
    console.log(`hello,this is event emitter example,${message}`)
})
myEmitter.emit('greet','BHADWA')

myEmitter.emit('notify')
myEmitter.emit('notify')


console.log(myEmitter.listeners('greet'))