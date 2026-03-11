import type * as Monaco from 'monaco-editor';

import { completionRegistry } from '../registry';
import { buildSignatureLabel } from '../utils';

/**
 * Register a Monaco SignatureHelpProvider for the 'php' language.
 * As the user types inside a function call's parentheses, the provider
 * shows inline parameter hints — highlighting the active parameter.
 */
export function registerSignatureHelpProvider(monaco: typeof Monaco): void {
    monaco.languages.registerSignatureHelpProvider('php', {
        signatureHelpTriggerCharacters: ['(', ','],
        signatureHelpRetriggerCharacters: [','],

        provideSignatureHelp: (model, position) => {
            // Gather all text from the start of the document up to the cursor.
            const textBeforeCursor = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });

            // Walk backwards to find the nearest unmatched opening parenthesis,
            // counting commas at the same depth to determine the active parameter.
            let parenDepth = 0;
            let funcCallStart = -1;
            let activeParam = 0;

            for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
                const ch = textBeforeCursor[i];
                if (ch === ')') {
                    parenDepth++;
                } else if (ch === '(') {
                    if (parenDepth === 0) {
                        funcCallStart = i;
                        break;
                    }
                    parenDepth--;
                } else if (ch === ',' && parenDepth === 0) {
                    activeParam++;
                }
            }

            if (funcCallStart < 0) return null;

            // Extract the function name immediately before the opening parenthesis.
            const before = textBeforeCursor.slice(0, funcCallStart);
            const nameMatch = before.match(/([a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*)\s*$/);
            if (!nameMatch) return null;

            const fn = completionRegistry.getFunction(nameMatch[1]);
            if (!fn) return null;

            const parameters: Monaco.languages.ParameterInformation[] = fn.params.map((p) => {
                const type = p.type ? `${p.type} ` : '';
                const label = `${type}$${p.name}`;
                return {
                    label,
                    documentation: p.description ? { value: p.description } : undefined,
                };
            });

            return {
                value: {
                    signatures: [
                        {
                            label: buildSignatureLabel(fn),
                            documentation: fn.description ? { value: fn.description } : undefined,
                            parameters,
                        },
                    ],
                    activeSignature: 0,
                    activeParameter: Math.min(activeParam, Math.max(0, fn.params.length - 1)),
                },
                dispose: () => {},
            };
        },
    });
}
