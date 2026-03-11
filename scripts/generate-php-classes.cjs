#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * Generate PHP native class data from JetBrains phpstorm-stubs.
 *
 * This script parses phpstorm-stubs PHP files and extracts class declarations,
 * constructors, and public method signatures for Monaco editor autocomplete.
 *
 * Usage:
 *   npm run generate:php-classes
 *
 * The script will:
 * 1. Clone/update the phpstorm-stubs repository
 * 2. Parse all PHP stub files for global-namespace class declarations
 * 3. Extract class names, constructor params, and public methods
 * 4. Generate resources/js/data/php-classes.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { stripHtml, parseDocBlock, parseParams, extractParamSection, extractReturnType } = require('./lib/stubs-helpers.cjs');

const STUBS_REPO = 'https://github.com/JetBrains/phpstorm-stubs.git';
const TEMP_DIR = path.join(__dirname, '../.tmp/phpstorm-stubs');
const OUTPUT_FILE = path.join(__dirname, '../resources/js/data/php-classes.json');

const SKIP_DIRS = new Set(['.git', '.github', 'tests', 'PhpStormStubsMap', 'meta', 'vendor']);
const SKIP_FILES = new Set(['StubsMap.php']);

// Magic methods to skip as regular completions (keep __construct for constructor params)
const SKIP_METHODS = new Set([
    '__destruct', '__toString', '__serialize', '__unserialize',
    '__sleep', '__wakeup', '__invoke', '__set_state', '__clone',
    '__debugInfo', '__get', '__set', '__isset', '__unset',
]);

console.log('🔧 PHP Native Classes Generator\n');

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

// Step 2: Collect PHP stub files (same as function generator)
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

// Step 3: Parse each stub file for class declarations
console.log('📖 Parsing class declarations...');

const classes = new Map();

/**
 * Scan backward from line i to find and parse the PHPDoc block above it.
 * Skips PHP 8 attributes (#[...]) between the docblock and the declaration.
 */
function findDocBlock(lines, i) {
    for (let k = i - 1; k >= 0 && k >= i - 50; k--) {
        const prevLine = lines[k].trim();
        if (prevLine.startsWith('#[')) continue; // PHP 8 attribute
        if (prevLine === '*/') {
            for (let m = k - 1; m >= 0 && m >= k - 200; m--) {
                if (lines[m].trim() === '/**') {
                    return lines.slice(m + 1, k + 1);
                }
            }
            return null;
        }
        // Stop if we hit non-blank, non-comment content
        if (prevLine !== '' && !prevLine.startsWith('*')) return null;
    }
    return null;
}

/**
 * Collect a full multi-line PHP signature (until parens are balanced).
 */
function collectFullSignature(lines, startLine) {
    let full = lines[startLine].trim();
    let j = startLine;
    let depth = (full.match(/\(/g) || []).length - (full.match(/\)/g) || []).length;
    while (depth > 0 && j < Math.min(startLine + 30, lines.length - 1)) {
        j++;
        const next = lines[j].trim();
        full += ' ' + next;
        depth += (next.match(/\(/g) || []).length - (next.match(/\)/g) || []).length;
    }
    return full;
}

/**
 * Parse a single stub file for class declarations.
 * Tracks namespace blocks to only capture global-namespace classes.
 */
function parseStubFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let braceDepth = 0;
    // null = global, 'Foo' = named namespace
    let currentNamespace = null;
    // depth at which we entered the current namespace block (for namespace { ... } syntax)
    let namespaceBlockDepth = null;

    let currentClass = null; // { name, bodyDepth, description, docLink, constructorParams, methods }

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();

        // Track namespace declarations before counting braces
        // "namespace Foo;" = file-level named namespace (no braces)
        const fileNsMatch = trimmed.match(/^namespace\s+([A-Za-z_][A-Za-z0-9_\\]*)\s*;/);
        if (fileNsMatch) {
            currentNamespace = fileNsMatch[1];
            namespaceBlockDepth = null;
        }
        // "namespace Foo {" = block-scoped named namespace
        const blockNsMatch = trimmed.match(/^namespace\s+([A-Za-z_][A-Za-z0-9_\\]*)\s*\{/);
        if (blockNsMatch) {
            currentNamespace = blockNsMatch[1];
            namespaceBlockDepth = braceDepth + 1; // depth inside the block
        }
        // "namespace {" = global namespace block
        const globalNsMatch = trimmed.match(/^namespace\s*\{/);
        if (globalNsMatch) {
            currentNamespace = null; // global
            namespaceBlockDepth = braceDepth + 1;
        }

        // We only process classes in global namespace
        const inGlobalNamespace = currentNamespace === null;

        // --- BEFORE brace counting: look for declarations ---

        // Look for class declaration when NOT already inside a class AND in global namespace
        if (!currentClass && inGlobalNamespace) {
            const classMatch = trimmed.match(
                /^(?:(?:abstract|final|readonly)\s+)*class\s+([A-Za-z_][A-Za-z0-9_]*)/,
            );
            if (classMatch) {
                const docLines = findDocBlock(lines, i);
                const doc = docLines ? parseDocBlock(docLines) : {};

                currentClass = {
                    name: classMatch[1],
                    bodyDepth: braceDepth + 1,
                    description: doc.description || '',
                    docLink: doc.docLink || '',
                    constructorParams: [],
                    methods: [],
                };
            }
        }

        if (currentClass && braceDepth === currentClass.bodyDepth) {
            // Inside the class body at the direct member level.
            const methodMatch = trimmed.match(
                /^(?:(?:abstract|final|static|public|protected|private)\s+)*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
            );

            if (methodMatch) {
                const methodName = methodMatch[1];
                const isPrivate = /\bprivate\b/.test(trimmed);
                const isProtected = /\bprotected\b/.test(trimmed);

                if (!isPrivate && !isProtected) {
                    const isStatic = /\bstatic\b/.test(trimmed);
                    const fullSig = collectFullSignature(lines, i);

                    const rawParams = extractParamSection(fullSig);
                    const paramList = parseParams(rawParams);
                    const signatureReturnType = extractReturnType(fullSig);

                    const docLines = findDocBlock(lines, i);
                    let description = '';
                    let returnType = signatureReturnType;
                    let returnDescription = '';
                    let docLink = '';

                    if (docLines) {
                        const doc = parseDocBlock(docLines);
                        description = doc.description;
                        if (!returnType) returnType = doc.returnType;
                        returnDescription = doc.returnDescription;
                        docLink = doc.docLink;

                        for (const param of paramList) {
                            const docParam = doc.paramDocs.get(param.name);
                            if (docParam) {
                                if (docParam.type) param.type = docParam.type;
                                if (docParam.description) param.description = docParam.description;
                            }
                        }
                    }

                    if (methodName === '__construct') {
                        currentClass.constructorParams = paramList;
                    } else if (!SKIP_METHODS.has(methodName)) {
                        const entry = {
                            name: methodName,
                            description: description || '',
                            params: paramList,
                        };
                        if (returnType) entry.returnType = returnType;
                        if (returnDescription) entry.returnDescription = returnDescription;
                        if (docLink) entry.docLink = docLink;
                        if (isStatic) entry.isStatic = true;
                        currentClass.methods.push(entry);
                    }
                }
            }
        }

        // --- Count braces AFTER declarations ---
        for (const ch of trimmed) {
            if (ch === '{') braceDepth++;
            else if (ch === '}') {
                braceDepth--;

                // Check if we've exited a namespace block
                if (namespaceBlockDepth !== null && braceDepth < namespaceBlockDepth) {
                    currentNamespace = null;
                    namespaceBlockDepth = null;
                }

                // Check if we've exited the current class
                if (currentClass && braceDepth < currentClass.bodyDepth) {
                    if (!classes.has(currentClass.name)) {
                        classes.set(currentClass.name, {
                            name: currentClass.name,
                            description: currentClass.description,
                            docLink: currentClass.docLink || undefined,
                            constructorParams: currentClass.constructorParams,
                            methods: currentClass.methods,
                        });
                    }
                    currentClass = null;
                }
            }
        }
    }
}

// Parse all stub files
for (const file of stubFiles) {
    try {
        parseStubFile(file);
    } catch (err) {
        console.warn(`   ⚠ Skipped ${path.relative(TEMP_DIR, file)}: ${err.message}`);
    }
}

const classesArray = Array.from(classes.values()).sort((a, b) => a.name.localeCompare(b.name));
console.log(`   ✓ Found ${classesArray.length} unique PHP classes\n`);

// Step 4: Write output
console.log('💾 Writing output file...');
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(classesArray, null, 4));
console.log(`   ✓ Written to ${path.relative(process.cwd(), OUTPUT_FILE)}\n`);

// Show sample classes
console.log('📋 Sample classes:');
const samples = ['DOMDocument', 'Exception', 'PDO', 'SplStack', 'DateTime'];
classesArray
    .filter((c) => samples.includes(c.name))
    .forEach((c) => {
        const ctorParams = c.constructorParams.map((p) => `$${p.name}`).join(', ');
        console.log(`   - ${c.name}(${ctorParams}) — ${c.methods.length} methods`);
        console.log(`     ${c.description.substring(0, 80)}`);
    });

console.log('\n✅ Done!');
