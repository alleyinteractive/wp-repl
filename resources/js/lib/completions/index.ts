import type * as Monaco from 'monaco-editor';

import { registerCompletionProvider } from './providers/completion';
import { registerHoverProvider } from './providers/hover';
import { registerSignatureHelpProvider } from './providers/signature-help';
import { registerPhpSource } from './sources/php';
import { registerWordPressSource } from './sources/wordpress';

/**
 * Set up all Monaco editor completions for the PHP language.
 *
 * Call this once in the editor's `beforeMount` hook. It:
 *   1. Loads PHP native function data into the CompletionRegistry.
 *   2. Loads WordPress function data into the CompletionRegistry.
 *   3. Registers a CompletionItemProvider (autocomplete popup).
 *   4. Registers a HoverProvider (hover documentation).
 *   5. Registers a SignatureHelpProvider (inline parameter hints).
 *
 * To add completions for a Composer library at runtime:
 *   import { completionRegistry } from '@/lib/completions/registry';
 *   completionRegistry.register('vendor/package', packageFunctions);
 */
export function setupCompletions(monaco: typeof Monaco): void {
    registerPhpSource();
    registerWordPressSource();

    registerCompletionProvider(monaco);
    registerHoverProvider(monaco);
    registerSignatureHelpProvider(monaco);
}

export { completionRegistry } from './registry';
export type { PhpFunction, PhpParam } from './types';
