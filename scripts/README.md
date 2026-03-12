# Autocomplete Data Generators

These scripts generate autocomplete data for the Monaco PHP editor by parsing official PHP and WordPress stub files.

## Scripts

### `generate:php-functions`

Generates native PHP function data from [JetBrains/phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs).

```bash
npm run generate:php-functions
```

### `generate:php-classes`

Generates native PHP class data (including constructors and methods) from [JetBrains/phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs).

```bash
npm run generate:php-classes
```

### `generate:wordpress-functions`

Generates WordPress core function data from [php-stubs/wordpress-stubs](https://github.com/php-stubs/wordpress-stubs).

```bash
npm run generate:wordpress-functions
```

### `generate:wordpress-classes`

Generates WordPress core class data (including constructors and methods) from [php-stubs/wordpress-stubs](https://github.com/php-stubs/wordpress-stubs).

```bash
npm run generate:wordpress-classes
```

### Run all at once

```bash
npm run generate
```

The `npm run build` command automatically runs all generators before bundling.

## What's Generated

All scripts output JSON files to `resources/js/data/` (git-ignored, regenerated at build time).
This means **no internet access is required** after the first run — the `.tmp/` cache is reused.

### Function schema

Each function entry (`php-functions.json`, `wordpress-functions.json`):

| Field               | Type         | Description                           |
| ------------------- | ------------ | ------------------------------------- |
| `name`              | `string`     | Function name, e.g. `array_map`       |
| `description`       | `string`     | Short description from PHPDoc         |
| `params`            | `PhpParam[]` | Parameter list (see below)            |
| `returnType`        | `string?`    | PHP return type, e.g. `string\|false` |
| `returnDescription` | `string?`    | Return value description              |
| `docLink`           | `string?`    | URL to official docs                  |
| `since`             | `string?`    | WordPress version _(WP only)_         |

### Class schema

Each class entry (`php-classes.json`, `wordpress-classes.json`):

| Field               | Type          | Description                      |
| ------------------- | ------------- | -------------------------------- |
| `name`              | `string`      | Class name, e.g. `DOMDocument`   |
| `description`       | `string`      | Short description from PHPDoc    |
| `constructorParams` | `PhpParam[]`  | `__construct` parameters         |
| `methods`           | `PhpMethod[]` | Public instance + static methods |
| `docLink`           | `string?`     | URL to official docs             |

### PhpParam schema

| Field         | Type      | Description                           |
| ------------- | --------- | ------------------------------------- |
| `name`        | `string`  | Parameter name (without `$`)          |
| `type`        | `string?` | PHP type, e.g. `string`, `int\|false` |
| `description` | `string?` | Parameter description                 |
| `optional`    | `boolean` | Whether the param has a default value |

### PhpMethod schema

| Field               | Type         | Description                  |
| ------------------- | ------------ | ---------------------------- |
| `name`              | `string`     | Method name                  |
| `description`       | `string`     | Short description            |
| `params`            | `PhpParam[]` | Parameter list               |
| `returnType`        | `string?`    | Return type                  |
| `returnDescription` | `string?`    | Return value description     |
| `docLink`           | `string?`    | URL to official docs         |
| `isStatic`          | `boolean?`   | Whether it's a static method |

## Example Output

```json
{
    "name": "DOMDocument",
    "description": "The DOMDocument class represents an entire HTML or XML document.",
    "constructorParams": [
        { "name": "version", "type": "string", "optional": true },
        { "name": "encoding", "type": "string", "optional": true }
    ],
    "methods": [
        {
            "name": "createElement",
            "description": "Create new element node",
            "params": [
                { "name": "localName", "type": "string", "optional": false },
                { "name": "value", "type": "string", "optional": true }
            ],
            "returnType": "DOMElement|false",
            "docLink": "https://php.net/manual/en/domdocument.createelement.php"
        }
    ],
    "docLink": "https://php.net/manual/en/class.domdocument.php"
}
```

## When to Regenerate

Regenerate the data files when:

- A new major PHP or WordPress version is released
- The upstream stub repositories are updated

The `.tmp/` directory is git-ignored and used as a local cache for subsequent runs.

## Architecture

The generated JSON files feed into the completions system at `resources/js/lib/completions/`.

### TypeScript types

- `completions/types.ts` — `PhpFunction`, `PhpParam`, `PhpClass`, `PhpMethod` interfaces

### Registries

- `completions/registry.ts` — `CompletionRegistry` singleton for functions
- `completions/class-registry.ts` — `ClassRegistry` singleton for classes

### Data sources

- `completions/sources/php.ts` — loads `php-functions.json`
- `completions/sources/wordpress.ts` — loads `wordpress-functions.json`
- `completions/sources/php-classes.ts` — loads `php-classes.json`
- `completions/sources/wordpress-classes.ts` — loads `wordpress-classes.json`

### Monaco providers

- `completions/providers/completion.ts` — function autocomplete popup
- `completions/providers/class-completion.ts` — class / method autocomplete (`new`, `->`, `::`)
- `completions/providers/hover.ts` — hover docs for functions, classes, and methods
- `completions/providers/signature-help.ts` — inline parameter hints for functions, constructors, and methods

### Entry point

- `completions/index.ts` — `setupCompletions(monaco)` called from `editor.tsx`

## Extending at runtime

To add completions for a Composer library:

```typescript
import { completionRegistry, classRegistry } from '@/lib/completions';

// Add functions
completionRegistry.register('vendor/package', packageFunctions);

// Add classes
classRegistry.register('vendor/package', packageClasses);
```

## Shared parsing helpers

`scripts/lib/stubs-helpers.cjs` contains utilities shared across all generators:

- `stripHtml(text)` — strips HTML tags and decodes entities from PHPDoc
- `parseDocBlock(lines)` — parses a `/** ... */` block into structured fields
- `parseParams(rawParams)` — splits a PHP parameter list string into objects
- `extractParamSection(signature)` — balanced-parenthesis extraction of the param section
- `extractReturnType(signature)` — extracts `: ReturnType` from after the closing `)`
