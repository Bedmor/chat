const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;

// Create an HTTP server that serves the static files (index.html, main.js)
const server = http.createServer((req, res) => {
    // Get the URL path, defaulting to index.html for root
    let urlPath = req.url === '/' ? '/index.html' : req.url;

    // Remove query parameters if present
    urlPath = urlPath.split('?')[0];

    // Construct the absolute file path
    const filePath = path.join(__dirname, urlPath);

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`File not found: ${filePath}`);
                res.writeHead(404);
                res.end('404 File Not Found');
            } else {
                console.log(`Server error: ${error.code}`);
                res.writeHead(500);
                res.end(`500 Internal Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Attach WebSocket server to the HTTP server
const wss = new WebSocketServer({ server });

console.log(`Server started on port ${port}`);

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);

        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});