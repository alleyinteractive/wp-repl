/* eslint-disable no-undef */

/**
 * Shared helpers for parsing PHP stub files.
 */

/**
 * Strip HTML tags and decode common HTML entities from a string.
 *
 * PHPDoc in both phpstorm-stubs and wordpress-stubs frequently contains
 * <p>, <b>, <code> tags and entities like &gt;, &lt;, &amp;.
 *
 * @param {string} text
 * @returns {string}
 */
function stripHtml(text) {
    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/&(amp|gt|lt|nbsp|quot|#\d+);/g, (match, entity) => {
            if (entity.startsWith('#')) return String.fromCharCode(parseInt(entity.slice(1), 10));
            const map = { amp: '&', gt: '>', lt: '<', nbsp: ' ', quot: '"' };
            return map[entity] ?? match;
        })
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Parse a PHPDoc block into structured data.
 *
 * Accepts an array of raw lines from inside the /** ... * / block (not
 * including the opening /** or the function declaration itself).
 *
 * Returns an object with:
 *   - description {string}
 *   - paramDocs {Map<string, {type: string, description: string}>}
 *   - returnType {string}
 *   - returnDescription {string}
 *   - docLink {string}   — from @link (phpstorm-stubs)
 *   - since {string}     — from @since (wordpress-stubs)
 *
 * @param {string[]} docLines
 * @returns {{ description: string, paramDocs: Map, returnType: string, returnDescription: string, docLink: string, since: string }}
 */
function parseDocBlock(docLines) {
    let description = '';
    const paramDocs = new Map();
    let returnType = '';
    let returnDescription = '';
    let docLink = '';
    let since = '';

    // Collect logical lines by joining continuation text into its tag
    const logical = [];
    let currentTag = null;
    let currentText = '';

    for (const rawLine of docLines) {
        // Strip leading whitespace + leading asterisk(s) + one optional space
        const stripped = rawLine.trim().replace(/^\*+\s?/, '');

        if (stripped === '/' || stripped === '') continue;

        const tagMatch = stripped.match(/^@([a-zA-Z]+)\s*(.*)/);
        if (tagMatch) {
            if (currentTag !== null) {
                logical.push({ tag: currentTag, text: currentText.trim() });
            }
            currentTag = tagMatch[1];
            currentText = tagMatch[2];
        } else {
            currentText += ' ' + stripped;
        }
    }
    if (currentTag !== null) {
        logical.push({ tag: currentTag, text: currentText.trim() });
    }

    for (const { tag, text } of logical) {
        if (tag === null) {
            if (!description) {
                description = stripHtml(text);
            }
        } else if (tag === 'param') {
            const m = text.match(/^(\S+)\s+\$([a-zA-Z_][a-zA-Z0-9_]*)\s*(.*)/);
            if (m) {
                paramDocs.set(m[2], {
                    type: m[1],
                    description: stripHtml(m[3]),
                });
            }
        } else if (tag === 'return') {
            const m = text.match(/^(\S+)\s*(.*)/);
            if (m) {
                returnType = m[1];
                returnDescription = stripHtml(m[2]);
            }
        } else if (tag === 'link') {
            if (!docLink) {
                docLink = text.split(/\s+/)[0].trim();
            }
        } else if (tag === 'since') {
            if (!since) {
                since = text.match(/([\d.]+)/)?.[1] || '';
            }
        }
    }

    return { description, paramDocs, returnType, returnDescription, docLink, since };
}

/**
 * Extract the parameter section from a PHP function/method signature string.
 * Uses balanced parenthesis matching instead of a simple regex to correctly
 * handle PHP 8 attributes like #[LanguageLevelTypeAware(['8.0' => 'string'], default: '')].
 *
 * @param {string} signature  The full (possibly multi-line joined) function signature.
 * @returns {string} The content between the outermost parentheses, or empty string.
 */
function extractParamSection(signature) {
    const start = signature.indexOf('(');
    if (start === -1) return '';

    let depth = 0;
    for (let i = start; i < signature.length; i++) {
        if (signature[i] === '(') depth++;
        else if (signature[i] === ')') {
            depth--;
            if (depth === 0) return signature.slice(start + 1, i);
        }
    }
    return ''; // unbalanced – shouldn't happen in valid stubs
}

/**
 * Extract the return type from a PHP function/method signature string.
 * Looks for ': TypeName' after the outermost closing parenthesis.
 *
 * @param {string} signature
 * @returns {string} The return type, or empty string.
 */
function extractReturnType(signature) {
    // Find the last closing ) using balanced matching (same as extractParamSection)
    const start = signature.indexOf('(');
    if (start === -1) return '';

    let depth = 0;
    let closingParen = -1;
    for (let i = start; i < signature.length; i++) {
        if (signature[i] === '(') depth++;
        else if (signature[i] === ')') {
            depth--;
            if (depth === 0) {
                closingParen = i;
                break;
            }
        }
    }
    if (closingParen === -1) return '';

    const afterParen = signature.slice(closingParen + 1).trim();
    const m = afterParen.match(/^:\s*([?A-Za-z_\\][A-Za-z0-9_|\\?]*(?:\|[A-Za-z0-9_\\?]+)*)/);
    return m ? m[1] : '';
}

/**
 * Parses a PHP parameter list string into structured param objects.
 * Handles type hints, default values, variadic params, and nullable types.
 * Also handles PHP 8 attributes (#[...]) between type/name.
 *
 * @param {string} rawParams
 * @returns {Array<{name: string, optional: boolean}>}
 */
function parseParams(rawParams) {
    if (!rawParams.trim()) return [];

    // Split by comma but respect nested angle brackets, parens, and braces
    const params = [];
    let current = '';
    let depth = 0;

    for (const char of rawParams) {
        if (char === '(' || char === '<' || char === '[' || char === '{') depth++;
        else if (char === ')' || char === '>' || char === ']' || char === '}') depth--;
        else if (char === ',' && depth === 0) {
            params.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim()) params.push(current.trim());

    return params
        .map((p) => {
            // Strip PHP 8 attributes (#[...]) that can appear before the param
            const stripped = p.trim().replace(/#\[[^\]]*\]\s*/g, '');
            if (!stripped) return null;

            // Extract variable name — might be &$name, ...$name, $name, etc.
            const varMatch = stripped.match(/\.\.\.\$([a-zA-Z_][a-zA-Z0-9_]*)|&?\$([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (!varMatch) return null;

            const paramName = varMatch[1] || varMatch[2];
            const hasDefault = stripped.includes('=');
            const isVariadic = stripped.includes('...');

            return { name: paramName, optional: hasDefault || isVariadic };
        })
        .filter(Boolean);
}

module.exports = { stripHtml, parseDocBlock, parseParams, extractParamSection, extractReturnType };
