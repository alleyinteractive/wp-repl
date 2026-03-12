import type { PhpFunction } from './types';

/**
 * Registry that holds all PHP/WordPress function completion data.
 *
 * Sources are identified by a string key (e.g. 'php', 'wordpress',
 * 'vendor/package') and can be registered or unregistered at runtime,
 * enabling future Composer library completions without provider changes.
 */
class CompletionRegistry {
    private sources = new Map<string, PhpFunction[]>();
    private index: Map<string, PhpFunction> | null = null;

    /**
     * Register a named source of function completion data.
     * If the source already exists it is replaced.
     */
    register(sourceId: string, functions: PhpFunction[]): void {
        this.sources.set(sourceId, functions);
        this.index = null;
    }

    /**
     * Remove a previously registered source.
     */
    unregister(sourceId: string): void {
        this.sources.delete(sourceId);
        this.index = null;
    }

    /**
     * Look up a function by exact name across all registered sources.
     * Earlier-registered sources take precedence on name collisions.
     */
    getFunction(name: string): PhpFunction | undefined {
        return this.getIndex().get(name);
    }

    /**
     * Return every function from every registered source.
     */
    getAll(): PhpFunction[] {
        const results: PhpFunction[] = [];
        for (const fns of this.sources.values()) {
            results.push(...fns);
        }
        return results;
    }

    private getIndex(): Map<string, PhpFunction> {
        if (!this.index) {
            this.index = new Map();
            for (const fns of this.sources.values()) {
                for (const fn of fns) {
                    if (!this.index.has(fn.name)) {
                        this.index.set(fn.name, fn);
                    }
                }
            }
        }
        return this.index;
    }
}

export const completionRegistry = new CompletionRegistry();
