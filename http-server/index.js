const http = require('http');

const server = http.createServer((req, res) => {
    console.log("incoming request")
    // headers
    res.writeHead(200)
    // body
    res.end('This is the response body')

})

server.listen(9000, () => {
    console.log('Server is listening on port 9000');
});

