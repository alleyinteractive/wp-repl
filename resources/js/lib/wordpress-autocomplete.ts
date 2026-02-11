import type * as Monaco from 'monaco-editor';
import wordpressFunctions from '@/data/wordpress-functions.json';

interface WordPressFunction {
    name: string;
    signature: string;
    description: string;
    params: Array<{
        name: string;
        optional: boolean;
    }>;
}

/**
 * Registers a completion item provider for WordPress/PHP functions in Monaco editor.
 */
export function registerWordPressAutocomplete(monaco: typeof Monaco): void {
    monaco.languages.registerCompletionItemProvider('php', {
        provideCompletionItems: (model, position) => {
            // Get the word before the cursor
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            // Create completion items from WordPress functions
            const suggestions: Monaco.languages.CompletionItem[] = (wordpressFunctions as WordPressFunction[]).map((func) => {
                // Create snippet for function with parameters
                const insertText = func.params.length > 0 ? `${func.name}(${func.signature})` : `${func.name}()`;

                return {
                    label: func.name,
                    kind: monaco.languages.CompletionItemKind.Function,
                    detail: 'WordPress function',
                    documentation: func.description,
                    insertText: insertText,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: range,
                };
            });

            return { suggestions };
        },
    });
}
