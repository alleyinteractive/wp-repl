#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * Generate WordPress functions data from wordpress-stubs
 *
 * This script parses the wordpress-stubs.php file from php-stubs/wordpress-stubs
 * and extracts function signatures, descriptions, and generates completion data
 * for Monaco editor autocomplete.
 *
 * Usage:
 *   npm run generate:wordpress-functions
 *
 * The script will:
 * 1. Clone/update the wordpress-stubs repository
 * 2. Parse the wordpress-stubs.php file
 * 3. Extract function names, signatures, and PHPDoc comments
 * 4. Generate resources/js/data/wordpress-functions.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Look for PHPDoc comments followed by function declarations
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a function declaration at the top level (4 spaces indentation)
    const functionMatch = line.match(/^\s{4}function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/);

    if (functionMatch) {
        const functionName = functionMatch[1];
        const params = functionMatch[2];

        // Skip magic methods
        if (functionName.startsWith('__')) continue;

        // Look backward for PHPDoc comment
        let shortDescription = '';
        let since = '';

        for (let j = i - 1; j >= 0 && j >= i - 100; j--) {
            const prevLine = lines[j].trim();

            if (prevLine === '/**') {
                // Found start of PHPDoc, extract short description and @since
                for (let k = j + 1; k < i; k++) {
                    const docLine = lines[k].trim();

                    // Extract short description (first non-empty line after /**)
                    if (docLine.startsWith('*') && !docLine.startsWith('* @') && !shortDescription) {
                        const text = docLine.replace(/^\*\s*/, '');
                        if (text) {
                            shortDescription = text;
                        }
                    }

                    // Extract @since version
                    const sinceMatch = docLine.match(/^\*\s*@since\s+([\d.]+)/);
                    if (sinceMatch && !since) {
                        since = sinceMatch[1];
                    }
                }
                break;
            }

            if (!prevLine.startsWith('*') && prevLine !== '') {
                // Not part of a doc comment
                break;
            }
        }

        // Parse parameters
        const paramList = params
            .split(',')
            .map((p) => {
                const trimmed = p.trim();
                if (!trimmed) return null;

                const paramMatch = trimmed.match(/\$([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (paramMatch) {
                    const paramName = paramMatch[1];
                    const hasDefault = trimmed.includes('=');
                    return { name: paramName, optional: hasDefault };
                }
                return null;
            })
            .filter(Boolean);

        // Build signature for snippet
        // Note: We don't include $ in the placeholder text to avoid Monaco treating it as a variable
        const signature = paramList
            .map((p, idx) => {
                return `\${${idx + 1}:${p.name}}`;
            })
            .join(', ');

        // Store function info (deduplicate by keeping first occurrence)
        if (!functions.has(functionName)) {
            functions.set(functionName, {
                name: functionName,
                signature: signature,
                description: shortDescription || `WordPress function ${functionName}`,
                params: paramList,
                since: since || null,
            });
        }
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
functionsArray.slice(0, 5).forEach((f) => {
    console.log(`   - ${f.name}${f.since ? ` (since ${f.since})` : ''}`);
    console.log(`     ${f.description}`);
});

console.log('\n✅ Done!');
