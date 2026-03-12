import type * as Monaco from 'monaco-editor';

import { registerClassCompletionProvider } from './providers/class-completion';
import { registerCompletionProvider } from './providers/completion';
import { registerHoverProvider } from './providers/hover';
import { registerSignatureHelpProvider } from './providers/signature-help';
import { registerPhpSource } from './sources/php';
import { registerPhpClassSource } from './sources/php-classes';
import { registerWordPressSource } from './sources/wordpress';
import { registerWordPressClassSource } from './sources/wordpress-classes';

/**
 * Set up all Monaco editor completions for the PHP language.
 *
 * Call this once in the editor's `beforeMount` hook. It:
 *   1. Loads PHP native function data into the CompletionRegistry.
 *   2. Loads WordPress function data into the CompletionRegistry.
 *   3. Loads PHP native class data into the ClassRegistry.
 *   4. Loads WordPress class data into the ClassRegistry.
 *   5. Registers a CompletionItemProvider (function autocomplete popup).
 *   6. Registers class completion providers (new / -> / :: autocomplete).
 *   7. Registers a HoverProvider (hover documentation).
 *   8. Registers a SignatureHelpProvider (inline parameter hints).
 *
 * To add completions for a Composer library at runtime:
 *   import { completionRegistry } from '@/lib/completions/registry';
 *   completionRegistry.register('vendor/package', packageFunctions);
 *
 * To add class completions for a library at runtime:
 *   import { classRegistry } from '@/lib/completions/class-registry';
 *   classRegistry.register('vendor/package', packageClasses);
 */
export function setupCompletions(monaco: typeof Monaco): void {
    // Load data sources
    registerPhpSource();
    registerWordPressSource();
    registerPhpClassSource();
    registerWordPressClassSource();

    // Register Monaco providers
    registerCompletionProvider(monaco);
    registerClassCompletionProvider(monaco);
    registerHoverProvider(monaco);
    registerSignatureHelpProvider(monaco);
}

export { classRegistry } from './class-registry';
export { completionRegistry } from './registry';
export type { PhpClass, PhpFunction, PhpMethod, PhpParam } from './types';
