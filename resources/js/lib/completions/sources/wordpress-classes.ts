import wordpressClasses from '@/data/wordpress-classes.json';
import { classRegistry } from '../class-registry';
import type { PhpClass } from '../types';

/**
 * Load WordPress class data (from wordpress-stubs) into the ClassRegistry.
 * Called once during editor setup.
 */
export function registerWordPressClassSource(): void {
    classRegistry.register('wordpress-classes', wordpressClasses as PhpClass[]);
}
