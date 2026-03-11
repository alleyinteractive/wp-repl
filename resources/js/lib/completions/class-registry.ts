import type { PhpClass } from './types';

/**
 * Registry that holds all PHP/WordPress class completion data.
 *
 * Sources are identified by a string key (e.g. 'php-classes', 'wordpress-classes')
 * and can be registered or unregistered at runtime.
 *
 * For variable type inference, the registry also exposes a method to look
 * up a class by name, which is used by the completion and signature-help
 * providers to resolve `$variable->` and `new ClassName(` patterns.
 */
class ClassRegistry {
    private sources = new Map<string, PhpClass[]>();
    private index: Map<string, PhpClass> | null = null;

    /**
     * Register a named source of class completion data.
     * If the source already exists it is replaced.
     */
    register(sourceId: string, classes: PhpClass[]): void {
        this.sources.set(sourceId, classes);
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
     * Look up a class by exact name across all registered sources.
     */
    getClass(name: string): PhpClass | undefined {
        return this.getIndex().get(name);
    }

    /**
     * Return every class from every registered source.
     */
    getAll(): PhpClass[] {
        const results: PhpClass[] = [];
        for (const classes of this.sources.values()) {
            results.push(...classes);
        }
        return results;
    }

    private getIndex(): Map<string, PhpClass> {
        if (!this.index) {
            this.index = new Map();
            for (const classes of this.sources.values()) {
                for (const cls of classes) {
                    if (!this.index.has(cls.name)) {
                        this.index.set(cls.name, cls);
                    }
                }
            }
        }
        return this.index;
    }
}

export const classRegistry = new ClassRegistry();
