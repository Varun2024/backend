const express = require("express");
const { json } = require("node:stream/consumers");

const app = express();
const PORT = 8000;

// in memory db
const books = [
  {
    id: 1,
    title: "The Great Gatsby",
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
  },
];

// routes
app.get("/books", (req, res) => {
  // .en - text , .json - key-value
  // express add headers on their on own,we can add as well
  res.setHeader("x-vr", "abyss");
  res.json(books);
});

app.get("/books/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id))
    return res.status(400).json({error: `Number only`})
  const book = books.find((e) => e.id === id); //SELECT * from books where id ={id}

  if (!book) return res.status(404).json(`Book wth ${id} does not exists!`);
  return res.json(book)
});

app.listen(PORT, () => console.log(`Http server running at port ${PORT}`));
