import type * as Monaco from 'monaco-editor';

import { completionRegistry } from '../registry';
import { buildHoverMarkdown, buildSnippet } from '../utils';

/**
 * Register a Monaco CompletionItemProvider for the 'php' language that
 * surfaces every function registered in CompletionRegistry.
 */
export function registerCompletionProvider(monaco: typeof Monaco): void {
    monaco.languages.registerCompletionItemProvider('php', {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions: Monaco.languages.CompletionItem[] = completionRegistry.getAll().map((fn) => {
                const detail = fn.since ? `WordPress function (since ${fn.since})` : 'PHP function';
                return {
                    label: fn.name,
                    kind: monaco.languages.CompletionItemKind.Function,
                    detail,
                    documentation: buildHoverMarkdown(fn),
                    insertText: buildSnippet(fn),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range,
                };
            });

            return { suggestions };
        },
    });
}
