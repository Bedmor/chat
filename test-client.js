const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('Connected to server');
    const msg = JSON.stringify({ user: 'TestBot', text: 'Hello from CI!', timestamp: new Date().toISOString() });
    ws.send(msg);
});

ws.on('message', (data) => {
    console.log('Received echo:', data.toString());
    ws.close();
    process.exit(0);
});

ws.on('error', (err) => {
    console.error('Connection error:', err);
    process.exit(1);
});

// Timeout if no message received
setTimeout(() => {
    console.error('Timeout waiting for echo');
    process.exit(1);
}, 5000);