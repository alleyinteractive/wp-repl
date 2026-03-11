import type * as Monaco from 'monaco-editor';

import { classRegistry } from '../class-registry';
import type { PhpClass, PhpMethod, PhpParam } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a Monaco snippet insertion text for a class constructor.
 * e.g. DOMDocument(${1:version}, ${2:encoding})
 */
function buildConstructorSnippet(cls: PhpClass): string {
    if (cls.constructorParams.length === 0) return `${cls.name}()`;
    const snippets = cls.constructorParams.map((p, i) => `\${${i + 1}:${p.name}}`).join(', ');
    return `${cls.name}(${snippets})`;
}

/**
 * Build a Monaco snippet insertion text for a method call.
 * e.g. createElement(${1:localName}, ${2:value})
 */
function buildMethodSnippet(method: PhpMethod): string {
    if (method.params.length === 0) return `${method.name}()`;
    const snippets = method.params.map((p, i) => `\${${i + 1}:${p.name}}`).join(', ');
    return `${method.name}(${snippets})`;
}

/**
 * Build a human-readable parameter list for the detail string.
 */
function buildParamList(params: PhpParam[]): string {
    return params
        .map((p) => {
            const t = p.type ? `${p.type} ` : '';
            return `${t}$${p.name}${p.optional ? '?' : ''}`;
        })
        .join(', ');
}

/**
 * Build a Markdown hover string for a class.
 */
function buildClassMarkdown(cls: PhpClass): Monaco.IMarkdownString {
    const lines: string[] = [];

    const ctorSig = cls.constructorParams.length > 0 ? `(${buildParamList(cls.constructorParams)})` : '()';
    lines.push('```php');
    lines.push(`class ${cls.name}${ctorSig}`);
    lines.push('```');
    lines.push('');

    if (cls.description) {
        lines.push(cls.description);
        lines.push('');
    }

    if (cls.constructorParams.length > 0) {
        lines.push('**Constructor Parameters:**');
        lines.push('');
        for (const p of cls.constructorParams) {
            const type = p.type ? ` *(${p.type})*` : '';
            const opt = p.optional ? ' *(optional)*' : '';
            const desc = p.description ? ` — ${p.description}` : '';
            lines.push(`- \`$${p.name}\`${type}${opt}${desc}`);
        }
        lines.push('');
    }

    if (cls.docLink) {
        lines.push(`[View Documentation →](${cls.docLink})`);
    }

    return { value: lines.join('\n'), isTrusted: true, supportThemeIcons: true };
}

/**
 * Build a Markdown hover string for a method.
 */
export function buildMethodMarkdown(method: PhpMethod, className: string): Monaco.IMarkdownString {
    const lines: string[] = [];

    const sig = `${className}::${method.name}(${buildParamList(method.params)})${method.returnType ? `: ${method.returnType}` : ''}`;
    lines.push('```php');
    lines.push(method.isStatic ? `static function ${sig}` : `function ${sig}`);
    lines.push('```');
    lines.push('');

    if (method.description) {
        lines.push(method.description);
        lines.push('');
    }

    if (method.params.length > 0) {
        lines.push('**Parameters:**');
        lines.push('');
        for (const p of method.params) {
            const type = p.type ? ` *(${p.type})*` : '';
            const opt = p.optional ? ' *(optional)*' : '';
            const desc = p.description ? ` — ${p.description}` : '';
            lines.push(`- \`$${p.name}\`${type}${opt}${desc}`);
        }
        lines.push('');
    }

    if (method.returnType) {
        const retDesc = method.returnDescription ? `: ${method.returnDescription}` : '';
        lines.push(`**Returns:** \`${method.returnType}\`${retDesc}`);
        lines.push('');
    }

    if (method.docLink) {
        lines.push(`[View Documentation →](${method.docLink})`);
    }

    return { value: lines.join('\n'), isTrusted: true, supportThemeIcons: true };
}

// ─── Type Inference ──────────────────────────────────────────────────────────

/**
 * Infer the PHP class name of a variable by scanning backward through the
 * document text for an assignment like `$varName = new ClassName(`.
 *
 * Returns the last (closest) matching class name, or null if not found.
 */
export function inferVariableClass(docText: string, varName: string): string | null {
    // Escape regex special chars in variable name
    const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\$${escaped}\\s*=\\s*new\\s+([A-Za-z_\\\\][A-Za-z0-9_\\\\]*)`, 'g');

    let className: string | null = null;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(docText)) !== null) {
        className = match[1];
    }

    // Strip leading backslash if present (e.g. \DOMDocument → DOMDocument)
    return className ? className.replace(/^\\/, '') : null;
}

// ─── Providers ───────────────────────────────────────────────────────────────

/**
 * Register Monaco completion providers for PHP class completion:
 *
 *   1. After `new ` — suggest class names with constructor snippets.
 *   2. After `$var->` — infer the variable's class from its assignment and
 *      suggest instance methods.
 *   3. After `ClassName::` — suggest static methods.
 */
export function registerClassCompletionProvider(monaco: typeof Monaco): void {
    // Provider 1: `new ClassName` completions
    monaco.languages.registerCompletionItemProvider('php', {
        triggerCharacters: [' '],

        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const lineText = model.getLineContent(position.lineNumber);
            const textBeforeWord = lineText.substring(0, word.startColumn - 1);

            // Only trigger when we're after "new " (with at least one space)
            if (!/\bnew\s+$/.test(textBeforeWord)) return null;

            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions: Monaco.languages.CompletionItem[] = classRegistry.getAll().map((cls) => ({
                label: cls.name,
                kind: monaco.languages.CompletionItemKind.Class,
                // WordPress class names follow the WP_ prefix convention; also catch
                // lower-case conventions like Walker, Requests_* etc via their doc link origin.
                detail:
                    cls.name.startsWith('WP_') || cls.docLink?.startsWith('https://developer.wordpress.org/')
                        ? 'WordPress class'
                        : 'PHP class',
                documentation: buildClassMarkdown(cls),
                insertText: buildConstructorSnippet(cls),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range,
            }));

            return { suggestions };
        },
    });

    // Provider 2: `$var->method` completions
    monaco.languages.registerCompletionItemProvider('php', {
        triggerCharacters: ['>'],

        provideCompletionItems: (model, position) => {
            const lineText = model.getLineContent(position.lineNumber);
            const colBefore = position.column - 1;

            // Must be right after "->"
            if (lineText[colBefore - 1] !== '>' || lineText[colBefore - 2] !== '-') return null;

            // Extract the variable name before ->
            const textBeforeArrow = lineText.substring(0, colBefore - 2).trimEnd();
            const varMatch = textBeforeArrow.match(/\$([a-zA-Z_][a-zA-Z0-9_]*)$/);
            if (!varMatch) return null;

            const varName = varMatch[1];
            const docText = model.getValue();
            const className = inferVariableClass(docText, varName);
            if (!className) return null;

            const cls = classRegistry.getClass(className);
            if (!cls) return null;

            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column,
            };

            const suggestions: Monaco.languages.CompletionItem[] = cls.methods
                .filter((m) => !m.isStatic)
                .map((method) => ({
                    label: method.name,
                    kind: monaco.languages.CompletionItemKind.Method,
                    detail: method.returnType ? `→ ${method.returnType}` : `${className} method`,
                    documentation: buildMethodMarkdown(method, className),
                    insertText: buildMethodSnippet(method),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range,
                }));

            return { suggestions };
        },
    });

    // Provider 3: `ClassName::staticMethod` completions
    monaco.languages.registerCompletionItemProvider('php', {
        triggerCharacters: [':'],

        provideCompletionItems: (model, position) => {
            const lineText = model.getLineContent(position.lineNumber);
            const colBefore = position.column - 1;

            // Must be right after "::"
            if (lineText[colBefore - 1] !== ':' || lineText[colBefore - 2] !== ':') return null;

            // Extract class name before ::
            const textBeforeColons = lineText.substring(0, colBefore - 2);
            const classMatch = textBeforeColons.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
            if (!classMatch) return null;

            const cls = classRegistry.getClass(classMatch[1]);
            if (!cls) return null;

            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column,
            };

            const staticMethods = cls.methods.filter((m) => m.isStatic);
            if (staticMethods.length === 0) return null;

            const suggestions: Monaco.languages.CompletionItem[] = staticMethods.map((method) => ({
                label: method.name,
                kind: monaco.languages.CompletionItemKind.Method,
                detail: method.returnType ? `→ ${method.returnType}` : `${cls.name} static method`,
                documentation: buildMethodMarkdown(method, cls.name),
                insertText: buildMethodSnippet(method),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range,
            }));

            return { suggestions };
        },
    });
}
