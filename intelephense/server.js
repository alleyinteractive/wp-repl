const WebSocket = require('ws');
const { spawn } = require('child_process');
const net = require('net');

// Start Intelephense LSP Server
const intelephense = spawn("./node_modules/intelephense/lib/intelephense.js", ["--stdio"]);

// Create WebSocket Server
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
    const serverConnection = net.createConnection({ port: intelephense.pid });

    // Relay messages between WebSocket and Intelephense
    ws.on("message", (message) => serverConnection.write(message));
    serverConnection.on("data", (data) => ws.send(data));
});

console.log('WebSocket server is running on ws://localhost:3000');
