#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * Generate PHP native function data from JetBrains phpstorm-stubs.
 *
 * This script parses phpstorm-stubs PHP files and extracts global function signatures,
 * descriptions, and documentation links for Monaco editor autocomplete.
 *
 * Usage:
 *   npm run generate:php-functions
 *
 * The script will:
 * 1. Clone/update the phpstorm-stubs repository
 * 2. Parse all PHP stub files for global function declarations
 * 3. Extract function names, signatures, and PHPDoc comments
 * 4. Generate resources/js/data/php-functions.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STUBS_REPO = 'https://github.com/JetBrains/phpstorm-stubs.git';
const TEMP_DIR = path.join(__dirname, '../.tmp/phpstorm-stubs');
const OUTPUT_FILE = path.join(__dirname, '../resources/js/data/php-functions.json');

// Directories to skip in the stubs repo (meta/tooling, not PHP extension stubs)
const SKIP_DIRS = new Set(['.git', '.github', 'tests', 'PhpStormStubsMap', 'meta', 'vendor']);

// Some stubs files contain only class definitions, skip files with these names
const SKIP_FILES = new Set(['StubsMap.php']);

console.log('🔧 PHP Native Functions Generator\n');

// Step 1: Clone or update phpstorm-stubs repository
console.log('📦 Fetching phpstorm-stubs repository...');
if (fs.existsSync(TEMP_DIR)) {
    console.log('   Updating existing repository...');
    try {
        execSync('git pull', { cwd: TEMP_DIR, stdio: 'pipe' });
    } catch {
        console.log('   Pull failed, removing and re-cloning...');
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        execSync(`git clone --depth 1 ${STUBS_REPO} ${TEMP_DIR}`, { stdio: 'pipe' });
    }
} else {
    console.log('   Cloning repository...');
    fs.mkdirSync(path.dirname(TEMP_DIR), { recursive: true });
    execSync(`git clone --depth 1 ${STUBS_REPO} ${TEMP_DIR}`, { stdio: 'pipe' });
}
console.log('   ✓ Repository ready\n');

// Step 2: Collect all .php stub files
console.log('🔍 Scanning for PHP stub files...');

function collectPhpFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) {
                results.push(...collectPhpFiles(path.join(dir, entry.name)));
            }
        } else if (entry.isFile() && entry.name.endsWith('.php') && !SKIP_FILES.has(entry.name)) {
            results.push(path.join(dir, entry.name));
        }
    }

    return results;
}

const stubFiles = collectPhpFiles(TEMP_DIR);
console.log(`   ✓ Found ${stubFiles.length} stub files\n`);

// Step 3: Parse each stub file for global functions
console.log('📖 Parsing function declarations...');

const functions = new Map();

/**
 * Parses a single stub file and extracts global PHP function declarations.
 * Tracks class/interface context to skip methods.
 */
function parseStubFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Track brace depth to determine if we're inside a class/interface/trait
    let braceDepth = 0;
    let classDepth = null; // brace depth when we entered a class context

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Track class/interface/trait context
        if (/^(class|interface|trait|abstract\s+class|final\s+class)\s+/.test(trimmed)) {
            // Opening brace might be on this line or the next
            const openOnSameLine = trimmed.includes('{');
            if (openOnSameLine) {
                classDepth = braceDepth + 1;
            } else {
                // Look for opening brace on next line(s)
                for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                    if (lines[j].includes('{')) {
                        classDepth = braceDepth + 1;
                        break;
                    }
                }
            }
        }

        // Count braces to track depth
        for (const char of trimmed) {
            if (char === '{') braceDepth++;
            else if (char === '}') {
                braceDepth--;
                // If we've exited the class context
                if (classDepth !== null && braceDepth < classDepth) {
                    classDepth = null;
                }
            }
        }

        // Only look for functions when we're NOT inside a class
        if (classDepth !== null) continue;

        // Match function declarations — handle both single-line and beginning of multi-line
        // We look for: function name( ... ) optionally with return type, ending with { or ;
        const funcMatch = trimmed.match(/^function\s+([a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*)\s*\(/);
        if (!funcMatch) continue;

        const functionName = funcMatch[1];

        // Skip PHP magic functions and internal-looking functions
        if (functionName.startsWith('__')) continue;

        // Collect the full function signature (may span multiple lines due to params)
        let fullSignature = trimmed;
        let j = i;

        // If the opening paren isn't closed on this line, look ahead
        let parenDepth = (fullSignature.match(/\(/g) || []).length - (fullSignature.match(/\)/g) || []).length;
        while (parenDepth > 0 && j < Math.min(i + 20, lines.length - 1)) {
            j++;
            const nextLine = lines[j].trim();
            fullSignature += ' ' + nextLine;
            parenDepth += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
        }

        // Extract the params section from the full signature
        const paramSectionMatch = fullSignature.match(/^function\s+[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*\s*\((.*?)\)/s);
        const rawParams = paramSectionMatch ? paramSectionMatch[1] : '';

        // Look backward for PHPDoc comment
        let shortDescription = '';
        let docLink = '';

        for (let k = i - 1; k >= 0 && k >= i - 100; k--) {
            const prevLine = lines[k].trim();

            if (prevLine === '/**') {
                for (let m = k + 1; m < i; m++) {
                    const docLine = lines[m].trim();

                    // First non-tag, non-empty line is the short description
                    if (docLine.startsWith('*') && !docLine.startsWith('* @') && !shortDescription) {
                        const text = docLine.replace(/^\*\s*/, '').trim();
                        if (text && text !== '/') {
                            shortDescription = text;
                        }
                    }

                    // Extract @link for documentation URL
                    const linkMatch = docLine.match(/^\*\s*@link\s+(https?:\/\/\S+)/);
                    if (linkMatch && !docLink) {
                        docLink = linkMatch[1];
                    }
                }
                break;
            }

            // Stop scanning backwards if we hit non-comment content
            if (!prevLine.startsWith('*') && prevLine !== '' && prevLine !== '/') {
                break;
            }
        }

        // Parse the parameter list into structured data
        const paramList = parseParams(rawParams);

        // Build snippet signature for Monaco
        const signature = paramList
            .map((p, idx) => `\${${idx + 1}:${p.name}}`)
            .join(', ');

        if (!functions.has(functionName)) {
            functions.set(functionName, {
                name: functionName,
                signature,
                description: shortDescription || `PHP function ${functionName}`,
                params: paramList,
                docLink: docLink || null,
            });
        }
    }
}

/**
 * Parses a PHP parameter list string into structured param objects.
 * Handles type hints, default values, variadic params, and nullable types.
 */
function parseParams(rawParams) {
    if (!rawParams.trim()) return [];

    // Split by comma but respect nested angle brackets (generics in type hints) and parens
    const params = [];
    let current = '';
    let depth = 0;

    for (const char of rawParams) {
        if (char === '(' || char === '<' || char === '[') depth++;
        else if (char === ')' || char === '>' || char === ']') depth--;
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
            const trimmed = p.trim();
            if (!trimmed) return null;

            // Extract variable name — might be &$name, ...$name, $name, etc.
            const varMatch = trimmed.match(/\.\.\.\$([a-zA-Z_][a-zA-Z0-9_]*)|&?\$([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (!varMatch) return null;

            const paramName = varMatch[1] || varMatch[2];
            const hasDefault = trimmed.includes('=');
            const isVariadic = trimmed.includes('...');

            return { name: paramName, optional: hasDefault || isVariadic };
        })
        .filter(Boolean);
}

// Parse all stub files
for (const file of stubFiles) {
    try {
        parseStubFile(file);
    } catch (err) {
        console.warn(`   ⚠ Skipped ${path.relative(TEMP_DIR, file)}: ${err.message}`);
    }
}

const functionsArray = Array.from(functions.values()).sort((a, b) => a.name.localeCompare(b.name));

console.log(`   ✓ Found ${functionsArray.length} unique PHP functions\n`);

// Step 4: Write output file
console.log('💾 Writing output file...');
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(functionsArray, null, 4));
console.log(`   ✓ Written to ${path.relative(process.cwd(), OUTPUT_FILE)}\n`);

// Show sample functions
console.log('📋 Sample functions:');
const samples = functionsArray.filter((f) => ['array_map', 'str_replace', 'json_encode', 'preg_match', 'sprintf'].includes(f.name));
samples.forEach((f) => {
    console.log(`   - ${f.name}(${f.params.map((p) => p.name).join(', ')})`);
    console.log(`     ${f.description.substring(0, 80)}`);
});

console.log('\n✅ Done!');
