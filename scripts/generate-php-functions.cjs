#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * Generate PHP native function data from JetBrains phpstorm-stubs.
 *
 * This script parses phpstorm-stubs PHP files and extracts global function
 * signatures, PHPDoc descriptions, parameter types, return types, and
 * documentation links for Monaco editor autocomplete.
 *
 * Usage:
 *   npm run generate:php-functions
 *
 * The script will:
 * 1. Clone/update the phpstorm-stubs repository
 * 2. Parse all PHP stub files for global function declarations
 * 3. Extract function names, signatures, PHPDoc comments, param types, and return info
 * 4. Generate resources/js/data/php-functions.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseDocBlock, parseParams, extractParamSection } = require('./lib/stubs-helpers.cjs');

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
            const openOnSameLine = trimmed.includes('{');
            if (openOnSameLine) {
                classDepth = braceDepth + 1;
            } else {
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
                if (classDepth !== null && braceDepth < classDepth) {
                    classDepth = null;
                }
            }
        }

        // Only look for functions when NOT inside a class
        if (classDepth !== null) continue;

        const funcMatch = trimmed.match(/^function\s+([a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*)\s*\(/);
        if (!funcMatch) continue;

        const functionName = funcMatch[1];

        // Skip PHP magic functions
        if (functionName.startsWith('__')) continue;

        // Collect the full function signature (may span multiple lines)
        let fullSignature = trimmed;
        let j = i;
        let parenDepth = (fullSignature.match(/\(/g) || []).length - (fullSignature.match(/\)/g) || []).length;
        while (parenDepth > 0 && j < Math.min(i + 20, lines.length - 1)) {
            j++;
            const nextLine = lines[j].trim();
            fullSignature += ' ' + nextLine;
            parenDepth += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
        }

        // Extract the params section from the full signature using balanced-paren helper
        const rawParams = extractParamSection(fullSignature);

        // Look backward for PHPDoc comment.
        // phpstorm-stubs uses PHP 8 attributes (#[Pure], #[LanguageLevelTypeAware], etc.)
        // between the PHPDoc closing */ and the function keyword — skip those lines.
        let docBlockLines = null;

        for (let k = i - 1; k >= 0 && k >= i - 100; k--) {
            const prevLine = lines[k].trim();

            // PHP 8 attribute — skip and keep scanning upward
            if (prevLine.startsWith('#[')) continue;

            if (prevLine === '*/') {
                // Found the closing */ of a PHPDoc block — scan backward to find the opening /**
                for (let m = k - 1; m >= 0 && m >= k - 200; m--) {
                    if (lines[m].trim() === '/**') {
                        docBlockLines = lines.slice(m + 1, k + 1);
                        break;
                    }
                }
                break;
            }

            // Stop if we hit something that's neither blank nor a comment continuation
            if (prevLine !== '' && !prevLine.startsWith('*')) {
                break;
            }
        }

        // Parse the parameter list from the function signature
        const paramList = parseParams(rawParams);

        // Parse PHPDoc block and merge type/description data into params
        let description = '';
        let returnType = '';
        let returnDescription = '';
        let docLink = '';

        if (docBlockLines) {
            const doc = parseDocBlock(docBlockLines);
            description = doc.description;
            returnType = doc.returnType;
            returnDescription = doc.returnDescription;
            docLink = doc.docLink;

            // Enrich params with type and description from PHPDoc
            for (const param of paramList) {
                const docParam = doc.paramDocs.get(param.name);
                if (docParam) {
                    if (docParam.type) param.type = docParam.type;
                    if (docParam.description) param.description = docParam.description;
                }
            }
        }

        if (!functions.has(functionName)) {
            const entry = {
                name: functionName,
                description: description || `PHP function ${functionName}`,
                params: paramList,
            };
            if (returnType) entry.returnType = returnType;
            if (returnDescription) entry.returnDescription = returnDescription;
            if (docLink) entry.docLink = docLink;
            functions.set(functionName, entry);
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
    console.log(`   - ${f.name}(${f.params.map((p) => (p.type ? `${p.type} $${p.name}` : `$${p.name}`)).join(', ')})`);
    if (f.returnType) console.log(`     returns: ${f.returnType}`);
    console.log(`     ${f.description.substring(0, 80)}`);
});

console.log('\n✅ Done!');
