const { booksTable } = require("../models/book.model");
const { authorsTable } = require("../models/author.model");
const db = require("../db");
const { eq, ilike, sql } = require("drizzle-orm");
exports.getBooks = async function (req, res) {
  // .en - text , .json - key-value
  // express add headers on their on own,we can add as well
  // res.setHeader("x-vr", "abyss");
  const search = req.query.search

  if(search){
    // for full text search we need to use the search index we created on the title column, we can use the sql tag to write raw sql queries
    const books = await db.select().from(booksTable).where(sql`to_tsvector('english',${booksTable.title}) @@ to_tsquery('english', ${search})`);
    return res.json(books);
  }
  const books = await db.select().from(booksTable);
  return res.json(books);
};

exports.getBookById = async function (req, res) {
  const id = req.params.id;
  const [book] = await db
  .select()
  .from(booksTable)
  .where(eq(booksTable.id, id))
  // foreign key join with authors table to get the author details along with the book details
  .leftJoin(authorsTable,eq(booksTable.authorId,authorsTable.id))
  .limit(1)

  if (!book) return res.status(404).json(`Book wth ${id} does not exists!`);
  return res.json(book);
};

exports.createBook = async function (req, res) {
  const { title,description , authorId } = req.body;
  if (!title || title === "")
    return res.status(400).json({ error: `title required` });

  const result = await db.insert(booksTable).values({
    title,
    authorId,
    description
  })
  .returning({id:booksTable.id})
  .then((result) => {
    const id = result[0].id;
    return res.status(201).json({ message: "Book added", id });
  });
};

exports.deleteBookById = async function (req, res) {
  const id = req.params.id;
  await db.delete(booksTable).where(eq(booksTable.id, id));
  return res.status(200).json({ message: "Book deleted" });
};
