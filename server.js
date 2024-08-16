const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
    });

    ws.send('WebSocket server connected');
});

console.log('WebSocket server is running on ws://localhost:8080');