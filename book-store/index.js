require("dotenv").config();
const express = require("express");
const { logger } = require("./middleware/logger");
const app = express();
const PORT = 8000;

const bookRouter = require("./routes/book.routes");
const authorRouter = require("./routes/author.routes");

// middleware
app.use(express.json());

app.use(logger);

// routes
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});
app.use("/books", bookRouter);
app.use("/authors", authorRouter);
app.listen(PORT, () => console.log(`Http server running at port http://localhost:${PORT}\ncheck http://localhost:${PORT}/health for health check\n`));
