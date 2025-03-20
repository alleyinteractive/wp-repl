import { useIsDark } from '@/hooks/use-appearance';
import { default as Monaco } from '@monaco-editor/react';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient/browser.js';
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';

// import { ConsoleLogger } from 'monaco-languageclient/tools';
// import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';
// import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';

// import { MonacoLanguageClient, MessageTransports } from 'monaco-languageclient';
// import { createConnection } from 'monaco-languageclient/lib/monaco';
// import { createWebSocketAndStartServer } from 'monaco-languageclient/lib/monaco';

// function createLanguageClient(transports: MessageTransports) {
//     return new MonacoLanguageClient({
//         name: "PHP Language Client",
//         clientOptions: {
//             documentSelector: ['php'],
//             // synchronization: { didSave: true }
//         },
//         // @ts-expect-error does not exist
//         connectionProvider: { get: () => Promise.resolve(transports) }
//     });
// }

// function createWebSocketConnection(url: string) {
//     const socket = new WebSocket(url);
//     return createConnection(socket);
// }

/** parameterized version , support all languageId */
export const initWebSocketAndStartClient = (url: string): WebSocket => {
    const webSocket = new WebSocket(url);
    webSocket.onopen = () => {
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        const languageClient = createLanguageClient({
            reader,
            writer
        });
        languageClient.start();
        reader.onClose(() => languageClient.stop());
    };
    return webSocket;
};

export const createLanguageClient = (messageTransports: MessageTransports): MonacoLanguageClient => {
    return new MonacoLanguageClient({
        name: 'Sample Language Client',
        clientOptions: {
            // use a language id as a document selector
            documentSelector: ['json'],
            // disable the default error handler
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart })
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        messageTransports,
    });
};

/**
 * Wrapper for the Monaco Editor component to create a PHP code editor.
 */
export function Editor(props: React.ComponentProps<typeof Monaco>) {
    const isDark = useIsDark();

    const getCssVariable = (name: string) => {
        return getComputedStyle(document.documentElement).getPropertyValue(name);
    };

    return (
        <Monaco
            language="php"
            height="100%"
            beforeMount={(monaco) => {
                monaco.editor.defineTheme('custom-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': getCssVariable('--background'),
                    },
                });

                monaco.editor.defineTheme('blueberryLight', {
                    base: 'vs',
                    inherit: true,
                    rules: [
                        { token: '', foreground: '#1A1919', background: '#FFFFFF' }, // Default text, white background
                        { token: 'comment', foreground: '#656A71', fontStyle: 'italic' }, // Comments - Charcoal 4
                        { token: 'keyword', foreground: '#1D35B4', fontStyle: 'bold' }, // Keywords - Dark Blueberry
                        { token: 'string', foreground: '#3858E9' }, // Strings - Blueberry
                        { token: 'number', foreground: '#213FD4' }, // Numbers - Deep Blueberry
                        { token: 'variable', foreground: '#23282D' }, // Variables - Charcoal 2
                        { token: 'type', foreground: '#9FB1FF' }, // Types - Blueberry 2
                        { token: 'function', foreground: '#C7D1FF' }, // Functions - Blueberry 3
                        { token: 'operator', foreground: '#40464D' }, // Operators - Charcoal 3
                    ],
                    colors: {
                        'editor.foreground': '#1A1919', // Charcoal 0 - Default text color
                        'editor.background': '#FFFFFF', // White - Background
                        'editor.selectionBackground': '#D9D9D9AA', // Light Grey (Transparent)
                        'editor.lineHighlightBackground': '#F6F6F6', // Light Grey 2 - Line highlight
                        'editorCursor.foreground': '#1D35B4', // Cursor - Dark Blueberry
                        'editorWhitespace.foreground': '#D9D9D9', // Light Grey - Whitespace
                    },
                });

                // Register PHP language support.
                monaco.languages.register({ id: 'php', extensions: ['.php'], aliases: ['PHP', 'php']});
            }}
            // onMount={(editor, monaco) => {
            onMount={(editor) => {
                initWebSocketAndStartClient("ws://localhost:3000");
                // const transports = createWebSocketConnection("ws://localhost:3000");
                // const languageClient = createLanguageClient(transports);
                // languageClient.start();
            }}
            options={{
                fixedOverflowWidgets: true,
                fontFamily: getCssVariable('--font-code'),
                fontSize: 14,
                glyphMargin: false,
                lineHeight: 21,
                padding: {
                    top: 10,
                },
                lineNumbersMinChars: 3,
                minimap: {
                    enabled: false,
                },
                quickSuggestions: {
                    strings: false,
                },
                wordWrap: 'on',
                wrappingIndent: 'same',
                renderLineHighlight: 'none',
                scrollBeyondLastLine: false,
            }}
            theme={isDark ? 'custom-dark' : 'blueberryLight'}
            width="100%"
            {...props}
        />
    );
}
