// https://github.com/TypeFox/monaco-languageclient/blob/67f35c21d957d0ba14691256e563e42dc513847d/packages/examples/src/bare/client.ts#L16
/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import { initServices } from 'monaco-languageclient/vscode/services';
// import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
// import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api';
// monaco-editor does not supply json highlighting with the json worker,
// that's why we use the textmate extension from VSCode
// import '@codingame/monaco-vscode-json-default-extension';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient/browser.js';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { ConsoleLogger } from 'monaco-languageclient/tools';
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';
import { DEFAULT_CODE } from '@/context';

export const runClient = async (htmlContainer: HTMLElement) => {
    const logger = new ConsoleLogger(LogLevel.Debug);
    await initServices({
        // serviceOverrides: {
        //     ...getTextmateServiceOverride(),
        //     ...getThemeServiceOverride()
        // },
        // userConfiguration: {
        //     json: JSON.stringify({
        //         'editor.experimental.asyncTokenization': true
        //     })
        // },
    }, {
        htmlContainer,
        logger
    });

    // register the JSON language with Monaco
    monaco.languages.register({ id: 'php', extensions: ['.php'], aliases: ['PHP', 'php']});
    // monaco.languages.register({
    //     id: 'php',
    //     // extensions: ['.php'],
    //     // aliases: ['PHP', 'php'],
    //     // mimetypes: ['application/x-php', 'text/x-php'],
    // });

    configureDefaultWorkerFactory(logger);

    // create monaco editor
    monaco.editor.create(htmlContainer, {
        value: DEFAULT_CODE,
        language: 'php',
        automaticLayout: true,
        wordBasedSuggestions: 'off'
    });
    initWebSocketAndStartClient('ws://localhost:3000');
};

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
            documentSelector: ['php'],
            // disable the default error handler
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart })
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        messageTransports
    });
};
