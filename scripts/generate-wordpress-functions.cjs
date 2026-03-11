#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * Generate WordPress functions data from wordpress-stubs
 *
 * This script parses the wordpress-stubs.php file from php-stubs/wordpress-stubs
 * and extracts function signatures, descriptions, parameter types, return types,
 * and documentation links for Monaco editor autocomplete.
 *
 * Usage:
 *   npm run generate:wordpress-functions
 *
 * The script will:
 * 1. Clone/update the wordpress-stubs repository
 * 2. Parse the wordpress-stubs.php file
 * 3. Extract function names, signatures, PHPDoc comments, param types, and return info
 * 4. Generate resources/js/data/wordpress-functions.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { stripHtml, parseDocBlock, extractParamSection } = require('./lib/stubs-helpers.cjs');

const STUBS_REPO = 'https://github.com/php-stubs/wordpress-stubs.git';
const TEMP_DIR = path.join(__dirname, '../.tmp/wordpress-stubs');
const OUTPUT_FILE = path.join(__dirname, '../resources/js/data/wordpress-functions.json');

console.log('🔧 WordPress Functions Generator\n');

// Step 1: Clone or update wordpress-stubs repository
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
const stubsPath = path.join(TEMP_DIR, 'wordpress-stubs.php');
const stubsContent = fs.readFileSync(stubsPath, 'utf-8');
const lines = stubsContent.split('\n');

const functions = new Map();

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a function declaration at the top level (4-space indentation)
    const functionStartMatch = line.match(/^\s{4}function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (!functionStartMatch) continue;

    const functionName = functionStartMatch[1];

    // Skip magic methods
    if (functionName.startsWith('__')) continue;

    // Collect the full function signature (may span multiple lines)
    let fullLine = line.trim();
    let j = i;
    let parenDepth = (fullLine.match(/\(/g) || []).length - (fullLine.match(/\)/g) || []).length;
    while (parenDepth > 0 && j < Math.min(i + 20, lines.length - 1)) {
        j++;
        const nextLine = lines[j].trim();
        fullLine += ' ' + nextLine;
        parenDepth += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
    }

    // Extract param string using balanced-paren helper
    const rawParams = extractParamSection(fullLine);

    // Look backward for PHPDoc comment
    let docBlockLines = null;
    for (let k = i - 1; k >= 0 && k >= i - 100; k--) {
        const prevLine = lines[k].trim();
        if (prevLine === '*/') {
            for (let m = k - 1; m >= 0 && m >= k - 200; m--) {
                if (lines[m].trim() === '/**') {
                    docBlockLines = lines.slice(m + 1, k + 1);
                    break;
                }
            }
            break;
        }
        if (!prevLine.startsWith('*') && prevLine !== '') break;
    }

    // Parse parameter list from function signature
    const paramList = rawParams
        .split(',')
        .map((p) => {
            const trimmed = p.trim();
            if (!trimmed) return null;
            const paramMatch = trimmed.match(/\$([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (!paramMatch) return null;
            return { name: paramMatch[1], optional: trimmed.includes('=') };
        })
        .filter(Boolean);

    // Parse PHPDoc and merge into param list
    let description = '';
    let returnType = '';
    let returnDescription = '';
    let since = '';

    if (docBlockLines) {
        const doc = parseDocBlock(docBlockLines);
        description = doc.description;
        returnType = doc.returnType;
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

    if (!functions.has(functionName)) {
        const entry = {
            name: functionName,
            description: description || `WordPress function ${functionName}`,
            params: paramList,
            docLink: `https://developer.wordpress.org/reference/functions/${functionName}/`,
        };
        if (returnType) entry.returnType = returnType;
        if (returnDescription) entry.returnDescription = returnDescription;
        if (since) entry.since = since;
        functions.set(functionName, entry);
    }
}

const functionsArray = Array.from(functions.values()).sort((a, b) => a.name.localeCompare(b.name));

console.log(`   ✓ Found ${functionsArray.length} unique WordPress functions\n`);

// Step 3: Write output file
console.log('💾 Writing output file...');
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(functionsArray, null, 4));
console.log(`   ✓ Written to ${path.relative(process.cwd(), OUTPUT_FILE)}\n`);

// Show some sample functions
console.log('📋 Sample functions:');
const samples = ['get_option', 'wp_insert_post', 'add_action', 'the_title', 'get_permalink'];
functionsArray
    .filter((f) => samples.includes(f.name))
    .forEach((f) => {
        console.log(
            `   - ${f.name}(${f.params.map((p) => (p.type ? `${p.type} $${p.name}` : `$${p.name}`)).join(', ')})${f.returnType ? ': ' + f.returnType : ''}`,
        );
        console.log(`     ${f.description.substring(0, 80)}`);
    });

console.log('\n✅ Done!');
