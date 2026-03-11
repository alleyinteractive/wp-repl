import type * as Monaco from 'monaco-editor';

import { completionRegistry } from '../registry';
import { buildHoverMarkdown } from '../utils';

/**
 * Register a Monaco HoverProvider for the 'php' language.
 * When the user hovers over a function name that exists in the
 * CompletionRegistry, a rich Markdown tooltip is shown with the full
 * signature, parameter details, return type, and a documentation link.
 */
export function registerHoverProvider(monaco: typeof Monaco): void {
    monaco.languages.registerHoverProvider('php', {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const fn = completionRegistry.getFunction(word.word);
            if (!fn) return null;

            return {
                contents: [buildHoverMarkdown(fn, monaco)],
                range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                },
            };
        },
    });
}
