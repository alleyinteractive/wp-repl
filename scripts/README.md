# WordPress Functions Generator

This script generates autocomplete data for WordPress core functions by parsing the official [php-stubs/wordpress-stubs](https://github.com/php-stubs/wordpress-stubs) repository.

## Usage

To regenerate the WordPress functions data file:

```bash
npm run generate:wordpress-functions
```

This will:
1. Clone or update the wordpress-stubs repository to `.tmp/wordpress-stubs`
2. Parse `wordpress-stubs.php` to extract function signatures and PHPDoc comments
3. Generate `resources/js/data/wordpress-functions.json` with ~3,900 WordPress functions

## When to Regenerate

You should regenerate the functions data when:
- A new major WordPress version is released
- You want to update the autocomplete with the latest WordPress functions
- The wordpress-stubs repository has been updated with new functions

## What's Generated

The generated JSON file contains:
- **name**: Function name (e.g., `get_option`)
- **signature**: Parameter snippet with placeholders (e.g., `${1:$option}, ${2:$default_value}`)
- **description**: Short description from PHPDoc
- **params**: Array of parameter objects with `name` and `optional` fields
- **since**: WordPress version when function was introduced (e.g., `2.1.0`)

## Example Output

```json
{
  "name": "get_option",
  "signature": "${1:$option}, ${2:$default_value}",
  "description": "Retrieves an option value based on an option name.",
  "params": [
    { "name": "option", "optional": false },
    { "name": "default_value", "optional": true }
  ],
  "since": "1.5.0"
}
```

## Maintenance

The script is designed to be:
- **Self-contained**: No external dependencies beyond Node.js built-ins
- **Idempotent**: Safe to run multiple times
- **Fast**: Uses shallow clone for quick updates

The `.tmp/wordpress-stubs` directory is git-ignored and used as a cache for subsequent runs.
