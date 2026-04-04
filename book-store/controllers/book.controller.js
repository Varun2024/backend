const { BOOKS } = require("../models/book");

exports.getBooks = function (req, res) {
  // .en - text , .json - key-value
  // express add headers on their on own,we can add as well
  res.setHeader("x-vr", "abyss");
  res.json(BOOKS);
};

exports.getBookById = function (req, res) {
  const id = parseInt(req.params.id);
  const book = BOOKS.find((e) => e.id === id); //SELECT * from books where id ={id}

  //   bad request
  if (isNaN(id)) return res.status(400).json({ error: `Number only` });

  if (!book) return res.status(404).json(`Book wth ${id} does not exists!`);
  return res.json(book);
};

exports.createBook = function (req, res) {
  const { title, author } = req.body;
  if (!title || title === "")
    return res.status(400).json({ error: `title required` });
  if (!author || author === "")
    return res.status(400).json({ error: `author required` });
  const id = BOOKS.length + 1;
  const book = { id, title, author };
  BOOKS.push(book);
  return res.status(201).json({ messgae: "Book added", id });
};

exports.deleteBookById = function (req, res) {
  const id = parseInt(req.params.id);
  const book = BOOKS.find((e) => e.id === id); //SELECT * from books where id ={id}
  const indexToDelete = BOOKS.findIndex((e) => e.id === id);
  //   bad request
  if (isNaN(id)) return res.status(400).json({ error: `Number only` });

  if (indexToDelete < 0)
    return res.status(404).json(`Book with id ${id} does not exists!`);

  BOOKS.splice(indexToDelete, 1);

  return res.status(200).json({ message: "Book deleted" });
};
