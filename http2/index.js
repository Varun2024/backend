const { write } = require('node:fs');
const http = require('node:http');

const server = http.createServer(function (req, res) {
    console.log(`incoming at ${Date.now()}`);
    console.log(req.headers)

    res.writeHead(200);
    res.end('This is the response body, yahoooo');
});

server.listen(9000, function () {
    console.log('Server is listening on port 9000');
});