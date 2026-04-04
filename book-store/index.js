const express = require("express");
const fs = require("node:fs")
const app = express();
const PORT = 8000;

// middleware
app.use(express.json());

app.use(function(req,res,next){
  const log = `\n[${Date.now()}  ${req.method} ${req.path}]`
  fs.appendFileSync('logs.txt',log,'utf-8')
  next()
})



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

// fetch
app.get("/books/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const book = books.find((e) => e.id === id); //SELECT * from books where id ={id}

  //   bad request
  if (isNaN(id)) return res.status(400).json({ error: `Number only` });

  if (!book) return res.status(404).json(`Book wth ${id} does not exists!`);
  return res.json(book);
});

// for adding books
app.post("/books", (req, res) => {
  const { title, author } = req.body;
  if (!title || title === "")
    return res.status(400).json({error:`title required`});
  if (!author || author === "")
    return res.status(400).json({error:`author required`});
  const id = books.length + 1;
  const book = {id,title,author}
  books.push(book)
  return res.status(201).json({ messgae: "Book added" ,id});
});

// deleting
app.delete("/books/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const book = books.find((e) => e.id === id); //SELECT * from books where id ={id}
  const indexToDelete = books.findIndex((e) => e.id === id);
  //   bad request
  if (isNaN(id)) return res.status(400).json({ error: `Number only` });

  if (indexToDelete < 0)
    return res.status(404).json(`Book with id ${id} does not exists!`);

  books.splice(indexToDelete, 1);

  return res.status(200).json({ message: "Book deleted" });
});

app.listen(PORT, () => console.log(`Http server running at port ${PORT}`));
