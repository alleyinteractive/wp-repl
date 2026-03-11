import type * as Monaco from 'monaco-editor';

import type { PhpFunction } from './types';

/**
 * Build the Monaco snippet insertion text for a function.
 * e.g. array_map(${1:callback}, ${2:array})
 */
export function buildSnippet(fn: PhpFunction): string {
    if (fn.params.length === 0) {
        return `${fn.name}()`;
    }
    const paramSnippets = fn.params.map((p, i) => `\${${i + 1}:${p.name}}`).join(', ');
    return `${fn.name}(${paramSnippets})`;
}

/**
 * Build a human-readable signature label for hover/signature-help display.
 * e.g. array_map(callable|null $callback, array $array, array ...$arrays): array
 */
export function buildSignatureLabel(fn: PhpFunction): string {
    const params = fn.params
        .map((p) => {
            const type = p.type ? `${p.type} ` : '';
            return `${type}$${p.name}${p.optional ? ' = ...' : ''}`;
        })
        .join(', ');
    const ret = fn.returnType ? `: ${fn.returnType}` : '';
    return `${fn.name}(${params})${ret}`;
}

/**
 * Build the rich Markdown string shown in a hover tooltip for a function.
 */
export function buildHoverMarkdown(fn: PhpFunction, monaco: typeof Monaco): Monaco.IMarkdownString {
    const lines: string[] = [];

    // Signature in a PHP code block
    lines.push('```php');
    lines.push(`function ${buildSignatureLabel(fn)}`);
    lines.push('```');
    lines.push('');

    // Short description
    if (fn.description) {
        lines.push(fn.description);
        lines.push('');
    }

    // Parameter list
    if (fn.params.length > 0) {
        lines.push('**Parameters:**');
        lines.push('');
        for (const p of fn.params) {
            const type = p.type ? ` *(${p.type})*` : '';
            const opt = p.optional ? ' *(optional)*' : '';
            const desc = p.description ? ` — ${p.description}` : '';
            lines.push(`- \`$${p.name}\`${type}${opt}${desc}`);
        }
        lines.push('');
    }

    // Return type
    if (fn.returnType) {
        const retDesc = fn.returnDescription ? `: ${fn.returnDescription}` : '';
        lines.push(`**Returns:** \`${fn.returnType}\`${retDesc}`);
        lines.push('');
    }

    // WordPress since version
    if (fn.since) {
        lines.push(`**Since:** ${fn.since}`);
        lines.push('');
    }

    // Documentation link
    if (fn.docLink) {
        lines.push(`[View Documentation →](${fn.docLink})`);
    }

    return {
        value: lines.join('\n'),
        isTrusted: true,
        supportThemeIcons: true,
    };
}
