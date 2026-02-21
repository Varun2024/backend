const EveEmitter = require('events');

class MyEveClass extends EveEmitter{
    sendMessage(message){
        console.log(`message sent: ${message}`)
        this.emit('message',message)
    }
}

// creating an instance of MyEveClass
const chat = new MyEveClass()

// listening for the 'message' event
chat.on('message',(message)=>{
    console.log(`message received: ${message}`)
})

// trigger the sendMessage method to emit the 'message' event , done somewhere else in the code
chat.sendMessage('Hello, this is a message from MyEveClass!')