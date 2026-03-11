/**
 * Represents a single parameter of a PHP function or method.
 */
export interface PhpParam {
    name: string;
    type?: string;
    description?: string;
    optional: boolean;
}

/**
 * Represents a PHP function with full metadata for autocomplete,
 * hover documentation, and signature help.
 */
export interface PhpFunction {
    name: string;
    description: string;
    params: PhpParam[];
    returnType?: string;
    returnDescription?: string;
    docLink?: string;
    since?: string;
}

/**
 * Represents a single method on a PHP class.
 */
export interface PhpMethod {
    name: string;
    description: string;
    params: PhpParam[];
    returnType?: string;
    returnDescription?: string;
    docLink?: string;
    isStatic?: boolean;
    since?: string;
}

/**
 * Represents a PHP class with constructor parameters and public methods.
 */
export interface PhpClass {
    name: string;
    description: string;
    constructorParams: PhpParam[];
    methods: PhpMethod[];
    docLink?: string;
}
