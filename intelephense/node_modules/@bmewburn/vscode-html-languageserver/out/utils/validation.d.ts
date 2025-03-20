import { Connection, Diagnostic, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-html-languageservice';
import { RuntimeEnvironment } from '../htmlServer';
export type Validator = (textDocument: TextDocument) => Promise<Diagnostic[]>;
export type DiagnosticsSupport = {
    dispose(): void;
    requestRefresh(): void;
};
export declare function registerDiagnosticsPushSupport(documents: TextDocuments<TextDocument>, connection: Connection, runtime: RuntimeEnvironment, validate: Validator): DiagnosticsSupport;
export declare function registerDiagnosticsPullSupport(documents: TextDocuments<TextDocument>, connection: Connection, runtime: RuntimeEnvironment, validate: Validator): DiagnosticsSupport;
