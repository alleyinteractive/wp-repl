import type * as Monaco from 'monaco-editor';

import { classRegistry } from '../class-registry';
import { completionRegistry } from '../registry';
import type { PhpMethod, PhpParam } from '../types';
import { buildSignatureLabel } from '../utils';
import { inferVariableClass } from './class-completion';

/**
 * Build ParameterInformation objects from a param list.
 */
function buildParameters(params: PhpParam[]): Monaco.languages.ParameterInformation[] {
    return params.map((p) => {
        const type = p.type ? `${p.type} ` : '';
        return {
            label: `${type}$${p.name}`,
            documentation: p.description ? { value: p.description } : undefined,
        };
    });
}

/**
 * Build a signature label for a method (ClassName::method or ClassName->method).
 */
function buildMethodSignatureLabel(method: PhpMethod, className: string): string {
    const params = method.params
        .map((p) => {
            const type = p.type ? `${p.type} ` : '';
            return `${type}$${p.name}${p.optional ? ' = ...' : ''}`;
        })
        .join(', ');
    const ret = method.returnType ? `: ${method.returnType}` : '';
    const sep = method.isStatic ? '::' : '->';
    return `${className}${sep}${method.name}(${params})${ret}`;
}

/**
 * Register a Monaco SignatureHelpProvider for the 'php' language.
 * As the user types inside a function/method/constructor call's parentheses,
 * the provider shows inline parameter hints — highlighting the active parameter.
 *
 * Handles:
 *   - Regular functions:     strlen($string)
 *   - Constructor calls:     new DOMDocument($version, $encoding)
 *   - Instance method calls: $doc->createElement($localName, $value)
 *   - Static method calls:   PDO::getAvailableDrivers()
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

            // Extract the text immediately before the opening parenthesis.
            const before = textBeforeCursor.slice(0, funcCallStart).trimEnd();

            // --- Check: $var->method( ---
            const methodCallMatch = before.match(/\$([a-zA-Z_][a-zA-Z0-9_]*)\s*->\s*([a-zA-Z_][a-zA-Z0-9_]*)$/);
            if (methodCallMatch) {
                const varName = methodCallMatch[1];
                const methodName = methodCallMatch[2];
                const className = inferVariableClass(textBeforeCursor, varName);
                if (className) {
                    const cls = classRegistry.getClass(className);
                    const method = cls?.methods.find((m) => m.name === methodName && !m.isStatic);
                    if (method) {
                        return {
                            value: {
                                signatures: [
                                    {
                                        label: buildMethodSignatureLabel(method, className),
                                        documentation: method.description ? { value: method.description } : undefined,
                                        parameters: buildParameters(method.params),
                                    },
                                ],
                                activeSignature: 0,
                                activeParameter: Math.min(activeParam, Math.max(0, method.params.length - 1)),
                            },
                            dispose: () => {},
                        };
                    }
                }
            }

            // --- Check: ClassName::method( ---
            const staticCallMatch = before.match(/([A-Za-z_][A-Za-z0-9_]*)\s*::\s*([a-zA-Z_][a-zA-Z0-9_]*)$/);
            if (staticCallMatch) {
                const cls = classRegistry.getClass(staticCallMatch[1]);
                const method = cls?.methods.find((m) => m.name === staticCallMatch[2] && m.isStatic);
                if (method) {
                    return {
                        value: {
                            signatures: [
                                {
                                    label: buildMethodSignatureLabel(method, staticCallMatch[1]),
                                    documentation: method.description ? { value: method.description } : undefined,
                                    parameters: buildParameters(method.params),
                                },
                            ],
                            activeSignature: 0,
                            activeParameter: Math.min(activeParam, Math.max(0, method.params.length - 1)),
                        },
                        dispose: () => {},
                    };
                }
            }

            // Extract function/class name immediately before the opening paren.
            const nameMatch = before.match(/([a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*)\s*$/);
            if (!nameMatch) return null;

            const name = nameMatch[1];

            // --- Check: new ClassName( ---
            const isConstructor = /\bnew\s+$/.test(before.slice(0, before.lastIndexOf(name)));
            if (isConstructor) {
                const cls = classRegistry.getClass(name);
                if (cls) {
                    const ctorSig = `new ${cls.name}(${cls.constructorParams
                        .map((p) => {
                            const t = p.type ? `${p.type} ` : '';
                            return `${t}$${p.name}${p.optional ? ' = ...' : ''}`;
                        })
                        .join(', ')})`;
                    return {
                        value: {
                            signatures: [
                                {
                                    label: ctorSig,
                                    documentation: cls.description ? { value: cls.description } : undefined,
                                    parameters: buildParameters(cls.constructorParams),
                                },
                            ],
                            activeSignature: 0,
                            activeParameter: Math.min(activeParam, Math.max(0, cls.constructorParams.length - 1)),
                        },
                        dispose: () => {},
                    };
                }
            }

            // --- Regular function ---
            const fn = completionRegistry.getFunction(name);
            if (!fn) return null;

            return {
                value: {
                    signatures: [
                        {
                            label: buildSignatureLabel(fn),
                            documentation: fn.description ? { value: fn.description } : undefined,
                            parameters: buildParameters(fn.params),
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
