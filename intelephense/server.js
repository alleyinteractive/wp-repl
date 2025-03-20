// const WebSocket = require('ws');
// const { spawn } = require('child_process');
// const net = require('net');

// // Start Intelephense LSP Server
// const intelephense = spawn("./node_modules/intelephense/lib/intelephense.js", ["--stdio"]);

// // Create WebSocket Server
// const wss = new WebSocket.Server({ port: 3000 });

// wss.on('connection', (ws) => {
//     const serverConnection = net.createConnection({ port: intelephense.pid }, () => console.log("Connected to Intelephense"));
//     // const serverConnection = net.createConnection({ port: 3000 }, () => console.log("Connected to Intelephense"));

//     // Relay messages between WebSocket and Intelephense
//     ws.on("message", (message) => serverConnection.write(message));
//     serverConnection.on("data", (data) => ws.send(data));
//     ws.on("close", () => serverConnection.end());
// });

// console.log('WebSocket server is running on ws://localhost:3000');

// ================

const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
    console.log("Client connected");
A
    const phpLsp = spawn("intelephense", ["--stdio"]);

    ws.on("message", (message) => {
        phpLsp.stdin.write(message);
    });

    phpLsp.stdout.on("data", (data) => {
        ws.send(data.toString());
    });

    phpLsp.stderr.on("data", (data) => {
        console.error("Intelephense Error:", data.toString());
    });

    ws.on("close", () => {
        phpLsp.kill();
    });
});

console.log("WebSocket LSP running on ws://localhost:3000");
