const Emitter = require('events');

class ChatRoom extends Emitter{
    constructor(){
        // Call the parent class constructor
        super();
        // why set? because we want to store unique users in the chat room
        this.users = new Set();
    }

    // methods of Chatroom class
    join(user){
        this.users.add(user);
        this.emit('userJoined', user);
    }

    sendMessage(user, message){
        // has method checks if the user is in the chat room before emitting the message event i.e. in this.users set
        if (this.users.has(user)){
            this.emit('message', { user, message });
        }else{
            console.log(`User ${user} is not in the chat room.`);
        }
    }

    leave(user){
        if (this.users.has(user)){
            this.users.delete(user);
            this.emit('userLeft', user);
        }else{
            console.log(`User ${user} is not in the chat room.`);
        }
}
}

module.exports = ChatRoom;