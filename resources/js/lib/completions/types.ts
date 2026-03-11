/**
 * Represents a single parameter of a PHP function.
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
