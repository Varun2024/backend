const express = require("express");

const { logger } = require("./middleware/logger");
const app = express();
const PORT = 8000;

const bookRouter = require("./routes/book.routes");

// middleware
app.use(express.json());

app.use(logger);

// routes
app.use("/books", bookRouter);
app.listen(PORT, () => console.log(`Http server running at port ${PORT}`));
