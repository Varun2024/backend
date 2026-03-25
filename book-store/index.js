const express = require('express');

const app = express();
const PORT = 8000


// in memory db
const books = [
    {
        id: 1,
        title: 'The Great Gatsby'
    },
    {
        id: 2,
        title: 'To Kill a Mockingbird'
    }
]

// routes
app.get('/books',(req,res)=>{
    // .en - text , .json - key-value
    // express add headers on their on own,we can add as well
    res.setHeader('x-vr','abyss')
    res.json(books)
})


app.listen(PORT,()=> console.log(`Http server running at port ${PORT}`))