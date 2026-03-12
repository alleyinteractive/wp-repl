import phpClasses from '@/data/php-classes.json';
import { classRegistry } from '../class-registry';
import type { PhpClass } from '../types';

/**
 * Load PHP native class data (from phpstorm-stubs) into the ClassRegistry.
 * Called once during editor setup.
 */
export function registerPhpClassSource(): void {
    classRegistry.register('php-classes', phpClasses as PhpClass[]);
}
