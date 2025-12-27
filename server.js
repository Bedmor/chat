const { WebSocketServer } = require('ws');
const http = require('http');

const port = process.env.PORT || 8080;

// Create a basic HTTP server (useful for health checks on Render)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Chat Server is running!');
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