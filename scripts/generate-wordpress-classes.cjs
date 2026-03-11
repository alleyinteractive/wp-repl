#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * Generate WordPress class data from php-stubs/wordpress-stubs.
 *
 * This script parses the wordpress-stubs.php file and extracts WordPress class
 * declarations, constructors, and public methods for Monaco editor autocomplete.
 *
 * Usage:
 *   npm run generate:wordpress-classes
 *
 * The script will:
 * 1. Clone/update the wordpress-stubs repository
 * 2. Parse wordpress-stubs.php for class declarations
 * 3. Extract class names, constructor params, and public methods
 * 4. Generate resources/js/data/wordpress-classes.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseDocBlock, parseParams, extractParamSection, extractReturnType } = require('./lib/stubs-helpers.cjs');

const STUBS_REPO = 'https://github.com/php-stubs/wordpress-stubs.git';
const TEMP_DIR = path.join(__dirname, '../.tmp/wordpress-stubs');
const STUBS_FILE = path.join(TEMP_DIR, 'wordpress-stubs.php');
const OUTPUT_FILE = path.join(__dirname, '../resources/js/data/wordpress-classes.json');

// Magic methods to skip as regular completions
const SKIP_METHODS = new Set([
    '__destruct', '__toString', '__serialize', '__unserialize',
    '__sleep', '__wakeup', '__invoke', '__set_state', '__clone',
    '__debugInfo', '__get', '__set', '__isset', '__unset',
]);

console.log('🔧 WordPress Classes Generator\n');

// Step 1: Clone or update
console.log('📦 Fetching wordpress-stubs repository...');
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

// Step 2: Parse the stubs file
console.log('📖 Parsing wordpress-stubs.php...');
const content = fs.readFileSync(STUBS_FILE, 'utf-8');
const lines = content.split('\n');

/**
 * Scan backward from line i to find and parse the PHPDoc block above it.
 */
function findDocBlock(i) {
    for (let k = i - 1; k >= 0 && k >= i - 50; k--) {
        const prevLine = lines[k].trim();
        if (prevLine.startsWith('#[')) continue;
        if (prevLine === '*/') {
            for (let m = k - 1; m >= 0 && m >= k - 200; m--) {
                if (lines[m].trim() === '/**') {
                    return lines.slice(m + 1, k + 1);
                }
            }
            return null;
        }
        if (prevLine !== '' && !prevLine.startsWith('*')) return null;
    }
    return null;
}

/**
 * Collect a full multi-line PHP signature (until parens are balanced).
 */
function collectFullSignature(startLine) {
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

const classes = new Map();
let braceDepth = 0;
let currentClass = null;

for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // --- BEFORE brace counting ---

    if (!currentClass) {
        // WordPress stubs wraps everything in namespace { }, so classes are at braceDepth=1
        // (class declarations appear after the namespace { has opened to depth 1)
        const classMatch = trimmed.match(
            /^(?:#\[[^\]]*\]\s*)*(?:(?:abstract|final|readonly)\s+)*class\s+([A-Za-z_][A-Za-z0-9_]*)/,
        );
        if (classMatch) {
            const docLines = findDocBlock(i);
            const doc = docLines ? parseDocBlock(docLines) : {};

            // Build WordPress-specific doc link
            const className = classMatch[1];
            const docLink = doc.docLink || `https://developer.wordpress.org/reference/classes/${className.toLowerCase()}/`;

            currentClass = {
                name: className,
                bodyDepth: braceDepth + 1,
                description: doc.description || '',
                docLink,
                constructorParams: [],
                methods: [],
            };
        }
    }

    if (currentClass && braceDepth === currentClass.bodyDepth) {
        const methodMatch = trimmed.match(
            /^(?:(?:abstract|final|static|public|protected|private)\s+)*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
        );

        if (methodMatch) {
            const methodName = methodMatch[1];
            const isPrivate = /\bprivate\b/.test(trimmed);
            const isProtected = /\bprotected\b/.test(trimmed);

            if (!isPrivate && !isProtected) {
                const isStatic = /\bstatic\b/.test(trimmed);
                const fullSig = collectFullSignature(i);

                const rawParams = extractParamSection(fullSig);
                const paramList = parseParams(rawParams);
                const signatureReturnType = extractReturnType(fullSig);

                const docLines = findDocBlock(i);
                let description = '';
                let returnType = signatureReturnType;
                let returnDescription = '';
                let since = '';

                if (docLines) {
                    const doc = parseDocBlock(docLines);
                    description = doc.description;
                    if (!returnType) returnType = doc.returnType;
                    returnDescription = doc.returnDescription;
                    since = doc.since;

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
                    if (since) entry.since = since;
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

const classesArray = Array.from(classes.values()).sort((a, b) => a.name.localeCompare(b.name));
console.log(`   ✓ Found ${classesArray.length} WordPress classes\n`);

// Step 3: Write output
console.log('💾 Writing output file...');
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(classesArray, null, 4));
console.log(`   ✓ Written to ${path.relative(process.cwd(), OUTPUT_FILE)}\n`);

// Show sample classes
console.log('📋 Sample classes:');
['WP_Query', 'WP_Post', 'WP_Error', 'WP_User', 'Walker'].forEach((name) => {
    const cls = classesArray.find((c) => c.name === name);
    if (cls) {
        const ctorParams = cls.constructorParams.map((p) => `$${p.name}`).join(', ');
        console.log(`   - ${cls.name}(${ctorParams}) — ${cls.methods.length} methods`);
        console.log(`     ${cls.description.substring(0, 80)}`);
    }
});

console.log('\n✅ Done!');
