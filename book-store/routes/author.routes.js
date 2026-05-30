const express = require("express")
const {authorsTable} = require("../models/author.model")
const {booksTable} = require("../models/book.model")
const db = require("../db")
const {eq} = require("drizzle-orm")
const router = express.Router();

router.get('/',async (req,res)=>{
    const authors = await db.select().from(authorsTable);
    return res.json(authors);
})

router.get('/:id',async (req,res)=>{
    const authors = await db.select().from(authorsTable).where(eq(authorsTable.id,req.params.id)).limit(1);

    if (!authors) return res.status(404).json(`Author with ${req.params.id} does not exists!`);

    return res.json(authors);
})

router.post('/',async (req,res)=>{
     const {firstName,lastName,email} = req.body;
     const [result] = await db.insert(authorsTable).values({
        firstName,
        lastName,
        email
     }).returning({id:authorsTable.id})
     res.status(201).json({message:"Author added",id:result.id})
})

router.get('/:id/books',async(req,res)=>{
    const books = await db.select().from(booksTable).where(eq(booksTable.authorId,req.params.id))
    return res.json(books);
})

module.exports = router