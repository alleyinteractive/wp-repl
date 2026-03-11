import type * as Monaco from 'monaco-editor';

import { classRegistry } from '../class-registry';
import { completionRegistry } from '../registry';
import { buildMethodMarkdown } from './class-completion';
import { inferVariableClass } from './class-completion';
import { buildHoverMarkdown } from '../utils';

/**
 * Register a Monaco HoverProvider for the 'php' language.
 *
 * Handles:
 *   - Hovering over a function name → shows function signature + docs.
 *   - Hovering over a class name → shows class description + constructor.
 *   - Hovering over a method name after `->` → shows method docs (with type inference).
 */
export function registerHoverProvider(monaco: typeof Monaco): void {
    monaco.languages.registerHoverProvider('php', {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            // Get text before the word to understand context
            const lineText = model.getLineContent(position.lineNumber);
            const textBeforeWord = lineText.substring(0, word.startColumn - 1);

            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            // --- Check: hovering over a method name after `->` ---
            if (textBeforeWord.trimEnd().endsWith('->')) {
                const varMatch = textBeforeWord.trimEnd().match(/\$([a-zA-Z_][a-zA-Z0-9_]*)\s*->\s*$/);
                if (varMatch) {
                    const docText = model.getValue();
                    const className = inferVariableClass(docText, varMatch[1]);
                    if (className) {
                        const cls = classRegistry.getClass(className);
                        const method = cls?.methods.find((m) => m.name === word.word);
                        if (method) {
                            return { contents: [buildMethodMarkdown(method, className)], range };
                        }
                    }
                }
            }

            // --- Check: hovering over a static method after `::` ---
            if (textBeforeWord.trimEnd().endsWith('::')) {
                const classMatch = textBeforeWord.trimEnd().match(/([A-Za-z_][A-Za-z0-9_]*)\s*::\s*$/);
                if (classMatch) {
                    const cls = classRegistry.getClass(classMatch[1]);
                    const method = cls?.methods.find((m) => m.name === word.word && m.isStatic);
                    if (method && cls) {
                        return { contents: [buildMethodMarkdown(method, cls.name)], range };
                    }
                }
            }

            // --- Check: hovering over a class name (after `new` or standalone) ---
            const cls = classRegistry.getClass(word.word);
            if (cls) {
                const lines: string[] = [];
                const ctorParams = cls.constructorParams
                    .map((p) => {
                        const t = p.type ? `${p.type} ` : '';
                        return `${t}$${p.name}${p.optional ? ' = ...' : ''}`;
                    })
                    .join(', ');

                lines.push('```php');
                lines.push(`class ${cls.name}(${ctorParams})`);
                lines.push('```');
                lines.push('');
                if (cls.description) {
                    lines.push(cls.description);
                    lines.push('');
                }
                if (cls.methods.length > 0) {
                    lines.push(`*${cls.methods.length} public method${cls.methods.length === 1 ? '' : 's'}*`);
                    lines.push('');
                }
                if (cls.docLink) {
                    lines.push(`[View Documentation →](${cls.docLink})`);
                }
                return {
                    contents: [{ value: lines.join('\n'), isTrusted: true, supportThemeIcons: true }],
                    range,
                };
            }

            // --- Default: hovering over a function name ---
            const fn = completionRegistry.getFunction(word.word);
            if (!fn) return null;

            return { contents: [buildHoverMarkdown(fn, monaco)], range };
        },
    });
}
