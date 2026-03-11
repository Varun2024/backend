const http = require("node:http");
const fs = require("node:fs");

const server = http.createServer((req, res) => {
  const method = req.method;
  const url = req.url;
    const log = `${Date.now()}: ${method} ${url}`;
    fs.appendFileSync("server.log", log + "\n", 'utf-8');
  switch (method) {
    case "GET": {
      switch (url) {
        case "/":
          return res.writeHead(200).end("Welcome to the home page!");
        case "/contact-us":
          return res.writeHead(200).end("Welcome to the contact us page!");
        case "/tweet":
          return res.writeHead(200).end("t-1\nt-2\nt-3");
        default:
          return res.writeHead(404).end("Page not found!");
      }
    }
    case "POST": {
      switch (url) {
        case "/tweet":
          return res.writeHead(200).end("Tweet created successfully!");
        default:
          return res.writeHead(404).end("Page not found!");
      }
    }
  }
});

server.listen(8000, () => {
  console.log(`Server is listening on port 8000`);
});
