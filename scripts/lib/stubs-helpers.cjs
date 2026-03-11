/* eslint-disable @typescript-eslint/no-require-imports */
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
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
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
            if (currentTag !== undefined) {
                logical.push({ tag: currentTag, text: currentText.trim() });
            }
            currentTag = tagMatch[1];
            currentText = tagMatch[2];
        } else {
            currentText += ' ' + stripped;
        }
    }
    if (currentTag !== undefined) {
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

module.exports = { stripHtml, parseDocBlock };
