const express = require("express");
const controller = require("../controllers/book.controller");
const router = express.Router();

router.get("/", controller.getBooks);

// fetch
router.get("/:id",controller.getBookById);

// for adding books
router.post("/", controller.createBook);

// deleting
router.delete("/:id",controller.deleteBookById);


module.exports = router