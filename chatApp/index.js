const ChatRoom = require('./chatRoom');

// Create a new chat room instance
const chat = new ChatRoom();

chat.on('userJoined', (user) => {
    console.log(`${user} has joined the chat room.`);
});

chat.on('message', ({ user, message }) => {
    console.log(`${user}: ${message}`);
});

chat.on('userLeft', (user) => {
    console.log(`${user} has left the chat room.`);
});
// Simulate users joining, sending messages, and leaving
chat.join('Alice');
chat.join('Bob');

chat.sendMessage('Alice', 'Hello, everyone!');
chat.sendMessage('Bob', 'Hi Alice!');

chat.leave('Alice');
chat.sendMessage('Alice', 'Goodbye!'); // This will show that Alice is not in the chat room.
chat.leave('Bob');


