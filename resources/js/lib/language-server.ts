import { MonacoLanguageClient, CloseAction, ErrorAction, createConnection } from 'monaco-languageclient';
import { createWebSocketConnection, toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

export const initLanguageServer = () => {
    // Connect to Intelephense WebSocket
    const url = "ws://localhost:3000";
    const socket = new WebSocket(url);
    socket.onopen = () => {
        // const iSocket = toSocket(socket);
        // @ts-ignore
        const reader = new WebSocketMessageReader(socket);
        // @ts-ignore
        const writer = new WebSocketMessageWriter(socket);

        const connection = createWebSocketConnection(socket);
        const languageClient = new MonacoLanguageClient({
            name: "PHP Language Server",
            clientOptions: {
                documentSelector: ["php"],
                synchronize: {},
                // errorHandler: {
                //     error: () => ErrorAction.Continue,
                //     closed: () => CloseAction.Restart,
                // }
            },
            // @ts-expect-error object
            connectionProvider: {
                // get: () => Promise.resolve(createConnection(reader, writer))
                get: () => Promise.resolve(connection),
            }
        });

        languageClient.start();
    };
    socket.onclose = () => {
        console.log("WebSocket closed");
    };
    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    }
    return socket;
};
