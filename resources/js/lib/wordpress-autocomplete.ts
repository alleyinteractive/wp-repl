import wordpressFunctions from '@/data/wordpress-functions.json';
import type * as Monaco from 'monaco-editor';

interface WordPressFunction {
    name: string;
    signature: string;
    description: string;
    params: Array<{
        name: string;
        optional: boolean;
    }>;
    since: string | null;
}

/**
 * Generates a WordPress developer documentation URL for a function
 */
function getDocumentationUrl(functionName: string): string {
    return `https://developer.wordpress.org/reference/functions/${functionName}/`;
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
                // The signature is already in snippet format with placeholders (e.g., "${1:$option}, ${2:$default}")
                const insertText = func.params.length > 0 ? `${func.name}(${func.signature})` : `${func.name}()`;

                // Build detailed description with version info and link to docs
                const sinceInfo = func.since ? `\n\n**Since:** WordPress ${func.since}` : '';
                const docUrl = getDocumentationUrl(func.name);
                const documentation: Monaco.IMarkdownString = {
                    value: `${func.description}${sinceInfo}\n\n[View Documentation →](${docUrl})`,
                    isTrusted: true,
                    supportThemeIcons: true,
                };

                return {
                    label: func.name,
                    kind: monaco.languages.CompletionItemKind.Function,
                    detail: func.since ? `WordPress function (since ${func.since})` : 'WordPress function',
                    documentation: documentation,
                    insertText: insertText,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: range,
                };
            });

            return { suggestions };
        },
    });
}
