# Autocomplete Data Generators

These scripts generate autocomplete data for the Monaco PHP editor by parsing official PHP and WordPress stub files.

## Scripts

### `generate:php-functions`

Generates native PHP function data from [JetBrains/phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs).

```bash
npm run generate:php-functions
```

### `generate:wordpress-functions`

Generates WordPress core function data from [php-stubs/wordpress-stubs](https://github.com/php-stubs/wordpress-stubs).

```bash
npm run generate:wordpress-functions
```

## What's Generated

Both scripts output JSON files to `resources/js/data/` that are committed to git.
This means **no internet access is required** when running `npm run build` in CI.

Each function entry contains:

- **name**: Function name (e.g., `get_option`, `array_map`)
- **description**: Short description from PHPDoc
- **params**: Array of parameter objects:
  - `name` — parameter name (without `$`)
  - `type` — PHP type (e.g., `string`, `int|false`, `callable|null`) — from `@param`
  - `description` — parameter description — from `@param`
  - `optional` — whether the parameter has a default value
- **returnType**: Return type (e.g., `mixed`, `string|false`) — from `@return`
- **returnDescription**: Return value description — from `@return`
- **docLink**: URL to official documentation
- **since** *(WordPress only)*: WordPress version when function was introduced

## Example Output

```json
{
    "name": "get_option",
    "description": "Retrieves an option value based on an option name.",
    "params": [
        {
            "name": "option",
            "type": "string",
            "description": "Name of the option to retrieve.",
            "optional": false
        },
        {
            "name": "default_value",
            "type": "mixed",
            "description": "Default value to return if the option does not exist.",
            "optional": true
        }
    ],
    "returnType": "mixed",
    "returnDescription": "Value of the option.",
    "docLink": "https://developer.wordpress.org/reference/functions/get_option/",
    "since": "1.5.0"
}
```

## When to Regenerate

Regenerate the data files when:
- A new major PHP or WordPress version is released
- The upstream stub repositories are updated with new or changed functions

The `.tmp/` directory is git-ignored and used as a local cache for subsequent runs.

## Architecture

The generated JSON files feed into the completions system at `resources/js/lib/completions/`.

- `completions/types.ts` — `PhpFunction` / `PhpParam` TypeScript interfaces
- `completions/registry.ts` — `CompletionRegistry` singleton; call `register(sourceId, fns)` to add data
- `completions/sources/php.ts` — loads `php-functions.json` into the registry
- `completions/sources/wordpress.ts` — loads `wordpress-functions.json` into the registry
- `completions/providers/` — Monaco `CompletionItemProvider`, `HoverProvider`, `SignatureHelpProvider`
- `completions/index.ts` — `setupCompletions(monaco)` entry point called from `editor.tsx`

To add completions for a Composer library at runtime:

```typescript
import { completionRegistry } from '@/lib/completions';
completionRegistry.register('vendor/package', packageFunctions);
```

